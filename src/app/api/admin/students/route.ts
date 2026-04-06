export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { NextResponse } from "next/server";

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

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

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const { backend } = await import("@/lib/backend");
    const res = await backend.get("/admin/students", {
      params: {
        search: searchParams.get("search") || "",
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "50",
      },
      headers: { "x-user-data": getUserDataHeader(session) }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to fetch students" }, { status: error.response?.status || 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { backend } = await import("@/lib/backend");
    const res = await backend.post("/admin/students", body, {
      headers: { "x-user-data": getUserDataHeader(session) }
    });
    return NextResponse.json(res.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to create student" }, { status: error.response?.status || 500 });
  }
}
