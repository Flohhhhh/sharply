-- 001_search_trgm.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- swap btree idx for trigram GIN
DROP INDEX IF EXISTS sharply_gear_search_idx;
CREATE INDEX IF NOT EXISTS sharply_gear_search_trgm_idx ON sharply_gear USING gin (search_name gin_trgm_ops);
