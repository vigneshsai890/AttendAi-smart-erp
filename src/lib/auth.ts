import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "student@college.edu" },
        password: { label: "Password", type: "password" },
        totp: { label: "OTP", type: "text", optional: true }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        try {
          const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

          // If OTP is provided, verify it, otherwise check credentials
          const endpoint = credentials.totp ? "/api/auth/verify-otp" : "/api/auth/login";
          const payload = credentials.totp
            ? { email: credentials.email, otp: credentials.totp }
            : { email: credentials.email, password: credentials.password };

          const res = await axios.post(`${backendUrl}${endpoint}`, payload);
          const user = res.data;

          if (user.requiresOTP) {
            throw new Error("OTP_REQUIRED");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error: any) {
          if (error.message === "OTP_REQUIRED") throw error;
          throw new Error(error.response?.data?.error || "Invalid credentials");
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
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecretkey123",
};
