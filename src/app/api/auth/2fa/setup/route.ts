import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSecret, generateURI } from "otplib";
import qrcode from "qrcode";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    // Generate specific secret for the user
    const secret = generateSecret();
    const otpauth = generateURI({
      label: user.email,
      issuer: "Smart ERP",
      secret,
    });

    const qrCodeImage = await qrcode.toDataURL(otpauth);

    // Temp save secret (in a real prod app, store in a pending state or cache until verified)
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    return NextResponse.json({
      secret,
      qrCodeImage,
    });
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
