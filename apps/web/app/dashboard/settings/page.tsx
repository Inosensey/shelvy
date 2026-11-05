import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { SettingsTabs } from "@/components/dashboard/settings/SettingsTabs";
import { visibleTabs, type SettingsTab } from "@/lib/settingsTab";
import { ProfileForm } from "@/components/dashboard/settings/ProfileForm";
import { SecurityPanel } from "@/components/dashboard/settings/SecurityPanel";
import { OrganizationForm } from "@/components/dashboard/settings/OrganizationForm";
import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import { helpers } from "@/lib/helpers";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: Props) {
  const { tab } = await searchParams;

  const currentUser = await helpers.getCurrentUserOrNull();
  const role = currentUser?.role ?? "STAFF";

  const isOwner = role === "OWNER";
  const active: SettingsTab = visibleTabs(isOwner).some((t) => t.key === tab)
    ? (tab as SettingsTab)
    : "profile";

  let content: React.ReactNode;

  if (active === "profile") {
    const res = await nestJsEndpoints.settingsApi.getProfile();
    content = (
      <ProfileForm
        info={res.success ? res.data : null}
        email={currentUser?.email ?? ""}
        role={role}
      />
    );
  } else if (active === "security") {
    const res = await nestJsEndpoints.settingsApi.getSecurity();
    content =
      res.success && res.data ? (
        <SecurityPanel security={res.data} />
      ) : (
        <p className="text-sm text-red-400">
          {res.message || "Could not load security settings."}
        </p>
      );
  } else {
    const res = await nestJsEndpoints.settingsApi.getOrganization();
    content =
      res.success && res.data ? (
        <OrganizationForm organization={res.data} canEdit={role === "OWNER"} />
      ) : (
        <p className="text-sm text-red-400">
          {res.message || "Could not load the organization."}
        </p>
      );
  }

  return (
    <>
      <DashboardTopbar title="Settings" />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <SettingsTabs active={active} isOwner={isOwner} />
        {content}
      </div>
    </>
  );
}
