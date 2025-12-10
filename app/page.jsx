"use client";

import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
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
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300 overflow-hidden">
                <Image 
                  src="/aira-logo.svg" 
                  alt="Aira HR Logo" 
                  width={48} 
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Aira HR
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-10">
              <Link href="/" className="text-base font-medium text-gray-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Blog
              </Link>
              <Link
                href="/auth/select-role"
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-xl text-base font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Get started
                <span>→</span>
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

            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <span className="text-xl">💰</span>
              <span>Pricing</span>
            </Link>

            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <span className="text-xl">📝</span>
              <span>Blog</span>
            </Link>

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              <Link
                href="/auth/select-role"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all shadow-lg"
              >
                <span className="text-xl">🚀</span>
                <span>Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-20 md:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative Elements - Hidden on Mobile */}
        <div className="hidden lg:block absolute top-40 left-10 w-64 h-80 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl transform -rotate-12 opacity-80">
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

        <div className="hidden lg:flex absolute top-60 right-10 w-72 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl transform rotate-6 opacity-80 items-center justify-center">
          <div className="w-40 h-40 bg-linear-to-br from-cyan-400 to-cyan-600 rounded-3xl flex items-center justify-center">
            <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 mb-6 sm:mb-8">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
            <span className="text-xs sm:text-sm font-semibold text-cyan-700 dark:text-cyan-300">
              AI-Powered HR Management System
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 leading-tight px-4">
            Smart Hiring. Seamless Management.<br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-500 to-cyan-700 dark:from-cyan-400 dark:to-cyan-600">AI-Driven Results.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Transform your recruitment process with AI-powered resume parsing, intelligent candidate matching, and automated interview scheduling. Everything you need in one platform.
          </p>

          {/* CTA Button */}
          <Link
            href="/auth/select-role"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 gap-2"
          >
            Get started - it's free
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-50/30 to-transparent dark:via-cyan-900/10"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 mb-6">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
              <span className="text-xs sm:text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                Why Choose Us
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight px-4">
              Powerful Features for<br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-500 to-cyan-700 dark:from-cyan-400 dark:to-cyan-600">
                Modern HR
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed px-4">
              Everything you need to manage your workforce effectively with AI-powered tools
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-700 transition-all">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Smart Recruitment
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                AI-powered candidate screening and matching to find the perfect fit for your team.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-700 transition-all">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Performance Analytics
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Real-time insights into employee performance and productivity metrics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-700 transition-all">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Automation
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Automate repetitive tasks and focus on what matters most - your people.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-700 transition-all">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Security & Compliance
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Enterprise-grade security with full compliance and data protection.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-700 transition-all">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                AI Assistant
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Get instant answers to HR questions with our intelligent support AI.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-700 transition-all">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Advanced Analytics
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Comprehensive dashboards with actionable insights and reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-teal-600 dark:text-teal-400 mb-2">500+</div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">Companies Trust Us</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-teal-600 dark:text-teal-400 mb-2">50K+</div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">Employees Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-teal-600 dark:text-teal-400 mb-2">99.9%</div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">Uptime Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-teal-600 dark:text-teal-400 mb-2">24/7</div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-teal-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 mb-6 sm:mb-8">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
            <span className="text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-300">
              Start Your Journey Today
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight px-4">
            Ready to Transform<br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-teal-500 to-teal-700 dark:from-teal-400 dark:to-teal-600">
              Your HR Operations?
            </span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Join thousands of companies already using our platform to streamline their recruitment and HR management.
          </p>
          
          <Link
            href="/auth/select-role"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 gap-2"
          >
            Get started - it's free
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/jobs" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Pricing</Link></li>
                <li><Link href="/security" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Security</Link></li>
                <li><Link href="/roadmap" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Roadmap</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">About</Link></li>
                <li><Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Terms</Link></li>
                <li><Link href="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Cookies</Link></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Twitter</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">LinkedIn</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">GitHub</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Discord</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 HRMS Pro. Built by Sahil Tiwari. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
