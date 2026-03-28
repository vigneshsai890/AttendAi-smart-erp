export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where = search ? {
    OR: [
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { rollNumber: { contains: search } },
    ],
  } : {};

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, isActive: true } },
        department: { select: { code: true, name: true } },
        section: { select: { name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { rollNumber: "asc" },
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({ students, total, page, limit });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, email, password, rollNumber, regNumber, year, semester, sectionId, departmentId, batchYear } = body;

    if (!name || !email || !password || !rollNumber || !regNumber || !sectionId || !departmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) return NextResponse.json({ error: "Roll number already exists" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name, email, password: hashedPassword, role: "STUDENT",
        student: {
          create: {
            rollNumber, regNumber,
            year: year || 1, semester: semester || 1,
            sectionId, departmentId, batchYear: batchYear || new Date().getFullYear(),
          },
        },
      },
      include: { student: { include: { department: true, section: true } } },
    });

    return NextResponse.json({ student: user.student, user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("Create student error:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
