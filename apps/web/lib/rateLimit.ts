const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const LIMITS = [
  { window: 60, max: 20 },
  { window: 86400, max: 200 },
];

type Mem = Map<string, number[]>;
const g = globalThis as unknown as { __rlMem?: Mem };
const mem: Mem = g.__rlMem ?? (g.__rlMem = new Map());

async function upstash(cmd: (string | number)[]): Promise<any> {
  const res = await fetch(`${URL_}/${cmd.map((c) => encodeURIComponent(String(c))).join('/')}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const j = await res.json();
  return j.result;
}

export async function checkRateLimit(
  ip: string,
  route: string,
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const now = Date.now();
  const baseKey = `rl:${ip}:${route}`;

  if (URL_ && TOKEN) {
    for (const { window, max } of LIMITS) {
      const key = `${baseKey}:${window}`;
      const minScore = now - window * 1000;
      await upstash(['zremrangebyscore', key, 0, minScore]);
      await upstash(['zadd', key, now, `${now}-${Math.random()}`]);
      const count = Number(await upstash(['zcard', key]));
      await upstash(['expire', key, window]);
      if (count > max) {
        return { ok: false, retryAfterSec: window };
      }
    }
    return { ok: true };
  }

  for (const { window, max } of LIMITS) {
    const key = `${baseKey}:${window}`;
    const minScore = now - window * 1000;
    const arr = (mem.get(key) ?? []).filter((t) => t > minScore);
    arr.push(now);
    mem.set(key, arr);
    if (arr.length > max) {
      return { ok: false, retryAfterSec: window };
    }
  }
  return { ok: true };
}
