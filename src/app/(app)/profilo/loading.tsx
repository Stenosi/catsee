import { Skeleton } from '@/components/ui/skeleton';

export default function ProfiloLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Intestazione */}
      <div className="flex flex-col gap-3 px-3 pt-5 pb-3">
        <div className="flex items-center gap-8 px-2">
          {/* Avatar */}
          <Skeleton className="w-20 h-20 rounded-full shrink-0" />

          <div className="flex flex-col justify-center gap-2 w-full">
            {/* Nickname + badge */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            {/* Follower / Seguiti */}
            <div className="flex gap-10">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <Skeleton className="h-3 w-3/4" />

        {/* Bottoni azioni */}
        <div className="w-full flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      </div>

      {/* Tab bar */}
      <Skeleton className="h-10 w-full rounded-none shrink-0" />

      {/* Griglia post */}
      <div className="grid grid-cols-3 gap-px flex-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-none" />
        ))}
      </div>
    </div>
  );
}
