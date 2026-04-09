import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[AUTH_ME] Request missing valid Bearer token");
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const targetUrl = backend.defaults.baseURL + "/auth/me";
    console.log("[AUTH_ME] Proxying to backend:", targetUrl);

    // Call the Express backend to verify token and fetch/auto-heal profile
    const res = await backend.get("/auth/me", {
      headers: {
        "Authorization": authHeader
      }
    });

    console.log("[AUTH_ME] Backend response success:", res.status);
    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error("[AUTH_ME] Proxy error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || "Internal server error";
    return NextResponse.json({ error: message }, { status });
  }
}
