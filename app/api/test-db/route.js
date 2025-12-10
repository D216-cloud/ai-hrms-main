import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("Testing database connection...");
    
    // Test connection with a simple query
    const { data, error } = await supabaseAdmin
      .from('hr_users')
      .select('id, email')
      .limit(1);
      
    if (error) {
      console.error("Database connection error:", error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code,
        details: error.details || "No details available"
      }, { status: 500 });
    }
    
    console.log("Database connection successful");
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      sampleData: data
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}