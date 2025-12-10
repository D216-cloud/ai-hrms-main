"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);

  // Check if user exists when email is entered
  useEffect(() => {
    const checkUser = async () => {
      if (formData.email && formData.email.includes("@")) {
        setCheckingUser(true);
        try {
          const response = await fetch(`/api/check-user?email=${encodeURIComponent(formData.email)}`);
          const result = await response.json();
          
          if (response.ok && result.exists) {
            setUserExists(true);
          } else {
            setUserExists(false);
          }
        } catch (err) {
          console.error("Error checking user:", err);
        } finally {
          setCheckingUser(false);
        }
      }
    };

    // Debounce the check
    const timer = setTimeout(() => {
      if (formData.email) {
        checkUser();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real application, you would send this data to your backend
      // to add the user to the HR system
      const response = await fetch("/api/admin/add-google-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Account request submitted successfully!");
        // Redirect to sign in page
        router.push("/auth/signin?message=request-submitted");
      } else {
        toast.error(result.error || "Failed to submit request");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-white font-bold text-sm">HR</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                HRMS Pro
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/jobs" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Browse Jobs
              </Link>
              <ModeToggle />
              <Link href="/auth/signin" className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Sign In
              </Link>
              <Link
                href="/jobs"
                className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu */}
            <div className="flex md:hidden items-center space-x-3">
              <ModeToggle />
              <Link
                href="/jobs"
                className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800 mb-6 shadow-sm">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                🔐 HR Portal Access
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
              Request HR Portal Access
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Your Google account needs to be added to our HR system
            </p>
          </div>

          {/* Onboarding Card */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <CardHeader>
              <CardTitle>Request Access</CardTitle>
              <CardDescription>
                Please provide your information so our HR team can grant you access to the portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You signed in with Google, but your account is not yet authorized to access the HR portal. 
                  Please submit this request and an administrator will review it.
                </AlertDescription>
              </Alert>

              {userExists && (
                <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Good news! Your account is already in our system. Please try signing in again.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Work Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="your-google-email@company.com"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="h-12 pl-4 pr-4 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    />
                    {checkingUser && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-900 dark:text-white">
                    Full Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your Full Name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="h-12 pl-4 pr-4 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5" 
                  disabled={loading || userExists}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Request...
                    </span>
                  ) : userExists ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Account Ready - Sign In Now
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit Access Request
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/signin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}