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
import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { ENV } from "./env";

export const authClient = createAuthClient({
  baseURL: ENV.frontendUrl,
  basePath: "/auth", // Aligned with server move
  plugins: [
    // ── Authentication ──
    phoneNumberClient(),
    twoFactorClient(),
    emailOTPClient(),
    usernameClient(),
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
    }),

    // ── Authorization ──
    adminClient(),
    organizationClient(),

    // ── Infrastructure ──
    apiKeyClient(),
    dashClient(),
    sentinelClient({
      autoSolveChallenge: true,
    }),
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
