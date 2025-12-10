import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔧 Adding company column to jobs table...\n');
  
  const queries = [
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company TEXT',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary TEXT',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type TEXT',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type TEXT',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS min_experience INTEGER',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_experience INTEGER',
    'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_skills TEXT[]',
    "UPDATE jobs SET company = 'Company Name' WHERE company IS NULL OR company = ''"
  ];

  for (const query of queries) {
    try {
      console.log(`Executing: ${query.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: query });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error: ${error.message}`);
      } else {
        console.log('✓ Success');
      }
    } catch (err) {
      console.log(`ℹ️  ${err.message} (may already exist)`);
    }
  }

  console.log('\n✅ Migration complete!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
