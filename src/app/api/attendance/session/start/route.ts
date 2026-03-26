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
    const { courseId, latitude, longitude, geoRadius } = body;

    if (!courseId) return NextResponse.json({ error: "Course ID required" }, { status: 400 });

    // Find faculty profile
    const faculty = await prisma.faculty.findUnique({ where: { userId: session.user.id } });
    if (!faculty) return NextResponse.json({ error: "Faculty profile not found" }, { status: 403 });

    // Check if there's already an active session for this course
    const existing = await prisma.attendanceSession.findFirst({
      where: { courseId, facultyId: faculty.id, status: "ACTIVE" },
    });
    if (existing) {
      return NextResponse.json({ error: "Session already active", sessionId: existing.id }, { status: 400 });
    }

    // Generate first QR token
    const qrToken = crypto.randomBytes(16).toString("hex");
    const now = new Date();
    const qrExpiry = new Date(now.getTime() + 60000); // 60 seconds

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        courseId,
        facultyId: faculty.id,
        sessionDate: now,
        startTime: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
        endTime: "",
        qrCode: qrToken,
        qrExpiry,
        latitude: latitude || null,
        longitude: longitude || null,
        geoRadius: geoRadius || 100,
        status: "ACTIVE",
      },
      include: { course: true },
    });

    return NextResponse.json({
      sessionId: attendanceSession.id,
      qrToken,
      qrExpiry: qrExpiry.toISOString(),
      courseName: attendanceSession.course.name,
    });
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}
