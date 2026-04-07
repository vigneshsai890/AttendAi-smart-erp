export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/auth-utils";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userData = Buffer.from(JSON.stringify({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      isProfileComplete: user.isProfileComplete
    })).toString("base64");

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }
    const res = await backend.post("/dashboard/2fa/verify", {
      userEmail: user.email,
      token,
    }, {
      headers: {
        "x-user-data": userData,
        "Authorization": req.headers.get("Authorization")
      }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Internal server error" }, { status: error.response?.status || 500 });
  }
}
