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
  plugins: [
    // ── Authentication ──
    phoneNumberClient(),
    twoFactorClient(),
    emailOTPClient(),
    usernameClient(),
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "578621839531-ml1m45cvvtc3dptb8hq7dotd17kpk1oq.apps.googleusercontent.com",
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
