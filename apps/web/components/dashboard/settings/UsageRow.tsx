export function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="opacity-70">
          {used} / {limit ?? "Unlimited"}
        </span>
      </div>
      {limit !== null && (
        <div className="mt-1 h-1.5 rounded-full bg-linen/10">
          <div
            className={`h-full rounded-full ${pct >= 100 ? "bg-red-400" : "bg-clay"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
