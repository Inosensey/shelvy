"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateNotificationSettingsAction } from "@/actions/settingsAction";

const MODES: { value: NotificationEmailMode; label: string; hint: string }[] = [
  { value: "IF_UNREAD", label: "Only if I haven't read them", hint: "We email you after a few minutes if a notification is still unread." },
  { value: "IMMEDIATE", label: "Right away", hint: "Every notification is emailed, even while you're online." },
  { value: "OFF", label: "Never", hint: "No notification emails. Billing problems are still emailed." },
];

const CATEGORIES: {
  key: keyof Omit<NotificationSettings, "emailMode">;
  label: string;
  roles: role[];
}[] = [
  { key: "emailLowStock", label: "Low stock alerts", roles: ["OWNER", "MANAGER"] },
  { key: "emailRequests", label: "New stock requests", roles: ["OWNER", "MANAGER"] },
  { key: "emailDecisions", label: "Decisions on my requests", roles: ["OWNER", "MANAGER", "STAFF"] },
  { key: "emailMembers", label: "New team members", roles: ["OWNER", "MANAGER"] },
];

export default function NotificationsPanel({
  initial,
  role,
}: {
  initial: NotificationSettings;
  role: role;
}) {
  const [settings, setSettings] = useState(initial);
  const [pending, startTransition] = useTransition();

  const save = (patch: Partial<NotificationSettings>) => {
    const previous = settings;
    setSettings({ ...settings, ...patch });
    startTransition(async () => {
      const res = await updateNotificationSettingsAction(patch);
      if (!res.success) {
        setSettings(previous);
        toast.error(res.message);
      }
    });
  };

  const off = settings.emailMode === "OFF";

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-semibold">Email notifications</h3>
        <div className="mt-3 space-y-2">
          {MODES.map((m) => (
            <label key={m.value} className="flex cursor-pointer gap-3 rounded-lg border p-3">
              <input
                type="radio"
                name="emailMode"
                className="mt-1"
                checked={settings.emailMode === m.value}
                disabled={pending}
                onChange={() => save({ emailMode: m.value })}
              />
              <span>
                <span className="block font-medium">{m.label}</span>
                <span className="block text-sm text-muted-foreground">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className={off ? "opacity-50" : undefined}>
        <h3 className="font-semibold">What to email me about</h3>
        <div className="mt-3 space-y-2">
          {CATEGORIES.filter((c) => c.roles.includes(role)).map((c) => (
            <label key={c.key} className="flex items-center justify-between rounded-lg border p-3">
              <span>{c.label}</span>
              <input
                type="checkbox"
                checked={settings[c.key]}
                disabled={off || pending}
                onChange={(e) => save({ [c.key]: e.target.checked })}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}