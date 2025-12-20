import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import {
  applicationShortlistedTemplate,
  applicationRejectedTemplate,
  interviewScheduledTemplate,
  offerExtendedTemplate,
  applicationHiredTemplate,
} from "@/lib/emailTemplates";

// PATCH /api/applications/[id]/status - Update application status
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Only hr and admin can update application status
    if (
      !session ||
      (session.user.role !== "hr" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = [
      "applied",
      "submitted",
      "under_review",
      "shortlisted",
      "rejected",
      "interview_scheduled",
      "interviewing",
      "offered",
      "hired",
      "accepted",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // First, try to find an authenticated seeker application (job_applications)
    let { data: existingApp, error: fetchError } = await supabaseAdmin
      .from("job_applications")
      .select("*, jobs(id, hr_email, created_by, title), job_seekers(full_name, email)")
      .eq("id", id)
      .single();

    let targetTable = "job_applications";

    if (fetchError || !existingApp) {
      // If not found, try the public 'applications' table
      const { data: publicApp, error: publicFetchError } = await supabaseAdmin
        .from("applications")
        .select("*, jobs(id, hr_email, created_by, title)")
        .eq("id", id)
        .single();

      if (publicFetchError || !publicApp) {
        console.error("Application not found in either table:", { fetchError, publicFetchError });
        return NextResponse.json(
          { error: "Application not found" },
          { status: 404 }
        );
      }

      existingApp = publicApp;
      targetTable = "applications";
    }

    // Verify HR owns this job (unless admin)
    if (session.user.role !== "admin") {
      const job = existingApp.jobs;
      const isOwnerByEmail = job?.hr_email === session.user.email;
      const isOwnerById = session.user.id && job?.created_by === session.user.id;

      if (!isOwnerByEmail && !isOwnerById) {
        return NextResponse.json(
          { error: "Forbidden - You can only update applications for your own job postings" },
          { status: 403 }
        );
      }
    }

    // Update application status in the correct table
    let updateResponse;
    if (targetTable === "job_applications") {
      updateResponse = await supabaseAdmin
        .from("job_applications")
        .update({ status })
        .eq("id", id)
        .select("*, jobs(title), job_seekers(full_name, email)")
        .single();
    } else {
      // public applications table
      updateResponse = await supabaseAdmin
        .from("applications")
        .update({ status })
        .eq("id", id)
        .select("*, jobs(title)")
        .single();
    }

    const { data: application, error } = updateResponse || {};

    if (error || !application) {
      console.error("Error updating application:", error);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    // Send email notification to candidate
    await sendStatusUpdateEmail(application, status);

    // Return the updated application row
    return NextResponse.json(application);
  } catch (error) {
    console.error("Error in PATCH /api/applications/[id]/status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Send email notification based on status update
 */
async function sendStatusUpdateEmail(application, newStatus) {
  try {
    // Determine applicant details (support both job_applications and public applications)
    const name = application.job_seekers?.full_name || application.name || "Applicant";
    const email = application.job_seekers?.email || application.email;
    const application_token = application.application_token || application.id; // Prefer token if available
    const jobTitle = application.jobs?.title || application.title || "Position";

    if (!email) {
      console.warn("No email found for application:", application.id);
      return;
    }

    let emailTemplate;
    let subject;

    switch (newStatus) {
      case "shortlisted":
        emailTemplate = applicationShortlistedTemplate(
          name,
          jobTitle,
          application_token
        );
        subject = `🎉 Your Application Has Been Shortlisted - ${jobTitle}`;
        break;

      case "rejected":
        emailTemplate = applicationRejectedTemplate(name, jobTitle);
        subject = `Update on Your Application - ${jobTitle}`;
        break;

      case "interviewing":
        emailTemplate = interviewScheduledTemplate(
          name,
          jobTitle,
          application_token
        );
        subject = `📅 Interview Invitation - ${jobTitle}`;
        break;

      case "offered":
        emailTemplate = offerExtendedTemplate(
          name,
          jobTitle,
          application_token
        );
        subject = `🎊 Job Offer - ${jobTitle}`;
        break;

      case "hired":
        emailTemplate = applicationHiredTemplate(name, jobTitle);
        subject = `🎉 Welcome to the Team - ${jobTitle}`;
        break;

      default:
        // Don't send email for 'submitted' as it's sent during application creation
        return;
    }

    if (emailTemplate) {
      await sendEmail({
        to: email,
        subject,
        html: emailTemplate,
      });
      console.log(
        `Status update email sent to ${email} for status: ${newStatus}`
      );
    }
  } catch (error) {
    console.error("Error sending status update email:", error);
    // Don't throw error - email failure shouldn't break the status update
  }
}
