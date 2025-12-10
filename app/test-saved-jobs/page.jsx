"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";

export default function TestSavedJobsPage() {
  const { data: session, status } = useSession();
  const [savedJobs, setSavedJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      testApis();
    }
  }, [status]);

  const testApis = async () => {
    try {
      console.log("\n=== TESTING SAVED JOBS FETCH ===");
      
      // Test 1: Fetch from /api/seeker/saved-jobs
      console.log("\n1️⃣ Fetching from /api/seeker/saved-jobs");
      const res1 = await fetch("/api/seeker/saved-jobs", { 
        cache: "no-store",
        headers: { "Content-Type": "application/json" }
      });
      const data1 = await res1.json();
      console.log("✓ Response status:", res1.status);
      console.log("✓ Saved jobs count:", data1.savedJobs?.length || 0);
      console.log("✓ Full response:", data1);
      setSavedJobs(data1.savedJobs || []);

      // Test 2: Fetch from /api/jobs
      console.log("\n2️⃣ Fetching from /api/jobs");
      const res2 = await fetch("/api/jobs", { cache: "no-store" });
      const data2 = await res2.json();
      console.log("✓ Response status:", res2.status);
      console.log("✓ Total jobs:", data2.length);
      
      // Filter jobs where saved_job = true
      const savedJobsFromJobsApi = data2.filter(job => job.saved_job === true);
      console.log("✓ Jobs with saved_job = true:", savedJobsFromJobsApi.length);
      console.log("✓ Details:", savedJobsFromJobsApi.map(j => ({ id: j.id, title: j.title, saved_job: j.saved_job })));
      
      setAllJobs(data2);
    } catch (error) {
      console.error("❌ Test error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (jobId) => {
    try {
      setSaving(true);
      setSelectedJobId(jobId);
      
      const isSaved = savedJobs.some(j => j.job_id === jobId);
      
      console.log(`\n🔄 Toggling save for job ${jobId} (currently saved: ${isSaved})`);
      
      const res = await fetch("/api/seeker/toggle-save-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          saved: !isSaved,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to toggle save: ${res.status}`);
      }

      const result = await res.json();
      console.log("✓ Toggle result:", result);
      
      // Refresh data
      await testApis();
    } catch (error) {
      console.error("❌ Error toggling save:", error);
    } finally {
      setSaving(false);
      setSelectedJobId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="p-8 text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="p-8 text-center">
          <p className="text-lg">Please login first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔍 Test Saved Jobs</h1>
        <p className="text-gray-600 mb-8">Check your browser console (F12) for detailed logs</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Saved Jobs from API */}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="font-bold text-lg mb-2">📌 /api/seeker/saved-jobs</h2>
            <p className="text-sm text-gray-600 mb-4">Total: <span className="font-bold text-blue-600">{savedJobs.length}</span></p>
            <div className="max-h-96 overflow-auto bg-white border border-blue-100 p-3 rounded text-xs font-mono">
              {savedJobs.length === 0 ? (
                <p className="text-gray-500">No saved jobs found</p>
              ) : (
                <pre>{JSON.stringify(savedJobs.map(j => ({ id: j.job_id, title: j.jobs?.title, company: j.jobs?.company })), null, 2)}</pre>
              )}
            </div>
          </div>

          {/* Jobs API Analysis */}
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <h2 className="font-bold text-lg mb-2">📋 /api/jobs Analysis</h2>
            <div className="space-y-2 mb-4 text-sm">
              <p>Total jobs: <span className="font-bold text-green-600">{allJobs.length}</span></p>
              <p>Saved (saved_job=true): <span className="font-bold text-green-600">{allJobs.filter(j => j.saved_job).length}</span></p>
            </div>
            <div className="max-h-96 overflow-auto bg-white border border-green-100 p-3 rounded text-xs font-mono">
              {allJobs.filter(j => j.saved_job).length === 0 ? (
                <p className="text-gray-500">No saved jobs in jobs API</p>
              ) : (
                <pre>{JSON.stringify(allJobs.filter(j => j.saved_job).map(j => ({ id: j.id, title: j.title, saved_job: j.saved_job })), null, 2)}</pre>
              )}
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg mb-8">
          <h2 className="font-bold text-lg mb-4">🎮 Test Actions</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={testApis}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={saving}
            >
              🔄 Refresh Data
            </button>
            
            {allJobs.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {allJobs.slice(0, 3).map(job => (
                  <button
                    key={job.id}
                    onClick={() => handleToggleSave(job.id)}
                    disabled={saving && selectedJobId === job.id}
                    className={`px-3 py-2 rounded text-sm ${
                      savedJobs.some(j => j.job_id === job.id)
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    } disabled:opacity-50`}
                  >
                    {savedJobs.some(j => j.job_id === job.id) ? "❤️ Unsave" : "🤍 Save"} {job.title?.substring(0, 20)}...
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full Jobs List */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg">
          <h2 className="font-bold text-lg mb-4">📊 All Jobs List</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Saved</th>
                  <th className="px-4 py-2 text-left">In Saved API</th>
                </tr>
              </thead>
              <tbody>
                {allJobs.slice(0, 10).map(job => (
                  <tr key={job.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{job.id?.substring(0, 8)}</td>
                    <td className="px-4 py-2">{job.title}</td>
                    <td className="px-4 py-2">{job.company}</td>
                    <td className="px-4 py-2">
                      {job.saved_job ? (
                        <span className="text-red-600 font-bold">✓ TRUE</span>
                      ) : (
                        <span className="text-gray-400">✗ FALSE</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {savedJobs.some(j => j.job_id === job.id) ? (
                        <span className="text-green-600 font-bold">✓ YES</span>
                      ) : (
                        <span className="text-gray-400">✗ NO</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
