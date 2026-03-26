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

  const departments = await prisma.department.findMany({
    include: {
      sections: { orderBy: { name: "asc" } },
      _count: { select: { students: true, faculty: true, courses: true } },
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({ departments });
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { code, name, description, sections } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: "Department code already exists" }, { status: 400 });

    const dept = await prisma.department.create({
      data: {
        code, name, description,
        sections: sections ? {
          create: sections.map((s: { name: string; year: number; batchYear: number }) => ({
            name: s.name, year: s.year || 1, batchYear: s.batchYear || new Date().getFullYear(),
          })),
        } : undefined,
      },
      include: { sections: true },
    });

    return NextResponse.json({ department: dept }, { status: 201 });
  } catch (error) {
    console.error("Create department error:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
