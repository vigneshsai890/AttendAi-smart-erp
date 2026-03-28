export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/attendance/live?sessionId=... — returns current present list for a session
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  try {
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        records: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                student: { select: { rollNumber: true } },
              },
            },
          },
          orderBy: { markedAt: "asc" },
        },
      },
    });

    if (!attendanceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const present = attendanceSession.records.filter(
      (r) => r.status === "PRESENT" || r.status === "PROXY"
    );

    return NextResponse.json(
      {
        sessionId,
        status: attendanceSession.status,
        courseName: attendanceSession.course.name,
        courseCode: attendanceSession.course.code,
        totalPresent: present.length,
        records: present.map((r) => ({
          id: r.id,
          userId: r.userId,
          name: r.user.name,
          rollNumber: r.user.student?.rollNumber ?? "—",
          status: r.status,
          markedAt: r.markedAt,
          flagged: r.flagged,
          riskScore: r.riskScore,
        })),
      },
      { headers: { "Cache-Control": "private, max-age=2, stale-while-revalidate=5" } }
    );
  } catch (error) {
    console.error("Live attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch live attendance" }, { status: 500 });
  }
}
