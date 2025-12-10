import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request) {
  try {
    console.log("Testing Supabase connection...");
    
    // Test 1: Simple query
    const { data, error } = await supabaseAdmin
      .from("hr_users")
      .select("COUNT(*)", { count: "exact" })
      .limit(1);

    console.log("Query result:", { data, error });

    if (error) {
      console.error("Connection error:", error);
      return NextResponse.json(
        {
          status: "ERROR",
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "OK",
      message: "Supabase connection successful",
      data,
    });
  } catch (err) {
    console.error("Exception:", err);
    return NextResponse.json(
      {
        status: "ERROR",
        error: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}
