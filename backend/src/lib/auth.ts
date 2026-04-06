import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import mongoose from "mongoose";
import type { Db } from "mongodb";
import {
  phoneNumber,
  twoFactor,
  emailOTP,
  admin,
  organization,
  username,
  oneTap
} from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { dash, sentinel, sendEmail } from "@better-auth/infra";
import { ENV } from "./env.js";
import { sendAWSSMS } from "./sms.js";

let _auth: any = null;

const getBetterAuthSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (ENV.isProduction && !secret) {
    console.error("🚨 [SECURITY WARNING] BETTER_AUTH_SECRET is missing. Ensure this is set in your Render dashboard.");
  }
  return secret || "SMART_ERP_SECRET_KEY_DEV_2024";
};

export const getAuth = () => {
  if (!_auth) {
    const db = mongoose.connection.db;
    if (mongoose.connection.readyState !== 1 || !db) {
      throw new Error("MongoDB not connected");
    }

    _auth = betterAuth({
      database: mongodbAdapter(db as unknown as Db),
      secret: getBetterAuthSecret(),
      baseURL: ENV.backendUrl,
      basePath: "/api/auth",
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || (ENV.isProduction ? "" : "dev_client_id"),
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || (ENV.isProduction ? "" : "dev_client_secret"),
          accessType: "offline",
          prompt: "select_account consent",
        }
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
          allowUserToCreateOrganization: async (user: any) => {
            return user.role === "ADMIN" || user.role === "FACULTY" || user.role === "HOD";
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
            return key || "ba_mzne3a7dpahwre7ybfx3n9js2l5v4khp";
          })(),
          security: {
            credentialStuffing: { enabled: true },
            impossibleTravel: { enabled: true, action: "challenge" },
            botBlocking: { action: "challenge" },
            compromisedPassword: { enabled: true, action: "block" },
            emailValidation: { enabled: true, action: "block" },
            velocity: { enabled: true, action: "challenge" },
            suspiciousIpBlocking: { action: "block" },
          }
        })
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
        }
      },
      session: { expiresIn: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
      trustedOrigins: ([
        ENV.frontendUrl,
        process.env.FRONTEND_URL,
        process.env.NEXT_PUBLIC_APP_URL,
        "https://dash.better-auth.com",
        "https://attendai-smart-erp.onrender.com",
        "https://attendai-backend-ynnd.onrender.com",
        "https://attendai-smart-erp-frontend.onrender.com",
        "https://attendai-smart-erp-backend.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
      ].filter(Boolean) as string[])
    });
  }
  return _auth;
};
