import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call backend API to validate credentials
          const formData = new URLSearchParams();
          formData.append("username", credentials.email);
          formData.append("password", credentials.password);

          const response = await axios.post(
            `${API_BASE_URL}/api/v1/auth/login`,
            formData,
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          if (response.data.access_token) {
            // Get user details
            const userResponse = await axios.get(
              `${API_BASE_URL}/api/v1/auth/me`,
              {
                headers: {
                  Authorization: `Bearer ${response.data.access_token}`,
                },
              }
            );

            return {
              id: userResponse.data.id,
              email: userResponse.data.email,
              name: userResponse.data.full_name,
              accessToken: response.data.access_token,
            };
          }

          return null;
        } catch (error) {
          // Authentication failed
          return null;
        }
      }
    }),
    // OAuth providers (optional - configure with env vars)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET ? [
      GithubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    ] : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    newUser: "/importers", // Redirect new users to importers page
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.accessToken = (user as any).accessToken;
        
        // For OAuth providers, create/sync user with backend
        if (account?.provider !== "credentials") {
          try {
            // Call backend to create/sync OAuth user
            const response = await axios.post(
              `${API_BASE_URL}/api/v1/auth/oauth/sync`,
              {
                email: user.email,
                name: user.name,
                provider: account?.provider,
                providerId: account?.providerAccountId,
              }
            );
            
            if (response.data.access_token) {
              token.accessToken = response.data.access_token;
              token.id = response.data.user.id;
            }
          } catch (error) {
            // OAuth sync failed - continue with existing token
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
        };
        (session as any).accessToken = token.accessToken;
      }
      
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};