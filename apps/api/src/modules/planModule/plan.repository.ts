import { Prisma, SubscriptionPlan } from 'generated/prisma/client';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { PrismaService } from 'src/PrismaConfig/prisma.service';

@Injectable()
export class PlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Serialises limit checks per organization, so two requests at 49/50 can't both pass.
  // NO KEY UPDATE doesn't block foreign-key checks (stock movements etc.) on the same org.
  async lockOrganization(tx: Prisma.TransactionClient, organizationId: string) {
    await tx.$queryRaw`SELECT id FROM organizations WHERE id = ${organizationId} FOR NO KEY UPDATE`;
  }

  // The limits follow the organization OWNER's plan
  async getPlan(organizationId: string): Promise<SubscriptionPlan> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { owner: { select: { subscriptionPlan: true } } },
    });
    return org?.owner.subscriptionPlan ?? SubscriptionPlan.FREE;
  }

  async getUsage(organizationId: string) {
    const [products, users, pendingInvites] = await Promise.all([
      this.prisma.product.count({
        where: { organizationId, archivedAt: null },
      }),
      this.prisma.user.count({ where: { organizationId } }),
      this.prisma.organizationInvite.count({
        where: {
          organizationId,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      }),
    ]);
    // "members" = seats in use: people in the org plus invites holding a seat
    return { products, users, pendingInvites, members: users + pendingInvites };
  }
}
