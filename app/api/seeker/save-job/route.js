import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST - Save or unsave a job for the logged-in job seeker
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'job_seeker') {
      return Response.json(
        { error: 'Unauthorized - Job seekers only' },
        { status: 401 }
      );
    }

    const { jobId, action } = await request.json();

    if (!jobId) {
      return Response.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (action !== 'save' && action !== 'unsave') {
      return Response.json(
        { error: 'Action must be either "save" or "unsave"' },
        { status: 400 }
      );
    }

    const userEmail = session.user.email;
    console.log(`${action} job for job seeker:`, userEmail, jobId);

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

    if (action === 'save') {
      // Save the job
      const { data, error } = await supabaseAdmin
        .from('saved_jobs')
        .insert({
          job_id: jobId,
          seeker_id: jobSeeker.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving job:', error);
        
        // If it's a duplicate (already saved), that's fine
        if (error.code === '23505') {
          return Response.json(
            { 
              success: true, 
              message: 'Job already saved',
              saved: true
            }
          );
        }
        
        return Response.json(
          { 
            error: 'Failed to save job',
            details: error.message 
          },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        message: 'Job saved successfully',
        saved: true,
        data
      });
    } else {
      // Unsave the job
      const { error } = await supabaseAdmin
        .from('saved_jobs')
        .delete()
        .eq('job_id', jobId)
        .eq('seeker_id', jobSeeker.id);

      if (error) {
        console.error('Error unsaving job:', error);
        return Response.json(
          { 
            error: 'Failed to unsave job',
            details: error.message 
          },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        message: 'Job unsaved successfully',
        saved: false
      });
    }
  } catch (error) {
    console.error('Error in POST /api/seeker/save-job:', error);
    return Response.json(
      {
        error: 'Failed to process save job request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET - Check if a job is saved for the logged-in job seeker
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'job_seeker') {
      return Response.json(
        { error: 'Unauthorized - Job seekers only' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return Response.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const userEmail = session.user.email;

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

    // Check if job is saved
    const { data: savedJob, error } = await supabaseAdmin
      .from('saved_jobs')
      .select('id')
      .eq('job_id', jobId)
      .eq('seeker_id', jobSeeker.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking saved job:', error);
      return Response.json(
        { 
          error: 'Failed to check if job is saved',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return Response.json({
      saved: !!savedJob
    });
  } catch (error) {
    console.error('Error in GET /api/seeker/save-job:', error);
    return Response.json(
      {
        error: 'Failed to check if job is saved',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}