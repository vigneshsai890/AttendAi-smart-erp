import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // Call the Express backend to verify token and fetch/auto-heal profile
    // This bypasses any MongoDB connection issues on Vercel Edge/Serverless environments
    const res = await backend.get("/auth/me", {
      headers: {
        "Authorization": authHeader
      }
    });

    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error("[AUTH_ME] Proxy error:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
