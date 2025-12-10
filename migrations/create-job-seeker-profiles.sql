-- Job Seeker Profiles Table for storing profile data
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  fullName VARCHAR(255),
  phone VARCHAR(20),
  location VARCHAR(255),
  title VARCHAR(255),
  bio TEXT,
  profileImage LONGTEXT,
  resume VARCHAR(255),
  skills LONGTEXT DEFAULT '[]',
  experience LONGTEXT DEFAULT '[]',
  education LONGTEXT DEFAULT '[]',
  certifications LONGTEXT DEFAULT '[]',
  profileCompletion INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (email) 
    REFERENCES auth.users(email) 
    ON DELETE CASCADE
);

-- Create index for faster email lookups
CREATE INDEX idx_job_seeker_profiles_email ON job_seeker_profiles(email);

-- Enable RLS (Row Level Security)
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/write their own profile
CREATE POLICY job_seeker_profiles_select_own 
  ON job_seeker_profiles 
  FOR SELECT 
  USING (auth.uid()::text = email OR email IS NOT NULL);

CREATE POLICY job_seeker_profiles_insert_own 
  ON job_seeker_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = email);

CREATE POLICY job_seeker_profiles_update_own 
  ON job_seeker_profiles 
  FOR UPDATE 
  USING (auth.uid()::text = email);

CREATE POLICY job_seeker_profiles_delete_own 
  ON job_seeker_profiles 
  FOR DELETE 
  USING (auth.uid()::text = email);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON job_seeker_profiles TO authenticated;
GRANT USAGE ON SEQUENCE job_seeker_profiles_id_seq TO authenticated;
