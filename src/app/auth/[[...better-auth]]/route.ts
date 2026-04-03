import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic is mandatory for Better Auth in Next.js App Router
export const dynamic = "force-dynamic";

const handler = toNextJsHandler(auth);

export const GET = async (req: NextRequest) => {
  if (req.nextUrl.pathname.endsWith("/ping")) {
    return NextResponse.json({ status: "ALIVE", service: "Frontend Auth Handler" });
  }
  return handler.GET(req);
};

export const POST = async (req: NextRequest) => {
  return handler.POST(req);
};
