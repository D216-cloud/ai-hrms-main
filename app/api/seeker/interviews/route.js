import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get all interviews for logged-in job seeker
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
    console.log('Fetching interviews for job seeker:', userEmail);

    // Get job seeker ID
    const { data: jobSeeker, error: seekerError } = await supabaseAdmin
      .from('job_seekers')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (seekerError || !jobSeeker) {
      console.error('Error fetching job seeker:', seekerError);
      return Response.json(
        { error: 'Job seeker profile not found' },
        { status: 404 }
      );
    }

    // Get authenticated seeker interviews from job_applications
    let jobInterviews = null;
    try {
      const res = await supabaseAdmin
        .from('job_applications')
        .select(`
          id,
          job_id,
          status,
          applied_at,
          scheduled_at,
          jobs (id, title, company, location, description, salary_min, salary_max, job_type)
        `)
        .eq('seeker_id', jobSeeker.id)
        .in('status', ['interviewing', 'interview_scheduled'])
        .order('scheduled_at', { ascending: false, nulls: 'last' });

      if (res.error) throw res.error;
      jobInterviews = res.data;
    } catch (err) {
      // Fall back to selecting without scheduled_at if column doesn't exist
      console.warn('Initial job_applications query with scheduled_at failed, retrying without scheduled_at:', err.message || err);
      const res = await supabaseAdmin
        .from('job_applications')
        .select(`
          id,
          job_id,
          status,
          applied_at,
          jobs (id, title, company, location, description, salary_min, salary_max, job_type)
        `)
        .eq('seeker_id', jobSeeker.id)
        .in('status', ['interviewing', 'interview_scheduled'])
        .order('applied_at', { ascending: false });

      if (res.error) {
        console.error('Error fetching job_applications interviews:', res.error);
        return Response.json(
          {
            error: 'Failed to fetch interviews',
            details: res.error.message,
          },
          { status: 500 }
        );
      }

      jobInterviews = res.data;
    }

    console.log('Job interviews fetched:', jobInterviews?.length || 0);

    // Also check the public 'applications' table for interview status (matched by email)
    // This covers candidates who applied without an account but later created one
    let publicInterviews = null;
    try {
      const res = await supabaseAdmin
        .from('applications')
        .select(`
          id,
          job_id,
          status,
          created_at,
          scheduled_at,
          jobs (id, title, company, location, description, salary_min, salary_max, job_type)
        `)
        .eq('email', userEmail)
        .in('status', ['interviewing', 'interview_scheduled'])
        .order('scheduled_at', { ascending: false, nulls: 'last' });

      if (res.error) throw res.error;
      publicInterviews = res.data;
    } catch (err) {
      // Fall back to selecting without scheduled_at if column doesn't exist
      console.warn('Initial public applications query with scheduled_at failed, retrying without scheduled_at:', err.message || err);
      const res = await supabaseAdmin
        .from('applications')
        .select(`
          id,
          job_id,
          status,
          created_at,
          jobs (id, title, company, location, description, salary_min, salary_max, job_type)
        `)
        .eq('email', userEmail)
        .in('status', ['interviewing', 'interview_scheduled'])
        .order('created_at', { ascending: false });

      if (res.error) {
        console.warn('Error fetching public applications interviews:', res.error.message || res.error);
      } else {
        publicInterviews = res.data;
      }
    }

    console.log('Public interviews fetched:', publicInterviews?.length || 0);

    // Normalize both sources into a common interviews shape
    const normJob = (i) => ({
      id: i.id,
      source: 'seeker',
      job_id: i.job_id,
      job_title: i.jobs?.title || null,
      company: i.jobs?.company || null,
      status: i.status,
      scheduled_at: i.scheduled_at || null,
      applied_at: i.applied_at || null,
      raw: i,
    });

    const normPublic = (i) => ({
      id: i.id,
      source: 'public',
      job_id: i.job_id,
      job_title: i.jobs?.title || null,
      company: i.jobs?.company || null,
      status: i.status,
      scheduled_at: i.scheduled_at || null,
      applied_at: i.created_at || null,
      raw: i,
    });

    const combined = [
      ...(jobInterviews || []).map(normJob),
      ...(publicInterviews || []).map(normPublic),
    ];

    // Sort by scheduled_at desc, falling back to applied_at
    combined.sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : (a.applied_at ? new Date(a.applied_at).getTime() : 0);
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : (b.applied_at ? new Date(b.applied_at).getTime() : 0);
      return bTime - aTime;
    });

    console.log('Interviews found (combined):', combined.length);

    return Response.json({
      interviews: combined,
      total: combined.length,
    });
  } catch (error) {
    console.error('Error in GET /api/seeker/interviews:', error);
    return Response.json(
      {
        error: 'Failed to fetch interviews',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}