-- Add scheduled_at column to support interview scheduling

ALTER TABLE IF EXISTS public.job_applications
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NULL;

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NULL;

-- Add indices for scheduled_at (optional but useful for sorting)
CREATE INDEX IF NOT EXISTS idx_job_applications_scheduled_at ON public.job_applications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_applications_scheduled_at ON public.applications(scheduled_at);
