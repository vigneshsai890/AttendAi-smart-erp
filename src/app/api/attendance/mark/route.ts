export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/auth-utils";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;
  const rl = checkRateLimit(`mark:${userId}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
    );
  }

  try {
    const userData = Buffer.from(JSON.stringify({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      isProfileComplete: user.isProfileComplete
    })).toString("base64");

    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const res = await backend.post("/attendance/mark", {
      ...body,
      userId,
      ip,
    }, {
      headers: {
        "x-user-data": userData,
        Authorization: req.headers.get("Authorization") || ""
      }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to mark attendance" }, { status: error.response?.status || 500 });
  }
}
