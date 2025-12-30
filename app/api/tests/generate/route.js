
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateMCQs } from "@/lib/openai";

// POST /api/tests/generate - Generate MCQ test for a job (HR/Admin) OR generate ad-hoc for a candidate using a test token
export async function POST(request) {
  try {
    const body = await request.json();
    const { jobId, testToken, count = 20, jobTitle: overrideTitle, skills: overrideSkills = [], experienceYears = 2 } = body || {};

    // If a testToken is provided, allow public candidate generation without auth
    if (testToken) {
      // Verify application exists for this test token
      const { data: application, error: appErr } = await supabaseAdmin
        .from('applications')
        .select('id, job_id, test_token, jobs(title)')
        .eq('test_token', testToken)
        .single();

      if (appErr || !application) {
        return NextResponse.json({ error: 'Invalid test token' }, { status: 404 });
      }

      const resolvedJobTitle = overrideTitle || application.jobs?.title || 'General Knowledge';

      const questions = await generateMCQs({ jobTitle: resolvedJobTitle, skills: overrideSkills, experienceYears, count });

      return NextResponse.json({ success: true, questions });
    }

    // Otherwise, require HR/Admin session to generate and save tests
    const session = await getServerSession(authOptions);

    // Only HR and admin can generate tests for a job and save them
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if test already exists for this job
    const { data: existingTest } = await supabaseAdmin
      .from("tests")
      .select("id")
      .eq("job_id", jobId)
      .single();

    if (existingTest) {
      return NextResponse.json(
        {
          error:
            "Test already exists for this job. Delete the existing test first to regenerate.",
        },
        { status: 400 }
      );
    }

    // Generate MCQ questions using AI
    const questions = await generateMCQs({
      jobTitle: job.title,
      skills: job.skills || [],
      experienceYears: job.experience_min || 2,
      count
    });

    // Validate questions format
    if (!Array.isArray(questions) || questions.length < 5) {
      throw new Error("Invalid questions format or insufficient questions");
    }

    // Validate each question structure
    const validQuestions = questions.every(
      (q) =>
        q.q &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3
    );

    if (!validQuestions) {
      throw new Error("Invalid question structure");
    }

    // Save test to database
    const { data: test, error: testError } = await supabaseAdmin
      .from("tests")
      .insert({
        job_id: jobId,
        questions: questions,
        created_by: session.user.id,
        duration_minutes: 30, // Default 30 minutes
        passing_score: 60, // Default 60% to pass
      })
      .select()
      .single();

    if (testError) {
      console.error("Error saving test:", testError);
      return NextResponse.json(
        { error: "Failed to save test" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test generated successfully with ${questions.length} questions`,
      test: {
        id: test.id,
        jobId: test.job_id,
        questionCount: questions.length,
        duration: test.duration_minutes,
        passingScore: test.passing_score,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/tests/generate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate test" },
      { status: 500 }
    );
  }
}

// GET /api/tests/generate?jobId=xxx - Get test for a job
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const { data: test, error } = await supabaseAdmin
      .from("tests")
      .select("*, jobs(title)")
      .eq("job_id", jobId)
      .single();

    if (error || !test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error("Error in GET /api/tests/generate:", error);
    return NextResponse.json(
      { error: "Failed to fetch test" },
      { status: 500 }
    );
  }
}

// DELETE /api/tests/generate?jobId=xxx - Delete test for a job
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("tests")
      .delete()
      .eq("job_id", jobId);

    if (error) {
      console.error("Error deleting test:", error);
      return NextResponse.json(
        { error: "Failed to delete test" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/tests/generate:", error);
    return NextResponse.json(
      { error: "Failed to delete test" },
      { status: 500 }
    );
  }
}
