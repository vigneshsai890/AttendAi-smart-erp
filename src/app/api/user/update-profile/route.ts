import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, regId, specialization, isProfileComplete } = await req.json();
    const userId = (session.user as any).id;

    if (!userId) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
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
