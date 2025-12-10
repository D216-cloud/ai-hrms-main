-- Create saved_jobs table for authenticated job seekers
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker_id ON public.saved_jobs(seeker_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);
