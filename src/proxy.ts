import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function proxy(request: NextRequest) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const path = request.nextUrl.pathname;

  // If no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = session.user as any;

  // Role-based route protection
  if (path.startsWith("/admin") && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL(user?.role === "FACULTY" ? "/faculty/dashboard" : "/student/dashboard", request.url));
  }

  if (path.startsWith("/faculty") && user?.role !== "FACULTY" && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL(user?.role === "STUDENT" ? "/student/dashboard" : "/admin", request.url));
  }

  if (path.startsWith("/student") && user?.role !== "STUDENT" && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL(user?.role === "FACULTY" ? "/faculty/dashboard" : "/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/faculty/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};