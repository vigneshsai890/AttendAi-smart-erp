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
import { dash, sentinel } from "@better-auth/infra";
import { MongoClient } from "mongodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017/smart_erp_realtime");
const db = client.db();

// Configure AWS SNS for SMS OTP Delivery
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_GOOGLE_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "PLACEHOLDER_GOOGLE_SECRET",
    },
  },
  plugins: [
    // ── Authentication Plugins ────────────────────────────
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        const message = `[AttendAI] Your secure access code is: ${code}. Do not share this sign-on signal.`;

        try {
          const command = new PublishCommand({
            PhoneNumber: phoneNumber,
            Message: message,
            MessageAttributes: {
              'AWS.SNS.SMS.SenderID': {
                DataType: 'String',
                StringValue: 'AttendAI'
              },
              'AWS.SNS.SMS.SMSType': {
                DataType: 'String',
                StringValue: 'Transactional'
              }
            }
          });

          await snsClient.send(command);
          console.log(`[SMS_SYNC_SUCCESS] Delivered to: ${phoneNumber}`);
        } catch (err) {
          console.error("[SMS_SYNC_FAILURE]", err);
          console.log(`[DEV_FALLBACK] CODE: ${code}`);
        }
      },
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace("+", "")}@apollo.erp`,
        getTempName: (phone) => `User ${phone}`,
      },
    }),
    twoFactor(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // For now, log OTPs to console (wire up Resend/SendGrid/SES later)
        console.log(`\n━━━ [EMAIL_OTP] ━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`  To: ${email}`);
        console.log(`  Type: ${type}`);
        console.log(`  CODE: ${otp}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
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
    dash(),
    sentinel({
      security: {
        // Impossible Travel: flag if a student logs in from 2 cities too fast
        impossibleTravel: {
          enabled: true,
          maxSpeedKmh: 500, // airplane speed threshold
          action: "challenge",
        },
        // Credential Stuffing: block brute-force login attempts
        credentialStuffing: {
          enabled: true,
          thresholds: { challenge: 5, block: 15 },
          windowSeconds: 300, // 5-minute window
          cooldownSeconds: 900, // 15-min cooldown after block
        },
        // Bot Detection: block automated attendance marking
        botBlocking: { action: "block" },
        // Compromised Password: warn users with leaked passwords
        compromisedPassword: {
          enabled: true,
          action: "challenge",
          minBreachCount: 3,
        },
        // Email Validation: only accept university emails
        emailValidation: {
          enabled: true,
          strictness: "medium",
          action: "block",
        },
        // Velocity Limits: prevent mass sign-up abuse
        velocity: {
          enabled: true,
          maxSignupsPerVisitor: 3,
          maxPasswordResetsPerIp: 5,
          maxSignInsPerIp: 20,
          windowSeconds: 3600, // 1-hour window
          action: "challenge",
        },
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
      }
    }
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Refresh once per day
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://dash.better-auth.com",
    process.env.BETTER_AUTH_URL || "",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ].filter(Boolean)
});
