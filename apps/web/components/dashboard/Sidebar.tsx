"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Factory,
  ArrowLeftRight,
  Bell,
  Users,
  Settings,
} from "lucide-react";
import type { ComponentType } from "react";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Factory },
  {
    href: "/dashboard/stock-movements",
    label: "Stock Movements",
    icon: ArrowLeftRight,
  },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-linen/10 bg-surface md:flex">
      <Link
        href="/dashboard"
        className="font-display text-xl italic text-linen"
      >
        <div className="px-5 py-5 flex gap-2">
          <div aria-hidden className="h-9 w-9 rounded-md">
            <Image src={"/icon.svg"} alt="Shelvy Icon" width={30} height={30} />
          </div>
          Shelvy
        </div>
      </Link>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-clay/15 text-clay"
                  : "text-linen/60 hover:bg-linen/5 hover:text-linen"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
