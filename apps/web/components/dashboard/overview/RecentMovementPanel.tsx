import { Panel } from "./Panel";
import { TYPE_STYLE, signed } from "../stockMovements/movementStyle";

const when = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila", // pinned so server and browser agree
});

export function RecentMovementsPanel({
  movements,
}: {
  movements: StockMovement[];
}) {
  return (
    <Panel
      title="Recent movements"
      action={{ href: "/dashboard/stock-movements", label: "View ledger" }}
    >
      {movements.length === 0 ? (
        <p className="py-6 text-center text-sm text-linen/40">
          No stock movements yet.
        </p>
      ) : (
        <ul className="divide-y divide-linen/5">
          {movements.map((m) => {
            const s = TYPE_STYLE[m.type];
            return (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-linen">
                    {m.product.name}
                  </p>
                  <p className="text-xs text-linen/40">
                    {when.format(new Date(m.createdAt))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}
                  >
                    {s.label}
                  </span>
                  <span
                    className={`w-12 text-right text-sm font-medium tabular-nums ${s.delta}`}
                  >
                    {signed(m.delta)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
