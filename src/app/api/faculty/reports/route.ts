export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) return NextResponse.json({ error: "Course ID required" }, { status: 400 });

  const records = await prisma.attendanceRecord.findMany({
    where: { session: { courseId } },
    include: { user: true, session: true, proxyAlerts: true },
    orderBy: { markedAt: "desc" },
  });

  const csvHeader = "Name,Email,Date,Time,Status,IP Address,Device Flags,Risk Score\n";
  const csvRows = records.map(r => {
    const flags = r.proxyAlerts.map(a => a.alertType).join(" | ");
    return `"${r.user.name}","${r.user.email}","${r.session.sessionDate.toISOString().split("T")[0]}","${r.markedAt.toLocaleTimeString()}","${r.status}","${r.ipAddress || ""}","${flags}","${r.riskScore}"`;
  });

  const csvContent = csvHeader + csvRows.join("\n");

  return NextResponse.json({ csv: csvContent });
}
