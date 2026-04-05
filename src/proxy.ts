import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Allow public assets and auth paths to bypass middleware completely
  if (
    path.startsWith("/_next") || 
    path.startsWith("/static") || 
    path.startsWith("/api/auth") ||
    path.startsWith("/auth") ||
    path === "/login" ||
    path === "/signup" ||
    path === "/"
  ) {
    return NextResponse.next();
  }

  // 2. Fetch session
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // 3. If no session and trying to access protected routes, redirect to login ONCE
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    // Avoid redirect loop if already on login
    if (path === "/login") return NextResponse.next();
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user as any;

  // 4. Role-based protection (Redirect to their respective dashboards if they are in the wrong place)
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};