export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const res = await backend.get("/attendance/live", { params: { sessionId } });
    return NextResponse.json(res.data, {
      headers: { "Cache-Control": "private, max-age=2, stale-while-revalidate=5" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to fetch live attendance" }, { status: error.response?.status || 500 });
  }
}
