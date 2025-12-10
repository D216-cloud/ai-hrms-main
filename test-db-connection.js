import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing Supabase Connection...');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + '...');
console.log('Has anon key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test connection with a simple query
  console.log('Attempting to connect to Supabase...');
  
  const { data, error } = await supabase
    .from('hr_users')
    .select('id')
    .limit(1);
    
  if (error) {
    console.error('❌ Supabase connection error:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } else {
    console.log('✅ Successfully connected to Supabase');
    console.log('Sample query result:', data);
  }
} catch (err) {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
}