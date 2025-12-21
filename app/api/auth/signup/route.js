import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Note: we intentionally do not create an `hr_users` row for job_seeker signups.
// Job seeker credentials are stored in `job_seekers` table (includes `password_hash`).

// POST /api/auth/signup
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('/api/auth/signup body:', body);
    const { email, password, role } = body || {};

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    // Only allow creating job_seeker accounts via this endpoint
    if (role && role !== 'job_seeker') {
      return NextResponse.json({ message: 'Only job_seeker accounts can be created here' }, { status: 403 });
    }

    // Lazy import supabaseAdmin to capture import-time errors (missing envs etc.)
    let supabaseClient = null;
    try {
      const mod = await import('@/lib/supabase');
      supabaseClient = mod.supabaseAdmin || mod.supabase || null;
      if (!supabaseClient) {
        console.error('supabase client not exported from lib/supabase');
        return NextResponse.json({ message: 'Supabase not configured on server' }, { status: 500 });
      }
    } catch (e) {
      console.error('Error importing lib/supabase:', e?.message || e);
      return NextResponse.json({ message: 'Failed to initialize database client', detail: e?.message, stack: e?.stack }, { status: 500 });
    }

    // Check if job_seeker already exists
    let existingSeeker = null;
    try {
      const sres = await supabaseClient
        .from('job_seekers')
        .select('id,auth_id,email,full_name,password_hash')
        .eq('email', email)
        .limit(1);

      if (sres.error) {
        console.warn('supabase select job_seekers error:', sres.error.message || sres.error);
      } else if (sres.data && sres.data.length > 0) {
        existingSeeker = sres.data[0];
      }
    } catch (e) {
      console.warn('Error querying job_seekers:', e?.message || e);
    }

    if (existingSeeker) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    // Hash password and create user with role job_seeker
    let hashed;
    try {
      hashed = await bcrypt.hash(password, 10);
    } catch (e) {
      console.error('bcrypt.hash error:', e);
      return NextResponse.json({ message: 'Failed to process password' }, { status: 500 });
    }
    const name = email.split('@')[0];

    // Create job_seeker row (store credentials here, not in hr_users)
    let newSeeker = null;
    const authId = uuidv4();
    try {
      const insertSeeker = await supabaseClient.from('job_seekers').insert([
        {
          auth_id: authId,
          email,
          full_name: name,
          password_hash: hashed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]).select();

      if (insertSeeker.error) {
        console.error('Failed to create job_seeker:', insertSeeker.error.message || insertSeeker.error);
        return NextResponse.json({ message: 'Failed to create account', detail: insertSeeker.error.message }, { status: 500 });
      }

      if (insertSeeker.data && insertSeeker.data.length > 0) newSeeker = insertSeeker.data[0];
    } catch (e) {
      console.error('Exception creating job_seeker:', e);
      return NextResponse.json({ message: 'Failed to create account', detail: e?.message || String(e) }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in /api/auth/signup:', err);
    return NextResponse.json({ message: err.message || 'Internal error', stack: err.stack }, { status: 500 });
  }
}

// Simple GET to verify the route loads (useful for debugging)
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error('GET /api/auth/signup error:', err);
    return NextResponse.json({ ok: false, message: err?.message, stack: err?.stack }, { status: 500 });
  }
}
