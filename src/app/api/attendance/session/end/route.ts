import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { course: { include: { enrollments: true } } },
    });

    if (!attendanceSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const now = new Date();

    // Mark students who didn't check in as ABSENT
    const enrolledStudentUserIds = await prisma.enrollment.findMany({
      where: { courseId: attendanceSession.courseId, status: "ACTIVE" },
      include: { student: true },
    });

    const existingRecords = await prisma.attendanceRecord.findMany({
      where: { sessionId },
    });
    const checkedInUserIds = new Set(existingRecords.map(r => r.userId));

    for (const enrollment of enrolledStudentUserIds) {
      if (!checkedInUserIds.has(enrollment.student.userId)) {
        await prisma.attendanceRecord.create({
          data: {
            sessionId, userId: enrollment.student.userId,
            status: "ABSENT", markedAt: now,
          },
        });
      }
    }

    // Close session
    await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        endTime: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
        qrCode: null, qrExpiry: null,
      },
    });

    const totalPresent = existingRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;

    return NextResponse.json({
      success: true,
      summary: {
        total: enrolledStudentUserIds.length,
        present: totalPresent,
        absent: enrolledStudentUserIds.length - totalPresent,
      },
    });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}
