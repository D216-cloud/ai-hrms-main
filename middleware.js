import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
    try {
        const { pathname } = req.nextUrl;

        // Only protect /admin routes
        // The matcher in config handles this, but we double check here for safety
        if (pathname.startsWith("/admin")) {
            const token = await getToken({
                req,
                secret: process.env.NEXTAUTH_SECRET,
                secureCookie: process.env.NODE_ENV === "production",
            });

            if (!token) {
                const url = new URL("/auth/signin", req.url);
                url.searchParams.set("callbackUrl", encodeURI(req.url));
                return NextResponse.redirect(url);
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.error("Middleware error:", error);
        // In case of error, allow the request to proceed to avoid blocking the site
        // but log the error for debugging
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        "/admin/:path*",
    ],
};
