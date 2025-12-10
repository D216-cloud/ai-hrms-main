import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Enhanced error checking
if (!supabaseUrl) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  throw new Error("Missing Supabase URL environment variable");
}

if (!supabaseAnonKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
  throw new Error("Missing Supabase Anon Key environment variable");
}

console.log("✅ Supabase environment variables loaded");
console.log("Supabase URL:", supabaseUrl.substring(0, 30) + "...");

// Create client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'ai-hrms'
    }
  }
});

// Server-side admin client with service role key (bypasses RLS)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Enhanced error checking for service role key
if (!serviceRoleKey) {
  console.warn(
    "⚠️  Missing SUPABASE_SERVICE_ROLE_KEY environment variable - admin operations may be restricted"
  );
}

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'ai-hrms-admin'
        }
      }
    })
  : supabase;

console.log("✅ Supabase clients initialized");

// Test the connection
supabaseAdmin
  .from('hr_users')
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.warn("⚠️  Supabase connection test failed:", error.message);
    } else {
      console.log("✅ Supabase connection test successful");
    }
  })
  .catch((error) => {
    console.warn("⚠️  Supabase connection test error:", error.message);
  });