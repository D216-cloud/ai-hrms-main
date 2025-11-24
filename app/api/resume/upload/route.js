import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import fs from "fs/promises";
import path from "path";

// POST /api/resume/upload - Upload resume file for authenticated HR user
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("Resume upload request from user:", userId);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("resume");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF or DOCX files." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create temporary file path
    const tempDir = path.join(process.cwd(), "uploads");
    // Ensure uploads directory exists
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
    
    // Write file to temporary location
    await fs.writeFile(tempFilePath, buffer);
    console.log("File temporarily stored at:", tempFilePath);

    // Upload to Cloudinary
    console.log("Uploading to Cloudinary...");
    const uploadResult = await uploadToCloudinary(
      buffer,
      file.name,
      "hrms/user-resumes"
    );

    const resumeUrl = uploadResult.url;
    console.log("File uploaded to Cloudinary:", resumeUrl);

    // Delete temporary file
    try {
      await fs.unlink(tempFilePath);
      console.log("Temporary file deleted:", tempFilePath);
    } catch (deleteError) {
      console.warn("Failed to delete temporary file:", deleteError);
    }

    // Update user profile with resume URL
    const { error: updateError } = await supabaseAdmin
      .from("hr_users")
      .update({ resume_url: resumeUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    console.log("User profile updated with resume URL");

    return NextResponse.json({
      success: true,
      message: "Resume uploaded successfully",
      resumeUrl: resumeUrl,
    });
  } catch (error) {
    console.error("Error in POST /api/resume/upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}