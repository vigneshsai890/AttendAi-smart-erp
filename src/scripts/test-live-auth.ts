import { createAuthClient } from "better-auth/client";
import {
  phoneNumberClient,
  usernameClient
} from "better-auth/client/plugins";
import * as dotenv from "dotenv";

dotenv.config();

// Target your actual Render production site
const BASE_URL = "https://attendai-smart-erp.onrender.com";

const authClient = createAuthClient({
  baseURL: BASE_URL,
  plugins: [
    phoneNumberClient(),
    usernameClient()
  ]
});

async function runLiveTest() {
  console.log(`🚀 Initiating Live Authentication Test on: ${BASE_URL}`);

  const testEmail = `test_agent_${Date.now()}@attendai-production.com`;
  const testPassword = "MaxPowerPassword123!";
  const testName = "Agent Alpha";

  try {
    // 1. Attempt Sign Up
    console.log(`📝 Attempting sign-up for: ${testEmail}...`);
    const { data: signUpData, error: signUpError } = await authClient.signUp.email({
      email: testEmail,
      password: testPassword,
      name: testName,
      username: `agent_${Date.now()}`
    });

    if (signUpError) {
      console.error("❌ Sign-up failed:", signUpError.message);
      console.error("Full Error Details:", JSON.stringify(signUpError, null, 2));
      return;
    }

    console.log("✅ Sign-up successful!");

    // 2. Attempt Sign In
    console.log(`🔐 Attempting sign-in for: ${testEmail}...`);
    const { data: signInData, error: signInError } = await authClient.signIn.email({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error("❌ Sign-in failed:", signInError.message);
      console.error("Full Error Details:", JSON.stringify(signInError, null, 2));
      return;
    }

    console.log("✅ Sign-in successful! Session established.");

    // 3. Verify Session
    const { data: session } = await authClient.getSession();
    if (session) {
      console.log("🎉 VERIFIED: Successfully logged into the AttendAI Dashboard!");
      console.log("User Profile:", JSON.stringify(session.user, null, 2));
    } else {
      console.error("❌ Session verification failed.");
    }

  } catch (err: any) {
    console.error("🚨 CRITICAL ERROR during live auth test:", err.message);
  }
}

runLiveTest();
