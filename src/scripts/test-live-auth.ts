import { createAuthClient } from "better-auth/client";
import {
  phoneNumberClient,
  usernameClient
} from "better-auth/client/plugins";
import * as dotenv from "dotenv";

dotenv.config();

// Test both frontend and backend
const FRONTEND_URL = "https://attendai-smart-erp.onrender.com";
const BACKEND_URL = "https://attendai-backend-ynnd.onrender.com";

async function testUrl(baseUrl: string) {
  console.log(`\n🚀 Testing Authentication on: ${baseUrl}`);

  const authClient = createAuthClient({
    baseURL: baseUrl,
    fetchOptions: {
      headers: {
        "Origin": baseUrl // Simulating same-origin request for the test
      }
    },
    plugins: [
      phoneNumberClient(),
      usernameClient()
    ]
  });

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
      console.error(`❌ Sign-up failed on ${baseUrl}:`, signUpError.message);
      console.error("Full Error Details:", JSON.stringify(signUpError, null, 2));
      return false;
    }

    console.log(`✅ Sign-up successful on ${baseUrl}!`);

    // 2. Attempt Sign In
    console.log(`🔐 Attempting sign-in for: ${testEmail}...`);
    const { data: signInData, error: signInError } = await authClient.signIn.email({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error(`❌ Sign-in failed on ${baseUrl}:`, signInError.message);
      console.error("Full Error Details:", JSON.stringify(signInError, null, 2));
      return false;
    }

    console.log(`✅ Sign-in successful on ${baseUrl}! Session established.`);
    return true;

  } catch (err: any) {
    console.error(`🚨 CRITICAL ERROR on ${baseUrl}:`, err.message);
    return false;
  }
}

async function runLiveTest() {
  console.log("🎬 Starting Live Industry-Grade Authentication Suite...");

  // Retry logic for Render cold starts/deployments
  let attempts = 0;
  const maxAttempts = 5;
  const delay = 30000; // 30 seconds

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n📡 Deployment Verification Attempt ${attempts}/${maxAttempts}...`);

    const frontendSuccess = await testUrl(FRONTEND_URL);
    const backendSuccess = await testUrl(BACKEND_URL);

    if (frontendSuccess || backendSuccess) {
      console.log("\n🎉 AT LEAST ONE SERVICE IS RESPONDING!");
      break;
    }

    if (attempts < maxAttempts) {
      console.log(`⏳ Waiting ${delay/1000}s for services to stabilize...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log("\n📊 --- FINAL TEST SUMMARY ---");
  console.log(`Frontend Auth: ${frontendSuccess ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`Backend Auth:  ${backendSuccess ? "✅ PASSED" : "❌ FAILED"}`);
}

runLiveTest();
