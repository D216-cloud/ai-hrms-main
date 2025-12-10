"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function TestJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/jobs");
      const data = await response.json();
      
      if (response.ok) {
        setJobs(data);
      } else {
        throw new Error(data.error || "Failed to fetch jobs");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Error Loading Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <Button onClick={fetchJobs} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Test Jobs Page</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Testing job fetching and display functionality
        </p>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available Jobs ({jobs.length})</h2>
        <Button onClick={fetchJobs}>Refresh</Button>
      </div>
      
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{job.title}</CardTitle>
                  <Badge 
                    variant={job.status === "active" ? "default" : "secondary"}
                    className={job.status === "active" ? "bg-green-100 text-green-800" : ""}
                  >
                    {job.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{job.location}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {job.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">Experience: {job.experience}</Badge>
                  <Badge variant="outline">{job.salary}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}