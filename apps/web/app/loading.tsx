import JobRowSkeleton from '@/components/JobRowSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <div className="flex items-center gap-1 border border-border-c rounded-xl bg-surface px-2 py-1.5 mb-4 h-[44px]">
        <Skeleton className="h-7 w-[140px] rounded-[6px]" />
        <Skeleton className="ml-1 h-4 flex-1 rounded-[4px]" />
      </div>
      <div className="flex items-center gap-2 px-1 pt-3.5 pb-[18px] border-b border-border-c">
        <Skeleton className="h-4 w-24 rounded-[4px]" />
      </div>
      <div className="flex flex-col" aria-busy="true" aria-live="polite">
        {Array.from({ length: 8 }).map((_, i) => <JobRowSkeleton key={i} />)}
      </div>
    </>
  );
}
