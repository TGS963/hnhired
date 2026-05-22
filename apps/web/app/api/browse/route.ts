import { NextResponse } from 'next/server';
import { browse, BROWSE_PAGE_SIZE } from '@/lib/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Set(['remote', 'loc', 'seniority', 'tech', 'comp_min', 'q', 'contract']);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const offsetRaw = url.searchParams.get('offset');
  const offset = offsetRaw != null ? Math.max(0, parseInt(offsetRaw, 10) || 0) : 0;

  const filters = new URLSearchParams();
  for (const [k, v] of url.searchParams.entries()) {
    if (ALLOWED.has(k) && v) filters.set(k, v);
  }

  const posts = await browse(filters, { limit: BROWSE_PAGE_SIZE, offset });
  return NextResponse.json({
    posts,
    next_offset: posts.length === BROWSE_PAGE_SIZE ? offset + posts.length : null,
  });
}
