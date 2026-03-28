export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!attendanceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (attendanceSession.status !== "ACTIVE") {
      return NextResponse.json({ error: "Session is not active" }, { status: 400 });
    }

    if (!attendanceSession.qrCode) {
      return NextResponse.json({ error: "No QR token available" }, { status: 400 });
    }

    // Build the payload encoded in the QR
    const payload = {
      sessionId: id,
      token: attendanceSession.qrCode,
      exp: attendanceSession.qrExpiry
        ? Math.floor(attendanceSession.qrExpiry.getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 15,
    };

    // Generate QR as base64 data URL
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    });

    console.log(
      `[QR] Generated for session ${id}: token=${attendanceSession.qrCode.slice(0, 8)}... exp=${payload.exp}`
    );

    return NextResponse.json({
      qrDataUrl,
      sessionId: id,
      token: attendanceSession.qrCode,
      expiresAt: attendanceSession.qrExpiry,
      courseName: attendanceSession.course.name,
      courseCode: attendanceSession.course.code,
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
