"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/components/dashboard/Sidebar";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-linen/10 bg-surface px-3 py-2 md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={label}
            className={`flex shrink-0 items-center justify-center rounded-md p-2 transition-colors ${
              active ? "bg-clay/15 text-clay" : "text-linen/60 hover:bg-linen/5 hover:text-linen"
            }`}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
          </Link>
        );
      })}
    </nav>
  );
}