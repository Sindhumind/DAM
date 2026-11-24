-- 1. Enable pg_trgm extension for fast ILIKE '%term%' wildcard searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add composite index for paginated chronological listing
CREATE INDEX IF NOT EXISTS idx_assets_created_id
  ON assets (created_at DESC, id DESC);

-- 3. Add indexes for filtering by owner and processing status
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by
  ON assets (uploaded_by);

CREATE INDEX IF NOT EXISTS idx_assets_status
  ON assets (status);

-- 4. Add GIN trigram indexes for fast filename and JSONB title searches
CREATE INDEX IF NOT EXISTS idx_assets_search
  ON assets USING gin (original_filename gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_assets_metadata_title_trgm
  ON assets USING gin ((metadata->>'title') gin_trgm_ops);

-- 5. Add GIN index on JSONB metadata for flexible containment/key queries
CREATE INDEX IF NOT EXISTS idx_assets_metadata_gin
  ON assets USING gin (metadata);
