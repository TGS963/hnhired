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
      className={`bg-surface border border-border-c rounded-xl p-4 flex flex-col gap-2.5 cursor-pointer transition-all duration-150 hover:border-border-strong${seen ? ' opacity-55 hover:opacity-100' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="font-semibold text-[14.5px] tracking-[-0.01em] text-fg">
            {rank != null && <span className="font-mono tracking-[-0.01em] text-fg-muted">#{rank} </span>}
            {row.company ?? 'Unknown'}
          </div>
          <div className="text-fg-muted text-[13px] font-normal">
            {role}
            {more}
          </div>
        </div>
        <button
          type="button"
          className={`w-7 h-7 rounded-[6px] inline-flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors hover:bg-hover ${saved ? 'text-brand hover:text-brand' : 'text-fg-muted hover:text-fg'}`}
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
      {row.summary_1line && <p className="text-[13px] text-fg-muted m-0 leading-normal overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{row.summary_1line}</p>}
      {why && (
        <p className="text-[13px] text-fg-muted m-0 leading-normal overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
          <em>{whyLabel ?? 'why'}:</em> {why}
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-xs items-center">
        {remote && <span className={`hn-tag-${remote}`}>{remote}</span>}
        {locs && <span className="text-fg-muted">{locs}</span>}
        {sal && <span className="font-mono tracking-[-0.01em] text-[12.5px] text-fg">{sal}</span>}
      </div>
      <div className="flex justify-between items-end gap-2 border-t border-border-c pt-2.5 mt-1">
        <div className="flex flex-wrap gap-1">
          {techShown.map((t) => (
            <span key={t} className="font-mono text-[11px] px-1.5 py-0.5 bg-tag-bg text-tag-fg rounded-[4px] tracking-normal font-normal whitespace-nowrap">
              {t}
            </span>
          ))}
          {techMore > 0 && <span className="font-mono text-[11px] px-1.5 py-0.5 bg-tag-bg text-tag-fg rounded-[4px] tracking-normal font-normal whitespace-nowrap">+{techMore}</span>}
        </div>
        <div className="flex flex-col items-end gap-1 text-xs shrink-0">
          <span className="font-mono tracking-[-0.01em] text-xs text-fg-muted">{relativeTime(row.posted_at)}</span>
        </div>
      </div>
    </Link>
  );
}
