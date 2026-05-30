-- Recreate the posts view to include new salary_min_usd / salary_max_usd columns.
-- posts_extractions gained these columns in migration 0005; the view must be
-- dropped and recreated because CREATE OR REPLACE VIEW cannot change column order.
DROP VIEW IF EXISTS posts;

CREATE VIEW posts AS
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
