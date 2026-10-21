// app/dashboard/settings/page.tsx
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { SettingsTabs } from "@/components/dashboard/settings/SettingsTabs";

export default async function SettingsPage() {
  return (
    <>
      <DashboardTopbar title="Settings" />
      <main className="px-4 py-8 sm:px-8">
        <SettingsTabs />
      </main>
    </>
  );
}