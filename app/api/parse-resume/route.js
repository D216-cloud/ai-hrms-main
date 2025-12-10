import { NextResponse } from "next/server";
import { parseResume } from "@/lib/openai";
import { extractResumeText } from "@/lib/resumeParser";

// POST /api/parse-resume - Parse uploaded resume
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");

    console.log("Received file in parse-resume API:", {
      hasFile: !!file,
      fileName: file ? file.name : 'none',
      fileSize: file ? file.size : 0,
      fileType: file ? file.type : 'none'
    });

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Log file information for debugging
    console.log("File received for parsing:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file type with more flexible checking
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    
    const isFileTypeValid = validTypes.includes(file.type) || 
      file.type.includes("pdf") || 
      file.type.includes("wordprocessingml.document") || 
      file.type.includes("docx") ||
      file.type.includes("msword");
      
    console.log("API file type validation:", {
      fileType: file.type,
      isValid: isFileTypeValid,
      validTypes: validTypes
    });

    if (!isFileTypeValid) {
      return NextResponse.json(
        { 
          error: `Invalid file type: ${file.type}. Please upload PDF or DOCX`,
          receivedType: file.type,
          validTypes: validTypes
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log("Buffer created:", {
      bufferSize: buffer.length,
      bufferType: typeof buffer,
      isArrayBuffer: bytes instanceof ArrayBuffer,
      arrayBufferSize: bytes.byteLength
    });
    
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: "Failed to process file - empty buffer" },
        { status: 400 }
      );
    }

    console.log("File buffer created:", {
      bufferSize: buffer.length,
      fileType: file.type
    });

    // Extract text from PDF/DOCX with enhanced error handling
    let resumeText;
    try {
      resumeText = await extractResumeText(buffer, file.type);
    } catch (extractError) {
      console.error("Text extraction error:", extractError);
      
      // SPECIAL CASE: Handle "corrupted" files more gracefully
      // Often files flagged as "corrupted" are actually valid but use newer PDF features
      if (extractError.message.includes("corrupted") || extractError.message.includes("Corrupted") || 
          extractError.message.includes("Invalid PDF structure")) {
        console.log("Attempting to process 'corrupted' file as potentially valid...");
        
        // Try to extract at least some text
        try {
          // Create a minimal text representation from available metadata
          const fallbackText = `Candidate Resume
File Name: ${file.name}
File Size: ${file.size} bytes
Upload Date: ${new Date().toISOString()}
          
Please manually enter your information below as the system had difficulty parsing your resume file. 
This is common with certain PDF formats and does not indicate a problem with your actual resume.`;
          
          console.log("Using fallback text for 'corrupted' file");
          resumeText = fallbackText;
        } catch (fallbackError) {
          console.error("Fallback text creation failed:", fallbackError);
          // If even fallback fails, return a more helpful error
          return NextResponse.json(
            {
              error: "This PDF file format is not fully supported by our system. For best results, please convert your resume to DOCX format.",
              solution: "Convert your PDF to DOCX format using Microsoft Word, Google Docs, or an online converter.",
              details: extractError.message
            },
            { status: 400 }
          );
        }
      } else {
        // Handle other specific error cases
        if (extractError.message.includes("password")) {
          return NextResponse.json(
            {
              error: "Password-protected files are not supported. Please remove the password and try again.",
              details: extractError.message
            },
            { status: 400 }
          );
        } else if (extractError.message.includes("Invalid")) {
          return NextResponse.json(
            {
              error: "Invalid file format. Please ensure you're uploading a valid PDF or DOCX file.",
              details: extractError.message
            },
            { status: 400 }
          );
        } else if (extractError.message.includes("canvas") || extractError.message.includes("worker")) {
          return NextResponse.json(
            {
              error: "This file format requires additional dependencies. Please convert to DOCX format.",
              details: extractError.message
            },
            { status: 400 }
          );
        }
        
        // Generic error response
        return NextResponse.json(
          {
            error: extractError.message || "Failed to extract text from resume. Please ensure the file is not corrupted.",
            details: extractError.message,
            fileType: file.type,
            fileName: file.name,
            fileSize: file.size
          },
          { status: 400 }
        );
      }
    }

    // Validate that we got meaningful text
    if (!resumeText || resumeText.trim().length < 5) {
      // Even with "corrupted" files, we should have at least the fallback text
      return NextResponse.json(
        {
          error:
            "Could not extract sufficient text from resume. Please ensure the file contains readable text and is not a scanned image.",
          extractedTextLength: resumeText ? resumeText.length : 0,
          fileType: file.type,
          fileName: file.name,
          solution: "Try converting your file to DOCX format for better compatibility."
        },
        { status: 400 }
      );
    }

    console.log("Successfully extracted text. Length:", resumeText.length);

    // Parse resume with AI
    const parsedData = await parseResume(resumeText);

    // Return parsed data with the extracted text
    return NextResponse.json({
      ...parsedData,
      extractedText: resumeText, // Include raw text for debugging/matching
      textLength: resumeText.length,
    });
  } catch (error) {
    console.error("Error in POST /api/parse-resume:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to parse resume",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}