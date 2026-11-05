import Link from "next/link";
import { Panel } from "./Panel";

export function LowStockPanel({
  items,
}: {
  items: DashboardOverview["lowStock"];
}) {
  return (
    <Panel
      title="Low stock"
      action={{ href: "/dashboard/products?lowStock=true", label: "View all" }}
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-linen/40">
          Everything is stocked above its alert level.
        </p>
      ) : (
        <ul className="divide-y divide-linen/5">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/products?search=${encodeURIComponent(p.name)}&highlight=${p.id}`}
                className="flex items-center justify-between gap-3 py-2.5 hover:bg-linen/3"
              >
                <span className="truncate text-sm text-linen">{p.name}</span>
                {p.stock <= 0 ? (
                  <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
                    Out of stock
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium tabular-nums text-amber-400">
                    {p.stock} / {p.lowStockThreshold}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
