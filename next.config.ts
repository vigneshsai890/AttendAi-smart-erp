import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs"],
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
