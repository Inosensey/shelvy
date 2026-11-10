import Stripe from 'stripe';
import { SubscriptionStatus } from 'generated/prisma/client';

export const invoiceSubscriptionId = (
  invoice: Stripe.Invoice,
): string | null => {
  const sub = invoice.parent?.subscription_details?.subscription;
  return typeof sub === 'string' ? sub : (sub?.id ?? null);
};

// canceled is handled by the deleted event, so it maps to null here
export const mapStripeStatus = (
  s: Stripe.Subscription.Status,
): SubscriptionStatus | null => {
  switch (s) {
    case 'active':
    case 'trialing':
      return SubscriptionStatus.ACTIVE;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'unpaid':
      return SubscriptionStatus.UNPAID;
    case 'incomplete':
      return SubscriptionStatus.INCOMPLETE;
    default:
      return null;
  }
};
