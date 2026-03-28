export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const { name, email, year, semester, sectionId, departmentId } = body;

    const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    await prisma.user.update({ where: { id: student.userId }, data: { name, email } });
    const updated = await prisma.student.update({
      where: { id },
      data: { year, semester, sectionId, departmentId },
      include: { user: { select: { name: true, email: true } }, department: true, section: true },
    });

    return NextResponse.json({ student: updated });
  } catch (error) {
    console.error("Update student error:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Cascade delete user will delete student too
    await prisma.user.delete({ where: { id: student.userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
