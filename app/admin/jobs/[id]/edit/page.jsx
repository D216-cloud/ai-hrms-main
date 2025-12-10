"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
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

    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`);
      if (!response.ok) {
        toast.error("Failed to load job");
        router.back();
        return;
      }

      const job = await response.json();
      
      // Parse skills if they're an array
      const skillsString = Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "";

      setFormData({
        title: job.title || "",
        location: job.location || "",
        experienceMin: job.experience_min || "",
        experienceMax: job.experience_max || "",
        salaryMin: job.salary_min || "",
        salaryMax: job.salary_max || "",
        skills: skillsString,
        description: job.description || job.jd_text || "",
      });
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job");
      router.back();
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateJD = async () => {
    if (
      !formData.title ||
      !formData.location ||
      !formData.experienceMin ||
      !formData.experienceMax
    ) {
      toast.error("Please fill in title, location, and experience range first");
      return;
    }

    setGenerating(true);
    try {
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
        setFormData((prev) => ({
          ...prev,
          description: data.description,
        }));
        toast.success("Job description generated! Edit as needed.");
      } else {
        toast.error(data.error || "Failed to generate description");
      }
    } catch (error) {
      console.error("Error generating JD:", error);
      toast.error("Failed to generate job description");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (status) => {
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

      const response = await fetch(`/api/jobs/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          experienceMin: expMin,
          experienceMax: expMax,
          salaryMin: formData.salaryMin
            ? parseFloat(formData.salaryMin)
            : undefined,
          salaryMax: formData.salaryMax
            ? parseFloat(formData.salaryMax)
            : undefined,
          skills: formData.skills
            ? formData.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to update job";
        toast.error(errorMessage, { duration: 4000 });
      } else {
        toast.success(`Job updated successfully!`);
        router.push("/admin/jobs");
      }
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Edit Job Posting
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Update</Badge>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update the job details and save your changes
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-xl animate-in slide-in-from-bottom-4 duration-700 delay-150">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Job Details
          </CardTitle>
          <CardDescription>
            Update the basic information about the position
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Title */}
            <div className="space-y-2 group md:col-span-2">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Senior Full Stack Developer"
                value={formData.title}
                onChange={handleChange}
                className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>

            {/* Location */}
            <div className="space-y-2 group">
              <Label htmlFor="location" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., San Francisco, CA (Remote)"
                value={formData.location}
                onChange={handleChange}
                className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>

            {/* Experience Range */}
            <div className="space-y-2 group">
              <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                Experience Range (years) <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    id="experienceMin"
                    name="experienceMin"
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={formData.experienceMin}
                    onChange={handleChange}
                    className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <Input
                    id="experienceMax"
                    name="experienceMax"
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={formData.experienceMax}
                    onChange={handleChange}
                    className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Salary Range */}
            <div className="space-y-2 group">
              <Label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                Salary Range ($)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    id="salaryMin"
                    name="salaryMin"
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    className="h-12 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <Input
                    id="salaryMax"
                    name="salaryMax"
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    className="h-12 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2 group md:col-span-2">
              <Label htmlFor="skills" className="text-sm font-semibold text-gray-900 dark:text-white">
                Required Skills
              </Label>
              <Input
                id="skills"
                name="skills"
                placeholder="e.g., React, Node.js, PostgreSQL (comma-separated)"
                value={formData.skills}
                onChange={handleChange}
                className="h-12 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="text-xs">💡</span>
                Separate multiple skills with commas
              </p>
            </div>

            {/* AI Generation Button */}
            <div className="md:col-span-2 flex items-end gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                  Let AI create a professional, engaging job description instantly
                </p>
              </div>
              <Button
                type="button"
                onClick={handleGenerateJD}
                disabled={
                  generating ||
                  !formData.title ||
                  !formData.location ||
                  !formData.experienceMin ||
                  !formData.experienceMax
                }
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
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
            </div>

            {/* Job Description */}
            <div className="space-y-2 group md:col-span-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Job Description <span className="text-red-500">*</span>
                <Badge variant="outline" className="text-xs font-normal">Required</Badge>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter or generate a detailed job description..."
                value={formData.description}
                onChange={handleChange}
                rows={14}
                className="text-sm border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none leading-relaxed"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="text-xs">✏️</span>
                You can edit the AI-generated description or write your own
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!formData.title || !formData.description}
              className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={() => handleSubmit("active")}
              disabled={loading || !formData.title || !formData.description}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-600" />
              Job Preview
            </DialogTitle>
            <DialogDescription className="text-base">
              This is how candidates will see your updated job posting 👀
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-xl">
              <CardHeader className="bg-linear-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl md:text-3xl mb-3 text-gray-900 dark:text-white">
                      {formData.title || "Job Title"}
                    </CardTitle>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        {formData.location || "Location"}
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <Briefcase className="h-4 w-4 text-purple-600" />
                        {formData.experienceMin && formData.experienceMax
                          ? `${formData.experienceMin}-${formData.experienceMax} years`
                          : "Experience required"}
                      </span>
                      {(formData.salaryMin || formData.salaryMax) && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          {formData.salaryMin && formData.salaryMax
                            ? `$${parseInt(
                                formData.salaryMin
                              ).toLocaleString()} - $${parseInt(
                                formData.salaryMax
                              ).toLocaleString()}`
                            : formData.salaryMin
                            ? `From $${parseInt(
                                formData.salaryMin
                              ).toLocaleString()}`
                            : `Up to $${parseInt(
                                formData.salaryMax
                              ).toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-sm px-3 py-1 w-fit">
                    ✓ Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {formData.description ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-600 rounded"></span>
                        Job Description
                      </h3>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                        {formData.description}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-8">
                      No description provided yet
                    </p>
                  )}

                  {formData.skills && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-purple-600 rounded"></span>
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((skill, idx) => (
                            <Badge
                              key={idx}
                              className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-sm"
                            >
                              ✓ {skill}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-4">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(false)}
            >
              Close Preview
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handleSubmit("active");
              }}
              disabled={loading || !formData.title || !formData.description}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
