import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// POST /api/tests/share - Create a shareable test (questions JSON) and return a tokenized URL
export async function POST(request) {
  try {
    const body = await request.json();
    const { jobTitle = null, questions, duration_minutes = 30 } = body || {};

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Questions array required' }, { status: 400 });
    }

    // Create a short token
    const token = crypto.randomBytes(12).toString('hex');

    const { data, error } = await supabaseAdmin
      .from('shared_tests')
      .insert([{ token, job_title: jobTitle, questions, duration_minutes }])
      .select()
      .single();

    if (error) {
      console.error('Error creating shared test:', error);
      const message = error?.message || JSON.stringify(error);
      let advice = null;
      if (message?.toLowerCase().includes('relation') && message?.toLowerCase().includes('shared_tests')) {
        advice = 'It looks like the `shared_tests` table does not exist. Run `migrations/create-shared-tests.sql` in Supabase SQL editor.';
      } else if (message?.toLowerCase().includes('permission') || message?.toLowerCase().includes('not authorized') || message?.toLowerCase().includes('permission denied')) {
        advice = 'Permission denied. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set and the service role client has privileges, or update RLS policies to allow inserts from the server.';
      }

      const details = process.env.NODE_ENV === 'development' ? message : undefined;
      return NextResponse.json({ error: 'Failed to create shared test', details, advice }, { status: 500 });
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/test/shared/${token}`;
    return NextResponse.json({ success: true, token, url });
  } catch (err) {
    console.error('Error in POST /api/tests/share:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

// GET /api/tests/share?token=xxxx - fetch shared test by token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('shared_tests')
      .select('*, created_by(hr_users(id, email))')
      .eq('token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, test: data });
  } catch (err) {
    console.error('Error in GET /api/tests/share:', err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
