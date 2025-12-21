-- Add columns to store last scheduled interview info
ALTER TABLE IF EXISTS public.interviewers
  ADD COLUMN IF NOT EXISTS last_scheduled_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_scheduled_timezone TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_interviewers_last_scheduled_at ON public.interviewers(last_scheduled_at);