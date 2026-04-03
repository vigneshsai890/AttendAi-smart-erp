export const dynamic = "force-dynamic";

import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const res = await backend.post("/attendance/session/start", {
      ...body,
      facultyUserId: session.user.id,
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to start session" }, { status: error.response?.status || 500 });
  }
}
