export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-linen/10 bg-surface" aria-hidden>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-linen/5 px-4 py-4 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="h-4 flex-1 animate-pulse rounded bg-linen/10" />
          ))}
        </div>
      ))}
    </div>
  );
}