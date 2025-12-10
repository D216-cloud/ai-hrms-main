"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import NavBar from "@/components/NavBar";

export default function AllJobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterType, setFilterType] = useState("");
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [savingJobId, setSavingJobId] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  // Define only 4 cities
  const ALLOWED_LOCATIONS = ["Amdavad", "Bangalore", "Hyderabad", "Mumbai"];
  const LOCATION_ICONS = {
    "Amdavad": "🏙️",
    "Bangalore": "🌟",
    "Hyderabad": "🏢",
    "Mumbai": "🌊"
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs");
        if (response.ok) {
          const data = await response.json();
          const jobsData = Array.isArray(data) ? data : [];
          setJobs(jobsData);
          
          // Load saved status from jobs table
          if (session?.user?.role === "job_seeker") {
            // Mark jobs that have saved_job = true
            const savedJobIds = new Set(
              jobsData
                .filter(job => job.saved_job === true)
                .map(job => job._id || job.id)
            );
            setSavedJobs(savedJobIds);
          }
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [session]);

  const handleSaveJob = async (jobId, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // If user is not authenticated, redirect to login
    if (!session) {
      setSaveMessage("❌ Please login to save jobs");
      setTimeout(() => setSaveMessage(null), 2000);
      return;
    }

    if (session.user.role !== "job_seeker") {
      setSaveMessage("❌ Only job seekers can save jobs");
      setTimeout(() => setSaveMessage(null), 2000);
      return;
    }
    
    setSavingJobId(jobId);
    
    try {
      const isCurrentlySaved = savedJobs.has(jobId);
      
      // Call API to save/unsave
      const res = await fetch("/api/seeker/toggle-save-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          saved: !isCurrentlySaved,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save job");
      }

      // Update local state
      const newSavedJobs = new Set(savedJobs);
      if (isCurrentlySaved) {
        newSavedJobs.delete(jobId);
        setSaveMessage("Removed from saved");
      } else {
        newSavedJobs.add(jobId);
        setSaveMessage("✅ Saved to Supabase!");
      }
      
      setSavedJobs(newSavedJobs);
      
      // Auto-hide message after 2 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error saving job:", error);
      setSaveMessage("❌ Error saving job");
      setTimeout(() => setSaveMessage(null), 2000);
    } finally {
      setTimeout(() => setSavingJobId(null), 300);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      !filterLocation ||
      job.location?.toLowerCase().includes(filterLocation.toLowerCase());

    const matchesType = !filterType || job.type === filterType;

    return matchesSearch && matchesLocation && matchesType;
  });

  // Only show 4 allowed locations
  const locations = ALLOWED_LOCATIONS.filter(loc => 
    jobs.some(j => j.location?.toLowerCase().includes(loc.toLowerCase()))
  );
  const jobTypes = [...new Set(jobs.map((j) => j.type).filter(Boolean))];

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-linear-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800/50 mb-6 shadow-sm">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold bg-linear-to-r from-teal-700 to-cyan-700 dark:from-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
              ✨ Explore Opportunities
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            Find Your <span className="bg-linear-to-r from-teal-500 via-cyan-500 to-teal-600 dark:from-teal-400 dark:via-cyan-400 dark:to-teal-500 bg-clip-text text-transparent">
              Dream Job
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Browse {jobs.length} amazing opportunities and start your career journey with us.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 animate-in fade-in slide-in-from-left duration-500 delay-100">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-xl sticky top-24">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                <span className="text-3xl">🎯</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Smart Filters
                </h3>
              </div>

              {/* Search */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔍</span>
                  <label className="text-sm font-bold text-gray-900 dark:text-white">
                    Search Jobs
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Job title, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 transition-all"
                />
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📍</span>
                  <label className="text-sm font-bold text-gray-900 dark:text-white">
                    Locations
                  </label>
                  <span className="text-xs bg-teal-500 text-white px-2.5 py-0.5 rounded-full font-bold ml-auto">
                    {locations.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                    <input
                      type="radio"
                      name="location"
                      value=""
                      checked={filterLocation === ""}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="w-5 h-5 accent-teal-500 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      All Locations
                    </span>
                  </label>
                  {locations.map((location) => (
                    <label key={location} className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-2 border-transparent hover:border-teal-200 dark:hover:border-teal-700/50">
                      <input
                        type="radio"
                        name="location"
                        value={location}
                        checked={filterLocation === location}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        className="w-5 h-5 accent-teal-500 cursor-pointer"
                      />
                      <span className="text-2xl">{LOCATION_ICONS[location] || "📍"}</span>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {location}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Job Type Filter */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💼</span>
                  <label className="text-sm font-bold text-gray-900 dark:text-white">
                    Job Type
                  </label>
                  <span className="text-xs bg-blue-500 text-white px-2.5 py-0.5 rounded-full font-bold ml-auto">
                    {jobTypes.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <input
                      type="radio"
                      name="type"
                      value=""
                      checked={filterType === ""}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-5 h-5 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      All Types
                    </span>
                  </label>
                  {jobTypes.map((type) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700/50">
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={filterType === type}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-5 h-5 accent-blue-500 cursor-pointer"
                      />
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                        {type.charAt(0)}
                      </span>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterLocation("");
                  setFilterType("");
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-300 flex items-center justify-center gap-2"
              >
                <span>🔄</span> Reset Filters
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-3 animate-in fade-in slide-in-from-right duration-500 delay-100">
            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <span className="text-2xl">💼</span>
                  {loading ? "Loading..." : `${filteredJobs.length} Position${filteredJobs.length !== 1 ? 's' : ''}`}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {filteredJobs.length === 0 ? "No matching jobs found" : "Perfect opportunities for your skill set"}
                </p>
              </div>
              <div className="text-4xl">🚀</div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 animate-pulse"
                  >
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-16 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                <div className="text-6xl mb-4">😔</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your filters or search criteria
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterLocation("");
                    setFilterType("");
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-all"
                >
                  Clear Filters
                  <span>→</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredJobs.map((job, index) => (
                  <div
                    key={job._id || index}
                    className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl hover:border-teal-300 dark:hover:border-teal-600 transition-all transform hover:-translate-y-1 duration-300 group overflow-hidden relative"
                  >
                    {/* Gradient Background */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-teal-100 to-transparent dark:from-teal-900/30 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>

                    <div className="relative">
                      {/* Header with Title and Actions */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1 pr-4">
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-base text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-2">
                            <span className="text-lg">🏢</span>
                            {job.company || "Company"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="text-3xl hover:scale-125 transition-transform duration-200 hover:animate-spin">
                            ⭐
                          </button>
                        </div>
                      </div>

                      {/* Job Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-teal-200 dark:border-teal-700/50">
                          <p className="text-xs text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider mb-1">Location</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{LOCATION_ICONS[job.location] || "📍"}</span>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {job.location || "Remote"}
                            </p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50">
                          <p className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Type</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {job.type || "Full-time"}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700/50">
                          <p className="text-xs text-green-700 dark:text-green-400 font-bold uppercase tracking-wider mb-1">Salary</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {job.salary || "Competitive"}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50">
                          <p className="text-xs text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider mb-1">Experience</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {job.experience || "Entry"}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {job.description && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {job.description}
                          </p>
                        </div>
                      )}

                      {/* Tags and Skills */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-3 py-1.5 bg-linear-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-700 dark:text-teal-300 rounded-full text-xs font-bold border border-teal-200 dark:border-teal-700/50">
                          {job.type || "Full-time"}
                        </span>
                        {job.experience && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold border border-purple-200 dark:border-purple-700/50">
                            {job.experience} Experience
                          </span>
                        )}
                        {job.skills && job.skills.length > 0 && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-700/50">
                            {job.skills.length} Required Skills
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Link
                          href={`/jobs/${job._id}`}
                          className="flex-1 text-center px-6 py-3 bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-300 flex items-center justify-center gap-2"
                        >
                          <span>📖</span> View Details
                        </Link>
                        <button
                          onClick={(e) => handleSaveJob(job._id, e)}
                          className={`px-6 py-3 rounded-xl font-bold text-xl transition-all duration-300 transform ${
                            savedJobs.has(job._id)
                              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 scale-110"
                              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:scale-110"
                          } ${savingJobId === job._id ? "animate-pulse" : ""}`}
                          title={savedJobs.has(job._id) ? "Remove from saved" : "Save job"}
                        >
                          {savingJobId === job._id ? "✨" : savedJobs.has(job._id) ? "❤️" : "🤍"}
                        </button>
                        <Link
                          href={`/jobs/${job._id}`}
                          className="px-6 py-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 hover:scale-110 rounded-xl font-bold text-blue-700 dark:text-blue-300 transition-all text-xl duration-200"
                          title="Share job"
                        >
                          🔗
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Save Message Toast */}
      {saveMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 border-2 border-teal-500 dark:border-teal-400 rounded-2xl px-8 py-4 shadow-2xl flex items-center gap-3">
            <span className="text-2xl animate-bounce">{saveMessage.includes("✅") ? "✅" : "❌"}</span>
            <span className="font-bold text-gray-900 dark:text-white">{saveMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
