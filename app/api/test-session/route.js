import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Test route to debug session issues
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("Test session route - Session:", session);
    
    if (!session) {
      return NextResponse.json({ 
        error: "No session found", 
        session: null 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      message: "Session found", 
      session: session,
      role: session.user?.role,
      userId: session.user?.id
    });
  } catch (error) {
    console.error("Error in test session route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}