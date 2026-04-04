export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function checkAdmin() {
  // Dynamic import to prevent build-time Prisma evaluation
  const { getAuth } = await import("@/lib/auth");
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const { backend } = await import("@/lib/backend");
    const res = await backend.get("/admin/students", {
      params: {
        search: searchParams.get("search") || "",
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "50",
      },
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to fetch students" }, { status: error.response?.status || 500 });
  }
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { backend } = await import("@/lib/backend");
    const res = await backend.post("/admin/students", body);
    return NextResponse.json(res.data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to create student" }, { status: error.response?.status || 500 });
  }
}
