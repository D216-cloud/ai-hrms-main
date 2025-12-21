-- Add password_hash column to job_seekers for credential auth
ALTER TABLE public.job_seekers
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for email if not exists
CREATE INDEX IF NOT EXISTS idx_job_seekers_email ON public.job_seekers(email);
