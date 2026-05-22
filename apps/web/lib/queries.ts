import { query } from './db';
import type { Post } from './schemas';

const ALLOWED = new Set(['remote', 'loc', 'seniority', 'tech', 'comp_min', 'q', 'contract']);
const CONTRACT_TYPES = new Set(['fulltime', 'parttime', 'contract', 'intern']);

export const BROWSE_PAGE_SIZE = 30;

function buildWhere(params: URLSearchParams): { where: string[]; vals: any[] } {
  const where: string[] = [];
  const vals: any[] = [];
  const bind = (v: any) => {
    vals.push(v);
    return `$${vals.length}`;
  };

  for (const key of params.keys()) {
    if (!ALLOWED.has(key)) continue;
    const raw = params.get(key);
    if (raw == null || raw === '') continue;

    switch (key) {
      case 'remote':
        where.push(`remote_policy = ${bind(raw)}`);
        break;
      case 'loc':
        where.push(`locations && ${bind(raw.split(',').map((s) => s.trim()).filter(Boolean))}::text[]`);
        break;
      case 'seniority':
        where.push(`seniority && ${bind(raw.split(',').map((s) => s.trim()).filter(Boolean))}::text[]`);
        break;
      case 'tech':
        where.push(`tech_stack && ${bind(raw.split(',').map((s) => s.trim()).filter(Boolean))}::text[]`);
        break;
      case 'comp_min': {
        const n = Number(raw);
        if (Number.isFinite(n)) where.push(`salary_min >= ${bind(n)}`);
        break;
      }
      case 'q':
        where.push(`raw_text ILIKE '%' || ${bind(raw)} || '%'`);
        break;
      case 'contract':
        if (CONTRACT_TYPES.has(raw)) where.push(`contract_type = ${bind(raw)}`);
        break;
    }
  }
  return { where, vals };
}

export async function browse(
  params: URLSearchParams,
  opts: { limit?: number; offset?: number } = {},
): Promise<Post[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? BROWSE_PAGE_SIZE, 100));
  const offset = Math.max(0, opts.offset ?? 0);
  const { where, vals } = buildWhere(params);
  vals.push(limit, offset);
  const limitBind = `$${vals.length - 1}`;
  const offsetBind = `$${vals.length}`;
  const sql = `
    SELECT * FROM posts
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY posted_at DESC, post_raw_id DESC
    LIMIT ${limitBind} OFFSET ${offsetBind}
  `;
  return query<Post>(sql, vals);
}

export async function browseCount(params: URLSearchParams): Promise<number> {
  const { where, vals } = buildWhere(params);
  const sql = `
    SELECT COUNT(*)::int AS n FROM posts
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
  `;
  const rows = await query<{ n: number }>(sql, vals);
  return rows[0]?.n ?? 0;
}
