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
  username
} from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { dash, sentinel, sendEmail, sendSMS } from "@better-auth/infra";

// Lazy-initialized BetterAuth instance
let _auth: any = null;

export const getAuth = () => {
  if (!_auth) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB must be connected before initializing Better-Auth");
    }
    
    _auth = betterAuth({
      database: mongodbAdapter(mongoose.connection.db as unknown as Db),
      secret: process.env.BETTER_AUTH_SECRET || "SMART_ERP_SECRET_KEY_PROD_2024",
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
        admin(),
        organization(),
        apiKey(),
        dash({
          apiKey: process.env.BETTER_AUTH_API_KEY as string,
          activityTracking: {
            enabled: true,
          },
        }),
        sentinel({
          apiKey: process.env.BETTER_AUTH_API_KEY as string,
          security: {
            credentialStuffing: { enabled: true },
            impossibleTravel: { enabled: true, action: "challenge" },
            botBlocking: { action: "challenge" },
            compromisedPassword: { enabled: true, action: "block" },
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
          lastActiveAt: { type: "date" }
        }
      }
    });
  }
  return _auth;
};
