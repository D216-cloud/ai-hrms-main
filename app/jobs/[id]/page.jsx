"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader2,
  Calendar,
  CheckCircle,
  Users,
  Award,
  Share2,
  Heart,
  BookOpen,
  TrendingUp,
} from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchJob();
    }
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`);
      
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Expected JSON but received:", text);
        throw new Error("Received non-JSON response from server");
      }
      
      const data = await response.json();

      if (response.ok) {
        setJob(data);
      } else {
        console.error("Job not found");
        router.push("/jobs");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      router.push("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return "Competitive salary";
    const formatNumber = (num) => {
      if (num >= 100000) return `$${(num / 1000).toFixed(0)}k`;
      return `$${num.toLocaleString()}`;
    };
    if (min && max) return `${formatNumber(min)} - ${formatNumber(max)}`;
    if (min) return `From ${formatNumber(min)}`;
    if (max) return `Up to ${formatNumber(max)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-semibold">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Job not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">This job posting may have been removed or archived.</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <NavBar />

      {/* Back to Jobs Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors font-semibold">
          <ArrowLeft className="w-5 h-5" /> Back to Jobs
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-3xl p-8 md:p-12 border-2 border-cyan-200 dark:border-cyan-800/50">
            <div className="flex items-start justify-between gap-6 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-900/50 mb-4">
                  <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">Trending Job</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  {job.title}
                </h1>
                <p className="text-lg text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                  <span className="text-2xl">🏢</span>
                  {job.company || "Company"}
                </p>
              </div>
              <div className="text-6xl">💼</div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase mb-1">Location</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-600" /> {job.location || "Remote"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase mb-1">Type</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {job.type || "Full-time"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase mb-1">Salary</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatSalary(job.salary_min, job.salary_max)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase mb-1">Experience</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {job.experience_min || 0}-{job.experience_max || 5} yrs
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg animate-in fade-in slide-in-from-left duration-500 delay-100">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                <BookOpen className="w-6 h-6 text-teal-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">About This Role</h2>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {job.description ? (
                  job.description.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                      {paragraph || ""}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No description provided</p>
                )}
              </div>
            </div>

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg animate-in fade-in slide-in-from-left duration-500 delay-150">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                  <Award className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Required Skills</h2>
                  <span className="ml-auto bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-bold">
                    {job.skills.length} Skills
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {job.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold border border-purple-200 dark:border-purple-700/50"
                    >
                      ✓ {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apply CTA - Prominent Section */}
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-8 rounded-2xl shadow-lg border-2 border-cyan-400 animate-in fade-in slide-in-from-bottom duration-500 lg:hidden">
              <div className="text-center space-y-6">
                <div className="text-5xl">🚀</div>
                <div>
                  <h3 className="font-bold text-2xl text-white mb-2">Ready to Apply?</h3>
                  <p className="text-cyan-100 text-base">
                    Take the next step in your career with us. Our AI will help match your profile!
                  </p>
                </div>
                {session ? (
                  <Link
                    href={`/jobs/${job._id || params.id}/apply`}
                    className="block w-full px-8 py-4 bg-white text-cyan-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all transform hover:scale-105 duration-200 shadow-md"
                  >
                    Apply Now ✨
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/auth/select-role"
                      className="block w-full px-8 py-4 bg-white text-cyan-600 rounded-xl font-bold text-lg text-center hover:bg-gray-50 transition-all"
                    >
                      Sign In to Apply
                    </Link>
                    <p className="text-cyan-100 text-sm">
                      Don&apos;t have an account?{" "}
                      <Link href="/auth/select-role" className="underline font-bold hover:text-white">
                        Create one free
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg sticky top-24 animate-in fade-in slide-in-from-right duration-500 delay-100">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="text-2xl">ℹ️</span> Quick Info
              </h3>

              <div className="space-y-5">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50">
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase mb-2">📍 Location</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{job.location || "Remote"}</p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700/50">
                  <p className="text-xs text-green-700 dark:text-green-400 font-bold uppercase mb-2">💼 Job Type</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{job.type || "Full-time"}</p>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700/50">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 font-bold uppercase mb-2">💰 Salary Range</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatSalary(job.salary_min, job.salary_max)}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50">
                  <p className="text-xs text-purple-700 dark:text-purple-400 font-bold uppercase mb-2">👤 Experience</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {job.experience_min || 0} - {job.experience_max || 5} years
                  </p>
                </div>

                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-700/50">
                  <p className="text-xs text-cyan-700 dark:text-cyan-400 font-bold uppercase mb-2">👥 Applicants</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4" /> {job.applicationCount || 0} candidates
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase mb-2">📅 Posted</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {new Date(job.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Apply CTA */}
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-8 rounded-2xl shadow-lg border-2 border-cyan-400 animate-in fade-in slide-in-from-right duration-500 delay-150">
              <div className="text-center space-y-6">
                <div className="text-5xl">🚀</div>
                <div>
                  <h3 className="font-bold text-xl text-white mb-2">Ready to Apply?</h3>
                  <p className="text-cyan-100 text-sm">
                    Take the next step in your career with us. Our AI will help match your profile!
                  </p>
                </div>
                {session ? (
                  <Link
                    href={`/jobs/${job._id || params.id}/apply`}
                    className="block w-full px-6 py-4 bg-white text-cyan-600 rounded-xl font-bold text-center hover:bg-gray-50 transition-all transform hover:scale-105 duration-200 shadow-md"
                  >
                    Apply Now ✨
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/auth/select-role"
                      className="block w-full px-6 py-4 bg-white text-cyan-600 rounded-xl font-bold text-center hover:bg-gray-50 transition-all"
                    >
                      Sign In to Apply
                    </Link>
                    <p className="text-cyan-100 text-xs">
                      Don&apos;t have an account?{" "}
                      <Link href="/auth/select-role" className="underline font-bold hover:text-white">
                        Create one free
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Share Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg animate-in fade-in slide-in-from-right duration-500 delay-200">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-4 text-center">Share this opportunity</p>
              <div className="flex gap-3 justify-center">
                <button className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:scale-110 transition-transform" title="Share on LinkedIn">
                  💼
                </button>
                <button className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:scale-110 transition-transform" title="Share via Email">
                  ✉️
                </button>
                <button className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:scale-110 transition-transform" title="Share on WhatsApp">
                  💬
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Apply Section */}
        <div className="mt-16 pt-12 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="w-6 h-6 text-cyan-600" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">More Opportunities</h2>
          </div>
          {session ? (
            <Link
              href={`/jobs/${job._id || params.id}/apply`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
            >
              Apply Now ✨
            </Link>
          ) : (
            <Link
              href="/auth/select-role"
              className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
            >
              Sign In to Apply
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}