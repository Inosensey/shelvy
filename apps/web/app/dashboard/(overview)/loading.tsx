import { Skeleton } from '@/components/reusable/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-4 p-6" role="status" aria-label="Loading overview">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-52 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}