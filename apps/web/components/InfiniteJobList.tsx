'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import JobCard, { type JobCardRow } from './JobCard';

type Props = {
  initial: JobCardRow[];
  initialNextOffset: number | null;
  filters: Record<string, string>;
};

export default function InfiniteJobList({ initial, initialNextOffset, filters }: Props) {
  const [items, setItems] = useState<JobCardRow[]>(initial);
  const [nextOffset, setNextOffset] = useState<number | null>(initialNextOffset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || nextOffset == null) return;
    setLoading(true);
    setError(null);
    try {
      const usp = new URLSearchParams(filters);
      usp.set('offset', String(nextOffset));
      const res = await fetch(`/api/browse?${usp.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { posts: JobCardRow[]; next_offset: number | null } = await res.json();
      setItems((prev) => prev.concat(data.posts));
      setNextOffset(data.next_offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [filters, loading, nextOffset]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || nextOffset == null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, nextOffset]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((row) => (
          <JobCard key={String(row.post_raw_id)} row={row} />
        ))}
      </div>
      {nextOffset != null && (
        <div ref={sentinelRef} className="flex justify-center py-6 text-sm text-neutral-500">
          {loading ? 'Loading…' : 'Scroll to load more'}
        </div>
      )}
      {error && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
          >
            Retry ({error})
          </button>
        </div>
      )}
      {nextOffset == null && items.length > 0 && (
        <div className="py-6 text-center text-xs text-neutral-500">No more results.</div>
      )}
    </>
  );
}
