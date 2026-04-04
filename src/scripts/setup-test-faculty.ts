import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";

async function setupFaculty() {
  console.log("🎓 Setting up Faculty Test Accounts...");
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("user");

    const facultyMembers = [
      {
        email: "faculty.alpha@attendai.edu",
        name: "Dr. Alpha Centauri",
        role: "FACULTY"
      },
      {
        email: "faculty.beta@attendai.edu",
        name: "Prof. Beta Orionis",
        role: "FACULTY"
      },
      {
        email: "faculty.gamma@attendai.edu",
        name: "Dr. Gamma Ray",
        role: "FACULTY"
      }
    ];

    for (const member of facultyMembers) {
      // Check if user exists
      const existing = await users.findOne({ email: member.email });

      if (existing) {
        console.log(`📝 Updating existing user to FACULTY: ${member.email}`);
        await users.updateOne(
          { _id: existing._id },
          { $set: { role: "FACULTY", isProfileComplete: true } }
        );
      } else {
        console.log(`⚠️ User ${member.email} does not exist. Please sign up first or use the Better Auth API.`);
        console.log(`   (Since we need password hashing, it's best to sign up via API then elevate)`);
      }
    }

  } catch (err) {
    console.error("❌ Database Error:", err);
  } finally {
    await client.close();
  }
}

setupFaculty();
