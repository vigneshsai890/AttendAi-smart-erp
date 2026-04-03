export const dynamic = "force-dynamic";

import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

async function checkAdmin() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await backend.get("/admin/departments");
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to fetch departments" }, { status: error.response?.status || 500 });
  }
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const res = await backend.post("/admin/departments", body);
    return NextResponse.json(res.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to create department" }, { status: error.response?.status || 500 });
  }
}
