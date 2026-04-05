"use client";

import React from "react";

/**
 * Better Auth doesn't require a top-level context provider like NextAuth,
 * but we'll keep this as a simple wrapper for future global state or consistency.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
