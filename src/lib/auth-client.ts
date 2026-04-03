import { createAuthClient } from "better-auth/react";
import {
  phoneNumberClient,
  twoFactorClient,
  emailOTPClient,
  adminClient,
  oneTapClient,
  organizationClient,
  usernameClient
} from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
  plugins: [
    // ── Authentication ──
    phoneNumberClient(),
    twoFactorClient(),
    emailOTPClient(),
    usernameClient(),
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    }),

    // ── Authorization ──
    adminClient(),
    organizationClient(),

    // ── Infrastructure ──
    apiKeyClient()
  ]
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  getSession,
  updateUser
} = authClient;
