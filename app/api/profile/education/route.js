import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to get user ID
async function getUserSeekerId(session) {
  if (!session?.user?.email) return null;

  let { data: user } = await supabaseAdmin
    .from('job_seekers')
    .select('id')
    .eq('email', session.user.email)
    .single();

  return user?.id;
}

// POST - Add education
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

    const { school_name, degree, field_of_study, graduation_year, gpa } = await req.json();

    console.log('Adding education:', { school_name, degree, graduation_year });

    if (!school_name || !degree) {
      return Response.json({ error: 'School name and degree are required' }, { status: 400 });
    }

    const { data: education, error } = await supabaseAdmin
      .from('job_seeker_education')
      .insert([
        {
          seeker_id: seekerId,
          school_name,
          degree,
          field_of_study: field_of_study || '',
          graduation_year: graduation_year ? parseInt(graduation_year) : null,
          gpa: gpa || '',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Education insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return Response.json({ error: 'Failed to add education: ' + (error.message || 'Unknown error') }, { status: 500 });
    }

    // Also update the denormalized columns in job_seekers table
    // Get the most recent education to store in job_seekers table
    const { data: latestEducations } = await supabaseAdmin
      .from('job_seeker_education')
      .select('*')
      .eq('seeker_id', seekerId)
      .order('graduation_year', { ascending: false })
      .limit(1);

    if (latestEducations && latestEducations.length > 0) {
      const latestEdu = latestEducations[0];
      await supabaseAdmin
        .from('job_seekers')
        .update({
          school_name: latestEdu.school_name,
          degree: latestEdu.degree,
          field_of_study: latestEdu.field_of_study,
          graduation_year: latestEdu.graduation_year,
          gpa: latestEdu.gpa,
          updated_at: new Date().toISOString()
        })
        .eq('id', seekerId);
    }

    console.log('Education added successfully:', education);
    return Response.json({ education, message: 'Education added successfully' });
  } catch (error) {
    console.error('Education API error:', error);
    return Response.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// PUT - Update education
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const educationId = searchParams.get('id');

    if (!educationId) {
      return Response.json({ error: 'Education ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: education } = await supabaseAdmin
      .from('job_seeker_education')
      .select('id')
      .eq('id', educationId)
      .eq('seeker_id', seekerId)
      .single();

    if (!education) {
      return Response.json({ error: 'Education not found' }, { status: 404 });
    }

    const { school_name, degree, field_of_study, graduation_year, gpa } = await req.json();

    if (!school_name || !degree) {
      return Response.json({ error: 'School name and degree are required' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('job_seeker_education')
      .update({
        school_name,
        degree,
        field_of_study: field_of_study || '',
        graduation_year: graduation_year || null,
        gpa: gpa || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', educationId)
      .select()
      .single();

    if (error) {
      console.error('Education update error:', error);
      return Response.json({ error: 'Failed to update education' }, { status: 500 });
    }

    // Also update the denormalized columns in job_seekers table
    // Get the most recent education to store in job_seekers table
    const { data: latestEducations } = await supabaseAdmin
      .from('job_seeker_education')
      .select('*')
      .eq('seeker_id', seekerId)
      .order('graduation_year', { ascending: false })
      .limit(1);

    if (latestEducations && latestEducations.length > 0) {
      const latestEdu = latestEducations[0];
      await supabaseAdmin
        .from('job_seekers')
        .update({
          school_name: latestEdu.school_name,
          degree: latestEdu.degree,
          field_of_study: latestEdu.field_of_study,
          graduation_year: latestEdu.graduation_year,
          gpa: latestEdu.gpa,
          updated_at: new Date().toISOString()
        })
        .eq('id', seekerId);
    }

    return Response.json({ education: updated, message: 'Education updated successfully' });
  } catch (error) {
    console.error('Education update error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove education
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seekerId = await getUserSeekerId(session);
    if (!seekerId) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const educationId = searchParams.get('id');

    if (!educationId) {
      return Response.json({ error: 'Education ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: education } = await supabaseAdmin
      .from('job_seeker_education')
      .select('id')
      .eq('id', educationId)
      .eq('seeker_id', seekerId)
      .single();

    if (!education) {
      return Response.json({ error: 'Education not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('job_seeker_education')
      .delete()
      .eq('id', educationId);

    if (error) {
      console.error('Education delete error:', error);
      return Response.json({ error: 'Failed to remove education' }, { status: 500 });
    }

    // Also update the denormalized columns in job_seekers table
    // Get the most recent education to store in job_seekers table
    // If no educations left, clear the denormalized columns
    const { data: latestEducations } = await supabaseAdmin
      .from('job_seeker_education')
      .select('*')
      .eq('seeker_id', seekerId)
      .order('graduation_year', { ascending: false })
      .limit(1);

    if (latestEducations && latestEducations.length > 0) {
      const latestEdu = latestEducations[0];
      await supabaseAdmin
        .from('job_seekers')
        .update({
          school_name: latestEdu.school_name,
          degree: latestEdu.degree,
          field_of_study: latestEdu.field_of_study,
          graduation_year: latestEdu.graduation_year,
          gpa: latestEdu.gpa,
          updated_at: new Date().toISOString()
        })
        .eq('id', seekerId);
    } else {
      // Clear the denormalized columns if no educations left
      await supabaseAdmin
        .from('job_seekers')
        .update({
          school_name: null,
          degree: null,
          field_of_study: null,
          graduation_year: null,
          gpa: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', seekerId);
    }

    return Response.json({ message: 'Education removed successfully' });
  } catch (error) {
    console.error('Education API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}