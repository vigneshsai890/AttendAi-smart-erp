export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verify } from "otplib";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (!user.twoFactorSecret && !user.twoFactorEnabled)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const isValid = verify({
      token,
      secret: user.twoFactorSecret!,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Mark 2FA as fully enabled
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying 2FA:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
