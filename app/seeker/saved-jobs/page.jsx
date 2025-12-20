"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSaveJob } from "@/hooks/useSaveJob";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function SavedJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Use the save job hook
  const { savedJobs, handleRemoveJob, refreshSavedJobs } = useSaveJob();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/jobseeker-login");
    }
  }, [status, router]);

  // Load saved jobs on mount
  useEffect(() => {
    refreshSavedJobs();
  }, [refreshSavedJobs]);

  // Filter jobs based on search using useMemo
  const filteredJobs = useMemo(() => {
    if (searchTerm.trim()) {
      return savedJobs.filter((job) => {
        const title = job.title || "";
        const company = job.company || "";
        const location = job.location || "";
        return (
          title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    return savedJobs;
  }, [searchTerm, savedJobs]);

  const handleRemove = (jobId) => {
    const result = handleRemoveJob(jobId);
    if (result.success) {
      refreshSavedJobs();
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

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <>
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom duration-500">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ❤️ My Saved Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Jobs saved in your browser (localStorage)
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
                  {filteredJobs.length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {searchTerm ? "Search Results" : "Total Saved"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                  💾
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Stored Locally
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
            {filteredJobs.map((job, index) => (
              <Card
                key={job._id || job.id || index}
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
                            <Link href={`/jobs/${job._id || job.id}`}>
                              {job.title || "Job Title"}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {job.company || "Company"}
                          </p>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location || "Remote"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salary || "Competitive"}</span>
                        </div>
                        {job.type && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                            {job.type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button asChild variant="default" size="sm">
                        <Link href={`/jobs/${job._id || job.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button
                        onClick={() => handleRemove(job._id || job.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </>
  );
}
