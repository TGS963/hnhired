-- Add USD-normalized salary columns for cross-currency comparisons.
-- Populated during ingest using live exchange rates at the time of extraction.
ALTER TABLE posts_extractions ADD COLUMN IF NOT EXISTS salary_min_usd INTEGER;
ALTER TABLE posts_extractions ADD COLUMN IF NOT EXISTS salary_max_usd INTEGER;
