import { Type } from '@google/genai';
import { query } from './db';
import { filterClause } from './queries';
import { generateJson, embedText } from './gemini';
import { FilterSpec, type Post } from './schemas';

// FilterBar dimensions that override LLM inference when set explicitly.
export const EXPLICIT_DIMS = ['remote', 'loc', 'seniority', 'tech', 'comp_min', 'contract', 'month'] as const;

const filterSpecGeminiSchema = {
  type: Type.OBJECT,
  properties: {
    remote_policy: { type: Type.STRING, enum: ['remote', 'hybrid', 'onsite'] },
    locations_any: { type: Type.ARRAY, items: { type: Type.STRING } },
    seniority_any: { type: Type.ARRAY, items: { type: Type.STRING } },
    tech_any: { type: Type.ARRAY, items: { type: Type.STRING } },
    contract_type: {
      type: Type.STRING,
      enum: ['fulltime', 'parttime', 'contract', 'intern'],
    },
    salary_min: { type: Type.NUMBER },
    visa_sponsorship: { type: Type.BOOLEAN },
    equity: { type: Type.BOOLEAN },
    semantic_query: { type: Type.STRING },
    keyword: { type: Type.STRING },
  },
};

function vecLit(v: number[]): string {
  return '[' + v.join(',') + ']';
}

export async function nlSearch(
  q: string,
  explicit?: URLSearchParams,
): Promise<{ posts: Post[] }> {
  const rawSpec = await generateJson<unknown>(
    `Translate this natural-language job search into a FilterSpec JSON.\n\nQuery: ${q}`,
    filterSpecGeminiSchema,
    {
      system:
        'You convert candidate queries into structured FilterSpec filters. Only emit fields present in the schema. Omit anything you are not confident about.',
    },
  );

  const spec = FilterSpec.parse(rawSpec);

  const where: string[] = [];
  const vals: any[] = [];
  const bind = (v: any) => {
    vals.push(v);
    return `$${vals.length}`;
  };

  // Only dimensions that yield a real clause count as overridden, so remote=any
  // ("no filter") still lets LLM inference apply for that dimension.
  const overridden = new Set<string>();
  if (explicit) {
    for (const key of EXPLICIT_DIMS) {
      const raw = explicit.get(key);
      if (!raw) continue;
      const clause = filterClause(key, raw, bind);
      if (clause) {
        where.push(clause);
        overridden.add(key);
      }
    }
  }

  if (!overridden.has('remote') && spec.remote_policy)
    where.push(`remote_policy = ${bind(spec.remote_policy)}`);
  if (!overridden.has('loc') && spec.locations_any?.length)
    where.push(`locations && ${bind(spec.locations_any)}::text[]`);
  if (!overridden.has('seniority') && spec.seniority_any?.length)
    where.push(`seniority && ${bind(spec.seniority_any)}::text[]`);
  if (!overridden.has('tech') && spec.tech_any?.length)
    where.push(`tech_stack && ${bind(spec.tech_any)}::text[]`);
  if (!overridden.has('contract') && spec.contract_type)
    where.push(`contract_type = ${bind(spec.contract_type)}`);
  if (!overridden.has('comp_min') && typeof spec.salary_min === 'number')
    where.push(`salary_min >= ${bind(spec.salary_min)}`);
  // visa / equity have no FilterBar UI — always use LLM inference
  if (typeof spec.visa_sponsorship === 'boolean')
    where.push(`visa_sponsorship = ${bind(spec.visa_sponsorship)}`);
  if (typeof spec.equity === 'boolean')
    where.push(`equity = ${bind(spec.equity)}`);
  if (spec.keyword)
    where.push(`raw_text ILIKE '%' || ${bind(spec.keyword)} || '%'`);

  let orderBy = 'posted_at DESC';
  if (spec.semantic_query) {
    const emb = await embedText(spec.semantic_query);
    const p = bind(vecLit(emb));
    orderBy = `embedding <=> ${p}::vector`;
  }

  const sql = `
    SELECT * FROM posts
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${orderBy}
    LIMIT 20
  `;
  const posts = await query<Post>(sql, vals);

  return { posts };
}
