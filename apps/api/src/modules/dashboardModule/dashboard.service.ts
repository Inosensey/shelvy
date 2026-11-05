import { Injectable } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { DashboardRepository } from './dashboard.repository';

const DAYS = 14;

@Injectable()
export class DashboardService {
  constructor(private readonly repo: DashboardRepository) {}

  // last n calendar days in Manila time, oldest first, as YYYY-MM-DD
  private lastDays(n: number): string[] {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return Array.from({ length: n }, (_, i) =>
      fmt.format(new Date(Date.now() - (n - 1 - i) * 86_400_000)),
    );
  }

  async getOverview(organizationId: string, userId: string, role: Role) {
    const [
      totals,
      activeProducts,
      lowStockCount,
      lowStock,
      recentMovements,
      pendingRequests,
      rows,
    ] = await Promise.all([
      this.repo.stockTotals(organizationId),
      this.repo.activeProductCount(organizationId),
      this.repo.lowStockCount(organizationId),
      this.repo.lowStockItems(organizationId),
      this.repo.recentMovements(organizationId),
      this.repo.pendingRequests(
        organizationId,
        role === Role.STAFF ? userId : undefined,
      ),
      this.repo.activity(
        organizationId,
        new Date(Date.now() - (DAYS + 1) * 86_400_000),
      ),
    ]);

    const byDay = new Map(rows.map((r) => [r.day, r]));
    const activity = this.lastDays(DAYS).map((day) => ({
      day,
      inUnits: byDay.get(day)?.in_units ?? 0,
      outUnits: byDay.get(day)?.out_units ?? 0,
    }));

    return {
      kpis: {
        activeProducts,
        totalUnits: totals.units,
        stockValue: totals.value,
        lowStockCount,
        pendingRequests,
      },
      lowStock,
      recentMovements,
      activity,
    };
  }
}
