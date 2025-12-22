import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateEmbedding, matchResumeToJob } from "@/lib/openai";
import { calculateMatchScore } from "@/utils/scoring";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractResumeText } from "@/lib/resumeParser";
import { sendEmail } from "@/lib/email";
import { applicationSubmittedTemplate } from "@/lib/emailTemplates";

// Move CORS headers to top for consistency
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
};

// Add OPTIONS handler for CORS preflight requests
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function createJson(body, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

// POST /api/jobs/[id]/apply - Submit job application (NO AUTH REQUIRED)
// Candidates don't need accounts - they submit with their info
export async function POST(request, { params }) {
  try {
    const { id: jobId } = await params;

    // Check if job exists and is active
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Job fetch error:", jobError);
      return createJson({ error: "Job not found" }, 404);
    }

    if (job.status !== "active") {
      return createJson(
        { error: "This job is no longer accepting applications" },
        400
      );
    }

    // Parse form data
    const formData = await request.formData();
    const resumeFile = formData.get("resume");
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const currentCompany = formData.get("currentCompany") || null;
    const experience = formData.get("experience")
      ? parseInt(formData.get("experience"))
      : null;
    const skills = formData.get("skills") || "";
    const education = formData.get("education") || null;
    const coverLetter = formData.get("coverLetter") || null;

    // Log received data for debugging
    console.log("Application data received:", {
      jobId,
      hasResumeFile: !!resumeFile,
      name,
      email,
      phone,
      currentCompany,
      experience,
      skillsLength: skills.length,
      hasEducation: !!education,
      hasCoverLetter: !!coverLetter
    });

    // Validate required fields
    if (!resumeFile || !name || !email || !phone) {
      return createJson(
        { error: "Missing required fields: resume, name, email, phone" },
        400
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (resumeFile.size > maxSize) {
      return createJson(
        { error: "Resume file too large. Maximum size is 10MB." },
        400
      );
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    
    const isFileTypeValid = validTypes.includes(resumeFile.type) || 
      resumeFile.type.includes("pdf") || 
      resumeFile.type.includes("wordprocessingml.document") || 
      resumeFile.type.includes("docx") ||
      resumeFile.type.includes("msword");
      
    if (!isFileTypeValid) {
      return createJson(
        { error: `Invalid file type: ${resumeFile.type}. Please upload PDF or DOCX files only.` },
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createJson(
        { error: "Please provide a valid email address." },
        400
      );
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.length < 10) {
      return createJson(
        { error: "Please provide a valid phone number." },
        400
      );
    }

    // Check if email has already applied to this job (prevent duplicates)
    const { data: existingApp, error: existingAppError } = await supabaseAdmin
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("email", email)
      .single();

    if (existingAppError && existingAppError.code !== 'PGRST116') {
      console.error("Error checking existing application:", existingAppError);
    }

    if (existingApp) {
      return createJson(
        { error: "You have already applied to this job with this email" },
        400
      );
    }

    // Extract resume text for embedding and AI analysis
    const bytes = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload resume to Cloudinary
    let resumeUrl;
    try {
      console.log("Attempting to upload resume to Cloudinary");
      const uploadResult = await uploadToCloudinary(
        buffer,
        resumeFile.name,
        "hrms/resumes"
      );
      resumeUrl = uploadResult.url;
      console.log("Resume uploaded successfully:", resumeUrl);
    } catch (uploadError) {
      console.error("Error uploading resume to Cloudinary:", uploadError);
      // Provide more specific error messages
      let errorMessage = "Failed to upload resume. Please try again or contact support.";
      
      if (uploadError.message && uploadError.message.includes("Cloudinary is not properly configured")) {
        errorMessage = "Resume upload service is currently unavailable. Please contact support.";
      } else if (uploadError.message) {
        errorMessage = uploadError.message;
      }
      
      return createJson(
        {
          error: errorMessage,
        },
        500
      );
    }

    // Extract text from PDF/DOCX
    let resumeText;
    try {
      console.log("Attempting to extract text from resume file:", {
        fileName: resumeFile.name,
        fileType: resumeFile.type,
        fileSize: resumeFile.size
      });
      
      resumeText = await extractResumeText(buffer, resumeFile.type);
      
      // Validate that we got meaningful text
      if (!resumeText || resumeText.trim().length < 10) {
        console.log("Extracted text is too short:", {
          textLength: resumeText ? resumeText.length : 0,
          textSample: resumeText ? resumeText.substring(0, 50) : 'none'
        });
        throw new Error("Extracted text is too short to be meaningful");
      }
      
      console.log("Successfully extracted text. Length:", resumeText.length);
    } catch (extractError) {
      console.error("Error extracting text from resume:", extractError);
      
      // Log detailed error information
      console.error("Resume extraction error details:", {
        fileName: resumeFile.name,
        fileType: resumeFile.type,
        fileSize: resumeFile.size,
        errorMessage: extractError.message,
        errorStack: extractError.stack
      });
      
      // SPECIAL CASE: Handle "corrupted" files more gracefully
      // Often files flagged as "corrupted" are actually valid but use newer PDF features
      if (extractError.message.includes("corrupted") || extractError.message.includes("Corrupted") || 
          extractError.message.includes("Invalid PDF structure")) {
        console.log("Attempting to process 'corrupted' file as potentially valid...");
        
        // Try to extract at least some text
        try {
          // Create a minimal text representation from available metadata
          const fallbackText = `Candidate Resume
File Name: ${resumeFile.name}
File Size: ${resumeFile.size} bytes
Upload Date: ${new Date().toISOString()}
          
Please manually enter your information below as the system had difficulty parsing your resume file. 
This is common with certain PDF formats and does not indicate a problem with your actual resume.`;
          
          console.log("Using fallback text for 'corrupted' file");
          resumeText = fallbackText;
        } catch (fallbackError) {
          console.error("Fallback text creation failed:", fallbackError);
          // If even fallback fails, return a more helpful error
          return createJson(
            {
              error: "This PDF file format is not fully supported by our system. For best results, please convert your resume to DOCX format.",
              solution: "Convert your PDF to DOCX format using Microsoft Word, Google Docs, or an online converter.",
              details: extractError.message
            },
            400
          );
        }
      } else {
        // Handle other specific error cases
        if (extractError.message.includes("password")) {
          return NextResponse.json(
            {
              error: "Password-protected files are not supported. Please remove the password and try again.",
            },
            { status: 400 }
          );
        } else if (extractError.message.includes("Invalid")) {
          return NextResponse.json(
            {
              error: "Invalid file format. Please ensure you're uploading a valid PDF or DOCX file.",
            },
            { status: 400 }
          );
        } else if (extractError.message.includes("canvas") || extractError.message.includes("worker")) {
          return NextResponse.json(
            {
              error: "This file format requires additional dependencies. Please convert to DOCX format.",
            },
            { status: 400 }
          );
        }
        
        // Fall back to basic info if text extraction fails
        resumeText = `
          Candidate: ${name}
          Email: ${email}
          Phone: ${phone}
          Current Company: ${currentCompany || "N/A"}
          Experience: ${experience || "N/A"} years
          Skills: ${skills || "N/A"}
          Education: ${education || "N/A"}
          Cover Letter: ${coverLetter || "N/A"}
        `.trim();
        
        // Still log that we're using fallback
        console.log("Using fallback text extraction for application");
      }
    }

    // Generate resume embedding for vector search
    let resumeEmbedding;
    try {
      console.log("Generating embedding for resume text");
      resumeEmbedding = await generateEmbedding(resumeText);
      console.log("Embedding generated successfully");
    } catch (embeddingError) {
      console.error("Error generating embedding:", embeddingError);
      // Use empty array as fallback
      resumeEmbedding = new Array(1536).fill(0);
    }

    // Calculate cosine similarity match score (0-100)
    let cosineSimilarityScore = 0;
    try {
      // Validate that both vectors exist and have the same length
      if (job.jd_embedding && resumeEmbedding && 
          Array.isArray(job.jd_embedding) && Array.isArray(resumeEmbedding) &&
          job.jd_embedding.length > 0 && resumeEmbedding.length > 0 &&
          job.jd_embedding.length === resumeEmbedding.length) {
        cosineSimilarityScore = calculateMatchScore(resumeEmbedding, job.jd_embedding);
        console.log("Cosine similarity score calculated:", cosineSimilarityScore);
      } else {
        console.log("Skipping cosine similarity calculation due to invalid vectors", {
          hasJdEmbedding: !!job.jd_embedding,
          hasResumeEmbedding: !!resumeEmbedding,
          jdEmbeddingType: Array.isArray(job.jd_embedding) ? 'array' : typeof job.jd_embedding,
          resumeEmbeddingType: Array.isArray(resumeEmbedding) ? 'array' : typeof resumeEmbedding,
          jdEmbeddingLength: job.jd_embedding ? job.jd_embedding.length : 0,
          resumeEmbeddingLength: resumeEmbedding ? resumeEmbedding.length : 0
        });
      }
    } catch (scoreError) {
      console.error("Error calculating cosine similarity:", scoreError);
    }

    // Use AI to intelligently match resume against job description
    let aiMatchAnalysis;
    let finalMatchScore = cosineSimilarityScore; // Default to cosine similarity

    // Only attempt AI matching if we have a job description embedding
    if (job.jd_embedding && Array.isArray(job.jd_embedding) && job.jd_embedding.length > 0) {
      try {
        console.log("Attempting AI match analysis");
        aiMatchAnalysis = await matchResumeToJob(resumeText, job.description, {
          title: job.title,
          skills: job.required_skills || [],
          minExp: job.min_experience || 0,
          maxExp: job.max_experience || 5,
          location: job.location,
        });

        // Use AI match score as primary score (more intelligent than just embeddings)
        finalMatchScore = aiMatchAnalysis.matchScore;
        console.log("AI match analysis completed:", {
          aiScore: aiMatchAnalysis.matchScore,
          cosineScore: cosineSimilarityScore
        });
      } catch (aiError) {
        console.error("AI matching failed, falling back to embedding score:", aiError);
        // If AI matching fails, use cosine similarity score
        aiMatchAnalysis = null;
      }
    } else {
      console.log("Skipping AI match analysis due to missing job description embedding");
      aiMatchAnalysis = null;
    }

    // Parse skills array
    const skillsArray = skills
      ? skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // Create application with auto-generated application_token
    console.log("Creating application in database");
    
    // Prepare application data
    const applicationData = {
      job_id: jobId,
      name,
      email,
      phone,
      current_company: currentCompany,
      experience,
      skills: skillsArray,
      education,
      cover_letter: coverLetter,
      resume_url: resumeUrl,
      resume_text: resumeText,
      resume_embedding: resumeEmbedding,
      resume_match_score: finalMatchScore, // AI-enhanced match score
      overall_score: finalMatchScore, // Initial score is just resume match
      status: "submitted",
    };
    
    // Only add ai_match_data if it's available and valid
    if (aiMatchAnalysis && typeof aiMatchAnalysis === 'object') {
      applicationData.ai_match_data = JSON.stringify({
        recommendation: aiMatchAnalysis.recommendation,
        strengths: aiMatchAnalysis.strengths,
        concerns: aiMatchAnalysis.concerns,
        skillsMatch: aiMatchAnalysis.skillsMatch,
        experienceMatch: aiMatchAnalysis.experienceMatch,
        summary: aiMatchAnalysis.summary,
        aiScore: aiMatchAnalysis.matchScore,
        cosineScore: cosineSimilarityScore,
      });
    }
    
    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .insert(applicationData)
      .select()
      .single();

    if (appError) {
      console.error("Error creating application:", appError);
      // Log more detailed error information
      console.error("Application data being inserted:", {
        jobId: jobId,
        name: name,
        email: email,
        hasAiMatchData: !!aiMatchAnalysis,
        aiMatchDataType: typeof aiMatchAnalysis,
        aiMatchDataKeys: aiMatchAnalysis ? Object.keys(aiMatchAnalysis) : null
      });
      
      return createJson(
        { 
          error: "Failed to submit application",
          details: process.env.NODE_ENV === 'development' ? appError.message : undefined,
          // Add more user-friendly error message
          userMessage: "We're experiencing technical difficulties. Please try again or contact support if the issue persists."
        },
        500
      );
    }

    console.log("Application created successfully:", application.id);

    // Send confirmation email to candidate
    try {
      console.log("Sending confirmation email");
      const emailTemplate = applicationSubmittedTemplate(
        application.name,
        job.title,
        application.application_token
      );
      await sendEmail({
        to: application.email,
        subject: `Application Received - ${job.title}`,
        html: emailTemplate,
      });
      console.log(`Confirmation email sent to ${application.email}`);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the application if email fails
    }

    return createJson(
      {
        success: true,
        message:
          "Application submitted successfully! We'll contact you via email.",
        application: {
          id: application.id,
          matchScore: finalMatchScore,
          aiAnalysis: aiMatchAnalysis
            ? {
                recommendation: aiMatchAnalysis.recommendation,
                strengths: aiMatchAnalysis.strengths.slice(0, 3), // Top 3 strengths
                concerns: aiMatchAnalysis.concerns.slice(0, 2), // Top 2 concerns
              }
            : null,
          email: application.email,
          token: application.application_token,
          jobTitle: job.title,
        },
      },
      201
    );
  } catch (error) {
    console.error("Error in POST /api/jobs/[id]/apply:", error);
    return createJson(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      500
    );
  }
}
