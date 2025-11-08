"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateJD = async () => {
    // Validate required fields for generation
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
          skills: formData.skills
            ? formData.skills.split(",").map((s) => s.trim())
            : [],
          salaryMin: formData.salaryMin
            ? parseFloat(formData.salaryMin)
            : undefined,
          salaryMax: formData.salaryMax
            ? parseFloat(formData.salaryMax)
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show specific error message from API
        const errorMessage = data.error || "Failed to generate job description";
        if (data.missingFields) {
          toast.error(`Missing fields: ${data.missingFields.join(", ")}`);
        } else if (data.field) {
          toast.error(errorMessage);
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      setFormData((prev) => ({ ...prev, description: data.description }));
      toast.success("Job description generated successfully!");
    } catch (error) {
      console.error("Error generating JD:", error);
      // Error already shown via toast in the response check above
      if (!error.message.includes("Failed to generate")) {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (status) => {
    // Validate required fields
    if (
      !formData.title ||
      !formData.location ||
      !formData.description ||
      !formData.experienceMin ||
      !formData.experienceMax
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate experience range
    const expMin = parseInt(formData.experienceMin);
    const expMax = parseInt(formData.experienceMax);
    if (expMin < 0 || expMax < expMin) {
      toast.error("Please enter a valid experience range");
      return;
    }

    // Validate salary range if provided
    if (formData.salaryMin && formData.salaryMax) {
      const salMin = parseFloat(formData.salaryMin);
      const salMax = parseFloat(formData.salaryMax);
      if (salMax < salMin) {
        toast.error("Maximum salary must be greater than minimum salary");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
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
        // Show specific error message from API
        const errorMessage = data.error || "Failed to create job";

        if (data.missingFields) {
          toast.error(`Please fill in: ${data.missingFields.join(", ")}`);
        } else if (data.field === "experience") {
          toast.error(errorMessage, { duration: 4000 });
        } else if (data.field === "salary") {
          toast.error(errorMessage, { duration: 4000 });
        } else if (response.status === 403) {
          toast.error("You don't have permission to create jobs");
        } else if (response.status === 409) {
          toast.error(errorMessage, { duration: 5000 });
        } else if (response.status === 503) {
          toast.error(
            "AI service is temporarily unavailable. Please try again later.",
            {
              duration: 5000,
            }
          );
        } else {
          toast.error(errorMessage);
        }

        throw new Error(errorMessage);
      }

      toast.success(
        `Job ${
          status === "active" ? "published" : "saved as draft"
        } successfully!`
      );
      router.push("/admin/jobs");
    } catch (error) {
      console.error("Error creating job:", error);
      // Error already shown via toast in the response check above
      // Only show generic error if no specific error was shown
      if (!error.message || error.message === "Failed to create job") {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Create Job Posting
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">New</Badge>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Fill in the details or let AI generate a professional job description ✨
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-xl animate-in slide-in-from-bottom-4 duration-700 delay-150">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-linear-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Job Details
          </CardTitle>
          <CardDescription>
            Enter the basic information about the position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Job Title */}
          <div className="space-y-2 group">
            <Label htmlFor="title" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Job Title <span className="text-red-500">*</span>
              <Badge variant="outline" className="text-xs font-normal">Required</Badge>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <Label htmlFor="experienceMin" className="text-sm font-semibold text-gray-900 dark:text-white">
                Min Experience (years) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="experienceMin"
                name="experienceMin"
                type="number"
                min="0"
                placeholder="0"
                value={formData.experienceMin}
                onChange={handleChange}
                className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="experienceMax" className="text-sm font-semibold text-gray-900 dark:text-white">
                Max Experience (years) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="experienceMax"
                name="experienceMax"
                type="number"
                min="0"
                placeholder="5"
                value={formData.experienceMax}
                onChange={handleChange}
                className="h-12 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 group">
              <Label htmlFor="salaryMin" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                Min Salary ($)
              </Label>
              <Input
                id="salaryMin"
                name="salaryMin"
                type="number"
                min="0"
                placeholder="80000"
                value={formData.salaryMin}
                onChange={handleChange}
                className="h-12 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-2 group">
              <Label htmlFor="salaryMax" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                Max Salary ($)
              </Label>
              <Input
                id="salaryMax"
                name="salaryMax"
                type="number"
                min="0"
                placeholder="120000"
                value={formData.salaryMax}
                onChange={handleChange}
                className="h-12 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2 group">
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
              Enter skills separated by commas
            </p>
          </div>

          {/* AI Generate Button */}
          <div className="flex items-center gap-4 p-5 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-xl transition-all duration-300 group">
            <div className="shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                AI-Powered Job Description Generator
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
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
          <div className="space-y-2 group">
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
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={loading || !formData.title || !formData.description}
              className="hover:bg-yellow-50 dark:hover:bg-yellow-950/30 hover:text-yellow-700 dark:hover:text-yellow-300 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200"
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit("active")}
              disabled={loading || !formData.title || !formData.description}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Publishing...
                </>
              ) : (
                <>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Publish Job
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
              This is how candidates will see your job posting on the careers page 👀
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            {/* Job Card Preview - Matches public job card design */}
            <Card className="border-2 border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-linear-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3 text-gray-900 dark:text-white">
                      {formData.title || "Job Title"}
                    </CardTitle>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-sm px-3 py-1">
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
                              variant="secondary" 
                              className="px-3 py-1.5 text-sm bg-linear-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 hover:scale-105 transition-transform duration-200"
                            >
                              {skill}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold" disabled>
                      <Briefcase className="mr-2 h-5 w-5" />
                      Apply for this Position
                    </Button>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                      This is a preview - candidates will be able to apply once published
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button 
              variant="outline" 
              onClick={() => setPreviewOpen(false)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Close Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewOpen(false);
                handleSubmit("draft");
              }}
              disabled={loading}
              className="hover:bg-yellow-50 dark:hover:bg-yellow-950/30 hover:text-yellow-700 dark:hover:text-yellow-300 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-200"
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handleSubmit("active");
              }}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Publish Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
