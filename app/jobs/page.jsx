"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import NavBar from "@/components/NavBar";
import { useSaveJob } from "@/hooks/useSaveJob";
import { Grid, List, ArrowUpDown } from "lucide-react";

export default function AllJobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterType, setFilterType] = useState("");
  const [saveMessage, setSaveMessage] = useState(null);
  const [view, setView] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("");

  // Save job hook with localStorage
  const { toggleSaveJob, savedJobs, loading: savingJob } = useSaveJob();

  const formatSalary = (salary) => {
    if (!salary && salary !== 0) return "Competitive";
    if (typeof salary === "string") return salary;
    if (typeof salary === "number") {
      if (salary >= 100000) return `$${(salary / 1000).toFixed(0)}k`;
      return `$${salary.toLocaleString()}`;
    }
    return String(salary);
  };

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

  // Handle save/unsave job with localStorage
  const handleSaveJob = (job, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const result = toggleSaveJob(job);
    
    if (result.success) {
      setSaveMessage(result.message);
    } else {
      setSaveMessage(result.message);
    }

    // Auto-hide message after 2 seconds
    setTimeout(() => {
      setSaveMessage(null);
    }, 2000);
  };

  // Check if a job is saved
  const isJobSaved = (jobId) => {
    return savedJobs.some(job => job._id === jobId || job.id === jobId);
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

  const sortedJobs = useMemo(() => {
    const arr = [...filteredJobs];
    if (sortBy === "newest") {
      arr.sort((a, b) => {
        const ta = new Date(a.posted_at || a.created_at || 0).getTime();
        const tb = new Date(b.posted_at || b.created_at || 0).getTime();
        return tb - ta;
      });
    } else if (sortBy === "salary_desc") {
      arr.sort((a, b) => (b.salary_min || 0) - (a.salary_min || 0));
    } else if (sortBy === "salary_asc") {
      arr.sort((a, b) => (a.salary_min || 0) - (b.salary_min || 0));
    }
    return arr;
  }, [filteredJobs, sortBy]);

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

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"> <ArrowUpDown className="w-4 h-4" /> Sort</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200">
                <option value="">Relevance</option>
                <option value="newest">Newest</option>
                <option value="salary_desc">Salary: High → Low</option>
                <option value="salary_asc">Salary: Low → High</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setView('grid')} className={`p-2 rounded-md ${view === 'grid' ? 'bg-slate-100 dark:bg-gray-800' : ''}`} aria-label="Grid view"><Grid className="w-5 h-5" /></button>
              <button onClick={() => setView('list')} className={`p-2 rounded-md ${view === 'list' ? 'bg-slate-100 dark:bg-gray-800' : ''}`} aria-label="List view"><List className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 animate-in fade-in slide-in-from-left duration-500 delay-100">
            <div className="bg-linear-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-xl sticky top-24">
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
                className="w-full px-4 py-3 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-300 flex items-center justify-center gap-2"
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
                  {loading ? "Loading..." : `${sortedJobs.length} Position${sortedJobs.length !== 1 ? 's' : ''}`}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {filteredJobs.length === 0 ? "No matching jobs found" : "Perfect opportunities for your skill set"}
                </p>
              </div>
              <div className="text-4xl">🚀</div>
            </div>

            {loading ? (
              <div className="grid gap-4">
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
            ) : sortedJobs.length === 0 ? (
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
                {sortedJobs.map((job, index) => (
                  <div
                    key={job._id || index}
                    className={`bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all transform duration-300 group overflow-hidden relative ${view === 'list' ? 'p-4 flex items-center gap-6' : 'p-6 md:p-8 hover:border-teal-300 dark:hover:border-teal-600 hover:-translate-y-1'}`}
                  >
                    {/* Gradient Background */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-teal-100 to-transparent dark:from-teal-900/30 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>

                    <div className="relative">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-slate-100 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-xl font-bold text-teal-600 overflow-hidden">
                            {job.company_logo ? (
                              <img src={job.company_logo} alt={job.company} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span>{(job.company || 'Co').split(' ').map(s=>s.charAt(0)).slice(0,2).join('').toUpperCase()}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                              {job.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-2 truncate">
                              <span className="text-sm">🏢</span>
                              <span className="truncate">{job.company || "Company"}</span>
                            </p>

                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded-full">{job.type || 'Full-time'}</span>
                              <span className="px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded-full">{job.experience || 'Entry'}</span>
                              <span className="px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded-full">{job.location || 'Remote'}</span>
                              {job.posted_at && (
                                <span className="px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded-full">Posted: {new Date(job.posted_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Link href={`/jobs/${job._id}`} className="text-sm text-gray-600 hover:text-teal-600">View</Link>
                          {session ? (
                            <Link href={`/jobs/${job._id}/apply`} className="px-4 py-2 bg-linear-to-r from-teal-500 to-cyan-500 text-white rounded-md text-sm font-semibold">Apply</Link>
                          ) : (
                            <Link href="/auth/select-role" className="px-4 py-2 bg-linear-to-r from-teal-500 to-cyan-500 text-white rounded-md text-sm font-semibold">Sign In to Apply</Link>
                          )}
                        </div>
                      </div>

                      {/* Job Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-linear-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-teal-200 dark:border-teal-700/50">
                          <p className="text-xs text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider mb-1">Location</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{LOCATION_ICONS[job.location] || "📍"}</span>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {job.location || "Remote"}
                            </p>
                          </div>
                        </div>
                        <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50">
                          <p className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Type</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {job.type || "Full-time"}
                          </p>
                        </div>
                        <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700/50">
                          <p className="text-xs text-green-700 dark:text-green-400 font-bold uppercase tracking-wider mb-1">Salary</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {job.salary || "Competitive"}
                          </p>
                        </div>
                        <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50">
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
                          <span className="px-3 py-1.5 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold border border-purple-200 dark:border-purple-700/50">
                            {job.experience} Experience
                          </span>
                        )}
                        {job.skills && job.skills.length > 0 && (
                          <span className="px-3 py-1.5 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-700/50">
                            {job.skills.length} Required Skills
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className={`flex ${view === 'list' ? 'items-center gap-4 ml-auto' : 'gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'}`}>
                        <Link
                          href={session ? `/jobs/${job._id}/apply` : `/jobs/${job._id}`}
                          className={`inline-flex items-center ${view === 'list' ? 'px-4 py-2 bg-linear-to-r from-teal-500 to-cyan-500 text-white rounded-md font-semibold text-sm' : 'flex-1 text-center px-6 py-3 bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-300'}`}
                        >
                          {session ? 'Apply Now' : 'View / Sign in to Apply'}
                        </Link>

                        <button
                          onClick={(e) => handleSaveJob(job, e)}
                          className={`p-3 rounded-lg transition-all ${isJobSaved(job._id) ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          title={isJobSaved(job._id) ? 'Remove from saved' : 'Save job'}
                        >
                          {savingJob ? '✨' : isJobSaved(job._id) ? '❤️' : '🤍'}
                        </button>
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
            <span className="text-2xl">{saveMessage.includes("success") || saveMessage.includes("saved") ? "✅" : "❤️"}</span>
            <span className="font-bold text-gray-900 dark:text-white">{saveMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
