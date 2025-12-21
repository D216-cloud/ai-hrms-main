-- Create interviewers table for HR to manage interviewers
CREATE TABLE IF NOT EXISTS public.interviewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  title TEXT,
  bio TEXT,
  profile_picture TEXT,
  availability JSONB, -- free-form availability or recurring slots
  timezone TEXT,
  default_meeting_link TEXT,
  default_test_link TEXT,
  default_instructions TEXT,
  external_calendar_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.hr_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interviewers_email ON public.interviewers(email);
CREATE INDEX IF NOT EXISTS idx_interviewers_is_active ON public.interviewers(is_active);

-- Ensure legacy installs receive new columns (idempotent)
ALTER TABLE IF EXISTS public.interviewers
  ADD COLUMN IF NOT EXISTS profile_picture TEXT,
  ADD COLUMN IF NOT EXISTS availability JSONB,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS default_meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS default_test_link TEXT,
  ADD COLUMN IF NOT EXISTS default_instructions TEXT,
  ADD COLUMN IF NOT EXISTS external_calendar_id TEXT;

CREATE INDEX IF NOT EXISTS idx_interviewers_external_calendar_id ON public.interviewers(external_calendar_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_interviewers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'interviewers_updated_at_trigger'
  ) THEN
    CREATE TRIGGER interviewers_updated_at_trigger
    BEFORE UPDATE ON public.interviewers
    FOR EACH ROW
    EXECUTE FUNCTION update_interviewers_updated_at();
  END IF;
END;
$$;

-- Enable Row Level Security and restrict access to HR/Admins
ALTER TABLE public.interviewers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'HR can manage interviewers' AND polrelid = 'public.interviewers'::regclass
  ) THEN
    CREATE POLICY "HR can manage interviewers" ON public.interviewers
      FOR ALL USING (
        EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr','admin'))
      );
  END IF;
END;
$$;

-- Add interviewer-related fields to job_applications
ALTER TABLE IF EXISTS public.job_applications
  ADD COLUMN IF NOT EXISTS interviewer_id UUID REFERENCES public.interviewers(id),
  ADD COLUMN IF NOT EXISTS meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS interview_mode TEXT CHECK (interview_mode IN ('virtual','on_site','phone')) DEFAULT 'virtual',
  ADD COLUMN IF NOT EXISTS interview_duration_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS interviewer_notes TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_job_applications_interviewer_id ON public.job_applications(interviewer_id);

-- Add interviewer-related fields to public applications as well
ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS interviewer_id UUID REFERENCES public.interviewers(id),
  ADD COLUMN IF NOT EXISTS meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS interview_mode TEXT CHECK (interview_mode IN ('virtual','on_site','phone')) DEFAULT 'virtual',
  ADD COLUMN IF NOT EXISTS interview_duration_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS interviewer_notes TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_interviewer_id ON public.applications(interviewer_id);
