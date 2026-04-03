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

export const getAuth = async () => {
  if (!_auth) {
    // 1. Ensure DB connection
    if (!_client) {
      const uri = process.env.MONGO_URI || "mongodb://localhost:27017/smart_erp_realtime";
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
            if (ENV.isProduction && !id) throw new Error("❌ [SECURITY CRITICAL] GOOGLE_CLIENT_ID is missing in production!");
            return id || "578621839531-ml1m45cvvtc3dptb8hq7dotd17kpk1oq.apps.googleusercontent.com";
          })(),
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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
          apiKey: process.env.BETTER_AUTH_API_KEY || "ba_sc4do67zgf2fkiylhe09pmsmzth2mbfl",
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

