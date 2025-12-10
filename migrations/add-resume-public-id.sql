-- Add resume_public_id column to job_seekers table for Cloudinary integration
ALTER TABLE public.job_seekers 
ADD COLUMN IF NOT EXISTS resume_public_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_seekers_resume_public_id ON public.job_seekers(resume_public_id);
