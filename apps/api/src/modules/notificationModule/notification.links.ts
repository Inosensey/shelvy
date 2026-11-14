import { NotificationType } from 'generated/prisma/enums';

export function notificationUrl(
  base: string,
  n: { type: NotificationType; metadata: unknown },
) {
  const meta = (n.metadata ?? {}) as Record<string, string | undefined>;
  switch (n.type) {
    case NotificationType.LOW_STOCK:
      return meta.productId
        ? `${base}/dashboard/products?search=${encodeURIComponent(meta.productName ?? '')}&highlight=${encodeURIComponent(meta.productId)}`
        : `${base}/dashboard/products`;
    case NotificationType.MOVEMENT_REQUESTED:
    case NotificationType.MOVEMENT_DECIDED:
      return `${base}/dashboard/stock-movements/requests${meta.requestId ? `?highlight=${encodeURIComponent(meta.requestId)}` : ''}`;
    case NotificationType.MEMBER_JOINED:
      return `${base}/dashboard/team`;
    case NotificationType.PAYMENT_FAILED:
      return `${base}/dashboard/settings?tab=billing`;
    default:
      return `${base}/dashboard`;
  }
}
