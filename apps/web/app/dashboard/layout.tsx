// app/dashboard/layout.tsx
import { NoOrganizationState } from "@/components/dashboard/NoOrganizationState";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NotificationsProvider } from "@/components/providers/NotificationsProvider";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { SocketProvider } from "./SocketProvider";

async function getInitialNotifications() {
  const response = await nestJsEndpoints.notificationsApi.getMyNotifications();
  return response.data ?? [];
}

async function getCurrentUser() {
  const user = await nestJsEndpoints.userApi.getMe();
  return {
    id: user.data!.id,
    role: user.data!.role,
    organizationId: user.data!.organizationId,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialNotifications = await getInitialNotifications();
  const currentUser = await getCurrentUser();

  if (!currentUser.organizationId && currentUser.role !== "OWNER") {
    return <NoOrganizationState />;
  }

  return (
    <SocketProvider>
      <NotificationsProvider initialNotifications={initialNotifications}>
        <div className="flex min-h-screen bg-ink">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </NotificationsProvider>
    </SocketProvider>
  );
}
