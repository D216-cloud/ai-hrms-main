-- Add interview and test related columns to job_applications and applications

ALTER TABLE IF EXISTS public.job_applications
  ADD COLUMN IF NOT EXISTS test_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS interview_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS interview_sent_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS interview_sent_by UUID NULL REFERENCES public.hr_users(id),
  ADD COLUMN IF NOT EXISTS test_sent_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}' NULL;

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS interview_sent_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS interview_sent_by UUID NULL REFERENCES public.hr_users(id),
  ADD COLUMN IF NOT EXISTS test_sent_at TIMESTAMPTZ NULL;

-- Indexes for tokens and sent timestamps
CREATE INDEX IF NOT EXISTS idx_job_applications_test_token ON public.job_applications(test_token);
CREATE INDEX IF NOT EXISTS idx_job_applications_interview_token ON public.job_applications(interview_token);
CREATE INDEX IF NOT EXISTS idx_job_applications_interview_sent_at ON public.job_applications(interview_sent_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_test_sent_at ON public.job_applications(test_sent_at);

CREATE INDEX IF NOT EXISTS idx_applications_interview_sent_at ON public.applications(interview_sent_at);
CREATE INDEX IF NOT EXISTS idx_applications_test_sent_at ON public.applications(test_sent_at);

-- Trigger function to auto-copy job required_skills into job_applications.skills or applications.skills
CREATE OR REPLACE FUNCTION copy_job_skills_to_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if skills is NULL or empty
  IF (NEW.skills IS NULL) OR (array_length(NEW.skills,1) IS NULL) OR (array_length(NEW.skills,1) = 0) THEN
    NEW.skills := COALESCE((SELECT required_skills FROM public.jobs WHERE id = NEW.job_id), (SELECT skills FROM public.jobs WHERE id = NEW.job_id), '{}');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to job_applications and applications (applications may not have job_id for some records, guard accordingly)
CREATE TRIGGER job_applications_copy_skills_before_save
BEFORE INSERT OR UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION copy_job_skills_to_application();

-- For public applications ensure we only attempt to copy when job_id is present
CREATE OR REPLACE FUNCTION copy_job_skills_to_public_application()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF (NEW.skills IS NULL) OR (array_length(NEW.skills,1) IS NULL) OR (array_length(NEW.skills,1) = 0) THEN
    NEW.skills := COALESCE((SELECT required_skills FROM public.jobs WHERE id = NEW.job_id), (SELECT skills FROM public.jobs WHERE id = NEW.job_id), '{}');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_copy_skills_before_save
BEFORE INSERT OR UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION copy_job_skills_to_public_application();
