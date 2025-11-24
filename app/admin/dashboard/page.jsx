"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Briefcase,
  Users,
  UserCheck,
  TrendingUp,
  Plus,
  ArrowRight,
  Zap,
  Target,
  Calendar,
  Clock,
  Star,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlisted: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch("/api/jobs?status=active"),
        fetch("/api/applications"),
      ]);

      const jobs = await jobsRes.json();
      const apps = await appsRes.json();

      if (jobsRes.ok && appsRes.ok) {
        // Calculate stats
        const shortlistedCount = apps.filter(
          (app) => app.status === "shortlisted"
        ).length;

        const now = new Date();
        const thisMonthCount = apps.filter((app) => {
          const appDate = new Date(app.created_at);
          return (
            appDate.getMonth() === now.getMonth() &&
            appDate.getFullYear() === now.getFullYear()
          );
        }).length;

        setStats({
          activeJobs: jobs.length || 0,
          totalApplications: apps.length || 0,
          shortlisted: shortlistedCount,
          thisMonth: thisMonthCount,
        });

        // Set recent jobs (last 3)
        setRecentJobs(jobs.slice(0, 3));

        // Set recent applications (last 3)
        setRecentApplications(apps.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Active Jobs",
      value: stats.activeJobs.toString(),
      icon: Briefcase,
      description: "Currently open positions",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+2 this week",
    },
    {
      title: "Total Applications",
      value: stats.totalApplications.toString(),
      icon: Users,
      description: "All time applications",
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "+12% from last month",
    },
    {
      title: "Shortlisted",
      value: stats.shortlisted.toString(),
      icon: UserCheck,
      description: "Candidates in pipeline",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "Conversion rate: 24%",
    },
    {
      title: "This Month",
      value: stats.thisMonth.toString(),
      icon: TrendingUp,
      description: "New applications",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "On track for 142",
    },
  ];

  const recentActivity = [
    // Sample data - will be replaced with real data
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "shortlisted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "interviewed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "hired":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session?.user?.name}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here&apos;s what&apos;s happening with your recruitment today.
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
          <Link href="/admin/jobs/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-gray-100 dark:border-gray-800 animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 cursor-pointer animate-in slide-in-from-bottom-4 fade-in relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms`, animationDuration: '600ms' }}
              >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/10 to-transparent rounded-full translate-y-8 -translate-x-8"></div>
                
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2.5 rounded-xl ${stat.bgColor} dark:${stat.bgColor}/30 transition-transform duration-300 hover:scale-110 hover:rotate-6 shadow-sm`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white transition-all duration-300">{stat.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {stat.description}
                  </p>
                  <div className="mt-2 flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
        {/* Recent Jobs */}
        <Card className="border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-blue-600" />
                Recent Jobs
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-200">
                <Link href="/admin/jobs">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3 animate-pulse">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-px w-full" />
                  </div>
                ))}
              </div>
            ) : recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job, index) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transform hover:translate-x-1 animate-in slide-in-from-left-4 fade-in hover:shadow-sm"
                    style={{ animationDelay: `${index * 100}ms`, animationDuration: '400ms' }}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {job.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <Users className="h-3.5 w-3.5 mr-1" />
                        <span>{job.application_count || 0} applicants</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-200 ml-2"
                    >
                      <Link href={`/admin/jobs/${job.id}`}>
                        View
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 animate-bounce">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No jobs yet
                </p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 transform hover:-translate-y-0.5">
                  <Link href="/admin/jobs/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Job
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="mr-2 h-5 w-5 text-green-600" />
                Recent Applications
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-200">
                <Link href="/admin/candidates">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3 animate-pulse">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-px w-full" />
                  </div>
                ))}
              </div>
            ) : recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.map((app, index) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transform hover:translate-x-1 animate-in slide-in-from-right-4 fade-in hover:shadow-sm"
                    style={{ animationDelay: `${index * 100}ms`, animationDuration: '400ms' }}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {app.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <BarChart3 className="h-3.5 w-3.5 mr-1" />
                        <span>Match: {app.resume_match_score || 0}%</span>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(app.status)} transition-all duration-200 hover:scale-110`}>
                      {app.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 animate-bounce">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  No applications yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Getting Started */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions */}
        <Card className="md:col-span-2 border-gray-100 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Zap className="mr-2 h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Button
                asChild
                variant="outline"
                className="h-auto flex-col items-start p-5 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
              >
                <Link href="/admin/jobs/create">
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3 mb-3">
                    <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Post New Job</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Create a job listing
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto flex-col items-start p-5 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
              >
                <Link href="/admin/candidates">
                  <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3 mb-3">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">View Candidates</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Review applications
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto flex-col items-start p-5 border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
              >
                <Link href="/admin/jobs">
                  <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-3 mb-3">
                    <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Manage Jobs</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Edit or close jobs
                  </span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="border-gray-100 dark:border-gray-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardHeader className="border-b border-blue-100 dark:border-blue-900/50">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Target className="mr-2 h-5 w-5 text-blue-600" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              <div className="flex items-start space-x-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Post your first job
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Create a detailed job listing with requirements and responsibilities
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-bold">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Review applications
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    AI-powered screening helps you find the best candidates faster
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-bold">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Invite to tests
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Automated assessments to evaluate candidate skills
                  </p>
                </div>
              </div>
              <Button className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white">
                <Star className="mr-2 h-4 w-4" />
                Start Your First Hiring Process
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}