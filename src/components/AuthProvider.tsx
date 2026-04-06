"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

/**
 * NextAuth Session Provider for client-side auth state.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
