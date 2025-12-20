"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  ArrowLeft,
  Save,
  Eye,
  MapPin,
  Briefcase,
  DollarSign,
  Loader2,
} from "lucide-react";

export default function CreateJobPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    experienceMin: "",
    experienceMax: "",
    salaryMin: "",
    salaryMax: "",
    skills: "",
    description: "",
  });

  useEffect(() => {
    if (session && session.user.role !== "hr" && session.user.role !== "admin") {
      router.push("/");
      return;
    }
  }, [session, router]);

  useEffect(() => {
    // Check AI health
    const checkAI = async () => {
      try {
        const res = await fetch("/api/openai/health", { cache: "no-store" });
        if (res.ok) {
          setAiEnabled(true);
        } else {
          setAiEnabled(false);
        }
      } catch (err) {
        setAiEnabled(false);
      }
    };
    checkAI();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const skillsList = formData.skills
    ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const formatSalary = (min, max) => {
    if (!min && !max) return "Competitive";
    if (min && max) return `$${parseFloat(min).toLocaleString()} - $${parseFloat(max).toLocaleString()}`;
    if (min) return `From $${parseFloat(min).toLocaleString()}`;
    return `Up to $${parseFloat(max).toLocaleString()}`;
  };

  const handleGenerateJD = async () => {
    const errors = {};
    if (!formData.title) errors.title = "Title is required";
    if (!formData.location) errors.location = "Location is required";
    if (!formData.experienceMin) errors.experienceMin = "Min experience required";
    if (!formData.experienceMax) errors.experienceMax = "Max experience required";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix required fields");
      return;
    }

    setGenerating(true);
    try {
      // Ensure we pass `skills` consistently as either string or array; we send as string from the form and server will coerce
      const response = await fetch("/api/jobs/generate-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          experienceMin: parseInt(formData.experienceMin),
          experienceMax: parseInt(formData.experienceMax),
          skills: formData.skills,
        }),
      });

      const data = await response.json();
      if (response.ok && data.description) {
        setFormData((prev) => ({ ...prev, description: data.description }));
        toast.success("Job description generated! Edit as needed.");
      } else {
        // Show specific error messages for common statuses
        if (response.status === 401 || response.status === 403) {
          toast.error(data.error || "Unauthorized: you don't have permission to generate job descriptions.");
        } else if (response.status === 400) {
          toast.error(data.error || "Missing required fields for description generation");
        } else if (response.status === 503) {
          toast.error(data.error || "AI service temporarily unavailable. Please check OPENAI_API_KEY or try again later.");
        } else {
          toast.error(data.error || "Failed to generate description");
        }
      }
    } catch (error) {
      console.error("Error generating JD:", error);
      toast.error("Failed to generate job description");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (status = "draft") => {
    if (!formData.title || !formData.description) {
      toast.error("Please fill in title and description");
      return;
    }

    setLoading(true);
    try {
      const expMin = parseInt(formData.experienceMin) || null;
      const expMax = parseInt(formData.experienceMax) || null;

      if (expMin !== null && expMax !== null && expMin > expMax) {
        toast.error("Minimum experience cannot be greater than maximum");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          experienceMin: expMin,
          experienceMax: expMax,
          salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
          salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
          skills: formData.skills
            ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || "Failed to create job";
        toast.error(message);
      } else {
        toast.success("Job created successfully!");
        router.push("/admin/jobs");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Create Job Posting
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">New</Badge>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new job posting</p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-xl animate-in slide-in-from-bottom-4 duration-700 delay-150">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Job Details
          </CardTitle>
          <CardDescription>Provide the necessary details for the position</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 group md:col-span-2">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input id="title" name="title" placeholder="e.g., Senior Full Stack Developer" value={formData.title} onChange={handleChange} className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" />
              {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="location" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Location <span className="text-red-500">*</span>
              </Label>
              <Input id="location" name="location" placeholder="e.g., San Francisco, CA (Remote)" value={formData.location} onChange={handleChange} className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" />
              {fieldErrors.location && <p className="text-xs text-red-500 mt-1">{fieldErrors.location}</p>}
            </div>

            <div className="space-y-2 group">
              <Label className="text-sm font-semibold text-gray-900 dark:text-white">Experience Range (years) <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                <Input id="experienceMin" name="experienceMin" type="number" min="0" placeholder="Min" value={formData.experienceMin} onChange={handleChange} className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" />
                {fieldErrors.experienceMin && <p className="text-xs text-red-500 mt-1">{fieldErrors.experienceMin}</p>}
                <Input id="experienceMax" name="experienceMax" type="number" min="0" placeholder="Max" value={formData.experienceMax} onChange={handleChange} className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" />
                {fieldErrors.experienceMax && <p className="text-xs text-red-500 mt-1">{fieldErrors.experienceMax}</p>}
              </div>
            </div>

            <div className="space-y-2 group">
              <Label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                Salary Range ($)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Input id="salaryMin" name="salaryMin" type="number" min="0" placeholder="Min" value={formData.salaryMin} onChange={handleChange} className="h-12 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200" />
                <Input id="salaryMax" name="salaryMax" type="number" min="0" placeholder="Max" value={formData.salaryMax} onChange={handleChange} className="h-12 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200" />
              </div>
            </div>

            <div className="space-y-2 group md:col-span-2">
              <Label htmlFor="skills" className="text-sm font-semibold text-gray-900 dark:text-white">Required Skills</Label>
              <Input id="skills" name="skills" placeholder="e.g., React, Node.js, PostgreSQL (comma-separated)" value={formData.skills} onChange={handleChange} className="h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200" />
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><span className="text-xs">💡</span> Separate multiple skills with commas</p>
            </div>

                <div className="md:col-span-2 flex items-end gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Let AI create a professional, engaging job description instantly</p>
              </div>
              <Button type="button" onClick={handleGenerateJD} disabled={generating || !aiEnabled || !formData.title || !formData.location || !formData.experienceMin || !formData.experienceMax} className={`bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 ${!aiEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {generating ? (
                  <>
                    <span className="animate-spin mr-2">⚡</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
              {!aiEnabled && (
                <p className="text-xs text-gray-500 ml-2">AI generation disabled - check server configuration</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">Job Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={8} placeholder="Describe the role, responsibilities, and expectations..." className="border-gray-200 dark:border-gray-700" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => router.back()} variant="outline" className="hover:bg-gray-50">Cancel</Button>
            <Button onClick={() => handleSubmit("draft")} className="bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transform hover:-translate-y-0.5">Save Draft</Button>
            <Button onClick={() => handleSubmit("active")} className="bg-linear-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transform hover:-translate-y-0.5">Publish</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
