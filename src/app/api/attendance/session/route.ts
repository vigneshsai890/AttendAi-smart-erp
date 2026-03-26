import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "FACULTY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { courseId, latitude, longitude, geoRadius } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { userId: session.user.id }
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 });
    }

    const activeSession = await prisma.attendanceSession.create({
      data: {
        courseId,
        facultyId: faculty.id,
        sessionDate: new Date(),
        startTime: new Date().toLocaleTimeString(),
        endTime: "",
        qrCode: uuidv4(), // First QR token
        qrExpiry: new Date(Date.now() + 15 * 1000), // 15 seconds expiry
        latitude: latitude || null,
        longitude: longitude || null,
        geoRadius: geoRadius || 50,
        status: "ACTIVE"
      }
    });

    return NextResponse.json(activeSession);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "FACULTY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId, action } = await req.json();

    if (action === "REFRESH_QR") {
      const updated = await prisma.attendanceSession.update({
        where: { id: sessionId },
        data: {
          qrCode: uuidv4(),
          qrExpiry: new Date(Date.now() + 15 * 1000)
        }
      });
      return NextResponse.json({ qrCode: updated.qrCode, qrExpiry: updated.qrExpiry });
    } else if (action === "CLOSE") {
      await prisma.attendanceSession.update({
        where: { id: sessionId },
        data: {
          status: "CLOSED",
          endTime: new Date().toLocaleTimeString(),
          qrCode: null,
        }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
