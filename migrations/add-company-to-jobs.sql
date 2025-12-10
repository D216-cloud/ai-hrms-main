-- Add company column to jobs table
-- This field was missing from the original schema but is required by the application

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS min_experience INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_experience INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_skills TEXT[];

-- Update existing jobs to have a default company name if null
UPDATE jobs SET company = 'Company Name' WHERE company IS NULL;

-- Add comment
COMMENT ON COLUMN jobs.company IS 'Company name for the job posting';
