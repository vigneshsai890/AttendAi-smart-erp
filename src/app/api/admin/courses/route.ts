import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await prisma.course.findMany({
    include: {
      department: { select: { code: true, name: true } },
      assignments: { include: { faculty: { include: { user: { select: { name: true } } } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { code, name, credits, courseType, departmentId, semester, facultyId, studentIds } = body;

    if (!code || !name || !departmentId || !semester) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: "Course code already exists" }, { status: 400 });

    const course = await prisma.course.create({
      data: {
        code, name,
        credits: credits || 3,
        courseType: courseType || "LECTURE",
        departmentId, semester,
      },
    });

    // Assign faculty if provided
    if (facultyId) {
      await prisma.courseAssignment.create({
        data: {
          courseId: course.id, facultyId,
          academicYear: new Date().getFullYear(), semester,
        },
      });
    }

    // Enroll students if provided
    if (studentIds && studentIds.length > 0) {
      await prisma.enrollment.createMany({
        data: studentIds.map((sid: string) => ({
          studentId: sid, courseId: course.id,
          academicYear: new Date().getFullYear(), semester,
        })),
      });
    }

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
