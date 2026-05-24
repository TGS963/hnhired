'use client';

import JobRow, { type JobCardRow } from './JobRow';
import JobRowSkeleton from './JobRowSkeleton';
import { useSearchPending } from './search-pending';

type Props = {
  results: JobCardRow[];
  error?: string | null;
};

export default function NlResultsList({ results, error }: Props) {
  const { isPending } = useSearchPending();

  if (isPending) {
    return (
      <div className="flex flex-col" aria-busy="true" aria-live="polite">
        {Array.from({ length: 6 }).map((_, i) => <JobRowSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-24 text-center border border-dashed border-border-c rounded-2xl mt-5">
        <div className="text-[15px] font-medium mb-1.5">AI search unavailable</div>
        <div className="text-fg-muted">{error}</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="px-5 py-24 text-center border border-dashed border-border-c rounded-2xl mt-5">
        <div className="text-[15px] font-medium mb-1.5">No matches</div>
        <div className="text-fg-muted">Try a different query.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {results.map((row) => (
        <JobRow
          key={String(row.post_raw_id)}
          row={row}
        />
      ))}
    </div>
  );
}
