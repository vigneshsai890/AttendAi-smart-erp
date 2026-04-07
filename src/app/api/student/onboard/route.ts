export const dynamic = "force-dynamic";

import { backend } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // We expect the client to send the Firebase ID Token
    // We just proxy it to the backend where verification happens
    const body = await req.json();
    
    // We also need to extract uid for the onboard body if the backend expects userId.
    // The backend middleware will attach the real user to req.user after verifying.
    // For safety, let the backend infer userId from the token, or decode the token here
    // just to fulfill the payload requirement.
    const token = authHeader.split("Bearer ")[1];
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
    
    const firebaseUid = decoded.user_id;

    const res = await backend.post("/dashboard/onboard", {
      ...body,
      userId: firebaseUid, // Temporarily pass firebaseUid, backend must handle this
    }, {
      headers: {
        "Authorization": authHeader
      }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.response?.data?.error || "Onboarding failed" }, { status: error.response?.status || 500 });
  }
}
