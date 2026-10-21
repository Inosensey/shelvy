// components/dashboard/notifications/NotificationBell.tsx
"use client";

import { useRef, useState } from "react";
import { Bell } from "lucide-react";
import { NotificationPanel } from "./NotificationPanel";
import { useNotifications } from "@/components/providers/NotificationsProvider";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllReadLocally } = useNotifications();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-linen/60 transition-colors hover:bg-linen/5 hover:text-linen"
      >
        <Bell className="h-6 w-6" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-medium text-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        open={open}
        notifications={notifications}
        onClose={() => setOpen(false)}
        onOpenMarkRead={markAllReadLocally}
      />
    </div>
  );
}