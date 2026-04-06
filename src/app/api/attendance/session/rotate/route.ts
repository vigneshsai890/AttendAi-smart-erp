export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

function getUserDataHeader(session: any) {
  const user = session.user;
  return Buffer.from(JSON.stringify({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    isProfileComplete: user.isProfileComplete
  })).toString("base64");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const res = await backend.post("/attendance/session/rotate", body, {
      headers: { "x-user-data": getUserDataHeader(session) }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to rotate QR" }, { status: error.response?.status || 500 });
  }
}
