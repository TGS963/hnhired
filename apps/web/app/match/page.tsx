'use client';

import { useState } from 'react';
import Link from 'next/link';
import ResumeEditor from '@/components/ResumeEditor';
import { useResume } from '@/lib/useResume';
import type { JobCardRow } from '@/components/JobCard';
import { formatSalary } from '@/lib/salary';

type MatchResult = JobCardRow & {
  fit_note: string;
};

export default function MatchPage() {
  const { resume, hydrated } = useResume();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasResume = resume.trim().length >= 100;
  const canSubmit = hasResume && !loading;

  async function handleMatch() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, consent: true }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          const retry = res.headers.get('Retry-After');
          let seconds = retry ? parseInt(retry, 10) : NaN;
          if (!Number.isFinite(seconds)) {
            try {
              const body = await res.json();
              if (typeof body?.retry_after === 'number') seconds = body.retry_after;
            } catch {}
          }
          setError(
            Number.isFinite(seconds)
              ? `Rate limit hit, try again in ${seconds} seconds`
              : 'Rate limit hit, try again shortly',
          );
        } else {
          let msg = `Request failed (${res.status})`;
          try {
            const body = await res.json();
            if (body?.error) msg = body.error;
          } catch {}
          setError(msg);
        }
        return;
      }
      const data = await res.json();
      const items: MatchResult[] = Array.isArray(data) ? data : (data?.results ?? []);
      setResults(items.slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] mt-0 mb-2">Résumé Match</h1>
        <p className="text-fg-muted text-sm m-0 leading-normal">
          Save your résumé below. We rank the current month&apos;s HN postings by fit. Your résumé
          is also used by the per-job draft tool on each listing.
        </p>
      </div>

      <ResumeEditor />

      <div className="flex items-center gap-3 mt-3">
        <button
          className="inline-flex items-center gap-1.5 px-[14px] py-[7px] border border-brand rounded-[7px] text-[13px] font-medium text-brand-contrast bg-brand cursor-pointer transition-colors duration-100 hover:bg-brand-hover hover:border-brand-hover active:translate-y-[0.5px] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canSubmit}
          onClick={handleMatch}
        >
          {loading ? 'Matching…' : 'Find matches'}
        </button>
        {!hasResume && (
          <span className="text-fg-muted font-mono tracking-[-0.01em] text-xs">
            Save a résumé (≥100 chars) first.
          </span>
        )}
      </div>

      {error && (
        <div className="relative bg-bg-2 border-l-2 border-destructive my-0 mt-4 mb-6 px-5 py-4 rounded-r-lg">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.05em] text-brand mb-1.5">
            Error
          </span>
          <p className="m-0 text-[15px] leading-[1.55] text-fg">{error}</p>
        </div>
      )}

      {results && results.length === 0 && !error && (
        <p className="text-fg-muted mt-4 text-[13px]">No matches found.</p>
      )}

      {results && results.length > 0 && (
        <div className="flex flex-col mt-6">
          {results.map((r, idx) => {
            const salary = formatSalary(r);
            const locs = r.locations?.length ? r.locations.join(' · ') : null;
            const remote = r.remote_policy ?? null;
            return (
              <Link
                key={`${r.post_raw_id}-${idx}`}
                href={`/job/${r.post_raw_id}`}
                className="flex items-start gap-4 px-2 py-4 border-b border-row-divider cursor-pointer hover:bg-hover transition-colors duration-100"
              >
                <span className="font-mono tracking-[-0.01em] text-[11px] text-fg-faint pt-[3px] flex-shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2.5 mb-1 flex-wrap">
                    <span className="font-semibold text-[14.5px] tracking-[-0.01em] text-fg">{r.company ?? 'Unknown'}</span>
                    {r.role_titles?.[0] && <span className="text-[13px] font-normal text-fg-muted">{r.role_titles[0]}</span>}
                  </div>
                  {r.fit_note && <p className="text-[13px] text-brand my-1.5 line-clamp-2">{r.fit_note}</p>}
                  <div className="mt-1 flex items-center gap-2 flex-wrap text-[12.5px] min-w-0 text-fg-muted">
                    {remote && (
                      <span className={`hn-tag-${remote.toLowerCase()}`}>{remote}</span>
                    )}
                    {locs && <span>{locs}</span>}
                    {salary && <span className="font-mono tracking-[-0.01em] text-fg">{salary}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
