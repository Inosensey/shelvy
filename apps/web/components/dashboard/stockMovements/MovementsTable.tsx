import { TYPE_STYLE, signed } from "./movementStyle";

const when = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

interface Props {
  movements: StockMovement[];
  showProduct?: boolean;
}

export function MovementsTable({ movements, showProduct = true }: Props) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-linen/10 bg-surface md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-linen/10 text-xs uppercase tracking-wide text-linen/40">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              {showProduct && (
                <th className="px-4 py-3 font-medium">Product</th>
              )}
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Change</th>
              <th className="px-4 py-3 text-right font-medium">Stock after</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const s = TYPE_STYLE[m.type];
              return (
                <tr
                  key={m.id}
                  id={`movement-${m.id}`}
                  className={`border-b border-linen/5 last:border-0 hover:bg-linen/3`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-linen/60">
                    {when.format(new Date(m.createdAt))}
                  </td>
                  {showProduct && (
                    <td className="px-4 py-3 font-medium text-linen">
                      {m.product.name}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium tabular-nums ${s.delta}`}
                  >
                    {signed(m.delta)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-linen/80">
                    {m.stockAfter}
                  </td>
                  <td
                    className="max-w-56 truncate px-4 py-3 text-linen/60"
                    title={m.note ?? undefined}
                  >
                    {m.reason ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-linen/50">
                    {m.performedBy.email}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {movements.map((m) => {
          const s = TYPE_STYLE[m.type];
          return (
            <li
              key={m.id}
              id={`movement-${m.id}`}
              className={`rounded-xl border border-linen/10 bg-surface p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {showProduct && (
                    <p className="truncate font-medium text-linen">
                      {m.product.name}
                    </p>
                  )}
                  <p className="text-xs text-linen/40">
                    {when.format(new Date(m.createdAt))}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}
                >
                  {s.label}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className={`font-medium tabular-nums ${s.delta}`}>
                  {signed(m.delta)}
                </span>
                <span className="text-linen/50">
                  Stock after:{" "}
                  <span className="tabular-nums text-linen/80">
                    {m.stockAfter}
                  </span>
                </span>
              </div>
              {m.reason && (
                <p className="mt-2 text-sm text-linen/60">{m.reason}</p>
              )}
              <p className="mt-1 text-xs text-linen/40">
                {m.performedBy.email}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
