"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Loader2, Plus, Trash2, Upload, Download, Eye, LogOut, Save } from "lucide-react";

export default function EnhancedProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [editMode, setEditMode] = useState({
    profile: false,
    skills: false,
    experience: false,
    education: false
  });
  const [newSkill, setNewSkill] = useState("");
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddEducation, setShowAddEducation] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    title: "",
    bio: "",
    profileImage: "",
    resume: "",
    profileCompletion: 0,
    createdAt: "",
    updatedAt: ""
  });

  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);

  const [newExperience, setNewExperience] = useState({
    id: Date.now(),
    title: "",
    company: "",
    description: "",
    startDate: "",
    endDate: "",
    isCurrent: false
  });

  const [newEducation, setNewEducation] = useState({
    id: Date.now(),
    school: "",
    degree: "",
    fieldOfStudy: "",
    graduationYear: new Date().getFullYear(),
    gpa: ""
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
      const res = await fetch("/api/profile/job-seeker-profiles");
      if (!res.ok) throw new Error("Failed to fetch profile");
      
      const data = await res.json();
      setProfile({
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        title: data.title || "",
        bio: data.bio || "",
        profileImage: data.profileImage || "",
        resume: data.resume || "",
        profileCompletion: data.profileCompletion || 0,
        createdAt: data.createdAt || "",
        updatedAt: data.updatedAt || ""
      });
      setSkills(data.skills || []);
      setExperience(data.experience || []);
      setEducation(data.education || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save profile section
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/profile/job-seeker-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          location: profile.location,
          title: profile.title,
          bio: profile.bio,
          profileImage: profile.profileImage,
          resume: profile.resume
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      
      setEditMode({...editMode, profile: false});
      await fetchProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Save skills section
  const handleSaveSkills = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/profile/job-seeker-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });

      if (!res.ok) throw new Error("Failed to save skills");
      
      setEditMode({...editMode, skills: false});
      await fetchProfile();
    } catch (error) {
      console.error("Error saving skills:", error);
      alert("Failed to save skills");
    } finally {
      setSaving(false);
    }
  };

  // Add skill
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    setSkills([...skills, {
      id: Date.now(),
      name: newSkill.trim(),
      level: "Intermediate"
    }]);
    setNewSkill("");
  };

  // Remove skill
  const handleRemoveSkill = (skillId) => {
    setSkills(skills.filter(skill => skill.id !== skillId));
  };

  // Save experience section
  const handleSaveExperience = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/profile/job-seeker-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience }),
      });

      if (!res.ok) throw new Error("Failed to save experience");
      
      setEditMode({...editMode, experience: false});
      setShowAddExperience(false);
      await fetchProfile();
    } catch (error) {
      console.error("Error saving experience:", error);
      alert("Failed to save experience");
    } finally {
      setSaving(false);
    }
  };

  // Add experience
  const handleAddExperience = () => {
    if (!newExperience.title || !newExperience.company) {
      alert("Please fill in required fields");
      return;
    }
    
    setExperience([...experience, {...newExperience, id: Date.now()}]);
    setNewExperience({
      id: Date.now(),
      title: "",
      company: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false
    });
  };

  // Remove experience
  const handleRemoveExperience = (expId) => {
    setExperience(experience.filter(exp => exp.id !== expId));
  };

  // Save education section
  const handleSaveEducation = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/profile/job-seeker-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ education }),
      });

      if (!res.ok) throw new Error("Failed to save education");
      
      setEditMode({...editMode, education: false});
      setShowAddEducation(false);
      await fetchProfile();
    } catch (error) {
      console.error("Error saving education:", error);
      alert("Failed to save education");
    } finally {
      setSaving(false);
    }
  };

  // Add education
  const handleAddEducation = () => {
    if (!newEducation.school || !newEducation.degree) {
      alert("Please fill in required fields");
      return;
    }
    
    setEducation([...education, {...newEducation, id: Date.now()}]);
    setNewEducation({
      id: Date.now(),
      school: "",
      degree: "",
      fieldOfStudy: "",
      graduationYear: new Date().getFullYear(),
      gpa: ""
    });
  };

  // Remove education
  const handleRemoveEducation = (eduId) => {
    setEducation(education.filter(edu => edu.id !== eduId));
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
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
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
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {getInitials(profile.fullName)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {profile.fullName || "Your Name"}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">{profile.email}</p>
                <div className="mt-2">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-teal-600 h-2 rounded-full" 
                      style={{ width: `${profile.profileCompletion}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Profile Completion: {profile.profileCompletion}%
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditMode({...editMode, profile: !editMode.profile})}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
            >
              {editMode.profile ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Edit Profile Section */}
          {editMode.profile ? (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Professional Title</label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
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
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50 transition flex items-center justify-center"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Professional Title</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.title || "Not provided"}</p>
              </div>
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

          {profile.resume ? (
            <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Uploaded Resume</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={profile.resume}
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>⭐</span>
              <span>Skills</span>
            </h2>
            <button
              onClick={() => setEditMode({...editMode, skills: !editMode.skills})}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
            >
              {editMode.skills ? "Cancel" : "Edit"}
            </button>
          </div>

          {editMode.skills ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center space-x-2 bg-teal-50 dark:bg-teal-900 px-4 py-2 rounded-full"
                  >
                    <span className="text-slate-900 dark:text-white font-semibold">{skill.name}</span>
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
              
              <button
                onClick={handleSaveSkills}
                disabled={saving}
                className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50 transition flex items-center justify-center"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Skills</>}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-teal-50 dark:bg-teal-900 px-4 py-2 rounded-full"
                  >
                    <span className="text-slate-900 dark:text-white font-semibold">{skill.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 dark:text-slate-400">No skills added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Experience Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>💼</span>
              <span>Experience</span>
            </h2>
            <div className="space-x-2">
              <button
                onClick={() => setShowAddExperience(!showAddExperience)}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditMode({...editMode, experience: !editMode.experience})}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
              >
                {editMode.experience ? "Cancel" : "Edit"}
              </button>
            </div>
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
                value={newExperience.company}
                onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
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
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="date"
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                  disabled={newExperience.isCurrent}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white disabled:opacity-50"
                />
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newExperience.isCurrent}
                  onChange={(e) => setNewExperience({ ...newExperience, isCurrent: e.target.checked })}
                  className="rounded"
                />
                <span className="text-slate-900 dark:text-white">Currently working here</span>
              </label>
              <button
                onClick={handleAddExperience}
                className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
              >
                Add Experience
              </button>
            </div>
          )}

          {editMode.experience ? (
            <div className="space-y-4">
              {experience.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-4">No experience added yet</p>
              ) : (
                <div className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} className="border-l-4 border-teal-600 pl-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-r">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">{exp.title}</h3>
                          <p className="text-slate-600 dark:text-slate-400">{exp.company}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-500">
                            {exp.startDate && new Date(exp.startDate).toLocaleDateString()} - {exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ""}
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
              <button
                onClick={handleSaveExperience}
                disabled={saving}
                className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50 transition flex items-center justify-center"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Experience</>}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {experience.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-4">No experience added yet</p>
              ) : (
                experience.map((exp) => (
                  <div key={exp.id} className="border-l-4 border-teal-600 pl-4 py-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{exp.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400">{exp.company}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">
                        {exp.startDate && new Date(exp.startDate).toLocaleDateString()} - {exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ""}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 mt-2">{exp.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Education Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>🎓</span>
              <span>Education</span>
            </h2>
            <div className="space-x-2">
              <button
                onClick={() => setShowAddEducation(!showAddEducation)}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditMode({...editMode, education: !editMode.education})}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition"
              >
                {editMode.education ? "Cancel" : "Edit"}
              </button>
            </div>
          </div>

          {showAddEducation && (
            <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg mb-4 space-y-3">
              <input
                type="text"
                placeholder="School/University"
                value={newEducation.school}
                onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
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
                value={newEducation.fieldOfStudy}
                onChange={(e) => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Graduation Year"
                  value={newEducation.graduationYear}
                  onChange={(e) => setNewEducation({ ...newEducation, graduationYear: parseInt(e.target.value) })}
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
                Add Education
              </button>
            </div>
          )}

          {editMode.education ? (
            <div className="space-y-4">
              {education.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-4">No education added yet</p>
              ) : (
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="border-l-4 border-cyan-600 pl-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-r">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">{edu.school}</h3>
                          <p className="text-slate-600 dark:text-slate-400">{edu.degree}</p>
                          {edu.fieldOfStudy && <p className="text-sm text-slate-500 dark:text-slate-500">{edu.fieldOfStudy}</p>}
                          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Graduated: {edu.graduationYear}</p>
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
              <button
                onClick={handleSaveEducation}
                disabled={saving}
                className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold disabled:opacity-50 transition flex items-center justify-center"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Education</>}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {education.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-4">No education added yet</p>
              ) : (
                education.map((edu) => (
                  <div key={edu.id} className="border-l-4 border-cyan-600 pl-4 py-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{edu.school}</h3>
                      <p className="text-slate-600 dark:text-slate-400">{edu.degree}</p>
                      {edu.fieldOfStudy && <p className="text-sm text-slate-500 dark:text-slate-500">{edu.fieldOfStudy}</p>}
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Graduated: {edu.graduationYear}</p>
                      {edu.gpa && <p className="text-sm text-slate-500 dark:text-slate-500">GPA: {edu.gpa}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-linear-to-r from-teal-600 to-cyan-600 rounded-lg shadow-lg p-8 text-center text-white">
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