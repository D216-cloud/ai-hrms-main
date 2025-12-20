import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJobDescription } from "@/lib/openai";

// POST /api/jobs/generate-jd - Generate job description using AI
export async function POST(request) {
  try {
    // Log the request headers for debugging
    console.log("Request headers:", Object.fromEntries(request.headers));
    
    const session = await getServerSession(authOptions);
    
    // Log session for debugging
    console.log("Session in /api/jobs/generate-jd:", session);
    console.log("Session user:", session?.user);
    console.log("Session user role:", session?.user?.role);

    // Only hr and admin can generate job descriptions
    if (!session) {
      console.log("No session found - Unauthorized access");
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    if (session.user.role !== "hr" && session.user.role !== "admin") {
      console.log("Invalid role for access:", session.user.role);
      return NextResponse.json({ error: "Unauthorized - Invalid role" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      location,
      experienceMin,
      experienceMax,
      skills,
      salaryMin,
      salaryMax,
    } = body;

    // Validate required fields
    if (
      !title ||
      !location ||
      experienceMin === undefined ||
      experienceMax === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, location, experienceMin, experienceMax",
        },
        { status: 400 }
      );
    }

    // Prepare job details for AI
    // Normalize skills to an array to prevent .join errors when it's passed as string
    let normalizedSkills = [];
    if (Array.isArray(skills)) {
      normalizedSkills = skills;
    } else if (typeof skills === "string") {
      normalizedSkills = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (skills !== undefined && skills !== null) {
      // If it is a single value that's not an array or string, coerce to a string and split
      normalizedSkills = String(skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const jobDetails = {
      title,
      location,
      experienceMin,
      experienceMax,
      skills: normalizedSkills,
    };

    // Add salary if provided
    if (salaryMin !== undefined && salaryMax !== undefined) {
      jobDetails.salaryMin = salaryMin;
      jobDetails.salaryMax = salaryMax;
    }

    // Generate job description using OpenAI
    try {
      const description = await generateJobDescription(jobDetails);
      return NextResponse.json({ description });
    } catch (aiError) {
      console.error("AI generation failed:", aiError);
      const message = aiError.message || "Failed to generate job description";
      const details = aiError?.response?.data || aiError?.response || null;

      // If missing API key, return 503 with helpful message
      if (message.includes("API key") || message.includes("OpenAI API key") || message.includes("OpenAI client is not configured")) {
        return NextResponse.json({ error: "AI service not configured. Please set OPENAI_API_KEY." }, { status: 503 });
      }

      // If OpenAI returned a 429 rate limit or similar
      const statusCode = aiError?.response?.status || 500;
      return NextResponse.json(
        { error: message, details },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/jobs/generate-jd:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate job description" },
      { status: 500 }
    );
  }
}