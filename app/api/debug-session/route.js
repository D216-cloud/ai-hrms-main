import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Debug route to understand session flow
export async function GET(request) {
  try {
    // Log all headers for debugging
    console.log("=== DEBUG SESSION API ROUTE ===");
    console.log("All headers:");
    for (const [key, value] of request.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Try to get session
    const session = await getServerSession(authOptions);
    
    console.log("Session object:", session);
    console.log("Session user:", session?.user);
    console.log("Session user role:", session?.user?.role);
    
    // Also try to get the raw cookie
    const cookieHeader = request.headers.get('cookie');
    console.log("Raw cookie header:", cookieHeader);
    
    if (!session) {
      return NextResponse.json({ 
        error: "No session found",
        cookieHeader: cookieHeader,
        session: null
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      message: "Session found",
      session: session,
      role: session.user?.role,
      userId: session.user?.id,
      cookieHeader: cookieHeader
    });
  } catch (error) {
    console.error("Error in debug session route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}