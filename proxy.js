import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Custom middleware function with proper NextAuth integration
export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const method = req.method;

    // Log for debugging
    console.log("Custom Middleware - Pathname:", pathname);
    console.log("Custom Middleware - Method:", method);

    // Allow test-session endpoint for debugging
    if (pathname === "/api/test-session") {
      return NextResponse.next();
    }

    // Allow public GET requests to job API endpoints (job listing and job detail) - exclude apply endpoint
    if (method === "GET" && pathname.startsWith("/api/jobs") && pathname !== "/api/jobs" && !pathname.includes("/apply")) {
      console.log("Custom Middleware - Allowing public access to job endpoint");
      return NextResponse.next();
    }

    // Allow public POST to apply for a job (candidates can submit applications without auth)
    if (method === "POST" && /^\/api\/jobs\/[^\/]+\/apply$/.test(pathname)) {
      console.log("Custom Middleware - Allowing public access to job apply endpoint");
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log("Custom Middleware authorized callback - Token:", token);
        // Allow access to admin routes only for users with 'hr' or 'admin' role
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token && (token.role === 'hr' || token.role === 'admin');
        }
        // For other protected routes, just check if authenticated
        return !!token;
      },
    },
  }
);

// Protect these routes with authentication
export const config = {
  matcher: [
    "/admin/:path*", // All admin routes require auth
    "/api/jobs/:path+", // All job API routes (except the base /api/jobs and specific job endpoints) require auth
    "/api/resume/:path+", // All resume API routes require auth
  ],
};