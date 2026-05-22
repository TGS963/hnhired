import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { draftEmail, DRAFT_STYLES } from '@/lib/draft';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    resume: z.string().min(100).max(50000),
    post_raw_id: z.number().int().positive(),
    consent: z.boolean(),
    style: z.enum(DRAFT_STYLES),
    custom_instructions: z.string().max(2000).optional(),
  })
  .refine(
    (v) =>
      v.style !== 'custom' ||
      (typeof v.custom_instructions === 'string' && v.custom_instructions.trim().length > 0),
    { message: 'custom_instructions required when style is custom', path: ['custom_instructions'] },
  );

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid body' }, { status: 400 });
    }
    if (!parsed.data.consent) {
      return NextResponse.json({ error: 'consent required' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = await checkRateLimit(ip, 'draft');
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'rate limited' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec ?? 60) } },
      );
    }

    const result = await draftEmail(parsed.data.resume, parsed.data.post_raw_id, {
      style: parsed.data.style,
      customInstructions: parsed.data.custom_instructions,
    });
    if (!result) {
      return NextResponse.json({ error: 'post not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/draft] error:', err);
    return NextResponse.json({ error: 'draft failed' }, { status: 500 });
  }
}
