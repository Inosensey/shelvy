import { Package, AlertTriangle, DollarSign, ArrowLeftRight } from "lucide-react";
import type { ComponentType } from "react";

interface Stat {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

interface StatsOverviewProps {
  totalProducts: number;
  lowStockCount: number;
  stockValue: number;
  movementsThisWeek: number;
}

export function StatsOverview({
  totalProducts,
  lowStockCount,
  stockValue,
  movementsThisWeek,
}: StatsOverviewProps) {
  const stats: Stat[] = [
    { label: "Total Products", value: totalProducts.toString(), icon: Package },
    { label: "Low Stock Alerts", value: lowStockCount.toString(), icon: AlertTriangle },
    {
      label: "Stock Value",
      value: `₱${stockValue.toLocaleString("en-PH")}`,
      icon: DollarSign,
    },
    { label: "Movements This Week", value: movementsThisWeek.toString(), icon: ArrowLeftRight },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-linen/10 bg-surface px-5 py-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-clay/15 text-clay">
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <div>
            <p className="font-display text-2xl leading-none text-linen">{value}</p>
            <p className="mt-1 text-xs text-linen/55">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}