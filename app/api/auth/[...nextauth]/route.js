import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// Open Authentication System
// - Anyone can login
// - Users are created automatically if they don't exist
// - All users get 'hr' role by default

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password");
        }

        // Check if user already exists
        let { data: user, error: fetchError } = await supabaseAdmin
          .from("hr_users")
          .select("*")
          .eq("email", credentials.email)
          .eq("is_active", true)
          .single();

        // If user doesn't exist, create them automatically
        if (fetchError || !user) {
          // Hash the password
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(credentials.password, saltRounds);
          
          // Create new user with default 'hr' role
          const { data: newUser, error: insertError } = await supabaseAdmin
            .from("hr_users")
            .insert([
              {
                email: credentials.email,
                name: credentials.email.split("@")[0], // Use email prefix as name
                role: "hr",
                password_hash: hashedPassword,
                is_active: true
              }
            ])
            .select()
            .single();

          if (insertError) {
            throw new Error("Failed to create user account");
          }
          
          user = newUser;
        } else {
          // Verify password for existing user
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValid) {
            throw new Error("Invalid email or password");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // If user is signing in for the first time
      if (user) {
        // For Google OAuth users
        if (account?.provider === "google") {
          // Check if user already exists in our HR database
          let { data: existingUser, error: fetchError } = await supabaseAdmin
            .from("hr_users")
            .select("*")
            .eq("email", user.email)
            .eq("is_active", true)
            .single();

          // If user doesn't exist, create them automatically
          if (fetchError || !existingUser) {
            const { data: newUser, error: insertError } = await supabaseAdmin
              .from("hr_users")
              .insert([
                {
                  email: user.email,
                  name: user.name || user.email.split("@")[0],
                  role: "hr",
                  password_hash: "google-auth-user", // Placeholder for Google users
                  is_active: true
                }
              ])
              .select()
              .single();

            if (!insertError && newUser) {
              token.role = newUser.role;
              token.id = newUser.id;
            } else {
              // Fallback role if creation fails
              token.role = "hr";
              token.id = null;
            }
          } else {
            // User exists, assign role and ID
            token.role = existingUser.role;
            token.id = existingUser.id;
          }
        } 
        // For credential users
        else {
          token.role = user.role;
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin?error=invalid",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Ensure cookies work properly across subdomains
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };