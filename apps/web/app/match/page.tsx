'use client';

import { useState } from 'react';
import JobCard, { type JobCardRow } from '@/components/JobCard';
import ResumeEditor from '@/components/ResumeEditor';
import { useResume } from '@/lib/useResume';

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
      const items: MatchResult[] = Array.isArray(data) ? data : data?.results ?? [];
      setResults(items.slice(0, 20));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Résumé Match</h1>
      <p className="mt-2 text-neutral-700">
        Save your résumé below. We rank the current month&apos;s HN postings by fit. Your résumé
        is also used by the per-job draft tool on each listing.
      </p>

      <div className="mt-6">
        <ResumeEditor />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleMatch}
          disabled={!canSubmit}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {loading ? 'Matching...' : 'Find matches'}
        </button>
        {!hasResume && (
          <span className="text-xs text-neutral-500">Save a résumé (≥100 chars) first.</span>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {results && results.length === 0 && !error && (
        <p className="mt-6 text-sm text-neutral-600">No matches found.</p>
      )}

      {results && results.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((r, idx) => (
            <JobCard
              key={`${r.post_raw_id}-${idx}`}
              row={r}
              rank={idx + 1}
              whyLabel="fit"
              why={r.fit_note}
            />
          ))}
        </div>
      )}
    </div>
  );
}
