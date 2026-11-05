import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { CreateSupplierDTO, UpdateSupplierDTO } from './supplier.dto';

@Injectable()
export class SupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    organizationId: string,
    q: { search?: string; page: number; pageSize: number },
  ) {
    const where: Prisma.SupplierWhereInput = {
      organizationId,
      ...(q.search
        ? { name: { contains: q.search, mode: 'insensitive' } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          _count: { select: { products: { where: { archivedAt: null } } } },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return { items, total };
  }

  options(organizationId: string) {
    return this.prisma.supplier.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  create(organizationId: string, data: CreateSupplierDTO) {
    return this.prisma.supplier.create({ data: { ...data, organizationId } });
  }

  // updateMany/deleteMany with organizationId in the where: another org's id simply matches nothing
  async update(id: string, organizationId: string, data: UpdateSupplierDTO) {
    const result = await this.prisma.supplier.updateMany({
      where: { id, organizationId },
      data,
    });
    if (result.count === 0) throw new NotFoundException('Supplier not found.');
    return this.prisma.supplier.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: string, organizationId: string) {
    const result = await this.prisma.supplier.deleteMany({
      where: { id, organizationId },
    });
    if (result.count === 0) throw new NotFoundException('Supplier not found.');
    return id;
  }
}
