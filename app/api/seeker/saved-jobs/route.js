import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get all saved jobs for logged-in job seeker
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'job_seeker') {
      console.log('❌ Unauthorized - missing session or role');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    console.log('📌 Fetching saved jobs for:', userEmail);

    // First, get the job seeker's ID
    const { data: jobSeeker, error: seekerError } = await supabaseAdmin
      .from('job_seekers')
      .select('id, email, full_name')
      .eq('email', userEmail)
      .single();

    if (seekerError || !jobSeeker) {
      console.error('❌ Job seeker not found:', seekerError);
      return Response.json({ 
        error: 'Job seeker profile not found',
        details: seekerError?.message 
      }, { status: 404 });
    }

    console.log('✓ Job seeker found:', jobSeeker.id, jobSeeker.full_name);

    // Fetch saved jobs for THIS user only from saved_jobs table
    const { data: savedJobRecords, error: savedError } = await supabaseAdmin
      .from('saved_jobs')
      .select('*')
      .eq('seeker_id', jobSeeker.id)
      .order('created_at', { ascending: false });

    if (savedError) {
      console.error('❌ Error fetching saved jobs:', savedError);
      console.error('Error code:', savedError.code);
      console.error('Error details:', savedError.details);
      console.error('Error hint:', savedError.hint);
      
      // If table doesn't exist, return empty array
      if (savedError.code === 'PGRST116' || savedError.code === '42P01') {
        console.log('⚠️ saved_jobs table not found - returning empty array');
        return Response.json({ 
          savedJobs: [],
          total: 0,
          message: 'No saved jobs table found. Please save a job first.'
        });
      }
      
      return Response.json({ 
        error: 'Failed to fetch saved jobs',
        details: savedError.message,
        code: savedError.code
      }, { status: 500 });
    }

    console.log('✓ Found', savedJobRecords?.length || 0, 'saved job records for this user');

    if (!savedJobRecords || savedJobRecords.length === 0) {
      return Response.json({
        savedJobs: [],
        total: 0,
      });
    }

    // Get job IDs
    const jobIds = savedJobRecords.map(record => record.job_id);
    console.log('📋 Fetching job details for:', jobIds);

    // Fetch the actual job details
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company, location, description, salary_min, salary_max, job_type, type, status, created_at')
      .in('id', jobIds);

    if (jobsError) {
      console.error('❌ Error fetching job details:', jobsError);
      return Response.json({ 
        error: 'Failed to fetch job details',
        details: jobsError.message 
      }, { status: 500 });
    }

    console.log('✓ Fetched', jobs?.length || 0, 'job details');

    // Merge saved job records with job details
    const formattedJobs = savedJobRecords.map(savedRecord => {
      const job = jobs?.find(j => j.id === savedRecord.job_id);
      
      // Use saved_at if it exists, otherwise use created_at
      const savedDate = savedRecord.saved_at || savedRecord.created_at || new Date().toISOString();
      
      return {
        id: savedRecord.id,
        job_id: savedRecord.job_id,
        saved_at: savedDate,
        jobs: job ? {
          id: job.id,
          title: job.title || 'Untitled Position',
          company: job.company || 'Company',
          location: job.location || 'Remote',
          description: job.description || job.jd_text || '',
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          job_type: job.job_type || job.type || 'Full-time',
          status: job.status,
        } : null
      };
    }).filter(item => item.jobs !== null); // Remove any saved jobs where the job was deleted

    console.log('✅ Returning', formattedJobs.length, 'saved jobs for user:', userEmail);
    if (formattedJobs.length > 0) {
      console.log('Sample saved job:', JSON.stringify(formattedJobs[0], null, 2));
    }

    return Response.json({
      savedJobs: formattedJobs,
      total: formattedJobs.length,
    });
  } catch (error) {
    console.error('❌ Error in saved-jobs API:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}