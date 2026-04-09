export const dynamic = "force-dynamic";

import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    // Authenticate using the Firebase token from the Authorization header
    const user = await getSessionUser(req);
    if (!user) {
      console.warn("[ONBOARD_PROXY] Authentication check failed — getSessionUser returned null");
      return NextResponse.json({ error: "Unauthorized — no valid session" }, { status: 401 });
    }

    const body = await req.json();
    const authHeader = req.headers.get("Authorization");

    console.log("[ONBOARD_PROXY] User from session:", user.email, "MongoDB ID:", user.id);

    const userData = Buffer.from(JSON.stringify({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      isProfileComplete: user.isProfileComplete
    })).toString("base64");

    // Send to backend with the identity and basic profile info for auto-creation
    const res = await backend.post("/dashboard/onboard", {
      ...body,
      userId: user.id, 
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name
    }, {
      headers: {
        ...(authHeader ? { "Authorization": authHeader } : {}),
        "x-user-data": userData
      }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error("[ONBOARD_PROXY] Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error || "Onboarding failed" },
      { status: error.response?.status || 500 }
    );
  }
}
