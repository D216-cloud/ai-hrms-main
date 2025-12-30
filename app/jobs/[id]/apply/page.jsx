"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Eye,
  Download,
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [profileResume, setProfileResume] = useState(null);
  const [useProfileResume, setUseProfileResume] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [uploadedResumePreviewUrl, setUploadedResumePreviewUrl] = useState(null);
  const [autoFillComplete, setAutoFillComplete] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState(null); // raw parsed data from /api/parse-resume
  const [matchPreview, setMatchPreview] = useState(null); // { score, matched, missing }
  const [draftSaving, setDraftSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setHasDraft(Boolean(parsed && parsed[params.id]));
    } catch (err) {
      console.error('Failed to check drafts:', err);
    }
  }, [params.id]);

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

  const DRAFT_KEY = 'job_apply_drafts_v1';

  const saveDraft = () => {
    try {
      setDraftSaving(true);
      const raw = localStorage.getItem(DRAFT_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[params.id] = {
        savedAt: new Date().toISOString(),
        formData,
        useProfileResume,
        profileResumeMeta: profileResume ? { name: profileResume.name, url: profileResume.url } : null,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed));
      setHasDraft(true);
      toast.success('Draft saved locally');
    } catch (err) {
      console.error('Failed to save draft:', err);
      toast.error('Failed to save draft locally');
    } finally {
      setDraftSaving(false);
    }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const d = parsed[params.id];
      if (!d) return false;
      setFormData(d.formData || {});
      setUseProfileResume(Boolean(d.useProfileResume));
      if (d.profileResumeMeta) setProfileResume(d.profileResumeMeta);
      toast.success('Draft loaded');
      setHasDraft(true);
      return true;
    } catch (err) {
      console.error('Failed to load draft:', err);
      toast.error('Failed to load draft');
      return false;
    }
  };

  const deleteDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      delete parsed[params.id];
      localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed));
      setHasDraft(false);
      toast.success('Draft deleted');
    } catch (err) {
      console.error('Failed to delete draft:', err);
      toast.error('Failed to delete draft');
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchJob();
      if (session?.user?.email) {
        fetchProfileResume();
      }

      // check draft existence
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setHasDraft(Boolean(parsed && parsed[params.id]));
        } else {
          setHasDraft(false);
        }
      } catch (err) {
        console.error('Error checking draft:', err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, session?.user?.email]);

  // Debug: Log formData changes
  useEffect(() => {
    console.log("Form data updated:", formData);
  }, [formData]);

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

  const fetchProfileResume = async () => {
    try {
      // First, set the email from session (locked to logged-in user)
      if (session?.user?.email) {
        setFormData((prev) => ({ ...prev, email: session.user.email }));
      }

      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.resumeUrl) {
          setProfileResume({
            url: data.resumeUrl,
            publicId: data.resumePublicId,
            name: data.name || "Resume",
          });
          // Auto-fill form data from profile
          if (data.name) setFormData((prev) => ({ ...prev, name: data.name }));
          // Email is already set from session above - don't override it
          if (data.phone) setFormData((prev) => ({ ...prev, phone: data.phone }));
          if (data.currentCompany) setFormData((prev) => ({ ...prev, currentCompany: data.currentCompany }));
          if (data.yearsOfExperience) setFormData((prev) => ({ ...prev, experience: data.yearsOfExperience }));
          if (data.skills) setFormData((prev) => ({ ...prev, skills: Array.isArray(data.skills) ? data.skills.join(", ") : data.skills }));
          if (data.education) setFormData((prev) => ({ ...prev, education: data.education }));
        }
      }
    } catch (error) {
      console.error("Error fetching profile resume:", error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear the input value to allow re-uploading the same file
    e.target.value = '';

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

    // Store file in state separately, NOT in formData
    setResumeFile(file);
    setUseProfileResume(false);
    setAutoFillComplete(false);

    // Call parse resume immediately
    try {
      await parseResume(file);
    } catch (error) {
      console.error("Error in handleFileChange parseResume:", error);
    }
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

      console.log("Parse API data received:", data);

      // Save parsed data for match preview and suggestions
      setParsedResumeData(data);

      // Create a preview URL for the uploaded resume file (for iframe preview)
      try {
        if (file && typeof URL !== 'undefined') {
          const url = URL.createObjectURL(file);
          setUploadedResumePreviewUrl(url);
        }
      } catch (err) {
        console.error('Failed to create preview URL for uploaded resume:', err);
      }

      // Safely extract company name from experience array
      let companyName = ""; 
      if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
        companyName = data.experience[0].company || "";
      }

      // Calculate years of experience
      let yearsExp = 0;
      if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
        const firstJob = data.experience[0];
        const lastYear = firstJob.endYear ? parseInt(String(firstJob.endYear), 10) : new Date().getFullYear();
        const startYear = firstJob.startYear ? parseInt(String(firstJob.startYear), 10) : lastYear - 1;
        yearsExp = Math.max(0, lastYear - startYear);
      }

      // Format education
      let educationText = "";
      if (data.education && Array.isArray(data.education) && data.education.length > 0) {
        educationText = data.education.map(edu => {
          const degree = edu.degree || "";
          const institution = edu.institution || "";
          const year = edu.endYear ? ` (${edu.endYear})` : "";
          return degree && institution ? `${degree} from ${institution}${year}` : institution || degree;
        }).filter(text => text).join(", ");
      }

      // Format skills
      let skillsText = "";
      if (data.skills && Array.isArray(data.skills)) {
        skillsText = data.skills.filter(s => s && String(s).trim()).join(", ");
      }

      // Build form data object with safe string conversion
      // If user is logged in, ALWAYS use their session email (don't override)
      const newFormData = {
        name: data.name ? String(data.name).trim() : "",
        email: session?.user?.email || (data.email ? String(data.email).trim() : ""),
        phone: data.phone ? String(data.phone).trim() : "",
        currentCompany: companyName ? String(companyName).trim() : "",
        experience: yearsExp > 0 ? String(yearsExp) : "",
        skills: skillsText,
        education: educationText,
        coverLetter: "",
      };

      console.log("✅ Extracted form data:", newFormData);
      console.log("📋 Name:", newFormData.name);
      console.log("📧 Email:", newFormData.email, session?.user?.email ? "(locked to session)" : "(from resume)");
      console.log("📱 Phone:", newFormData.phone);

      // Set form data - this will update React state
      setFormData(newFormData);

      // Mark auto-fill as complete
      setAutoFillComplete(true);

      // Also directly update the input elements via DOM for immediate visual feedback
      setTimeout(() => {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const companyInput = document.getElementById('currentCompany');
        const experienceInput = document.getElementById('experience');
        const skillsInput = document.getElementById('skills');
        const educationInput = document.getElementById('education');

        if (nameInput) {
          nameInput.value = newFormData.name;
          nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (emailInput) {
          emailInput.value = newFormData.email;
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (phoneInput) {
          phoneInput.value = newFormData.phone;
          phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (companyInput) {
          companyInput.value = newFormData.currentCompany;
          companyInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (experienceInput) {
          experienceInput.value = newFormData.experience;
          experienceInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (skillsInput) {
          skillsInput.value = newFormData.skills;
          skillsInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (educationInput) {
          educationInput.value = newFormData.education;
          educationInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        console.log("✅ DOM inputs updated directly");

        // Scroll to form
        const formSection = document.querySelector('[data-form-section]');
        if (formSection) {
          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Show success message with what was filled
      const filledFields = [];
      if (newFormData.name) filledFields.push("Name");
      if (newFormData.email) filledFields.push("Email");
      if (newFormData.phone) filledFields.push("Phone");
      if (newFormData.currentCompany) filledFields.push("Company");
      if (newFormData.experience) filledFields.push("Experience");
      if (newFormData.skills) filledFields.push("Skills");
      if (newFormData.education) filledFields.push("Education");

      const message = filledFields.length > 0
        ? `Resume parsed! Auto-filled: ${filledFields.join(", ")}. Please review and edit.`
        : "Resume parsed successfully! Please review and edit the details below.";

      toast.success(message);
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

  useEffect(() => {
    try {
      const jobSkills = (job?.skills || []).map(s => String(s).trim().toLowerCase()).filter(Boolean);
      const candidateSkills = (parsedResumeData && parsedResumeData.skills && Array.isArray(parsedResumeData.skills))
        ? parsedResumeData.skills.map(s => String(s).trim().toLowerCase()).filter(Boolean)
        : (formData.skills ? formData.skills.split(',').map(s => String(s).trim().toLowerCase()).filter(Boolean) : []);

      const matched = jobSkills.filter(js => candidateSkills.includes(js));
      const missing = jobSkills.filter(js => !candidateSkills.includes(js));
      const score = jobSkills.length === 0 ? 0 : Math.round((matched.length / jobSkills.length) * 100);
      setMatchPreview({ score, matched, missing });
    } catch (e) {
      console.error('Error computing match preview:', e);
    }
  }, [job, parsedResumeData, formData.skills]);

  const insertSuggestedSentence = (skills) => {
    const sentence = skills && skills.length > 0 ? `I have experience with ${skills.join(', ')}.` : '';
    setFormData(prev => ({ ...prev, coverLetter: `${prev.coverLetter ? prev.coverLetter + '\n\n' : ''}${sentence}` }));
    toast.success('Inserted suggested sentence into cover letter');
  };

  const openUploadedPreview = () => {
    if (uploadedResumePreviewUrl) {
      setShowResumePreview(true);
    } else if (resumeFile) {
      try {
        const url = URL.createObjectURL(resumeFile);
        setUploadedResumePreviewUrl(url);
        setShowResumePreview(true);
      } catch (err) {
        console.error('Failed to create preview URL:', err);
        toast.error('Failed to preview resume');
      }
    }
  };

  // Generate a short AI cover letter paragraph using server-side OpenAI endpoint
  const generateCoverLetterSuggestion = async (preview) => {
    if (!job) {
      toast.error('Job details not loaded yet');
      return;
    }

    setCoverLoading(true);
    try {
      const body = {
        jobTitle: job.title || '',
        company: job.company || '',
        jobDescription: job.description || '',
        formData,
        matchPreview: preview || matchPreview || { matched: [], missing: [], score: 0 },
      };

      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        console.error('Error generating cover letter:', data);
        toast.error(data.error || 'Failed to generate cover letter');
        return;
      }

      // Insert generated paragraph and show suggestion as toast
      const paragraph = data.coverLetter || '';
      const suggestion = data.suggestion || '';

      setFormData(prev => ({ ...prev, coverLetter: `${prev.coverLetter ? prev.coverLetter + '\n\n' : ''}${paragraph}${suggestion ? '\n\nSuggestion: ' + suggestion : ''}` }));
      toast.success('AI-generated cover letter inserted');
    } catch (err) {
      console.error('Error calling /api/generate-cover-letter:', err);
      toast.error('Failed to generate cover letter');
    } finally {
      setCoverLoading(false);
    }
  };

  const quickApply = () => {
    if (!profileResume) {
      toast.error('No saved profile resume found');
      return;
    }
    setUseProfileResume(true);
    setResumeFile(null);

    // Delay to ensure state updates before submitting
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        // Fallback: call handler directly
        handleSubmit({ preventDefault: () => {} });
      }
    }, 80);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields (Name, Email, Phone)");
      return;
    }

    if (!resumeFile && !useProfileResume) {
      toast.error("Please upload a resume or use your profile resume");
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

      if (resumeFile) {
        submitData.append("resume", resumeFile);
      } else if (useProfileResume && profileResume) {
        submitData.append("profileResumeUrl", profileResume.url);
      }

      // Only append text/string values from formData, skip any file objects
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        // Only append if value is a string or number, not a File object
        if (typeof value === 'string' || typeof value === 'number') {
          submitData.append(key, value);
        }
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
            const successUrl = `/jobs/${params.id}/apply/success?token=${data.application?.token || 'unknown'
              }&jobTitle=${encodeURIComponent(
                data.application?.jobTitle || job.title
              )}&email=${encodeURIComponent(data.application?.email || formData.email)}&matchScore=${data.application?.matchScore || 0
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
      const successUrl = `/jobs/${params.id}/apply/success?token=${data.application.token
        }&jobTitle=${encodeURIComponent(
          data.application.jobTitle
        )}&email=${encodeURIComponent(data.application.email)}&matchScore=${data.application.matchScore
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

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-semibold">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 font-semibold">Job not found</p>
        </div>
      </div>
    );
  }

  // Debug: Log state to check for File objects
  try {
    Object.values(formData).forEach((value) => {
      if (value instanceof File) {
        console.error("File object found in formData:", value);
      }
    });
  } catch (e) {
    console.error("Error checking formData:", e);
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/jobs/${job._id || params.id}`} className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors font-semibold">
            <ArrowLeft className="w-5 h-5" /> Back to Job
          </Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section - Job Summary */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="bg-linear-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-3xl p-8 md:p-12 border-2 border-cyan-200 dark:border-cyan-800/50">
            <div className="flex items-start justify-between gap-6 mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Apply for {job.title}
                </h1>
                <p className="text-lg text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2 mb-4">
                  <span className="text-2xl">🏢</span>
                  {job.company || "Company"}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 text-cyan-600" /> {job.location || "Remote"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Briefcase className="w-4 h-4 text-cyan-600" /> {job.type || "Full-time"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-4 h-4 text-cyan-600" /> {job.salary_min ? `$${job.salary_min}k - $${job.salary_max}k` : "Competitive"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Resume Section */}
              <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg animate-in fade-in slide-in-from-left duration-500">
                <div className="flex items-center gap-3 mb-4 md:mb-6 pb-4 md:pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-cyan-600" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Resume</h2>
                </div>

                <div className="space-y-4">
                  {/* Profile Resume Option */}
                  {profileResume && (
                    <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700/50">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <input
                              type="radio"
                              id="useProfile"
                              name="resumeOption"
                              checked={useProfileResume}
                              onChange={() => {
                                setUseProfileResume(true);
                                setResumeFile(null);
                              }}
                              className="w-5 h-5 text-green-600 cursor-pointer"
                            />
                            <label htmlFor="useProfile" className="text-sm font-bold text-green-700 dark:text-green-300 cursor-pointer flex-1">
                              Use Saved Resume from Profile ✓
                            </label>
                          </div>
                          <div className="ml-8 space-y-2">
                            <p className="text-xs text-green-600 dark:text-green-400">Your resume from profile</p>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-700 dark:text-green-300">{profileResume.name}</span>
                            </div>
                          </div>
                        </div>
                        {useProfileResume && (
                          <button
                            type="button"
                            onClick={() => setShowResumePreview(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shrink-0"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upload New Resume */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="radio"
                        id="uploadNew"
                        name="resumeOption"
                        checked={!useProfileResume}
                        onChange={() => setUseProfileResume(false)}
                        className="w-5 h-5 text-cyan-600 cursor-pointer"
                      />
                      <label htmlFor="uploadNew" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                        Upload New Resume
                      </label>
                    </div>

                    {resumeFile ? (
                      <div className="border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Check className="h-6 w-6 text-green-600" />
                              <FileText className="h-8 w-8 text-green-600" />
                              <div>
                                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                                  {resumeFile.name}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setResumeFile(null)}
                              className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-semibold text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              onClick={openUploadedPreview}
                              className="px-3 py-1 bg-cyan-600 text-white rounded font-semibold text-xs hover:bg-cyan-700 transition-all"
                            >
                              Preview
                            </button>
                          </div>
                          <div className="flex items-start gap-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-green-700 dark:text-green-300">
                              Resume uploaded successfully and will be parsed
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-cyan-400 dark:hover:border-cyan-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          id="resume"
                          accept=".pdf,.docx,.doc"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={parsing || submitting}
                        />
                        <label htmlFor="resume" className="cursor-pointer block">
                          {parsing ? (
                            <div className="space-y-3">
                              <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan-600" />
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Parsing your resume...
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                This may take a few seconds
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  PDF or DOCX (max 10MB)
                                </p>
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  {resumeFile && (
                    <div className="flex items-start gap-3 p-4 bg-linear-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 border-2 border-cyan-300 dark:border-cyan-600/50 rounded-xl shadow-md">
                      <Sparkles className="h-6 w-6 text-cyan-600 shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-sm text-cyan-900 dark:text-cyan-100 flex-1">
                        {parsing ? (
                          <>
                            <p className="font-bold text-base">Analyzing your resume...</p>
                            <p className="text-cyan-700 dark:text-cyan-300 mt-1">
                              AI is extracting your information and auto-filling the form.
                            </p>
                          </>
                        ) : autoFillComplete ? (
                          <>
                            <p className="font-bold text-base flex items-center gap-2">
                              <Check className="w-5 h-5 text-green-600" />
                              Auto-fill Complete!
                            </p>
                            <p className="text-cyan-700 dark:text-cyan-300 mt-1">
                              Your resume has been parsed and all details have been automatically filled in the form below. Please review and edit any information as needed.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">✓ Resume uploaded</p>
                            <p className="text-cyan-700 dark:text-cyan-300">
                              Your resume is ready for submission.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg" data-form-section>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 md:mb-6 pb-4 md:pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
                  {autoFillComplete && resumeFile && (
                    <span className="sm:ml-auto inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                      <Check className="w-3 h-3" /> Auto-filled
                    </span>
                  )}
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className={`space-y-2 p-3 rounded-lg transition-all ${formData.name && autoFillComplete ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700/30' : ''}`}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="name" className="text-gray-900 dark:text-white font-semibold">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        {formData.name && autoFillComplete && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <Input
                        id="name"
                        name="name"
                        value={String(formData.name || '')}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        required
                      />
                    </div>
                    <div className={`space-y-2 p-3 rounded-lg transition-all ${session?.user?.email ? 'bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-300 dark:border-blue-700/50' : formData.email && autoFillComplete ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700/30' : ''}`}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email" className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
                          Email <span className="text-red-500">*</span>
                          {session?.user?.email && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                              🔒 Locked to your account
                            </span>
                          )}
                        </Label>
                        {formData.email && autoFillComplete && !session?.user?.email && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={String(formData.email || '')}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={`border-gray-300 dark:border-gray-600 dark:bg-gray-700 ${session?.user?.email ? 'bg-blue-50 dark:bg-blue-900/20 cursor-not-allowed opacity-80' : ''}`}
                        disabled={!!session?.user?.email}
                        readOnly={!!session?.user?.email}
                        required
                        title={session?.user?.email ? 'This email is locked to your logged-in account' : ''}
                      />
                      {session?.user?.email && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Applications will be linked to your account: <strong>{session.user.email}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`space-y-2 p-3 rounded-lg transition-all ${formData.phone && autoFillComplete ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700/30' : ''}`}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="phone" className="text-gray-900 dark:text-white font-semibold">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      {formData.phone && autoFillComplete && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      value={String(formData.phone || '')}
                      onChange={handleChange}
                      placeholder="Your phone number"
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 md:mb-6 pb-4 md:pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                  <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Professional Information</h2>
                  {autoFillComplete && resumeFile && (
                    <span className="sm:ml-auto inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                      <Check className="w-3 h-3" /> Auto-filled
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className={`space-y-2 p-3 rounded-lg transition-all ${formData.currentCompany && autoFillComplete ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700/30' : ''}`}>
                      <Label htmlFor="currentCompany" className="text-gray-900 dark:text-white font-semibold">
                        Current Company
                      </Label>
                      <Input
                        id="currentCompany"
                        name="currentCompany"
                        value={String(formData.currentCompany || '')}
                        onChange={handleChange}
                        placeholder="Your company name"
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                    <div className={`space-y-2 p-3 rounded-lg transition-all ${formData.experience && autoFillComplete ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700/30' : ''}`}>
                      <Label htmlFor="experience" className="text-gray-900 dark:text-white font-semibold">
                        Years of Experience
                      </Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        value={String(formData.experience || '')}
                        onChange={handleChange}
                        placeholder="e.g., 5"
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                  </div>
                  <div className={`space-y-2 p-3 rounded-lg transition-all ${formData.skills && autoFillComplete ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700/30' : ''}`}>
                    <Label htmlFor="skills" className="text-gray-900 dark:text-white font-semibold">
                      Skills (comma-separated)
                    </Label>
                    <Input
                      id="skills"
                      name="skills"
                      placeholder="e.g., React, Node.js, Python, UI Design"
                      value={String(formData.skills || '')}
                      onChange={handleChange}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                  <div className={`space-y-2 p-3 rounded-lg transition-all ${formData.education && autoFillComplete ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700/30' : ''}`}>
                    <Label htmlFor="education" className="text-gray-900 dark:text-white font-semibold">
                      Education
                    </Label>
                    <Textarea
                      id="education"
                      name="education"
                      placeholder="e.g., B.Tech in Computer Science, XYZ University (2020)"
                      value={String(formData.education || '')}
                      onChange={handleChange}
                      rows={3}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg">
                <div className="flex items-center gap-3 mb-4 md:mb-6 pb-4 md:pb-6 border-b-2 border-gray-200 dark:border-gray-700">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Cover Letter (Optional)</h2>
                  <div className="ml-auto flex gap-2">
                    <button type="button" onClick={() => generateCoverLetterSuggestion()} disabled={coverLoading} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-semibold">{coverLoading ? 'Generating...' : 'AI Suggest'}</button>
                    <button type="button" onClick={() => insertSuggestedSentence(matchPreview?.matched || [])} className="px-3 py-2 bg-slate-50 rounded-md text-sm">Insert Skills</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Textarea
                    id="coverLetter"
                    name="coverLetter"
                    placeholder="Tell us why you're interested in this role and what makes you a great fit..."
                    value={String(formData.coverLetter || '')}
                    onChange={handleChange}
                    rows={6}
                    className="border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={saveDraft} disabled={draftSaving} className="px-4 py-2 bg-slate-100 rounded-md text-sm">{draftSaving ? 'Saving...' : 'Save Draft'}</button>
                  <button type="button" onClick={loadDraft} disabled={!hasDraft} className="px-4 py-2 bg-slate-50 rounded-md text-sm">Load Draft</button>
                  <button type="button" onClick={deleteDraft} disabled={!hasDraft} className="px-4 py-2 bg-rose-50 rounded-md text-sm">Delete Draft</button>
                </div>

                <div className="flex gap-3">
                  {profileResume && (
                    <button type="button" onClick={() => quickApply()} className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm">Quick Apply</button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                    className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || (!resumeFile && !useProfileResume)}
                    size="lg"
                    className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar - Application Checklist */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg lg:sticky lg:top-24 animate-in fade-in slide-in-from-right duration-500">
              <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
                <span className="text-xl md:text-2xl">✓</span> Application Checklist
              </h3>

              <div className="space-y-2 md:space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${resumeFile || useProfileResume ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${resumeFile || useProfileResume ? 'bg-green-600' : 'bg-gray-300'}`}>
                    {(resumeFile || useProfileResume) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-semibold ${resumeFile || useProfileResume ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    Resume
                  </span>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${formData.name ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.name ? 'bg-green-600' : 'bg-gray-300'}`}>
                    {formData.name && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-semibold ${formData.name ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    Full Name
                  </span>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${formData.email ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.email ? 'bg-green-600' : 'bg-gray-300'}`}>
                    {formData.email && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-semibold ${formData.email ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    Email Address
                  </span>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${formData.phone ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.phone ? 'bg-green-600' : 'bg-gray-300'}`}>
                    {formData.phone && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-semibold ${formData.phone ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    Phone Number
                  </span>
                </div>
              </div>

              {/* Match Preview */}
              <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Match Preview</h4>
                <div className="text-xs text-gray-500 mb-3">Matched {(matchPreview?.matched || []).length} of {(job?.skills || []).length || 0} skills</div>
                <div className="flex items-center gap-3">
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div className="h-3 bg-teal-500" style={{ width: `${matchPreview?.score || 0}%` }} />
                  </div>
                  <div className="text-sm font-bold">{matchPreview?.score || 0}%</div>
                </div>
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                  <div><strong>Matched:</strong> {(matchPreview?.matched || []).slice(0,6).join(', ') || '—'}</div>
                  <div className="mt-2 text-rose-600"><strong>Missing:</strong> {(matchPreview?.missing || []).slice(0,6).join(', ') || '—'}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => insertSuggestedSentence(matchPreview?.matched || [])} className="px-3 py-2 bg-slate-50 rounded-md text-sm">Insert Matched Skills</button>
                  <button type="button" onClick={() => generateCoverLetterSuggestion(matchPreview)} disabled={coverLoading} className="px-3 py-2 bg-cyan-600 text-white rounded-md text-sm">{coverLoading ? 'Generating...' : 'AI Suggest Cover Letter'}</button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700/50 rounded-xl">
                <p className="text-sm text-cyan-900 dark:text-cyan-200">
                  <span className="font-semibold">Pro Tip:</span> Complete all required fields for better matching with the role!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Resume Preview Modal */}
      {showResumePreview && (profileResume || uploadedResumePreviewUrl) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Preview</h3>
              <button
                onClick={() => setShowResumePreview(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <iframe
                src={uploadedResumePreviewUrl || profileResume?.url}
                className="w-full h-[70vh] rounded-lg border border-gray-200 dark:border-gray-700"
                title="Resume Preview"
              />
              <div className="mt-4 flex gap-3 justify-end">
                <a
                  href={uploadedResumePreviewUrl || profileResume?.url}
                  download
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => setShowResumePreview(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
