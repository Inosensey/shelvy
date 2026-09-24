export interface MovementDay {
  label: string; // "Mon", "Tue", etc.
  stockIn: number;
  stockOut: number;
}

export function MovementsChart({ data }: { data: MovementDay[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.stockIn, d.stockOut)), 1);

  return (
    <section className="rounded-xl border border-linen/10 bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-linen">Stock Movements (7 days)</h2>
        <div className="flex items-center gap-4 text-xs text-linen/55">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-clay" /> In
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-linen/30" /> Out
          </span>
        </div>
      </div>

      <div className="mt-6 flex h-40 items-end justify-between gap-3">
        {data.map((day) => (
          <div key={day.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div
                className="w-full max-w-3.5 rounded-t bg-clay"
                style={{ height: `${(day.stockIn / max) * 100}%` }}
                title={`In: ${day.stockIn}`}
              />
              <div
                className="w-full max-w-3.5 rounded-t bg-linen/25"
                style={{ height: `${(day.stockOut / max) * 100}%` }}
                title={`Out: ${day.stockOut}`}
              />
            </div>
            <span className="text-[11px] text-linen/45">{day.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}