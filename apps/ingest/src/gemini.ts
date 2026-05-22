import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error('GOOGLE_API_KEY required');

const ai = new GoogleGenAI({ apiKey });

const EXTRACT_MODEL = 'gemini-3.5-flash';
const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIM = 1024;

const SYSTEM = `Extract structured job fields from this HN 'Who is hiring?' comment. Return null for fields not stated. Do not infer. summary_1line is at most 280 chars.

Also classify whether the comment is actually a job posting. Set is_job_posting=false for:
- meta-comments about the thread itself ("great thread", "nice format")
- accidental pastes of terminal output, code, error messages, or unrelated text
- replies to other comments that are not themselves a hiring pitch
- generic announcements with no role, company, or apply method

Set is_job_posting=true only when the comment reads as a hiring pitch (names a company OR a role OR an apply method, in a recruiting context). When is_job_posting=false, still fill the other fields with nulls/empty arrays and set summary_1line to a short reason (e.g. "Meta-comment praising the thread.", "Pasted terminal output, not a posting.").`;

export const ExtractionSchema = z.object({
  is_job_posting: z.boolean(),
  company: z.string().nullable(),
  role_titles: z.array(z.string()),
  locations: z.array(z.string()),
  remote_policy: z.enum(['remote', 'hybrid', 'onsite', 'unknown']),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  currency: z.string().nullable(),
  equity: z.boolean().nullable(),
  seniority: z.array(z.string()),
  tech_stack: z.array(z.string()),
  visa_sponsorship: z.boolean().nullable(),
  contract_type: z.enum(['fulltime', 'parttime', 'contract', 'intern']).nullable(),
  apply_url: z.string().nullable(),
  apply_email: z.string().nullable(),
  summary_1line: z.string().max(280),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    is_job_posting: { type: Type.BOOLEAN },
    company: { type: Type.STRING, nullable: true },
    role_titles: { type: Type.ARRAY, items: { type: Type.STRING } },
    locations: { type: Type.ARRAY, items: { type: Type.STRING } },
    remote_policy: { type: Type.STRING, enum: ['remote', 'hybrid', 'onsite', 'unknown'] },
    salary_min: { type: Type.NUMBER, nullable: true },
    salary_max: { type: Type.NUMBER, nullable: true },
    currency: { type: Type.STRING, nullable: true },
    equity: { type: Type.BOOLEAN, nullable: true },
    seniority: { type: Type.ARRAY, items: { type: Type.STRING } },
    tech_stack: { type: Type.ARRAY, items: { type: Type.STRING } },
    visa_sponsorship: { type: Type.BOOLEAN, nullable: true },
    contract_type: { type: Type.STRING, enum: ['fulltime', 'parttime', 'contract', 'intern'], nullable: true },
    apply_url: { type: Type.STRING, nullable: true },
    apply_email: { type: Type.STRING, nullable: true },
    summary_1line: { type: Type.STRING },
  },
  required: [
    'is_job_posting',
    'company', 'role_titles', 'locations', 'remote_policy',
    'salary_min', 'salary_max', 'currency', 'equity',
    'seniority', 'tech_stack', 'visa_sponsorship', 'contract_type',
    'apply_url', 'apply_email', 'summary_1line',
  ],
};

export async function extractStructured(text: string): Promise<Extraction> {
  const res = await ai.models.generateContent({
    model: EXTRACT_MODEL,
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0,
    },
  });
  const raw = res.text;
  if (!raw) throw new Error('empty gemini response');
  const parsed = JSON.parse(raw);
  return ExtractionSchema.parse(parsed);
}

export async function embedText(text: string): Promise<number[]> {
  const res = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: text,
    config: { outputDimensionality: EMBED_DIM },
  });
  const v = res.embeddings?.[0]?.values;
  if (!v || v.length !== EMBED_DIM) throw new Error(`bad embedding len ${v?.length}`);
  return v;
}

export async function submitExtractionBatch(
  texts: { key: string; text: string }[],
): Promise<Record<string, Extraction>> {
  const out: Record<string, Extraction> = {};
  for (const t of texts) {
    out[t.key] = await extractStructured(t.text);
  }
  return out;
}
