import { SubscriptionPlan } from 'generated/prisma/client';

export const PLAN_LIMITS: Record<
  SubscriptionPlan,
  { products: number | null; members: number | null }
> = {
  FREE: { products: 50, members: 3 },
  PREMIUM: { products: null, members: 10 },
  ENTERPRISE: { products: null, members: null },
};

export const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  FREE: 'Free',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise',
};
