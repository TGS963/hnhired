import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { nlSearch } from '@/lib/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  query: z.string().trim().min(1).max(500),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid body' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = await checkRateLimit(ip, 'search');
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'rate limited' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec ?? 60) } },
      );
    }

    const { posts, whyByPostId } = await nlSearch(parsed.data.query);
    return NextResponse.json({ posts, whyByPostId });
  } catch (err) {
    console.error('[api/search] error:', err);
    return NextResponse.json({ error: 'search failed' }, { status: 500 });
  }
}
