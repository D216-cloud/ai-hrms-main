-- Create job_applications table for authenticated job seekers
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'viewed', 'shortlisted', 'rejected', 'accepted', 'under_review')),
  match_score INTEGER,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_seeker_id ON public.job_applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_applications_updated_at_trigger
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applications_updated_at();
