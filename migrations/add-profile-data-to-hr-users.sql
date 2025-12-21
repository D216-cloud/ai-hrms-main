-- Add JSONB column to hr_users to store full HR profile snapshot
ALTER TABLE public.hr_users
ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'::jsonb;

-- Optionally create a GIN index for querying profile_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_hr_users_profile_data' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_hr_users_profile_data ON public.hr_users USING gin (profile_data jsonb_path_ops);
  END IF;
END$$;
