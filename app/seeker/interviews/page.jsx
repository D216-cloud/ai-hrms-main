"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { Calendar, Clock, MapPin, Briefcase } from "lucide-react";

export default function InterviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <NavBar />
      
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-bottom duration-500 delay-100">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Interviews</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{interviews.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Clock className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {interviews.filter(i => new Date(i.applied_at) > new Date()).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Companies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {[...new Set(interviews.map(i => i.jobs?.company || "Unknown"))].length}
                </p>
              </div>
            </div>
          </div>
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
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        Scheduled
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(interview.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link 
                      href={`/status/${interview.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                    >
                      View Details
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