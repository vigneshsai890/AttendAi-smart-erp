import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ENV } from "@/lib/env";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";

// Global cache for MongoDB connection
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  const client = new MongoClient(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  const db = client.db("attendai");
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

/**
 * Robustly fetch the current session user from MongoDB directly.
 * Completely avoids HTTP proxy timeouts and Render cold starts.
 */
export async function getSessionUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    // 1. Decode token manually (Firebase JWT format)
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const decodedToken = JSON.parse(jsonPayload);
    const uid = decodedToken.user_id || decodedToken.uid || decodedToken.sub;
    const email = decodedToken.email;

    if (!uid) return null;

    // 2. Connect to MongoDB using cached connection
    const { db } = await connectToDatabase();
    
    try {
      const users = db.collection("user");
      
      let user = await users.findOne({ firebaseUid: uid });
      
      // Auto-heal by email if not found by uid
      if (!user && email) {
         user = await users.findOne({ email });
         if (user) {
           await users.updateOne({ _id: user._id }, { $set: { firebaseUid: uid } });
         }
      }
      
      // Auto-create if completely missing
      if (!user && email) {
         const name = decodedToken.name || email.split('@')[0] || "User";
         const result = await users.insertOne({
            firebaseUid: uid,
            email,
            name,
            role: "STUDENT",
            isProfileComplete: false,
            createdAt: new Date(),
            updatedAt: new Date()
         });
         user = await users.findOne({ _id: result.insertedId });
      }

      if (user) {
        return {
          id: user._id.toString(),
          firebaseUid: user.firebaseUid,
          role: user.role || "STUDENT",
          email: user.email,
          name: user.name,
          isProfileComplete: user.isProfileComplete
        };
      }
    } finally {
      // Don't close the client! Keep it cached.
    }
  } catch (error: any) {
    console.error("[AUTH_UTILS] Fatal Mongo sync error:", error);
  }

  return null;
}
