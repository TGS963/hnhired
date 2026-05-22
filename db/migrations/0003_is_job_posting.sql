-- Track whether an extracted comment is actually a job posting.
-- Filters out meta-comments, accidental terminal pastes, off-topic replies, etc.

ALTER TABLE posts_extractions
  ADD COLUMN IF NOT EXISTS is_job_posting BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS posts_ext_is_job_idx
  ON posts_extractions (is_job_posting);

DROP VIEW IF EXISTS posts;
CREATE VIEW posts AS
SELECT DISTINCT ON (e.post_raw_id)
  e.*,
  r.story_id,
  r.author,
  r.posted_at,
  r.text AS raw_text,
  s.thread_type,
  s.month AS story_month
FROM posts_extractions e
JOIN posts_raw r ON r.hn_item_id = e.post_raw_id
JOIN stories s ON s.id = r.story_id
WHERE e.extraction_failed = FALSE
  AND e.is_job_posting = TRUE
ORDER BY e.post_raw_id, e.extracted_at DESC;
