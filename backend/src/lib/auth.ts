/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Lazy-initialized BetterAuth instance
let _auth: any = null;

// --- Production Secret Enforcement ---
const getBetterAuthSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (ENV.isProduction && !secret) {
    console.warn("⚠️ [SECURITY] BETTER_AUTH_SECRET is missing in backend production!");
  }
  return secret || "SMART_ERP_SECRET_KEY_PROD_2024";
};

export const getAuth = () => {
  if (!_auth) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB must be connected before initializing Better-Auth");
    }

    _auth = betterAuth({
      database: mongodbAdapter(mongoose.connection.db as unknown as Db),
      secret: getBetterAuthSecret(),
      baseURL: ENV.backendUrl,
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || "578621839531-ml1m45cvvtc3dptb8hq7dotd17kpk1oq.apps.googleusercontent.com",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          accessType: "offline",
          prompt: "select_account consent",
        }
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
            console.error("❌ [BACKEND AUTH] Failed to send verification email:", err);
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
            console.error("❌ [BACKEND AUTH] Failed to send reset password email:", err);
          }
        },
      },
      plugins: [
        phoneNumber({
          sendOTP: async ({ phoneNumber, code }) => {
            try {
              await sendAWSSMS({
                to: phoneNumber,
                code,
              });
            } catch (err) {
              console.error("❌ [BACKEND AUTH] Failed to send AWS SNS verification SMS:", err);
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
                variables: {
                  otpCode: otp,
                  userEmail: email,
                  appName: "AttendAI",
                },
              });
            } catch (err) {
              console.error("❌ [BACKEND AUTH] Failed to send verification OTP:", err);
            }
          },
        }),
        username(),
        oneTap(),
        admin(),
        organization({
          allowUserToCreateOrganization: async (user) => {
            // Only admins and faculty can create organizations (departments)
            const role = (user as Record<string, unknown>).role as string;
            return role === "ADMIN" || role === "FACULTY" || role === "HOD";
          },
        }),
        apiKey(),
        dash({
          apiKey: process.env.BETTER_AUTH_API_KEY as string,
          activityTracking: {
            enabled: true,
            updateInterval: 300000,
          },
        }),
        sentinel({
          apiKey: process.env.BETTER_AUTH_API_KEY as string,
          security: {
            credentialStuffing: {
              enabled: true,
              thresholds: { challenge: 3, block: 5 },
              windowSeconds: 3600,
              cooldownSeconds: 900,
            },
            impossibleTravel: {
              enabled: true,
              maxSpeedKmh: 1000,
              action: "challenge",
            },
            botBlocking: { action: "challenge" },
            compromisedPassword: {
              enabled: true,
              action: "block",
              minBreachCount: 1,
            },
            emailValidation: {
              enabled: true,
              strictness: "medium",
              action: "block",
            },
            velocity: {
              enabled: true,
              maxSignupsPerVisitor: 5,
              maxPasswordResetsPerIp: 10,
              maxSignInsPerIp: 50,
              windowSeconds: 3600,
              action: "challenge",
            },
            suspiciousIpBlocking: { action: "block" },
          }
        })
      ],
      user: {
        additionalFields: {
          role: { type: "string", defaultValue: "STUDENT", required: false },
          studentId: { type: "string", required: false },
          regId: { type: "string", required: false },
          specialization: { type: "string", required: false },
          department: { type: "string", required: false },
          isProfileComplete: { type: "boolean", defaultValue: false },
          phoneNumber: { type: "string", required: false },
          phoneNumberVerified: { type: "boolean", defaultValue: false },
          lastActiveAt: { type: "date" }
        }
      },
      session: {
        expiresIn: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // Refresh once per day
      },
      trustedOrigins: [
        ENV.frontendUrl,
        "https://dash.better-auth.com",
      ].filter(Boolean)
    });
  }
  return _auth;
};
