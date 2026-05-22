import Link from 'next/link';
import DraftPanel from './DraftPanel';
import ModalCloseButton from './ModalCloseButton';
import type { FullPost } from '@/lib/posts';
import { SITE_URL } from '@/lib/site';

function formatDate(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatSalary(p: FullPost): string | null {
  const min = p.salary_min;
  const max = p.salary_max;
  const currency = p.salary_currency ?? 'USD';
  if (min == null && max == null) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  if (min != null && max != null) return `${fmt(Number(min))} – ${fmt(Number(max))}`;
  if (min != null) return `From ${fmt(Number(min))}`;
  return `Up to ${fmt(Number(max))}`;
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
            currency: p.salary_currency ?? 'USD',
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

  const body = (
    <>
      <header className="hn-detail-head">
        <h1 className="hn-detail-company">{p.company ?? 'Unknown company'}</h1>
        {role && <p className="hn-detail-role">{role}</p>}
      </header>

      {p.summary_1line && (
        <aside className="hn-detail-summary">
          <span className="hn-detail-summary-tag">◇ AI summary</span>
          <p>{p.summary_1line}</p>
        </aside>
      )}

      <div className="hn-detail-actions">
        {p.apply_url && (
          <a
            className="hn-btn hn-btn-primary"
            href={p.apply_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Apply
          </a>
        )}
        {p.apply_email && (
          <a className="hn-btn" href={`mailto:${p.apply_email}`}>
            Email
          </a>
        )}
        <a
          className="hn-btn"
          href={`https://news.ycombinator.com/item?id=${postRawId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on HN
        </a>
      </div>

      <dl className="hn-detail-grid">
        {locations && (
          <div className="hn-field">
            <dt>Location</dt>
            <dd>{locations}</dd>
          </div>
        )}
        {p.remote_policy && (
          <div className="hn-field">
            <dt>Remote</dt>
            <dd>
              <span className={`hn-tag-${p.remote_policy}`}>{p.remote_policy}</span>
            </dd>
          </div>
        )}
        {salary && (
          <div className="hn-field">
            <dt>Comp</dt>
            <dd>
              <span className="hn-mono">{salary}</span>
            </dd>
          </div>
        )}
        {(p.equity === true || p.equity === false) && (
          <div className="hn-field">
            <dt>Equity</dt>
            <dd>{p.equity ? 'Yes' : 'No'}</dd>
          </div>
        )}
        {(p.visa_sponsorship === true || p.visa_sponsorship === false) && (
          <div className="hn-field">
            <dt>Visa</dt>
            <dd>{p.visa_sponsorship ? 'Yes' : 'No'}</dd>
          </div>
        )}
        {p.contract_type && (
          <div className="hn-field">
            <dt>Type</dt>
            <dd>{p.contract_type}</dd>
          </div>
        )}
        {seniority.length > 0 && (
          <div className="hn-field">
            <dt>Seniority</dt>
            <dd>{seniority.join(' · ')}</dd>
          </div>
        )}
        {techStack.length > 0 && (
          <div className="hn-field">
            <dt>Stack</dt>
            <dd>
              <div className="hn-detail-stack">
                {techStack.map((t) => (
                  <span key={t} className="hn-tech">
                    {t}
                  </span>
                ))}
              </div>
            </dd>
          </div>
        )}
        {posted && (
          <div className="hn-field">
            <dt>Posted</dt>
            <dd>
              <span className="hn-mono">{posted}</span>
            </dd>
          </div>
        )}
      </dl>

      {p.raw_text && (
        <details className="hn-detail-raw" open>
          <summary className="hn-detail-raw-toggle">
            <span>Original HN comment</span>
            <span className="hn-mono hn-detail-raw-hint">collapse</span>
          </summary>
          <pre className="hn-detail-raw-text">{p.raw_text}</pre>
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
        <div className="hn-detail-bar">
          <ModalCloseButton />
          <div className="hn-detail-bar-tools">
            <a href={`/job/${postRawId}`} className="hn-link">
              Open full page
            </a>
          </div>
        </div>
        <div className="hn-detail-body">
          <div className="hn-detail-wrap">{body}</div>
        </div>
      </>
    );
  }

  return (
    <div className="hn-detail-wrap">
      <Link href="/" className="hn-back">
        <span aria-hidden>←</span> Back
      </Link>
      {body}
    </div>
  );
}
