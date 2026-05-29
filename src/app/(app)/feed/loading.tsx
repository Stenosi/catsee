import { Skeleton } from '@/components/ui/skeleton';

function FeedCardSkeleton() {
  return (
    <div className="flex flex-col border-b border-border">
      {/* Header autore */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>

      {/* Foto */}
      <Skeleton className="w-full aspect-square rounded-none" />

      {/* Footer */}
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function FeedLoading() {
  return (
    <div className="flex flex-col">
      <FeedCardSkeleton />
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </div>
  );
}
