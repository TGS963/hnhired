'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export type JobCardRow = {
  post_raw_id: string | number;
  company?: string | null;
  role_titles?: string[] | null;
  locations?: string[] | null;
  remote_policy?: string | null;
  currency?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  posted_at?: string | null;
  tech_stack?: string[] | null;
  summary_1line?: string | null;
};

export function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

export function formatSalary(row: JobCardRow): string | null {
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
  return `up to ${k(row.salary_max as number)}`;
}

function readIdSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as Array<string | number>) : [];
    return new Set(arr.map((x) => String(x)));
  } catch {
    return new Set();
  }
}

function writeIdSet(key: string, set: Set<string>) {
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]));
  } catch {}
}

export function useSeen(id: string) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const sync = () => setSeen(readIdSet('hnhired:seen').has(id));
    sync();
    window.addEventListener('hnhired:seen-changed', sync);
    return () => window.removeEventListener('hnhired:seen-changed', sync);
  }, [id]);
  const markSeen = () => {
    const set = readIdSet('hnhired:seen');
    if (!set.has(id)) {
      set.add(id);
      writeIdSet('hnhired:seen', set);
      window.dispatchEvent(new Event('hnhired:seen-changed'));
    }
  };
  return { seen, markSeen };
}

export function useSaved(id: string) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const sync = () => setSaved(readIdSet('hnhired:saved').has(id));
    sync();
    window.addEventListener('hnhired:saved-changed', sync);
    return () => window.removeEventListener('hnhired:saved-changed', sync);
  }, [id]);
  const toggleSaved = () => {
    const set = readIdSet('hnhired:saved');
    if (set.has(id)) set.delete(id);
    else set.add(id);
    writeIdSet('hnhired:saved', set);
    window.dispatchEvent(new Event('hnhired:saved-changed'));
  };
  return { saved, toggleSaved };
}

export default function JobRow({
  row,
  whyLabel,
  why,
  rank,
}: {
  row: JobCardRow;
  whyLabel?: string;
  why?: string | null;
  rank?: number;
}) {
  const id = String(row.post_raw_id);
  const { seen, markSeen } = useSeen(id);
  const { saved, toggleSaved } = useSaved(id);

  const role = row.role_titles?.[0] ?? '';
  const more = (row.role_titles?.length ?? 0) > 1 ? ` +${(row.role_titles?.length ?? 0) - 1}` : '';
  const locs = (row.locations ?? []).slice(0, 2).join(' · ');
  const remote = row.remote_policy ? row.remote_policy.toLowerCase() : null;
  const sal = formatSalary(row);
  const tech = row.tech_stack ?? [];
  const techShown = tech.slice(0, 4);
  const techMore = tech.length - techShown.length;

  return (
    <Link
      href={`/job/${id}`}
      onClick={markSeen}
      className={`hn-row${seen ? ' is-seen' : ''}`}
    >
      <div className="hn-row-main">
        <div className="hn-row-title">
          {rank != null && <span className="hn-mono hn-muted">#{rank}</span>}
          <span className="hn-company">{row.company ?? 'Unknown'}</span>
          <span className="hn-muted hn-role">
            {role}
            {more}
          </span>
        </div>
        {row.summary_1line && <div className="hn-row-summary">{row.summary_1line}</div>}
        {why && (
          <div className="hn-row-summary">
            <em>{whyLabel ?? 'why'}:</em> {why}
          </div>
        )}
      </div>
      <div className="hn-row-meta">
        {remote && <span className={`hn-tag-${remote}`}>{remote}</span>}
        {locs && <span className="hn-muted">{locs}</span>}
        {sal && <span className="hn-mono hn-sal">{sal}</span>}
      </div>
      <div className="hn-row-stack">
        {techShown.map((t) => (
          <span key={t} className="hn-tech">
            {t}
          </span>
        ))}
        {techMore > 0 && <span className="hn-tech">+{techMore}</span>}
      </div>
      <div className="hn-row-side">
        <span className="hn-mono hn-muted hn-time">{relativeTime(row.posted_at)}</span>
        <button
          type="button"
          className={`hn-icon-btn${saved ? ' is-saved' : ''}`}
          aria-label={saved ? 'Unsave' : 'Save'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSaved();
          }}
        >
          {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
      </div>
    </Link>
  );
}
