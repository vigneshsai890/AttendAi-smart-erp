export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/attendance/alert-email
// Body: { courseId, threshold?: number }
// Returns students below the threshold and creates notification records
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "FACULTY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { courseId, threshold = 80 } = await req.json();
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

    // Get total sessions for this course
    const totalSessions = await prisma.attendanceSession.count({
      where: { courseId, status: "CLOSED" },
    });

    if (totalSessions === 0) {
      return NextResponse.json({ error: "No completed sessions yet", alerts: [] });
    }

    // Get enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: "ACTIVE" },
      select: {
        student: {
          select: {
            userId: true,
            rollNumber: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Get attendance counts per student
    const attendanceCounts = await prisma.attendanceRecord.groupBy({
      by: ["userId"],
      where: {
        session: { courseId, status: "CLOSED" },
        status: { in: ["PRESENT", "LATE"] },
      },
      _count: { _all: true },
    });

    const countMap = new Map(attendanceCounts.map((a) => [a.userId, a._count._all]));

    // Find students below threshold
    const alerts: Array<{
      name: string;
      email: string;
      rollNumber: string;
      attended: number;
      total: number;
      percentage: number;
    }> = [];

    for (const enrollment of enrollments) {
      const student = enrollment.student;
      const attended = countMap.get(student.userId) ?? 0;
      const percentage = Math.round((attended / totalSessions) * 100);

      if (percentage < threshold) {
        alerts.push({
          name: student.user.name,
          email: student.user.email,
          rollNumber: student.rollNumber,
          attended,
          total: totalSessions,
          percentage,
        });

        // Create in-app notification for the student
        await prisma.notification.upsert({
          where: {
            id: `alert-${student.userId}-${courseId}`, // pseudo-unique
          },
          update: {
            message: `Your attendance is at ${percentage}% (${attended}/${totalSessions}). Minimum required: ${threshold}%.`,
          },
          create: {
            userId: student.user.id,
            title: `⚠️ Low Attendance Warning`,
            message: `Your attendance is at ${percentage}% (${attended}/${totalSessions}). Minimum required: ${threshold}%.`,
            type: "WARNING",
          },
        });

        // Log to console (email placeholder)
        console.log(
          `[ALERT-EMAIL] ${student.user.name} (${student.user.email}) — ${percentage}% attendance (below ${threshold}%)`
        );
      }
    }

    return NextResponse.json({
      threshold,
      totalSessions,
      totalStudents: enrollments.length,
      alertsSent: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Alert email error:", error);
    return NextResponse.json({ error: "Failed to send alerts" }, { status: 500 });
  }
}
