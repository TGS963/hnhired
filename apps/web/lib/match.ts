import { Type } from '@google/genai';
import { query } from './db';
import { generateJson } from './gemini';
import type { Post, MatchResult } from './schemas';

const matchSchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          post_raw_id: { type: Type.NUMBER },
          fit_note: { type: Type.STRING },
        },
        required: ['post_raw_id', 'fit_note'],
      },
    },
  },
  required: ['results'],
};

export async function rankAgainstResume(resume: string): Promise<MatchResult[]> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const posts = await query<Post>(
    `SELECT * FROM posts WHERE posted_at >= $1 ORDER BY posted_at DESC LIMIT 500`,
    [monthStart],
  );

  if (!posts.length) return [];

  const summarized = posts.map((p) => ({
    id: Number(p.post_raw_id),
    company: p.company,
    role_titles: p.role_titles,
    summary_1line: p.summary_1line,
    tech_stack: p.tech_stack,
    seniority: p.seniority,
    remote_policy: p.remote_policy,
    locations: p.locations,
  }));

  const out = await generateJson<{ results: { post_raw_id: number; fit_note: string }[] }>(
    `Résumé:\n${resume}\n\nPostings:\n${JSON.stringify(summarized)}`,
    matchSchema,
    {
      system:
        "Rank these job postings by fit to the candidate's résumé. Return top 20.",
    },
  );

  const postById = new Map(posts.map((p) => [Number(p.post_raw_id), p]));

  return (out.results ?? [])
    .slice(0, 20)
    .map((r) => {
      const id = Number(r.post_raw_id);
      const post = postById.get(id);
      if (!post) return null;
      return {
        ...post,
        post_raw_id: id,
        fit_note: r.fit_note,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}
