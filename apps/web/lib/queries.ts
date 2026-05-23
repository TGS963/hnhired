import { query } from './db';
import { FILTER_KEYS } from './filter-keys';
import type { Post } from './schemas';

const ALLOWED = new Set<string>([...FILTER_KEYS, 'q', 'nl']);
const CONTRACT_TYPES = new Set(['fulltime', 'parttime', 'contract', 'intern']);

export const BROWSE_PAGE_SIZE = 30;

/**
 * buildWhere returns:
 *  - where: SQL WHERE clauses
 *  - vals: bound parameter values
 *  - multiKeywordRankExpr: optional ORDER BY expression for multi-keyword AND-before-OR ranking.
 *    Uses the same $N placeholders already bound in WHERE — no double-binding needed.
 */
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
        const terms = raw.split(',').map((s) => s.trim()).filter(Boolean);
        // Guard: q=',' or q=' , ,' produces no terms — skip to avoid invalid SQL
        if (terms.length === 0) break;
        if (terms.length === 1) {
          // Single term: simple ILIKE, no ranking needed
          where.push(`raw_text ILIKE '%' || ${bind(terms[0])} || '%'`);
        } else {
          // Multi-term: OR filter in WHERE, rank by how many terms match.
          // We bind each term once here; the same $N refs are reused in ORDER BY.
          const termBinds = terms.map((t) => bind(t));
          const ilikeClauses = termBinds.map((b) => `raw_text ILIKE '%' || ${b} || '%'`);

          // WHERE: any term must match (OR)
          where.push(`(${ilikeClauses.join(' OR ')})`);

          // ORDER BY rank expression: sum of individual CASE hits (AND matches = higher score)
          const rankCases = termBinds.map((b) => `(CASE WHEN raw_text ILIKE '%' || ${b} || '%' THEN 1 ELSE 0 END)`);
          multiKeywordRankExpr = rankCases.join(' + ');
        }
        break;
      }
      case 'contract':
        if (CONTRACT_TYPES.has(raw)) where.push(`contract_type = ${bind(raw)}`);
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

  // When multiple keywords are used, rank AND-matches above OR-matches,
  // then fall back to recency. Single-term and filter-only queries use recency only.
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
