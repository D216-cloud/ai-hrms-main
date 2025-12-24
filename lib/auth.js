import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';

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
        role: { label: "Role", type: "text" } // Added role field
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
          
          // Determine role - default to 'hr' but allow 'job_seeker' if specified
          const role = credentials.role === 'job_seeker' ? 'job_seeker' : 'hr';
          
          // Create new user
          const { data: newUser, error: insertError } = await supabaseAdmin
            .from("hr_users")
            .insert([
              {
                email: credentials.email,
                name: credentials.email.split("@")[0], // Use email prefix as name
                role: role,
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
          id: user.id, // This should be a UUID
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
    async jwt({ token, user, account, profile }) {
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
            // Generate a proper UUID for the user
            const userId = uuidv4();
            
            // Determine role based on email domain or other criteria
            // For now, we'll default to 'job_seeker' for Google OAuth users
            // unless they're specifically added as HR users
            const role = "job_seeker"; // Default to job seeker for Google users
            
            const { data: newUser, error: insertError } = await supabaseAdmin
              .from("hr_users")
              .insert([
                {
                  id: userId, // Explicitly set the UUID
                  email: user.email,
                  name: user.name || user.email.split("@")[0],
                  role: role,
                  password_hash: "google-auth-user", // Placeholder for Google users
                  is_active: true
                }
              ])
              .select()
              .single();

            if (!insertError && newUser) {
              token.role = newUser.role;
              token.id = newUser.id; // This will now be a proper UUID
              
              // Also create entry in job_seekers table if role is job_seeker
              if (newUser.role === "job_seeker") {
                await supabaseAdmin
                  .from("job_seekers")
                  .insert([
                    {
                      auth_id: newUser.id,
                      email: newUser.email,
                      full_name: newUser.name || newUser.email.split("@")[0],
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }
                  ]);
              }
            } else {
              console.error("Failed to create Google user in hr_users:", insertError);
              // Try to fetch again in case of race condition
              const { data: retryUser } = await supabaseAdmin
                .from("hr_users")
                .select("*")
                .eq("email", user.email)
                .single();
              
              if (retryUser) {
                token.role = retryUser.role;
                token.id = retryUser.id; // This should be a UUID
                
                // Also create entry in job_seekers table if role is job_seeker
                if (retryUser.role === "job_seeker") {
                  await supabaseAdmin
                    .from("job_seekers")
                    .insert([
                      {
                        auth_id: retryUser.id,
                        email: retryUser.email,
                        full_name: retryUser.name || retryUser.email.split("@")[0],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }
                    ]);
                }
              } else {
                // Last resort fallback - generate a UUID
                token.role = "job_seeker"; // Default to job seeker for Google users
                token.id = uuidv4(); // Generate a proper UUID
                
                // Create entry in job_seekers table
                await supabaseAdmin
                  .from("job_seekers")
                  .insert([
                    {
                      auth_id: token.id,
                      email: user.email,
                      full_name: user.name || user.email.split("@")[0],
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }
                  ]);
              }
            }
          } else {
            // User exists, assign role and ID
            token.role = existingUser.role;
            token.id = existingUser.id; // This should be a UUID
            
            // Also ensure entry exists in job_seekers table if role is job_seeker
            if (existingUser.role === "job_seeker") {
              // Check if job seeker profile exists
              let { data: existingSeeker } = await supabaseAdmin
                .from("job_seekers")
                .select("id")
                .eq("email", existingUser.email)
                .single();
              
              // If not, create it
              if (!existingSeeker) {
                await supabaseAdmin
                  .from("job_seekers")
                  .insert([
                    {
                      auth_id: existingUser.id,
                      email: existingUser.email,
                      full_name: existingUser.name || existingUser.email.split("@")[0],
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }
                  ]);
              }
            }
          }
        } 
        // For credential users
        else {
          token.role = user.role;
          token.id = user.id; // This should be a UUID
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id; // This will now be a proper UUID
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        // Redirect HR users to admin dashboard after login
        if (url.includes('callback') || url.includes('signin')) {
          // For this to work properly, we need to check the session in a different way
          // The token is not available here, so we'll default to baseUrl + url
          // The actual redirect to dashboard happens in the frontend after login
          return `${baseUrl}${url}`;
        }
        return `${baseUrl}${url}`;
      }
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