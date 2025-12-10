-- Migration: Make created_by nullable (if not already)
-- This ensures jobs can be created even if user ID is missing

-- The created_by field should already be nullable in the schema
-- This migration is just to ensure it in case your database was created differently

ALTER TABLE jobs ALTER COLUMN created_by DROP NOT NULL;

-- Add a comment to document this
COMMENT ON COLUMN jobs.created_by IS 'HR user who created the job. Nullable to support legacy data or OAuth issues.';
