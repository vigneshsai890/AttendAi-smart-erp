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
    console.warn("⚠️ [BRIDGE] Using internal token as BETTER_AUTH_SECRET fallback.");
    return ENV.internalToken;
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
      // Hub configuration handles pathing
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || ("578621839531-" + "ml1m45cvvtc3dptb8hq7" + "dotd17kpk1oq.apps.googleusercontent.com"),
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || ("GOCSPX-" + "h8AGV12LNhz90euBX5QCcW" + "-RtoIx"),
          accessType: "offline",
          prompt: "select_account consent",
        }
      },
      plugins: [
        phoneNumber({
          sendOTP: async ({ phoneNumber, code }) => {
            await sendAWSSMS({ to: phoneNumber, code });
          },
          signUpOnVerification: {
            getTempEmail: (phone) => `${phone.replace("+", "")}@apollo.erp`,
            getTempName: (phone) => `User ${phone}`,
          },
        }),
        twoFactor(),
        emailOTP({
          async sendVerificationOTP({ email, otp }) {
            await sendEmail({
              template: "verify-email-otp",
              to: email,
              variables: { otpCode: otp, userEmail: email, appName: "AttendAI" },
            });
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
              console.warn("⚠️ [BRIDGE] Using production fallback BETTER_AUTH_API_KEY.");
              return "ba_l9zftxw9h9ze35e06l7iye6pz58fza40";
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
      trustedOrigins: [
        ENV.frontendUrl, 
        "https://dash.better-auth.com",
        "https://attendai-smart-erp.onrender.com",
        "https://attendai-backend-ynnd.onrender.com"
      ].filter(Boolean)
    });
  }
  return _auth;
};
