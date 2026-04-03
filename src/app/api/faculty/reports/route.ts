export const dynamic = "force-dynamic";

import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "Course ID required" }, { status: 400 });

  try {
    const res = await backend.get("/dashboard/faculty/reports", { params: { courseId } });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to fetch reports" }, { status: error.response?.status || 500 });
  }
}
