import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { rankAgainstResume } from '@/lib/match';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  resume: z.string().min(100).max(50000),
  consent: z.boolean(),
});

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
    const rl = await checkRateLimit(ip, 'match');
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'rate limited' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec ?? 60) } },
      );
    }

    const results = await rankAgainstResume(parsed.data.resume);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('[api/match] error:', err);
    return NextResponse.json({ error: 'match failed' }, { status: 500 });
  }
}
