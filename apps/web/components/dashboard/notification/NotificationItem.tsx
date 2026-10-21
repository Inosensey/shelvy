// components/dashboard/notifications/NotificationItem.tsx
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Users, AlertTriangle, ArrowLeftRight, CreditCard } from "lucide-react";
import { getNotificationHref } from "@/utils/getNotificationLinks";

const TYPE_ICON = {
  MEMBER_JOINED: Users,
  LOW_STOCK: AlertTriangle,
  STOCK_MOVEMENT: ArrowLeftRight,
  PAYMENT_FAILED: CreditCard,
} as const;

interface NotificationItemProps {
  notification: {
    id: string;
    type: keyof typeof TYPE_ICON;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    metadata: { productId?: string; stockMovementId?: string } | null;
  };
  onNavigate: () => void;
}

export function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const Icon = TYPE_ICON[notification.type];

  return (
    <Link
      href={getNotificationHref(notification.type, notification.metadata)}
      onClick={onNavigate}
      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-linen/5"
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linen/5">
        <Icon className="h-3.5 w-3.5 text-linen/50" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {!notification.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />}
          <p className="truncate text-sm font-medium text-linen">{notification.title}</p>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-linen/50">{notification.message}</p>
        <p className="mt-1 text-[11px] text-linen/35">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
}