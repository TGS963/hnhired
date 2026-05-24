# hn-hired-ai

AI-powered alternative to the stale `hnhired.fly.dev`. Scrapes HN "Who is hiring?" threads, extracts structured fields with Gemini 3.5 Flash, serves NL search + résumé matching via Gemini 3.5 Flash.

## Stack

- **Web**: Next.js 15 App Router + Tailwind on Vercel (`apps/web`)
- **Ingest**: TS Node script via GitHub Actions daily cron (`apps/ingest`)
- **DB**: Neon Postgres + pgvector (`db/migrations`)
- **LLM**: Gemini 3.5 Flash (extraction, batch), Gemini 3 Pro (search/match), gemini-embedding-001 (1024 dim)

## Layout

```
apps/web        Next.js app
apps/ingest     HN fetcher + Gemini extraction
db/migrations   Postgres schema (run via scripts/migrate.mjs)
scripts/        Maintenance scripts
.github/        CI workflows (daily ingest cron)
```

## Setup

```bash
cp .env.example .env       # fill DATABASE_URL, GOOGLE_API_KEY
npm install
npm run db:migrate
npm run -w @hnhired/ingest start   # backfill current month
npm run web:dev
```

## Required env

| Var | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | both | Neon Postgres connection string |
| `GOOGLE_API_KEY` | both | Gemini extraction + embeddings + search/match |
| `EXTRACTOR_VERSION` | ingest | append-only versioning in `posts_extractions` |
