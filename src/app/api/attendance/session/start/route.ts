export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
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
