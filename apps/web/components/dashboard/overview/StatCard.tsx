import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  tone?: "default" | "warning";
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "default",
}: StatCardProps) {
  const warning = tone === "warning";
  const body = (
    <div
      className={`h-full rounded-xl border bg-surface p-4 transition-colors ${
        warning ? "border-amber-500/30" : "border-linen/10"
      } ${href ? "hover:bg-linen/3" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-linen/50">
          {label}
        </span>
        <Icon
          className={`h-4 w-4 ${warning ? "text-amber-400" : "text-linen/30"}`}
        />
      </div>
      <p
        className={`mt-3 font-display text-2xl tabular-nums ${warning ? "text-amber-400" : "text-linen"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-linen/40">{hint}</p>}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
