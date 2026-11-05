"use client";

import Link from "next/link";
import { visibleTabs, type SettingsTab } from "@/lib/settingsTab";

export function SettingsTabs({
  active,
  isOwner,
}: {
  active: SettingsTab;
  isOwner: boolean;
}) {
  return (
    <div className="mb-6 flex gap-1 border-b border-linen/10">
      {visibleTabs(isOwner).map((t) => (
        <Link
          key={t.key}
          href={`/dashboard/settings?tab=${t.key}`}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            active === t.key
              ? "border-clay text-linen"
              : "border-transparent text-linen/50 hover:text-linen"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
