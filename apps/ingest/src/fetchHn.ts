const HN = 'https://hacker-news.firebaseio.com/v0';
const HIRING_RE = /Ask HN: Who is hiring\? \((\w+ \d{4})\)/i;

export type HiringStory = { id: number; month: Date; title: string; kids: number[] };
export type RawComment = { id: number; by: string; time: number; text: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson<T>(url: string, retries = 3): Promise<T> {
  let delay = 1000;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);
    if (res.ok) return (await res.json()) as T;
    if (res.status === 429 || res.status >= 500) {
      if (attempt === retries) throw new Error(`fetch ${url} failed ${res.status}`);
      await sleep(delay);
      delay *= 2;
      continue;
    }
    throw new Error(`fetch ${url} failed ${res.status}`);
  }
  throw new Error('unreachable');
}

function parseMonth(label: string): Date {
  const d = new Date(`${label} 01 UTC`);
  if (isNaN(d.getTime())) throw new Error(`bad month: ${label}`);
  return d;
}

export async function getWhoIsHiringStories(monthLimit = 3): Promise<HiringStory[]> {
  const user = await fetchJson<{ submitted: number[] }>(`${HN}/user/whoishiring.json`);
  const out: HiringStory[] = [];
  for (const id of user.submitted) {
    if (out.length >= monthLimit) break;
    const item = await fetchJson<any>(`${HN}/item/${id}.json`);
    await sleep(50);
    if (!item || item.deleted || item.dead || typeof item.title !== 'string') continue;
    const h = HIRING_RE.exec(item.title);
    if (!h) continue;
    out.push({
      id: item.id,
      month: parseMonth(h[1]!),
      title: item.title,
      kids: Array.isArray(item.kids) ? item.kids : [],
    });
  }
  return out;
}

function decodeHtml(s: string): string {
  return s
    .replace(/<p>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .trim();
}

export async function getTopLevelComments(
  storyKids: number[],
  opts: { delayMs?: number; onProgress?: (i: number, total: number) => void } = {},
): Promise<RawComment[]> {
  const delay = opts.delayMs ?? 50;
  const out: RawComment[] = [];
  for (let i = 0; i < storyKids.length; i++) {
    const id = storyKids[i]!;
    try {
      const item = await fetchJson<any>(`${HN}/item/${id}.json`);
      if (item && !item.deleted && !item.dead && typeof item.text === 'string') {
        out.push({ id: item.id, by: item.by ?? '', time: item.time ?? 0, text: decodeHtml(item.text) });
      }
    } catch (e) {
      // skip individual failures after retry exhaustion
    }
    opts.onProgress?.(i + 1, storyKids.length);
    await sleep(delay);
  }
  return out;
}
