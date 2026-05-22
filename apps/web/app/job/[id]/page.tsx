import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPost } from '@/lib/posts';
import JobDetail from '@/components/JobDetail';
import { SITE_URL, SITE_NAME } from '@/lib/site';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const id = parseInt(resolved.id, 10);
  if (Number.isNaN(id)) return {};
  const p = await fetchPost(id).catch(() => null);
  if (!p) return { title: 'Job not found' };

  const roleTitles: string[] = Array.isArray(p.role_titles)
    ? p.role_titles.filter(Boolean)
    : p.role_title
      ? [String(p.role_title)]
      : [];
  const role = roleTitles[0] ?? 'Engineering role';
  const company = p.company ?? 'Hiring';
  const remote = p.remote_policy ? ` (${p.remote_policy})` : '';
  const title = `${company} — ${role}${remote}`;
  const description =
    p.summary_1line ??
    `${company} is hiring${role ? ` for ${role}` : ''} via Hacker News "Who is hiring?". View structured details, salary, tech stack, and draft outreach.`;
  const canonical = `${SITE_URL}/job/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
    },
    twitter: { card: 'summary', title, description },
    robots: { index: true, follow: true },
  };
}

export default async function JobPage({ params }: PageProps) {
  const resolved = await params;
  const id = parseInt(resolved.id, 10);
  if (Number.isNaN(id)) notFound();

  const post = await fetchPost(id);
  if (!post) notFound();

  return <JobDetail post={post} variant="page" />;
}
