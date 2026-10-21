"use client";

interface InviteTabsProps {
  active: "PENDING" | "REVOKED";
  onChange: (tab: "PENDING" | "REVOKED") => void;
  pendingCount: number;
  revokedCount: number;
}

export function InviteTabs({ active, onChange, pendingCount, revokedCount }: InviteTabsProps) {
  const tabs = [
    { id: "PENDING" as const, label: "PENDING", count: pendingCount },
    { id: "REVOKED" as const, label: "REVOKED", count: revokedCount },
  ];

  return (
    <div className="flex items-center gap-1 rounded-md border border-linen/10 bg-ink/40 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            active === tab.id
              ? "bg-clay/10 text-clay"
              : "text-linen/50 hover:text-linen"
          }`}
        >
          {tab.label}
          <span className={`rounded-full px-1.5 text-[10px] ${active === tab.id ? "bg-clay/15" : "bg-linen/10"}`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}