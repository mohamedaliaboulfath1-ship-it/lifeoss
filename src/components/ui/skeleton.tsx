import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-surface2/80 border border-border/50",
        className
      )}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="h-screen flex bg-bg">
      <Skeleton className="w-[var(--width-sidebar)] shrink-0 h-full rounded-none hidden md:block" />
      <div className="flex-1 p-4 md:p-7 space-y-4">
        <Skeleton className="h-12 w-full max-w-md skeleton-shimmer" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 skeleton-shimmer" />
          ))}
        </div>
        <Skeleton className="h-48 w-full skeleton-shimmer" />
        <Skeleton className="h-64 w-full skeleton-shimmer" />
      </div>
    </div>
  );
}

export function ViewSkeleton() {
  return (
    <div className="space-y-4 p-1">
      <Skeleton className="h-10 w-56 skeleton-shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 skeleton-shimmer" />
        <Skeleton className="h-40 skeleton-shimmer" />
      </div>
      <Skeleton className="h-72 skeleton-shimmer" />
    </div>
  );
}
