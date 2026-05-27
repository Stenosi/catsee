import { Skeleton } from '@/components/ui/skeleton';

export default function CercaLoading() {
  return (
    <div className="grid grid-cols-3 gap-px">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-none" />
      ))}
    </div>
  );
}
