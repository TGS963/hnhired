import { query } from './db';
import { FILTER_KEYS } from './filter-keys';
import type { Post } from './schemas';

const SQL_KEYS = FILTER_KEYS.filter((k) => k !== 'saved');
const ALLOWED = new Set<string>([...SQL_KEYS, 'q']);
// YYYY-MM month format validation
const MONTH_RE = /^\d{4}-(?:0[1-9]|1[0-2])$/
const CONTRACT_TYPES = new Set(['fulltime', 'parttime', 'contract', 'intern']);

export const BROWSE_PAGE_SIZE = 30;

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

function buildWhere(params: URLSearchParams): {
  where: string[];
  vals: any[];
  multiKeywordRankExpr: string | null;
} {
  const where: string[] = [];
  const vals: any[] = [];
  let multiKeywordRankExpr: string | null = null;

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
      case 'q': {
        if (raw.length > 200) break;
        const seen = new Set<string>();
        const terms: string[] = [];
        for (const t of raw.split(',').map((s) => s.trim()).filter((s) => s.length >= 2 && s.length <= 64)) {
          const k = t.toLowerCase();
          if (seen.has(k)) continue;
          seen.add(k);
          terms.push(escapeLike(t));
          if (terms.length >= 8) break;
        }
        if (terms.length === 0) break;
        if (terms.length === 1) {
          where.push(`raw_text ILIKE '%' || ${bind(terms[0])} || '%' ESCAPE '\\'`);
        } else {
          const termBinds = terms.map((t) => bind(t));
          const rankCases = termBinds.map(
            (b) => `(CASE WHEN raw_text ILIKE '%' || ${b} || '%' ESCAPE '\\' THEN 1 ELSE 0 END)`,
          );
          const rankExpr = rankCases.join(' + ');
          where.push(`(${rankExpr}) > 0`);
          multiKeywordRankExpr = rankExpr;
        }
        break;
      }
      case 'contract':
        if (CONTRACT_TYPES.has(raw)) where.push(`contract_type = ${bind(raw)}`);
        break;
      case 'month':
        // Filter to a specific HN thread by month (YYYY-MM format)
        if (MONTH_RE.test(raw)) {
          where.push(
            `story_id = (SELECT id FROM stories WHERE date_trunc('month', month) = date_trunc('month', ${bind(raw + '-01')}::date) LIMIT 1)`,
          );
        }
        break;
    }
  }
  return { where, vals, multiKeywordRankExpr };
}

export async function browse(
  params: URLSearchParams,
  opts: { limit?: number; offset?: number } = {},
): Promise<Post[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? BROWSE_PAGE_SIZE, 100));
  const offset = Math.max(0, opts.offset ?? 0);
  const { where, vals, multiKeywordRankExpr } = buildWhere(params);
  vals.push(limit, offset);
  const limitBind = `$${vals.length - 1}`;
  const offsetBind = `$${vals.length}`;

  const orderBy = multiKeywordRankExpr
    ? `(${multiKeywordRankExpr}) DESC, posted_at DESC, post_raw_id DESC`
    : `posted_at DESC, post_raw_id DESC`;

  const sql = `
    SELECT * FROM posts
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${orderBy}
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
