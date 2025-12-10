import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, name } = await request.json();

    // Validate input
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("hr_users")
      .select("id, email, name, role")
      .eq("email", email)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected if user doesn't exist
      console.error("Error checking existing user:", fetchError);
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists in the system" },
        { status: 200 }
      );
    }

    // Create a placeholder password hash for Google users
    // (They won't use this since they'll sign in with Google)
    const placeholderPassword = "google-auth-user-" + Date.now();

    // Insert new user with default 'hr' role
    const { data, error } = await supabaseAdmin
      .from("hr_users")
      .insert([
        {
          email: email,
          name: name,
          role: "hr", // default to hr role
          password_hash: placeholderPassword,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to add user to the system" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "User added successfully", user: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}