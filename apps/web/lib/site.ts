export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://hnhired.vercel.app';

export const SITE_NAME = 'HN Hired';
export const SITE_DESCRIPTION =
  'Browse and search Hacker News "Who is hiring" job posts. Filter by remote, salary, stack, seniority. AI-summarized listings, résumé-matched rankings, and tailored outreach drafts.';
