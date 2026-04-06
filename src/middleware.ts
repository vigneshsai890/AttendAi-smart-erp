import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  // 2. ONLY check for cookie existence (No DB calls here!)
  // NextAuth uses next-auth.session-token (or __Secure- for production/https)
  const sessionCookie = 
    request.cookies.get("next-auth.session-token") || 
    request.cookies.get("__Secure-next-auth.session-token");

  // 3. If no cookie, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Let them through. The Page/Layout will do the deep validation.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};