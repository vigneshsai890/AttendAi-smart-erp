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
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

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

      if (!user) return null;

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
