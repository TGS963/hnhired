'use client';

import { useState } from 'react';
import Link from 'next/link';
import ResumeEditor from '@/components/ResumeEditor';
import { useResume } from '@/lib/useResume';
import type { JobCardRow } from '@/components/JobCard';

type MatchResult = JobCardRow & {
  fit_note: string;
};

function formatSalary(row: JobCardRow): string | null {
  if (row.salary_min == null && row.salary_max == null) return null;
  const sym =
    row.currency === 'USD'
      ? '$'
      : row.currency === 'EUR'
        ? '€'
        : row.currency === 'GBP'
          ? '£'
          : row.currency
            ? `${row.currency} `
            : '$';
  const k = (n: number) => `${sym}${Math.round(n / 1000)}k`;
  if (row.salary_min != null && row.salary_max != null) {
    return `${sym}${Math.round(row.salary_min / 1000)}–${Math.round(row.salary_max / 1000)}k`;
  }
  if (row.salary_min != null) return `${k(row.salary_min)}+`;
  if (row.salary_max != null) return `up to ${k(row.salary_max)}`;
  return null;
}

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
    <div className="hn-match">
      <div className="hn-match-head">
        <h1>Résumé Match</h1>
        <p>
          Save your résumé below. We rank the current month&apos;s HN postings by fit. Your résumé
          is also used by the per-job draft tool on each listing.
        </p>
      </div>

      <ResumeEditor />

      <div className="hn-match-actions">
        <button className="hn-btn hn-btn-primary" disabled={!canSubmit} onClick={handleMatch}>
          {loading ? 'Matching…' : 'Find matches'}
        </button>
        {!hasResume && (
          <span className="hn-muted hn-mono" style={{ fontSize: '12px' }}>
            Save a résumé (≥100 chars) first.
          </span>
        )}
      </div>

      {error && (
        <div
          className="hn-detail-summary"
          style={{ borderLeftColor: 'var(--destructive)', marginTop: '16px' }}
        >
          <span className="hn-detail-summary-tag">Error</span>
          <p>{error}</p>
        </div>
      )}

      {results && results.length === 0 && !error && (
        <p className="hn-muted" style={{ marginTop: '16px', fontSize: '13px' }}>
          No matches found.
        </p>
      )}

      {results && results.length > 0 && (
        <div className="hn-list" style={{ marginTop: '24px' }}>
          {results.map((r, idx) => {
            const salary = formatSalary(r);
            const locs = r.locations?.length ? r.locations.join(' · ') : null;
            const remote = r.remote_policy ?? null;
            return (
              <Link
                key={`${r.post_raw_id}-${idx}`}
                href={`/job/${r.post_raw_id}`}
                className="hn-match-row"
              >
                <span className="hn-match-rank hn-mono">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="hn-match-body">
                  <div className="hn-row-title">
                    <span className="hn-company">{r.company ?? 'Unknown'}</span>
                    {r.role_titles?.[0] && <span className="hn-role">{r.role_titles[0]}</span>}
                  </div>
                  {r.fit_note && <p className="hn-match-fit">{r.fit_note}</p>}
                  <div className="hn-match-meta hn-row-meta">
                    {remote && (
                      <span className={`hn-tag-${remote.toLowerCase()}`}>{remote}</span>
                    )}
                    {locs && <span>{locs}</span>}
                    {salary && <span className="hn-mono hn-sal">{salary}</span>}
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
