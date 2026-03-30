import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { backend } from "./backend";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days session persistence
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "OTP", type: "text", optional: true }
      },
      async authorize(credentials) {
        // ULTRAMAX Input Validation
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing required credentials");
        }

        try {
          const endpoint = credentials.totp ? "/auth/verify-otp" : "/auth/login";
          const payload = credentials.totp
            ? { email: credentials.email, otp: credentials.totp }
            : { email: credentials.email, password: credentials.password };

          /**
           * Using the hardened backend proxy with ULTRAMAX Retry Logic.
           * This specifically solves ECONNREFUSED by retrying on transient failures.
           */
          const res = await backend.post(endpoint, payload);
          const user = res.data;

          if (user.requiresOTP) {
            // Signal frontend to transition to OTP input state
            throw new Error("OTP_REQUIRED");
          }

          if (!user.id || !user.role) {
            console.error("[AUTH_PROTOCOL_ERROR] Backend returned invalid user object:", user);
            throw new Error("SERVER_PROTOCOL_MISMATCH");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error: any) {
          // Robust signal propagation
          if (error.message === "OTP_REQUIRED") throw error;

          const errorMsg = error.response?.data?.error || error.message || "Authentication failed";
          console.error(`[AUTH_FAILURE] Entity: ${credentials.email} | Reason: ${errorMsg}`);
          throw new Error(errorMsg);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecretkey123",
};
