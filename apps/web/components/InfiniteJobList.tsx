'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JobRow, { type JobCardRow } from './JobRow';
import JobCard from './JobCard';
import JobRowSkeleton from './JobRowSkeleton';
import JobCardSkeleton from './JobCardSkeleton';
import LayoutToggle, { type Layout } from './LayoutToggle';
import { useSearchPending } from './search-pending';

type Props = {
  initial: JobCardRow[];
  initialNextOffset: number | null;
  filters: Record<string, string>;
  initialLayout: Layout;
  savedOnly?: boolean;
  total?: number | null;
};

export default function InfiniteJobList({
  initial,
  initialNextOffset,
  filters,
  initialLayout,
  savedOnly = false,
  total,
}: Props) {
  const [items, setItems] = useState<JobCardRow[]>(initial);
  const [nextOffset, setNextOffset] = useState<number | null>(initialNextOffset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [hideSeen, setHideSeen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { isPending } = useSearchPending();

  useEffect(() => {
    function readState() {
      try {
        setHideSeen(localStorage.getItem('hnhired:hidden') === '1');
        const sRaw = localStorage.getItem('hnhired:saved');
        const seenRaw = localStorage.getItem('hnhired:seen');
        const sArr = sRaw ? (JSON.parse(sRaw) as Array<string | number>) : [];
        const seenArr = seenRaw ? (JSON.parse(seenRaw) as Array<string | number>) : [];
        setSavedIds(new Set(sArr.map(String)));
        setSeenIds(new Set(seenArr.map(String)));
      } catch {}
    }
    readState();
    window.addEventListener('hnhired:hidden-changed', readState);
    window.addEventListener('hnhired:saved-changed', readState);
    window.addEventListener('hnhired:seen-changed', readState);
    return () => {
      window.removeEventListener('hnhired:hidden-changed', readState);
      window.removeEventListener('hnhired:saved-changed', readState);
      window.removeEventListener('hnhired:seen-changed', readState);
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || nextOffset == null || savedOnly) return;
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
  }, [filters, loading, nextOffset, savedOnly]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || nextOffset == null || savedOnly) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, nextOffset, savedOnly]);

  const visible = useMemo(() => {
    let list = items;
    if (savedOnly) list = list.filter((r) => savedIds.has(String(r.post_raw_id)));
    if (hideSeen) list = list.filter((r) => !seenIds.has(String(r.post_raw_id)));
    return list;
  }, [items, savedOnly, savedIds, hideSeen, seenIds]);

  const displayTotal = savedOnly ? savedIds.size : (total ?? visible.length);

  return (
    <>
      <div className="flex items-center gap-2 px-1 pt-3.5 pb-[18px] border-b border-border-c text-[12.5px] text-fg">
        <span>
          <strong className="font-mono font-medium text-[13px] tracking-[-0.01em]">{displayTotal}</strong>{' '}
          listings
        </span>
        <LayoutToggle initial={layout} onChange={setLayout} />
      </div>

      {isPending ? (
        layout === 'rows' ? (
          <div className="flex flex-col" aria-busy="true" aria-live="polite">
            {Array.from({ length: 6 }).map((_, i) => <JobRowSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3 pt-3" aria-busy="true" aria-live="polite">
            {Array.from({ length: 8 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        )
      ) : visible.length === 0 ? (
        <div className="py-24 px-5 text-center border border-dashed border-border-c rounded-[12px] mt-5">
          <div className="text-[15px] font-medium mb-1.5">No matches</div>
          <div className="text-fg-muted">Try clearing filters.</div>
        </div>
      ) : layout === 'rows' ? (
        <div className="flex flex-col">
          {visible.map((row) => (
            <JobRow key={String(row.post_raw_id)} row={row} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3 pt-3">
          {visible.map((row) => (
            <JobCard key={String(row.post_raw_id)} row={row} />
          ))}
        </div>
      )}

      {!savedOnly && nextOffset != null && (
        <div ref={sentinelRef} aria-busy={loading} aria-live="polite">
          {loading ? (
            layout === 'rows' ? (
              <div className="flex flex-col">
                {[0, 1, 2].map((i) => <JobRowSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3 pt-3">
                {[0, 1, 2, 3].map((i) => <JobCardSkeleton key={i} />)}
              </div>
            )
          ) : (
            <div className="h-6" />
          )}
        </div>
      )}
      {error && (
        <div className="mt-3 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-[14px] py-[7px] border border-border-c rounded-[7px] text-[13px] font-medium text-fg bg-surface cursor-pointer hover:bg-hover hover:border-border-strong active:translate-y-[0.5px] transition-colors duration-100"
            onClick={loadMore}
          >
            Retry ({error})
          </button>
        </div>
      )}
      {!savedOnly && nextOffset == null && items.length > 0 && (
        <div className="text-fg-muted font-mono tracking-[-0.01em] py-6 text-center text-xs">
          No more results.
        </div>
      )}
    </>
  );
}
