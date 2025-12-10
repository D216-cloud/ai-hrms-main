import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get all applications for logged-in job seeker
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'job_seeker') {
      return Response.json(
        { error: 'Unauthorized - Job seekers only' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    console.log('=== FETCHING APPLICATIONS ===');
    console.log('User email:', userEmail);
    console.log('User role:', session.user.role);

    // Get job seeker ID
    const { data: jobSeeker, error: seekerError } = await supabaseAdmin
      .from('job_seekers')
      .select('id, email, full_name')
      .eq('email', userEmail)
      .single();

    if (seekerError || !jobSeeker) {
      console.error('Error fetching job seeker:', seekerError);
      return Response.json(
        { error: 'Job seeker profile not found', details: seekerError?.message },
        { status: 404 }
      );
    }

    console.log('Job seeker found:', jobSeeker.id, jobSeeker.full_name);

    // Get all applications for this seeker from applications table (matching by email)
    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from('applications')
      .select('id, job_id, status, created_at, cover_letter, resume_url, resume_match_score, updated_at, overall_score, name, email')
      .eq('email', userEmail)
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError);
      console.error('Error code:', applicationsError.code);
      console.error('Error message:', applicationsError.message);
      
      // If applications table doesn't exist, return empty array with helpful message
      if (applicationsError.code === 'PGRST205' || applicationsError.code === '42P01') {
        console.warn('applications table not found - please run database setup');
        return Response.json({
          applications: [],
          total: 0,
          message: 'Database setup required. Please contact administrator.'
        });
      }
      
      return Response.json(
        { 
          error: 'Failed to fetch applications',
          details: applicationsError.message 
        },
        { status: 500 }
      );
    }

    console.log('Applications found:', applications?.length || 0);
    console.log('Application IDs:', applications?.map(a => a.id) || []);

    // Now fetch job details for each application
    let applicationsWithJobs = [];
    if (applications && applications.length > 0) {
      const jobIds = applications.map(app => app.job_id);
      console.log('Fetching job details for job IDs:', jobIds);
      
      const { data: jobs, error: jobsError } = await supabaseAdmin
        .from('jobs')
        .select('id, title, company, location, description, salary_min, salary_max, job_type')
        .in('id', jobIds);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }

      console.log('Jobs fetched:', jobs?.length || 0);
      if (jobs && jobs.length > 0) {
        console.log('Sample job:', jobs[0]);
      }

      // Merge job details into applications
      applicationsWithJobs = applications.map(app => {
        const matchedJob = jobs?.find(j => j.id === app.job_id);
        console.log(`Application ${app.id} - Job ID: ${app.job_id}, Found: ${!!matchedJob}`);
        
        return {
          ...app,
          applied_at: app.created_at, // Add applied_at alias for frontend compatibility
          match_score: Math.round(app.resume_match_score || app.overall_score || 0), // Add match_score for compatibility
          jobs: matchedJob || null,
        };
      });
      
      console.log('Applications with jobs:', applicationsWithJobs.length);
      console.log('Sample application with job:', JSON.stringify(applicationsWithJobs[0], null, 2));
    }

    console.log('=== RETURNING APPLICATIONS ===');
    console.log('Total:', applicationsWithJobs?.length || 0);
    
    return Response.json({
      applications: applicationsWithJobs || [],
      total: applicationsWithJobs?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/seeker/applications:', error);
    return Response.json(
      {
        error: 'Failed to fetch applications',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
