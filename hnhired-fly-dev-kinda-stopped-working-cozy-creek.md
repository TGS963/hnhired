# AI-powered HN "Who is hiring?" board

## Context

`hnhired.fly.dev` is a community job board that scrapes Hacker News' monthly **"Ask HN: Who is hiring?"** threads and presents them as searchable, filterable listings. The source (`gadogado/hn-hired`, Remix + Prisma on Fly.io) was **archived on GitHub in November 2022** — the live site still loads but the newest posts shown are roughly six months old, so ingestion has clearly stalled and nothing is being maintained.

Goal: build a fresh, AI-powered alternative that does what `hnhired` did, plus uses LLMs to turn the free-text comments into structured, semantically-searchable, personally-rankable job listings — the things you can't do with a regex parser. Treat `hnhired` as inspiration, not a base to fork (it's three years stale and the stack choice isn't important to preserve).

## Recommendation: fresh build, "thin & opinionated" MVP

A clean rebuild beats forking. The hard part isn't the CRUD/UI shell — it's the AI pipeline and the data model, and those benefit from being designed from scratch. We can have an MVP up faster than untangling a 2022 Remix codebase.

**Confirmed with user:**
- Scope: **Lean MVP** — ingest + structured extraction + browse/filter + NL search + résumé-paste matching. Defer alerts, accounts, outreach drafting, PDF upload.
- Stack: **Next.js (App Router, TS) on Vercel + Neon Postgres with pgvector + GitHub Actions for ingest cron**. Free tier for everything except LLM tokens (Fly.io free tier was retired Oct 2024, so we use the genuinely-free stack instead).

## Architecture

```
[GitHub Actions cron] ──▶ Ingest script ──▶ Neon Postgres (jobs + pgvector embeddings)
   (daily, ~5 min)            │                    ▲
                              └─ Gemini 3.5 Flash ─┘   (per-comment structured extraction)

Browser ──▶ Next.js on Vercel ──▶ Neon Postgres
                   │
                   └─ Gemini 3 Pro       (NL query → filter spec, résumé matching, explanations)
```

### Components

1. **Ingest script** (TS Node script, run by GitHub Actions on a daily cron)
   - Pulls `whoishiring` user's submissions from `https://hacker-news.firebaseio.com/v0/user/whoishiring.json`
   - For each monthly "Who is hiring?" story, walks `kids[]` and fetches each top-level comment
   - Upserts raw comments into `posts_raw` table (idempotent on HN item id)
   - Triggers extraction for any new/unprocessed rows
   - Lives in `apps/ingest/` and is invoked via `.github/workflows/ingest.yml` (cron: `0 9 * * *` UTC)

2. **Extraction pipeline** (Gemini 3.5 Flash via Google AI SDK)
   - One LLM call per comment → JSON: `{company, role_titles[], locations[], remote_policy, salary_min, salary_max, currency, equity, seniority, tech_stack[], visa_sponsorship, contract_type, apply_url, apply_email, summary_1line}`
   - Use Gemini's native structured-output mode (`responseSchema` / `responseMimeType: application/json`) for guaranteed-shape JSON. Validate with zod as a safety net; if invalid, retry once then mark `extraction_failed`.
   - Use Gemini's Batch API for the nightly run (50% cheaper, latency-tolerant); fall back to per-request calls when backfilling small numbers.
   - Embed `summary_1line + role_titles + tech_stack` with `gemini-embedding-001` (or equivalent current model); store as `vector(1024)` via pgvector — must match the chosen embedding model's output dimension.
   - Use Gemini's implicit/explicit caching on the extraction system prompt (repeated across all calls in a batch).

3. **Web app** (Next.js 15 App Router + Tailwind + shadcn/ui)
   - **Browse view**: faceted filters (remote, location, seniority, stack, comp range) + keyword search — the table-stakes `hnhired` had.
   - **Natural-language search bar**: "remote-first climate startups hiring senior Rust, comp >150k". Gemini 3 Pro translates the query → structured filter spec + semantic vector, runs the query, returns ranked results with a one-sentence "why this matched" per row.
   - **Résumé match**: paste résumé text (or upload PDF). Gemini 3 Pro ranks the current month's postings against it, returns top 20 with per-row fit notes. **Must show a privacy notice above the textarea** stating the résumé text is sent to Google for processing and not retained server-side; require explicit checkbox consent before the request fires.
   - **Job detail**: original comment text, extracted fields, "draft outreach" button → Gemini 3 Pro drafts a tailored cold email/cover paragraph (one-click copy).
   - **Saved searches → email alerts** (post-MVP).

4. **Database** — Single Postgres instance (Fly Postgres or Neon)
   - `stories(id, month, hn_item_id, fetched_at)`
   - `posts_raw(id, hn_item_id PK, story_id, author, posted_at, text, fetched_at)`
   - `posts_extractions(id PK, post_raw_id, extractor_version, …extracted fields…, embedding vector(1024), extracted_at)` — append-only; one row per (post, extractor_version). UNIQUE(post_raw_id, extractor_version).
   - `posts` is a **view** selecting the latest `extractor_version` per `post_raw_id` — query surface for the app, history preserved underneath.
   - `companies(canonical_name PK, post_count, first_seen, last_seen)` — `canonical_name` derived by normalizing raw company strings (lowercase, strip `Inc|LLC|Ltd|,`, collapse whitespace) so "Acme", "Acme Inc", "Acme, Inc." collapse to one row. Store original variants in `companies_aliases(raw_name, canonical_name)`.

5. **Hosting**
   - **Web**: Vercel (Hobby tier, free) — Next.js native.
   - **DB**: Neon (Free tier, 3 GB + pgvector built in, scales to zero).
   - **Ingest cron**: GitHub Actions (unlimited free minutes on public repos; 2000 min/mo on private — public repo planned).
   - **Secrets**: `GOOGLE_API_KEY` (extraction + embeddings + NL search + résumé matching), `DATABASE_URL` — set in both Vercel project env and GitHub Actions repo secrets.
   - Total infra cost: **$0/mo** on free tiers (Vercel Hobby ToS prohibits commercial use — upgrade to Pro at $20/mo before any monetization or if the project gets flagged). LLM tokens, Gemini 3.5 Flash batch @ ~15k extractions/mo: ~$2/mo extraction + ~$0.05/mo embeddings. Gemini 3 Pro (NL search + résumé match) is the wildcard: at 10 users × 3 queries/day ≈ a few dollars/mo; abuse without rate-limiting can balloon. **Mitigations required pre-launch**: IP rate limit + per-day cap on `/api/search` and `/api/match`, in-memory LRU cache for repeated queries, and Google AI budget alert.

## MVP scope (what ships first)

Cut to the bone for v1:
- Ingest the **current month** + previous 2 months on backfill
- Structured extraction with the field list above
- Browse view with filters + keyword search
- Natural-language search bar
- Résumé-paste matching

**Defer**: PDF résumé upload, email alerts, RSS, outreach drafting, user accounts, multi-month historical analytics, "reposter" company tracking, mobile-specific UI polish.

## Key implementation notes

- **HN data is public and modest** — a monthly thread has ~800–1200 top-level comments (recent threads regularly exceed 1000). Full pipeline cost per month with Gemini 3.5 Flash Batch: ~$2 extraction + ~$0.05 embeddings. Gemini 3 Pro costs depend on traffic and are gated by rate limits (see below).
- **Idempotency matters**: use HN item id as natural PK on `posts_raw`. Re-running ingest must be safe.
- **Extractor versioning**: store `extractor_version` so we can re-extract when we improve the prompt without losing history.
- **Don't over-engineer NL search**: have Gemini 3 Pro emit a **structured JSON filter spec** (e.g. `{remote: true, seniority: ["senior"], salary_min: 150000, tech_any: ["rust"], semantic_query: "climate startup"}`) against a fixed allowlist of fields — never raw SQL. The backend translates the JSON into a parameterized query with bound params; the semantic part runs as a separate pgvector similarity search. This removes the SQL-injection surface entirely.
- **Rate limiting (HN ingest)**: HN Firebase API has no published limit but be polite — sequential fetch with ~50ms delay is fine for ~1000 comments; on 429/5xx, exponential backoff (1s, 2s, 4s, max 3 retries) then mark the item for the next run.
- **Rate limiting (LLM endpoints)**: `/api/search` and `/api/match` must enforce per-IP rate limits (e.g. 20 req/min, 200 req/day) using Vercel KV or Upstash Redis. Reject without auth above the cap. Without this, a single bot drains the Google AI budget in minutes.
- **Monitoring**: ingest failure surfaces via the GitHub Actions run status; extraction-failure rate > 10% per run fails the job. Google AI usage budget alerts configured at 50% / 100% of expected monthly spend.
- **Backfill strategy**: Gemini Batch API has a 24-hour SLA, not minutes. Initial 2-month backfill (~2400 comments) submitted as one batch and polled; do not block app launch on it.
- **DB capacity**: 1024-dim float32 embedding ≈ 4 KB/row. At ~1000 new posts/mo, free Neon tier (3 GB) lasts ~2+ years before any pruning is needed.
- **Robots / ToS**: HN content is openly available and many such tools exist (`hnhiring.com`, `nchelluri/hnjobs`, etc.) — no legal concern, but credit "data from Hacker News" in the footer.

## Files to create (greenfield)

```
hn-hired-ai/
├── apps/
│   ├── web/                    # Next.js app, deployed on Vercel
│   │   ├── app/
│   │   │   ├── page.tsx              # browse + filters + NL search bar
│   │   │   ├── match/page.tsx        # résumé matching
│   │   │   ├── job/[id]/page.tsx     # detail view
│   │   │   └── api/
│   │   │       ├── search/route.ts   # NL → SQL/vector → results
│   │   │       └── match/route.ts    # résumé → ranked posts
│   │   └── lib/
│   │       ├── db.ts                 # Neon Postgres + pgvector client
│   │       ├── gemini.ts             # Google AI SDK wrapper (Gemini 3 Pro, w/ context caching)
│   │       └── schemas.ts            # zod schemas for extracted fields
│   └── ingest/                 # standalone TS script run by GitHub Actions
│       └── src/
│           ├── fetchHn.ts            # HN Firebase client
│           ├── gemini.ts             # Google AI SDK wrapper (Flash + embeddings)
│           ├── extract.ts            # Gemini Flash extraction (batched)
│           ├── embed.ts              # embedding generation
│           └── run.ts                # main entrypoint
├── db/
│   └── migrations/0001_init.sql      # tables above
├── .github/
│   └── workflows/
│       └── ingest.yml                # daily cron: runs apps/ingest
└── package.json
```

## Verification

End-to-end check before declaring v1 done:
1. Run ingest locally against the latest "Who is hiring?" thread → confirm ~500 rows in `posts_raw`, ~95%+ successful extraction in `posts`.
2. Spot-check 20 random extracted rows against original comment text — fields should be correct.
3. Issue 5 representative NL queries (e.g., "remote senior Go", "NYC fintech with equity", "ML internship") → results should look right and the “why this matched” line should make sense.
4. Paste a sample résumé → top-20 list should have plausible fits.
5. Deploy web to Vercel, point at Neon, trigger the GitHub Actions ingest workflow manually (`workflow_dispatch`) and confirm prod parity with local.

