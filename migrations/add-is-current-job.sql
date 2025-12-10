-- Add is_current_job column to job_seeker_experience table
ALTER TABLE public.job_seeker_experience 
ADD COLUMN IF NOT EXISTS is_current_job BOOLEAN DEFAULT FALSE;

-- Create index for current job lookups
CREATE INDEX IF NOT EXISTS idx_job_seeker_experience_is_current_job 
ON public.job_seeker_experience(is_current_job);
