import { createAuthClient } from "better-auth/client";
import { phoneNumberClient, twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    phoneNumberClient(),
    twoFactorClient()
  ]
});

export const { useSession, signIn, signUp, signOut, getSession, updateUser } = authClient;
