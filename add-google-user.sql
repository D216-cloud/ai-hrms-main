-- SQL script to add a Google user to the HR system
-- Replace 'your-google-email@example.com' and 'Your Name' with your actual Google email and name

INSERT INTO hr_users (email, name, role, password_hash, is_active)
VALUES (
  'your-google-email@example.com',  -- Replace with your Google email
  'Your Name',                      -- Replace with your name
  'hr',                             -- Role: 'hr' or 'admin'
  'google-auth-user',               -- Placeholder password hash (not used for Google auth)
  true                              -- Active status
)
ON CONFLICT (email) 
DO UPDATE SET 
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- To run this script:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this script
-- 4. Replace the placeholder values with your actual information
-- 5. Run the query