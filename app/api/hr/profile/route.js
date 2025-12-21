import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET - fetch hr profile for signed-in HR user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'hr' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hrUserId = session.user.id;

    // Try to fetch the profile; if missing, return an empty shape
    // Try to read from hr_profiles; if the table doesn't exist (PGRST205),
    // fall back to the snapshot stored on hr_users.profile_data.
    const { data, error } = await supabaseAdmin
      .from('hr_profiles')
      .select('*')
      .eq('hr_user_id', hrUserId)
      .single();

    if (error) {
      // PGRST116 means no rows — return null
      if (error.code === 'PGRST116') {
        return NextResponse.json({ profile: null });
      }

      // If hr_profiles table missing in PostgREST schema cache, fall back
      if (error.code === 'PGRST205') {
        console.warn('hr_profiles table not found — falling back to hr_users.profile_data');
        try {
          const { data: userData, error: userErr } = await supabaseAdmin
            .from('hr_users')
            .select('profile_data')
            .eq('id', hrUserId)
            .single();

          if (userErr) {
            console.error('Failed to fetch hr_users.profile_data fallback:', userErr);
            const details = { message: error.message, code: error.code, details: error.details };
            return NextResponse.json({ error: 'Failed to fetch profile', details }, { status: 500 });
          }

          return NextResponse.json({ profile: userData?.profile_data || null });
        } catch (e) {
          console.error('Fallback read from hr_users failed:', e);
          const details = { message: error.message, code: error.code, details: error.details };
          return NextResponse.json({ error: 'Failed to fetch profile', details }, { status: 500 });
        }
      }

      console.error('Failed to fetch HR profile:', error);
      const details = { message: error.message, code: error.code, details: error.details };
      return NextResponse.json({ error: 'Failed to fetch profile', details }, { status: 500 });
    }

    return NextResponse.json({ profile: data || null });
  } catch (err) {
    console.error('Error in GET /api/hr/profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - create or update the HR profile for signed-in HR user
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'hr' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hrUserId = session.user.id;
    const body = await req.json();

    const updateData = {};
    const allowed = [
      'full_name',
      'location',
      'phone',
      'title',
      'bio',
      'profile_picture_url',
      'timezone',
      'availability',
      'skills',
      'linkedin_url',
      'profile_completion',
    ];

    for (const k of allowed) {
      if (body[k] !== undefined) updateData[k] = body[k];
    }

    // Upsert: try update first, if not found, insert
    // Try to upsert into hr_profiles; if the table is missing (PGRST205),
    // persist profile JSON directly into hr_users.profile_data as a fallback.
    let existing;
    try {
      const existingRes = await supabaseAdmin
        .from('hr_profiles')
        .select('id')
        .eq('hr_user_id', hrUserId)
        .single();
      existing = existingRes.data;
      // If select returned an error code for missing table, it will be thrown below
      if (existingRes.error && existingRes.error.code === 'PGRST205') {
        throw existingRes.error;
      }
    } catch (selErr) {
      if (selErr.code === 'PGRST205') {
        // Table missing — save to hr_users.profile_data and return
        try {
          const snapshot = Object.keys(updateData).length ? updateData : {};
          await supabaseAdmin.from('hr_users').update({ profile_data: snapshot }).eq('id', hrUserId);
          return NextResponse.json({ profile: snapshot });
        } catch (e) {
          console.error('Failed fallback persist to hr_users during select:', e);
          return NextResponse.json({ error: 'Failed to update profile', details: { message: selErr.message, code: selErr.code } }, { status: 500 });
        }
      }
      // Other errors — report
      console.error('Failed to check existing hr_profile:', selErr);
      return NextResponse.json({ error: 'Failed to update profile', details: { message: selErr.message, code: selErr.code } }, { status: 500 });
    }

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('hr_profiles')
        .update(updateData)
        .eq('hr_user_id', hrUserId)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to update hr profile:', error);
        const details = { message: error.message, code: error.code, details: error.details };
        return NextResponse.json({ error: 'Failed to update profile', details }, { status: 500 });
      }
      // Also persist a snapshot of the full profile JSON on the hr_users table
      try {
        await supabaseAdmin
          .from('hr_users')
          .update({ profile_data: data })
          .eq('id', hrUserId);
      } catch (e) {
        console.error('Failed to persist profile_data to hr_users:', e);
        // non-fatal: continue
      }

      return NextResponse.json({ profile: data });
    }

    // Insert
    const insertData = { hr_user_id: hrUserId, ...updateData };
    try {
      const { data, error } = await supabaseAdmin
        .from('hr_profiles')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        // If table missing, fall back to writing snapshot to hr_users
        if (error.code === 'PGRST205') {
          try {
            await supabaseAdmin.from('hr_users').update({ profile_data: updateData }).eq('id', hrUserId);
            return NextResponse.json({ profile: updateData });
          } catch (e) {
            console.error('Fallback persist to hr_users after insert failed:', e);
            return NextResponse.json({ error: 'Failed to create profile', details: { message: error.message, code: error.code } }, { status: 500 });
          }
        }

        console.error('Failed to create hr profile:', error);
        const details = { message: error.message, code: error.code, details: error.details };
        return NextResponse.json({ error: 'Failed to create profile', details }, { status: 500 });
      }

      // Persist snapshot to hr_users.profile_data as well
      try {
        await supabaseAdmin
          .from('hr_users')
          .update({ profile_data: data })
          .eq('id', hrUserId);
      } catch (e) {
        console.error('Failed to persist profile_data to hr_users after insert:', e);
        // non-fatal
      }

      return NextResponse.json({ profile: data });
    } catch (err) {
      // Unexpected error
      console.error('Unexpected error creating hr profile:', err);
      return NextResponse.json({ error: 'Failed to create profile', details: { message: err.message } }, { status: 500 });
    }
  } catch (err) {
    console.error('Error in PATCH /api/hr/profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
