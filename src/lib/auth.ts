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
import { MongoClient, Db } from "mongodb";
import { ENV } from "./env";
import { sendAWSSMS } from "./sms";

// --- Lazy Auth & Mongo Initialization ---
let _auth: any = null;
let _client: MongoClient | null = null;

const getBetterAuthSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (ENV.isProduction && !secret) {
    console.warn("⚠️ [BRIDGE] Using internal token as BETTER_AUTH_SECRET fallback.");
    return ENV.internalToken;
  }
  return secret || "SMART_ERP_SECRET_KEY_DEV_2024";
};

export const getAuth = async () => {
  if (!_auth) {
    // 1. Ensure DB connection
    if (!_client) {
      const uri = process.env.MONGO_URI || "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";
      if (ENV.isProduction && !process.env.MONGO_URI) {
        console.warn("⚠️ [BRIDGE] Using production fallback MONGO_URI.");
      }
      _client = new MongoClient(uri);
      await _client.connect();
    }
    const db = _client.db();

    // 2. Initialize Better Auth with real DB object
    _auth = betterAuth({
      database: mongodbAdapter(db),
      secret: getBetterAuthSecret(),
      baseURL: ENV.frontendUrl,
      basePath: "/auth",
      socialProviders: {
        google: {
          clientId: (() => {
            const id = process.env.GOOGLE_CLIENT_ID;
            if (ENV.isProduction && !id) {
              throw new Error("❌ [FATAL] GOOGLE_CLIENT_ID missing in production!");
            }
            return id || "";
          })(),
          clientSecret: (() => {
            const secret = process.env.GOOGLE_CLIENT_SECRET;
            if (ENV.isProduction && !secret) {
              throw new Error("❌ [FATAL] GOOGLE_CLIENT_SECRET missing in production!");
            }
            return secret || "";
          })(),
          accessType: "offline",
          prompt: "select_account consent",
        },
        microsoft: {
          clientId: process.env.MICROSOFT_CLIENT_ID as string,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
          tenantId: "common",
          prompt: "select_account",
        },
      },
      emailVerification: {
        sendOnSignUp: true,
        async sendVerificationEmail({ user, url }) {
          try {
            await sendEmail({
              template: "verify-email",
              to: user.email,
              variables: {
                verificationUrl: url,
                userEmail: user.email,
                userName: user.name,
                appName: "AttendAI",
              },
            });
          } catch (err) {
            console.error("❌ [AUTH] Failed to send verification email:", err);
          }
        },
      },
      emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url }) {
          try {
            await sendEmail({
              template: "reset-password",
              to: user.email,
              variables: {
                resetLink: url,
                userEmail: user.email,
                userName: user.name,
                appName: "AttendAI",
              },
            });
          } catch (err) {
            console.error("❌ [AUTH] Failed to send reset password email:", err);
          }
        },
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
        oneTap(),
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
              throw new Error("❌ [FATAL] BETTER_AUTH_API_KEY missing in production!");
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
      trustedOrigins: [ENV.frontendUrl, "https://dash.better-auth.com"].filter(Boolean),
    });
  }
  return _auth;
};

