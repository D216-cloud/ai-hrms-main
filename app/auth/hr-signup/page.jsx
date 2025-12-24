"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, Menu, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function HRSignupForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      // First, create the user via the API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'hr', // Explicitly set role as HR
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to create account');
        return;
      }

      // If user was created successfully, now try to sign in
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error('Account created, but failed to sign in. Please try logging in manually.');
        router.push('/auth/hr-login');
      } else {
        toast.success('Account created and signed in successfully! Redirecting to dashboard...');
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="bg-transparent relative z-50 animate-in fade-in slide-in-from-top duration-500">
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
              <Link href="/" className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Home
              </Link>
              <Link href="/jobs" className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Browse Jobs
              </Link>
              <Link href="/auth/select-role" className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
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

            <Link
              href="/auth/select-role"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <span className="text-xl">🔐</span>
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 md:py-20 px-4 sm:px-6 lg:px-8 relative">
        {/* Background Decorations - Hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="hidden lg:block absolute top-20 right-20 w-80 h-80 bg-teal-100 dark:bg-teal-900/20 rounded-full blur-3xl opacity-50 animate-in fade-in zoom-in duration-700 delay-300"></div>
          <div className="hidden lg:block absolute bottom-20 left-20 w-80 h-80 bg-teal-100 dark:bg-teal-900/20 rounded-full blur-3xl opacity-50 animate-in fade-in zoom-in duration-700 delay-500"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 mb-6 sm:mb-8">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
              <span className="text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-300">
                Create HR Account
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              Join the <span className="bg-clip-text text-transparent bg-linear-to-r from-teal-500 to-teal-700 dark:from-teal-400 dark:to-teal-600">HR Team</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Create your account to manage candidates and streamline recruitment
            </p>
          </div>

          {/* Sign Up Card */}
          <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl bg-white dark:bg-gray-900 rounded-2xl animate-in fade-in slide-in-from-bottom duration-500 delay-200">
            <CardContent className="pt-8 pb-6 px-6 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Full Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="h-12 pl-4 pr-4 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Work Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="hr@company.com"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="h-12 pl-4 pr-4 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="h-12 pl-4 pr-4 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className="h-12 pl-4 pr-4 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create HR Account
                      <span>→</span>
                    </span>
                  )}
                </Button>
              </form>
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    Already have an account?
                  </span>
                </div>
              </div>
              
              <Link 
                href="/auth/hr-login"
                className="w-full block text-center px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 font-medium rounded-xl shadow-sm transition-all duration-200"
              >
                Sign In to Dashboard
              </Link>

              {/* Password Requirements */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold mb-2 flex items-center">
                  <span className="text-lg mr-2">📋</span>
                  Password Requirements
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    At least 6 characters long
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Include uppercase and lowercase letters
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Include numbers and special characters
                  </li>
                </ul>
              </div>

              <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure HR portal • For authorized personnel only</span>
              </p>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom duration-500 delay-400">
            <div className="inline-flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <span>Looking for a job?</span>
              <Link href="/jobs" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold inline-flex items-center group">
                Browse Jobs
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HRSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <HRSignupForm />
    </Suspense>
  );
}