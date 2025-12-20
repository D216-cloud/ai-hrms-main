import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Get all applications for this seeker from job_applications table
    // This table is where applications are actually stored when submitted via /api/applications
    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        jobs(id, title, company, location, description, salary_min, salary_max, job_type)
      `)
      .eq('seeker_id', jobSeeker.id)
      .order('applied_at', { ascending: false });

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError);
      console.error('Error code:', applicationsError.code);
      console.error('Error message:', applicationsError.message);

      // If job_applications table doesn't exist, return empty array with helpful message
      if (applicationsError.code === 'PGRST205' || applicationsError.code === '42P01') {
        console.warn('job_applications table not found - please run database setup');
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

    // ALSO check the public 'applications' table (for candidates who applied without an account)
    // Match by email so job seekers who later created accounts still see their past applications
    const { data: publicApplications, error: publicApplicationsError } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        jobs(id, title, company, location, description, salary_min, salary_max, job_type)
      `)
      .eq('email', userEmail)
      .order('created_at', { ascending: false });

    if (publicApplicationsError) {
      // Log but don't fail the whole request if public applications table/query isn't present
      console.warn('Error fetching public applications (applications table):', publicApplicationsError?.message || publicApplicationsError);
    } else {
      console.log('Public applications found:', publicApplications?.length || 0);
    }

    // Normalize and merge applications from both sources (job_applications and public applications)
    const normalizeJobApp = (app) => {
      const appliedAt = app.applied_at || app.created_at || app.updated_at || null;
      return {
        id: app.id,
        job_id: app.job_id,
        seeker_id: app.seeker_id || null,
        // Prefer seeker email from joined job_seekers if available
        email: app.job_seekers?.email || app.email || null,
        name: app.name || app.job_seekers?.full_name || null,
        phone: app.phone || app.job_seekers?.phone || null,
        resume_url: app.resume_url || null,
        cover_letter: app.cover_letter || app.cover_letter || null,
        status: app.status || app.application_status || null,
        applied_at: appliedAt,
        match_score: app.match_score || app.resume_match_score || app.overall_score || 0,
        resume_match_score: app.resume_match_score || app.match_score || 0,
        jobs: app.jobs || null,
        job_title: app.jobs?.title || app.job_title || null,
        job_company: app.jobs?.company || null,
        raw: app,
      };
    };

    const jobApplicationsList = (applications || []).map(normalizeJobApp);
    const publicApplicationsList = (publicApplications || []).map(normalizeJobApp);

    // Merge by unique id; if same job_id exists in both, prefer authenticated job_applications record
    const mergedByKey = new Map();

    // Add authenticated job_applications first (higher confidence)
    for (const a of jobApplicationsList) {
      mergedByKey.set(a.id, a);
    }

    // Add public applications unless the same job_id is already present for this seeker
    for (const a of publicApplicationsList) {
      // Avoid duplicate where job_applications already contains an application for same job
      const duplicate = Array.from(mergedByKey.values()).find(m => m.job_id === a.job_id);
      if (duplicate) continue;
      mergedByKey.set(a.id, a);
    }

    const applicationsWithJobs = Array.from(mergedByKey.values()).sort((x, y) => {
      const aTime = new Date(x.applied_at || 0).getTime();
      const bTime = new Date(y.applied_at || 0).getTime();
      return bTime - aTime; // descending
    });

    applicationsWithJobs.forEach(app => console.log(`Application ${app.id} - Job ID: ${app.job_id}, Has Job Data: ${!!app.jobs}, seeker_id: ${app.seeker_id}, email: ${app.email}`));

    console.log('Applications with jobs (before filtering):', applicationsWithJobs.length);

    // Ensure we only return applications that belong to this job seeker
    const filteredForSeeker = applicationsWithJobs.filter((a) => {
      const bySeekerId = a.seeker_id && a.seeker_id === jobSeeker.id;
      const byEmail = a.email && jobSeeker.email && a.email.toLowerCase() === jobSeeker.email.toLowerCase();
      return bySeekerId || byEmail;
    });

    console.log('Applications after filtering for seeker:', filteredForSeeker.length);
    if (filteredForSeeker.length > 0) {
      console.log('Sample filtered application:', JSON.stringify(filteredForSeeker[0], null, 2));
    }

    console.log('=== RETURNING APPLICATIONS ===');
    console.log('Total (filtered):', filteredForSeeker?.length || 0);

    return Response.json({
      applications: filteredForSeeker || [],
      total: filteredForSeeker?.length || 0,
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
