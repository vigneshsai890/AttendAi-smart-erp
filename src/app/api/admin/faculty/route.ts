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

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faculty = await prisma.faculty.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
      department: { select: { code: true, name: true } },
    },
    orderBy: { employeeId: "asc" },
  });

  return NextResponse.json({ faculty });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, email, password, employeeId, designation, departmentId } = body;

    if (!name || !email || !password || !employeeId || !departmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name, email, password: hashedPassword, role: "FACULTY",
        faculty: {
          create: { employeeId, designation: designation || "Assistant Professor", departmentId },
        },
      },
      include: { faculty: { include: { department: true } } },
    });

    return NextResponse.json({ faculty: user.faculty, user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("Create faculty error:", error);
    return NextResponse.json({ error: "Failed to create faculty" }, { status: 500 });
  }
}
