-- Add saved_job column to jobs table
-- This column tracks if a job has been saved by job seekers

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS saved_job BOOLEAN DEFAULT FALSE;

-- Create index for saved_job column for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_saved_job ON jobs(saved_job);

-- Comment on the column
COMMENT ON COLUMN jobs.saved_job IS 'Boolean flag to track if this job is a saved/bookmarked job by job seekers. Default is FALSE.';
