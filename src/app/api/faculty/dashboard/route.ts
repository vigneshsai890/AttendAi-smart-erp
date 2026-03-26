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
        faculty: {
          include: {
            department: true,
            courses: {
              include: {
                course: {
                  include: {
                    enrollments: {
                      where: { status: "ACTIVE" },
                      include: {
                        student: {
                          include: { user: true }
                        }
                      }
                    },
                    attendanceSessions: {
                      include: {
                        records: {
                          include: {
                            user: true,
                            proxyAlerts: true,
                          }
                        }
                      },
                      orderBy: { sessionDate: "desc" }
                    }
                  }
                }
              }
            },
            attendanceSessions: {
              where: { status: "ACTIVE" },
              take: 1,
              include: { course: true }
            }
          }
        }
      }
    });

    if (!user || !user.faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 });
    }

    // Get the primary course (first assignment)
    const primaryAssignment = user.faculty.courses[0];
    if (!primaryAssignment) {
      return NextResponse.json({ error: "No course assignments" }, { status: 404 });
    }

    const course = primaryAssignment.course;
    const totalStudents = course.enrollments.length;
    const totalSessions = course.attendanceSessions.length;

    // Build student attendance summary
    const studentStats = course.enrollments.map(enrollment => {
      const student = enrollment.student;
      let present = 0;
      let absent = 0;
      let flagged = false;
      let latestFlag = "";

      for (const sess of course.attendanceSessions) {
        const record = sess.records.find(r => r.userId === student.userId);
        if (record) {
          if (record.status === "PRESENT" || record.status === "LATE") present++;
          else absent++;
          if (record.flagged) {
            flagged = true;
            const alert = record.proxyAlerts[0];
            if (alert) latestFlag = alert.alertType;
          }
        } else {
          absent++;
        }
      }

      const percentage = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;

      return {
        userId: student.userId,
        name: student.user.name,
        rollNumber: student.rollNumber,
        present,
        absent,
        percentage,
        flagged,
        latestFlag,
      };
    });

    // Fraud flags (all flagged records from latest session)
    const fraudFlags: Array<{
      studentName: string;
      rollNumber: string;
      initials: string;
      alertType: string;
      description: string;
    }> = [];

    for (const sess of course.attendanceSessions) {
      for (const record of sess.records) {
        if (record.flagged && record.proxyAlerts.length > 0) {
          const student = course.enrollments.find(e => e.student.userId === record.userId)?.student;
          if (student) {
            for (const alert of record.proxyAlerts) {
              if (alert.status === "PENDING") {
                const nameParts = student.user.name.split(" ");
                fraudFlags.push({
                  studentName: student.user.name,
                  rollNumber: student.rollNumber,
                  initials: nameParts.map(n => n[0]).join("").substring(0, 2).toUpperCase(),
                  alertType: alert.alertType,
                  description: alert.description,
                });
              }
            }
          }
        }
      }
    }

    // Session summary from latest active or most recent session
    const activeSession = user.faculty.attendanceSessions[0];
    let sessionSummary = { present: 0, absent: 0, flagged: 0, percentage: 0 };

    if (activeSession) {
      const latestRecords = await prisma.attendanceRecord.findMany({
        where: { session: { courseId: course.id, status: "ACTIVE" } }
      });
      const p = latestRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
      const f = latestRecords.filter(r => r.flagged).length;
      sessionSummary = {
        present: p,
        absent: totalStudents - p,
        flagged: f,
        percentage: totalStudents > 0 ? Math.round((p / totalStudents) * 100) : 0,
      };
    } else {
      // Use most recent closed session
      const latestSession = course.attendanceSessions[0];
      if (latestSession) {
        const p = latestSession.records.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
        const f = latestSession.records.filter(r => r.flagged).length;
        sessionSummary = {
          present: p,
          absent: totalStudents - p,
          flagged: f,
          percentage: totalStudents > 0 ? Math.round((p / totalStudents) * 100) : 0,
        };
      }
    }

    // Average attendance across all students
    const avgAttendance = studentStats.length > 0
      ? Math.round(studentStats.reduce((sum, s) => sum + s.percentage, 0) / studentStats.length)
      : 0;

    const atRiskStudents = studentStats.filter(s => s.percentage < 75).length;

    return NextResponse.json({
      faculty: {
        name: user.name,
        email: user.email,
        department: user.faculty.department.name,
      },
      course: {
        id: course.id,
        code: course.code,
        name: course.name,
      },
      stats: {
        totalStudents,
        avgAttendance,
        atRiskStudents,
        fraudFlagCount: fraudFlags.length,
      },
      students: studentStats,
      fraudFlags,
      sessionSummary,
      activeSession: activeSession ? {
        id: activeSession.id,
        courseName: activeSession.course.name,
        qrCode: activeSession.qrCode,
        qrExpiry: activeSession.qrExpiry?.toISOString(),
        room: "Room 301",
        totalStudents,
      } : null,
    });
  } catch (error) {
    console.error("Faculty dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
