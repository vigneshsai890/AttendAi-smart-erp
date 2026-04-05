import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import {
  phoneNumber,
  twoFactor,
  emailOTP,
  admin,
  oneTap,
  organization,
  username
} from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { dash, sentinel, sendEmail } from "@better-auth/infra";
import { MongoClient } from "mongodb";
import { ENV } from "./env";
import { sendAWSSMS } from "./sms";

// --- Lazy Auth & Mongo Initialization ---
let _auth: any = null; // BetterAuth instance is complex, keeping any for now to avoid deep type issues
let _client: MongoClient | null = null;

const getBetterAuthSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (ENV.isProduction && !secret && !isBuild) {
    throw new Error("🚨 [SECURITY CRITICAL] BETTER_AUTH_SECRET must be set in production!");
  }
  return secret || "SMART_ERP_SECRET_KEY_DEV_2024";
};

export const getAuth = async () => {
  if (!_auth) {
    // 1. Ensure DB connection
    if (!_client) {
      const uri = process.env.MONGO_URI;
      const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
      if (ENV.isProduction && !uri && !isBuild) {
        throw new Error("🚨 [SECURITY CRITICAL] MONGO_URI must be set in production!");
      }
      _client = new MongoClient(uri || "mongodb+srv://dev_user:dev_pass@cluster.mongodb.net/dev_db");
      await _client.connect();
    }
    const db = _client.db();

    // 2. Initialize Better Auth with real DB object
    _auth = betterAuth({
      database: mongodbAdapter(db),
      secret: getBetterAuthSecret(),
      baseURL: ENV.frontendUrl,
      basePath: "/auth",
      emailVerification: {
        sendOnSignUp: false, // Set to false to allow immediate login after signup for demo
      },
      emailAndPassword: {
        enabled: true,
      },
      plugins: [
        phoneNumber({
          sendOTP: async ({ phoneNumber, code }) => {
            try {
              await sendAWSSMS({ to: phoneNumber, code });
            } catch (err) {
              console.error("❌ [AUTH] Failed to send AWS SNS verification SMS:", err);
            }
          },
          signUpOnVerification: {
            getTempEmail: (phone) => `${phone.replace("+", "")}@apollo.erp`,
            getTempName: (phone) => `User ${phone}`,
          },
        }),
        twoFactor(),
        emailOTP({
          async sendVerificationOTP({ email, otp }) {
            try {
              await sendEmail({
                template: "verify-email-otp",
                to: email,
                variables: { otpCode: otp, userEmail: email, appName: "AttendAI" },
              });
            } catch (err) {
              console.error("❌ [AUTH] Failed to send verification OTP:", err);
            }
          },
        }),
        username(),
        admin(),
        organization({
          allowUserToCreateOrganization: async (user) => {
            const role = (user as Record<string, unknown>).role as string;
            return role === "ADMIN" || role === "FACULTY" || role === "HOD";
          },
        }),
        apiKey(),
        dash(),
        sentinel({
          apiKey: (() => {
            const key = process.env.BETTER_AUTH_API_KEY;
            if (ENV.isProduction && !key) {
              console.warn("⚠️ [BRIDGE] BETTER_AUTH_API_KEY is missing, Sentinel dashboard sync may fail.");
            }
            return key || "";
          })(),
          security: {
            credentialStuffing: { enabled: true },
            impossibleTravel: { enabled: true, action: "challenge" },
            botBlocking: { action: "challenge" },
            compromisedPassword: { enabled: true, action: "block" },
            emailValidation: { enabled: true, action: "block" },
            velocity: { enabled: true, action: "challenge" },
            suspiciousIpBlocking: { action: "block" },
          },
        }),
      ],
      user: {
        additionalFields: {
          role: { type: "string", defaultValue: "STUDENT" },
          studentId: { type: "string", required: false },
          regId: { type: "string", required: false },
          specialization: { type: "string", required: false },
          department: { type: "string", required: false },
          isProfileComplete: { type: "boolean", defaultValue: false },
          phoneNumber: { type: "string", required: false },
          phoneNumberVerified: { type: "boolean", defaultValue: false },
          lastActiveAt: { type: "date" },
        },
      },
      session: { expiresIn: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
      trustedOrigins: ([
        ENV.frontendUrl,
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.FRONTEND_URL,
        process.env.BETTER_AUTH_URL,
        "https://dash.better-auth.com",
        "https://attendai-smart-erp.onrender.com",
        "https://attendai-backend-ynnd.onrender.com",
        "https://attendai-smart-erp-frontend.onrender.com",
        "https://attendai-smart-erp-backend.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5001",
        "http://127.0.0.1:5001"
      ].filter(Boolean) as string[]),
    });
  }
  return _auth;
};
