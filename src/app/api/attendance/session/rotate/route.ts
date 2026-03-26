import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    const attendanceSession = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!attendanceSession || attendanceSession.status !== "ACTIVE") {
      return NextResponse.json({ error: "No active session found" }, { status: 404 });
    }

    // Generate new QR token
    const qrToken = crypto.randomBytes(16).toString("hex");
    const qrExpiry = new Date(Date.now() + 60000); // 60 seconds

    await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { qrCode: qrToken, qrExpiry },
    });

    return NextResponse.json({ qrToken, qrExpiry: qrExpiry.toISOString() });
  } catch (error) {
    console.error("Rotate QR error:", error);
    return NextResponse.json({ error: "Failed to rotate QR" }, { status: 500 });
  }
}
