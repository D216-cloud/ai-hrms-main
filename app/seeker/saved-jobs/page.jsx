"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Briefcase,
  MapPin,
  DollarSign,
  Heart,
  ArrowRight,
  Search,
  Trash2,
  ChevronLeft,
} from "lucide-react";

export default function SavedJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to handle both nested and flat job objects
  const getJobObject = (savedJob) => {
    return savedJob.jobs || savedJob;
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/jobseeker-login");
    } else if (status === "authenticated") {
      fetchSavedJobs();
    }
  }, [status, router]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📥 Fetching saved jobs...");
      
      const res = await fetch("/api/seeker/saved-jobs", {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      
      console.log("✓ Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("❌ Failed to fetch:", res.status, errorData);
        setError("Failed to load saved jobs");

        if (res.status === 401) {
          router.push("/auth/jobseeker-login");
          return;
        }

        setSavedJobs([]);
        setFilteredJobs([]);
        return;
      }

      const data = await res.json();
      console.log("✓ Saved jobs received:", data.savedJobs?.length || 0);
      console.log("📊 Full response:", data);

      const jobs = data.savedJobs || [];
      setSavedJobs(jobs);
      setFilteredJobs(jobs);
    } catch (error) {
      console.error("❌ Error fetching saved jobs:", error);
      setError("An error occurred while loading saved jobs");
      setSavedJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredJobs(savedJobs);
      return;
    }

    const filtered = savedJobs.filter((savedJob) => {
      const job = getJobObject(savedJob);
      const title = job.title || "";
      const company = job.company || "";
      const location = job.location || "";
      const searchLower = value.toLowerCase();
      
      return (
        title.toLowerCase().includes(searchLower) ||
        company.toLowerCase().includes(searchLower) ||
        location.toLowerCase().includes(searchLower)
      );
    });

    setFilteredJobs(filtered);
  };

  const handleRemoveSavedJob = async (jobId) => {
    try {
      setRemovingId(jobId);
      const res = await fetch("/api/seeker/toggle-save-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          saved: false,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to remove saved job");
      }

      // Remove from local state
      const updated = savedJobs.filter((savedJob) => {
        // Handle both data structures
        const id = savedJob.job_id || savedJob.id;
        return id !== jobId;
      });
      setSavedJobs(updated);
      setFilteredJobs(updated);
    } catch (error) {
      console.error("Error removing saved job:", error);
      alert("Failed to remove saved job. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Header with Back Button and Refresh */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSavedJobs}
              disabled={refreshing || loading}
              className="flex items-center gap-2"
            >
              {refreshing || loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  🔄 Refresh
                </>
              )}
            </Button>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ❤️ All Saved Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All {savedJobs.length} job{savedJobs.length !== 1 ? "s" : ""} you have saved
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-bottom duration-500 delay-100">
          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400">
                  {savedJobs.length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total Saved Jobs
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {savedJobs.filter(savedJob => {
                    const job = getJobObject(savedJob);
                    return job.status === "active";
                  }).length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Currently Hiring
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                  {filteredJobs.length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Search Results
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        {savedJobs.length > 0 && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title, company, or location..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <CardContent className="pt-16 pb-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 mb-6">
                <Heart className="h-12 w-12 text-pink-600 dark:text-pink-400" />
              </div>

              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {savedJobs.length === 0 ? "💾 No Saved Jobs Yet" : "No Results Found"}
              </h3>

              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-2 max-w-md mx-auto">
                {savedJobs.length === 0
                  ? "You haven't saved any jobs yet. Start saving jobs to keep them for later!"
                  : "No jobs match your search. Try adjusting your search terms."}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <Button asChild className="bg-pink-600 hover:bg-pink-700 text-white">
                  <Link href="/jobs" className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Browse Jobs
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {filteredJobs.map((savedJob, index) => {
              // Handle both data structures - direct job object or nested jobs object
              const job = savedJob.jobs || savedJob;
              const jobId = savedJob.job_id || savedJob.id;
              
              return (
                <Card
                  key={savedJob.id || jobId}
                  className="hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Job Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg shrink-0">
                            <Briefcase className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors truncate">
                              <Link href={`/jobs/${jobId}`}>
                                {job.title || "Job Title"}
                              </Link>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {job.company || "Company"}
                            </p>
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="flex flex-wrap gap-4 mt-3 ml-11 text-sm text-gray-600 dark:text-gray-400">
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          
                          {job.salary_min && job.salary_max && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 shrink-0" />
                              <span>${job.salary_min}k - ${job.salary_max}k</span>
                            </div>
                          )}
                        </div>

                        {/* Job Type and Date */}
                        <div className="flex flex-wrap gap-2 mt-3 ml-11">
                          {job.job_type && (
                            <Badge variant="outline" className="text-xs">
                              {job.job_type}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Saved on {formatDate(savedJob.saved_at)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <Badge
                          className={
                            job.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }
                        >
                          {job.status === "active" ? "✓ Hiring" : "Closed"}
                        </Badge>

                        <div className="flex gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <Link href={`/jobs/${jobId}`}>
                              View
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveSavedJob(jobId)}
                            disabled={removingId === jobId}
                            className="text-xs"
                          >
                            {removingId === jobId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {savedJobs.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Showing {filteredJobs.length} of {savedJobs.length} saved job{savedJobs.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </main>
    </>
  );
}