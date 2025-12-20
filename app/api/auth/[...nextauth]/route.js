import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Also re-export authOptions for any modules that import the NextAuth route directly
export { authOptions };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };