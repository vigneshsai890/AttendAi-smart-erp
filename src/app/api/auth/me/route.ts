import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://vigneshsaisai412_db_user:Qmewj1Fu2CNbYFz0@cluster1.4omhez7.mongodb.net/smart_erp_realtime?appName=Cluster1";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    // Decode token manually
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const decodedToken = JSON.parse(jsonPayload);
    const uid = decodedToken.user_id || decodedToken.uid;
    const email = decodedToken.email;

    // Connect to MongoDB directly for instantaneous auth checks!
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    
    try {
      const db = client.db("attendai"); // MUST use attendai db
      const users = db.collection("user");
      
      let user = await users.findOne({ firebaseUid: uid });
      
      // Auto-heal by email
      if (!user && email) {
         user = await users.findOne({ email });
         if (user) {
           await users.updateOne({ _id: user._id }, { $set: { firebaseUid: uid } });
         }
      }
      
      // Create if missing
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
        return NextResponse.json({
          user: {
            id: user._id.toString(),
            firebaseUid: user.firebaseUid,
            role: user.role || "STUDENT",
            email: user.email,
            name: user.name,
            isProfileComplete: user.isProfileComplete
          }
        });
      }

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    } finally {
      await client.close();
    }
  } catch (error: any) {
    console.error("[AUTH_ME] Direct DB proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
