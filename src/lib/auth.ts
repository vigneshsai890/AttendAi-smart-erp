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
          const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
          console.log("[AUTH] Attempting login for:", credentials.email);
          console.log("[AUTH] Using backendUrl:", backendUrl);

          const endpoint = credentials.totp ? "/api/auth/verify-otp" : "/api/auth/login";
          const payload = credentials.totp
            ? { email: credentials.email, otp: credentials.totp }
            : { email: credentials.email, password: credentials.password };

          console.log("[AUTH] Endpoint:", endpoint);

          const res = await axios.post(`${backendUrl}${endpoint}`, payload, {
            timeout: 5000 // 5 second timeout
          });
          
          console.log("[AUTH] Backend response status:", res.status);
          const user = res.data;

          if (user.requiresOTP) {
            console.log("[AUTH] OTP_REQUIRED detected");
            console.log("[AUTH] THROWING OTP_REQUIRED"); throw new Error("OTP_REQUIRED");
          }

          console.log("[AUTH] Login successful for:", user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error: any) {
          console.error("[AUTH] Error in authorize:", error.message);
          if (error.response) {
            console.error("[AUTH] Error response status:", error.response.status);
            console.error("[AUTH] Error response data:", error.response.data);
          }
          
          if (error.message === "OTP_REQUIRED") throw error;
          
          const msg = error.response?.data?.error || error.message || "Invalid credentials";
          throw new Error(msg);
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
