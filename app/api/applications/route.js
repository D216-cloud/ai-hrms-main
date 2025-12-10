import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to get user ID
async function getUserSeekerId(session) {
  if (!session?.user?.email) return null;

  let { data: user } = await supabase
    .from('job_seekers')
    .select('id')
    .eq('email', session.user.email)
    .single();

  return user?.id;
}

// POST - Apply for job
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { job_id, cover_letter } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get user's resume URL
    const { data: profile } = await supabase
      .from('job_seekers')
      .select('resume_url')
      .eq('id', seekerId)
      .single();

    // Check if already applied
    const { data: existingApp } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job_id)
      .eq('seeker_id', seekerId)
      .single();

    if (existingApp) {
      return Response.json({ error: 'You have already applied for this job' }, { status: 400 });
    }

    // Create application
    const { data: application, error } = await supabase
      .from('job_applications')
      .insert([
        {
          job_id,
          seeker_id: seekerId,
          resume_url: profile?.resume_url,
          cover_letter: cover_letter || null,
          status: 'applied',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Application insert error:', error);
      return Response.json({ error: 'Failed to apply for job' }, { status: 500 });
    }

    return Response.json({ application, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Application API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get applications for job (with pre-fill data)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('job_id');
    
    const session = await getServerSession(authOptions);

    // If HR/Admin asking for all applications for a job
    if (session?.user?.role === 'hr' || session?.user?.role === 'admin') {
      if (!jobId) {
        return Response.json({ error: 'Job ID is required' }, { status: 400 });
      }

      const { data: applications, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_seekers(full_name, email, phone, location, resume_url)
        `)
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false });

      if (error) {
        return Response.json({ error: 'Failed to fetch applications' }, { status: 500 });
      }

      return Response.json({ applications });
    }

    // For job seekers - get pre-fill data for applying
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!jobId) {
      return Response.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user has applied
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('seeker_id', seekerId)
      .single();

    if (appError && appError.code === 'PGRST116') {
      // No application, return user's prefill data
      const { data: profile } = await supabase
        .from('job_seekers')
        .select(`
          id, email, full_name, phone, location, bio, resume_url,
          job_seeker_skills(skill_name, proficiency_level)
        `)
        .eq('id', seekerId)
        .single();

      return Response.json({
        has_applied: false,
        prefill_data: {
          name: profile?.full_name,
          email: profile?.email,
          phone: profile?.phone,
          location: profile?.location,
          resume_url: profile?.resume_url,
          skills: profile?.job_seeker_skills?.map(s => s.skill_name) || [],
        }
      });
    }

    if (appError) {
      console.error('Application fetch error:', appError);
      return Response.json({ error: 'Failed to fetch application' }, { status: 500 });
    }

    // Already applied
    return Response.json({
      has_applied: true,
      application,
      status: application?.status,
    });
  } catch (error) {
    console.error('Application GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
