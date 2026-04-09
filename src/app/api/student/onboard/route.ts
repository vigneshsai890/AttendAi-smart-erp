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

    // Send to backend with the identity (could be MongoDB ID or Firebase UID)
    const res = await backend.post("/dashboard/onboard", {
      ...body,
      userId: user.id, 
      firebaseUid: user.firebaseUid
    }, {
      headers: {
        ...(authHeader ? { "Authorization": authHeader } : {}),
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
