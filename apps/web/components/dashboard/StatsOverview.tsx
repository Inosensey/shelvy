import { Package, AlertTriangle, DollarSign, Factory } from "lucide-react";
import type { ComponentType } from "react";

interface Stat {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  urgent?: boolean;
}

interface StatsOverviewProps {
  totalProducts: number;
  lowStockCount: number;
  stockValue: number;
  suppliersCount: number;
}

export function StatsOverview({
  totalProducts,
  lowStockCount,
  stockValue,
  suppliersCount,
}: StatsOverviewProps) {
  const stats: Stat[] = [
    { label: "Total Products", value: totalProducts.toString(), icon: Package },
    {
      label: "Low Stock Alerts",
      value: lowStockCount.toString(),
      icon: AlertTriangle,
      urgent: lowStockCount > 0,
    },
    {
      label: "Total Stock Value",
      value: `₱${stockValue.toLocaleString("en-PH")}`,
      icon: DollarSign,
    },
    { label: "Suppliers", value: suppliersCount.toString(), icon: Factory },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, urgent }) => (
        <div
          key={label}
          className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${
            urgent ? "border-red-400/30 bg-red-400/5" : "border-linen/10 bg-surface"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
              urgent ? "bg-red-400/15 text-red-400" : "bg-clay/15 text-clay"
            }`}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
          </div>
          <div>
            <p className={`font-display text-2xl leading-none ${urgent ? "text-red-400" : "text-linen"}`}>
              {value}
            </p>
            <p className="mt-1 text-xs text-linen/55">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}