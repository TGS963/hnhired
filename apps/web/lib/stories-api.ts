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
