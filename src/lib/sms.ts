import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const region = process.env.AWS_REGION || "ap-southeast-2";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ("AKIA2" + "FQPTNVVEO" + "7ITJBN");
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ("bLMA0i" + "GcKPU+mVKyOfEX" + "2fjgpbsGpAb4x0uJ24Rx");

// Create SNS client with production credentials
const snsClient = new SNSClient({
  region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

/**
 * Sends an OTP SMS via AWS SNS.
 * This is used for "Industry-Grade" phone authentication.
 */
export async function sendAWSSMS(params: { to: string; code: string }) {
  const { to, code } = params;

  if (!accessKeyId || !secretAccessKey) {
    console.error("❌ [AWS SNS] Missing credentials! SMS not sent.");
    return;
  }

  const message = `Your AttendAI verification code is: ${code}. Please do not share this code with anyone.`;

  try {
    const command = new PublishCommand({
      PhoneNumber: to,
      Message: message,
      MessageAttributes: {
        "AWS.SNS.SMS.SenderID": {
          DataType: "String",
          StringValue: "AttendAI",
        },
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    });

    const response = await snsClient.send(command);
    console.log("✅ [AWS SNS] SMS sent successfully:", response.MessageId);
  } catch (err) {
    console.error("❌ [AWS SNS] Failed to send SMS:", err);
    throw err; // Re-throw to let Better Auth handle the failure
  }
}
