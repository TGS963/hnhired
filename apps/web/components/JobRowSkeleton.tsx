import { Skeleton } from '@/components/ui/skeleton';

export default function JobRowSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] gap-5 px-2 py-4 border-b border-row-divider">
      <div className="min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-2/3 rounded-[3px]" />
        <Skeleton className="h-3 w-4/5 rounded-[3px]" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-14 rounded-[4px]" />
        <Skeleton className="h-3 w-20 rounded-[3px]" />
      </div>
      <div className="flex items-center gap-1">
        <Skeleton className="h-4 w-10 rounded-[4px]" />
        <Skeleton className="h-4 w-10 rounded-[4px]" />
        <Skeleton className="h-4 w-10 rounded-[4px]" />
      </div>
      <div className="flex items-center justify-self-end gap-2.5">
        <Skeleton className="h-3 w-8 rounded-[3px]" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}
