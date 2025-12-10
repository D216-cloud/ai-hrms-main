-- Add experience-related columns to job_seekers table
-- Note: This denormalizes the data structure. Recommended approach is to use job_seeker_experience table.

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS job_title TEXT;

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS company_name TEXT;

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS job_bio TEXT;

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS is_current_job BOOLEAN DEFAULT FALSE;

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