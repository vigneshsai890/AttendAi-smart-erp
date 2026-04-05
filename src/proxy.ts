import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Define public paths that NEVER redirect
  const isPublicPath = 
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.endsWith(".ico") ||
    path.endsWith(".png");

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 2. Check for the session cookie (Better Auth standard name)
  // We check for both standard and secure variants
  const sessionCookie = 
    request.cookies.get("better-auth.session_token") || 
    request.cookies.get("__Secure-better-auth.session_token");

  // 3. If no cookie and trying to access protected areas, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    // Store the intended destination to redirect back after login
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // 4. If cookie exists, let the request through. 
  // Deep role-based checks happen in the layouts/pages where DB access is safe.
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