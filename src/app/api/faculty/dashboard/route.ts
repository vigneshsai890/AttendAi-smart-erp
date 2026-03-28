export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ── 1. Get faculty + department (lean) ──────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        faculty: {
          select: {
            id: true,
            department: { select: { name: true } },
            courses: {
              take: 1,
              select: {
                course: { select: { id: true, code: true, name: true } },
              },
            },
            attendanceSessions: {
              where: { status: "ACTIVE" },
              take: 1,
              select: {
                id: true,
                qrCode: true,
                qrExpiry: true,
                course: { select: { name: true, id: true } },
              },
            },
          },
        },
      },
    });

    if (!user?.faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 });
    }

    const primaryAssignment = user.faculty.courses[0];
    if (!primaryAssignment) {
      return NextResponse.json({ error: "No course assignments" }, { status: 404 });
    }

    const course = primaryAssignment.course;

    // ── 2. Aggregate counts (parallel) ──────────────────────────────────────
    const [totalStudents, totalSessions] = await Promise.all([
      prisma.enrollment.count({ where: { courseId: course.id, status: "ACTIVE" } }),
      prisma.attendanceSession.count({ where: { courseId: course.id } }),
    ]);

    // ── 3. Attendance stats via groupBy — one query for all students ──────────
    const attendanceGroups = await prisma.attendanceRecord.groupBy({
      by: ["userId", "status"],
      where: { session: { courseId: course.id } },
      _count: { _all: true },
    });

    // ── 4. Flagged records (capped, lean) ────────────────────────────────────
    const flaggedRecords = await prisma.attendanceRecord.findMany({
      where: { session: { courseId: course.id }, flagged: true },
      select: {
        userId: true,
        proxyAlerts: {
          where: { status: "PENDING" },
          take: 1,
          select: { alertType: true, description: true },
        },
      },
      take: 100,
    });

    // ── 5. Student list for names + roll numbers ──────────────────────────────
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: course.id, status: "ACTIVE" },
      select: {
        student: {
          select: {
            userId: true,
            rollNumber: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { student: { rollNumber: "asc" } },
      take: 200,
    });

    // ── 6. Build student stats from grouped data ──────────────────────────────
    const flaggedMap = new Map(flaggedRecords.map((r) => [r.userId, r]));

    const studentStats = enrollments.map((e) => {
      const student = e.student;
      const groups = attendanceGroups.filter((g) => g.userId === student.userId);
      const present = groups
        .filter((g) => g.status === "PRESENT" || g.status === "LATE")
        .reduce((sum, g) => sum + g._count._all, 0);
      const flaggedData = flaggedMap.get(student.userId);
      const percentage = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;
      return {
        userId: student.userId,
        name: student.user.name,
        rollNumber: student.rollNumber,
        present,
        absent: totalSessions - present,
        percentage,
        flagged: !!flaggedData,
        latestFlag: flaggedData?.proxyAlerts[0]?.alertType ?? "",
      };
    });

    // ── 7. Fraud flags ────────────────────────────────────────────────────────
    const studentMap = new Map(enrollments.map((e) => [e.student.userId, e.student]));
    const fraudFlags = flaggedRecords.flatMap((r) => {
      const student = studentMap.get(r.userId);
      if (!student || r.proxyAlerts.length === 0) return [];
      const nameParts = student.user.name.split(" ");
      return r.proxyAlerts.map((alert) => ({
        studentName: student.user.name,
        rollNumber: student.rollNumber,
        initials: nameParts.map((n) => n[0]).join("").substring(0, 2).toUpperCase(),
        alertType: alert.alertType,
        description: alert.description,
      }));
    });

    // ── 8. Session summary ────────────────────────────────────────────────────
    const activeSession = user.faculty.attendanceSessions[0];
    let sessionSummary = { present: 0, absent: 0, flagged: 0, percentage: 0 };

    if (activeSession) {
      const [presentCount, flaggedCount] = await Promise.all([
        prisma.attendanceRecord.count({
          where: { sessionId: activeSession.id, status: { in: ["PRESENT", "LATE"] } },
        }),
        prisma.attendanceRecord.count({
          where: { sessionId: activeSession.id, flagged: true },
        }),
      ]);
      sessionSummary = {
        present: presentCount,
        absent: totalStudents - presentCount,
        flagged: flaggedCount,
        percentage: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0,
      };
    }

    const avgAttendance =
      studentStats.length > 0
        ? Math.round(studentStats.reduce((sum, s) => sum + s.percentage, 0) / studentStats.length)
        : 0;
    const atRiskStudents = studentStats.filter((s) => s.percentage < 75).length;

    return NextResponse.json({
      faculty: { name: user.name, email: user.email, department: user.faculty.department.name },
      course: { id: course.id, code: course.code, name: course.name },
      stats: { totalStudents, avgAttendance, atRiskStudents, fraudFlagCount: fraudFlags.length },
      students: studentStats,
      fraudFlags,
      sessionSummary,
      activeSession: activeSession
        ? {
            id: activeSession.id,
            courseName: activeSession.course.name,
            qrCode: activeSession.qrCode,
            qrExpiry: activeSession.qrExpiry?.toISOString(),
            room: "Room 301",
            totalStudents,
          }
        : null,
    });
  } catch (error) {
    console.error("Faculty dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
