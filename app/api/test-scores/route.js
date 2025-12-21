import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    // Admin gets everything; HR gets scores for their jobs
    let jobIds = null;
    if (session.user.role === 'hr') {
      const ownerEmail = session.user.email;
      const { data: jobs } = await supabaseAdmin
        .from('jobs')
        .select('id')
        .eq('hr_email', ownerEmail);
      jobIds = (jobs || []).map(j => j.id).filter(Boolean);
    }

    // Fetch recent test_scores
    let query = supabaseAdmin.from('test_scores').select('*').order('created_at', { ascending: false }).limit(50);
    if (session.user.role === 'hr') {
      if (!jobIds || jobIds.length === 0) return new Response(JSON.stringify({ testScores: [] }));
      query = query.in('job_id', jobIds);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error('Failed to fetch test_scores:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch test scores' }), { status: 500 });
    }

    // Enrich rows with application / job info where possible
    const results = [];
    for (const r of rows || []) {
      let name = null, email = null, job_title = null;
      if (r.application_id) {
        const { data: app } = await supabaseAdmin.from('applications').select('id, name, email, job_id, jobs(title)').eq('id', r.application_id).maybeSingle();
        if (app) {
          name = app.name; email = app.email; job_title = app.jobs?.title || null;
        }
      }
      if (!job_title && r.job_id) {
        const { data: job } = await supabaseAdmin.from('jobs').select('title').eq('id', r.job_id).maybeSingle();
        if (job) job_title = job.title;
      }

      results.push({
        id: r.id,
        application_id: r.application_id,
        name: name || '—',
        email: email || '—',
        job_id: r.job_id,
        job_title: job_title || '—',
        test_score: r.test_score,
        overall_score: r.overall_score,
        created_at: r.created_at,
        test_token: r.test_token,
      });
    }

    return new Response(JSON.stringify({ testScores: results }), { status: 200 });
  } catch (err) {
    console.error('Error in GET /api/test-scores:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), { status: 500 });
  }
}
