-- Add `location` column to hr_profiles to store HR user's location
ALTER TABLE public.hr_profiles
ADD COLUMN IF NOT EXISTS location TEXT;
