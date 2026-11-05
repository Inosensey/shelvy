export const ALL_TABS = [
  { key: "profile", label: "Profile", ownerOnly: false },
  { key: "security", label: "Security", ownerOnly: false },
  { key: "organization", label: "Organization", ownerOnly: false },
  // { key: "billing", label: "Billing", ownerOnly: true },  // enable in Stage 2
] as const;

export type SettingsTab = (typeof ALL_TABS)[number]["key"];

export const visibleTabs = (isOwner: boolean) => ALL_TABS.filter((t) => !t.ownerOnly || isOwner);