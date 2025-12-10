import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Debug endpoint to test saved jobs query
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('\n=== DEBUG SAVED JOBS API ===');
    console.log('Session:', session?.user?.email);

    if (!session) {
      return Response.json({ error: 'No session' }, { status: 401 });
    }

    // Step 1: Check if we can connect to Supabase
    console.log('Step 1: Testing Supabase connection...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('jobs')
      .select('count', { count: 'exact' })
      .limit(1);

    console.log('Test result:', { testData, testError });

    // Step 2: Get all jobs
    console.log('\nStep 2: Fetching ALL jobs from jobs table...');
    const { data: allJobs, error: allJobsError } = await supabaseAdmin
      .from('jobs')
      .select('*');

    console.log('All jobs count:', allJobs?.length || 0);
    if (allJobsError) console.error('Error:', allJobsError);

    // Step 3: Get jobs where saved_job = true
    console.log('\nStep 3: Fetching jobs where saved_job = TRUE...');
    const { data: savedJobs, error: savedJobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('saved_job', true);

    console.log('Saved jobs count:', savedJobs?.length || 0);
    if (savedJobsError) console.error('Error:', savedJobsError);
    
    if (savedJobs && savedJobs.length > 0) {
      console.log('Sample saved job:', savedJobs[0]);
    }

    return Response.json({
      status: 'debug',
      allJobsCount: allJobs?.length || 0,
      savedJobsCount: savedJobs?.length || 0,
      savedJobs: savedJobs || [],
      errors: {
        allJobsError: allJobsError?.message,
        savedJobsError: savedJobsError?.message,
      }
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
