import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { MovementType, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import {
  CreateProductDTO,
  ProductQueryDTO,
  UpdateProductDTO,
} from './product.dto';
import { skuPrefix } from 'src/utils/sku.util';

const include = {
  supplier: { select: { id: true, name: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private rethrowUnique(e: unknown): never {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      throw new ConflictException(
        'That SKU is already used by another product.',
      );
    }
    throw e;
  }

  async findMany(organizationId: string, ProductQuery: ProductQueryDTO) {
    const where: Prisma.ProductWhereInput = {
      organizationId,
      archivedAt: ProductQuery.archived ? { not: null } : null,
      ...(ProductQuery.search && {
        name: { contains: ProductQuery.search, mode: 'insensitive' },
      }),
      ...(ProductQuery.supplierId && {
        supplierId:
          ProductQuery.supplierId === 'none' ? null : ProductQuery.supplierId,
      }),
      ...(ProductQuery.lowStock && {
        stock: { lte: this.prisma.product.fields.lowStockThreshold },
      }),
      ...(ProductQuery.search && {
        OR: [
          { name: { contains: ProductQuery.search, mode: 'insensitive' } },
          { sku: { contains: ProductQuery.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include,
        orderBy: { name: 'asc' },
        skip: (ProductQuery.page - 1) * ProductQuery.pageSize,
        take: ProductQuery.pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total };
  }

  private async assertSupplier(
    supplierId: string | null | undefined,
    organizationId: string,
  ) {
    if (!supplierId) return;
    const found = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId },
      select: { id: true },
    });
    if (!found) throw new BadRequestException('Supplier not found.');
  }

  async suggestSku(organizationId: string, name: string) {
    const prefix = skuPrefix(name.slice(0, 120));

    const rows = await this.prisma.product.findMany({
      where: { organizationId, sku: { startsWith: `${prefix}-` } },
      select: { sku: true },
    });

    console.log('suggestSku rows', rows);

    const pattern = new RegExp(`^${prefix}-(\\d+)$`);
    const max = rows.reduce((highest, row) => {
      const hit = row.sku ? pattern.exec(row.sku) : null;
      return hit ? Math.max(highest, Number(hit[1])) : highest;
    }, 0);

    return `${prefix}-${String(max + 1).padStart(4, '0')}`;
  }

  async create(organizationId: string, userId: string, dto: CreateProductDTO) {
    await this.assertSupplier(dto.supplierId, organizationId);
    const initial = dto.initialStock ?? 0;

    try {
      return this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name: dto.name,
            description: dto.description ?? null,
            sku: dto.sku ?? null,
            price: dto.price,
            stock: initial,
            lowStockThreshold: dto.lowStockThreshold ?? 5,
            supplierId: dto.supplierId ?? null,
            organizationId,
          },
          include,
        });

        if (initial > 0) {
          await tx.stockMovement.create({
            data: {
              type: MovementType.INITIAL,
              delta: initial,
              stockAfter: initial,
              reason: 'Initial stock',
              organizationId,
              productId: product.id,
              performedById: userId,
            },
          });
        }
        return product;
      });
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async update(id: string, organizationId: string, dto: UpdateProductDTO) {
    await this.assertSupplier(dto.supplierId, organizationId);
    try {
      const { count } = await this.prisma.product.updateMany({
        where: { id, organizationId },
        data: dto,
      });
      if (count === 0) throw new NotFoundException('Product not found.');
    } catch (error) {
      this.rethrowUnique(error);
    }
    return this.prisma.product.findFirstOrThrow({
      where: { id, organizationId },
      include,
    });
  }

  async setArchived(id: string, organizationId: string, archived: boolean) {
    const { count } = await this.prisma.product.updateMany({
      where: { id, organizationId },
      data: { archivedAt: archived ? new Date() : null },
    });
    if (count === 0) throw new NotFoundException('Product not found.');
  }

  options(organizationId: string) {
    return this.prisma.product.findMany({
      where: { organizationId, archivedAt: null },
      select: { id: true, name: true, stock: true },
      orderBy: { name: 'asc' },
    });
  }

  async detail(id: string, organizationId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId },
      include,
    });
    if (!product) throw new NotFoundException('Product not found.');

    const where = { productId: id, organizationId };
    const [inAgg, outAgg, movementCount, recent] = await Promise.all([
      this.prisma.stockMovement.aggregate({
        where: { ...where, delta: { gt: 0 } },
        _sum: { delta: true },
      }),
      this.prisma.stockMovement.aggregate({
        where: { ...where, delta: { lt: 0 } },
        _sum: { delta: true },
      }),
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        select: { createdAt: true, stockAfter: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    return {
      product,
      totalIn: inAgg._sum.delta ?? 0,
      totalOut: -(outAgg._sum.delta ?? 0),
      movementCount,
      trend: recent.reverse(), // oldest first, for the chart
    };
  }

  private buildWhere(
    organizationId: string,
    q: ProductQueryDTO,
  ): Prisma.ProductWhereInput {
    return {
      organizationId,
      archivedAt: q.archived ? { not: null } : null,
      ...(q.search && {
        OR: [
          { name: { contains: q.search, mode: 'insensitive' } },
          { sku: { contains: q.search, mode: 'insensitive' } },
        ],
      }),
      ...(q.supplierId && {
        supplierId: q.supplierId === 'none' ? null : q.supplierId,
      }),
      ...(q.lowStock && {
        stock: { lte: this.prisma.product.fields.lowStockThreshold },
      }),
    };
  }

  countForExport(organizationId: string, q: ProductQueryDTO) {
    return this.prisma.product.count({
      where: this.buildWhere(organizationId, q),
    });
  }

  // batches of 500 so memory stays flat however many products there are
  async *iterateForExport(organizationId: string, q: ProductQueryDTO) {
    const where = this.buildWhere(organizationId, q);
    let cursor: string | undefined;
    while (true) {
      const batch = await this.prisma.product.findMany({
        where,
        include: { supplier: { select: { name: true } } },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        take: 500,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
      });
      if (batch.length === 0) return;
      yield batch;
      if (batch.length < 500) return;
      cursor = batch[batch.length - 1].id;
    }
  }
}
