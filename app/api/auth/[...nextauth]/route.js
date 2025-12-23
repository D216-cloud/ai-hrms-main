import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Also re-export authOptions for any modules that import the NextAuth route directly
export { authOptions };

// Create the handler once
const handler = NextAuth(authOptions);

// Helper to log useful debugging info in production
async function logAuthDiagnostics(req) {
  try {
    const origin = new URL(req.url).origin;
    console.log("NextAuth route invoked - origin:", origin);
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log("NEXTAUTH_SECRET set:", !!process.env.NEXTAUTH_SECRET);

    if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL !== origin) {
      console.warn("NEXTAUTH_URL does not match request origin. This can cause cookies or callbacks to fail. Expected:", process.env.NEXTAUTH_URL, "Received:", origin);
    }

    // Log request cookies to help debug missing Set-Cookie issues
    try {
      console.log("NextAuth route - Request cookies:", req.headers.get("cookie"));
    } catch (err) {
      console.log("NextAuth route - Could not read cookies", err);
    }
  } catch (err) {
    // Non-fatal; log for debugging
    console.error("Error while logging NextAuth diagnostics:", err);
  }
}

// Wrap GET and POST to add diagnostics before calling NextAuth
export async function GET(req) {
  if (process.env.NEXTAUTH_DEBUG === "true") await logAuthDiagnostics(req);
  return handler(req);
}

export async function POST(req) {
  if (process.env.NEXTAUTH_DEBUG === "true") await logAuthDiagnostics(req);
  return handler(req);
}
