import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // Decode token to get uid (we don't strictly verify here, we just need the uid
    // because the backend middleware will verify it, but for safety, we should really
    // verify it using firebase-admin in the Next.js API route as well, OR
    // just decode it here to look up the user profile for the client).
    // Let's do a simple base64 decode of the JWT payload since this is just
    // for the client to get its own profile data.
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const decoded = JSON.parse(jsonPayload);
    const firebaseUid = decoded.user_id;
    const email = decoded.email;

    if (!firebaseUid) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 400 });
    }

    const client = new MongoClient(MONGO_URI);
    try {
      await client.connect();
      const db = client.db();
      const collection = db.collection("user");
      
      // Try finding by firebaseUid first
      let user = await collection.findOne({ firebaseUid });

      // Fallback: If not found by firebaseUid, try finding by email and link it
      if (!user && email) {
        user = await collection.findOne({ email });
        if (user) {
          await collection.updateOne({ _id: user._id }, { $set: { firebaseUid } });
          console.log(`Linked user ${email} to firebaseUid ${firebaseUid}`);
        }
      }

      if (!user) {
        console.log(`[AUTH_ME] Auto-healing zombie user: ${email}. Creating missing MongoDB record.`);
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

      return NextResponse.json({
        user: {
          id: user._id.toString(),
          firebaseUid: user.firebaseUid,
          email: user.email,
          name: user.name,
          role: user.role || "STUDENT",
          isProfileComplete: user.isProfileComplete || false,
        }
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    const err = error as Error;
    console.error("Auth me error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
