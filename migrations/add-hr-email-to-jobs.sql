-- Migration: Add email column to jobs table
-- This column will store the HR user's email who created the job

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hr_email TEXT;

-- Add a comment for clarity
COMMENT ON COLUMN jobs.hr_email IS 'Email of the HR user who created this job';

-- Optional: Add an index for performance if filtering by email frequently
CREATE INDEX IF NOT EXISTS idx_jobs_hr_email ON jobs(hr_email);