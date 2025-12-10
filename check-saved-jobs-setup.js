import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSavedJobsTable() {
  console.log('🔧 Setting up saved_jobs table...\n');
  
  // Check if table exists by trying to query it
  console.log('1. Checking if saved_jobs table exists...');
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('id')
    .limit(1);
  
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.log('❌ saved_jobs table does not exist');
      console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
      console.log('   URL: https://supabase.com/dashboard/project/mphzqewnvtkcaswydjmn/sql\n');
      console.log('-- Create saved_jobs table');
      console.log('CREATE TABLE IF NOT EXISTS public.saved_jobs (');
      console.log('  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),');
      console.log('  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,');
      console.log('  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,');
      console.log('  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('  UNIQUE(job_id, seeker_id)');
      console.log(');\n');
      console.log('CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker_id ON public.saved_jobs(seeker_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);');
      console.log('\n');
    } else {
      console.error('Error checking table:', error);
    }
  } else {
    console.log('✅ saved_jobs table exists!');
    console.log(`   Found ${data?.length || 0} saved jobs in the table`);
  }
  
  // Check job_seekers table
  console.log('\n2. Checking if job_seekers table exists...');
  const { data: seekers, error: seekerError } = await supabase
    .from('job_seekers')
    .select('id, email')
    .limit(3);
  
  if (seekerError) {
    console.log('❌ job_seekers table issue:', seekerError.message);
  } else {
    console.log(`✅ job_seekers table exists with ${seekers?.length || 0} records`);
    if (seekers && seekers.length > 0) {
      console.log('   Sample:', seekers[0].email);
    }
  }
  
  // Check jobs table
  console.log('\n3. Checking if jobs table has company column...');
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, company')
    .limit(1);
  
  if (jobsError) {
    if (jobsError.message.includes('company')) {
      console.log('❌ jobs table missing company column');
      console.log('\n📋 Run this SQL to add company column:');
      console.log('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company TEXT;');
      console.log('UPDATE jobs SET company = \'TechCorp\' WHERE company IS NULL;\n');
    } else {
      console.log('Error:', jobsError.message);
    }
  } else {
    console.log('✅ jobs table has company column');
    if (jobs && jobs.length > 0) {
      console.log(`   Sample: ${jobs[0].title} at ${jobs[0].company || 'N/A'}`);
    }
  }
  
  console.log('\n✅ Database check complete!');
}

setupSavedJobsTable().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
