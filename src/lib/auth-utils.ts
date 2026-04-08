import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "";

export async function getSessionUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');

    const decoded = JSON.parse(jsonPayload);
    const firebaseUid = decoded.user_id;
    const email = decoded.email;

    if (!firebaseUid) return null;

    const client = new MongoClient(MONGO_URI);
    try {
      await client.connect();
      const db = client.db();
      const collection = db.collection("user");
      
      let user = await collection.findOne({ firebaseUid });

      if (!user && email) {
        user = await collection.findOne({ email });
        if (user) {
          await collection.updateOne({ _id: user._id }, { $set: { firebaseUid } });
        }
      }

      // Auto-healing: Create record if missing
      if (!user) {
        console.log(`[AUTH_UTILS] Auto-healing zombie user: ${email}. Creating missing MongoDB record.`);
        const newUser = {
          firebaseUid,
          email,
          name: decoded.name || (email ? email.split('@')[0] : "Student"),
          role: "STUDENT",
          isProfileComplete: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const result = await collection.insertOne(newUser);
        user = { _id: result.insertedId, ...newUser };
      }

      return {
        id: user._id.toString(),
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role || "STUDENT",
        isProfileComplete: user.isProfileComplete || false,
      };
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Error decoding token or fetching user:", error);
    return null;
  }
}
