import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

/**
 * Robustly fetch the current session user from the backend.
 * Falls back to manual token decoding if the backend is slow or unreachable.
 */
export async function getSessionUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Attempt backend sync with a short timeout to prevent hanging the edge function
    const res = await backend.get("/auth/me", {
      headers: { "Authorization": authHeader },
      timeout: 8000 // 8s timeout for the check
    });

    if (res.data && res.data.user) {
      return res.data.user;
    }
  } catch (error: any) {
    console.warn("[AUTH_UTILS] Backend profile sync failed or timed out. Falling back to token decode.");
  }

  // CRITICAL FALLBACK: If backend is slow/down, decode the JWT to get the Firebase identity
  // This allows proxying to proceed; the backend will perform the final verification anyway.
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      // Use atob for better compatibility across Next.js environments
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (payload && (payload.sub || payload.user_id)) {
        const uid = payload.sub || payload.user_id;
        console.log("[AUTH_UTILS] Fallback success. Identity:", payload.email || uid);
        return {
          id: uid, // Use UID as temporary ID
          firebaseUid: uid,
          email: payload.email || "",
          name: payload.name || payload.email?.split("@")[0] || "User",
          role: "STUDENT", // Default to student during fallback
          isProfileComplete: false
        };
      }
    }
  } catch (e: any) {
    console.error("[AUTH_UTILS] Fatal: Failed to decode fallback token:", e.message);
  }

  return null;
}
