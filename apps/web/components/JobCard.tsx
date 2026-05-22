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
};

function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function formatSalary(row: JobCardRow): string | null {
  if (row.salary_min == null && row.salary_max == null) return null;
  const cur = row.currency ?? '';
  const lo = row.salary_min != null ? row.salary_min.toLocaleString() : '?';
  const hi = row.salary_max != null ? row.salary_max.toLocaleString() : '?';
  return `${cur} ${lo}–${hi}`.trim();
}

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
  const title = row.role_titles?.[0] ?? '';
  const loc = (row.locations ?? []).join(', ');
  const salary = formatSalary(row);
  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-4 hover:bg-neutral-50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {rank != null && (
            <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
              #{rank}
            </span>
          )}
          <div className="font-bold text-neutral-900">{row.company ?? 'Unknown'}</div>
        </div>
        {row.remote_policy ? (
          <span className="rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700">
            {row.remote_policy}
          </span>
        ) : null}
      </div>
      {title ? <div className="text-sm text-neutral-800">{title}</div> : null}
      {loc ? <div className="text-xs text-neutral-600">{loc}</div> : null}
      {salary ? <div className="text-xs text-neutral-700">{salary}</div> : null}
      <div className="text-xs text-neutral-500">{relativeTime(row.posted_at)}</div>
      {row.tech_stack && row.tech_stack.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {row.tech_stack.slice(0, 5).map((t) => (
            <span
              key={t}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
      {why ? (
        <div className="text-xs italic text-neutral-600">
          {whyLabel ?? 'why this matched'}: {why}
        </div>
      ) : null}
      <a
        href={`/job/${id}`}
        className="mt-1 inline-block text-sm font-medium text-neutral-900 underline hover:text-neutral-700"
      >
        View
      </a>
    </div>
  );
}
