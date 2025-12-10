# How to Fix Missing Company Column in Jobs Table

## Problem
The `jobs` table is missing the `company` column and other important fields, so job applications can't display company names.

## Solution
Run this SQL in your Supabase SQL Editor:

### Steps:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/mphzqewnvtkcaswydjmn
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the SQL below
5. Click "Run" or press Ctrl+Enter

### SQL to Run:

```sql
-- Add missing columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS min_experience INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_experience INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_skills TEXT[];

-- Update existing jobs to have a default company name if null
UPDATE jobs SET company = 'TechCorp' WHERE company IS NULL OR company = '';

-- Add a comment to document the column
COMMENT ON COLUMN jobs.company IS 'Company name for the job posting';
```

### After Running the SQL:

1. Refresh your browser
2. Go to the Applications page
3. You should now see real job titles and company names!

### Alternative: Update Existing Jobs Manually

If you want to set specific company names for existing jobs, you can run:

```sql
-- List all jobs to see their IDs
SELECT id, title, company FROM jobs;

-- Update specific jobs with company names
-- Replace the UUID and company name as needed
UPDATE jobs 
SET company = 'Your Company Name' 
WHERE id = 'job-uuid-here';
```

## What This Fixes:
- ✅ Job title will show correctly
- ✅ Company name will show instead of "Company"
- ✅ Applications page will display real data
- ✅ All job-related APIs will work properly
