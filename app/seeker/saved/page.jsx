"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
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
  Loader2,
  Briefcase,
  MapPin,
  DollarSign,
  Heart,
  ArrowRight,
  Search,
  Trash2,
} from "lucide-react";
import NavBar from "@/components/NavBar";

export default function SavedJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/jobseeker-login");
    } else if (status === "authenticated") {
      fetchSavedJobs();
    }
  }, [status, router]);

  const fetchSavedJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seeker/saved-jobs");

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch saved jobs:", res.status, errorData);

        if (res.status === 401) {
          router.push("/auth/jobseeker-login");
          return;
        }

        setSavedJobs([]);
        setFilteredJobs([]);
        return;
      }

      const data = await res.json();
      console.log("Saved jobs fetched:", data);

      const jobs = data.savedJobs || [];
      setSavedJobs(jobs);
      filterJobs(jobs, searchTerm);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      setSavedJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, router]);

  const filterJobs = (jobs, search) => {
    let filtered = jobs;

    if (search.trim()) {
      filtered = filtered.filter((job) => {
        const title = job.jobs?.title || "";
        const company = job.jobs?.company || "";
        const location = job.jobs?.location || "";
        return (
          title.toLowerCase().includes(search.toLowerCase()) ||
          company.toLowerCase().includes(search.toLowerCase()) ||
          location.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    setFilteredJobs(filtered);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    filterJobs(savedJobs, value);
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
      const updated = savedJobs.filter((job) => job.job_id !== jobId);
      setSavedJobs(updated);
      filterJobs(updated, searchTerm);
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
      <div className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <NavBar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom duration-500">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ❤️ My Saved Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your saved job postings
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-bottom duration-500 delay-100">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-pink-600 dark:text-pink-400">
                  {savedJobs.length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Saved Jobs
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {savedJobs.length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Active Listings
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                  {savedJobs.filter((job) => job.jobs?.status === "active").length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Hiring Now
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        {savedJobs.length > 0 && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title, company, or location..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Empty State Card */}
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-pink-400 dark:hover:border-pink-600 transition-colors">
              <CardContent className="pt-16 pb-16 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 mb-6">
                  <Heart className="h-12 w-12 text-pink-600 dark:text-pink-400" />
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {savedJobs.length === 0
                    ? "💾 No Saved Jobs Yet"
                    : "No Results Found"}
                </h3>

                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-2 max-w-md mx-auto">
                  {savedJobs.length === 0
                    ? "You haven't saved any jobs yet. Start saving jobs to keep them for later!"
                    : "No jobs match your search. Try adjusting your search terms."}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-500 mb-8 max-w-md mx-auto">
                  {savedJobs.length === 0
                    ? "Visit our job listings and click the heart icon to save jobs you're interested in."
                    : "Clear your search or browse all saved jobs."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg"
                  >
                    <Link href="/jobs" className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Browse Jobs
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  {savedJobs.length > 0 && (
                    <Button
                      onClick={() => setSearchTerm("")}
                      variant="outline"
                      size="lg"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {filteredJobs.map((savedJob, index) => (
              <Card
                key={savedJob.id}
                className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                          <Briefcase className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                            <Link href={`/jobs/${savedJob.job_id}`}>
                              {savedJob.jobs?.title || "Job Title"}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {savedJob.jobs?.company || "Company"}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 mt-3 ml-11 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {savedJob.jobs?.location || "Remote"}
                        </div>
                        {savedJob.jobs?.salary_min && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${savedJob.jobs.salary_min}k - ${savedJob.jobs.salary_max}k
                          </div>
                        )}
                        {savedJob.jobs?.job_type && (
                          <Badge variant="outline">
                            {savedJob.jobs.job_type}
                          </Badge>
                        )}
                      </div>

                      {/* Saved Date */}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 ml-11">
                        Saved on {formatDate(savedJob.saved_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <Badge
                        className={
                          savedJob.jobs?.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }
                      >
                        {savedJob.jobs?.status === "active"
                          ? "✓ Hiring"
                          : "Closed"}
                      </Badge>

                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                        >
                          <Link href={`/jobs/${savedJob.job_id}`}>
                            View Job
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRemoveSavedJob(savedJob.job_id)
                          }
                          disabled={removingId === savedJob.job_id}
                        >
                          {removingId === savedJob.job_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {savedJobs.length > 0 && (
          <div className="mt-12 bg-linear-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-6 md:p-8 border-2 border-pink-200 dark:border-pink-800/50 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ready to apply? 🚀
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Apply to any of your saved jobs and start your new career journey
            </p>
            <Button asChild className="bg-pink-600 hover:bg-pink-700">
              <Link href="/jobs">Browse More Jobs</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
