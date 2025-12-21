-- Create hr_profiles table to store extended HR profile data
CREATE TABLE IF NOT EXISTS public.hr_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hr_user_id UUID UNIQUE REFERENCES public.hr_users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  title TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  timezone TEXT,
  availability JSONB DEFAULT '[]',
  skills TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  profile_completion INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hr_profiles_hr_user_id ON public.hr_profiles(hr_user_id);
CREATE INDEX IF NOT EXISTS idx_hr_profiles_email ON public.hr_profiles(full_name);

-- Trigger to update updated_at (idempotent)
CREATE OR REPLACE FUNCTION update_hr_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'hr_profiles_updated_at_trigger'
  ) THEN
    CREATE TRIGGER hr_profiles_updated_at_trigger
    BEFORE UPDATE ON public.hr_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_hr_profiles_updated_at();
  END IF;
END;
$$;

-- Row Level Security and policies
ALTER TABLE public.hr_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'hr_profiles_manage_own_or_admin' AND polrelid = 'public.hr_profiles'::regclass
  ) THEN
    CREATE POLICY hr_profiles_manage_own_or_admin ON public.hr_profiles
      FOR ALL USING (
        auth.uid() = hr_user_id OR
        EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END;
$$;

-- Grant basic access to authenticated (so server-side functions can still use it safely)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_profiles TO authenticated;