import type { MetadataRoute } from 'next';
import { query } from '@/lib/db';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/match`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];

  try {
    const rows = await query<{ post_raw_id: number; posted_at: string | Date | null }>(
      `SELECT post_raw_id, posted_at
         FROM posts
        WHERE posted_at > NOW() - INTERVAL '120 days'
        ORDER BY posted_at DESC
        LIMIT 5000`,
    );
    for (const r of rows) {
      base.push({
        url: `${SITE_URL}/job/${r.post_raw_id}`,
        lastModified: r.posted_at ? new Date(r.posted_at) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch {
    // DB unavailable at build time — return the static entries only.
  }

  return base;
}
