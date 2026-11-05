"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/stock-movements", label: "Ledger" },
  { href: "/dashboard/stock-movements/requests", label: "Requests" },
];

export function MovementTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-4 flex gap-1 border-b border-linen/10">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            pathname === t.href ? "border-clay text-linen" : "border-transparent text-linen/50 hover:text-linen"
          }`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}