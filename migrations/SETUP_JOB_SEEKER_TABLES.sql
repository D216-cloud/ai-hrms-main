-- IMPORTANT: Run this in Supabase SQL Editor to initialize job seeker tables

-- Create job_seeker_experience table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.job_seeker_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_seeker_experience_seeker_id 
ON public.job_seeker_experience(seeker_id);

-- Create job_seeker_education table if it doesn't exist
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_seeker_education_seeker_id 
ON public.job_seeker_education(seeker_id);

-- Create job_seeker_skills table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.job_seeker_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_seeker_skills_seeker_id 
ON public.job_seeker_skills(seeker_id);

-- Enable RLS on all tables
ALTER TABLE public.job_seeker_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_skills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_seeker_experience
CREATE POLICY "job_seeker_experience_select_own" 
ON public.job_seeker_experience FOR SELECT
USING (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

CREATE POLICY "job_seeker_experience_insert_own" 
ON public.job_seeker_experience FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

CREATE POLICY "job_seeker_experience_update_own" 
ON public.job_seeker_experience FOR UPDATE
USING (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

CREATE POLICY "job_seeker_experience_delete_own" 
ON public.job_seeker_experience FOR DELETE
USING (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

-- Create RLS policies for job_seeker_education
CREATE POLICY "job_seeker_education_select_own" 
ON public.job_seeker_education FOR SELECT
USING (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

CREATE POLICY "job_seeker_education_insert_own" 
ON public.job_seeker_education FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

CREATE POLICY "job_seeker_education_update_own" 
ON public.job_seeker_education FOR UPDATE
USING (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

CREATE POLICY "job_seeker_education_delete_own" 
ON public.job_seeker_education FOR DELETE
USING (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

-- Create RLS policies for job_seeker_skills
CREATE POLICY "job_seeker_skills_select_own" 
ON public.job_seeker_skills FOR SELECT
USING (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

CREATE POLICY "job_seeker_skills_insert_own" 
ON public.job_seeker_skills FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

CREATE POLICY "job_seeker_skills_update_own" 
ON public.job_seeker_skills FOR UPDATE
USING (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));

CREATE POLICY "job_seeker_skills_delete_own" 
ON public.job_seeker_skills FOR DELETE
USING (auth.uid() = (SELECT auth_id FROM public.job_seekers WHERE id = seeker_id));
