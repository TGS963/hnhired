'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JobRow, { type JobCardRow } from './JobRow';
import JobCard from './JobCard';
import LayoutToggle, { type Layout } from './LayoutToggle';

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

  const now = new Date();
  const monthStr = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="hn-filters-meta">
        <span className="hn-count">
          <strong>{visible.length}</strong>
          {total != null && (
            <>
              {' '}
              <span className="hn-muted">of {total}</span>
            </>
          )}{' '}
          listings
        </span>
        <span className="hn-dot-sep">·</span>
        <span className="hn-muted">{monthStr}</span>
        <LayoutToggle initial={layout} onChange={setLayout} />
      </div>

      {visible.length === 0 ? (
        <div className="hn-empty">
          <div className="hn-empty-title">No matches</div>
          <div className="hn-muted">Try clearing filters.</div>
        </div>
      ) : layout === 'rows' ? (
        <div className="hn-list">
          {visible.map((row) => (
            <JobRow key={String(row.post_raw_id)} row={row} />
          ))}
        </div>
      ) : (
        <div className="hn-grid">
          {visible.map((row) => (
            <JobCard key={String(row.post_raw_id)} row={row} />
          ))}
        </div>
      )}

      {!savedOnly && nextOffset != null && (
        <div
          ref={sentinelRef}
          className="hn-muted hn-mono"
          style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px' }}
        >
          {loading ? 'Loading…' : ''}
        </div>
      )}
      {error && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button type="button" className="hn-btn" onClick={loadMore}>
            Retry ({error})
          </button>
        </div>
      )}
      {!savedOnly && nextOffset == null && items.length > 0 && (
        <div className="hn-muted hn-mono" style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px' }}>
          No more results.
        </div>
      )}
    </>
  );
}
