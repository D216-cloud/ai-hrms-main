import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

    // Get all applications with "interviewing" status for this seeker
    const { data: interviews, error: interviewsError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id, 
        job_id, 
        status, 
        applied_at,
        jobs (id, title, company, location, description, salary_min, salary_max, job_type)
      `)
      .eq('seeker_id', jobSeeker.id)
      .eq('status', 'interviewing')
      .order('applied_at', { ascending: false });

    if (interviewsError) {
      console.error('Error fetching interviews:', interviewsError);
      return Response.json(
        { 
          error: 'Failed to fetch interviews',
          details: interviewsError.message 
        },
        { status: 500 }
      );
    }

    console.log('Interviews found:', interviews?.length || 0);

    return Response.json({
      interviews: interviews || [],
      total: interviews?.length || 0,
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