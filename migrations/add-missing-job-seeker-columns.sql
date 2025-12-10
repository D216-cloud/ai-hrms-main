-- Add missing columns to job_seekers table to support unified profile storage
-- This migration adds columns that may be referenced in the code but missing from the schema

-- Add experience column (as TEXT to store JSON data)
ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT '[]';

-- Add education column (as TEXT to store JSON data)
ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS education TEXT DEFAULT '[]';

-- Add skills column (as TEXT to store JSON data)
ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT '[]';

-- Add certifications column (as TEXT to store JSON data)
ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS certifications TEXT DEFAULT '[]';

-- Add profile_completion column
ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;

-- Add title column
ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_seekers_experience ON public.job_seekers(experience);
CREATE INDEX IF NOT EXISTS idx_job_seekers_education ON public.job_seekers(education);
CREATE INDEX IF NOT EXISTS idx_job_seekers_skills ON public.job_seekers(skills);
CREATE INDEX IF NOT EXISTS idx_job_seekers_profile_completion ON public.job_seekers(profile_completion);