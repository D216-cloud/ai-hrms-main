import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to get or create user ID mapping
async function getUserSeekerId(session) {
  if (!session?.user?.email) return null;

  let { data: user, error: fetchError } = await supabaseAdmin
    .from('job_seekers')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (fetchError && fetchError.code === 'PGRST116') {
    // User doesn't exist, create them
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('job_seekers')
      .insert([
        {
          email: session.user.email,
          full_name: session.user.name || session.user.email.split('@')[0],
          auth_id: session.user.id || session.user.email,
        },
      ])
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating job seeker:', createError);
      return null;
    }
    return newUser?.id;
  }

  if (fetchError) {
    console.error('Error fetching job seeker:', fetchError);
    return null;
  }

  return user?.id;
}

// GET - Fetch user profile
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get seeker ID
    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('job_seekers')
      .select('*')
      .eq('id', seekerId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Fetch skills
    const { data: skills, error: skillsError } = await supabaseAdmin
      .from('job_seeker_skills')
      .select('*')
      .eq('seeker_id', seekerId)
      .order('created_at', { ascending: false });

    if (skillsError) {
      console.error('Skills fetch error:', skillsError);
    }

    // Fetch education
    const { data: education, error: eduError } = await supabaseAdmin
      .from('job_seeker_education')
      .select('*')
      .eq('seeker_id', seekerId)
      .order('created_at', { ascending: false });

    if (eduError) {
      console.error('Education fetch error:', eduError);
    }

    return Response.json({
      profile,
      skills: skills || [],
      education: education || [],
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update profile
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

    const data = await req.json();
    const { 
      full_name, 
      phone, 
      location, 
      bio, 
      profile_picture_url,
      job_title,
      company_name,
      job_bio,
      start_date,
      end_date,
      is_current_job,
      school_name,
      degree,
      field_of_study,
      graduation_year,
      gpa
    } = data;

    // Update profile in job_seekers table
    const updateData = {
      full_name: full_name || undefined,
      phone: phone || undefined,
      location: location || undefined,
      bio: bio || undefined,
      profile_picture_url: profile_picture_url || undefined,
      job_title: job_title || undefined,
      company_name: company_name || undefined,
      job_bio: job_bio || undefined,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      is_current_job: is_current_job !== undefined ? is_current_job : undefined,
      school_name: school_name || undefined,
      degree: degree || undefined,
      field_of_study: field_of_study || undefined,
      graduation_year: graduation_year || undefined,
      gpa: gpa || undefined,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('job_seekers')
      .update(updateData)
      .eq('id', seekerId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return Response.json({ profile: updatedProfile, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}