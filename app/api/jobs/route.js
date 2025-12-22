import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// GET /api/jobs - List all jobs (admin/hr) or active jobs (public)
export async function GET(request) {
  try {
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.log("Session error (continuing without session):", sessionError.message);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const createdByParam = searchParams.get("created_by");

    let query = supabaseAdmin.from("jobs").select("*");

    // If not authenticated or not hr/admin, show only active jobs
    const isHROrAdmin = session?.user?.role === "hr" || session?.user?.role === "admin";

    if (!isHROrAdmin) {
      // Public viewers only see active jobs
      query = query.eq("status", "active");
    } else {
      // HR/Admin can optionally filter by status
      if (status) {
        query = query.eq("status", status);
      }

      // For HR users, filter by their email or UUID
      if (session.user.role === "hr") {
        const ownerEmail = session.user.email;
        const userId = session.user.id;

        // Build OR condition for hr_email or created_by
        if (userId) {
          query = query.or(`hr_email.eq.${ownerEmail},created_by.eq.${userId}`);
        } else {
          query = query.eq("hr_email", ownerEmail);
        }
      } else if (session.user.role === "admin" && createdByParam) {
        // Admins may filter by any created_by value if specified
        query = query.eq("created_by", createdByParam);
      }
    }

    const { data: jobs, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Supabase error fetching jobs:", error);
      // Return empty array instead of error to prevent breaking the UI
      return NextResponse.json([]);
    }

    // Return empty array if no jobs found
    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json([]);
    }

    // Format the response
    const formattedJobs = jobs.map((job) => ({
      _id: job.id,
      id: job.id,
      title: job.title || "Untitled Position",
      company: job.company || "Company",
      location: job.location || "Remote",
      salary: job.salary_min && job.salary_max
        ? `$${job.salary_min} - $${job.salary_max}`
        : job.salary || "Competitive",
      type: job.type || "Full-time",
      experience: job.experience_min && job.experience_max
        ? `${job.experience_min}-${job.experience_max} years`
        : job.experience || "",
      description: job.jd_text || job.description || "",
      status: job.status,
      created_at: job.created_at,
      applicationCount: 0,
      saved_job: job.saved_job || false,
    }));

    return NextResponse.json(formattedJobs);
  } catch (error) {
    console.error("Unexpected error in GET /api/jobs:", error);
    // Always return empty array with 200 status to prevent UI breaking
    return NextResponse.json([]);
  }
}

// POST /api/jobs - Create a new job
export async function POST(request) {
  console.log("=== JOB CREATION STARTED ===");

  let body = null;

  try {
    body = await request.json();
    console.log("✓ Request body parsed successfully");
  } catch (parseError) {
    console.error("✗ Failed to parse request body:", parseError);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Get and validate session
    console.log("Step 1: Validating session...");
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.error("✗ No session or user");
      return NextResponse.json(
        { error: "You must be logged in to create jobs." },
        { status: 401 }
      );
    }

    if (session.user.role !== "hr" && session.user.role !== "admin") {
      console.error("✗ Unauthorized role:", session.user.role);
      return NextResponse.json(
        { error: "You don't have permission to create jobs." },
        { status: 403 }
      );
    }

    console.log("✓ Session validated:", {
      email: session.user.email,
      role: session.user.role,
      id: session.user.id,
    });

    // Validate that user ID is a proper UUID
    if (session.user.id) {
      try {
        // Try to parse the ID as a UUID
        uuidv4.parse(session.user.id);
        console.log("✓ User ID is a valid UUID");
      } catch (uuidError) {
        console.warn("⚠ User ID is not a valid UUID, generating a new one");
        // If it's not a valid UUID, we'll create the job without a creator reference
        session.user.id = null;
      }
    }

    // Step 2: Extract and validate required fields
    console.log("Step 2: Validating required fields...");
    const {
      title,
      description,
      location,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      skills,
      status = "draft",
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!description) missingFields.push("description");
    if (!location) missingFields.push("location");
    if (experienceMin === undefined || experienceMin === null || experienceMin === "") {
      missingFields.push("experienceMin");
    }
    if (experienceMax === undefined || experienceMax === null || experienceMax === "") {
      missingFields.push("experienceMax");
    }

    if (missingFields.length > 0) {
      console.error("✗ Missing required fields:", missingFields);
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
        },
        { status: 400 }
      );
    }

    console.log("✓ All required fields present");

    // Step 3: Validate experience range
    console.log("Step 3: Validating experience range...");
    const expMin = parseInt(experienceMin);
    const expMax = parseInt(experienceMax);

    if (isNaN(expMin) || isNaN(expMax)) {
      console.error("✗ Invalid experience values");
      return NextResponse.json(
        { error: "Experience values must be numbers" },
        { status: 400 }
      );
    }

    if (expMin < 0 || expMax < expMin) {
      console.error("✗ Invalid experience range:", expMin, expMax);
      return NextResponse.json(
        { error: "Invalid experience range" },
        { status: 400 }
      );
    }

    console.log("✓ Experience range valid:", expMin, "-", expMax);

    // Step 4: Format salary range
    console.log("Step 4: Formatting salary range...");
    let salary_range = null;
    if (salaryMin && salaryMax) {
      salary_range = `$${parseInt(salaryMin).toLocaleString()} - $${parseInt(salaryMax).toLocaleString()}`;
    } else if (salaryMin) {
      salary_range = `From $${parseInt(salaryMin).toLocaleString()}`;
    } else if (salaryMax) {
      salary_range = `Up to $${parseInt(salaryMax).toLocaleString()}`;
    }
    console.log("✓ Salary range:", salary_range || "Not specified");

    // Step 5: Prepare job data (WITHOUT embedding for now)
    console.log("Step 5: Preparing job data...");
    const jobData = {
      title: title.trim(),
      jd_text: description.trim(),
      location: location.trim(),
      experience_min: expMin,
      experience_max: expMax,
      salary_range,
      skills: Array.isArray(skills) ? skills : [],
      status: status || "draft",
      ai_generated: false,
    };

    // Add created_by only if user ID exists and is valid
    if (session.user.id) {
      jobData.created_by = session.user.id;
      console.log("✓ Created by:", session.user.id);
    } else {
      console.log("⚠ No valid user ID, job will be created without created_by");
    }

    // Add HR email from session
    if (session.user.email) {
      jobData.hr_email = session.user.email;
      console.log("✓ HR email:", session.user.email);
    } else {
      console.log("⚠ No email in session, job will be created without hr_email");
    }

    // Step 6: Insert into database with enhanced retry and error handling
    console.log("Step 6: Inserting into database...");
    console.log("Using Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50) + "...");
    console.log("Has service role key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    let job;
    let dbError;
    let retryCount = 0;
    const maxRetries = 3;

    // Retry logic for network issues
    while (retryCount < maxRetries) {
      try {
        console.log(`Insert attempt ${retryCount + 1}/${maxRetries}...`);

        const result = await Promise.race([
          supabaseAdmin
            .from("jobs")
            .insert(jobData)
            .select()
            .single(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout after 10s")), 10000)
          ),
        ]);

        job = result.data;
        dbError = result.error;

        if (!dbError) {
          console.log("✓ Job inserted successfully on attempt", retryCount + 1);
          break;
        } else {
          console.warn(`Attempt ${retryCount + 1} failed:`, dbError.message);
          if (retryCount < maxRetries - 1) {
            retryCount++;
            const waitTime = 1000 * (retryCount + 1);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            retryCount++;
          }
        }
      } catch (e) {
        console.error(`Attempt ${retryCount + 1} exception:`, e.message);

        if (retryCount < maxRetries - 1) {
          retryCount++;
          const waitTime = 1000 * (retryCount + 1);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          dbError = {
            code: "NETWORK_ERROR",
            message: e.message || "Network connection failed",
            details: `Failed after ${maxRetries} attempts`,
            hint: "Check internet connection and Supabase status",
          };
          retryCount++;
        }
      }
    }

    if (dbError) {
      console.error("✗ Database error after retries:", {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
      });

      // Network errors
      if (
        dbError.message?.includes("fetch failed") ||
        dbError.message?.includes("timeout") ||
        dbError.code === "NETWORK_ERROR" ||
        dbError.message?.includes("ECONNREFUSED") ||
        dbError.message?.includes("ERR_MODULE_NOT_FOUND")
      ) {
        console.error("⚠️ Network/Connection Error - Cannot reach Supabase");
        return NextResponse.json(
          {
            error: "Cannot connect to database. Please check your internet connection.",
            hint: "Your connection to Supabase failed. Please check: 1) Internet connection 2) Firewall settings 3) VPN/Proxy settings",
            code: "CONNECTION_ERROR",
          },
          { status: 503 }
        );
      }

      // Foreign key constraint error
      if (dbError.code === "23503") {
        console.error("⚠️ Foreign key constraint error");
        return NextResponse.json(
          {
            error: "Invalid user reference. Please sign out and sign in again.",
            hint: "The user creating this job could not be verified. Try logging out and back in.",
            code: "FOREIGN_KEY_VIOLATION",
            details: dbError.message
          },
          { status: 400 }
        );
      }

      // Duplicate job title error
      if (dbError.code === "23505") {
        console.error("⚠️ Duplicate job title error");
        return NextResponse.json(
          {
            error: "A job with this title already exists",
            hint: "Please use a different job title",
            code: "DUPLICATE_TITLE",
            details: dbError.message
          },
          { status: 409 }
        );
      }

      // Undefined table error
      if (dbError.code === "42P01") {
        console.error("⚠️ Table not found error");
        return NextResponse.json(
          {
            error: "Database table not found. Please run the migration.",
            hint: "Run the SQL in migrations/init-database.sql in Supabase",
            code: "TABLE_NOT_FOUND",
            details: dbError.message
          },
          { status: 500 }
        );
      }

      // Insufficient privileges error
      if (dbError.code === "42501") {
        console.error("⚠️ Insufficient privileges error");
        return NextResponse.json(
          {
            error: "Insufficient database privileges",
            hint: "The database user doesn't have permission to create jobs",
            code: "INSUFFICIENT_PRIVILEGES",
            details: dbError.message
          },
          { status: 500 }
        );
      }

      // UUID format error
      if (dbError.code === "22P02" && dbError.message?.includes("uuid")) {
        console.error("⚠️ UUID format error");
        return NextResponse.json(
          {
            error: "User ID format error. Please sign out and sign in again.",
            hint: "There was an issue with your user account. Please log out and log back in.",
            code: "UUID_FORMAT_ERROR",
            details: dbError.message
          },
          { status: 400 }
        );
      }

      // Return generic database error
      console.error("⚠️ Generic database error");
      return NextResponse.json(
        {
          error: "Failed to create job in database",
          code: dbError.code || "DB_ERROR",
          details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
          hint: "Check the server logs for more details"
        },
        { status: 500 }
      );
    }

    if (!job) {
      console.error("✗ No job returned from database");
      return NextResponse.json(
        {
          error: "Job creation failed - no data returned",
          code: "NO_DATA_RETURNED",
          hint: "The database operation completed but no job data was returned"
        },
        { status: 500 }
      );
    }

    console.log("✓ Job created successfully:", job.id);
    console.log("=== JOB CREATION COMPLETED ===");

    // Return success response with job data
    return NextResponse.json(
      {
        success: true,
        message: `Job ${status === "active" ? "published" : "saved as draft"} successfully!`,
        job: job
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("=== UNEXPECTED ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      {
        error: "An unexpected error occurred while creating the job",
        code: "UNEXPECTED_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        hint: "Check the server logs for more details"
      },
      { status: 500 }
    );
  }
}