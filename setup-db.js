import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function setupDatabase() {
  try {
    console.log('🔍 Checking if job_applications table exists...');

    // Try to count rows in job_applications
    const { data, error: countError } = await supabase
      .from('job_applications')
      .select('count(*)', { count: 'exact', head: true });

    if (!countError) {
      console.log('✅ job_applications table already exists!');
      return;
    }

    if (countError.code === 'PGRST205') {
      console.log('❌ job_applications table does not exist');
      console.log('');
      console.log('📋 To create the table, please:');
      console.log('');
      console.log('1. Go to Supabase Dashboard: https://app.supabase.com');
      console.log('2. Select your project');
      console.log('3. Click "SQL Editor" in the left sidebar');
      console.log('4. Click "+ New Query"');
      console.log('5. Paste the following SQL and click "Run":');
      console.log('');
      console.log('-------------------------------------------');
      
      const sqlPath = path.join(__dirname, 'migrations', 'create-job-applications.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        console.log(sql);
      } else {
        console.log(`
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'viewed', 'shortlisted', 'rejected', 'accepted', 'under_review')),
  match_score INTEGER,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_seeker_id ON public.job_applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

CREATE OR REPLACE FUNCTION update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_applications_updated_at_trigger
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applications_updated_at();
        `);
      }
      
      console.log('-------------------------------------------');
      console.log('');
      console.log('6. After running the SQL, refresh this page');
      console.log('7. Applications will start appearing immediately');
      console.log('');
      process.exit(0);
    }

    console.error('❌ Unexpected error:', countError);
    process.exit(1);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
