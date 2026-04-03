import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import mongoose from "mongoose";
import type { Db } from "mongodb";
import { 
  phoneNumber, 
  twoFactor 
} from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";

// Lazy-initialized BetterAuth instance
let _auth: ReturnType<typeof betterAuth> | null = null;

export const getAuth = () => {
  if (!_auth) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB must be connected before initializing Better-Auth");
    }
    
    _auth = betterAuth({
      database: mongodbAdapter(mongoose.connection.db as unknown as Db),
      secret: process.env.BETTER_AUTH_SECRET || "SMART_ERP_SECRET_KEY_PROD_2024",
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_GOOGLE_ID",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "PLACEHOLDER_GOOGLE_SECRET",
        }
      },
      plugins: [
        phoneNumber({
          sendOTP: async ({ phoneNumber, code }) => {
            console.log(`[BACKEND_SMS_PROTOCOL] To: ${phoneNumber} | CODE: ${code}`);
          },
          signUpOnVerification: {
            getTempEmail: (phone) => `${phone.replace("+", "")}@apollo.erp`,
            getTempName: (phone) => `User ${phone}`,
          },
        }),
        twoFactor(),
        apiKey()
      ],
      user: {
        additionalFields: {
          role: { type: "string", defaultValue: "STUDENT", required: false },
          studentId: { type: "string", required: false },
          regId: { type: "string", required: false },
          specialization: { type: "string", required: false },
          department: { type: "string", required: false },
          isProfileComplete: { type: "boolean", defaultValue: false }
        }
      }
    });
  }
  return _auth;
};
