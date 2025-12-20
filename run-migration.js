import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running migration: create-job-applications table...');

    // Execute the migration SQL
    const { error } = await supabase.rpc('exec', {
      sql: `
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

        DROP TRIGGER IF EXISTS job_applications_updated_at_trigger ON public.job_applications;

        CREATE TRIGGER job_applications_updated_at_trigger
        BEFORE UPDATE ON public.job_applications
        FOR EACH ROW
        EXECUTE FUNCTION update_job_applications_updated_at();
      `
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      // Try alternative approach using sql() if rpc doesn't work
      console.log('Trying alternative approach...');
    } else {
      console.log('✅ Migration completed successfully');
    }
  } catch (err) {
    console.error('❌ Error running migration:', err.message);
    // Don't exit with error as the table might already exist
  }
}

// Alternative: Use raw SQL via admin API
async function runMigrationDirect() {
  try {
    console.log('🚀 Creating job_applications table using direct SQL...');
    
    const sql = `
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
    `;

    // Try to query to see if table exists
    const { data, error } = await supabase
      .from('job_applications')
      .select('count(*)', { count: 'exact', head: true });

    if (error && error.code === 'PGRST205') {
      console.log('Table does not exist, attempting to create...');
      console.log('⚠️  Please manually run the SQL migration in Supabase SQL Editor:');
      console.log(sql);
    } else if (!error) {
      console.log('✅ Table already exists');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigrationDirect().catch(console.error);
