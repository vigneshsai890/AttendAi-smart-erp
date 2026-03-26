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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: {
          include: {
            department: true,
            section: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                course: {
                  include: {
                    assignments: { include: { faculty: { include: { user: true } } } },
                    attendanceSessions: {
                      include: {
                        records: { where: { userId: session.user.id } }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        notifications: { orderBy: { createdAt: "desc" }, take: 10 },
      }
    });

    if (!user || !user.student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Get Exam results
    const examResults = await prisma.examResult.findMany({
      where: { studentRoll: user.student.rollNumber },
      include: { exam: true },
      orderBy: { exam: { date: "desc" } }
    });

    const exams = examResults.map(er => ({
      examName: er.exam.name,
      courseCode: er.exam.courseCode,
      marks: er.marks,
      maxMarks: er.exam.maxMarks,
      grade: er.grade,
      date: er.exam.date?.toISOString(),
      percentage: Math.round((er.marks / er.exam.maxMarks) * 100)
    }));

    // Build course stats
    const subjects = user.student.enrollments.map(enrollment => {
      const course = enrollment.course;
      const totalSessions = course.attendanceSessions.length;
      const attended = course.attendanceSessions.filter(
        s => s.records.some(r => r.status === "PRESENT" || r.status === "LATE")
      ).length;
      const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      const faculty = course.assignments[0]?.faculty;

      return {
        id: course.id,
        code: course.code,
        name: course.name,
        credits: course.credits,
        facultyName: faculty?.user?.name || "TBA",
        attended,
        total: totalSessions,
        percentage,
        status: percentage >= 80 ? "safe" : percentage >= 75 ? "borderline" : "at-risk"
      };
    });

    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
    const safeCount = subjects.filter(s => s.status === "safe" || s.status === "borderline").length;
    const atRiskCount = subjects.filter(s => s.status === "at-risk").length;

    // Today's timetable
    const dayOfWeek = new Date().getDay(); // 0=Sun..6=Sat
    const schedules = await prisma.schedule.findMany({
      where: { sectionId: user.student.sectionId, dayOfWeek },
      include: {
        course: {
          include: {
            assignments: { include: { faculty: { include: { user: true } } } },
            attendanceSessions: {
              where: { status: "ACTIVE" },
              take: 1
            }
          }
        }
      },
      orderBy: { startTime: "asc" }
    });

    const timetable = schedules.map(sched => {
      const faculty = sched.course.assignments[0]?.faculty;
      const activeSession = sched.course.attendanceSessions[0];
      const courseSubj = subjects.find(s => s.id === sched.course.id);
      return {
        courseId: sched.course.id,
        courseName: sched.course.name,
        courseCode: sched.course.code,
        startTime: sched.startTime,
        endTime: sched.endTime,
        room: sched.room,
        facultyName: faculty?.user?.name || "TBA",
        lectureNumber: courseSubj ? courseSubj.total + 1 : 1,
        isLive: !!activeSession,
        sessionId: activeSession?.id || null,
      };
    });

    // Recent activity (last 5 attendance records)
    const recentRecords = await prisma.attendanceRecord.findMany({
      where: { userId: session.user.id },
      orderBy: { markedAt: "desc" },
      take: 5,
      include: {
        session: {
          include: { course: true }
        }
      }
    });

    const recentActivity = recentRecords.map(r => ({
      courseName: r.session.course.name,
      courseCode: r.session.course.code,
      status: r.status,
      markedAt: r.markedAt.toISOString(),
      sessionDate: r.session.sessionDate.toISOString(),
      startTime: r.session.startTime,
    }));

    // Active session for QR
    const activeSession = await prisma.attendanceSession.findFirst({
      where: { status: "ACTIVE" },
      include: { course: true }
    });

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
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
        safeCount,
        atRiskCount,
      },
      subjects,
      exams,
      timetable,
      recentActivity,
      notifications: user.notifications,
      activeSession: activeSession ? {
        id: activeSession.id,
        courseName: activeSession.course.name,
        courseCode: activeSession.course.code,
        qrCode: activeSession.qrCode,
        qrExpiry: activeSession.qrExpiry?.toISOString(),
      } : null,
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
