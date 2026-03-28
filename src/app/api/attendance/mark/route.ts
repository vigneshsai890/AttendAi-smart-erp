import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { emitToSession } from "@/lib/socket";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { sessionId, qrToken, latitude, longitude, deviceFingerprint } = body;

    if (!sessionId || !qrToken) {
      return NextResponse.json({ error: "Session ID and QR token are required" }, { status: 400 });
    }

    // Find the active session
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { course: true },
    });

    if (!attendanceSession || attendanceSession.status !== "ACTIVE") {
      return NextResponse.json({ error: "Session is not active or does not exist" }, { status: 404 });
    }

    // Validate QR token
    if (attendanceSession.qrCode !== qrToken) {
      return NextResponse.json({ error: "Invalid or expired QR code. The code rotates every 60 seconds." }, { status: 400 });
    }

    // Check QR expiry
    if (attendanceSession.qrExpiry && new Date() > attendanceSession.qrExpiry) {
      return NextResponse.json({ error: "QR code has expired. Wait for the next code." }, { status: 400 });
    }

    // Check if already marked
    const existing = await prisma.attendanceRecord.findUnique({
      where: { sessionId_userId: { sessionId, userId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Attendance already marked for this session", status: existing.status }, { status: 400 });
    }

    // ── PROXY DETECTION ──
    let riskScore = 0;
    const flags: string[] = [];
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // 1. Geolocation check
    if (attendanceSession.latitude && attendanceSession.longitude && latitude && longitude) {
      const dist = getDistance(attendanceSession.latitude, attendanceSession.longitude, latitude, longitude);
      if (dist > (attendanceSession.geoRadius || 100)) {
        riskScore += 40;
        flags.push(`LOCATION: ${Math.round(dist)}m from campus (limit: ${attendanceSession.geoRadius}m)`);
      }
    }

    // 2. Device fingerprint check — same device used by multiple users?
    if (deviceFingerprint) {
      const sameDevice = await prisma.attendanceRecord.findMany({
        where: {
          sessionId,
          deviceFingerprint,
          userId: { not: session.user.id },
        },
      });
      if (sameDevice.length > 0) {
        riskScore += 35;
        flags.push(`DEVICE: Same device used by ${sameDevice.length} other student(s)`);
      }
    }

    // 3. IP clustering — many check-ins from same IP within 30 seconds?
    const recentFromSameIP = await prisma.attendanceRecord.findMany({
      where: {
        sessionId,
        ipAddress: ip,
        markedAt: { gte: new Date(Date.now() - 30000) },
        userId: { not: session.user.id },
      },
    });
    if (recentFromSameIP.length >= 3) {
      riskScore += 25;
      flags.push(`IP_CLUSTER: ${recentFromSameIP.length + 1} check-ins from ${ip} within 30 sec`);
    }

    // 4. QR timing — marked just before expiry (last 5 seconds)?
    if (attendanceSession.qrExpiry) {
      const timeToExpiry = attendanceSession.qrExpiry.getTime() - Date.now();
      if (timeToExpiry < 5000 && timeToExpiry > 0) {
        riskScore += 15;
        flags.push(`TIMING: Checked in ${Math.round(timeToExpiry / 1000)}s before QR expiry`);
      }
    }

    const isFlagged = riskScore >= 50;
    const status = isFlagged ? "PROXY" : "PRESENT";

    // Create attendance record
    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId,
        userId: session.user.id,
        status,
        markedAt: new Date(),
        deviceFingerprint: deviceFingerprint || null,
        ipAddress: ip,
        latitude: latitude || null,
        longitude: longitude || null,
        riskScore,
        flagged: isFlagged,
      },
    });

    // Create proxy alerts if flagged
    if (isFlagged && flags.length > 0) {
      for (const flag of flags) {
        const alertType = flag.startsWith("LOCATION") ? "LOCATION"
          : flag.startsWith("DEVICE") ? "DEVICE"
          : flag.startsWith("IP_CLUSTER") ? "BUDDY_PATTERN"
          : "TIMING";
        const severity = riskScore >= 70 ? "CRITICAL" : riskScore >= 50 ? "HIGH" : "MEDIUM";

        await prisma.proxyAlert.create({
          data: {
            recordId: record.id,
            alertType,
            severity,
            description: flag,
            status: "PENDING",
          },
        });
      }
    }

    // ── REAL-TIME: emit to all clients watching this session ──
    const studentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        student: { select: { rollNumber: true } },
      },
    });

    emitToSession(sessionId, "attendance:new", {
      id: record.id,
      userId: session.user.id,
      name: studentUser?.name ?? "Unknown",
      rollNumber: studentUser?.student?.rollNumber ?? "—",
      status,
      markedAt: record.markedAt,
      flagged: isFlagged,
      riskScore,
    });

    console.log(
      `[MARK] Student ${studentUser?.name} marked ${status} for session ${sessionId} | risk=${riskScore}`
    );

    return NextResponse.json({
      status,
      riskScore,
      flagged: isFlagged,
      flags,
      courseName: attendanceSession.course.name,
      message: isFlagged
        ? "⚠️ Attendance flagged for review. Potential proxy detected."
        : `✅ Attendance marked — ${attendanceSession.course.name}`,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}
