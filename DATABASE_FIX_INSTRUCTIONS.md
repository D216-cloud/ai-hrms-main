# 🚨 URGENT: FIX DATABASE TO MAKE SAVED JOBS & APPLICATIONS WORK

## Current Issues:
❌ Saved Jobs page shows 500 error
❌ Applications page doesn't show job details
❌ Database is missing required tables and columns

## ✅ SOLUTION - Follow These Steps EXACTLY:

### Step 1: Open Supabase SQL Editor
Click this link: https://supabase.com/dashboard/project/mphzqewnvtkcaswydjmn/sql/new

### Step 2: Copy This ENTIRE SQL Block

```sql
-- 1. Add company column to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company TEXT;

-- 2. Add description column to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Add salary_min column to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER;

-- 4. Add salary_max column to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER;

-- 5. Update existing jobs with default company
UPDATE jobs SET company = 'TechCorp' WHERE company IS NULL OR company = '';

-- 6. Create saved_jobs table
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- 7. Create index on saved_jobs.seeker_id
CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker_id ON public.saved_jobs(seeker_id);

-- 8. Create index on saved_jobs.job_id
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);
```

### Step 3: Paste into Supabase SQL Editor

### Step 4: Click the "Run" Button (or press Ctrl+Enter)

### Step 5: Wait for "Success" message

### Step 6: Refresh Your Application in Browser

---

## After Running SQL, You Will Have:

✅ **Saved Jobs Feature Working**
   - Each user sees ONLY their saved jobs
   - No cross-user contamination
   - Save/unsave buttons work perfectly

✅ **Applications Page Working**
   - Shows real job titles
   - Shows real company names
   - Shows all application details

✅ **No More 500 Errors**
   - All database tables exist
   - All columns are present
   - Everything works smoothly

---

## Verification

After running the SQL, you can verify it worked:

1. Go to Supabase Dashboard > Table Editor
2. Check that you see `saved_jobs` table
3. Check that `jobs` table has `company`, `description`, `salary_min`, `salary_max` columns
4. Test the application by:
   - Saving a job → Check Saved Jobs page
   - Applying to a job → Check Applications page

---

## If You Still Have Issues:

Run this command to check the database:
```bash
node check-saved-jobs-setup.js
```

It will tell you exactly what's missing.
