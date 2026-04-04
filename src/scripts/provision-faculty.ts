import { createAuthClient } from "better-auth/client";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const FRONTEND_URL = "https://attendai-smart-erp.onrender.com";
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";

async function provision() {
  console.log("🚀 Provisioning Faculty Accounts for Production...");

  const authClient = createAuthClient({
    baseURL: FRONTEND_URL,
    fetchOptions: {
      headers: { "Origin": FRONTEND_URL }
    }
  });

  const faculty = [
    { email: "faculty.alpha@attendai.edu", name: "Dr. Alpha Centauri", pass: "FacultyPass123!" },
    { email: "faculty.beta@attendai.edu", name: "Prof. Beta Orionis", pass: "FacultyPass123!" },
    { email: "faculty.gamma@attendai.edu", name: "Dr. Gamma Ray", pass: "FacultyPass123!" }
  ];

  // 1. Sign them up via API
  for (const f of faculty) {
    console.log(`\n📝 Signing up ${f.email}...`);
    const { data, error } = await authClient.signUp.email({
      email: f.email,
      password: f.pass,
      name: f.name
    });

    if (error) {
      if (error.status === 422 || error.message?.includes("already exists")) {
        console.log(`ℹ️ User ${f.email} already exists in Better Auth.`);
      } else {
        console.error(`❌ Failed to sign up ${f.email}:`, error.message);
        continue;
      }
    } else {
      console.log(`✅ ${f.email} created in Better Auth.`);
    }
  }

  // 2. Elevate roles in MongoDB
  console.log("\n⚖️ Elevating roles in Database...");
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("user");

    for (const f of faculty) {
      const result = await users.updateOne(
        { email: f.email },
        { $set: { role: "FACULTY", isProfileComplete: true } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ ${f.email} is now a FACULTY member.`);
      } else {
        console.log(`ℹ️ ${f.email} was already FACULTY or not found.`);
      }
    }
  } catch (err) {
    console.error("❌ DB Error:", err);
  } finally {
    await client.close();
  }

  console.log("\n🎉 Provisioning Complete!");
}

provision();
