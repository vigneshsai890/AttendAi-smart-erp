import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI || "";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const client = new MongoClient(MONGO_URI);
        try {
          await client.connect();
          const db = client.db();
          // Look in 'user' collection (matching Better Auth's legacy or current setup)
          const user = await db.collection("user").findOne({ email: credentials.email });

          if (!user || !user.passwordHash) {
            throw new Error("No user found with this email");
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || "STUDENT",
            isProfileComplete: user.isProfileComplete || false,
          };
        } finally {
          await client.close();
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.isProfileComplete = (user as any).isProfileComplete;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).isProfileComplete = token.isProfileComplete;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.BETTER_AUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  }
};
