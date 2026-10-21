// components/dashboard/settings/SettingsTabs.tsx
"use client";

import { useState } from "react";
import { Building2, User, CreditCard, Receipt } from "lucide-react";
import type { ComponentType } from "react";

type TabId = "organization" | "account" | "subscription" | "billing";

const TABS: { id: TabId; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; description: string }[] = [
  { id: "organization", label: "Organization", icon: Building2, description: "Update your organization's name and description." },
  { id: "account", label: "Account", icon: User, description: "Update your personal info (from onboarding) and change your password." },
  { id: "subscription", label: "Subscription", icon: CreditCard, description: "See your current plan, upgrade or downgrade, or cancel your subscription." },
  { id: "billing", label: "Billing", icon: Receipt, description: "Payment history -- amount, date, status, and invoice downloads." },
];

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("organization");
  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex gap-1 overflow-x-auto sm:w-48 sm:shrink-0 sm:flex-col sm:overflow-visible">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
              activeTab === id ? "bg-clay/15 text-clay" : "text-linen/60 hover:bg-linen/5 hover:text-linen"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 rounded-xl border border-linen/10 bg-surface p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-clay/15 text-clay">
          <active.icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <h2 className="mt-3 font-display text-lg text-linen">{active.label}</h2>
        <p className="mt-1.5 text-sm text-linen/55">{active.description}</p>
      </div>
    </div>
  );
}