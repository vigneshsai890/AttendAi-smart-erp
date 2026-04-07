export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/auth-utils";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req);
  if (!user) {
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

    const { id } = await params;
    const res = await backend.get(`/attendance/session/${id}/qr`, {
      headers: {
        "x-user-data": userData,
        Authorization: req.headers.get("Authorization") || ""
      }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to generate QR" }, { status: error.response?.status || 500 });
  }
}
