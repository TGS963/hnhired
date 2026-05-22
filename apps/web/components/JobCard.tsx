'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import {
  type JobCardRow,
  formatSalary,
  relativeTime,
  useSaved,
  useSeen,
} from './JobRow';

export type { JobCardRow };

export default function JobCard({
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
      className={`hn-card${seen ? ' is-seen' : ''}`}
    >
      <div className="hn-card-head">
        <div>
          <div className="hn-company">
            {rank != null && <span className="hn-mono hn-muted">#{rank} </span>}
            {row.company ?? 'Unknown'}
          </div>
          <div className="hn-muted hn-role">
            {role}
            {more}
          </div>
        </div>
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
      {row.summary_1line && <p className="hn-card-summary">{row.summary_1line}</p>}
      {why && (
        <p className="hn-card-summary">
          <em>{whyLabel ?? 'why'}:</em> {why}
        </p>
      )}
      <div className="hn-card-meta">
        {remote && <span className={`hn-tag-${remote}`}>{remote}</span>}
        {locs && <span className="hn-muted">{locs}</span>}
        {sal && <span className="hn-mono hn-sal">{sal}</span>}
      </div>
      <div className="hn-card-foot">
        <div className="hn-card-stack">
          {techShown.map((t) => (
            <span key={t} className="hn-tech">
              {t}
            </span>
          ))}
          {techMore > 0 && <span className="hn-tech">+{techMore}</span>}
        </div>
        <div className="hn-card-side">
          <span className="hn-mono hn-muted hn-time">{relativeTime(row.posted_at)}</span>
        </div>
      </div>
    </Link>
  );
}
