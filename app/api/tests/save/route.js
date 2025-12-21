import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/tests/save - idempotent save of test results into test_scores
export async function POST(request) {
  try {
    const { testToken, jobId, score, overallScore, correctAnswers, totalQuestions } = await request.json();
    if (!testToken && !jobId) return NextResponse.json({ error: 'testToken or jobId required' }, { status: 400 });

    // Try to resolve an application if testToken provided
    let app = null;
    let source = null;
    if (testToken) {
      const { data: appData } = await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('test_token', testToken)
        .maybeSingle();

      if (appData) {
        app = appData;
        source = 'applications';
      } else {
        const { data: jobApp } = await supabaseAdmin
          .from('job_applications')
          .select('*')
          .eq('test_token', testToken)
          .maybeSingle();
        if (jobApp) {
          app = jobApp;
          source = 'job_applications';
        }
      }
    }

    // Update application record with scores (best-effort) if we resolved an application
    try {
      if (app && source) {
        const updatePayload = {
          test_score: score ?? undefined,
          overall_score: overallScore ?? undefined,
          test_submitted_at: new Date().toISOString(),
        };

        const { error: updateErr } = await supabaseAdmin
          .from(source)
          .update(updatePayload)
          .eq('id', app.id);

        if (updateErr) console.warn('Failed to update application scores:', updateErr);
      }
    } catch (e) {
      console.warn('Update app scores error:', e);
    }

    // Check for existing test_scores row to avoid duplicates
    let existing = null;
    let schemaHasJobId = true;
    if (app && app.id) {
      const { data: existingData } = await supabaseAdmin
        .from('test_scores')
        .select('*')
        .eq('application_id', app.id)
        .limit(1);
      existing = existingData;
    } else if (jobId) {
      try {
        const { data: existingData } = await supabaseAdmin
          .from('test_scores')
          .select('*')
          .eq('job_id', jobId)
          .limit(1);
        existing = existingData;
      } catch (e) {
        // If the schema doesn't have job_id (migration not run), don't treat as fatal — fallback
        console.warn('Schema missing job_id in test_scores, falling back:', e?.message || e);
        schemaHasJobId = false;
        existing = null;
      }
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: true, message: 'Already saved' });
    }

    const insertRow = {
      application_id: app?.id ?? null,
      test_id: null,
      test_token: testToken ?? null,
      test_score: score ?? null,
      overall_score: overallScore ?? null,
      resume_score: app?.resume_match_score ?? app?.match_score ?? null,
      comm_score: app?.communication_score ?? null,
      correct_answers: correctAnswers ?? null,
      total_questions: totalQuestions ?? null,
    };

    if (schemaHasJobId && jobId) insertRow.job_id = jobId;

    const { error: insertErr } = await supabaseAdmin
      .from('test_scores')
      .insert([insertRow]);

    if (insertErr) {
      console.error('Failed to insert into test_scores:', insertErr);
      const message = insertErr.message || JSON.stringify(insertErr);
      // If the DB/schema doesn't have job_id (schema cache), retry without job_id
      if (message.includes("Could not find the 'job_id'") || message.includes('job_id')) {
        try {
          // remove job_id and retry
          if (insertRow.job_id) delete insertRow.job_id;
          const { error: retryErr } = await supabaseAdmin.from('test_scores').insert([insertRow]);
          if (!retryErr) {
            return NextResponse.json({ success: true, message: 'Saved (retry without job_id)' });
          }
          console.error('Retry insert without job_id failed:', retryErr);
          return NextResponse.json({ success: false, error: retryErr.message || retryErr }, { status: 500 });
        } catch (e) {
          console.error('Retry error inserting into test_scores:', e);
          return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 });
        }
      }

      return NextResponse.json({ success: false, error: insertErr.message || insertErr }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in /api/tests/save:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
