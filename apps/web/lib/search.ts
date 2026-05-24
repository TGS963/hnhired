import { Type } from '@google/genai';
import { query } from './db';
import { generateJson, embedText } from './gemini';
import { FilterSpec, type Post } from './schemas';

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

  // LLM-derived filters — skipped for any dimension the user explicitly overrode
  if (!explicit?.get('remote') && spec.remote_policy)
    where.push(`remote_policy = ${bind(spec.remote_policy)}`);
  if (!explicit?.get('loc') && spec.locations_any?.length)
    where.push(`locations && ${bind(spec.locations_any)}::text[]`);
  if (!explicit?.get('seniority') && spec.seniority_any?.length)
    where.push(`seniority && ${bind(spec.seniority_any)}::text[]`);
  if (!explicit?.get('tech') && spec.tech_any?.length)
    where.push(`tech_stack && ${bind(spec.tech_any)}::text[]`);
  if (!explicit?.get('contract') && spec.contract_type)
    where.push(`contract_type = ${bind(spec.contract_type)}`);
  if (!explicit?.get('comp_min') && typeof spec.salary_min === 'number')
    where.push(`salary_min >= ${bind(spec.salary_min)}`);
  // visa / equity have no FilterBar UI — always use LLM inference
  if (typeof spec.visa_sponsorship === 'boolean')
    where.push(`visa_sponsorship = ${bind(spec.visa_sponsorship)}`);
  if (typeof spec.equity === 'boolean')
    where.push(`equity = ${bind(spec.equity)}`);
  if (spec.keyword)
    where.push(`raw_text ILIKE '%' || ${bind(spec.keyword)} || '%'`);

  // Explicit FilterBar overrides — always applied, take priority over LLM inference
  if (explicit) {
    const CONTRACT_TYPES = new Set(['fulltime', 'parttime', 'contract', 'intern']);
    const MONTH_RE = /^\d{4}-(?:0[1-9]|1[0-2])$/;

    const rawRemote = explicit.get('remote');
    if (rawRemote && rawRemote !== 'any')
      where.push(`remote_policy = ${bind(rawRemote)}`);

    const rawLoc = explicit.get('loc');
    if (rawLoc) {
      const locs = rawLoc.split(',').map((s) => s.trim()).filter(Boolean);
      if (locs.length) where.push(`locations && ${bind(locs)}::text[]`);
    }

    const rawSeniority = explicit.get('seniority');
    if (rawSeniority) {
      const terms = rawSeniority.split(',').map((s) => s.trim()).filter(Boolean);
      if (terms.length) where.push(`seniority && ${bind(terms)}::text[]`);
    }

    const rawTech = explicit.get('tech');
    if (rawTech) {
      const terms = rawTech.split(',').map((s) => s.trim()).filter(Boolean);
      if (terms.length) where.push(`tech_stack && ${bind(terms)}::text[]`);
    }

    const rawCompMin = explicit.get('comp_min');
    const compN = Number(rawCompMin);
    if (rawCompMin && Number.isFinite(compN)) where.push(`salary_min >= ${bind(compN)}`);

    const rawContract = explicit.get('contract');
    if (rawContract && CONTRACT_TYPES.has(rawContract))
      where.push(`contract_type = ${bind(rawContract)}`);

    const rawMonth = explicit.get('month');
    if (rawMonth && MONTH_RE.test(rawMonth))
      where.push(
        `story_id = (SELECT id FROM stories WHERE date_trunc('month', month) = date_trunc('month', ${bind(rawMonth + '-01')}::date) LIMIT 1)`,
      );
  }

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
