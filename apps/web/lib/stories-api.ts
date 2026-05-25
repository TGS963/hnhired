import { unstable_cache } from 'next/cache';
import { query } from './db';

export type StoryMonth = {
  /** YYYY-MM string used as the URL param value, e.g. "2026-05" */
  id: string;
  /** Human-readable label, e.g. "May 2026" */
  label: string;
};

const MONTH_LABELS: Record<number, string> = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec',
};

// One option per hiring-thread month, newest first, de-duplicated by YYYY-MM.
export async function getAvailableMonths(): Promise<StoryMonth[]> {
  const rows = await query<{ month: string | Date }>(
    `SELECT DISTINCT ON (date_trunc('month', month)) month
       FROM stories
      WHERE thread_type = 'hiring'
      ORDER BY date_trunc('month', month) DESC`,
    [],
  );
  return rows.map((r) => {
    const d = new Date(r.month);
    const year = d.getUTCFullYear();
    const mon = d.getUTCMonth() + 1;
    const id = `${year}-${String(mon).padStart(2, '0')}`;
    const label = `${MONTH_LABELS[mon]} ${year}`;
    return { id, label };
  });
}

// Returns tags in their stored mixed-case (e.g. "Go", "AWS") for display;
// the `tech` filter itself matches case-insensitively, so casing here is
// cosmetic only.
const MIN_POSTS_PER_STACK_TAG = 5;
const MAX_STACK_TAGS_IN_FILTER = 40;
const STACK_FACETS_REVALIDATE_SECONDS = 3600;

export const getStackFacetsByPopularity = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await query<{ tech: string }>(
      `SELECT tech FROM (
         SELECT tech, COUNT(*) AS n
           FROM posts, unnest(tech_stack) AS tech
          WHERE tech_stack IS NOT NULL
          GROUP BY tech
         HAVING COUNT(*) >= $1
          ORDER BY n DESC
          LIMIT $2
       ) t
       ORDER BY n DESC`,
      [MIN_POSTS_PER_STACK_TAG, MAX_STACK_TAGS_IN_FILTER],
    );
    return rows.map((r) => r.tech);
  },
  ['stack-facets'],
  { revalidate: STACK_FACETS_REVALIDATE_SECONDS },
);
