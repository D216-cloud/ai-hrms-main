-- Enhanced AI-HRMS Database Schema
-- Job Seeker Profiles, Applications, and Resume Storage

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Job Seeker Users Table
CREATE TABLE IF NOT EXISTS public.job_seekers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL UNIQUE, -- References NextAuth user
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  resume_url TEXT,
  resume_filename TEXT,
  resume_uploaded_at TIMESTAMP WITH TIME ZONE,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Seeker Skills Table
CREATE TABLE IF NOT EXISTS public.job_seeker_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seeker_id, skill_name)
);

-- Job Seeker Experience Table
CREATE TABLE IF NOT EXISTS public.job_seeker_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_current_job BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Seeker Education Table
CREATE TABLE IF NOT EXISTS public.job_seeker_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  graduation_year INTEGER,
  gpa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  resume_url TEXT, -- Resume URL at time of application
  cover_letter TEXT,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'viewed', 'shortlisted', 'rejected', 'accepted')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- Saved Jobs Table
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_seekers_auth_id ON public.job_seekers(auth_id);
CREATE INDEX IF NOT EXISTS idx_job_seekers_email ON public.job_seekers(email);
CREATE INDEX IF NOT EXISTS idx_job_seeker_skills_seeker_id ON public.job_seeker_skills(seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_experience_seeker_id ON public.job_seeker_experience(seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_education_seeker_id ON public.job_seeker_education(seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_seeker_id ON public.job_applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker_id ON public.saved_jobs(seeker_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);

-- Enable RLS
ALTER TABLE public.job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Job Seekers (users can only see their own data)
CREATE POLICY "Users can view their own profile"
  ON public.job_seekers FOR SELECT
  USING (auth_id = current_user_id());

CREATE POLICY "Users can update their own profile"
  ON public.job_seekers FOR UPDATE
  USING (auth_id = current_user_id());

CREATE POLICY "Users can insert their own profile"
  ON public.job_seekers FOR INSERT
  WITH CHECK (auth_id = current_user_id());

-- RLS Policies for Skills (users can only manage their own)
CREATE POLICY "Users can view their own skills"
  ON public.job_seeker_skills FOR SELECT
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));

CREATE POLICY "Users can manage their own skills"
  ON public.job_seeker_skills FOR ALL
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));

-- RLS Policies for Experience
CREATE POLICY "Users can view their own experience"
  ON public.job_seeker_experience FOR SELECT
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));

CREATE POLICY "Users can manage their own experience"
  ON public.job_seeker_experience FOR ALL
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));

-- RLS Policies for Education
CREATE POLICY "Users can view their own education"
  ON public.job_seeker_education FOR SELECT
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));

CREATE POLICY "Users can manage their own education"
  ON public.job_seeker_education FOR ALL
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));

-- RLS Policies for Applications
CREATE POLICY "Users can view their own applications"
  ON public.job_applications FOR SELECT
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));

CREATE POLICY "Users can manage their own applications"
  ON public.job_applications FOR ALL
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));

-- RLS Policies for Saved Jobs
CREATE POLICY "Users can view their own saved jobs"
  ON public.saved_jobs FOR SELECT
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));

CREATE POLICY "Users can manage their own saved jobs"
  ON public.saved_jobs FOR ALL
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_user_id()));
