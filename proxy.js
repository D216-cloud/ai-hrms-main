import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ENABLE_ADMIN_BYPASS = process.env.ENABLE_ADMIN_BYPASS === "true";

// Custom middleware function
export default function middleware(req) {
  const pathname = req.nextUrl.pathname;
  const method = req.method;

  // Log for debugging
  console.log("Custom Middleware - Pathname:", pathname);
  console.log("Custom Middleware - Method:", method);

  // Optional admin bypass (useful temporarily while debugging production auth issues)
  if (ENABLE_ADMIN_BYPASS && pathname.startsWith("/admin")) {
    console.log("Custom Middleware - Admin bypass enabled (ENV)");
    return NextResponse.next();
  }

  // Allow test-session endpoint for debugging
  if (pathname === "/api/test-session") {
    return NextResponse.next();
  }

  // Allow public GET requests to job API endpoints (job listing and job detail)
  if (method === "GET" && (pathname === "/api/jobs" || /^\/api\/jobs\/[^\/]+$/.test(pathname))) {
    console.log("Custom Middleware - Allowing public access to job endpoint");
    return NextResponse.next();
  }

  // Allow public access to job apply endpoint for all methods (handle POST and preflight OPTIONS)
  // Fixed the regex pattern to properly match the apply route
  if (/^\/api\/jobs\/[^\/]+\/apply$/.test(pathname)) {
    // Add detailed debug logs for production diagnostics (only for apply route)
    console.log("Custom Middleware - Bypassing apply endpoint (ALL methods)", {
      pathname,
      method,
      origin: req.headers.get("origin"),
      contentType: req.headers.get("content-type"),
      userAgent: req.headers.get("user-agent") ? req.headers.get("user-agent").slice(0, 80) : undefined,
    });

    // If it's an OPTIONS preflight, respond immediately with 204 No Content
    if (method === "OPTIONS") {
      // Include common CORS headers so preflight requests are explicitly allowed in production
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      };
      console.log("Custom Middleware - Responding to preflight (OPTIONS)", { pathname, origin: req.headers.get("origin") });
      return new NextResponse(null, { status: 204, headers });
    }

    return NextResponse.next();
  }

  // For all other routes, use withAuth with an async authorized callback that falls back to getToken
  return withAuth({
    callbacks: {
      authorized: async ({ token, req }) => {
        console.log("Custom Middleware authorized callback - Token:", token);

        // If token exists, allow
        if (token) return true;

        // Attempt to parse token using getToken as a fallback (helps when cookie name or parsing differs)
        try {
          const { getToken } = await import("next-auth/jwt");
          const parsed = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
          console.log("Custom Middleware - getToken fallback result:", parsed);
          if (parsed) return true;
        } catch (err) {
          console.log("Custom Middleware - getToken fallback failed:", err);
        }

        // If still no token, log cookies to aid diagnosis and deny
        try {
          console.log("Custom Middleware - Request Cookies:", req.headers.get("cookie"));
        } catch (err) {
          console.log("Custom Middleware - Failed to read request cookies", err);
        }

        return false;
      },
    },
  })(req);
}

// Protect these routes with authentication
export const config = {
  matcher: [
    "/admin/:path*", // All admin routes require auth
    "/api/jobs/:path*", // All job API routes require auth
  ],
};