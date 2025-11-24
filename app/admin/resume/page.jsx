"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, Download } from "lucide-react";

export default function ResumeManagementPage() {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload PDF or DOCX files.");
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB.");
        return;
      }
      
      setSelectedFile(file);
      toast.success(`Selected file: ${file.name}`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResumeUrl(data.resumeUrl);
        toast.success("Resume uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload resume.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExtractText = async () => {
    if (!resumeUrl) {
      toast.error("Please upload a resume first.");
      return;
    }

    setIsExtracting(true);
    
    try {
      const response = await fetch("/api/resume/extract-current", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedText(data.extractedText);
        toast.success("Text extracted successfully!");
      } else {
        toast.error(data.error || "Failed to extract text.");
      }
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error("Failed to extract text. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Upload your resume and extract text for profile completion
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Upload Resume
            </CardTitle>
            <CardDescription>
              Upload your PDF or DOCX resume file (max 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume">Select Resume File</Label>
              <Input
                id="resume"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supported formats: PDF, DOCX
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resume
                </>
              )}
            </Button>

            {resumeUrl && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Resume uploaded successfully!
                </p>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 dark:text-green-400 hover:underline mt-1 inline-flex items-center"
                >
                  <Download className="mr-1 h-4 w-4" />
                  Download Resume
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extract Section */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Extract Text
            </CardTitle>
            <CardDescription>
              Extract text from your uploaded resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleExtractText}
              disabled={!resumeUrl || isExtracting}
              className="w-full"
            >
              {isExtracting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Extracting...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Extract Text
                </>
              )}
            </Button>

            {extractedText && (
              <div className="space-y-2">
                <Label>Extracted Text</Label>
                <Textarea
                  value={extractedText}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {extractedText.length} characters extracted
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}