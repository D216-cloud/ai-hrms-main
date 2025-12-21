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
  testInvitationTemplate,
} from "@/lib/emailTemplates";
import crypto from "crypto";

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
    const { status, scheduled_at } = body;

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

    const { sendTest } = body || {};

    // Update application status in the correct table
    let updateResponse;
    const updateObj = { status };

    // Accept optional interview fields from body
    const {
      interviewer_id,
      meeting_link,
      interview_mode,
      interview_duration_minutes,
      interviewer_notes,
    } = body || {};

    if (scheduled_at) {
      // validate ISO date
      const d = new Date(scheduled_at);
      if (!isNaN(d.getTime())) updateObj.scheduled_at = scheduled_at;

      // mark who scheduled it
      updateObj.interview_sent_at = new Date().toISOString();
      updateObj.interview_sent_by = session.user.id || null;
    }

    // apply optional interviewer fields when provided
    if (interviewer_id) updateObj.interviewer_id = interviewer_id;
    if (meeting_link) updateObj.meeting_link = meeting_link;
    if (interview_mode) updateObj.interview_mode = interview_mode;
    if (typeof interview_duration_minutes !== 'undefined') updateObj.interview_duration_minutes = interview_duration_minutes;
    if (interviewer_notes) updateObj.interviewer_notes = interviewer_notes;

    if (targetTable === "job_applications") {
      updateResponse = await supabaseAdmin
        .from("job_applications")
        .update(updateObj)
        .eq("id", id)
        .select("*, scheduled_at, interviewer_id, meeting_link, interview_mode, interview_duration_minutes, interviewer_notes, test_token, test_sent_at, jobs(title), job_seekers(full_name, email)")
        .single();
    } else {
      // public applications table
      updateResponse = await supabaseAdmin
        .from("applications")
        .update(updateObj)
        .eq("id", id)
        .select("*, scheduled_at, interviewer_id, meeting_link, interview_mode, interview_duration_minutes, interviewer_notes, test_token, test_sent_at, jobs(title)")
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

    // If HR asked to send an assessment link, generate token & send
    if (sendTest) {
      try {
        const testToken = crypto.randomBytes(32).toString("hex");

        if (targetTable === "job_applications") {
          await supabaseAdmin
            .from("job_applications")
            .update({ test_token: testToken, test_sent_at: new Date().toISOString(), status: 'interviewing' })
            .eq("id", id);
        } else {
          await supabaseAdmin
            .from("applications")
            .update({ test_token: testToken, test_sent_at: new Date().toISOString(), status: 'interviewing' })
            .eq("id", id);
        }

        // Send test invite email
        const candidateEmail = application.job_seekers?.email || application.email;
        const candidateName = application.job_seekers?.full_name || application.name || "Candidate";
        const jobTitle = application.jobs?.title || application.title || "Position";

        // Try to look up a job-level test duration; fallback to 30
        const { data: jobTest } = await supabaseAdmin.from('tests').select('duration_minutes').eq('job_id', application.job_id).single();
        const duration = jobTest?.duration_minutes || 30;

        const emailTemplate = testInvitationTemplate(candidateName, jobTitle, testToken, duration);
        await sendEmail({ to: candidateEmail, subject: `📝 Assessment Invitation - ${jobTitle}`, html: emailTemplate });
      } catch (err) {
        console.error('Failed to create/send test link:', err);
        // continue - don't block status update
      }
    }

    // If interviewer and scheduled_at provided, update interviewer last_scheduled info (timezone column)
    try {
      if (updateObj.interviewer_id && updateObj.scheduled_at) {
        // fetch interviewer timezone
        const { data: iv, error: ivErr } = await supabaseAdmin.from('interviewers').select('timezone').eq('id', updateObj.interviewer_id).single();
        const tz = iv?.timezone || null;
        await supabaseAdmin.from('interviewers').update({ last_scheduled_at: updateObj.scheduled_at, last_scheduled_timezone: tz }).eq('id', updateObj.interviewer_id);
      }
    } catch (err) {
      console.error('Failed to update interviewer schedule info:', err);
      // don't fail the main request
    }

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
      case "interview_scheduled":
        emailTemplate = interviewScheduledTemplate(
          name,
          jobTitle,
          application_token,
          application.scheduled_at || null
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
