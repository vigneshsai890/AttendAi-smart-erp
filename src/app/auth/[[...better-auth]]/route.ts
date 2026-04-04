import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Force dynamic is mandatory for Better Auth in Next.js App Router
export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    if (req.nextUrl.pathname.endsWith("/ping")) {
      return NextResponse.json({
        status: "ALIVE",
        service: "Frontend Auth Handler",
        env: {
          hasSecret: !!process.env.BETTER_AUTH_SECRET,
          hasMongo: !!process.env.MONGO_URI,
          nodeEnv: process.env.NODE_ENV,
          isRender: !!process.env.RENDER,
          bridgeActive: !process.env.BETTER_AUTH_SECRET || !process.env.MONGO_URI
        },
        deploy: "066fa7da-DIAGS"
      });
    }
    const auth = await getAuth();
    return toNextJsHandler(auth).GET(req);
  } catch (err: any) {
    console.error("🔥 [AUTH ERROR GET]:", err);
    return NextResponse.json({ error: "AUTH_INIT_ERROR", message: err.message, stack: err.stack }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const auth = await getAuth();
    return toNextJsHandler(auth).POST(req);
  } catch (err: any) {
    console.error("🔥 [AUTH ERROR POST]:", err);
    return NextResponse.json({ error: "AUTH_INIT_ERROR", message: err.message, stack: err.stack }, { status: 500 });
  }
};
