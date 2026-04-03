export const dynamic = "force-dynamic";

import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const res = await backend.get(`/attendance/session/${id}/qr`);
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Failed to generate QR" }, { status: error.response?.status || 500 });
  }
}
