import { unstable_cache } from 'next/cache';
import { query } from './db';
import type { Post } from './schemas';

export type FullPost = Post & Record<string, any>;

async function fetchPostUncached(id: number): Promise<FullPost | null> {
  const t0 = Date.now();
  console.log(`[fetchPost] MISS id=${id}`);
  const result = await query<Post>('SELECT * FROM posts WHERE post_raw_id = $1 LIMIT 1', [id]);
  const row = (result as any).rows
    ? (result as any).rows[0]
    : Array.isArray(result)
      ? result[0]
      : undefined;
  console.log(`[fetchPost] DB query id=${id} in ${Date.now() - t0}ms`);
  return row ?? null;
}

export const fetchPost = unstable_cache(
  async (id: number) => fetchPostUncached(id),
  ['post-by-id'],
  { revalidate: 86400, tags: ['post'] },
);
