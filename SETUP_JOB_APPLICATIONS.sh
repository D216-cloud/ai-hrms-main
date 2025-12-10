#!/bin/bash

# Setup job_applications table in Supabase
# This script provides instructions for setting up the required database tables

echo "========================================"
echo "AI-HRMS Database Setup Instructions"
echo "========================================"
echo ""
echo "To enable the 'My Applications' feature, you need to create the job_applications table."
echo ""
echo "Steps:"
echo "1. Go to your Supabase project dashboard"
echo "2. Click on 'SQL Editor' in the left sidebar"
echo "3. Click 'New Query'"
echo "4. Copy and paste the following SQL:"
echo ""
echo "========================================"
cat << 'EOF'

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_seeker_id ON public.job_applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- Create function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-update
CREATE TRIGGER job_applications_updated_at_trigger
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applications_updated_at();

EOF

echo ""
echo "========================================"
echo "5. Click 'Run' to execute the SQL"
echo "6. The table will be created immediately"
echo "7. Applications will start appearing on the 'My Applications' page"
echo "========================================"
