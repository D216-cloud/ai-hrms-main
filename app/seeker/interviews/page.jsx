"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Briefcase } from "lucide-react";

export default function InterviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

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
      case "interviewing":
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

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    const d = new Date(dateString);
    return d.toLocaleString();
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/jobseeker-login");
    } else if (status === "authenticated") {
      fetchInterviews();
    }
  }, [status, router]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seeker/interviews");
      const data = await res.json();
      
      if (res.ok) {
        setInterviews(data.interviews || []);
      } else {
        console.error("Failed to fetch interviews:", data.error);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading your interviews...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom duration-500">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎥 My Interviews
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all your upcoming interviews and their details
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8 animate-in fade-in slide-in-from-bottom duration-500 delay-100">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">{interviews.length}</p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Total Interviews</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">{interviews.filter(i => new Date(i.applied_at) > new Date()).length}</p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Upcoming</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">{[...new Set(interviews.map(i => i.jobs?.company || "Unknown"))].length}</p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Companies</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interviews List */}
        {interviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
            {interviews.map((interview) => (
              <div 
                key={interview.id} 
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {interview.jobs?.title || "Job Title"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                      <span className="font-medium">{interview.jobs?.company || "Company"}</span>
                      {interview.jobs?.location && (
                        <>
                          <span className="mx-2">•</span>
                          <MapPin className="w-4 h-4 mr-1" />
                          {interview.jobs.location}
                        </>
                      )}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <Badge className={getStatusColor(interview.status)}>
                        {interview.status ? interview.status.replace('_', ' ').toUpperCase() : 'SCHEDULED'}
                      </Badge>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(interview.scheduled_at || interview.applied_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/status/${interview.id}`}>
                      <Button className="inline-flex items-center px-4 py-2">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center animate-in fade-in slide-in-from-bottom duration-500 delay-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No interviews scheduled
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any interviews scheduled at the moment.
            </p>
            <Link 
              href="/jobs" 
              className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Browse Jobs
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}