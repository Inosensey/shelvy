import Link from "next/link";
import { Plus, ArrowLeftRight, UserPlus } from "lucide-react";
import type { ComponentType } from "react";

interface QuickAction {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

const ACTIONS: QuickAction[] = [
  { href: "/dashboard/products", label: "Add Product", icon: Plus },
  { href: "/dashboard/stock-movements", label: "Record Movement", icon: ArrowLeftRight },
  { href: "/dashboard/team", label: "Invite Member", icon: UserPlus },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {ACTIONS.map(({ href, label, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="flex items-center gap-2 rounded-md border border-linen/15 bg-surface px-4 py-2.5 text-sm
                     font-medium text-linen transition-colors hover:border-clay/40 hover:bg-clay/5"
        >
          <Icon className="h-4 w-4 text-clay" strokeWidth={2} />
          {label}
        </Link>
      ))}
    </div>
  );
}