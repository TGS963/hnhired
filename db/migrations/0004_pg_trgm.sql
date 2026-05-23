CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS posts_raw_text_trgm
  ON posts_raw USING GIN (text gin_trgm_ops);
