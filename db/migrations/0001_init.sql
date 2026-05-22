-- HN Hired AI: initial schema
-- Postgres + pgvector. Embedding dim 1024 (gemini-embedding-001).

CREATE EXTENSION IF NOT EXISTS vector;

-- Monthly "Who is hiring?" stories from HN.
CREATE TABLE IF NOT EXISTS stories (
  id            BIGSERIAL PRIMARY KEY,
  hn_item_id    BIGINT NOT NULL UNIQUE,
  month         DATE NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stories_month_idx ON stories (month DESC);

-- Raw top-level comments from each story. Idempotent on hn_item_id.
CREATE TABLE IF NOT EXISTS posts_raw (
  hn_item_id    BIGINT PRIMARY KEY,
  story_id      BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author        TEXT,
  posted_at     TIMESTAMPTZ NOT NULL,
  text          TEXT NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_raw_story_idx ON posts_raw (story_id);

-- Append-only extractions. One row per (post, extractor_version).
-- Re-running a newer extractor inserts; never overwrites history.
CREATE TABLE IF NOT EXISTS posts_extractions (
  id                BIGSERIAL PRIMARY KEY,
  post_raw_id       BIGINT NOT NULL REFERENCES posts_raw(hn_item_id) ON DELETE CASCADE,
  extractor_version TEXT NOT NULL,
  extracted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  extraction_failed BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason    TEXT,

  company           TEXT,
  canonical_company TEXT,
  role_titles       TEXT[] NOT NULL DEFAULT '{}',
  locations         TEXT[] NOT NULL DEFAULT '{}',
  remote_policy     TEXT,        -- 'remote' | 'hybrid' | 'onsite' | 'unknown'
  salary_min        INTEGER,
  salary_max        INTEGER,
  currency          TEXT,        -- ISO 4217, e.g. 'USD'
  equity            BOOLEAN,
  seniority         TEXT[] NOT NULL DEFAULT '{}',
  tech_stack        TEXT[] NOT NULL DEFAULT '{}',
  visa_sponsorship  BOOLEAN,
  contract_type     TEXT,        -- 'fulltime' | 'parttime' | 'contract' | 'intern'
  apply_url         TEXT,
  apply_email       TEXT,
  summary_1line     TEXT,
  embedding         vector(1024),

  UNIQUE (post_raw_id, extractor_version)
);
CREATE INDEX IF NOT EXISTS posts_ext_post_idx     ON posts_extractions (post_raw_id);
CREATE INDEX IF NOT EXISTS posts_ext_version_idx  ON posts_extractions (extractor_version);
CREATE INDEX IF NOT EXISTS posts_ext_canon_idx    ON posts_extractions (canonical_company);
CREATE INDEX IF NOT EXISTS posts_ext_remote_idx   ON posts_extractions (remote_policy);
CREATE INDEX IF NOT EXISTS posts_ext_tech_gin     ON posts_extractions USING GIN (tech_stack);
CREATE INDEX IF NOT EXISTS posts_ext_loc_gin      ON posts_extractions USING GIN (locations);
CREATE INDEX IF NOT EXISTS posts_ext_emb_ivf      ON posts_extractions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- App query surface: latest extraction per post.
CREATE OR REPLACE VIEW posts AS
SELECT DISTINCT ON (e.post_raw_id)
  e.*,
  r.story_id,
  r.author,
  r.posted_at,
  r.text AS raw_text
FROM posts_extractions e
JOIN posts_raw r ON r.hn_item_id = e.post_raw_id
WHERE e.extraction_failed = FALSE
ORDER BY e.post_raw_id, e.extracted_at DESC;

-- Company canonicalization.
CREATE TABLE IF NOT EXISTS companies (
  canonical_name  TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  post_count      INTEGER NOT NULL DEFAULT 0,
  first_seen      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies_aliases (
  raw_name        TEXT PRIMARY KEY,
  canonical_name  TEXT NOT NULL REFERENCES companies(canonical_name) ON DELETE CASCADE
);
