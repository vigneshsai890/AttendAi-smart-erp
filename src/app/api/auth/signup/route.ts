import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "";

export async function POST(req: Request) {
  try {
    const { firebaseUid, email, name, phoneNumber } = await req.json();

    if (!firebaseUid || !email || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = new MongoClient(MONGO_URI);
    try {
      await client.connect();
      // Explicitly target 'attendai' database to prevent data loss in 'test' DB
      const db = client.db("attendai");
      const collection = db.collection("user");

      // Check if user already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        // If they exist but don't have a firebaseUid, we could potentially link them here, 
        // but for now let's just return an error or update them.
        if (!existingUser.firebaseUid) {
           await collection.updateOne({ _id: existingUser._id }, { $set: { firebaseUid } });
           return NextResponse.json({ message: "Linked existing user to Firebase", userId: existingUser._id.toString() }, { status: 200 });
        }
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
      }

      const result = await collection.insertOne({
        firebaseUid,
        email,
        name,
        phoneNumber,
        role: "STUDENT",
        isProfileComplete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({ 
        message: "User created successfully", 
        userId: result.insertedId.toString() 
      }, { status: 201 });

    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
