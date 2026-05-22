import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import type { Post } from '@/lib/schemas';
import DraftPanel from '@/components/DraftPanel';

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatSalary(post: Post): string | null {
  const min = (post as any).salary_min;
  const max = (post as any).salary_max;
  const currency = (post as any).salary_currency ?? 'USD';
  if (min == null && max == null) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  if (min != null && max != null) return `${fmt(Number(min))} – ${fmt(Number(max))}`;
  if (min != null) return `From ${fmt(Number(min))}`;
  return `Up to ${fmt(Number(max))}`;
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'red' | 'blue' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default async function JobPage({ params }: PageProps) {
  const resolved = await params;
  const id = parseInt(resolved.id, 10);
  if (Number.isNaN(id)) notFound();

  const result = await query<Post>('SELECT * FROM posts WHERE post_raw_id = $1 LIMIT 1', [id]);
  const post = (result as any).rows ? (result as any).rows[0] : (Array.isArray(result) ? result[0] : undefined);
  if (!post) notFound();

  const p = post as Post & Record<string, any>;

  const roleTitle = Array.isArray(p.role_titles) ? p.role_titles[0] : p.role_title ?? null;
  const locations = Array.isArray(p.locations) ? p.locations.filter(Boolean).join(' · ') : null;
  const techStack: string[] = Array.isArray(p.tech_stack) ? p.tech_stack : [];
  const seniority: string[] = Array.isArray(p.seniority)
    ? p.seniority
    : p.seniority
      ? [String(p.seniority)]
      : [];
  const salary = formatSalary(p);
  const posted = formatDate(p.posted_at);

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-block text-sm text-neutral-600 hover:text-neutral-900">
        ← Back to browse
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          {p.company ?? 'Unknown company'}
        </h1>
        {roleTitle && <p className="text-lg text-neutral-600">{roleTitle}</p>}
      </header>

      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
        {posted && <span>{posted}</span>}
        {posted && (locations || p.remote_policy || p.contract_type || salary) && <span className="text-neutral-300">·</span>}
        {locations && <span>{locations}</span>}
        {p.remote_policy && <Badge tone="blue">{p.remote_policy}</Badge>}
        {p.contract_type && <Badge>{p.contract_type}</Badge>}
        {salary && <Badge tone="green">{salary}</Badge>}
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={`https://news.ycombinator.com/item?id=${p.post_raw_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          View on Hacker News
        </a>
        {p.apply_url && (
          <a
            href={p.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Apply
          </a>
        )}
        {p.apply_email && (
          <a
            href={`mailto:${p.apply_email}`}
            className="inline-flex items-center rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Email {p.apply_email}
          </a>
        )}
      </div>

      <DraftPanel
        postRawId={Number(p.post_raw_id)}
        applyEmail={p.apply_email}
        applyUrl={p.apply_url}
      />

      {techStack.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Tech stack</h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </section>
      )}

      {seniority.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Seniority</h2>
          <div className="flex flex-wrap gap-2">
            {seniority.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </section>
      )}

      {(p.visa_sponsorship === true || p.visa_sponsorship === false || p.equity === true || p.equity === false) && (
        <section className="flex flex-wrap gap-2">
          {p.visa_sponsorship === true && <Badge tone="green">Visa sponsorship</Badge>}
          {p.visa_sponsorship === false && <Badge tone="red">No visa sponsorship</Badge>}
          {p.equity === true && <Badge tone="green">Equity offered</Badge>}
          {p.equity === false && <Badge tone="red">No equity</Badge>}
        </section>
      )}

      {p.summary_1line && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Summary</h2>
          <p className="text-base text-neutral-800">{p.summary_1line}</p>
        </section>
      )}

      {p.raw_text && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Original HN comment</h2>
          <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700 border-l-2 border-neutral-200 pl-4">
            {p.raw_text}
          </pre>
        </section>
      )}
    </div>
  );
}
