"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useSaveJob } from "@/hooks/useSaveJob";

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get saved jobs count from localStorage
  const { savedCount, refreshSavedJobs } = useSaveJob();

  // Refresh saved jobs count when pathname changes
  useEffect(() => {
    refreshSavedJobs();
  }, [pathname, refreshSavedJobs]);

  const isActive = (path) => pathname === path;

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 overflow-hidden">
              <Image 
                src="/aira-logo.svg" 
                alt="Aira HR Logo" 
                width={48} 
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-2xl font-bold bg-linear-to-r from-cyan-600 to-teal-700 dark:from-cyan-400 dark:to-teal-500 bg-clip-text text-transparent hidden sm:inline">
              Aira HR
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {!(session && (session.user.role === "hr" || session.user.role === "admin")) && (
              <Link
                href="/jobs"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive("/jobs")
                    ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400"
                }`}
              >
                💼 All Jobs
              </Link>
            )}

            {session && session.user.role === "job_seeker" && (
              <>
                <Link
                  href="/seeker/dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/seeker/dashboard")
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400"
                  }`}
                >
                  📊 Dashboard
                </Link>

                <Link
                  href="/seeker/saved-jobs"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isActive("/seeker/saved-jobs")
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                  }`}
                >
                  <span className="text-lg">❤️</span>
                  Saved ({savedCount})
                </Link>

                <Link
                  href="/seeker/messages"
                  className={`ml-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive("/seeker/messages") ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-teal-600 text-white hover:bg-teal-700"}`}
                >
                  💬 Messages
                </Link>

                <Link
                  href="/seeker/profile"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/seeker/profile")
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400"
                  }`}
                >
                  👤 Profile
                </Link>
              </>
            )}

            {session && (session.user.role === "hr" || session.user.role === "admin") && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/admin/dashboard")
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400"
                  }`}
                >
                  📊 Dashboard
                </Link>

                <Link
                  href="/admin/profile"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/admin/profile")
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400"
                  }`}
                >
                  👤 Profile
                </Link>
                
                <Link
                  href="/admin/candidates"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/admin/candidates")
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400"
                  }`}
                >
                  👥 Candidate
                </Link>

                <Link
                  href="/admin/jobs"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive("/admin/jobs")
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400"
                  }`}
                >
                  💼 Manage Jobs
                </Link>
              </>
            )}

            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="ml-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth/select-role"
                className="ml-4 px-6 py-2.5 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button & Actions */}
          <div className="flex md:hidden items-center space-x-3">
            {session && session.user.role === "job_seeker" && (
              <>
                <Link
                  href="/seeker/saved-jobs"
                  className="relative text-lg hover:scale-110 transition-transform"
                  title="Saved Jobs"
                >
                  ❤️
                  {savedCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {savedCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/seeker/messages"
                  className="relative text-lg ml-3 hover:scale-110 transition-transform"
                  title="Messages"
                >
                  💬
                </Link>
              </>
            )}
            
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile Sidebar Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div
          className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                <Image 
                  src="/aira-logo.svg" 
                  alt="Aira HR Logo" 
                  width={40} 
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-cyan-600 to-teal-700 dark:from-cyan-400 dark:to-teal-500 bg-clip-text text-transparent">
                Aira HR
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          {session && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-linear-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                  {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {session.user.role === 'job_seeker' ? 'Job Seeker' : 'HR Manager'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* All Jobs - Always visible */}
            {!(session && (session.user.role === "hr" || session.user.role === "admin")) && (
              <Link
                href="/jobs"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive("/jobs")
                    ? "text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-xl">💼</span>
                <span>All Jobs</span>
              </Link>
            )}

            {/* Job Seeker Menu */}
            {session && session.user.role === "job_seeker" && (
              <>
                <Link
                  href="/seeker/dashboard"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/seeker/dashboard")
                      ? "text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">📊</span>
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/seeker/saved-jobs"
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/seeker/saved-jobs")
                      ? "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">❤️</span>
                    <span>Saved Jobs</span>
                  </div>
                  {savedCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                      {savedCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/seeker/messages"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/seeker/messages")
                      ? "text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">💬</span>
                  <span>Messages</span>
                </Link>

                <Link
                  href="/seeker/profile"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/seeker/profile")
                      ? "text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">👤</span>
                  <span>Profile</span>
                </Link>
              </>
            )}

            {/* HR Menu */}
            {session && (session.user.role === "hr" || session.user.role === "admin") && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/admin/dashboard")
                      ? "text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">📊</span>
                  <span>Dashboard</span>
                </Link>
                
                <Link
                  href="/admin/candidates"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/admin/candidates")
                      ? "text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">�</span>
                  <span>Candidates</span>
                </Link>

                <Link
                  href="/admin/jobs"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/admin/jobs")
                      ? "text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">💼</span>
                  <span>Manage Jobs</span>
                </Link>
              </>
            )}

            {/* Sign In/Out */}
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              {session ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <span className="text-xl">🚪</span>
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/auth/select-role"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                >
                  <span className="text-xl">🔐</span>
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}