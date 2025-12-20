"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Plus,
  TrendingUp,
} from "lucide-react";

export default function HRDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    postedJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    // Re-fetch when session becomes available or changes so newly created jobs appear
    if (session) fetchDashboardStats();
  }, [session]);

  const fetchDashboardStats = async () => {
    try {
      // Build URLs: fetch all jobs (scoped to HR when non-admin) and active jobs
      const jobsAllUrl = session && session.user?.role !== "admin"
        ? `/api/jobs?created_by=${encodeURIComponent(session.user.email)}`
        : `/api/jobs`;

      const jobsActiveUrl = session && session.user?.role !== "admin"
        ? `/api/jobs?status=active&created_by=${encodeURIComponent(session.user.email)}`
        : `/api/jobs?status=active`;

      const [jobsAllRes, jobsActiveRes, appsRes] = await Promise.all([
        fetch(jobsAllUrl),
        fetch(jobsActiveUrl),
        fetch("/api/applications"),
      ]);

      const jobsAll = await jobsAllRes.json();
      const jobsActive = await jobsActiveRes.json();
      const appsData = await appsRes.json();

      // Extract applications array from the response
      const apps = appsData.applications || [];

      if (jobsAllRes.ok && jobsActiveRes.ok && appsRes.ok) {
        const shortlistedCount = apps.filter(
          (app) => app.status === "shortlisted"
        ).length;

        const now = new Date();
        const thisMonthCount = apps.filter((app) => {
          const appDate = new Date(app.created_at);
          return (
            appDate.getMonth() === now.getMonth() &&
            appDate.getFullYear() === now.getFullYear()
          );
        }).length;

        // Sort all jobs by created_at descending for "latest" list
        const sortedJobs = Array.isArray(jobsAll)
          ? jobsAll.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          : [];

        setStats({
          postedJobs: sortedJobs.length || 0,
          activeJobs: Array.isArray(jobsActive) ? jobsActive.length : 0,
          totalApplications: apps.length || 0,
          shortlisted: shortlistedCount,
          thisMonth: thisMonthCount,
        });

        // Show only the latest 3 jobs on dashboard
        setRecentJobs(sortedJobs.slice(0, 3));
        setRecentApplications(apps.slice(0, 6));
      } else {
        console.error("Failed to fetch dashboard data", { jobsAllRes, jobsActiveRes, appsRes });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "shortlisted":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "interviewed":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "hired":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-800 mb-4">
              <span className="text-2xl">👨‍💼</span>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Welcome back!</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4">
              Hi, <span className="bg-linear-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">{session?.user?.name?.split(' ')[0] || "HR Manager"}</span> 🚀
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Dashboard - Manage your recruitment pipeline, track candidates, and build your dream team with AI-powered insights.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          {/* Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <span className="text-xl">💼</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Posted Jobs</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.postedJobs}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">{stats.activeJobs} active</p>
          </div>

          {/* Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 mb-3">
                  <span className="text-xl">📝</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Applications</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalApplications}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">+12% from last month</p>
          </div>

          {/* Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-3">
                  <span className="text-xl">⭐</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Shortlisted</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.shortlisted}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">In pipeline</p>
          </div>

          {/* Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 mb-3">
                  <span className="text-xl">📊</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">This Month</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.thisMonth}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">New applications</p>
          </div>
        </div>

        {/* Recent Jobs Section */}
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">💼 Your Latest Job Postings</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Manage your posted positions (showing latest 3)</p>
            </div>
            <Link href="/admin/jobs/create" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-300 w-full md:w-auto">
              <Plus className="w-4 h-4" />
              Post New Job
              <span className="text-lg">→</span>
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 md:p-16 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
              <div className="text-6xl md:text-7xl mb-4">💼</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No posted jobs yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-lg mx-auto">Start posting jobs to attract top talent and build your team</p>
              <Link href="/admin/jobs/create" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105">
                Create First Job
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentJobs.map((job, index) => (
                <div
                  key={job._id || job.id || index}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group overflow-hidden flex flex-col h-full transform hover:scale-105 hover:-translate-y-1"
                >
                  {/* Dashboard Header Gradient Bar */}
                  <div className="h-2 bg-linear-to-r from-blue-400 to-cyan-500"></div>

                  <div className="p-6 flex flex-col flex-1">
                    {/* Job Title */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                        {job.title}
                      </h3>
                    </div>

                    {/* Job Description - One Line */}
                    {job.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-3 italic leading-relaxed">
                        {job.description.split("\n")[0] || "Exciting job opportunity"}
                      </p>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-linear-to-r from-slate-200 to-transparent dark:from-slate-700 mb-3"></div>

                    {/* Job Info */}
                    <div className="space-y-2.5 mb-4 flex-1 text-sm">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="text-lg">📍</span>
                        <span className="font-medium">{job.location || "Remote"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="text-lg">👥</span>
                        <span className="font-medium">{job.application_count || 0} applicants</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="text-lg">📅</span>
                        <span className="font-medium">{new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1.5 bg-linear-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-700/50 shadow-sm">
                        {job.type || "Full-time"}
                      </span>
                      <span className="px-3 py-1.5 bg-linear-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-600 shadow-sm">
                        Active 🔴
                      </span>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/admin/jobs/${job._id || job.id}`}
                      className="w-full text-center px-4 py-3 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 duration-200"
                    >
                      Manage Job →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications Section */}
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">👥 Recent Applications</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Review and manage candidate applications</p>
            </div>
            {recentApplications.length > 0 && (
              <Link href="/admin/candidates" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-300 w-full md:w-auto">
                View All ({recentApplications.length})
                <span className="text-lg">→</span>
              </Link>
            )}
          </div>

          {recentApplications.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 md:p-16 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
              <div className="text-6xl md:text-7xl mb-4">📮</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No applications yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-lg mx-auto">Post a job to start receiving applications from talented candidates</p>
              <Link href="/admin/jobs/create" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105">
                Post a Job
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((app, index) => (
                <div
                  key={app.id || index}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-md hover:shadow-lg hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 group hover:scale-102 hover:-translate-y-0.5 transform"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      {/* Candidate Name & Job */}
                      <div className="mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {app.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Applied for{" "}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {app.job_title || "Position"}
                          </span>
                        </p>
                      </div>

                      {/* Application Description - One Line */}
                      {app.cover_letter && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 italic mb-2">
                          {app.cover_letter.split("\n")[0] || "No cover letter"}
                        </p>
                      )}

                      {/* Application Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span>{new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>⭐</span>
                          <span>Match: {app.resume_match_score || 0}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>💼</span>
                          <span>{app.email || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold text-center ${getStatusColor(app.status)} shadow-sm`}>
                        {app.status || "Pending"}
                      </span>
                      <Link
                        href={`/admin/candidates/${app.id}`}
                        className="px-4 py-2 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-center"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-linear-to-r from-blue-500 via-cyan-500 to-blue-600 dark:from-blue-600 dark:via-cyan-600 dark:to-blue-700 rounded-3xl p-8 md:p-12 lg:p-16 text-center shadow-2xl transform hover:scale-105 transition-transform duration-500 animate-in fade-in slide-in-from-bottom-4 delay-300">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Ready to Hire?</h2>
          <p className="text-base md:text-lg text-blue-50 mb-8 max-w-2xl mx-auto leading-relaxed">
            Post your next job opening and find the perfect candidate with our AI-powered recruitment platform.
          </p>
          <Link
            href="/admin/jobs/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105 duration-300 shadow-lg text-lg"
          >
            Post New Job
            <span>→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}