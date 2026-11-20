import { Skeleton } from '@/components/reusable/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-4 p-6" role="status" aria-label="Loading products">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}