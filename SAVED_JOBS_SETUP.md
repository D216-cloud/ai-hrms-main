# 🚀 Saved Jobs Feature Setup Guide

## Overview
The saved jobs feature allows job seekers to bookmark jobs for later reference. The feature includes:
- ✅ Save/unsave jobs from job listings
- ✅ Dashboard card showing saved jobs with real data
- ✅ Real-time sync with database
- ✅ Job details display (title, company, location, salary)

## Current Status
✅ **Frontend**: Fully implemented
✅ **API Endpoint**: Fully implemented  
✅ **Database Schema**: Ready to deploy

❌ **Database Table**: Needs to be created in Supabase

## How to Enable Saved Jobs

### Step 1: Create the `saved_jobs` Table

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"+ New Query"**
5. Copy and paste the SQL below:

```sql
-- Create saved_jobs table for authenticated job seekers
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker_id ON public.saved_jobs(seeker_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);
```

6. Click **"Run"** button
7. You should see the message: "Success. No rows returned"

### Step 2: Verify the Setup

After creating the table, refresh your browser and:

1. Go to the **Dashboard** (`/seeker/dashboard`)
2. Scroll down to **"Your Saved Jobs"** section
3. You should see:
   - Empty state if no jobs are saved: "No saved jobs yet"
   - Job cards if jobs have been saved

### Step 3: Save a Job (Test)

To test the feature:

1. Go to **Jobs** page (`/jobs`)
2. Find a job you like
3. Click the **❤️ Save** button on the job card
4. Go back to **Dashboard**
5. The job should appear in **"Your Saved Jobs"** section

## File Locations

**Frontend Files:**
- Dashboard: `/app/seeker/dashboard/page.jsx`
- Applications Page: `/app/seeker/applications/page.jsx`
- Profile Page: `/app/seeker/profile/page.jsx`

**API Endpoints:**
- Get Saved Jobs: `/app/api/seeker/saved-jobs/route.js`
- Get Applications: `/app/api/seeker/applications/route.js`

**Database Migrations:**
- Saved Jobs: `/migrations/create-saved-jobs.sql`
- Job Applications: `/migrations/create-job-applications.sql`

## API Response Format

### GET `/api/seeker/saved-jobs`

**Response (200 OK):**
```json
{
  "savedJobs": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "saved_at": "2025-12-09T10:30:00Z",
      "jobs": {
        "id": "uuid",
        "title": "Senior Developer",
        "company": "Tech Corp",
        "location": "New York, NY",
        "description": "...",
        "salary_min": 100,
        "salary_max": 150,
        "job_type": "Full-time"
      }
    }
  ],
  "total": 1
}
```

**Response (Table not found - 200 OK):**
```json
{
  "savedJobs": [],
  "total": 0
}
```

## Troubleshooting

### Issue: "No saved jobs yet" but I saved a job

**Solution:**
1. Check browser console (F12) for errors
2. Verify the `saved_jobs` table exists in Supabase
3. Check that you're logged in as a job seeker
4. Try refreshing the page

### Issue: Getting 401 Unauthorized error

**Solution:**
1. Make sure you're logged in
2. Log out and log back in
3. Check that your session is valid

### Issue: API returns 404 "Job seeker profile not found"

**Solution:**
1. Go to your profile page and complete your profile
2. Make sure your email is saved correctly
3. Check that your job seeker account exists in the database

## Database Schema

```sql
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL (references jobs),
  seeker_id UUID NOT NULL (references job_seekers),
  saved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(job_id, seeker_id)
);
```

## Next Steps

After setting up the table:

1. ✅ Save jobs from the jobs listing
2. ✅ View saved jobs on dashboard
3. ✅ See job details and apply
4. ✅ Delete saved jobs (feature coming soon)

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check the server logs (terminal output)
3. Verify the `saved_jobs` table exists: `SELECT COUNT(*) FROM saved_jobs;`
4. Verify the `job_seekers` table has your account

---

**Last Updated**: December 9, 2025
**Version**: 1.0
