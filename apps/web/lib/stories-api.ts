import { query } from './db';

export type StoryMonth = {
  /** YYYY-MM string used as the URL param value, e.g. "2026-05" */
  id: string;
  /** Human-readable label, e.g. "May 2026" */
  label: string;
  /** HN story item ID */
  hn_item_id: number;
};

const MONTH_LABELS: Record<number, string> = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec',
};

/**
 * Returns all ingested HN "Who is hiring?" threads, newest first.
 * Used to populate the Month filter chip in FilterBar.
 */
export async function getAvailableMonths(): Promise<StoryMonth[]> {
  const rows = await query<{ hn_item_id: string | number; month: string | Date }>(
    `SELECT hn_item_id, month FROM stories ORDER BY month DESC`,
    [],
  );
  return rows.map((r) => {
    const d = new Date(r.month);
    const year = d.getUTCFullYear();
    const mon = d.getUTCMonth() + 1;
    const id = `${year}-${String(mon).padStart(2, '0')}`;
    const label = `${MONTH_LABELS[mon]} ${year}`;
    return { id, label, hn_item_id: Number(r.hn_item_id) };
  });
}
