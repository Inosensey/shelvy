// components/providers/NotificationsProvider.tsx
"use client";

import { memberJoinedListener } from "@/lib/socket/listeners/memberJoin.listener";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSocket } from "../../app/dashboard/SocketProvider";
import { useRouter } from "next/navigation";

interface NotificationsContextValue {
  notifications: NotificationWithMetadata[];
  unreadCount: number;
  markAllReadLocally: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({
  initialNotifications,
  children,
}: {
  initialNotifications: NotificationWithMetadata[];
  children: ReactNode;
}) {
  const socket = useSocket();
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllReadLocally = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  useEffect(() => {
    const { cleanUp } = memberJoinedListener(socket, router);

    return cleanUp;
  }, [socket, router]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, markAllReadLocally }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return ctx;
}
