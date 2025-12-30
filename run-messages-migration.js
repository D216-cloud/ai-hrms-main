import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load .env.local for scripts run locally
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local or environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMessagesMigration() {
  try {
    const sqlPath = join(__dirname, 'migrations', 'ensure-messages-columns.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('🚀 Running messages migration...');

    const { error } = await supabase.rpc('exec', { sql });
    if (error) {
      console.error('❌ Migration failed (rpc exec):', error);
      console.log('Please run the following SQL manually in Supabase SQL editor or psql:\n');
      console.log(sql);
      process.exit(1);
    }

    console.log('✅ Messages migration completed successfully');
  } catch (err) {
    console.error('❌ Error running messages migration:', err?.message || err);
    process.exit(1);
  }
}

runMessagesMigration().catch(console.error);
