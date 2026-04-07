export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/auth-utils";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

function getUserDataHeader(user: any) {
  return Buffer.from(JSON.stringify({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    isProfileComplete: user.isProfileComplete
  })).toString("base64");
}

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const res = await backend.get("/attendance/live", {
      params: { sessionId },
      headers: { 
        "x-user-data": getUserDataHeader(user),
        Authorization: req.headers.get("Authorization") || ""
      }
    });
    return NextResponse.json(res.data, {
      headers: { "Cache-Control": "private, max-age=2, stale-while-revalidate=5" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to fetch live attendance" }, { status: error.response?.status || 500 });
  }
}
