import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Check if user exists and is active
    const { data: user, error } = await supabaseAdmin
      .from("hr_users")
      .select("id, email, name, role")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows returned
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }

    if (user) {
      return NextResponse.json(
        { exists: true, user },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}