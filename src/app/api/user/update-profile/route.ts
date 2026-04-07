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
    const userId = user.id;

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const client = new MongoClient(MONGO_URI);
    try {
      await client.connect();
      const db = client.db();
      const collection = db.collection("user"); // NextAuth collection

      await collection.updateOne(
        { _id: new ObjectId(userId) },
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

      return NextResponse.json({ message: "Profile updated successfully" });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
