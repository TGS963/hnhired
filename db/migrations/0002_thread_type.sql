-- Distinguish "Who is hiring?" from "Freelancer? Seeking freelancer?" threads.

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS thread_type TEXT NOT NULL DEFAULT 'hiring'
    CHECK (thread_type IN ('hiring', 'freelancer'));

CREATE INDEX IF NOT EXISTS stories_thread_type_idx ON stories (thread_type);

-- Posts view needs thread_type so app can filter.
CREATE OR REPLACE VIEW posts AS
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
ORDER BY e.post_raw_id, e.extracted_at DESC;
