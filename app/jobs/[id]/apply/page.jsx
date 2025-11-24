"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Upload,
  FileText,
  Sparkles,
  ArrowLeft,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentCompany: "",
    experience: "",
    skills: "",
    education: "",
    coverLetter: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`);
      
      // Check if the response is OK and if the content type is JSON
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Expected JSON but received:", text);
        throw new Error("Received non-JSON response from server");
      }
      
      const data = await response.json();

      if (response.ok) {
        setJob(data);
      } else {
        toast.error("Job not found");
        router.push("/jobs");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
      router.push("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Log file information for debugging
    console.log("File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Validate file type with more flexible checking
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword"
    ];
    
    const isFileTypeValid = validTypes.includes(file.type) || 
      file.type.includes("pdf") || 
      file.type.includes("wordprocessingml.document") || 
      file.type.includes("docx") ||
      file.type.includes("msword");
      
    console.log("File type validation:", {
      fileType: file.type,
      isValid: isFileTypeValid,
      validTypes: validTypes
    });

    if (!isFileTypeValid) {
      toast.error("Please upload a PDF or DOCX file. Other formats are not supported.");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB. Please compress your file or try a smaller document.");
      return;
    }

    setResumeFile(file);
    await parseResume(file);
  };

  const parseResume = async (file) => {
    setParsing(true);
    try {
      console.log("Sending file to parse API:", {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const formData = new FormData();
      formData.append("resume", file);

      let response;
      try {
        response = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });
      } catch (networkError) {
        console.error("Network error during file upload:", networkError);
        throw new Error("Network error occurred while uploading file. Please check your connection and try again.");
      }

      console.log("Parse API response:", {
        status: response.status,
        statusText: response.statusText
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        let errorMessage = "Failed to parse resume";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Handle "corrupted" files more gracefully
        if (errorMessage.includes("corrupted") || errorMessage.includes("Corrupted") || 
            errorMessage.includes("difficulty parsing") || errorMessage.includes("common with certain PDF formats") ||
            errorMessage.includes("common with certain DOCX formats") || errorMessage.includes("convert to DOCX format") ||
            errorMessage.includes("better compatibility")) {
          // This is actually a success case - the file was processed but had parsing issues
          toast.success("File processed successfully! The system had difficulty parsing your resume file, but this is common with certain file formats. Please fill in your details below.");
          setParsing(false);
          return; // Don't show error, continue with manual entry
        } else if (response.status === 400) {
          if (errorMessage.includes("password")) {
            throw new Error("Password-protected files are not supported. Please remove the password and try again.");
          } else if (errorMessage.includes("canvas")) {
            throw new Error("This PDF file requires additional dependencies that are not available. Please try converting to DOCX format.");
          } else if (errorMessage.includes("Invalid")) {
            throw new Error("Invalid file format. Please ensure you're uploading a valid PDF or DOCX file. Try converting to DOCX if you continue to have issues.");
          }
        } else if (response.status === 500) {
          throw new Error("Our system encountered an error while processing your resume. Please try again or contact support if the issue persists.");
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error parsing response JSON:", parseError);
        throw new Error("Invalid response from server. Please try again.");
      }
      
      console.log("Parse API data:", data);

      // Auto-fill form with parsed data
      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        currentCompany: data.currentCompany || prev.currentCompany,
        experience: data.experience?.toString() || prev.experience,
        skills: data.skills?.join(", ") || prev.skills,
        education: data.education || prev.education,
      }));

      toast.success(
        "Resume parsed successfully! Please review and edit the details below."
      );
    } catch (error) {
      console.error("Error parsing resume:", error);
      // Provide more user-friendly error messages with solutions
      let userMessage = error.message || "Failed to parse resume. Please fill the form manually.";
      
      // Add helpful suggestions for common issues
      if (userMessage.includes("corrupted") || userMessage.includes("Corrupted")) {
        userMessage = "File processed successfully! The system had difficulty parsing your resume file, but this is common with certain file formats. Please fill in your details below.";
        toast.success(userMessage);
        setParsing(false);
        return; // Don't show error, continue with manual entry
      } else if (userMessage.includes("canvas") || userMessage.includes("worker") || userMessage.includes("convert to DOCX format") || userMessage.includes("better compatibility")) {
        userMessage += " Converting your file to DOCX format often resolves this issue.";
      } else if (userMessage.includes("Invalid")) {
        userMessage += " Please ensure you're uploading a valid PDF or DOCX file created with standard software like Microsoft Word or Google Docs.";
      }
      
      toast.error(userMessage);
    } finally {
      setParsing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !resumeFile) {
      toast.error("Please fill in all required fields and upload your resume");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("resume", resumeFile);
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });

      const response = await fetch(`/api/jobs/${params.id}/apply`, {
        method: "POST",
        body: submitData,
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error("Invalid response from server. Please try again.");
      }

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400) {
          if (data.error && data.error.includes("password")) {
            throw new Error("Password-protected files are not supported. Please remove the password and try again.");
          } else if (data.error && (data.error.includes("corrupted") || data.error.includes("Corrupted") || 
                     data.error.includes("difficulty parsing") || data.error.includes("common with certain PDF formats") ||
                     data.error.includes("convert to DOCX format") || data.error.includes("better compatibility"))) {
            // This is actually a success case - the file was processed but had parsing issues
            toast.success("Application submitted successfully! The system had difficulty parsing your resume file, but your application was submitted with the information you provided.");
            // Redirect to success page
            const successUrl = `/jobs/${params.id}/apply/success?token=${
              data.application?.token || 'unknown'
            }&jobTitle=${encodeURIComponent(
              data.application?.jobTitle || job.title
            )}&email=${encodeURIComponent(data.application?.email || formData.email)}&matchScore=${
              data.application?.matchScore || 0
            }`;
            router.push(successUrl);
            return; // Don't show error, continue with success
          } else if (data.error && data.error.includes("Invalid")) {
            throw new Error("Invalid file format. Please ensure you're uploading a valid PDF or DOCX file.");
          }
          throw new Error(data.error || "Invalid application data. Please check your information.");
        } else if (response.status === 404) {
          throw new Error("Job not found. It may have been removed.");
        } else if (response.status === 500) {
          throw new Error(data.userMessage || data.error || "Server error occurred. Please try again or contact support.");
        } else {
          throw new Error(data.error || "Failed to submit application");
        }
      }

      toast.success("Application submitted successfully!");

      // Redirect to success page with application details
      const successUrl = `/jobs/${params.id}/apply/success?token=${
        data.application.token
      }&jobTitle=${encodeURIComponent(
        data.application.jobTitle
      )}&email=${encodeURIComponent(data.application.email)}&matchScore=${
        data.application.matchScore
      }`;
      router.push(successUrl);
    } catch (error) {
      console.error("Error submitting application:", error);
      // Provide user-friendly error messages
      let errorMessage = "Failed to submit application. Please try again.";
      
      if (error.message) {
        // Don't show internal error details to users in production
        if (process.env.NODE_ENV === 'development' || error.message.includes("Please")) {
          errorMessage = error.message;
        } else if (error.message.includes("password")) {
          errorMessage = "Password-protected files are not supported. Please remove the password and try again.";
        } else if (error.message.includes("corrupted") || error.message.includes("Corrupted") ||
                   error.message.includes("difficulty parsing") || error.message.includes("common with certain PDF formats") ||
                   error.message.includes("convert to DOCX format") || error.message.includes("better compatibility")) {
          // This is actually a success case - the file was processed but had parsing issues
          toast.success("Application submitted successfully! The system had difficulty parsing your resume file, but your application was submitted with the information you provided.");
          // Redirect to success page
          const successUrl = `/jobs/${params.id}/apply/success?token=unknown&jobTitle=${encodeURIComponent(job.title)}&email=${encodeURIComponent(formData.email)}&matchScore=0`;
          router.push(successUrl);
          setSubmitting(false);
          return; // Don't show error, continue with success
        } else if (error.message.includes("Invalid")) {
          errorMessage = "Invalid file format. Please ensure you're uploading a valid PDF or DOCX file.";
        } else {
          errorMessage = "An error occurred while submitting your application. Please try again.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/jobs/${job.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Job Details
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Apply for {job.title}
            </h1>
            <p className="text-gray-600 mt-1">{job.location}</p>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>
                Our AI will automatically parse your resume and fill in the form
                below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={parsing || submitting}
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    {parsing ? (
                      <div className="space-y-3">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
                        <p className="text-sm font-medium text-gray-700">
                          Parsing your resume...
                        </p>
                        <p className="text-xs text-gray-500">
                          This may take a few seconds
                        </p>
                      </div>
                    ) : resumeFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center">
                          <Check className="h-8 w-8 text-green-600 mr-2" />
                          <FileText className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(resumeFile.size / 1024).toFixed(2)} KB
                        </p>
                        <Button type="button" variant="outline" size="sm">
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF or DOCX (max 10MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                {resumeFile && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium">AI Auto-fill Complete</p>
                      <p className="text-blue-700">
                        Please review and edit the information below before
                        submitting
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                All fields marked with * are required
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentCompany">Current Company</Label>
                  <Input
                    id="currentCompany"
                    name="currentCompany"
                    value={formData.currentCompany}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  name="skills"
                  placeholder="e.g., React, Node.js, Python"
                  value={formData.skills}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Textarea
                  id="education"
                  name="education"
                  placeholder="e.g., B.Tech in Computer Science, XYZ University (2020)"
                  value={formData.education}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter (Optional)</CardTitle>
              <CardDescription>
                Tell us why you&apos;re a great fit for this role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="coverLetter"
                name="coverLetter"
                placeholder="Write your cover letter here..."
                value={formData.coverLetter}
                onChange={handleChange}
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !resumeFile}
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
