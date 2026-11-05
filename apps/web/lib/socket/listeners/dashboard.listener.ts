import { Socket } from "socket.io-client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import {
  revalidateNotificationCache,
  revalidateInviteCache,
  revalidateMemberCache,
  revalidateProductCache,
  revalidateStockMovementCache,
  revalidateStockMovementRequestsCache,
} from "@/actions/revalidateAction";
import {
  getNotificationHref,
  type NotificationType,
} from "@/utils/getNotificationLinks";

interface SocketNotificationData {
  message: string;
  metadata?: Record<string, string> | null; // only if your gateway sends it
}

interface EventConfig {
  toast: "success" | "info" | "warning";
  revalidate: Array<() => Promise<unknown>>;
}

// event name = notification type; add a line here to support a new one
const EVENTS: Partial<Record<NotificationType, EventConfig>> = {
  MEMBER_JOINED: {
    toast: "success",
    revalidate: [
      revalidateInviteCache,
      revalidateMemberCache,
      revalidateNotificationCache,
    ],
  },
  LOW_STOCK: {
    toast: "warning",
    revalidate: [revalidateNotificationCache],
  },
  MOVEMENT_REQUESTED: {
    toast: "info",
    revalidate: [
      revalidateStockMovementRequestsCache,
      revalidateNotificationCache,
    ],
  },
  MOVEMENT_DECIDED: {
    toast: "info",
    revalidate: [
      revalidateStockMovementRequestsCache,
      revalidateStockMovementCache,
      revalidateProductCache,
      revalidateNotificationCache,
    ],
  },
};

export function dashboardListener(
  socket: Socket | null,
  router: AppRouterInstance,
) {
  if (!socket) return { cleanUp: () => {} };

  const registered = (
    Object.entries(EVENTS) as [NotificationType, EventConfig][]
  ).map(([event, config]) => {
    const handler = async (data: SocketNotificationData) => {
      toast[config.toast](data.message, {
        action: {
          label: "View",
          onClick: () =>
            router.push(getNotificationHref(event, data.metadata ?? null)),
        },
      });

      try {
        await Promise.all(config.revalidate.map((fn) => fn()));
      } catch (error) {
        console.error(`Failed to clear caches for ${event}:`, error);
      } finally {
        router.refresh(); 
      }
    };

    socket.on(event, handler);
    return [event, handler] as const;
  });

  return {
    cleanUp: () =>
      registered.forEach(([event, handler]) => socket.off(event, handler)),
  };
}
