import { z } from 'zod';

export const FilterSpec = z
  .object({
    remote_policy: z.enum(['remote', 'hybrid', 'onsite']).optional(),
    locations_any: z.array(z.string()).optional(),
    seniority_any: z.array(z.string()).optional(),
    tech_any: z.array(z.string()).optional(),
    contract_type: z.enum(['fulltime', 'parttime', 'contract', 'intern']).optional(),
    salary_min: z.number().optional(),
    visa_sponsorship: z.boolean().optional(),
    equity: z.boolean().optional(),
    semantic_query: z.string().optional(),
    keyword: z.string().optional(),
  })
  .strict();

export type FilterSpec = z.infer<typeof FilterSpec>;

export const Post = z.object({
  post_raw_id: z.union([z.number(), z.bigint(), z.string()]).transform((v) => Number(v)),
  story_id: z.union([z.number(), z.bigint(), z.string()]).transform((v) => Number(v)),
  author: z.string().nullable(),
  posted_at: z.union([z.string(), z.date()]),
  raw_text: z.string().nullable(),
  company: z.string().nullable(),
  canonical_company: z.string().nullable(),
  role_titles: z.array(z.string()).nullable(),
  locations: z.array(z.string()).nullable(),
  remote_policy: z.string().nullable(),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  currency: z.string().nullable(),
  equity: z.boolean().nullable(),
  seniority: z.array(z.string()).nullable(),
  tech_stack: z.array(z.string()).nullable(),
  visa_sponsorship: z.boolean().nullable(),
  contract_type: z.string().nullable(),
  apply_url: z.string().nullable(),
  apply_email: z.string().nullable(),
  summary_1line: z.string().nullable(),
  embedding: z.any().nullable().optional(),
  extracted_at: z.union([z.string(), z.date()]).nullable().optional(),
  extractor_version: z.string().nullable().optional(),
});

export type Post = z.infer<typeof Post>;

export type MatchResult = Post & {
  fit_note: string;
  score?: number;
};
