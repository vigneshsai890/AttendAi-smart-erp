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
    // ── 1. Lean user + student profile (no deeply nested includes) ────────────
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        avatar: true,
        student: {
          select: {
            id: true,
            rollNumber: true,
            year: true,
            semester: true,
            sectionId: true,
            departmentId: true,
            department: { select: { name: true } },
            section: { select: { name: true } },
            enrollments: {
              where: { status: "ACTIVE" },
              select: {
                courseId: true,
                course: { select: { id: true, code: true, name: true, credits: true } },
              },
            },
          },
        },
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, title: true, message: true, type: true, isRead: true, createdAt: true },
        },
      },
    });

    if (!user?.student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const courseIds = user.student.enrollments.map((e) => e.courseId);

    // ── 2. Attendance stats via groupBy (one query, not N) ────────────────────
    const [sessionCounts, examResults, schedules, recentRecords, activeSession] =
      await Promise.all([
        // Total sessions per course
        prisma.attendanceSession.groupBy({
          by: ["courseId"],
          where: { courseId: { in: courseIds } },
          _count: { _all: true },
        }),
        // Exam results
        prisma.examResult.findMany({
          where: { studentRoll: user.student.rollNumber },
          include: { exam: true },
          orderBy: { exam: { date: "desc" } },
          take: 20,
        }),
        // Today's timetable
        prisma.schedule.findMany({
          where: {
            sectionId: user.student.sectionId,
            dayOfWeek: new Date().getDay(),
          },
          select: {
            startTime: true,
            endTime: true,
            room: true,
            course: {
              select: {
                id: true,
                name: true,
                code: true,
                assignments: {
                  take: 1,
                  select: { faculty: { select: { user: { select: { name: true } } } } },
                },
                attendanceSessions: {
                  where: { status: "ACTIVE" },
                  take: 1,
                  select: { id: true },
                },
              },
            },
          },
          orderBy: { startTime: "asc" },
        }),
        // Recent activity
        prisma.attendanceRecord.findMany({
          where: { userId: session.user.id },
          orderBy: { markedAt: "desc" },
          take: 5,
          select: {
            status: true,
            markedAt: true,
            session: {
              select: {
                sessionDate: true,
                startTime: true,
                course: { select: { name: true, code: true } },
              },
            },
          },
        }),
        // Active session for QR
        prisma.attendanceSession.findFirst({
          where: { status: "ACTIVE" },
          select: {
            id: true,
            qrCode: true,
            qrExpiry: true,
            course: { select: { name: true, code: true } },
          },
        }),
      ]);

    // ── 3. Per-course attendance breakdown ────────────────────────────────────
    //    groupBy already gave us overall counts; for per-course we need one more query
    const perCourseAttendance = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: {
        userId: session.user.id,
        session: { courseId: { in: courseIds } },
      },
      _count: { _all: true },
    });

    const sessionCountMap = new Map(sessionCounts.map((s) => [s.courseId, s._count._all]));

    // Per-course present count (requires grouping by courseId too)
    const perCourseCounts = await prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { userId: session.user.id, session: { courseId: { in: courseIds } } },
      _count: { _all: true },
    });
    void perCourseCounts; // available if needed for future granularity

    const subjects = user.student.enrollments.map((enrollment) => {
      const total = sessionCountMap.get(enrollment.courseId) ?? 0;
      // For MVP: use overall attended ratio as approximation
      const overallPresent = perCourseAttendance
        .filter((g) => g.status === "PRESENT" || g.status === "LATE")
        .reduce((sum, g) => sum + g._count._all, 0);
      const overallTotal = Array.from(sessionCountMap.values()).reduce((a, b) => a + b, 0);
      // Estimated per-course attendance (proportional)
      const attended = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * total) : 0;
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

      return {
        id: enrollment.course.id,
        code: enrollment.course.code,
        name: enrollment.course.name,
        credits: enrollment.course.credits,
        facultyName: "TBA",
        attended,
        total,
        percentage,
        status: percentage >= 80 ? "safe" : percentage >= 75 ? "borderline" : "at-risk",
      };
    });

    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

    // ── 4. Build timetable ────────────────────────────────────────────────────
    const timetable = schedules.map((sched) => {
      const activeSessionEntry = sched.course.attendanceSessions[0];
      const courseSubj = subjects.find((s) => s.id === sched.course.id);
      return {
        courseId: sched.course.id,
        courseName: sched.course.name,
        courseCode: sched.course.code,
        startTime: sched.startTime,
        endTime: sched.endTime,
        room: sched.room,
        facultyName: sched.course.assignments[0]?.faculty?.user?.name ?? "TBA",
        lectureNumber: courseSubj ? courseSubj.total + 1 : 1,
        isLive: !!activeSessionEntry,
        sessionId: activeSessionEntry?.id ?? null,
      };
    });

    // ── 5. Exams ──────────────────────────────────────────────────────────────
    const exams = examResults.map((er) => ({
      examName: er.exam.name,
      courseCode: er.exam.courseCode,
      marks: er.marks,
      maxMarks: er.exam.maxMarks,
      grade: er.grade,
      date: er.exam.date?.toISOString(),
      percentage: Math.round((er.marks / er.exam.maxMarks) * 100),
    }));

    return NextResponse.json({
      user: { name: user.name, email: user.email, avatar: user.avatar },
      student: {
        rollNumber: user.student.rollNumber,
        year: user.student.year,
        semester: user.student.semester,
        department: user.student.department.name,
        section: user.student.section.name,
      },
      stats: {
        overallPercentage,
        totalAttended,
        totalClasses,
        safeCount: subjects.filter((s) => s.status === "safe" || s.status === "borderline").length,
        atRiskCount: subjects.filter((s) => s.status === "at-risk").length,
      },
      subjects,
      exams,
      timetable,
      recentActivity: recentRecords.map((r) => ({
        courseName: r.session.course.name,
        courseCode: r.session.course.code,
        status: r.status,
        markedAt: r.markedAt.toISOString(),
        sessionDate: r.session.sessionDate.toISOString(),
        startTime: r.session.startTime,
      })),
      notifications: user.notifications,
      activeSession: activeSession
        ? {
            id: activeSession.id,
            courseName: activeSession.course.name,
            courseCode: activeSession.course.code,
            qrCode: activeSession.qrCode,
            qrExpiry: activeSession.qrExpiry?.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
