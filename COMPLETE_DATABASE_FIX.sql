-- ================================================
-- COMPLETE DATABASE FIX FOR SAVED JOBS & APPLICATIONS
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Add missing columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type TEXT;

-- Update existing jobs with default company name
UPDATE jobs SET company = 'TechCorp' WHERE company IS NULL OR company = '';

-- 2. Create saved_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker_id ON public.saved_jobs(seeker_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created_at ON public.saved_jobs(created_at DESC);

-- 3. Add comments for documentation
COMMENT ON TABLE public.saved_jobs IS 'Stores jobs saved by authenticated job seekers';
COMMENT ON COLUMN public.saved_jobs.job_id IS 'Reference to the saved job';
COMMENT ON COLUMN public.saved_jobs.seeker_id IS 'Reference to the job seeker who saved the job';
COMMENT ON COLUMN public.saved_jobs.saved_at IS 'Timestamp when the job was saved';

COMMENT ON COLUMN jobs.company IS 'Company name for the job posting';

-- 4. Verify the setup
SELECT 'saved_jobs table created successfully' AS status;
