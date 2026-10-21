import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { NotificationBell } from "./notification/NotificationBell";

export function DashboardTopbar({ title }: { title: string }) {
  return (
    <div className="border-b border-linen/10">
      <MobileNav />
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <h1 className="font-display text-xl text-linen">{title}</h1>
        <div className="flex gap-8">
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
