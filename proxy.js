import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Custom middleware function
export default function middleware(req) {
  const pathname = req.nextUrl.pathname;
  const method = req.method;

  // Log for debugging
  console.log("Custom Middleware - Pathname:", pathname);
  console.log("Custom Middleware - Method:", method);

  // Allow test-session endpoint for debugging
  if (pathname === "/api/test-session") {
    return NextResponse.next();
  }

  // Allow public GET requests to job API endpoints
  if (method === "GET" && (pathname === "/api/jobs" || /^\/api\/jobs\/[^\/]+$/.test(pathname))) {
    console.log("Custom Middleware - Allowing public access to job endpoint");
    return NextResponse.next();
  }

  // For all other routes, use withAuth
  return withAuth({
    callbacks: {
      authorized: ({ token }) => {
        console.log("Custom Middleware authorized callback - Token:", token);
        return !!token;
      },
    },
  })(req);
}

// Protect these routes with authentication
export const config = {
  matcher: [
    "/admin/:path*", // All admin routes require auth
    "/api/jobs/:path+", // All job API routes (except the base /api/jobs and specific job endpoints) require auth
    "/api/resume/:path+", // All resume API routes require auth
  ],
};