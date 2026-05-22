import { query } from './db';
import type { Post } from './schemas';

export type FullPost = Post & Record<string, any>;

export async function fetchPost(id: number): Promise<FullPost | null> {
  const result = await query<Post>('SELECT * FROM posts WHERE post_raw_id = $1 LIMIT 1', [id]);
  const row = (result as any).rows
    ? (result as any).rows[0]
    : Array.isArray(result)
      ? result[0]
      : undefined;
  return row ?? null;
}
