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

const whySchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          post_raw_id: { type: Type.NUMBER },
          why: { type: Type.STRING },
        },
        required: ['post_raw_id', 'why'],
      },
    },
  },
  required: ['results'],
};

function vecLit(v: number[]): string {
  return '[' + v.join(',') + ']';
}

export async function nlSearch(
  q: string,
): Promise<{ posts: Post[]; whyByPostId: Record<number, string> }> {
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

  if (spec.remote_policy) where.push(`remote_policy = ${bind(spec.remote_policy)}`);
  if (spec.locations_any?.length)
    where.push(`locations && ${bind(spec.locations_any)}::text[]`);
  if (spec.seniority_any?.length)
    where.push(`seniority && ${bind(spec.seniority_any)}::text[]`);
  if (spec.tech_any?.length) where.push(`tech_stack && ${bind(spec.tech_any)}::text[]`);
  if (spec.contract_type) where.push(`contract_type = ${bind(spec.contract_type)}`);
  if (typeof spec.salary_min === 'number')
    where.push(`salary_min >= ${bind(spec.salary_min)}`);
  if (typeof spec.visa_sponsorship === 'boolean')
    where.push(`visa_sponsorship = ${bind(spec.visa_sponsorship)}`);
  if (typeof spec.equity === 'boolean') where.push(`equity = ${bind(spec.equity)}`);
  if (spec.keyword) where.push(`raw_text ILIKE '%' || ${bind(spec.keyword)} || '%'`);

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

  const whyByPostId: Record<number, string> = {};
  if (posts.length) {
    const summarized = posts.map((p) => ({
      id: Number(p.post_raw_id),
      company: p.company,
      role_titles: p.role_titles,
      summary_1line: p.summary_1line,
    }));
    const why = await generateJson<{ results: { post_raw_id: number; why: string }[] }>(
      `FilterSpec:\n${JSON.stringify(spec)}\n\nPostings:\n${JSON.stringify(summarized)}\n\nFor each posting, write a one-sentence explanation of why it matches the spec.`,
      whySchema,
      {
        system:
          'You explain, per posting, why it matches the user FilterSpec. Be concrete and concise.',
      },
    );
    for (const r of why.results ?? []) {
      whyByPostId[Number(r.post_raw_id)] = r.why;
    }
  }

  return { posts, whyByPostId };
}
