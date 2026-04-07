export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

async function getAdminUser(req: Request) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

function getUserDataHeader(user: any) {
  return Buffer.from(JSON.stringify({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    isProfileComplete: user.isProfileComplete
  })).toString("base64");
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const { backend } = await import("@/lib/backend");
    const res = await backend.put(`/admin/students/${id}`, body, {
      headers: {
        "x-user-data": getUserDataHeader(user),
        "Authorization": req.headers.get("Authorization")
      }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to update student" }, { status: error.response?.status || 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const { backend } = await import("@/lib/backend");
    const res = await backend.delete(`/admin/students/${id}`, {
      headers: {
        "x-user-data": getUserDataHeader(user),
        "Authorization": req.headers.get("Authorization")
      }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to delete student" }, { status: error.response?.status || 500 });
  }
}
