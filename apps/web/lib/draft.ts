import { Type } from '@google/genai';
import { query } from './db';
import { generateJson } from './gemini';
import type { Post } from './schemas';

const draftSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    body: { type: Type.STRING },
  },
  required: ['subject', 'body'],
};

export const DRAFT_STYLES = [
  'classic_cover_letter',
  'modern_cold_email',
  'casual_intro',
  'show_dont_tell',
  'referral_warm',
  'haiku_hook',
  'custom',
] as const;

export type DraftStyle = (typeof DRAFT_STYLES)[number];

export type DraftEmail = {
  subject: string;
  body: string;
  to?: string | null;
  apply_url?: string | null;
};

const STYLE_BRIEFS: Record<DraftStyle, string> = {
  classic_cover_letter:
    'Style: classic cover letter. Formal, 3 short paragraphs (intro / fit with specific evidence / closing). Reference the role and company by name. End the body with one line indicating the résumé is attached, then "[Your name]" on its own line.',
  modern_cold_email:
    'Style: modern cold email. Punchy and value-first. Total length ≤ 6 short lines. Open with one specific reason this candidate is relevant (no "I came across your post"). End with a single clear ask (15-min call or reply).',
  casual_intro:
    'Style: casual introduction. Friendly, conversational, no buzzwords. 2–3 short paragraphs. Sound like a competent human, not a template.',
  show_dont_tell:
    "Style: show-don't-tell. Open with ONE concrete project or result from the résumé that maps directly to the posting (numbers/scale/tech). Then one short paragraph connecting it to the role. Avoid generic adjectives like 'passionate', 'experienced', 'driven'.",
  referral_warm:
    'Style: warm referral-style intro. Tone is relaxed and confident, as if a mutual connection suggested the introduction (do not invent a referrer). 2 short paragraphs.',
  haiku_hook:
    'Style: haiku hook (fun). Open the body with a 3-line haiku (5-7-5 syllables) tied to the role or company. Follow with exactly 2 plain sentences explaining concrete fit, then a signoff line "[Your name]". Subject stays normal and professional.',
  custom: '',
};

const SHARED_RULES = [
  'Do not invent facts not present in the résumé or the posting.',
  'Do not include the apply email or apply URL in the body.',
  'No em-dashes. No exclamation marks unless the style explicitly allows.',
  'End the body with "[Your name]" on its own line as the signoff placeholder.',
  'Subject: short, specific, includes the role title.',
].join(' ');

export async function draftEmail(
  resume: string,
  postRawId: number,
  opts: { style: DraftStyle; customInstructions?: string },
): Promise<DraftEmail | null> {
  const rows = await query<Post>(`SELECT * FROM posts WHERE post_raw_id = $1 LIMIT 1`, [
    postRawId,
  ]);
  const post = rows[0];
  if (!post) return null;

  const compact = {
    company: post.company,
    role_titles: post.role_titles,
    locations: post.locations,
    remote_policy: post.remote_policy,
    tech_stack: post.tech_stack,
    seniority: post.seniority,
    summary_1line: post.summary_1line,
    raw_text: post.raw_text?.slice(0, 4000) ?? null,
  };

  const styleBrief =
    opts.style === 'custom'
      ? `Style: custom. Follow these user instructions verbatim:\n---\n${(opts.customInstructions ?? '').slice(0, 2000)}\n---`
      : STYLE_BRIEFS[opts.style];

  const system = [
    'Draft a concise application email from the candidate to the company based on their résumé and the job posting.',
    styleBrief,
    SHARED_RULES,
  ].join('\n\n');

  const out = await generateJson<{ subject: string; body: string }>(
    `Résumé:\n${resume}\n\nJob posting:\n${JSON.stringify(compact)}`,
    draftSchema,
    { system },
  );

  return {
    subject: out.subject,
    body: out.body,
    to: post.apply_email,
    apply_url: post.apply_url,
  };
}
