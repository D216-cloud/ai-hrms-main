import { NextResponse } from "next/server";
import { generateJobDescription } from "@/lib/openai";

// Test route for OpenAI job description generation
export async function POST(request) {
  try {
    console.log("=== TEST OPENAI JD GENERATION ===");
    
    const body = await request.json();
    console.log("Request body:", body);
    
    // Test with minimal data
    const testData = {
      title: body.title || "Software Engineer",
      location: body.location || "Remote",
      experienceMin: body.experienceMin || 2,
      experienceMax: body.experienceMax || 5,
      skills: body.skills || ["JavaScript", "React"],
    };
    
    console.log("Test data:", testData);
    
    // Try to generate job description
    const description = await generateJobDescription(testData);
    console.log("Generated description length:", description?.length);
    
    return NextResponse.json({ 
      message: "OpenAI test successful", 
      description: description?.substring(0, 200) + "...",
      fullDescriptionLength: description?.length
    });
  } catch (error) {
    console.error("Error in OpenAI test route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}