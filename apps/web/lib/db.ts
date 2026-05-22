import { Pool } from 'pg';

const g = globalThis as unknown as { __pgPool?: Pool };

export const pool: Pool =
  g.__pgPool ??
  (g.__pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  }));

export async function query<T extends Record<string, any>>(
  sql: string,
  params?: any[],
): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}
