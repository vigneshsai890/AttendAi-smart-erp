import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-utils";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, regId, specialization, isProfileComplete } = await req.json();
    
    // Identity can be either MongoDB _id or Firebase UID (in fallback case)
    const identity = user.id;

    if (!identity) {
      return NextResponse.json({ error: "User identity not found" }, { status: 400 });
    }

    const client = new MongoClient(MONGO_URI);
    try {
      await client.connect();
      const db = client.db();
      const collection = db.collection("user");

      // Try to update by MongoDB _id first
      let filter: any = {};
      if (ObjectId.isValid(identity)) {
        filter = { _id: new ObjectId(identity) };
      } else {
        // If not a valid ObjectId, it must be a Firebase UID
        filter = { firebaseUid: identity };
      }

      const result = await collection.updateOne(
        filter,
        {
          $set: {
            studentId,
            regId,
            specialization,
            isProfileComplete,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
         // Final fallback: try email from session
         await collection.updateOne(
            { email: user.email },
            {
              $set: {
                studentId,
                regId,
                specialization,
                isProfileComplete,
                updatedAt: new Date(),
              },
            }
         );
      }

      return NextResponse.json({ message: "Profile updated successfully" });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
