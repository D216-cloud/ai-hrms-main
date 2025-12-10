-- Add education-related columns to job_seekers table
-- Note: This denormalizes the data structure. Recommended approach is to use job_seeker_education table.

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS school_name TEXT;

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS degree TEXT;

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS field_of_study TEXT;

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS gpa TEXT;