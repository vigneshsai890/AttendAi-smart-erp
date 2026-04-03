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
  return process.env.BETTER_AUTH_SECRET || "SMART_ERP_SECRET_KEY_PROD_2024";
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
          clientId: process.env.GOOGLE_CLIENT_ID || "578621839531-ml1m45cvvtc3dptb8hq7dotd17kpk1oq.apps.googleusercontent.com",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
          apiKey: process.env.BETTER_AUTH_API_KEY || "ba_sc4do67zgf2fkiylhe09pmsmzth2mbfl",
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
          phoneNumber: { type: "string", required: false },
          phoneNumberVerified: { type: "boolean", defaultValue: false },
          isProfileComplete: { type: "boolean", defaultValue: false },
        }
      },
      session: { expiresIn: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
      trustedOrigins: [ENV.frontendUrl, "https://dash.better-auth.com"].filter(Boolean)
    });
  }
  return _auth;
};
