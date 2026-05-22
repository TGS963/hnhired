import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import type { Post } from '@/lib/schemas';
import DraftPanel from '@/components/DraftPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      <Link href="/" className="inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Back to browse
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{p.company ?? 'Unknown company'}</h1>
        {roleTitle && <p className="text-lg text-muted-foreground">{roleTitle}</p>}
      </header>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {posted && <span>{posted}</span>}
        {posted && (locations || p.remote_policy || p.contract_type || salary) && (
          <span>·</span>
        )}
        {locations && <span>{locations}</span>}
        {p.remote_policy && <Badge variant="outline">{p.remote_policy}</Badge>}
        {p.contract_type && <Badge variant="secondary">{p.contract_type}</Badge>}
        {salary && <Badge>{salary}</Badge>}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <a
            href={`https://news.ycombinator.com/item?id=${p.post_raw_id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Hacker News
          </a>
        </Button>
        {p.apply_url && (
          <Button asChild>
            <a href={p.apply_url} target="_blank" rel="noopener noreferrer">
              Apply
            </a>
          </Button>
        )}
        {p.apply_email && (
          <Button asChild>
            <a href={`mailto:${p.apply_email}`}>Email {p.apply_email}</a>
          </Button>
        )}
      </div>

      <DraftPanel
        postRawId={Number(p.post_raw_id)}
        applyEmail={p.apply_email}
        applyUrl={p.apply_url}
      />

      {techStack.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tech stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {seniority.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Seniority
          </h2>
          <div className="flex flex-wrap gap-2">
            {seniority.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {(p.visa_sponsorship === true || p.visa_sponsorship === false || p.equity === true || p.equity === false) && (
        <section className="flex flex-wrap gap-2">
          {p.visa_sponsorship === true && <Badge>Visa sponsorship</Badge>}
          {p.visa_sponsorship === false && <Badge variant="destructive">No visa sponsorship</Badge>}
          {p.equity === true && <Badge>Equity offered</Badge>}
          {p.equity === false && <Badge variant="destructive">No equity</Badge>}
        </section>
      )}

      {p.summary_1line && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Summary
          </h2>
          <p>{p.summary_1line}</p>
        </section>
      )}

      {p.raw_text && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Original HN comment
          </h2>
          <pre className="whitespace-pre-wrap border-l-2 border-border pl-4 font-sans text-sm text-muted-foreground">
            {p.raw_text}
          </pre>
        </section>
      )}
    </div>
  );
}
