import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, SubscriptionPlan } from 'generated/prisma/client';
import { PLAN_LIMITS, PLAN_NAMES } from './plan.limits';
import { PlanRepository } from './plan.repository';

@Injectable()
export class PlanService {
  constructor(private readonly planRepository: PlanRepository) {}

  async assertCanAddProducts(organizationId: string, adding = 1) {
    const plan = await this.planRepository.getPlan(organizationId);
    const limit = PLAN_LIMITS[plan].products;
    if (limit === null) return;

    const { products } = await this.planRepository.getUsage(organizationId);
    if (products + adding > limit) {
      const room = Math.max(limit - products, 0);
      throw new ForbiddenException(
        adding > 1
          ? `Your ${PLAN_NAMES[plan]} plan includes up to ${limit} products and you have ${products}. This adds ${adding}, but only ${room} more fit. Upgrade your plan to add more.`
          : `Your ${PLAN_NAMES[plan]} plan includes up to ${limit} products and you have ${products}. Upgrade your plan to add more.`,
      );
    }
  }

  // Sending an invite reserves a seat
  async assertCanAddMember(organizationId: string) {
    const plan = await this.getPlan(organizationId);
    const limit = PLAN_LIMITS[plan].members;
    if (limit === null) return;

    const { members } = await this.getUsage(organizationId);
    if (members + 1 > limit) {
      throw new ForbiddenException(
        `Your ${PLAN_NAMES[plan]} plan includes up to ${limit} team members, counting you and pending invites. Upgrade your plan to invite more.`,
      );
    }
  }

  // Accepting converts the invite into a member; the plan may have changed since it was sent
  async assertCanAcceptMember(organizationId: string) {
    const plan = await this.getPlan(organizationId);
    const limit = PLAN_LIMITS[plan].members;
    if (limit === null) return;

    const { users } = await this.getUsage(organizationId);
    if (users + 1 > limit) {
      throw new ForbiddenException(
        'This organization has reached its team member limit. Ask the owner to upgrade the plan.',
      );
    }
  }

  async lockOrganization(tx: Prisma.TransactionClient, organizationId: string) {
    return this.planRepository.lockOrganization(tx, organizationId);
  }

  // The limits follow the organization OWNER's plan
  async getPlan(organizationId: string): Promise<SubscriptionPlan> {
    return this.planRepository.getPlan(organizationId);
  }

  async getUsage(organizationId: string) {
    return this.planRepository.getUsage(organizationId);
  }
}
