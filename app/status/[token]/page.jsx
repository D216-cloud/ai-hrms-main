"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowLeft,
  Building2,
} from "lucide-react";

const statusConfig = {
  submitted: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-800",
    icon: FileText,
    description: "Your application has been received and is under review",
  },
  shortlisted: {
    label: "Shortlisted",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
    description: "Great news! You've been shortlisted for the next round",
  },
  rejected: {
    label: "Not Selected",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    description:
      "Thank you for your interest. Unfortunately, we're moving forward with other candidates",
  },
  interviewing: {
    label: "Interviewing",
    color: "bg-purple-100 text-purple-800",
    icon: Clock,
    description:
      "You're in the interview stage. Check your email for next steps",
  },
  offered: {
    label: "Offer Extended",
    color: "bg-yellow-100 text-yellow-800",
    icon: Award,
    description: "Congratulations! We've extended an offer. Check your email",
  },
  hired: {
    label: "Hired",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
    description: "Welcome aboard! You've been hired",
  },
};

export default function StatusPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  const token = params.token;
  const router = useRouter();

  const startTest = () => {
    // Open admin test start page for this job (pass jobId)
    const jobId = application?.job_id;
    if (!jobId) {
      // No job available; open mail client to contact HR
      window.location.href = 'mailto:hr@company.com?subject=Test%20Request';
      return;
    }
    router.push(`/admin/test/start?jobId=${encodeURIComponent(jobId)}`);
  };



  const fetchApplicationStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch application by token first (public applications)
      let app = null;
      try {
        const appResponse = await fetch(
          `/api/job-applications?token=${encodeURIComponent(token)}`
        );
        const appData = await appResponse.json();

        if (appResponse.ok && appData && appData.length > 0) {
          app = Array.isArray(appData) ? appData[0] : appData;
        }
      } catch (err) {
        console.warn('Token lookup failed:', err);
      }

      // If token lookup returned nothing, fall back to lookup by ID (used for internal links)
      if (!app) {
        const idResp = await fetch(`/api/job-applications?id=${encodeURIComponent(token)}`);
        const idData = await idResp.json();
        if (idResp.ok && idData && idData.length > 0) {
          app = Array.isArray(idData) ? idData[0] : idData;
        }
      }

      if (!app) {
        throw new Error("Application not found. Please check your token or ID.");
      }

      setApplication(app);

      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${app.job_id}`);
      const jobData = await jobResponse.json();

      if (jobResponse.ok) {
        setJob(jobData);
      }
    } catch (err) {
      console.error("Error fetching application status:", err);
      setError(err.message || "Failed to load application status");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchApplicationStatus();
    }
  }, [token, fetchApplicationStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-center">Application Not Found</CardTitle>
            <CardDescription className="text-center">
              {error ||
                "We couldn't find an application with this tracking token."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Jobs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[application.status] || statusConfig.submitted;
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button asChild variant="ghost" className="mb-4">
              <Link href="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Application Status
            </h1>
            <p className="text-gray-600 mt-2">Track your application progress</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={startTest}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={!application?.test_token && !token}
            >
              Start Test
            </Button>
            {!application?.test_token && (
              <span className="text-sm text-gray-500 hidden sm:inline">Test not available — <a href="mailto:hr@company.com" className="text-blue-600 hover:underline">Contact HR</a></span>
            )}
          </div>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${statusInfo.color}`}
                  >
                    <StatusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>Current Status: {statusInfo.label}</CardTitle>
                    <CardDescription>{statusInfo.description}</CardDescription>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Application Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {job && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Position
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {job.title}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Building2 className="h-4 w-4" />
                  {job.location}
                </p>

                {application.scheduled_at && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Interview Time</label>
                    <p className="text-gray-900">{new Date(application.scheduled_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Applicant Name
                </label>
                <p className="text-gray-900">{application.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900">{application.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <p className="text-gray-900">{application.phone}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Applied On
                </label>
                <p className="text-gray-900">
                  {new Date(application.created_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>

            {application.resume_match_score !== null &&
              application.resume_match_score !== undefined && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      Match Score
                    </label>
                    <div className="mt-2">
                      <Badge
                        variant={
                          application.resume_match_score >= 70
                            ? "default"
                            : application.resume_match_score >= 50
                              ? "secondary"
                              : "outline"
                        }
                        className="text-lg px-4 py-1"
                      >
                        {application.resume_match_score}% Match
                      </Badge>
                    </div>
                  </div>
                </>
              )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {application.status === "submitted" && (
                <p className="text-gray-700">
                  Your application is being reviewed by our hiring team. We&apos;ll
                  notify you via email if you&apos;re shortlisted for the next round.
                </p>
              )}
              {application.status === "shortlisted" && (
                <p className="text-gray-700">
                  Congratulations! You&apos;ve been shortlisted. Check your email for
                  next steps, which may include an assessment or interview
                  invitation.
                </p>
              )}
                      {(application.status === "interviewing" || application.status === "interview_scheduled") && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    You&apos;re in the interview stage. Please check your email for
                    interview scheduling details and preparation materials.
                  </p>

                  {/* Show scheduled date/time if available */}
                  {application.scheduled_at && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-gray-700">Scheduled</label>
                      <p className="text-gray-900">{new Date(application.scheduled_at).toLocaleString()}</p>
                    </div>
                  )}

                  {/* Company rules */}
                  <div className="mt-4 p-4 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Company Rules & Interview Guidelines</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Arrive 5–10 minutes early and keep your camera on for virtual interviews.</li>
                      <li>Have a stable internet connection and a quiet, distraction-free environment.</li>
                      <li>Bring valid ID for on-site interviews if requested.</li>
                      <li>Be prepared to discuss your resume and past experience.</li>
                    </ul>
                  </div>

                  {/* Assessment / Test CTA when available */}
                  {application.test_token && (
                    <div className="mt-4 p-4 rounded-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Assessment</h4>
                      <p className="text-gray-700 text-sm mb-3">You have been invited to complete an assessment as part of this interview. Completing and passing the test may be required to progress.</p>
                      <div className="flex items-center gap-3">
                        <Button asChild>
                          <Link href={`/test/${application.test_token}`}>Take Assessment</Link>
                        </Button>
                        <a href="#" className="text-sm text-gray-500">Need help? Contact HR</a>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {application.status === "offered" && (
                <p className="text-gray-700">
                  We&apos;ve extended an offer! Check your email for the offer letter
                  and next steps to join our team.
                </p>
              )}
              {application.status === "hired" && (
                <p className="text-gray-700">
                  Welcome to the team! Check your email for onboarding
                  instructions and your start date.
                </p>
              )}
              {application.status === "rejected" && (
                <p className="text-gray-700">
                  While we won&apos;t be moving forward with your application at this
                  time, we appreciate your interest and encourage you to apply
                  for other positions that match your skills.
                </p>
              )}

              <p className="text-sm text-gray-600 mt-4">
                💡 Tip: Bookmark this page or save your tracking token to check
                your status anytime.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Questions about your application? Contact us at{" "}
            <a
              href="mailto:hr@company.com"
              className="text-blue-600 hover:underline"
            >
              hr@company.com
            </a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
