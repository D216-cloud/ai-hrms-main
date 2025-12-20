"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Mail,
  FileText,
  Briefcase,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Clock,
  Heart,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

export default function ApplicationSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  const token = searchParams.get("token");
  const jobTitle = searchParams.get("jobTitle");
  const email = searchParams.get("email");
  const matchScore = searchParams.get("matchScore");

  useEffect(() => {
    // If no token, redirect to jobs page
    if (!token) {
      router.push("/jobs");
    }
  }, [token, router]);

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success("Token copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-blue-50 dark:from-green-950/30 dark:via-gray-900 dark:to-blue-950/20 py-6 md:py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Success Header with enhanced animations */}
        <div className="text-center mb-8 md:mb-10 animate-in fade-in zoom-in duration-700">
          {/* Animated success badge background */}
          <div className="inline-flex items-center justify-center mb-4 md:mb-6">
            <div className="relative">
              {/* Pulsing ring effect */}
              <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse opacity-25 scale-150"></div>
              <div className="absolute inset-0 bg-green-300 rounded-full animate-pulse opacity-20 scale-125" style={{ animationDelay: "0.2s" }}></div>

              {/* Main icon container */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 bg-linear-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-full shadow-lg border-2 border-green-200 dark:border-green-700/50">
                <CheckCircle2 className="h-8 w-8 md:h-14 md:w-14 text-green-600 dark:text-green-400 animate-in fade-in zoom-in duration-500 delay-300" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 bg-clip-text text-transparent bg-linear-to-r from-green-600 via-emerald-600 to-teal-600">
            🎉 Application Submitted!
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-200 font-medium">
            Your application has been successfully received and is now in review.
          </p>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2">
            We'll notify you about next steps via email
          </p>
        </div>

        {/* Application Details Card - Enhanced */}
        <Card className="mb-5 md:mb-7 animate-in fade-in slide-in-from-bottom duration-500 delay-100 border-green-200 dark:border-green-800/50 shadow-xl hover:shadow-2xl transition-shadow">
          <CardHeader className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-800/30">
            <CardTitle className="flex items-center gap-3 text-lg md:text-xl text-green-900 dark:text-green-100">
              <div className="p-2 bg-green-200 dark:bg-green-900/40 rounded-lg">
                <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-green-700 dark:text-green-300" />
              </div>
              Application Details
            </CardTitle>
            <CardDescription className="text-xs md:text-sm text-green-700 dark:text-green-300">
              ✓ Successfully received and queued for review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-5 pt-6">
            {/* Position */}
            <div className="group p-4 rounded-lg bg-linear-to-r from-green-50 to-transparent dark:from-green-900/10 dark:to-transparent border-l-4 border-green-400 dark:border-green-600 hover:shadow-md transition-all">
              <label className="text-xs md:text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">
                📋 Position Applied For
              </label>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mt-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {jobTitle || "Job Position"}
              </p>
            </div>

            {/* Email */}
            <div className="group p-4 rounded-lg bg-linear-to-r from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent border-l-4 border-blue-400 dark:border-blue-600 hover:shadow-md transition-all">
              <label className="text-xs md:text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                📧 Email Address
              </label>
              <p className="text-gray-900 dark:text-white flex items-center gap-3 mt-2 break-all">
                <Mail className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="text-sm md:text-base font-medium">{email}</span>
              </p>
            </div>

            {matchScore && (
              <div className="group p-4 rounded-lg bg-linear-to-r from-purple-50 to-transparent dark:from-purple-900/10 dark:to-transparent border-l-4 border-purple-400 dark:border-purple-600 hover:shadow-md transition-all">
                <label className="text-xs md:text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  ⭐ Initial Match Score
                </label>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <Badge
                      variant={
                        parseInt(matchScore) >= 70
                          ? "default"
                          : parseInt(matchScore) >= 50
                            ? "secondary"
                            : "outline"
                      }
                      className="text-base md:text-lg px-4 md:px-6 py-2 font-bold"
                    >
                      {matchScore}% Match 🎯
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 italic">
                    {parseInt(matchScore) >= 70 ? "Great Match! 🌟" : parseInt(matchScore) >= 50 ? "Good Match ✓" : "Keep Trying"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking Token Card - Important */}
        <Card className="mb-5 md:mb-7 border-2 border-cyan-300 dark:border-cyan-700/70 bg-linear-to-br from-cyan-50 via-blue-50 to-white dark:from-cyan-900/20 dark:via-blue-900/10 dark:to-gray-900 shadow-xl hover:shadow-2xl transition-shadow animate-in fade-in slide-in-from-bottom duration-500 delay-200">
          <CardHeader className="bg-linear-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 border-b-2 border-cyan-200 dark:border-cyan-800/50">
            <CardTitle className="flex items-center gap-3 text-cyan-900 dark:text-cyan-100 text-lg md:text-xl">
              <div className="p-2 bg-cyan-200 dark:bg-cyan-900/50 rounded-lg">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-cyan-700 dark:text-cyan-300" />
              </div>
              🔑 Application Tracking Token
            </CardTitle>
            <CardDescription className="text-cyan-700 dark:text-cyan-300 text-xs md:text-sm font-medium">
              This token is your unique application reference. Save it to track your status!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Token Display Box */}
              <div className="group flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-3 md:p-4 bg-white dark:bg-gray-800/50 rounded-xl border-2 border-cyan-200 dark:border-cyan-700/50 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all">
                <code className="flex-1 text-xs md:text-sm font-mono text-gray-800 dark:text-gray-200 break-all px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg select-all">
                  {token}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToken}
                  className="shrink-0 border-cyan-300 hover:bg-cyan-50 dark:border-cyan-700 dark:hover:bg-cyan-900/20"
                >
                  {copied ? (
                    <><Check className="h-4 w-4 text-green-600 mr-1" /> Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" /> Copy Token</>
                  )}
                </Button>
              </div>

              {/* Info Box */}
              <div className="p-3 md:p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-700/50">
                <p className="text-xs md:text-sm text-cyan-900 dark:text-cyan-100">
                  <span className="font-bold">💾 Save your token</span> in an email or note. You'll need it to check your application status without logging in.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next - Timeline */}
        <Card className="mb-6 md:mb-8 shadow-lg hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-bottom duration-500 delay-300">
          <CardHeader className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800/30">
            <CardTitle className="flex items-center gap-3 text-indigo-900 dark:text-indigo-100 text-lg md:text-xl">
              <Clock className="h-5 w-5 md:h-6 md:w-6" />
              📅 What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ol className="space-y-4 md:space-y-5 relative">
              {/* Timeline line */}
              <div className="absolute left-3.5 md:left-4 top-0 bottom-0 w-0.5 bg-linear-to-b from-indigo-300 to-purple-300 dark:from-indigo-700 dark:to-purple-700 hidden sm:block"></div>

              {/* Step 1 */}
              <li className="flex gap-4 md:gap-5">
                <div className="shrink-0 relative">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-indigo-500 dark:bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-lg ring-4 ring-white dark:ring-gray-900">
                    1
                  </div>
                </div>
                <div className="flex-1 pb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                    🤖 Application Review
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Our AI system will analyze your resume and match it with the job requirements. This typically takes 24-48 hours.
                  </p>
                </div>
              </li>

              {/* Step 2 */}
              <li className="flex gap-4 md:gap-5">
                <div className="shrink-0 relative">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-lg ring-4 ring-white dark:ring-gray-900">
                    2
                  </div>
                </div>
                <div className="flex-1 pb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                    👤 HR Screening
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    If you match the criteria, our HR team will review your application. Shortlisted candidates will receive an email invitation.
                  </p>
                </div>
              </li>

              {/* Step 3 */}
              <li className="flex gap-4 md:gap-5">
                <div className="shrink-0 relative">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-pink-500 dark:bg-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-lg ring-4 ring-white dark:ring-gray-900">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                    📝 Next Steps
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Next round could be a technical assessment, interview, or other evaluation depending on the role.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom duration-500 delay-400">
          <Button asChild variant="outline" size="lg" className="text-sm md:text-base border-2 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10">
            <Link href={`/status/${token}`}>
              <FileText className="mr-2 h-4 w-4" />
              Check Application Status
            </Link>
          </Button>
          <Button asChild size="lg" className="text-sm md:text-base bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg">
            <Link href="/jobs">
              <Briefcase className="mr-2 h-4 w-4" />
              Browse More Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Help Section */}
        <div className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 md:p-6 text-center animate-in fade-in slide-in-from-bottom duration-500 delay-500">
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-200">
            <span className="font-bold text-amber-700 dark:text-amber-300">❓ Need Help?</span> <br className="md:hidden" />
            Contact us at{" "}
            <a
              href="mailto:hr@company.com"
              className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              hr@company.com
            </a>
            {" "}or check the{" "}
            <a
              href={`/status/${token}`}
              className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              status page
            </a>
          </p>
        </div>

        {/* Footer Message */}
        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Application ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{token.substring(0, 12)}...</code></p>
        </div>
      </div>
    </div>
  );
}
