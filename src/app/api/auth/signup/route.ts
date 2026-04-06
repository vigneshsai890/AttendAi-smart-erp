import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI || "";

export async function POST(req: Request) {
  try {
    const { email, password, name, phoneNumber } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = new MongoClient(MONGO_URI);
    try {
      await client.connect();
      const db = client.db();
      const collection = db.collection("user");

      // Check if user already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await collection.insertOne({
        email,
        passwordHash,
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
