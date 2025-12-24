"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function SelectRolePage() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="bg-transparent relative z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300 overflow-hidden animate-in fade-in zoom-in duration-500">
                <Image 
                  src="/aira-logo.svg" 
                  alt="Aira HR Logo" 
                  width={48} 
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white animate-in fade-in slide-in-from-left duration-500">
                Aira HR
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-10 animate-in fade-in slide-in-from-right duration-500">
              <Link href="/" className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Home
              </Link>
              <Link href="/jobs" className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Browse Jobs
              </Link>
              <Link href="/auth/signin" className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Sign In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-3">
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
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
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

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <span className="text-xl">🏠</span>
              <span>Home</span>
            </Link>

            <Link
              href="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <span className="text-xl">💼</span>
              <span>Browse Jobs</span>
            </Link>

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 px-4 mb-2 font-semibold uppercase tracking-wider">
                Select Your Role
              </p>
              <Link
                href="/auth/hr-signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <span className="text-xl">📝</span>
                <span>Create HR Account</span>
              </Link>
              <Link
                href="/auth/hr-login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <span className="text-xl">🔐</span>
                <span>HR Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-20 md:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative Elements - Hidden on Mobile */}
        <div className="hidden lg:block absolute top-40 left-10 w-64 h-80 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl transform -rotate-12 opacity-80 animate-in fade-in slide-in-from-left duration-700 delay-300">
          <div className="p-8">
            <div className="space-y-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-full"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-full"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-full"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex absolute top-60 right-10 w-72 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl transform rotate-6 opacity-80 items-center justify-center animate-in fade-in slide-in-from-right duration-700 delay-300">
          <div className="w-40 h-40 bg-linear-to-br from-teal-400 to-teal-600 rounded-3xl flex items-center justify-center">
            <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 mb-6 sm:mb-8 animate-in fade-in zoom-in duration-500">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
            <span className="text-xs sm:text-sm font-semibold text-cyan-700 dark:text-cyan-300">
              Choose Your Path
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 leading-tight px-4 animate-in fade-in slide-in-from-bottom duration-500 delay-100">
            How would you like to<br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-500 to-cyan-700 dark:from-cyan-400 dark:to-cyan-600">get started?</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed px-4 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
            Select your role to access the right features and dashboard
          </p>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {/* HR Card */}
            <Link
              href="/auth/hr-login"
              onMouseEnter={() => setHoveredCard('hr')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative animate-in fade-in slide-in-from-left duration-500 delay-300"
            >
              <div className={`relative bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl border-2 transition-all duration-300 ${
                hoveredCard === 'hr' 
                  ? 'border-cyan-500 shadow-2xl transform scale-105' 
                  : 'border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl'
              }`}>
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  hoveredCard === 'hr'
                    ? 'bg-linear-to-br from-cyan-400 to-cyan-600 shadow-lg scale-110'
                    : 'bg-cyan-100 dark:bg-cyan-900/30'
                }`}>
                  <svg className={`w-10 h-10 transition-colors duration-300 ${
                    hoveredCard === 'hr' ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  HR Portal
                </h2>

                {/* Description */}
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Access recruitment tools, manage candidates, schedule interviews, and view analytics
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-6 text-left">
                  <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Candidate Management
                  </li>
                  <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI Resume Parsing
                  </li>
                  <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Analytics & Reports
                  </li>
                </ul>

                {/* Button */}
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  hoveredCard === 'hr'
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                }`}>
                  Continue as HR
                  <svg className={`w-5 h-5 transition-transform duration-300 ${
                    hoveredCard === 'hr' ? 'translate-x-1' : ''
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* HR Signup Card */}
            <Link
              href="/auth/hr-signup"
              onMouseEnter={() => setHoveredCard('hr-signup')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative animate-in fade-in slide-in-from-left duration-500 delay-300"
            >
              <div className={`relative bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl border-2 transition-all duration-300 ${
                hoveredCard === 'hr-signup' 
                  ? 'border-teal-500 shadow-2xl transform scale-105' 
                  : 'border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl'
              }`}>
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  hoveredCard === 'hr-signup'
                    ? 'bg-linear-to-br from-teal-400 to-teal-600 shadow-lg scale-110'
                    : 'bg-teal-100 dark:bg-teal-900/30'
                }`}>
                  <svg className={`w-10 h-10 transition-colors duration-300 ${
                    hoveredCard === 'hr-signup' ? 'text-white' : 'text-teal-600 dark:text-teal-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  HR Sign Up
                </h2>

                {/* Description */}
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Create your HR account to access recruitment tools and manage candidates
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-6 text-left">
                  <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Secure Account Creation
                  </li>
                  <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Full Dashboard Access
                  </li>
                  <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI-Powered Tools
                  </li>
                </ul>

                {/* Button */}
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  hoveredCard === 'hr-signup'
                    ? 'bg-teal-500 text-white shadow-lg'
                    : 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                }`}>
                  Create HR Account
                  <svg className={`w-5 h-5 transition-transform duration-300 ${
                    hoveredCard === 'hr-signup' ? 'translate-x-1' : ''
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Employee Card */}
            <Link
              href="/auth/jobseeker-login"
              onMouseEnter={() => setHoveredCard('employee')}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative animate-in fade-in slide-in-from-right duration-500 delay-300"
            >
              <div className={`relative bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl border-2 transition-all duration-300 ${
                hoveredCard === 'employee' 
                  ? 'border-cyan-500 shadow-2xl transform scale-105' 
                  : 'border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl'
              }`}>
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  hoveredCard === 'employee'
                    ? 'bg-linear-to-br from-cyan-400 to-cyan-600 shadow-lg scale-110'
                    : 'bg-cyan-100 dark:bg-cyan-900/30'
                }`}>
                  <svg className={`w-10 h-10 transition-colors duration-300 ${
                    hoveredCard === 'employee' ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Job Seeker
                </h2>

                {/* Description */}
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Browse open positions, apply for jobs, and track your application status
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-6 text-left">
                  <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Browse Job Openings
                  </li>
                  <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Easy Application
                  </li>
                  <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Track Applications
                  </li>
                </ul>

                {/* Button */}
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  hoveredCard === 'employee'
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                }`}>
                  Browse Jobs
                  <svg className={`w-5 h-5 transition-transform duration-300 ${
                    hoveredCard === 'employee' ? 'translate-x-1' : ''
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
