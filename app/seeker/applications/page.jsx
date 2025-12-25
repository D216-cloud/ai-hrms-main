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
  Calendar,
  DollarSign,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
  Award,
} from "lucide-react";
import NavBar from "@/components/NavBar";

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/jobseeker-login");
    } else if (status === "authenticated") {
      // Only fetch applications for job seekers
      if (session?.user?.role === "job_seeker") {
        fetchApplications();
      }
    }
  }, [status, session?.user?.role, router]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log("Fetching applications for user:", session?.user?.email);
      const res = await fetch("/api/seeker/applications");

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch applications:", res.status, errorData);

        if (res.status === 401) {
          console.log("Unauthorized - redirecting to login");
          router.push("/auth/jobseeker-login");
          return;
        }

        // Still set empty array on error to show UI
        setApplications([]);
        setFilteredApplications([]);
        return;
      }

      const data = await res.json();
      console.log("Applications fetched for logged-in user:", data);
      console.log("Total applications:", data.applications?.length || 0);

      // Debug: Log each application's job data
      if (data.applications && data.applications.length > 0) {
        console.log("First application details:", {
          id: data.applications[0].id,
          job_id: data.applications[0].job_id,
          hasJobData: !!data.applications[0].jobs,
          jobTitle: data.applications[0].jobs?.title,
          jobCompany: data.applications[0].jobs?.company
        });
      }

      const appsData = data.applications || [];
      setApplications(appsData);
      filterApplications(appsData, searchTerm, selectedStatus);
    } catch (error) {
      console.error("Error fetching applications:", error);
      // Still set empty array on error to show UI
      setApplications([]);
      setFilteredApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = (apps, search, status) => {
    let filtered = apps;

    if (status !== "all") {
      filtered = filtered.filter((app) => app.status === status);
    }

    if (search.trim()) {
      filtered = filtered.filter((app) => {
        const jobTitle = app.jobs?.title || "";
        const company = app.jobs?.company || "";
        return (
          jobTitle.toLowerCase().includes(search.toLowerCase()) ||
          company.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    setFilteredApplications(filtered);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    filterApplications(applications, value, selectedStatus);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    filterApplications(applications, searchTerm, status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "applied":
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "under_review":
      case "reviewing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "shortlisted":
      case "interview_scheduled":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "accepted":
      case "hired":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "shortlisted":
      case "accepted":
        return <CheckCircle2 className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      case "under_review":
        return <Clock className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom duration-500">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📋 My Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all your job applications and their status
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 animate-in fade-in slide-in-from-bottom duration-500 delay-100">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-cyan-600 dark:text-cyan-400">
                  {applications.length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total Applications
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                  {applications.filter((a) =>
                    a.status === "shortlisted" ||
                    a.status === "accepted" ||
                    a.status === "interview_scheduled"
                  ).length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Shortlisted
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                  {applications.filter((a) =>
                    a.status === "under_review" ||
                    a.status === "reviewing" ||
                    a.status === "submitted"
                  ).length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Under Review
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-red-600 dark:text-red-400">
                  {applications.filter((a) => a.status === "rejected").length}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Rejected
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              onClick={() => handleStatusFilter("all")}
              size="sm"
            >
              All ({applications.length})
            </Button>
            <Button
              variant={selectedStatus === "submitted" ? "default" : "outline"}
              onClick={() => handleStatusFilter("submitted")}
              size="sm"
            >
              Submitted
            </Button>
            <Button
              variant={selectedStatus === "applied" ? "default" : "outline"}
              onClick={() => handleStatusFilter("applied")}
              size="sm"
            >
              Applied
            </Button>
            <Button
              variant={selectedStatus === "under_review" ? "default" : "outline"}
              onClick={() => handleStatusFilter("under_review")}
              size="sm"
            >
              Under Review
            </Button>
            <Button
              variant={selectedStatus === "shortlisted" ? "default" : "outline"}
              onClick={() => handleStatusFilter("shortlisted")}
              size="sm"
            >
              Shortlisted
            </Button>
            <Button
              variant={selectedStatus === "rejected" ? "default" : "outline"}
              onClick={() => handleStatusFilter("rejected")}
              size="sm"
            >
              Rejected
            </Button>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Empty State Card */}
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors">
              <CardContent className="pt-16 pb-16 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 mb-6">
                  <Briefcase className="h-12 w-12 text-cyan-600 dark:text-cyan-400" />
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {applications.length === 0
                    ? "🚀 Start Your Job Journey"
                    : "No Results Found"}
                </h3>

                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-2 max-w-md mx-auto">
                  {applications.length === 0
                    ? "You haven't applied to any jobs yet. Explore amazing opportunities and submit your applications."
                    : "No applications match your current search filters. Try adjusting your search or view all applications."}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-500 mb-8 max-w-md mx-auto">
                  {applications.length === 0
                    ? "Browse through our job listings and find the perfect role for you."
                    : "Clear filters or try searching with different keywords."}
                </p>

                {applications.length === 0 ? (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg" className="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg">
                      <Link href="/jobs" className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Explore Jobs
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/seeker/profile" className="flex items-center gap-2">
                        📋 Complete Profile
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => handleStatusFilter("all")} size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      View All Applications
                    </Button>
                    <Button onClick={() => setSearchTerm("")} variant="outline" size="lg">
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Cards */}
            {applications.length === 0 && (
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                      <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Complete Your Profile</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add your experience, education, and skills to improve your job matches.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <Briefcase className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Browse Jobs</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Explore thousands of job listings and apply to positions that match your skills.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                      <Trophy className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Track Progress</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Monitor your applications and see real-time updates on their status.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {filteredApplications.map((application, index) => (
              <Card
                key={application.id}
                className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                          <Briefcase className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {application.jobs?.title || "Job Title"}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {application.jobs?.company || "Company"}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 mt-3 ml-11 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {application.jobs?.location || "Remote"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(application.applied_at)}
                        </div>
                        {application.jobs?.salary_min && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${application.jobs.salary_min}k - ${application.jobs.salary_max}k
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(application.status)} capitalize`}>
                          <span className="mr-1">{getStatusIcon(application.status)}</span>
                          {application.status?.replace("_", " ")}
                        </Badge>
                        {application.match_score && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {application.match_score}%
                          </Badge>
                        )}
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/status/${application.id}`}>
                          View Status
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {applications.length > 0 && (
          <div className="mt-12 bg-linear-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl p-6 md:p-8 border-2 border-cyan-200 dark:border-cyan-800/50 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Keep applying! 🚀
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              More applications increase your chances of getting hired
            </p>
            <Button asChild className="bg-cyan-600 hover:bg-cyan-700">
              <Link href="/jobs">Browse More Jobs</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
