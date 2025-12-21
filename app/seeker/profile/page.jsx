"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Plus, Trash2, Upload, Eye, LogOut, Save, Check,
  X, Mail, Phone, MapPin, User, Award, Briefcase, GraduationCap, FileText, Calendar,
  Camera, Star, Sparkles, Trophy, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CelebrationAnimation } from "@/components/CelebrationAnimation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  const [editSections, setEditSections] = useState({
    personal: false,
    skills: false,
  });

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    profile_picture: null,
    profile_picture_url: null,
    job_title: "",
    company_name: "",
    job_bio: "",
    start_date: "",
    end_date: "",
    is_current_job: false,
    school_name: "",
    degree: "",
    field_of_study: "",
    graduation_year: "",
    gpa: "",
    resume_url: null,
    resume_filename: null,
    resume_uploaded_at: null,
  });

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // Interviews for this seeker (preview in profile)
  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "shortlisted":
      case "interview_scheduled":
      case "interviewing":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatDate = (d) => {
    if (!d) return 'TBD';
    return new Date(d).toLocaleString();
  };

  // Fetch profile data
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/jobseeker-login");
    } else if (status === "authenticated") {
      // Check if user is HR or admin - redirect them to admin dashboard
      if (session?.user?.role === "hr" || session?.user?.role === "admin") {
        console.log("HR/Admin user detected, redirecting to admin dashboard");
        router.push("/admin/dashboard");
        return;
      }

      // Only fetch profile, applications and interviews for job seekers
      if (session?.user?.role === "job_seeker") {
        fetchProfile();
        fetchApplications();
        fetchInterviews();
      }
    }
  }, [status, session?.user?.role, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();

      // Handle null values for form inputs
      const profileData = {
        ...data.profile,
        phone: data.profile.phone || "",
        location: data.profile.location || "",
        bio: data.profile.bio || "",
        job_title: data.profile.job_title || "",
        company_name: data.profile.company_name || "",
        job_bio: data.profile.job_bio || "",
        start_date: data.profile.start_date || "",
        end_date: data.profile.end_date || "",
        is_current_job: data.profile.is_current_job || false,
        school_name: data.profile.school_name || "",
        degree: data.profile.degree || "",
        field_of_study: data.profile.field_of_study || "",
        graduation_year: data.profile.graduation_year || "",
        gpa: data.profile.gpa || "",
        resume_url: data.profile.resume_url || null,
        resume_filename: data.profile.resume_filename || null,
        resume_uploaded_at: data.profile.resume_uploaded_at || null,
      };

      setProfile(profileData);
      setSkills(data.skills || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoadingApplications(true);
      console.log("Profile: Fetching applications for user:", session?.user?.email);
      const res = await fetch("/api/seeker/applications");

      // applications fetch as before...

      if (res.ok) {
        const data = await res.json();
        console.log("Profile: Applications fetched:", data.applications?.length || 0);
        setApplications(data.applications || []);
      } else {
        console.error("Profile: Failed to fetch applications:", res.status);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      setLoadingInterviews(true);
      const res = await fetch("/api/seeker/interviews");
      if (!res.ok) throw new Error("Failed to fetch interviews");
      const data = await res.json();
      const interviewsData = data?.interviews || [];
      console.log("Profile: Interviews fetched:", interviewsData?.length || 0);

      if (Array.isArray(interviewsData)) {
        const sorted = interviewsData.sort((a, b) => {
          const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
          const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
          return bTime - aTime;
        });
        setInterviews(sorted);
      } else {
        setInterviews([]);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Save personal info
  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({
          ...profile,
          profile_picture: file,
          profile_picture_url: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfilePicture = async () => {
    if (!profile.profile_picture_url) {
      alert("Please select a profile picture first");
      return;
    }

    try {
      setSavingSection("picture");
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_picture_url: profile.profile_picture_url,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save profile picture");
      }

      showSuccess("Profile picture updated successfully!");
      if (profileCompleteness < 100) {
        setProfileCompleteness(100);
        setShowCelebration(true);
      }
    } catch (error) {
      console.error("Error saving profile picture:", error);
      alert(error.message || "Failed to save profile picture");
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePersonal = async () => {
    try {
      setSavingSection("personal");
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
          profile_picture_url: profile.profile_picture_url,
          job_title: profile.job_title,
          company_name: profile.company_name,
          job_bio: profile.job_bio,
          start_date: profile.start_date,
          end_date: profile.is_current_job ? null : profile.end_date,
          is_current_job: profile.is_current_job,
          school_name: profile.school_name,
          degree: profile.degree,
          field_of_study: profile.field_of_study,
          graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
          gpa: profile.gpa,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data?.error || "Failed to save profile";
        throw new Error(errorMsg);
      }

      setEditSections({ ...editSections, personal: false });
      showSuccess("Personal information saved successfully!");

      // Check if profile is now 100% complete
      if (profileCompleteness === 100) {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(error.message || "Failed to save profile");
    } finally {
      setSavingSection(null);
    }
  };

  // Add skill
  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_name: newSkill.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error || "Failed to add skill";
        throw new Error(errorMsg);
      }

      setNewSkill("");
      await fetchProfile();
      showSuccess("Skill added successfully!");
    } catch (error) {
      console.error("Error adding skill:", error);
      alert(error.message || "Failed to add skill");
    }
  };

  // Remove skill
  const handleRemoveSkill = async (skillId) => {
    try {
      const res = await fetch(`/api/profile/skills?id=${skillId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data?.error || "Failed to remove skill";
        throw new Error(errorMsg);
      }

      await fetchProfile();
      showSuccess("Skill removed successfully!");
    } catch (error) {
      console.error("Error removing skill:", error);
      alert(error.message || "Failed to remove skill");
    }
  };

  // Save skills section
  const handleSaveSkills = async () => {
    try {
      setSavingSection("skills");
      setEditSections({ ...editSections, skills: false });
      showSuccess("Skills section saved successfully!");
    } catch (error) {
      console.error("Error saving skills:", error);
    } finally {
      setSavingSection(null);
    }
  };

  // Upload resume
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      console.log("Uploading resume file:", file.name, "Size:", file.size, "Type:", file.type);
      setResumeUploading(true);
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Resume upload API response status:", res.status);
      const data = await res.json();
      console.log("Resume upload API response data:", data);

      if (!res.ok) {
        const errorMsg = data?.error || "Failed to upload resume";
        throw new Error(errorMsg);
      }

      // Update profile with resume data
      setProfile(prev => ({
        ...prev,
        resume_url: data.resume_url,
        resume_filename: data.filename,
        resume_uploaded_at: new Date().toISOString(),
      }));

      showSuccess("Resume uploaded successfully!");
    } catch (error) {
      console.error("Error uploading resume:", error);
      alert(error.message || "Failed to upload resume");
    } finally {
      setResumeUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  // Delete resume
  const handleDeleteResume = async () => {
    if (!profile.resume_url) return;

    try {
      const res = await fetch("/api/resume/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: profile.resume_url.split('/').pop().split('.')[0] }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error || "Failed to delete resume";
        throw new Error(errorMsg);
      }

      // Clear resume data from profile
      setProfile(prev => ({
        ...prev,
        resume_url: null,
        resume_filename: null,
        resume_uploaded_at: null,
      }));

      showSuccess("Resume deleted successfully!");
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert(error.message || "Failed to delete resume");
    }
  };

  const toggleEdit = (section) => {
    setEditSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Calculate profile completeness
  const calculateProfileCompleteness = () => {
    const fields = [
      profile.full_name,
      profile.phone,
      profile.location,
      profile.bio,
      profile.job_title,
      profile.company_name,
      profile.school_name,
      profile.degree,
      profile.resume_url,
      skills.length > 0
    ];

    const filledFields = fields.filter(field => field && field !== "");
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const profileCompleteness = calculateProfileCompleteness();

  return (
    <>
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 mb-4 animate-in fade-in zoom-in duration-500 delay-100">
              <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">Your Profile</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
              Manage Your <span className="bg-linear-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">Profile</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 animate-in fade-in slide-in-from-bottom duration-500 delay-300">
              Update your personal information, experience, education, and skills to enhance your job search.
            </p>
            <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom duration-500 delay-400">
              <Link href="/seeker/applications">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all transform hover:shadow-lg hover:-translate-y-0.5">
                  <Briefcase className="w-5 h-5" />
                  View My Applications
                </button>
              </Link>

              <Link href="/seeker/interviews">
                <button className="inline-flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-teal-700 dark:text-teal-300 font-semibold rounded-lg transition-all transform hover:shadow-sm">
                  <Calendar className="w-5 h-5" />
                  <span>Your Interviews</span>
                  {loadingInterviews ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (interviews?.length > 0 && (
                    <span className="ml-2 inline-block px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold">{interviews.length}</span>
                  ))}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Completeness Card - Enhanced */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 opacity-10"></div>

            <div className="relative bg-white dark:bg-slate-800 shadow-sm p-8 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Left Side - Profile Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {profileCompleteness === 100 && (
                      <Star className="w-6 h-6 text-yellow-500 animate-spin" />
                    )}
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Strength</h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {profileCompleteness === 100
                      ? "✨ Excellent! Your profile is 100% complete and fully optimized!"
                      : profileCompleteness >= 80
                        ? "Almost there! Just a few more details to complete your profile."
                        : profileCompleteness >= 50
                          ? "Good progress! Keep filling out your profile information."
                          : "Start building your complete profile to attract more opportunities."}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ease-out ${profileCompleteness === 100
                            ? "bg-linear-to-r from-green-400 via-emerald-500 to-teal-600 animate-pulse"
                            : "bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"
                          }`}
                        style={{ width: `${profileCompleteness}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Progress</span>
                      <span className={`text-lg font-bold ${profileCompleteness === 100
                          ? "text-green-600 dark:text-green-400 animate-bounce"
                          : "text-slate-900 dark:text-white"
                        }`}>
                        {profileCompleteness}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Status Badge */}
                <div className="flex flex-col items-center justify-center gap-4 md:border-l border-slate-200 dark:border-slate-700 md:pl-6">
                  <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${profileCompleteness === 100
                      ? "bg-linear-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/30"
                      : "bg-linear-to-r from-blue-400 to-purple-500 shadow-lg"
                    } animate-in zoom-in duration-500`}>
                    <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                          {profileCompleteness}%
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Complete</div>
                      </div>
                    </div>
                  </div>

                  {profileCompleteness === 100 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
                      <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">100% Complete!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Celebration Animation */}
        <CelebrationAnimation isVisible={showCelebration} />

        {/* Profile Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Section */}
            <div className="bg-linear-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30 overflow-hidden hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
              {/* Header with gradient background */}
              <div className="relative bg-linear-to-r from-blue-600 to-blue-500 dark:from-blue-900 dark:to-blue-800 px-6 py-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                </div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center ring-2 ring-white/30 animate-in fade-in zoom-in duration-500">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">Personal Information</h2>
                      <p className="text-blue-100 text-sm">Complete your profile to attract recruiters</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleEdit("personal")}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 animate-in fade-in zoom-in duration-500 backdrop-blur ${editSections.personal
                        ? "bg-red-500/80 hover:bg-red-600 text-white ring-2 ring-red-300/50"
                        : "bg-white/20 hover:bg-white/30 text-white ring-2 ring-white/30"
                      }`}
                  >
                    {editSections.personal ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    <span className="font-medium">{editSections.personal ? "Cancel" : "Edit Profile"}</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-8">
                {editSections.personal ? (
                  /* Edit Mode - Personal */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="animate-in fade-in slide-in-from-left duration-500 delay-100">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="animate-in fade-in slide-in-from-right duration-500 delay-100">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 cursor-not-allowed transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="animate-in fade-in slide-in-from-left duration-500 delay-200">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="animate-in fade-in slide-in-from-right duration-500 delay-200">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                        <input
                          type="text"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="San Francisco, CA"
                        />
                      </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom duration-500 delay-300">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">About Me</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows="4"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    {/* Experience Fields */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-6 animate-in fade-in slide-in-from-bottom duration-500 delay-400">
                      <div className="flex items-center gap-3 mb-4">
                        <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Work Experience</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="animate-in fade-in slide-in-from-left duration-500 delay-500">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Job Title</label>
                          <input
                            type="text"
                            value={profile.job_title}
                            onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="e.g., Software Engineer"
                          />
                        </div>
                        <div className="animate-in fade-in slide-in-from-right duration-500 delay-500">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company</label>
                          <input
                            type="text"
                            value={profile.company_name}
                            onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="e.g., Google"
                          />
                        </div>
                      </div>
                      <div className="mt-6 animate-in fade-in slide-in-from-bottom duration-500 delay-600">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Job Description</label>
                        <textarea
                          value={profile.job_bio}
                          onChange={(e) => setProfile({ ...profile, job_bio: e.target.value })}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Describe your role and responsibilities..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="animate-in fade-in slide-in-from-left duration-500 delay-700">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={profile.start_date}
                            onChange={(e) => setProfile({ ...profile, start_date: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <div className="animate-in fade-in slide-in-from-right duration-500 delay-700">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                          <input
                            type="date"
                            value={profile.end_date}
                            onChange={(e) => setProfile({ ...profile, end_date: e.target.value })}
                            disabled={profile.is_current_job}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                          />
                        </div>
                      </div>
                      <label className="flex items-center space-x-3 cursor-pointer mt-6 animate-in fade-in slide-in-from-bottom duration-500 delay-800">
                        <input
                          type="checkbox"
                          checked={profile.is_current_job}
                          onChange={(e) => setProfile({ ...profile, is_current_job: e.target.checked })}
                          className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-900 dark:text-white font-medium">I currently work here</span>
                      </label>
                    </div>

                    {/* Education Fields */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-6 animate-in fade-in slide-in-from-bottom duration-500 delay-900">
                      <div className="flex items-center gap-3 mb-4">
                        <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Education</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="animate-in fade-in slide-in-from-left duration-500 delay-1000">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">School/University</label>
                          <input
                            type="text"
                            value={profile.school_name}
                            onChange={(e) => setProfile({ ...profile, school_name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="e.g., Stanford University"
                          />
                        </div>
                        <div className="animate-in fade-in slide-in-from-right duration-500 delay-1000">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Degree</label>
                          <input
                            type="text"
                            value={profile.degree}
                            onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="e.g., Bachelor of Science"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="animate-in fade-in slide-in-from-left duration-500 delay-1100">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Field of Study</label>
                          <input
                            type="text"
                            value={profile.field_of_study}
                            onChange={(e) => setProfile({ ...profile, field_of_study: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="e.g., Computer Science"
                          />
                        </div>
                        <div className="animate-in fade-in slide-in-from-right duration-500 delay-1100">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Graduation Year</label>
                          <input
                            type="number"
                            value={profile.graduation_year}
                            onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="e.g., 2023"
                          />
                        </div>
                      </div>
                      <div className="mt-6 animate-in fade-in slide-in-from-bottom duration-500 delay-1200">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">GPA (Optional)</label>
                        <input
                          type="text"
                          value={profile.gpa}
                          onChange={(e) => setProfile({ ...profile, gpa: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                          placeholder="e.g., 3.8/4.0"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-6 animate-in fade-in slide-in-from-bottom duration-500 delay-1300">
                      <button
                        onClick={handleSavePersonal}
                        disabled={savingSection === "personal"}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {savingSection === "personal" ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /><span>Saving...</span></>
                        ) : (
                          <><Save className="w-5 h-5" /><span>Save Personal Info</span></>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode - Personal */
                  <div className="space-y-6">
                    {/* Info Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Email Card */}
                      <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700 hover:shadow-md transition animate-in fade-in slide-in-from-left duration-500">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Email Address</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Phone Card */}
                      <div className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700 hover:shadow-md transition animate-in fade-in slide-in-from-top duration-500 delay-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Phone Number</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.phone || "Not provided"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Location Card */}
                      <div className="bg-linear-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl p-4 border border-pink-200 dark:border-pink-700 hover:shadow-md transition animate-in fade-in slide-in-from-right duration-500 delay-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Location</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.location || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Full Name - Prominent Display */}
                    {profile.full_name && (
                      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom duration-500 delay-300">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">Name</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile.full_name}</p>
                      </div>
                    )}

                    {/* About/Bio */}
                    {profile.bio && (
                      <div className="bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/10 dark:to-indigo-800/10 rounded-xl p-5 border border-indigo-200 dark:border-indigo-700 animate-in fade-in slide-in-from-bottom duration-500 delay-400">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2">About You</p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                      </div>
                    )}

                    {/* Experience Display */}
                    {(profile.job_title || profile.company_name) && (
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-6 animate-in fade-in slide-in-from-bottom duration-500 delay-400">
                        <div className="flex items-center gap-3 mb-4">
                          <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Work Experience</h3>
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="mt-1 w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <div>
                            <p className="text-gray-900 dark:text-white font-semibold text-lg">
                              {profile.job_title} at {profile.company_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              📅 {profile.start_date ? new Date(profile.start_date).toLocaleDateString() : 'N/A'} -{' '}
                              {profile.is_current_job ? 'Present' : profile.end_date ? new Date(profile.end_date).toLocaleDateString() : 'N/A'}
                            </p>
                            {profile.job_bio && (
                              <p className="text-gray-700 dark:text-gray-300 mt-3">{profile.job_bio}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Education Display */}
                    {(profile.school_name || profile.degree) && (
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-6 animate-in fade-in slide-in-from-bottom duration-500 delay-500">
                        <div className="flex items-center gap-3 mb-4">
                          <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Education</h3>
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="mt-1 w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                          <div>
                            <p className="text-gray-900 dark:text-white font-semibold text-lg">
                              {profile.degree} from {profile.school_name}
                            </p>
                            {profile.graduation_year && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                📅 Graduated: {profile.graduation_year}
                              </p>
                            )}
                            {profile.field_of_study && (
                              <p className="text-gray-700 dark:text-gray-300 mt-3">Field of Study: {profile.field_of_study}</p>
                            )}
                            {profile.gpa && (
                              <p className="text-gray-700 dark:text-gray-300 mt-1">GPA: {profile.gpa}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Resume Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition animate-in fade-in slide-in-from-bottom-4 duration-500 delay-600">
              <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center animate-in fade-in zoom-in duration-500">
                    <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resume</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Upload or manage your resume</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                {profile.resume_url ? (
                  <div className="bg-linear-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 p-6 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-red-600" />
                          {profile.resume_filename}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          📅 Uploaded on {profile.resume_uploaded_at ? new Date(profile.resume_uploaded_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>

                    {/* Resume Preview Section */}
                    {profile.resume_url && profile.resume_url.includes('.pdf') && (
                      <div className="mb-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <iframe
                          src={`${profile.resume_url}#toolbar=0`}
                          className="w-full h-96 border-0"
                          title="Resume Preview"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <a
                        href={profile.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <Eye className="w-5 h-5" />
                        <span>View</span>
                      </a>
                      <a
                        href={profile.resume_url}
                        download={profile.resume_filename}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Download</span>
                      </a>
                      <label className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition cursor-pointer col-span-1 sm:col-span-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                        <Upload className="w-5 h-5" />
                        <span>Replace</span>
                        <input
                          type="file"
                          onChange={handleResumeUpload}
                          disabled={resumeUploading}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                        />
                      </label>
                      <button
                        onClick={handleDeleteResume}
                        className="col-span-1 sm:col-span-2 flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>Delete Resume</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700/50 transition block animate-in fade-in zoom-in duration-500">
                    <input
                      type="file"
                      onChange={handleResumeUpload}
                      disabled={resumeUploading}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-900 dark:text-white font-bold text-xl mb-2">Upload your resume</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Supported formats: PDF, DOC, DOCX, TXT (Max 10MB)</p>
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                      Choose File
                    </button>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-4">💡 Uploading with Cloudinary for better performance</p>
                    {resumeUploading && (
                      <div className="flex items-center justify-center mt-4">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="ml-2 text-blue-600 dark:text-blue-400">Uploading...</span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture Card - Enhanced */}
            <div className="bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-sm border border-blue-200 dark:border-purple-700 overflow-hidden hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-500 delay-700">
              <div className="px-6 py-8">
                <div className="flex flex-col items-center">
                  {/* Profile Picture */}
                  <div className="relative mb-6">
                    <div className="w-32 h-32 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl ring-4 ring-white dark:ring-gray-800 animate-in zoom-in duration-500">
                      {profile.profile_picture_url ? (
                        <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <>{profile.full_name?.charAt(0) || profile.email?.charAt(0) || "U"}</>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg transition transform hover:scale-110 ring-4 ring-white dark:ring-gray-800">
                      <Camera className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Name and Title */}
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white animate-in fade-in slide-in-from-bottom duration-500">
                    {profile.full_name || "Complete Your Profile"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 animate-in fade-in slide-in-from-bottom duration-500 delay-100">
                    Job Seeker
                  </p>

                  {/* Profile Picture Status */}
                  {profile.profile_picture_url && (
                    <div className="mt-3 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
                      <button
                        onClick={handleSaveProfilePicture}
                        disabled={savingSection === "picture"}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold text-sm transition flex items-center gap-2 shadow-md hover:shadow-lg"
                      >
                        {savingSection === "picture" ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                        ) : (
                          <><Check className="w-4 h-4" /><span>Save Picture</span></>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Profile Strength Section */}
                  <div className="mt-8 w-full animate-in fade-in slide-in-from-bottom duration-500 delay-300">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Profile Strength</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg ${profileCompleteness === 100
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-900 dark:text-white"
                          }`}>
                          {profileCompleteness}%
                        </span>
                        {profileCompleteness === 100 && (
                          <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ease-out ${profileCompleteness === 100
                            ? "bg-linear-to-r from-green-400 via-emerald-500 to-teal-600 animate-pulse"
                            : "bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"
                          }`}
                        style={{ width: `${profileCompleteness}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center font-medium">
                      {profileCompleteness === 100
                        ? "🎉 Profile Complete! You're all set!"
                        : profileCompleteness >= 80
                          ? "Almost there! Just a bit more to complete your profile."
                          : profileCompleteness >= 50
                            ? "Good progress! Keep filling out your information."
                            : "Start completing your profile to get discovered."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Interviews Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition animate-in fade-in slide-in-from-right-4 duration-500 delay-700">
              <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center animate-in fade-in zoom-in duration-500">
                    <Calendar className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Interviews</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Interviews scheduled for you</p>
                  </div>
                </div>
                <Link href="/seeker/interviews">
                  <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm">View all</button>
                </Link>
              </div>

              <div className="px-6 py-4">
                {loadingInterviews ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading interviews...</span>
                  </div>
                ) : (interviews && interviews.length > 0) ? (
                  <ul className="space-y-3">
                    {interviews.slice(0,3).map((iv) => (
                      <li key={iv.id} className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{iv.job_title || 'Interview'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(iv.scheduled_at || iv.applied_at)}</p>
                        </div>
                        <div className="text-xs">
                          <Badge className={getStatusColor(iv.status)}>{iv.status ? iv.status.replace('_', ' ').toUpperCase() : 'SCHEDULED'}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No upcoming interviews</p>
                )}
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition animate-in fade-in slide-in-from-right-4 duration-500 delay-800">
              <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center animate-in fade-in zoom-in duration-500">
                    <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Skills</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{skills.length} skills added</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleEdit("skills")}
                  className={`px-6 py-2 rounded-lg font-semibold transition flex items-center space-x-2 animate-in fade-in zoom-in duration-500 ${editSections.skills
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                    }`}
                >
                  {editSections.skills ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              <div className="px-6 py-6">
                {editSections.skills ? (
                  <div className="space-y-6">
                    <div className="flex gap-3 animate-in fade-in slide-in-from-right duration-500">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                        placeholder="Add a skill..."
                      />
                      <button
                        onClick={handleAddSkill}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-right duration-500 delay-100">
                      {skills.map((skill) => (
                        <div key={skill.id} className="inline-flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full text-sm font-medium">
                          {skill.skill_name}
                          <button
                            onClick={() => handleRemoveSkill(skill.id)}
                            className="ml-2 text-yellow-600 dark:text-yellow-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-4 pt-4 animate-in fade-in slide-in-from-right duration-500 delay-200">
                      <button
                        onClick={handleSaveSkills}
                        disabled={savingSection === "skills"}
                        className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {savingSection === "skills" ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /><span>Saving...</span></>
                        ) : (
                          <><Save className="w-5 h-5" /><span>Save Skills</span></>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <span key={skill.id} className="inline-flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full text-sm font-medium animate-in fade-in zoom-in duration-500">
                          {skill.skill_name}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic animate-in fade-in slide-in-from-right duration-500 w-full text-center py-4">No skills added yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Applications Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition animate-in fade-in slide-in-from-right-4 duration-500 delay-900">
              <div className="px-6 py-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center animate-in fade-in zoom-in duration-500">
                      <Briefcase className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{applications.length} applications submitted</p>
                    </div>
                  </div>
                  <Link href="/seeker/applications">
                    <button className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg font-semibold hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition flex items-center space-x-2">
                      <span>View All</span>
                      <Trophy className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>

              <div className="px-6 py-6">
                {loadingApplications ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                  </div>
                ) : applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.slice(0, 5).map((app, idx) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition animate-in fade-in slide-in-from-right duration-500"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {app.jobs?.title || 'Job Title'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {app.jobs?.company || 'Company'} • Applied {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === 'applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              app.status === 'under_review' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                app.status === 'shortlisted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                  app.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                            {app.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {applications.length > 5 && (
                      <Link href="/seeker/applications">
                        <div className="text-center pt-4">
                          <button className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">
                            View all {applications.length} applications →
                          </button>
                        </div>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't applied to any jobs yet</p>
                    <Link href="/jobs">
                      <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition">
                        Browse Jobs
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
