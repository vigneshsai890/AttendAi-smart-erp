import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
  // Suppress env var warnings at build time on Vercel
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "build-time-placeholder",
  },
};

export default nextConfig;
