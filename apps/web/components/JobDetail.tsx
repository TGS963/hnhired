import Link from 'next/link';
import DraftPanel from './DraftPanel';
import ModalCloseButton from './ModalCloseButton';
import type { FullPost } from '@/lib/posts';
import { SITE_URL } from '@/lib/site';
import { formatSalaryFull } from '@/lib/salary';

function formatDate(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatSalary(p: FullPost): string | null {
  return formatSalaryFull({
    salary_min: p.salary_min,
    salary_max: p.salary_max,
    currency: p.currency ?? null,
  });
}

export default function JobDetail({
  post: p,
  variant,
}: {
  post: FullPost;
  variant: 'page' | 'modal';
}) {
  const roleTitles: string[] = Array.isArray(p.role_titles)
    ? p.role_titles.filter(Boolean)
    : p.role_title
      ? [String(p.role_title)]
      : [];
  const role = roleTitles.join(' / ');
  const locations = Array.isArray(p.locations) ? p.locations.filter(Boolean).join(' · ') : null;
  const techStack: string[] = Array.isArray(p.tech_stack) ? p.tech_stack : [];
  const seniority: string[] = Array.isArray(p.seniority)
    ? p.seniority
    : p.seniority
      ? [String(p.seniority)]
      : [];
  const salary = formatSalary(p);
  const posted = formatDate(p.posted_at);
  const postRawId = Number(p.post_raw_id);

  const markSeenScript = `try{var k='hnhired:seen';var cur=JSON.parse(localStorage.getItem(k)||'[]');var id=${JSON.stringify(postRawId)};if(!cur.includes(id)){cur.push(id);localStorage.setItem(k,JSON.stringify(cur));window.dispatchEvent(new Event('hnhired:seen-changed'));}}catch(e){}`;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: roleTitles[0] ?? p.company ?? 'Job posting',
    description: p.summary_1line ?? p.raw_text ?? `${p.company ?? 'Company'} hiring via HN.`,
    datePosted: p.posted_at ? new Date(p.posted_at).toISOString() : undefined,
    employmentType: p.contract_type
      ? String(p.contract_type)
          .toUpperCase()
          .replace('FULLTIME', 'FULL_TIME')
          .replace('PARTTIME', 'PART_TIME')
      : undefined,
    hiringOrganization: p.company ? { '@type': 'Organization', name: p.company } : undefined,
    jobLocationType: p.remote_policy === 'remote' ? 'TELECOMMUTE' : undefined,
    applicantLocationRequirements:
      p.remote_policy === 'remote' && Array.isArray(p.locations) && p.locations.length
        ? p.locations.map((l: string) => ({ '@type': 'Country', name: l }))
        : undefined,
    jobLocation:
      Array.isArray(p.locations) && p.locations.length
        ? p.locations.map((l: string) => ({
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: l },
          }))
        : undefined,
    baseSalary:
      p.salary_min != null || p.salary_max != null
        ? {
            '@type': 'MonetaryAmount',
            currency: p.currency ?? 'USD',
            value: {
              '@type': 'QuantitativeValue',
              minValue: p.salary_min ?? undefined,
              maxValue: p.salary_max ?? undefined,
              unitText: 'YEAR',
            },
          }
        : undefined,
    skills: techStack.length ? techStack.join(', ') : undefined,
    directApply: !!p.apply_url,
    url: `${SITE_URL}/job/${postRawId}`,
    identifier: { '@type': 'PropertyValue', name: 'HN', value: String(postRawId) },
  };

  const btnBase =
    'inline-flex items-center gap-1.5 px-[14px] py-[7px] rounded-[7px] border border-border-c text-sm font-medium text-fg bg-surface hover:bg-hover hover:border-border-strong active:translate-y-[0.5px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed';
  const btnPrimary =
    'bg-brand text-brand-contrast border-brand hover:bg-brand-hover hover:border-brand-hover';
  const fieldDt =
    'font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg-faint pt-0.5';
  const fieldDd = 'm-0 text-[13.5px] text-fg flex items-center gap-1.5 flex-wrap';
  const monoSpan = 'font-mono';

  const body = (
    <>
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] m-0 mb-1.5 leading-[1.2]">{p.company ?? 'Unknown company'}</h1>
        {role && <p className="text-[15px] text-fg-muted m-0">{role}</p>}
      </header>

      {p.summary_1line && (
        <aside className="relative bg-panel border-l-2 border-brand m-0 mb-6 px-5 py-4 rounded-r-lg">
          <span className="inline-flex items-center gap-[5px] font-mono text-[10.5px] uppercase tracking-[0.05em] text-brand mb-1.5">◇ AI summary</span>
          <p className="m-0 text-[15px] leading-[1.55] text-fg">{p.summary_1line}</p>
        </aside>
      )}

      <div className="flex gap-2 flex-wrap mb-8">
        {p.apply_url && (
          <a
            className={`${btnBase} ${btnPrimary}`}
            href={p.apply_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Apply
          </a>
        )}
        {p.apply_email && (
          <a className={btnBase} href={`mailto:${p.apply_email}`}>
            Email
          </a>
        )}
        <a
          className={btnBase}
          href={`https://news.ycombinator.com/item?id=${postRawId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on HN
        </a>
      </div>

      <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-[14px] my-0 mb-8 py-5 border-y border-border-c">
        {locations && (
          <div className="contents">
            <dt className={fieldDt}>Location</dt>
            <dd className={fieldDd}>{locations}</dd>
          </div>
        )}
        {p.remote_policy && (
          <div className="contents">
            <dt className={fieldDt}>Remote</dt>
            <dd className={fieldDd}>
              <span className={`hn-tag-${p.remote_policy}`}>{p.remote_policy}</span>
            </dd>
          </div>
        )}
        {salary && (
          <div className="contents">
            <dt className={fieldDt}>Comp</dt>
            <dd className={fieldDd}>
              <span className={monoSpan}>{salary}</span>
            </dd>
          </div>
        )}
        {(p.equity === true || p.equity === false) && (
          <div className="contents">
            <dt className={fieldDt}>Equity</dt>
            <dd className={fieldDd}>{p.equity ? 'Yes' : 'No'}</dd>
          </div>
        )}
        {(p.visa_sponsorship === true || p.visa_sponsorship === false) && (
          <div className="contents">
            <dt className={fieldDt}>Visa</dt>
            <dd className={fieldDd}>{p.visa_sponsorship ? 'Yes' : 'No'}</dd>
          </div>
        )}
        {p.contract_type && (
          <div className="contents">
            <dt className={fieldDt}>Type</dt>
            <dd className={fieldDd}>{p.contract_type}</dd>
          </div>
        )}
        {seniority.length > 0 && (
          <div className="contents">
            <dt className={fieldDt}>Seniority</dt>
            <dd className={fieldDd}>{seniority.join(' · ')}</dd>
          </div>
        )}
        {techStack.length > 0 && (
          <div className="contents">
            <dt className={fieldDt}>Stack</dt>
            <dd className={fieldDd}>
              <div className="flex flex-wrap gap-1">
                {techStack.map((t) => (
                  <span key={t} className="font-mono text-[11px] px-1.5 py-0.5 bg-tag-bg text-tag-fg rounded-[4px] font-normal whitespace-nowrap">
                    {t}
                  </span>
                ))}
              </div>
            </dd>
          </div>
        )}
        {posted && (
          <div className="contents">
            <dt className={fieldDt}>Posted</dt>
            <dd className={fieldDd}>
              <span className={monoSpan}>{posted}</span>
            </dd>
          </div>
        )}
      </dl>

      {p.raw_text && (
        <details className="mt-3" open>
          <summary className="w-full flex items-center justify-between py-2.5 text-fg-muted text-[13px] border-y border-border-c bg-transparent cursor-pointer hover:text-fg">
            <span>Original HN comment</span>
            <span className="font-mono text-fg-faint text-[11px]">collapse</span>
          </summary>
          <pre className="mt-3 mb-0 px-5 py-4 bg-panel rounded-lg font-sans text-[13px] leading-[1.55] text-fg-muted whitespace-pre-wrap break-words">{p.raw_text}</pre>
        </details>
      )}

      <DraftPanel postRawId={postRawId} applyEmail={p.apply_email} applyUrl={p.apply_url} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd, (_k, v) => (v === undefined ? undefined : v)),
        }}
      />
      <script dangerouslySetInnerHTML={{ __html: markSeenScript }} />
    </>
  );

  if (variant === 'modal') {
    return (
      <>
        <div className="flex items-center justify-between h-14 pl-3 pr-4 border-b border-border-c flex-shrink-0">
          <ModalCloseButton />
          <div className="flex items-center gap-2.5">
            <a
              href={`/job/${postRawId}`}
              className="inline-flex items-center gap-1.5 text-fg-muted text-[13px] hover:text-fg transition-colors duration-100"
            >
              Open full page
            </a>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-20 max-[720px]:px-4 max-[720px]:pb-16">
          <div className="max-w-[720px] mx-auto">{body}</div>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-fg-muted tracking-[-0.01em] mb-6 hover:text-fg transition-colors duration-100"
      >
        <span aria-hidden>←</span> Back
      </Link>
      {body}
    </div>
  );
}
