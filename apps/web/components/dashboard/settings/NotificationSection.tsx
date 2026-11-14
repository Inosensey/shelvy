import { nestJsEndpoints } from "@/lib/nestJsEndpoints";
import NotificationsPanel from "./NotificationPanel";

export default async function NotificationsSection({ role }: { role: role }) {
  const settings = await nestJsEndpoints.notificationsApi.getSettings();
  return <NotificationsPanel initial={settings.data!} role={role} />;
}
