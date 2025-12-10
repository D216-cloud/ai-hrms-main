import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("=== DATABASE DIAGNOSIS STARTED ===");
    
    // Test 1: Check environment variables
    console.log("Step 1: Checking environment variables...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!serviceRoleKey,
      urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : null
    };
    
    console.log("Environment check:", envCheck);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Missing critical environment variables");
      return NextResponse.json({
        success: false,
        error: "Missing Supabase environment variables",
        details: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
      }, { status: 500 });
    }
    
    // Test 2: Test basic connection and check if tables exist
    console.log("Step 2: Testing database connection and checking tables...");
    
    // Check if hr_users table exists
    const { data: userTableInfo, error: userTableError } = await supabaseAdmin
      .from('hr_users')
      .select('id')
      .limit(1)
      .single();
    
    const userTableExists = !userTableError || (userTableError.code !== '42P01');
    console.log("User table check:", {
      exists: userTableExists,
      error: userTableError?.message,
      code: userTableError?.code
    });
    
    // Check if jobs table exists
    const { data: jobTableInfo, error: jobTableError } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .limit(1)
      .single();
    
    const jobTableExists = !jobTableError || (jobTableError.code !== '42P01');
    console.log("Jobs table check:", {
      exists: jobTableExists,
      error: jobTableError?.message,
      code: jobTableError?.code
    });
    
    // Test 3: If tables exist, test basic operations
    let userTableAccess = false;
    let jobsTableAccess = false;
    
    if (userTableExists) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('hr_users')
        .select('id, email, role')
        .limit(1);
      
      userTableAccess = !userError;
      console.log("User table access test:", {
        success: userTableAccess,
        rowCount: userData?.length,
        error: userError?.message
      });
    }
    
    if (jobTableExists) {
      const { data: jobData, error: jobError } = await supabaseAdmin
        .from('jobs')
        .select('id, title, status')
        .limit(1);
      
      jobsTableAccess = !jobError;
      console.log("Jobs table access test:", {
        success: jobsTableAccess,
        rowCount: jobData?.length,
        error: jobError?.message
      });
    }
    
    // Test 4: Test insert permissions if jobs table exists
    let insertTestSuccess = false;
    let insertTestError = null;
    let insertTestCode = null;
    let testJobId = null;
    
    if (jobTableExists) {
      console.log("Step 3: Testing insert permissions...");
      const testJob = {
        title: "DIAGNOSTIC TEST JOB - DELETE ME",
        jd_text: "This is a test job for database diagnosis",
        location: "Test Location",
        experience_min: 0,
        experience_max: 5,
        status: "draft"
      };
      
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('jobs')
        .insert(testJob)
        .select()
        .single();
      
      insertTestSuccess = !insertError;
      insertTestError = insertError?.message;
      insertTestCode = insertError?.code;
      testJobId = insertData?.id;
      
      console.log("Insert test result:", {
        success: insertTestSuccess,
        jobId: testJobId,
        error: insertTestError,
        code: insertTestCode
      });
      
      // Clean up test job if created
      if (testJobId) {
        console.log("Cleaning up test job...");
        await supabaseAdmin
          .from('jobs')
          .delete()
          .eq('id', testJobId);
        console.log("Test job cleaned up");
      }
    }
    
    console.log("=== DATABASE DIAGNOSIS COMPLETED ===");
    
    return NextResponse.json({
      success: true,
      message: "Database diagnosis completed",
      environment: envCheck,
      tables: {
        hr_users: {
          exists: userTableExists,
          accessible: userTableAccess,
          error: userTableError?.message,
          errorCode: userTableError?.code
        },
        jobs: {
          exists: jobTableExists,
          accessible: jobsTableAccess,
          error: jobTableError?.message,
          errorCode: jobTableError?.code
        }
      },
      insertTest: {
        successful: insertTestSuccess,
        error: insertTestError,
        code: insertTestCode
      }
    });
    
  } catch (error) {
    console.error("=== DATABASE DIAGNOSIS FAILED ===");
    console.error("Error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Database diagnosis failed",
      details: error.message
    }, { status: 500 });
  }
}