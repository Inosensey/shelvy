import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { ApplyMovementInput } from 'src/types/stockMovement';
import { MovementQueryDTO, RecordMovementDTO } from './stockMovement.dto';

@Injectable()
export class StockMovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(
    organizationId: string,
    queryParams: MovementQueryDTO,
  ): Prisma.StockMovementWhereInput {
    return {
      organizationId,
      ...(queryParams.productId && { productId: queryParams.productId }),
      ...(queryParams.type && { type: queryParams.type }),
      ...((queryParams.from || queryParams.to) && {
        createdAt: {
          ...(queryParams.from && {
            gte: new Date(`${queryParams.from.slice(0, 10)}T00:00:00.000Z`),
          }),
          ...(queryParams.to && {
            lte: new Date(`${queryParams.to.slice(0, 10)}T23:59:59.999Z`),
          }),
        },
      }),
    };
  }

  countForExport(organizationId: string, queryParams: MovementQueryDTO) {
    return this.prisma.stockMovement.count({
      where: this.buildWhere(organizationId, queryParams),
    });
  }

  async applyMovement(tx: Prisma.TransactionClient, input: ApplyMovementInput) {
    const {
      organizationId,
      productId,
      performedById,
      type,
      delta,
      reason,
      note,
    } = input;
    if (delta === 0) throw new BadRequestException('Quantity cannot be zero.');

    // One atomic statement: the stock >= guard and the increment can't be raced.
    const { count } = await tx.product.updateMany({
      where: {
        id: productId,
        organizationId,
        archivedAt: null,
        ...(delta < 0 && { stock: { gte: -delta } }),
      },
      data: { stock: { increment: delta } },
    });

    if (count === 0) {
      const p = await tx.product.findFirst({
        where: { id: productId, organizationId },
        select: { archivedAt: true, stock: true },
      });
      if (!p) throw new NotFoundException('Product not found.');
      if (p.archivedAt)
        throw new BadRequestException(
          'This product is archived. Restore it first.',
        );
      throw new BadRequestException(
        `Not enough stock. Only ${p.stock} available.`,
      );
    }

    // Same transaction, so this reads our own update (the row stays locked until commit).
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
    });

    const movement = await tx.stockMovement.create({
      data: {
        type,
        delta,
        stockAfter: product.stock,
        reason,
        note,
        organizationId,
        productId,
        performedById,
      },
      include: {
        product: { select: { id: true, name: true } },
        performedBy: { select: { id: true, email: true } },
      },
    });

    return { movement, product, previousStock: product.stock - delta };
  }

  async list(organizationId: string, queryParams: MovementQueryDTO) {
    const where: Prisma.StockMovementWhereInput = {
      organizationId,
      ...(queryParams.productId && { productId: queryParams.productId }),
      ...(queryParams.type && { type: queryParams.type }),
      ...((queryParams.from || queryParams.to) && {
        createdAt: {
          ...(queryParams.from && {
            gte: new Date(`${queryParams.from.slice(0, 10)}T00:00:00.000Z`),
          }),
          ...(queryParams.to && {
            lte: new Date(`${queryParams.to.slice(0, 10)}T23:59:59.999Z`),
          }),
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true } },
          performedBy: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (queryParams.page - 1) * queryParams.pageSize,
        take: queryParams.pageSize,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return {
      items,
      total,
      page: queryParams.page,
      pageSize: queryParams.pageSize,
    };
  }

  async record(
    organizationId: string,
    userId: string,
    dto: RecordMovementDTO,
    delta: number,
  ) {
    const { movement, product, previousStock } = await this.prisma.$transaction(
      (tx) =>
        this.applyMovement(tx, {
          organizationId,
          productId: dto.productId,
          performedById: userId,
          type: dto.type,
          delta,
          reason: dto.reason,
          note: dto.note,
        }),
    );

    return { movement, product, previousStock };
  }

  async pageOf(organizationId: string, id: string, pageSize: number) {
    const movement = await this.prisma.stockMovement.findFirst({
      where: { id, organizationId },
      select: { createdAt: true },
    });
    if (!movement) throw new NotFoundException('Movement not found.');

    const newer = await this.prisma.stockMovement.count({
      where: { organizationId, createdAt: { gt: movement.createdAt } },
    });
    return Math.floor(newer / pageSize) + 1;
  }

  async *iterateForExport(
    organizationId: string,
    queryParams: MovementQueryDTO,
  ) {
    const where = this.buildWhere(organizationId, queryParams);
    let cursor: string | undefined;
    while (true) {
      const batch = await this.prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          performedBy: { select: { email: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
