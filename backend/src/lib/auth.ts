import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import mongoose from "mongoose";
import { 
  phoneNumber, 
  twoFactor 
} from "better-auth/plugins";

// Lazy-initialized BetterAuth instance
let _auth: any = null;

export const getAuth = (): any => {
  if (!_auth) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB must be connected before initializing Better-Auth");
    }
    
    _auth = betterAuth({
      database: mongodbAdapter(mongoose.connection.db as any),
      secret: process.env.BETTER_AUTH_SECRET || "SMART_ERP_SECRET_KEY_PROD_2024",
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_GOOGLE_ID",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "PLACEHOLDER_GOOGLE_SECRET",
        },
        apple: {
          clientId: process.env.APPLE_CLIENT_ID || "PLACEHOLDER_APPLE_ID",
          clientSecret: process.env.APPLE_CLIENT_SECRET || "PLACEHOLDER_APPLE_SECRET",
        },
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
        twoFactor()
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
