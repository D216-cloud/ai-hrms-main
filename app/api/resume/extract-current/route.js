import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { extractResumeText } from "@/lib/resumeParser";
import axios from "axios";

// POST /api/resume/extract-current - Extract text from current user's resume
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("Resume extraction request from user:", userId);

    // Get user's resume URL from profile
    const { data: user, error: userError } = await supabaseAdmin
      .from("hr_users")
      .select("resume_url")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.resume_url) {
      return NextResponse.json(
        { error: "No resume found in your profile" },
        { status: 404 }
      );
    }

    console.log("Downloading resume from:", user.resume_url);

    // Download the resume file
    const response = await axios({
      method: "GET",
      url: user.resume_url,
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"];

    console.log("Resume downloaded. Content-Type:", contentType);

    // Determine file type
    let mimeType = contentType;
    if (!mimeType || mimeType === "application/octet-stream") {
      // Fallback to file extension
      if (user.resume_url.toLowerCase().endsWith(".pdf")) {
        mimeType = "application/pdf";
      } else if (user.resume_url.toLowerCase().endsWith(".docx")) {
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        mimeType = "application/pdf"; // Default assumption
      }
    }

    // Extract text from resume
    console.log("Extracting text from resume...");
    const extractedText = await extractResumeText(buffer, mimeType);

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: "Could not extract meaningful text from resume" },
        { status: 400 }
      );
    }

    console.log("Text extracted successfully. Length:", extractedText.length);

    return NextResponse.json({
      success: true,
      extractedText: extractedText,
      textLength: extractedText.length,
    });
  } catch (error) {
    console.error("Error in POST /api/resume/extract-current:", error);
    
    // Handle specific error cases
    if (error.message && error.message.includes("Unsupported file type")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to extract text from resume" },
      { status: 500 }
    );
  }
}