import pg from 'pg';
import { getWhoIsHiringStories, getTopLevelComments } from './fetchHn.js';
import { extractStructured, embedText, type Extraction } from './gemini.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL required');
const EXTRACTOR_VERSION = process.env.EXTRACTOR_VERSION ?? 'v2';

function canonicalize(name: string | null): string | null {
  if (!name) return null;
  const c = name
    .toLowerCase()
    .replace(/[,]/g, ' ')
    .replace(/\b(inc|llc|ltd|gmbh|co)\b\.?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return c || null;
}

function vectorLiteral(v: number[]): string {
  return '[' + v.join(',') + ']';
}

async function main() {
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    max: Number(process.env.EXTRACT_CONCURRENCY ?? 8) + 2,
  });

  let stories_seen = 0;
  let posts_raw_new = 0;
  let extractions_new = 0;
  let extractions_failed = 0;
  let extractions_attempted = 0;
  const canonicals: { canonical: string; display: string; raw: string }[] = [];

  try {
    const stories = await getWhoIsHiringStories(3);
    stories_seen = stories.length;

    for (const s of stories) {
      await pool.query(
        `INSERT INTO stories (hn_item_id, month, fetched_at)
         VALUES ($1, $2, now())
         ON CONFLICT (hn_item_id) DO NOTHING`,
        [s.id, s.month],
      );
      const sid = await pool.query<{ id: string }>(
        `SELECT id FROM stories WHERE hn_item_id = $1`,
        [s.id],
      );
      const storyId = sid.rows[0]!.id;

      const comments = await getTopLevelComments(s.kids, {
        onProgress: (i, t) => {
          if (i % 50 === 0 || i === t) console.log(`story ${s.id}: ${i}/${t} comments`);
        },
      });

      for (const c of comments) {
        const r = await pool.query(
          `INSERT INTO posts_raw (hn_item_id, story_id, author, posted_at, text, fetched_at)
           VALUES ($1, $2, $3, to_timestamp($4), $5, now())
           ON CONFLICT (hn_item_id) DO NOTHING`,
          [c.id, storyId, c.by, c.time, c.text],
        );
        if (r.rowCount) posts_raw_new++;
      }
    }

    const pending = await pool.query<{ hn_item_id: string; text: string }>(
      `SELECT pr.hn_item_id, pr.text
       FROM posts_raw pr
       WHERE NOT EXISTS (
         SELECT 1 FROM posts_extractions pe
         WHERE pe.post_raw_id = pr.hn_item_id AND pe.extractor_version = $1
       )`,
      [EXTRACTOR_VERSION],
    );

    const pendingTotal = pending.rows.length;
    const EXTRACT_CONCURRENCY = Number(process.env.EXTRACT_CONCURRENCY ?? 8);
    console.log(`extraction phase: ${pendingTotal} comments to process (concurrency=${EXTRACT_CONCURRENCY})`);
    const startTs = Date.now();

    async function processRow(row: { hn_item_id: string; text: string }) {
      const postId = row.hn_item_id;
      let ex: Extraction | null = null;
      let err: string | null = null;
      // First attempt deterministic; later attempts add temperature to break
      // degenerate repetition loops that truncate the structured output.
      const retryTemperatures = [0, 0.4, 0.8];
      for (const temperature of retryTemperatures) {
        if (ex) break;
        try {
          ex = await extractStructured(row.text, temperature);
          err = null;
        } catch (e: any) {
          err = String(e?.message ?? e);
        }
      }

      if (!ex) {
        extractions_failed++;
        await pool.query(
          `INSERT INTO posts_extractions
             (post_raw_id, extractor_version, extracted_at, extraction_failed, failure_reason)
           VALUES ($1, $2, now(), true, $3)
           ON CONFLICT (post_raw_id, extractor_version) DO NOTHING`,
          [postId, EXTRACTOR_VERSION, err],
        );
        return;
      }

      const canonical = canonicalize(ex.company);
      let embedding: number[] | null = null;
      if (ex.is_job_posting) {
        const embedInput = [ex.summary_1line, ex.role_titles.join(' '), ex.tech_stack.join(' ')]
          .filter(Boolean)
          .join(' \n ');
        try {
          embedding = await embedText(embedInput);
        } catch (e) {
          embedding = null;
        }
      }

      const ins = await pool.query(
        `INSERT INTO posts_extractions (
           post_raw_id, extractor_version, extracted_at, extraction_failed,
           is_job_posting,
           company, canonical_company, role_titles, locations, remote_policy,
           salary_min, salary_max, currency, equity, seniority, tech_stack,
           visa_sponsorship, contract_type, apply_url, apply_email, summary_1line,
           embedding
         ) VALUES (
           $1,$2,now(),false,
           $3,
           $4,$5,$6,$7,$8,
           $9,$10,$11,$12,$13,$14,
           $15,$16,$17,$18,$19,
           ${embedding ? `$20::vector` : `NULL`}
         )
         ON CONFLICT (post_raw_id, extractor_version) DO NOTHING`,
        [
          postId, EXTRACTOR_VERSION,
          ex.is_job_posting,
          ex.company, canonical, ex.role_titles, ex.locations, ex.remote_policy,
          ex.salary_min, ex.salary_max, ex.currency, ex.equity, ex.seniority, ex.tech_stack,
          ex.visa_sponsorship, ex.contract_type, ex.apply_url, ex.apply_email, ex.summary_1line,
          ...(embedding ? [vectorLiteral(embedding)] : []),
        ],
      );
      if (ins.rowCount) {
        extractions_new++;
        if (ex.is_job_posting && canonical && ex.company) {
          canonicals.push({ canonical, display: ex.company, raw: ex.company });
        }
      }
    }

    let cursor = 0;
    async function worker() {
      while (cursor < pending.rows.length) {
        const idx = cursor++;
        const row = pending.rows[idx]!;
        extractions_attempted++;
        try {
          await processRow(row);
        } catch (e) {
          console.error(`row ${row.hn_item_id} crashed:`, e);
        }
        if (extractions_attempted % 25 === 0 || extractions_attempted === pendingTotal) {
          const elapsed = (Date.now() - startTs) / 1000;
          const rate = extractions_attempted / Math.max(elapsed, 1);
          const eta = Math.round((pendingTotal - extractions_attempted) / Math.max(rate, 0.01));
          console.log(
            `extract ${extractions_attempted}/${pendingTotal} ` +
            `(ok=${extractions_new} fail=${extractions_failed} ${rate.toFixed(2)}/s eta=${eta}s)`,
          );
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.max(1, EXTRACT_CONCURRENCY) }, () => worker()),
    );

    for (const c of canonicals) {
      await pool.query(
        `INSERT INTO companies (canonical_name, display_name, post_count, first_seen, last_seen)
         VALUES ($1, $2, 0, now(), now())
         ON CONFLICT (canonical_name) DO NOTHING`,
        [c.canonical, c.display],
      );
      await pool.query(
        `INSERT INTO companies_aliases (raw_name, canonical_name)
         VALUES ($1, $2)
         ON CONFLICT (raw_name) DO NOTHING`,
        [c.raw, c.canonical],
      );
    }

    // Recompute company stats from posts_extractions — idempotent across reruns.
    await pool.query(`
      WITH stats AS (
        SELECT canonical_company AS canonical_name,
               COUNT(*)::int AS cnt,
               MIN(extracted_at) AS first_seen,
               MAX(extracted_at) AS last_seen
        FROM posts_extractions
        WHERE extraction_failed = FALSE
          AND is_job_posting = TRUE
          AND canonical_company IS NOT NULL
        GROUP BY canonical_company
      )
      UPDATE companies c
      SET post_count = s.cnt,
          first_seen = s.first_seen,
          last_seen = s.last_seen
      FROM stats s
      WHERE c.canonical_name = s.canonical_name
    `);

    console.log(JSON.stringify({
      stories_seen, posts_raw_new, extractions_new, extractions_failed, extractions_attempted,
    }));

    const failRate = extractions_attempted > 0 ? extractions_failed / extractions_attempted : 0;
    if (failRate > 0.1) {
      console.error(`fail rate ${failRate.toFixed(3)} > 0.1`);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
