"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Users,
  DollarSign,
  Edit,
  Plus,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function ManageJobsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    totalApplicants: 0,
    avgApplicantsPerJob: 0,
  });

  useEffect(() => {
    if (session && session.user.role !== "hr" && session.user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchJobs = async () => {
    try {
      // First fetch jobs
      const jobsRes = await fetch("/api/jobs");
      const jobsData = await jobsRes.json();

      if (jobsRes.ok && Array.isArray(jobsData)) {
        setJobs(jobsData);

        // Fetch all applications for all jobs
        let allApplications = [];
        try {
          for (const job of jobsData) {
            const appsRes = await fetch(`/api/applications?job_id=${job.id}`);
            if (appsRes.ok) {
              const appsData = await appsRes.json();
              if (appsData.applications && Array.isArray(appsData.applications)) {
                allApplications = [...allApplications, ...appsData.applications];
              }
            }
          }
        } catch (appError) {
          console.warn("Error fetching some applications:", appError);
        }

        const activeCount = jobsData.length;
        const totalApps = allApplications.length;
        const totalApplicants = allApplications.length > 0 
          ? new Set(allApplications.map((app) => app.job_seekers?.email || app.email)).size 
          : 0;
        const avgApplicants = activeCount > 0 ? totalApplicants / activeCount : 0;

        setStats({
          activeJobs: activeCount,
          totalApplications: totalApps,
          totalApplicants: totalApplicants,
          avgApplicantsPerJob: Math.round(avgApplicants * 10) / 10,
        });
      } else {
        setJobs([]);
        setStats({
          activeJobs: 0,
          totalApplications: 0,
          totalApplicants: 0,
          avgApplicantsPerJob: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
      setJobs([]);
      setStats({
        activeJobs: 0,
        totalApplications: 0,
        totalApplicants: 0,
        avgApplicantsPerJob: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
        toast.success("Job deleted successfully");
      } else {
        toast.error("Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4">
                💼 Manage <span className="bg-linear-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">Jobs</span>
              </h1>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                Dashboard - View, edit, and manage all job postings
              </p>
            </div>
            <Link
              href="/admin/jobs/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-300 w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              Post New Job
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          {/* Active Jobs Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <span className="text-xl">💼</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Jobs</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.activeJobs}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">Open positions</p>
          </div>

          {/* Total Applications Dashboard */}
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
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">Total received</p>
          </div>

          {/* Total Applicants Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-3">
                  <span className="text-xl">👥</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Unique Applicants</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalApplicants}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">Different candidates</p>
          </div>

          {/* Avg Applicants per Job Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 mb-3">
                  <span className="text-xl">📊</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg per Job</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.avgApplicantsPerJob}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">Applicants per opening</p>
          </div>
        </div>

        {/* Jobs List Section */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">All Job Postings</h2>
            <p className="text-slate-600 dark:text-slate-400">Manage and edit your active job postings</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-md animate-pulse">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 md:p-16 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
              <div className="text-6xl md:text-7xl mb-4">💼</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No jobs posted yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-lg mx-auto">Start posting jobs to attract top talent and build your team</p>
              <Link
                href="/admin/jobs/new"
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105"
              >
                Post Your First Job
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, index) => (
                <div
                  key={job._id || job.id || index}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 group overflow-hidden flex flex-col h-full transform hover:scale-105 hover:-translate-y-1"
                >
                  {/* Header Gradient Bar */}
                  <div className="h-2 bg-linear-to-r from-blue-400 to-cyan-500"></div>

                  <div className="p-6 flex flex-col flex-1">
                    {/* Job Title */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                        {job.title}
                      </h3>
                    </div>

                    {/* Job Description - One Line */}
                    {job.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 italic leading-relaxed">
                        {job.description.split("\n")[0] || "Job description"}
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
                        <span className="text-lg">💼</span>
                        <span className="font-medium">{job.type || "Full-time"}</span>
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
                        {job.department || "General"}
                      </span>
                      <span className="px-3 py-1.5 bg-linear-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-600 shadow-sm">
                        Active 🔴
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/admin/jobs/${job._id || job.id}/edit`}
                        className="flex-1 text-center px-3 py-2.5 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-bold text-xs transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 duration-200 flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(job._id || job.id)}
                        className="flex-1 text-center px-3 py-2.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold text-xs transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        {jobs.length > 0 && (
          <div className="bg-linear-to-r from-blue-500 via-cyan-500 to-blue-600 dark:from-blue-600 dark:via-cyan-600 dark:to-blue-700 rounded-3xl p-8 md:p-12 lg:p-16 text-center shadow-2xl transform hover:scale-105 transition-transform duration-500 animate-in fade-in slide-in-from-bottom-4 delay-300 mt-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Need More Talent?</h2>
            <p className="text-base md:text-lg text-blue-50 mb-8 max-w-2xl mx-auto leading-relaxed">
              Post additional job openings and expand your recruitment pipeline.
            </p>
            <Link
              href="/admin/jobs/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105 duration-300 shadow-lg text-lg"
            >
              Post New Job
              <span>→</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
