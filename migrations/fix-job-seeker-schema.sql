-- Fix Job Seeker Schema
-- This migration ensures the job_seeker table structure is correct

-- Ensure the job_seekers table exists with proper structure
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

-- Ensure the job_seeker_skills table exists
CREATE TABLE IF NOT EXISTS public.job_seeker_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seeker_id, skill_name)
);

-- Ensure the job_seeker_experience table exists
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

-- Ensure the job_seeker_education table exists
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_seekers_auth_id ON public.job_seekers(auth_id);
CREATE INDEX IF NOT EXISTS idx_job_seekers_email ON public.job_seekers(email);
CREATE INDEX IF NOT EXISTS idx_job_seeker_skills_seeker_id ON public.job_seeker_skills(seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_experience_seeker_id ON public.job_seeker_experience(seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_education_seeker_id ON public.job_seeker_education(seeker_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_education ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Job Seekers (users can only see their own data)
CREATE POLICY "Users can view their own profile"
  ON public.job_seekers FOR SELECT
  USING (auth_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own profile"
  ON public.job_seekers FOR UPDATE
  USING (auth_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own profile"
  ON public.job_seekers FOR INSERT
  WITH CHECK (auth_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for Skills (users can only manage their own)
CREATE POLICY "Users can view their own skills"
  ON public.job_seeker_skills FOR SELECT
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can manage their own skills"
  ON public.job_seeker_skills FOR ALL
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- RLS Policies for Experience
CREATE POLICY "Users can view their own experience"
  ON public.job_seeker_experience FOR SELECT
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can manage their own experience"
  ON public.job_seeker_experience FOR ALL
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- RLS Policies for Education
CREATE POLICY "Users can view their own education"
  ON public.job_seeker_education FOR SELECT
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can manage their own education"
  ON public.job_seeker_education FOR ALL
  USING (seeker_id IN (SELECT id FROM public.job_seekers WHERE auth_id = current_setting('request.jwt.claims', true)::json->>'sub'));