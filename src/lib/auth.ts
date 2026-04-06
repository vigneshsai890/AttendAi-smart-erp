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
import { apiKey as apiKeyPlugin } from "@better-auth/api-key";
import { dash, sentinel, sendEmail } from "@better-auth/infra";
import { MongoClient } from "mongodb";
import { ENV } from "./env";
import { sendAWSSMS } from "./sms";
import { headers } from "next/headers";

// --- Lazy Auth & Mongo Initialization ---
let _auth: any = null; // BetterAuth instance is complex, keeping any for now to avoid deep type issues
let _client: MongoClient | null = null;

const getBetterAuthSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    if (ENV.isProduction) throw new Error("BETTER_AUTH_SECRET is missing in production!");
    return "SMART_ERP_SECRET_KEY_DEV_2024";
  }
  return secret;
};

export const getAuth = async (req?: Request | Headers) => {
  if (!_auth) {
    // 1. Ensure DB connection
    if (!_client) {
      const uri = process.env.MONGO_URI;
      if (!uri) {
        throw new Error("MONGO_URI is missing. Better Auth requires a database connection.");
      }
      _client = new MongoClient(uri);
      try {
        await _client.connect();
      } catch (err: any) {
        console.error("❌ [DB CONNECTION ERROR]:", err);
        throw new Error(`Failed to connect to MongoDB: ${err.message}`);
      }
    }
    const db = _client.db();

    const apiKey = process.env.BETTER_AUTH_API_KEY;
    if (!apiKey && ENV.isProduction) {
      throw new Error("BETTER_AUTH_API_KEY is missing in production!");
    }

    // Determine baseURL:
    // On Vercel, we must use the current request URL to avoid mismatch on preview deployments.
    let baseURL = ENV.frontendUrl;
    let host = "";
    let proto = "https";

    try {
      if (req instanceof Request) {
        const url = new URL(req.url);
        host = url.host;
        proto = url.protocol.replace(":", "");
      } else {
        const h = req || await headers();
        host = h.get("host") || "";
        proto = h.get("x-forwarded-proto") || "https";
      }
    } catch (e) {
      console.warn("⚠️ [AUTH] Could not determine host from request, using fallback baseURL.");
    }

    if (host) {
      baseURL = `${proto.split(",")[0]}://${host}`;
    }

    // 2. Initialize Better Auth with real DB object
    _auth = betterAuth({
      database: mongodbAdapter(db),
      secret: getBetterAuthSecret(),
      baseURL,
      basePath: "/auth",
      emailVerification: {
        sendOnSignUp: false,
      },
      emailAndPassword: {
        enabled: true,
      },
      // ... (plugins)
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
        admin(),
        organization({
          allowUserToCreateOrganization: async (user) => {
            const role = (user as Record<string, unknown>).role as string;
            return role === "ADMIN" || role === "FACULTY" || role === "HOD";
          },
        }),
        apiKeyPlugin(),
        /*
        dash({
          apiKey: apiKey || "ba_mzne3a7dpahwre7ybfx3n9js2l5v4khp"
        }),
        sentinel({
          apiKey: apiKey || "ba_mzne3a7dpahwre7ybfx3n9js2l5v4khp",
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
        */
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
      // HIGH PRIORITY: Trust ALL subdomains of vercel.app and your render domains
      trustedOrigins: [
        "https://*.vercel.app",
        "https://*.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
      ],
    });
  }
  return _auth;
};
