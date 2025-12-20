"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSaveJob } from "@/hooks/useSaveJob";

export default function JobSeekerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
  });

  // Applications state for dashboard summary
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);

  // Get saved jobs count from localStorage
  const { savedJobs, savedCount, refreshSavedJobs } = useSaveJob();

  const fetchStats = useCallback(async () => {
    try {
      console.log("Fetching stats...");

      // Fetch applications
      const appsRes = await fetch("/api/seeker/applications");
      let appsData = { applications: [] };

      if (appsRes.ok) {
        const responseData = await appsRes.json();
        console.log("Applications response:", responseData);

        // Ensure we handle both array and object responses
        if (Array.isArray(responseData)) {
          appsData = { applications: responseData };
        } else if (responseData && typeof responseData === 'object') {
          appsData = responseData;
        }
      } else {
        console.warn("Failed to fetch applications:", appsRes.status);
      }

      // Ensure applications is always an array
      const applications = Array.isArray(appsData.applications) ? appsData.applications : [];

      // Update stats and also keep applications for dashboard preview
      setStats({
        applications: applications.length,
        interviews: 0,
      });

      setApplications(applications);
      setAppsLoading(false);

      console.log("Stats updated:", {
        applications: applications.length,
        savedFromLocalStorage: savedCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        applications: 0,
        interviews: 0,
      });
    }
  }, [savedCount]);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(Array.isArray(data) ? data : []);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/jobseeker-login");
    } else if (status === "authenticated") {
      // Check if user is HR or admin - redirect them to admin dashboard
      if (session?.user?.role === "hr" || session?.user?.role === "admin") {
        console.log("HR/Admin user detected, redirecting to admin dashboard");
        router.push("/admin/dashboard");
        return;
      }
    }
  }, [status, session?.user?.role, router]);

  // Fetch stats when authenticated as job seeker
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "job_seeker") {
      refreshSavedJobs(); // Load saved jobs from localStorage
      fetchStats();
      fetchJobs();
    }
  }, [status, session?.user?.role, fetchStats, fetchJobs, refreshSavedJobs]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      <main className="bg-linear-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Hero Section */}
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-200 dark:border-teal-800 mb-4">
                <span className="text-2xl">👋</span>
                <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">Welcome back!</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4">
                Hi, <span className="bg-linear-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">{session?.user?.name?.split(' ')[0] || "there"}</span> 👨‍💼
              </h1>
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                Track your job applications, discover personalized opportunities, and advance your career with our AI-powered platform.
              </p>
            </div>
          </div>

          {/* Stats Grid - Optimized Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            {/* Applications Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-3">
                    <span className="text-xl">📝</span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Applications</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.applications}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">+2 this week</p>
            </div>

            {/* Interviews Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-3">
                    <span className="text-xl">🎥</span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Interviews</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{stats.interviews}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">Next: Dec 15</p>
            </div>

            {/* Saved Jobs Card */}
            <Link href="/seeker/saved-jobs" className="block">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer hover:border-red-300 dark:hover:border-red-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 mb-3 group-hover:scale-110 transition-transform">
                      <span className="text-xl">❤️</span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Saved Jobs</p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{savedCount}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold flex items-center gap-1">
                  💾 From localStorage
                </p>
              </div>
            </Link>

            {/* Available Jobs Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 mb-3">
                    <span className="text-xl">💼</span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Available</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{jobs.length}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">New opportunities</p>
            </div>
          </div>

          {/* Featured Jobs Section */}
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">💼 Featured Jobs</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Opportunities personalized for you</p>
              </div>
              <Link href="/jobs" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-300 w-full md:w-auto">
                View All Jobs
                <span className="text-lg">→</span>
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-12 md:p-16 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
                <div className="text-6xl md:text-7xl mb-4">💼</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No jobs available yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-lg mx-auto">Check back soon for amazing opportunities matching your skills and experience</p>
                <Link href="/jobs" className="inline-flex items-center gap-2 px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105">
                  Explore Jobs
                  <span>→</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.slice(0, 6).map((job, index) => (
                  <div
                    key={job._id || index}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-2xl hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-300 group overflow-hidden flex flex-col h-full transform hover:scale-105 hover:-translate-y-1"
                  >
                    {/* Card Header Gradient Bar */}
                    <div className="h-2 bg-linear-to-r from-teal-400 to-cyan-500"></div>

                    <div className="p-6 flex flex-col flex-1">
                      {/* Job Title & Company */}
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                          <span>🏢</span>
                          {job.company || "Company"}
                        </p>
                      </div>

                      {/* Job Description - One Line */}
                      {job.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-3 italic leading-relaxed">
                          {job.description.split("\n")[0] || "Exciting opportunity"}
                        </p>
                      )}

                      {/* Divider */}
                      <div className="h-px bg-linear-to-r from-slate-200 to-transparent dark:from-slate-700 mb-3"></div>

                      {/* Job Info Grid */}
                      <div className="space-y-2.5 mb-4 flex-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-lg">📍</span>
                          <span className="font-medium">{job.location || "Remote"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-lg">💰</span>
                          <span className="font-medium">{job.salary || "Competitive"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-lg">👤</span>
                          <span className="font-medium">{job.experience || "Entry Level"}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1.5 bg-linear-to-r from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 text-teal-700 dark:text-teal-300 rounded-full text-xs font-bold border border-teal-200 dark:border-teal-700/50 shadow-sm">
                          {job.type || "Full-time"}
                        </span>
                        {job.skills && job.skills.length > 0 && (
                          <span className="px-3 py-1.5 bg-linear-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-600 shadow-sm">
                            {job.skills.length} 🔧
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/jobs/${job._id}`}
                        className="w-full text-center px-4 py-3 bg-linear-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 duration-200"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Applications Preview Section */}
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-250">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">📝 Your Recent Applications</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">A quick view of your latest applications</p>
              </div>
              <Link href="/seeker/applications" className="text-sm text-teal-600 dark:text-teal-300 font-semibold">View all →</Link>
            </div>

            {appsLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : applications.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">You have not applied to any jobs yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.slice(0,3).map((app) => (
                  <div key={app.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{app.jobs?.title || app.job_title || 'Job'}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{app.jobs?.company || ''}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Applied {new Date(app.applied_at || app.created_at || app.created_at || app.applied_at || app.created_at || 0).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${app.status === 'shortlisted' ? 'bg-green-100 text-green-800' : app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {app.status || 'submitted'}
                        </div>
                        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">Match: {Math.round(app.resume_match_score || app.match_score || 0)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

            {jobs.length > 6 && (
              <div className="text-center mt-10">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-8 py-3 border-2 border-teal-500 text-teal-600 dark:text-teal-400 rounded-xl font-bold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all transform hover:scale-105 duration-300"
                >
                  See All {jobs.length} Jobs
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>

          {/* Saved Jobs Section */}
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">❤️ Your Saved Jobs</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Jobs you&apos;ve bookmarked for later</p>
              </div>
              {savedJobs.length > 0 && (
                <Link href="/seeker/saved-jobs" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-300 w-full md:w-auto">
                  View All ({savedJobs.length})
                  <span className="text-lg">→</span>
                </Link>
              )}
            </div>

            {savedJobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-12 md:p-16 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
                <div className="text-6xl md:text-7xl mb-4">💾</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No saved jobs yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-lg mx-auto">Save jobs to your favorites for quick access and personalized recommendations</p>
                <Link href="/jobs" className="inline-flex items-center gap-2 px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105">
                  Browse Jobs
                  <span>→</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedJobs.map((savedJob, index) => (
                  <div
                    key={savedJob.id || index}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-2xl hover:border-yellow-400 dark:hover:border-yellow-500 transition-all duration-300 group overflow-hidden flex flex-col h-full transform hover:scale-105 hover:-translate-y-1"
                  >
                    {/* Card Header Gradient Bar */}
                    <div className="h-2 bg-linear-to-r from-yellow-400 to-orange-500"></div>

                    <div className="p-6 flex flex-col flex-1">
                      {/* Job Title & Company */}
                      <div className="mb-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors line-clamp-1 mb-1">
                          {savedJob.jobs?.title || "Job Title"}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                          <span>🏢</span>
                          {savedJob.jobs?.company || "Company"}
                        </p>
                      </div>

                      {/* Job Description - One Line */}
                      {savedJob.jobs?.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-3 italic leading-relaxed">
                          {savedJob.jobs.description.split("\n")[0] || "Exciting opportunity"}
                        </p>
                      )}

                      {/* Divider */}
                      <div className="h-px bg-linear-to-r from-slate-200 to-transparent dark:from-slate-700 mb-3"></div>

                      {/* Job Info Grid */}
                      <div className="space-y-2.5 mb-4 flex-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-lg">📍</span>
                          <span className="font-medium">{savedJob.jobs?.location || "Remote"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-lg">💰</span>
                          <span className="font-medium">
                            {savedJob.jobs?.salary_min ? `$${savedJob.jobs.salary_min}k - $${savedJob.jobs.salary_max}k` : "Competitive"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <span className="text-lg">❤️</span>
                          <span className="font-medium">
                            Saved {new Date(savedJob.saved_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1.5 bg-linear-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-bold border border-yellow-200 dark:border-yellow-700/50 shadow-sm">
                          {savedJob.jobs?.job_type || "Full-time"}
                        </span>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/jobs/${savedJob.job_id}`}
                        className="w-full text-center px-4 py-3 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 duration-200"
                      >
                        View Job ❤️
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {savedJobs.length > 0 && (
              <div className="text-center mt-10">
                <Link
                  href="/seeker/saved-jobs"
                  className="inline-flex items-center gap-2 px-8 py-3 border-2 border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-xl font-bold hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all transform hover:scale-105 duration-300"
                >
                  Manage All Jobs
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="bg-linear-to-r from-teal-500 via-cyan-500 to-teal-600 dark:from-teal-600 dark:via-cyan-600 dark:to-teal-700 rounded-3xl p-8 md:p-12 lg:p-16 text-center shadow-2xl transform hover:scale-105 transition-transform duration-500 animate-in fade-in slide-in-from-bottom-4 delay-300">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Complete Your Profile</h2>
            <p className="text-base md:text-lg text-teal-50 mb-8 max-w-2xl mx-auto leading-relaxed">
              Get personalized job recommendations, increase your visibility to employers, and land your dream job faster.
            </p>
            <Link
              href="/seeker/profile"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 rounded-xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105 duration-300 shadow-lg text-lg"
            >
              Complete Profile Now
              <span>→</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
