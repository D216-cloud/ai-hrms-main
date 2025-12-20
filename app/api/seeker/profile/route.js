import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/seeker/profile - Fetch authenticated job seeker's profile
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "job_seeker") {
      return NextResponse.json(
        { error: "Unauthorized - Job seekers only" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    console.log("Fetching profile for job seeker:", userEmail);

    // Fetch job seeker profile
    const { data: jobSeeker, error: seekerError } = await supabaseAdmin
      .from("job_seekers")
      .select("*")
      .eq("email", userEmail)
      .single();

    if (seekerError) {
      console.error("Error fetching job seeker:", seekerError);
      if (seekerError.code === "PGRST116") {
        // No profile found
        return NextResponse.json(
          { error: "Profile not found. Please complete your profile first." },
          { status: 404 }
        );
      }
      throw seekerError;
    }

    if (!jobSeeker || !jobSeeker.id) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const seekerId = jobSeeker.id;

    // Fetch skills
    const { data: skills, error: skillsError } = await supabaseAdmin
      .from("job_seeker_skills")
      .select("skill_name")
      .eq("seeker_id", seekerId);

    if (skillsError) {
      console.error("Error fetching skills:", skillsError);
    }

    // Fetch experience
    const { data: experience, error: experienceError } = await supabaseAdmin
      .from("job_seeker_experience")
      .select("*")
      .eq("seeker_id", seekerId)
      .order("start_date", { ascending: false });

    if (experienceError) {
      console.error("Error fetching experience:", experienceError);
    }

    // Fetch education
    const { data: education, error: educationError } = await supabaseAdmin
      .from("job_seeker_education")
      .select("*")
      .eq("seeker_id", seekerId)
      .order("graduation_year", { ascending: false });

    if (educationError) {
      console.error("Error fetching education:", educationError);
    }

    // Format response for form auto-fill
    const profileData = {
      full_name: jobSeeker.full_name || "",
      email: jobSeeker.email || "",
      phone: jobSeeker.phone || "",
      location: jobSeeker.location || "",
      about_me: jobSeeker.bio || "",
      skills: skills ? skills.map((s) => s.skill_name).filter(Boolean) : [],
      experience: experience
        ? experience.map((exp) => ({
            job_title: exp.title || "",
            company: exp.company_name || "",
            start_date: exp.start_date ? new Date(exp.start_date).getFullYear().toString() : "",
            end_date: exp.is_current_job ? "Present" : (exp.end_date ? new Date(exp.end_date).getFullYear().toString() : ""),
            description: exp.description || "",
          }))
        : [],
      education: education
        ? education.map((edu) => ({
            school: edu.school_name || "",
            degree: edu.degree || "",
            field_of_study: edu.field_of_study || "",
            graduation_year: edu.graduation_year ? String(edu.graduation_year) : "",
            gpa: edu.gpa || "",
          }))
        : [],
      resume_url: jobSeeker.resume_url || null,
    };

    console.log("Profile data prepared:", {
      name: profileData.full_name,
      email: profileData.email,
      skillsCount: profileData.skills.length,
      experienceCount: profileData.experience.length,
      educationCount: profileData.education.length,
    });

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Error in GET /api/seeker/profile:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
