"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Loader2, Plus, Trash2, Upload, Download, Eye, LogOut, Save } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddEducation, setShowAddEducation] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    resume_url: null,
    resume_filename: null,
    resume_uploaded_at: null,
  });

  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);

  const [newExperience, setNewExperience] = useState({
    title: "",
    company_name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_current_job: false,
  });

  const [newEducation, setNewEducation] = useState({
    school_name: "",
    degree: "",
    field_of_study: "",
    graduation_year: new Date().getFullYear(),
    gpa: "",
  });

  // Fetch profile data
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/jobseeker-login");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      
      const data = await res.json();
      setProfile(data.profile);
      setSkills(data.skills || []);
      setExperience(data.experience || []);
      setEducation(data.education || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save all profile data
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      // Save profile basic info
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
        }),
      });

      if (!profileRes.ok) throw new Error("Failed to save profile");

      // Refresh profile data
      await fetchProfile();
      setEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
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

      if (!res.ok) throw new Error("Failed to add skill");
      
      setNewSkill("");
      await fetchProfile();
    } catch (error) {
      console.error("Error adding skill:", error);
      alert("Failed to add skill");
    }
  };

  // Remove skill
  const handleRemoveSkill = async (skillId) => {
    try {
      const res = await fetch(`/api/profile/skills?id=${skillId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove skill");
      
      await fetchProfile();
    } catch (error) {
      console.error("Error removing skill:", error);
      alert("Failed to remove skill");
    }
  };

  // Add experience
  const handleAddExperience = async () => {
    if (!newExperience.title || !newExperience.company_name) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const res = await fetch("/api/profile/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExperience),
      });

      if (!res.ok) throw new Error("Failed to add experience");
      
      setNewExperience({
        title: "",
        company_name: "",
        description: "",
        start_date: "",
        end_date: "",
        is_current_job: false,
      });
      setShowAddExperience(false);
      await fetchProfile();
    } catch (error) {
      console.error("Error adding experience:", error);
      alert("Failed to add experience");
    }
  };

  // Remove experience
  const handleRemoveExperience = async (expId) => {
    try {
      const res = await fetch(`/api/profile/experience?id=${expId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove experience");
      
      await fetchProfile();
    } catch (error) {
      console.error("Error removing experience:", error);
      alert("Failed to remove experience");
    }
  };

  // Add education
  const handleAddEducation = async () => {
    if (!newEducation.school_name || !newEducation.degree) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const res = await fetch("/api/profile/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEducation),
      });

      if (!res.ok) throw new Error("Failed to add education");
      
      setNewEducation({
        school_name: "",
        degree: "",
        field_of_study: "",
        graduation_year: new Date().getFullYear(),
        gpa: "",
      });
      setShowAddEducation(false);
      await fetchProfile();
    } catch (error) {
      console.error("Error adding education:", error);
      alert("Failed to add education");
    }
  };

  // Remove education
  const handleRemoveEducation = async (eduId) => {
    try {
      const res = await fetch(`/api/profile/education?id=${eduId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove education");
      
      await fetchProfile();
    } catch (error) {
      console.error("Error removing education:", error);
      alert("Failed to remove education");
    }
  };

  // Upload resume
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setResumeUploading(true);
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload resume");
      
      await fetchProfile();
    } catch (error) {
      console.error("Error uploading resume:", error);
      alert("Failed to upload resume");
    } finally {
      setResumeUploading(false);
    }
  };

  // Delete resume
  const handleDeleteResume = async () => {
    if (!confirm("Are you sure you want to delete your resume?")) return;

    try {
      const res = await fetch("/api/resume/upload", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete resume");
      
      await fetchProfile();
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "JS";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/seeker/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition">
                <span className="text-2xl">🚀</span>
                <span className="font-bold text-xl text-slate-900 dark:text-white">AI-HRMS</span>
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link href="/seeker/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition">📊 Dashboard</Link>
                <Link href="/seeker/profile" className="text-teal-600 dark:text-teal-400 font-semibold border-b-2 border-teal-600">👤 Profile</Link>
                <Link href="/jobs" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition">💼 Jobs</Link>
                <Link href="/seeker/applications" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition">📋 Applications</Link>
              </div>
            </div>
            <button
              onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section - Show only email and name initially */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {getInitials(profile.full_name)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {profile.full_name || "Your Name"}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
            >
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Edit Profile Section - Show all fields when in edit mode */}
          {editMode && (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}
          
          {/* Show basic info when not in edit mode */}
          {!editMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Location</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.location || "Not provided"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Bio</p>
                <p className="text-slate-900 dark:text-white">{profile.bio || "No bio added yet"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Resume Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
            <span>📄</span>
            <span>Resume</span>
          </h2>

          {profile.resume_url ? (
            <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{profile.resume_filename}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Uploaded on {new Date(profile.resume_uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </a>
                  <button
                    onClick={handleDeleteResume}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              <input
                type="file"
                onChange={handleResumeUpload}
                disabled={resumeUploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 dark:text-slate-300 font-semibold">Click to upload your resume</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">PDF, DOC, DOCX or TXT (Max 5MB)</p>
              {resumeUploading && <Loader2 className="w-6 h-6 animate-spin mx-auto mt-3" />}
            </label>
          )}
        </div>

        {/* Skills Section */}
        {editMode && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
              <span>⭐</span>
              <span>Skills</span>
            </h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center space-x-2 bg-teal-50 dark:bg-teal-900 px-4 py-2 rounded-full"
                >
                  <span className="text-slate-900 dark:text-white font-semibold">{skill.skill_name}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                placeholder="Add a new skill"
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              />
              <button
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50 transition flex items-center space-x-1"
              >
                <Plus className="w-5 h-5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        {/* Experience Section */}
        {editMode && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>💼</span>
                <span>Experience</span>
              </h2>
              <button
                onClick={() => setShowAddExperience(!showAddExperience)}
                className="flex items-center space-x-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span>Add</span>
              </button>
            </div>

            {showAddExperience && (
              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Job Title"
                  value={newExperience.title}
                  onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={newExperience.company_name}
                  onChange={(e) => setNewExperience({ ...newExperience, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
                <textarea
                  placeholder="Description"
                  value={newExperience.description}
                  onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={newExperience.start_date}
                    onChange={(e) => setNewExperience({ ...newExperience, start_date: e.target.value })}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="date"
                    value={newExperience.end_date}
                    onChange={(e) => setNewExperience({ ...newExperience, end_date: e.target.value })}
                    disabled={newExperience.is_current_job}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white disabled:opacity-50"
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newExperience.is_current_job}
                    onChange={(e) => setNewExperience({ ...newExperience, is_current_job: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-slate-900 dark:text-white">Currently working here</span>
                </label>
                <button
                  onClick={handleAddExperience}
                  className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
                >
                  Save Experience
                </button>
              </div>
            )}

            {experience.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No experience added yet</p>
            ) : (
              <div className="space-y-4">
                {experience.map((exp) => (
                  <div key={exp.id} className="border-l-4 border-teal-600 pl-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{exp.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400">{exp.company_name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          {exp.start_date && new Date(exp.start_date).toLocaleDateString()} - {exp.is_current_job ? "Present" : exp.end_date ? new Date(exp.end_date).toLocaleDateString() : ""}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 mt-2">{exp.description}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Education Section */}
        {editMode && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>🎓</span>
                <span>Education</span>
              </h2>
              <button
                onClick={() => setShowAddEducation(!showAddEducation)}
                className="flex items-center space-x-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span>Add</span>
              </button>
            </div>

            {showAddEducation && (
              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="School/University"
                  value={newEducation.school_name}
                  onChange={(e) => setNewEducation({ ...newEducation, school_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Degree"
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Field of Study"
                  value={newEducation.field_of_study}
                  onChange={(e) => setNewEducation({ ...newEducation, field_of_study: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Graduation Year"
                    value={newEducation.graduation_year}
                    onChange={(e) => setNewEducation({ ...newEducation, graduation_year: parseInt(e.target.value) })}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="GPA (optional)"
                    value={newEducation.gpa}
                    onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleAddEducation}
                  className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
                >
                  Save Education
                </button>
              </div>
            )}

            {education.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">No education added yet</p>
            ) : (
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id} className="border-l-4 border-cyan-600 pl-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{edu.school_name}</h3>
                        <p className="text-slate-600 dark:text-slate-400">{edu.degree}</p>
                        {edu.field_of_study && <p className="text-sm text-slate-500 dark:text-slate-500">{edu.field_of_study}</p>}
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Graduated: {edu.graduation_year}</p>
                        {edu.gpa && <p className="text-sm text-slate-500 dark:text-slate-500">GPA: {edu.gpa}</p>}
                      </div>
                      <button
                        onClick={() => handleRemoveEducation(edu.id)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save Button - Only show when in edit mode */}
        {editMode && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50 transition flex items-center justify-center"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save All Changes</>}
            </button>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Ready to Apply?</h3>
          <p className="mb-6 opacity-90">Your profile is all set! Browse job opportunities that match your skills.</p>
          <Link href="/jobs" className="inline-block px-8 py-3 bg-white text-teal-600 rounded-lg font-bold hover:bg-slate-100 transition">
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}