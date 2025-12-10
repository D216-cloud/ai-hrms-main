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

// POST - Add skill
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

    const { skill_name, proficiency_level, years_of_experience } = await req.json();

    if (!skill_name || skill_name.trim() === '') {
      return Response.json({ error: 'Skill name is required' }, { status: 400 });
    }

    const { data: skill, error } = await supabaseAdmin
      .from('job_seeker_skills')
      .insert([
        {
          seeker_id: seekerId,
          skill_name: skill_name.trim(),
          proficiency_level: proficiency_level || 'intermediate',
          years_of_experience: years_of_experience || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return Response.json({ error: 'This skill already exists' }, { status: 400 });
      }
      console.error('Skill insert error:', error);
      return Response.json({ error: 'Failed to add skill' }, { status: 500 });
    }

    return Response.json({ skill, message: 'Skill added successfully' });
  } catch (error) {
    console.error('Skills API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove skill
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
    const skillId = searchParams.get('id');

    if (!skillId) {
      return Response.json({ error: 'Skill ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: skill } = await supabaseAdmin
      .from('job_seeker_skills')
      .select('id')
      .eq('id', skillId)
      .eq('seeker_id', seekerId)
      .single();

    if (!skill) {
      return Response.json({ error: 'Skill not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('job_seeker_skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      console.error('Skill delete error:', error);
      return Response.json({ error: 'Failed to remove skill' }, { status: 500 });
    }

    return Response.json({ message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Skills API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}