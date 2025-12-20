"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  X,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
} from "lucide-react";

export default function AllCandidatesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    // Check authorization
    if (
      session &&
      session.user.role !== "hr" &&
      session.user.role !== "admin"
    ) {
      router.push("/");
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    filterCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, jobFilter, candidates]);

  const fetchData = async () => {
    try {
      // Fetch all jobs
      const jobsResponse = await fetch("/api/jobs");
      const jobsData = await jobsResponse.json();
      if (jobsResponse.ok) {
        setJobs(jobsData);
      }

      // Fetch all candidates/applications
      const candidatesResponse = await fetch("/api/applications");
      const candidatesResponseData = await candidatesResponse.json();

      // Extract applications array from the response
      const candidatesData = candidatesResponseData.applications || [];

      if (candidatesResponse.ok) {
        // Sort by match score descending and created date
        const sorted = candidatesData.sort(
          (a, b) =>
            ((b.resume_match_score || b.match_score || 0) - (a.resume_match_score || a.match_score || 0)) ||
            new Date(b.created_at) - new Date(a.created_at)
        );
        setCandidates(sorted);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = [...candidates];

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (jobFilter !== "all") {
      filtered = filtered.filter((c) => c.job_id === jobFilter);
    }

    setFilteredCandidates(filtered);
  };

  const updateCandidateStatus = async (candidateId, newStatus) => {
    try {
      const response = await fetch(`/api/applications/${candidateId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Update local state
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, status: newStatus } : c
        )
      );

      toast.success(`Candidate ${newStatus}`);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update candidate status");
    }
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map((c) => c.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate");
      return;
    }

    const actionLabel = action === "shortlisted" ? "shortlist" : "reject";
    const confirmMessage = `Are you sure you want to ${actionLabel} ${selectedCandidates.length} candidate(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedCandidates.map((candidateId) =>
        fetch(`/api/applications/${candidateId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} candidate(s)`);
      } else {
        // Update local state
        setCandidates((prev) =>
          prev.map((c) =>
            selectedCandidates.includes(c.id) ? { ...c, status: action } : c
          )
        );
        toast.success(
          `Successfully ${actionLabel}ed ${selectedCandidates.length} candidate(s)`
        );
        setSelectedCandidates([]);
      }
    } catch (error) {
      console.error("Error updating candidates:", error);
      toast.error("Failed to update selected candidates");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getStatusBadge = (status) => {
    const variants = {
      submitted: { variant: "secondary", label: "Submitted" },
      shortlisted: { variant: "default", label: "Shortlisted" },
      rejected: { variant: "destructive", label: "Rejected" },
      interviewing: { variant: "default", label: "Interviewing" },
      offered: { variant: "default", label: "Offered" },
    };
    return variants[status] || { variant: "secondary", label: status };
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find((j) => j.id === jobId);
    return job ? job.title : "Unknown Job";
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-800 mb-4">
              <span className="text-2xl">👥</span>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Manage Candidates</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4">
              Dashboard - <span className="bg-linear-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">Candidates</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Review and manage candidate applications across all jobs
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          {/* Total Applications Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <span className="text-xl">📝</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Applications</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">{candidates.length}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">Received</p>
          </div>

          {/* Shortlisted Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 mb-3">
                  <span className="text-xl">✨</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Shortlisted</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
                  {candidates.filter((c) => c.status === "shortlisted").length}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">In pipeline</p>
          </div>

          {/* Interviewing Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 mb-3">
                  <span className="text-xl">🎯</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Interviewing</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
                  {candidates.filter((c) => c.status === "interviewing").length}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">In process</p>
          </div>

          {/* Offered Dashboard */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 mb-3">
                  <span className="text-xl">🎉</span>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Offered</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
                  {candidates.filter((c) => c.status === "offered").length}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-3 font-semibold">Hired</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-3 flex-wrap w-full md:w-auto">
                <Select
                  value={jobFilter}
                  onValueChange={setJobFilter}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 flex-wrap w-full md:w-auto">
                {selectedCandidates.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCandidates([])}
                      disabled={bulkActionLoading}
                      className="flex-1 md:flex-none"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear ({selectedCandidates.length})
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleBulkAction("shortlisted")}
                      disabled={bulkActionLoading}
                      className="flex-1 md:flex-none"
                    >
                      {bulkActionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Shortlist
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkAction("rejected")}
                      disabled={bulkActionLoading}
                      className="flex-1 md:flex-none"
                    >
                      {bulkActionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-md animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4 w-1/2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-3 w-2/3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 md:p-16 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
            <div className="text-6xl md:text-7xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No candidates found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-lg mx-auto">
              {statusFilter === "all" && jobFilter === "all"
                ? "No applications received yet"
                : "No candidates match the current filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            {filteredCandidates.length > 1 && (
              <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <Checkbox
                  id="select-all-candidates"
                  checked={
                    selectedCandidates.length === filteredCandidates.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <label
                  htmlFor="select-all-candidates"
                  className="text-sm font-medium cursor-pointer dark:text-slate-300"
                >
                  Select all {filteredCandidates.length} candidates
                </label>
              </div>
            )}

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 gap-4 animate-in fade-in">
              {filteredCandidates.map((candidate, index) => {
                const statusInfo = getStatusBadge(candidate.status);
                return (
                  <div
                    key={candidate.id}
                    onClick={() => {
                      setSelectedCandidate(candidate);
                      setDialogOpen(true);
                    }}
                    className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 group overflow-hidden cursor-pointer transform hover:scale-102 hover:-translate-y-0.5 ${selectedCandidates.includes(candidate.id)
                      ? "ring-2 ring-purple-500 border-purple-500"
                      : ""
                      }`}
                  >
                    {/* Header Gradient Bar */}
                    <div className="h-1 bg-linear-to-r from-purple-400 to-pink-500"></div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={selectedCandidates.includes(candidate.id)}
                            onCheckedChange={() =>
                              toggleCandidateSelection(candidate.id)
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="mt-1"
                          />

                          <div className="flex-1">
                            {/* Name and Status */}
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {candidate.name}
                              </h3>
                              <Badge
                                variant={statusInfo.variant}
                                className="text-xs font-bold"
                              >
                                {statusInfo.label}
                              </Badge>
                            </div>

                            {/* Job Title */}
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 font-medium">
                              Applied for: <span className="text-slate-900 dark:text-slate-100">{getJobTitle(candidate.job_id)}</span>
                            </p>

                            {/* Contact and Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{candidate.email}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                <Phone className="h-3 w-3" />
                                <span>{candidate.phone}</span>
                              </div>
                              {candidate.experience && (
                                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                  <GraduationCap className="h-3 w-3" />
                                  <span>{candidate.experience} yrs</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                <span>Applied {new Date(candidate.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Match Score */}
                        <div className="text-right">
                          <div
                            className={`text-3xl font-bold px-4 py-2 rounded-xl ${getScoreColor(
                              candidate.resume_match_score || 0
                            )}`}
                          >
                            {Math.round(candidate.resume_match_score || 0)}%
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Match</p>
                        </div>
                      </div>

                      {/* Skills */}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex flex-wrap gap-2">
                            {candidate.skills.slice(0, 5).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-700/50"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 5 && (
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-600">
                                +{candidate.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Candidate Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">
                Candidate Details
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Review candidate information and update status
              </DialogDescription>
            </DialogHeader>

            {selectedCandidate && (
              <>
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold dark:text-gray-100">
                        {selectedCandidate.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Applied for: {getJobTitle(selectedCandidate.job_id)}
                      </p>
                    </div>
                    <div
                      className={`text-4xl font-bold px-6 py-3 rounded-lg ${getScoreColor(
                        selectedCandidate.resume_match_score || 0
                      )}`}
                    >
                      {Math.round(selectedCandidate.resume_match_score || 0)}%
                    </div>
                  </div>

                  <Separator className="dark:bg-gray-700" />

                  {/* Contact Info */}
                  <div>
                    <h4 className="font-semibold mb-3 dark:text-gray-100">
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="dark:text-gray-300">
                          {selectedCandidate.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="dark:text-gray-300">
                          {selectedCandidate.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Info */}
                  {(selectedCandidate.experience ||
                    selectedCandidate.current_company ||
                    selectedCandidate.education) && (
                      <>
                        <Separator className="dark:bg-gray-700" />
                        <div>
                          <h4 className="font-semibold mb-3 dark:text-gray-100">
                            Professional Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            {selectedCandidate.experience && (
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="dark:text-gray-300">
                                  {selectedCandidate.experience} years of experience
                                </span>
                              </div>
                            )}
                            {selectedCandidate.current_company && (
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="dark:text-gray-300">
                                  Currently at: {selectedCandidate.current_company}
                                </span>
                              </div>
                            )}
                            {selectedCandidate.education && (
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="dark:text-gray-300">
                                  {selectedCandidate.education}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  {/* Skills */}
                  {selectedCandidate.skills &&
                    selectedCandidate.skills.length > 0 && (
                      <>
                        <Separator className="dark:bg-gray-700" />
                        <div>
                          <h4 className="font-semibold mb-3 dark:text-gray-100">
                            Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCandidate.skills.map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="dark:bg-gray-700 dark:text-gray-300"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                  {/* Cover Letter */}
                  {selectedCandidate.cover_letter && (
                    <>
                      <Separator className="dark:bg-gray-700" />
                      <div>
                        <h4 className="font-semibold mb-3 dark:text-gray-100">
                          Cover Letter
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {selectedCandidate.cover_letter}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Resume */}
                  {selectedCandidate.resume_url && (
                    <>
                      <Separator className="dark:bg-gray-700" />
                      <div>
                        <h4 className="font-semibold mb-3 dark:text-gray-100">
                          Resume
                        </h4>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={selectedCandidate.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Resume
                          </a>
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <Separator className="dark:bg-gray-700" />
                  <div>
                    <h4 className="font-semibold mb-3 dark:text-gray-100">
                      Update Status
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.status !== "shortlisted" && (
                        <Button
                          variant="default"
                          onClick={() =>
                            updateCandidateStatus(
                              selectedCandidate.id,
                              "shortlisted"
                            )
                          }
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Shortlist
                        </Button>
                      )}
                      {selectedCandidate.status !== "interviewing" && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            updateCandidateStatus(
                              selectedCandidate.id,
                              "interviewing"
                            )
                          }
                        >
                          Schedule Interview
                        </Button>
                      )}
                      {selectedCandidate.status !== "rejected" && (
                        <Button
                          variant="destructive"
                          onClick={() =>
                            updateCandidateStatus(
                              selectedCandidate.id,
                              "rejected"
                            )
                          }
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
