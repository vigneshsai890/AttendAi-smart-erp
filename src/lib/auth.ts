import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
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
import { dash, sentinel, sendEmail, sendSMS } from "@better-auth/infra";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017/smart_erp_realtime");
const db = client.db();

// Auth instance initialized with MongoDB

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: "https://attend-ai-smart-erp.vercel.app",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_GOOGLE_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "PLACEHOLDER_GOOGLE_SECRET",
      accessType: "offline",
      prompt: "select_account consent",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "PLACEHOLDER_MICROSOFT_ID",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "PLACEHOLDER_MICROSOFT_SECRET",
      tenantId: "common",
      prompt: "select_account",
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ user, url }) {
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
    },
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
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
    },
  },
  plugins: [
    // ── Authentication Plugins ────────────────────────────
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        await sendSMS({
          to: phoneNumber,
          code,
          template: "phone-verification",
        });
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
          variables: {
            otpCode: otp,
            userEmail: email,
            appName: "AttendAI",
          },
        });
      },
    }),
    username(),
    oneTap(),

    // ── Authorization Plugins ────────────────────────────
    admin(),
    organization({
      allowUserToCreateOrganization: async (user) => {
        // Only admins and faculty can create organizations (departments)
        const role = (user as Record<string, unknown>).role as string;
        return role === "ADMIN" || role === "FACULTY" || role === "HOD";
      },
    }),

    // ── Infrastructure Plugins ────────────────────────────
    apiKey(),
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
      activityTracking: {
        enabled: true,
        updateInterval: 300000, 
      },
    }),
    sentinel({
      apiKey: process.env.BETTER_AUTH_API_KEY,
      security: {
        // Credential Stuffing: block brute-force login attempts
        credentialStuffing: {
          enabled: true,
          thresholds: { challenge: 3, block: 5 },
          windowSeconds: 3600,
          cooldownSeconds: 900,
        },
        // Impossible Travel: flag if a student logs in from 2 cities too fast
        impossibleTravel: {
          enabled: true,
          maxSpeedKmh: 1000,
          action: "challenge",
        },
        // Bot Detection: block automated attendance marking
        botBlocking: { action: "challenge" },
        // Compromised Password: warn users with leaked passwords
        compromisedPassword: {
          enabled: true,
          action: "block",
          minBreachCount: 1,
        },
        // Email Validation: only accept high-quality email domains
        emailValidation: {
          enabled: true,
          strictness: "medium",
          action: "block",
        },
        // Velocity Limits: prevent mass sign-up abuse
        velocity: {
          enabled: true,
          maxSignupsPerVisitor: 5,
          maxPasswordResetsPerIp: 10,
          maxSignInsPerIp: 50,
          windowSeconds: 3600,
          action: "challenge",
        },
        // Suspicious IP Detection
        suspiciousIpBlocking: { action: "block" },
      },
    })
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STUDENT",
      },
      studentId: {
        type: "string",
        required: false,
      },
      regId: {
        type: "string",
        required: false,
      },
      specialization: {
        type: "string",
        required: false,
      },
      department: {
        type: "string",
        required: false,
      },
      isProfileComplete: {
        type: "boolean",
        defaultValue: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      phoneNumberVerified: {
        type: "boolean",
        defaultValue: false,
      },
      lastActiveAt: {
        type: "date",
      },
    }
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Refresh once per day
  },
  trustedOrigins: [
    "https://attend-ai-smart-erp.vercel.app/",
    "https://attend-ai-smart-erp.vercel.app",
    "https://dash.better-auth.com",
    "http://localhost:3000",
  ].filter(Boolean)
});
