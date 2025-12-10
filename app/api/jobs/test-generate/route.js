import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Test route for job description generation
export async function POST(request) {
  try {
    console.log("=== TEST GENERATE JD API ROUTE ===");
    
    // Log all headers
    console.log("All headers:");
    for (const [key, value] of request.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Get session
    const session = await getServerSession(authOptions);
    console.log("Session:", session);
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    if (session.user.role !== "hr" && session.user.role !== "admin") {
      console.log("Invalid role:", session.user.role);
      return NextResponse.json({ error: "Unauthorized - Invalid role" }, { status: 401 });
    }
    
    // Just return a simple success response for testing
    return NextResponse.json({ 
      message: "Authorized successfully", 
      session: session,
      role: session.user.role
    });
  } catch (error) {
    console.error("Error in test generate JD route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}