import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react";

export interface Movement {
  id: string;
  productName: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason: string;
  who: string;
  when: string; // preformatted, e.g. "2h ago"
}

const TYPE_STYLES = {
  IN: { icon: ArrowDownToLine, className: "bg-emerald-400/10 text-emerald-400" },
  OUT: { icon: ArrowUpFromLine, className: "bg-red-400/10 text-red-400" },
  ADJUSTMENT: { icon: SlidersHorizontal, className: "bg-clay/10 text-clay" },
};

export function RecentMovementsTable({ movements }: { movements: Movement[] }) {
  return (
    <section className="rounded-xl border border-linen/10 bg-surface">
      <div className="border-b border-linen/10 px-5 py-4">
        <h2 className="font-display text-lg text-linen">Recent Stock Movements</h2>
      </div>

      {movements.length === 0 ? (
        <p className="px-5 py-6 text-sm text-linen/50">No movements recorded yet.</p>
      ) : (
        <ul className="divide-y divide-linen/10">
          {movements.map((m) => {
            const { icon: Icon, className } = TYPE_STYLES[m.type];
            return (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${className}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-linen">
                    {m.productName}{" "}
                    <span className="text-linen/45">
                      {m.type === "OUT" ? "-" : "+"}
                      {m.quantity}
                    </span>
                  </p>
                  <p className="truncate text-xs text-linen/45">
                    {m.reason} &middot; {m.who}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-linen/40">{m.when}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}