export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/auth-utils";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "FACULTY") {
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

    const body = await req.json();
    const res = await backend.post("/attendance/session/create", {
      ...body,
      facultyUserId: user.id,
    }, {
      headers: {
        "x-user-data": userData,
        "Authorization": req.headers.get("Authorization") || ""
      }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Internal server error" }, { status: error.response?.status || 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "FACULTY") {
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

    const body = await req.json();
    const res = await backend.patch("/attendance/session/update", body, {
      headers: {
        "x-user-data": userData,
        "Authorization": req.headers.get("Authorization") || ""
      }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Internal server error" }, { status: error.response?.status || 500 });
  }
}
