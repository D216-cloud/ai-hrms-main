"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Loader2, Upload, Save, LogOut } from "lucide-react";

export default function SimpleProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    profileImage: ""
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
        bio: data.bio || "",
        profileImage: data.profileImage || ""
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save profile
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
          bio: profile.bio,
          profileImage: profile.profileImage
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      
      setEditMode(false);
      await fetchProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      // For now, we'll just simulate the upload and use a placeholder URL
      // In a real implementation, you would connect this to your image upload service
      setTimeout(() => {
        const placeholderUrl = URL.createObjectURL(file);
        setProfile({ ...profile, profileImage: placeholderUrl });
        setImageUploading(false);
      }, 1000);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
      setImageUploading(false);
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
              {profile.profileImage ? (
                <img 
                  src={profile.profileImage} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {getInitials(profile.fullName)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {profile.fullName || "Your Name"}
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

          {/* Edit Profile Section */}
          {editMode ? (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
              {/* Profile Image Upload */}
              <div className="flex items-center space-x-4">
                {profile.profileImage ? (
                  <img 
                    src={profile.profileImage} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {getInitials(profile.fullName)}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Profile Image</label>
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-500">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                  {imageUploading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                </div>
              </div>

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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address</label>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Address</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.location || "Not provided"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Bio</p>
                <p className="text-slate-900 dark:text-white">{profile.bio || "No bio added yet"}</p>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-linear-to-r from-teal-600 to-cyan-600 rounded-lg shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Profile Complete!</h3>
          <p className="mb-6 opacity-90">Your profile information has been saved successfully.</p>
          <Link href="/jobs" className="inline-block px-8 py-3 bg-white text-teal-600 rounded-lg font-bold hover:bg-slate-100 transition">
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}