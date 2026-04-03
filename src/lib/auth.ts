import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { phoneNumber, twoFactor } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017/smart_erp_realtime");
const db = client.db();

// Configure AWS SNS
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const auth = betterAuth({
  database: mongodbAdapter(db),
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
        // ULTRAMAX SMS Logic: AWS SNS Integration
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
          // Fallback for development if keys are missing
          console.log(`[DEV_FALLBACK] CODE: ${code}`);
        }
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
      role: {
        type: "string",
        defaultValue: "STUDENT", // Defaulting to STUDENT for new signups
      },
      studentId: {
        type: "string",
        required: false, // Generated during onboarding
      },
      regId: {
        type: "string",
        required: false, // Generated during onboarding
      },
      specialization: {
        type: "string",
        required: false, // Captured during onboarding
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
    expiresIn: 30 * 24 * 60 * 60, // 30 days session
    updateAge: 24 * 60 * 60, // Update once a day
  },
  trustedOrigins: [
    "http://localhost:3000",
    process.env.BETTER_AUTH_URL || "",
    process.env.NEXT_PUBLIC_APP_URL || "",
    "https://appleid.apple.com"
  ].filter(Boolean)
});
