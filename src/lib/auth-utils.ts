import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

export async function getSessionUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const res = await backend.get("/auth/me", {
      headers: {
        "Authorization": authHeader
      }
    });

    if (res.data && res.data.user) {
      return res.data.user;
    }
    
    return null;
  } catch (error: any) {
    console.error("[AUTH_UTILS] Error fetching session user via backend proxy:", error.response?.data || error.message);
    return null;
  }
}
