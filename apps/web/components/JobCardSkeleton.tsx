import { Skeleton } from '@/components/ui/skeleton';

export default function JobCardSkeleton() {
  return (
    <div className="bg-surface border border-border-c rounded-xl p-4 flex flex-col gap-2.5">
      <Skeleton className="h-4 w-1/2 rounded-[3px]" />
      <Skeleton className="h-3 w-3/4 rounded-[3px]" />
      <Skeleton className="h-3 w-full rounded-[3px]" />
      <div className="flex gap-1.5 pt-1">
        <Skeleton className="h-4 w-10 rounded-[4px]" />
        <Skeleton className="h-4 w-12 rounded-[4px]" />
        <Skeleton className="h-4 w-8 rounded-[4px]" />
      </div>
    </div>
  );
}
