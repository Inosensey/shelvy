// components/dashboard/notifications/NotificationPanel.tsx
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NotificationItem } from "./NotificationItem";
import { markAllNotificationsRead } from "@/actions/notificationAction";

interface NotificationPanelProps {
  open: boolean;
  notifications: NotificationWithMetadata[]; // from useNotifications
  onClose: () => void;
  onOpenMarkRead: () => void; // zeroes the badge in the parent's state
}

export function NotificationPanel({ open, notifications, onClose, onOpenMarkRead }: NotificationPanelProps) {
  useEffect(() => {
    if (!open) return;
    onOpenMarkRead();
    markAllNotificationsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-linen/10 bg-surface shadow-lg"
        >
          <div className="border-b border-linen/10 px-4 py-3">
            <h2 className="text-sm font-medium text-linen">Notifications</h2>
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-linen/40">You&apos;re all caught up.</p>
          ) : (
            <div className="max-h-96 divide-y divide-linen/10 overflow-y-auto">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onNavigate={onClose} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}