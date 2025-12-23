import { Skeleton } from '@/components/ui/skeleton';

export function MaterialSelectorSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Filtros Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg border border-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>

      {/* Seleção Principal Skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
