-- Initialize AI-HRMS Database
-- Run this in Supabase SQL Editor if tables don't exist

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- HR Users Table
CREATE TABLE IF NOT EXISTS public.hr_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'hr' CHECK (role IN ('hr', 'admin')),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  location TEXT,
  experience_min INTEGER DEFAULT 0,
  experience_max INTEGER DEFAULT 10,
  skills TEXT[] DEFAULT '{}',
  salary_range TEXT,
  jd_text TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  jd_embedding VECTOR(3072),
  created_by UUID REFERENCES public.hr_users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hr_users_email ON public.hr_users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE public.hr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read of active jobs
CREATE POLICY "Allow public read active jobs" 
ON public.jobs FOR SELECT 
USING (status = 'active' OR auth.uid() IS NOT NULL);

-- RLS Policy: Allow authenticated users to read all jobs
CREATE POLICY "Allow authenticated read all jobs" 
ON public.jobs FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- RLS Policy: Allow HR/Admin to create jobs
CREATE POLICY "Allow HR create jobs" 
ON public.jobs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Allow HR/Admin to update jobs
CREATE POLICY "Allow HR update jobs" 
ON public.jobs FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Insert seed data (HR users) if they don't exist
INSERT INTO public.hr_users (email, name, role, password_hash, is_active) 
VALUES 
  ('admin@company.com', 'Admin User', 'admin', '$2b$10$5JD1GSQ3SClch8FSWCWVFuUufDjQ.nls0uwR7M7yv4181ToVODAWu', true),
  ('hr@company.com', 'HR Manager', 'hr', '$2b$10$5JD1GSQ3SClch8FSWCWVFuUufDjQ.nls0uwR7M7yv4181ToVODAWu', true)
ON CONFLICT (email) DO NOTHING;
