# 💾 Saved Jobs Feature - Complete Working Solution

## 🎯 Problem Statement
Saved jobs are not displaying on `/seeker/saved-jobs` page

## 🔧 Root Causes & Fixes

### Issue 1: Jobs API Not Filtering Correctly
**Current Problem**: `/api/jobs` returns ALL jobs, but doesn't return per-user saved status

**Solution**: Modify API to track saved jobs per user

### Issue 2: Saved Jobs Table Not Synced
**Current Problem**: `saved_job` boolean in jobs table isn't linked to user

**Solution**: Use `saved_jobs` table as the source of truth for per-user saves

### Issue 3: Complex Data Structure
**Current Problem**: Fallback logic creates confusion with nested data

**Solution**: Simplify to single consistent structure

---

## ✅ BEST PRACTICE APPROACH

### Step 1: Simplify the Saved Jobs API (CRITICAL)

**File**: `/app/api/seeker/saved-jobs/route.js`

**Strategy**: 
- Query `saved_jobs` table for current user
- Join with `jobs` table to get full job details
- Always return consistent format
- No complex fallbacks

**Implementation**:
```javascript
// GET - Get all saved jobs for logged-in job seeker
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'job_seeker') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get job seeker ID
    const { data: jobSeeker, error: seekerError } = await supabaseAdmin
      .from('job_seekers')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (seekerError || !jobSeeker) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Query saved_jobs with joined job details
    const { data: savedJobsData, error } = await supabaseAdmin
      .from('saved_jobs')
      .select(`
        id,
        job_id,
        saved_at,
        jobs (
          id,
          title,
          company,
          location,
          description,
          salary_min,
          salary_max,
          job_type,
          status,
          saved_job
        )
      `)
      .eq('seeker_id', jobSeeker.id)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return Response.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    // Format response - handle null jobs (deleted job)
    const validJobs = (savedJobsData || [])
      .filter(item => item.jobs !== null)
      .map(item => ({
        id: item.id,
        job_id: item.job_id,
        saved_at: item.saved_at,
        jobs: item.jobs
      }));

    return Response.json({
      savedJobs: validJobs,
      total: validJobs.length,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

### Step 2: Ensure Jobs API Works Correctly

**File**: `/app/api/jobs/route.js`

**Keep existing**: Returns all active jobs with `saved_job: false` (default)

**Why**: This prevents complexity - the saved status comes from `/api/seeker/saved-jobs`

---

### Step 3: Fix the Saved Jobs Page

**File**: `/app/seeker/saved-jobs/page.jsx`

**Key Changes**:
- Handle both nested (`job.jobs`) and direct (`job`) structures
- Add better error handling
- Add refresh button
- Add debug logging

**Implementation**:
```javascript
// In the page component:

const fetchSavedJobs = async () => {
  try {
    setLoading(true);
    console.log('Fetching saved jobs...');
    
    const res = await fetch('/api/seeker/saved-jobs', {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    
    const data = await res.json();
    console.log('Saved jobs response:', data);
    
    setSavedJobs(data.savedJobs || []);
    setFilteredJobs(data.savedJobs || []);
  } catch (error) {
    console.error('Error:', error);
    setSavedJobs([]);
    setFilteredJobs([]);
  } finally {
    setLoading(false);
  }
};

// Helper to get job object (handles nested structure)
const getJobObject = (savedJob) => {
  return savedJob.jobs || savedJob;
};

// In render:
{filteredJobs.map(savedJob => {
  const job = getJobObject(savedJob);
  return (
    <div key={savedJob.job_id || job.id}>
      <h3>{job.title}</h3>
      <p>{job.company}</p>
      {/* ... rest of UI */}
    </div>
  );
})}
```

---

### Step 4: Fix Toggle Save API

**File**: `/app/api/seeker/toggle-save-job/route.js`

**Critical Fix**: When user saves a job:
1. Insert into `saved_jobs` table (tracks per-user saves)
2. Set `saved_job = true` in `jobs` table (global flag)

When user unsaves:
1. Delete from `saved_jobs` table
2. Only set `saved_job = false` if NO OTHER users have it saved

**Implementation**:
```javascript
// SAVE JOB
if (saved) {
  // 1. Update jobs table
  await supabaseAdmin
    .from('jobs')
    .update({ saved_job: true })
    .eq('id', jobId);

  // 2. Insert into saved_jobs
  await supabaseAdmin
    .from('saved_jobs')
    .insert({ job_id: jobId, seeker_id: seeker.id, saved_at: new Date().toISOString() })
    .select()
    .single();

  return Response.json({ saved: true, message: 'Job saved!' });
}

// UNSAVE JOB
else {
  // 1. Delete from saved_jobs
  const { error } = await supabaseAdmin
    .from('saved_jobs')
    .delete()
    .eq('job_id', jobId)
    .eq('seeker_id', seeker.id);

  if (error) throw error;

  // 2. Check if other users have this saved
  const { data: otherSaves } = await supabaseAdmin
    .from('saved_jobs')
    .select('id')
    .eq('job_id', jobId);

  // 3. Only clear saved_job if nobody else has it
  if (!otherSaves || otherSaves.length === 0) {
    await supabaseAdmin
      .from('jobs')
      .update({ saved_job: false })
      .eq('id', jobId);
  }

  return Response.json({ saved: false, message: 'Job unsaved!' });
}
```

---

### Step 5: Database Schema Verification

**Ensure tables exist**:

```sql
-- 1. Check jobs table has saved_job column
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS saved_job BOOLEAN DEFAULT FALSE;

-- 2. Check saved_jobs table exists with proper structure
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker_id 
ON saved_jobs(seeker_id);
```

---

## 🚀 QUICK FIX CHECKLIST

- [ ] **Step 1**: Simplify `/api/seeker/saved-jobs/route.js` (use joined query only)
- [ ] **Step 2**: Verify `/api/jobs/route.js` returns active jobs correctly
- [ ] **Step 3**: Update `/app/seeker/saved-jobs/page.jsx` with helper function
- [ ] **Step 4**: Fix `/app/api/seeker/toggle-save-job/route.js` to check other saves
- [ ] **Step 5**: Run migration to ensure schema is correct
- [ ] **Test 1**: Open `/seeker/saved-jobs` (should show "No saved jobs")
- [ ] **Test 2**: Go to `/jobs`, save 1 job
- [ ] **Test 3**: Return to `/seeker/saved-jobs` (should show 1 job)
- [ ] **Test 4**: Check navbar shows "❤️ Saved (1)"
- [ ] **Test 5**: Unsave the job, verify it disappears

---

## 📊 Data Flow Diagram

```
User Saves Job
    ↓
POST /api/seeker/toggle-save-job (saved: true)
    ↓
Update jobs.saved_job = true (global flag)
↓
Insert into saved_jobs table (per-user tracking)
    ↓
GET /api/seeker/saved-jobs
    ↓
Query saved_jobs table with joined jobs table
    ↓
Return formatted array to frontend
    ↓
Display on /seeker/saved-jobs page
```

---

## 💡 Key Principles

1. **Single Source of Truth**: Use `saved_jobs` table for per-user saves
2. **Consistent Structure**: Always return `{ id, job_id, saved_at, jobs: {...} }`
3. **Simple Queries**: Use Supabase joins instead of multiple queries
4. **Error Handling**: Filter out null jobs (deleted jobs)
5. **No Complexity**: Remove fallback chains - use one clean path

---

## ✨ Testing URLs

- Jobs page: `http://localhost:3000/jobs`
- Saved jobs page: `http://localhost:3000/seeker/saved-jobs`
- Test debug: `http://localhost:3000/test-saved-jobs`

Open browser console (F12) to see detailed logs!
