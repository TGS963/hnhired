import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { CANONICAL_COUNTRY_NAMES, COUNTRY_ALIAS_RULES } from '@hnhired/shared/countries';
import { fetchUsdRates, toUsd, type ExchangeRates } from '@hnhired/shared/currencies';

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error('GOOGLE_API_KEY required');

const ai = new GoogleGenAI({ apiKey });

const EXTRACT_MODEL = 'gemini-3.5-flash';
const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIM = 1024;

const SYSTEM = `Extract structured job fields from this HN 'Who is hiring?' comment. Return null for fields not stated. Do not infer. summary_1line is at most 280 chars.

For locations: keep the stated place names AND also append the country for each one when it is unambiguous (e.g. "Bangalore" -> ["Bangalore", "India"]; "SF" -> ["SF", "USA"]; "Berlin" -> ["Berlin", "Germany"]). The appended country MUST be spelled exactly as one of these canonical names: ${CANONICAL_COUNTRY_NAMES.join(', ')}. Collapse aliases to the canonical name: ${COUNTRY_ALIAS_RULES} This country normalization is the only allowed inference; do not invent cities or countries that are not implied by a stated location. If only a country is given, return just the canonical country name.

For salary and currency:
- Detect the currency from explicit symbols ($, \u20ac, \u00a3, \u20b9, \u00a5, \u20a9, RM, S$, A$, CA$, etc.), currency codes (USD, EUR, GBP, INR, SGD, AUD, CAD, JPY, KRW, CHF, SEK, NOK, DKK, PLN, BRL, MXN, ZAR, PHP, MYR, IDR, THB, etc.), or country/region context (India/Bangalore -> INR, Germany/Berlin -> EUR, UK/London -> GBP, Japan/Tokyo -> JPY, Singapore -> SGD, Australia -> AUD, Canada -> CAD, Brazil -> BRL, Malaysia -> MYR, etc.).
- Set "currency" to the ISO 4217 three-letter code (e.g. "USD", "INR", "EUR", "GBP"). If currency genuinely cannot be determined and the job location is not USA, set currency to null rather than defaulting to USD.
- Set salary_min / salary_max to the ANNUALIZED value in that currency's base unit (dollars, euros, rupees, etc.):
  - "6-10 LPA" or "6-10 lakhs" (India) -> salary_min=600000, salary_max=1000000, currency="INR"
  - "$120k-$150k" -> salary_min=120000, salary_max=150000, currency="USD"
  - "\u20ac70,000-\u20ac90,000" -> salary_min=70000, salary_max=90000, currency="EUR"
  - "\u00a3500/day" -> salary_min=130000, salary_max=null, currency="GBP" (x260 working days)
  - "\u00a58M-\u00a512M" (Japan) -> salary_min=8000000, salary_max=12000000, currency="JPY"
  - "S$80k-S$100k" -> salary_min=80000, salary_max=100000, currency="SGD"
  - "RM 8,000/month" -> salary_min=96000, salary_max=null, currency="MYR" (x12)
  - "R$15,000/month" -> salary_min=180000, salary_max=null, currency="BRL" (x12)
  - "40,000 PLN" -> salary_min=40000, salary_max=null, currency="PLN"
- If salary is per-month, multiply by 12. If per-day, multiply by 260. If per-hour, multiply by 2080.
- LPA (Lakhs Per Annum) means x100,000 in INR. CTC (Cost To Company) is annual total compensation.

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

const MAX_INPUT_CHARS = 24000;
const MAX_OUTPUT_TOKENS = 2048;

export async function extractStructured(text: string, temperature = 0): Promise<Extraction> {
  const res = await ai.models.generateContent({
    model: EXTRACT_MODEL,
    contents: [{ role: 'user', parts: [{ text: text.slice(0, MAX_INPUT_CHARS) }] }],
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: 'application/json',
      responseSchema,
      temperature,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });
  if (res.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
    throw new Error('gemini output truncated at maxOutputTokens');
  }
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
