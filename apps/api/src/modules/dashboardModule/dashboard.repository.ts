import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/PrismaConfig/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  private lowStockWhere(organizationId: string): Prisma.ProductWhereInput {
    return {
      organizationId,
      archivedAt: null,
      stock: { lte: this.prisma.product.fields.lowStockThreshold },
    };
  }

  async activeProductCount(organizationId: string) {
    return this.prisma.product.count({
      where: { organizationId, archivedAt: null },
    });
  }

  async stockTotals(organizationId: string) {
    const [row] = await this.prisma.$queryRaw<
      { units: number; value: number }[]
    >(Prisma.sql`
      SELECT COALESCE(SUM(stock), 0)::int AS units,
             COALESCE(SUM(stock * price), 0)::float8 AS value
      FROM products
      WHERE organization_id = ${organizationId} AND archived_at IS NULL
    `);
    return row;
  }

  lowStockCount(organizationId: string) {
    return this.prisma.product.count({
      where: this.lowStockWhere(organizationId),
    });
  }

  lowStockItems(organizationId: string, take = 5) {
    return this.prisma.product.findMany({
      where: this.lowStockWhere(organizationId),
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
      orderBy: [{ stock: 'asc' }, { name: 'asc' }],
      take,
    });
  }

  recentMovements(organizationId: string, take = 8) {
    return this.prisma.stockMovement.findMany({
      where: { organizationId },
      include: {
        product: { select: { id: true, name: true } },
        performedBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  // staff see only their own pending requests
  pendingRequests(organizationId: string, requestedById?: string) {
    return this.prisma.stockMovementRequest.count({
      where: {
        organizationId,
        status: 'PENDING',
        ...(requestedById && { requestedById }),
      },
    });
  }

  // created_at is stored as UTC without a zone, so convert UTC -> Manila before taking the day
  activity(organizationId: string, since: Date) {
    return this.prisma.$queryRaw<
      { day: string; in_units: number; out_units: number }[]
    >(Prisma.sql`
      SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Manila'), 'YYYY-MM-DD') AS day,
             COALESCE(SUM(CASE WHEN delta > 0 THEN delta END), 0)::int AS in_units,
             COALESCE(SUM(CASE WHEN delta < 0 THEN -delta END), 0)::int AS out_units
      FROM stock_movements
      WHERE organization_id = ${organizationId}
        AND created_at >= ${since}
        AND type <> 'INITIAL'
      GROUP BY 1
      ORDER BY 1
    `);
  }
}
