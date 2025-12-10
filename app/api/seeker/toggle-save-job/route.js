import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/seeker/toggle-save-job - Save or unsave a job
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "job_seeker") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobId, saved } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    if (saved) {
      // SAVE JOB: Set saved_job = true in jobs table
      console.log(`💾 Saving job ${jobId}`);

      const { error } = await supabaseAdmin
        .from("jobs")
        .update({ saved_job: true })
        .eq("id", jobId);

      if (error) {
        console.error("❌ Error saving job:", error);
        return NextResponse.json(
          { error: "Failed to save job" },
          { status: 500 }
        );
      }

      console.log(`✅ Job ${jobId} saved`);
      return NextResponse.json({
        saved: true,
        message: "✅ Job saved successfully!",
      });
    } else {
      // UNSAVE JOB: Set saved_job = false in jobs table
      console.log(`🗑️ Unsaving job ${jobId}`);

      const { error } = await supabaseAdmin
        .from("jobs")
        .update({ saved_job: false })
        .eq("id", jobId);

      if (error) {
        console.error("❌ Error unsaving job:", error);
        return NextResponse.json(
          { error: "Failed to unsave job" },
          { status: 500 }
        );
      }

      console.log(`✅ Job ${jobId} unsaved`);
      return NextResponse.json({
        saved: false,
        message: "❌ Job removed from saved",
      });
    }
  } catch (error) {
    console.error("❌ Error in toggle-save-job:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// GET /api/seeker/toggle-save-job - Check if a job is saved
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "job_seeker") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Check saved_job status in jobs table
    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .select("saved_job")
      .eq("id", jobId)
      .single();

    if (error) {
      return NextResponse.json({ saved: false });
    }

    console.log(`📌 Job ${jobId} saved status: ${job?.saved_job}`);
    return NextResponse.json({
      saved: job?.saved_job === true,
    });
  } catch (error) {
    console.error("❌ Error in GET toggle-save-job:", error);
    return NextResponse.json({ saved: false });
  }
}
