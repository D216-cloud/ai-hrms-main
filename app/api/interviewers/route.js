import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'hr' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('interviewers')
      .select('id, name, email, phone, title, profile_picture, default_meeting_link, default_test_link, default_instructions, timezone')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch interviewers:', error);
      return NextResponse.json({ error: 'Failed to fetch interviewers' }, { status: 500 });
    }

    return NextResponse.json({ interviewers: data || [] });
  } catch (err) {
    console.error('Error in GET /api/interviewers:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
