import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

async function runMigrations() {
  console.log('🔧 Running database migrations...\n');
  
  const migrations = [
    {
      name: 'Add company column to jobs',
      sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company TEXT'
    },
    {
      name: 'Add description column to jobs',
      sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT'
    },
    {
      name: 'Add salary_min column to jobs',
      sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER'
    },
    {
      name: 'Add salary_max column to jobs',
      sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER'
    },
    {
      name: 'Update existing jobs with default company',
      sql: "UPDATE jobs SET company = 'TechCorp' WHERE company IS NULL OR company = ''"
    },
    {
      name: 'Create saved_jobs table',
      sql: `CREATE TABLE IF NOT EXISTS public.saved_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
        seeker_id UUID NOT NULL REFERENCES public.job_seekers(id) ON DELETE CASCADE,
        saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(job_id, seeker_id)
      )`
    },
    {
      name: 'Create index on saved_jobs.seeker_id',
      sql: 'CREATE INDEX IF NOT EXISTS idx_saved_jobs_seeker_id ON public.saved_jobs(seeker_id)'
    },
    {
      name: 'Create index on saved_jobs.job_id',
      sql: 'CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id)'
    }
  ];

  console.log('📋 SQL Commands to run in Supabase SQL Editor:');
  console.log('=' .repeat(60));
  console.log('\nCopy and paste ALL of this into Supabase SQL Editor:\n');
  
  migrations.forEach((migration, index) => {
    console.log(`-- ${index + 1}. ${migration.name}`);
    console.log(migration.sql + ';\n');
  });
  
  console.log('=' .repeat(60));
  console.log('\n🌐 Go to: https://supabase.com/dashboard/project/mphzqewnvtkcaswydjmn/sql/new');
  console.log('\n📝 Steps:');
  console.log('1. Copy ALL the SQL above');
  console.log('2. Paste into the SQL Editor');
  console.log('3. Click "Run" button');
  console.log('4. Refresh your application\n');
}

runMigrations();
