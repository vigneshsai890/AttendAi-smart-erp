import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  // Let the client-side AuthProvider handle route protection
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude root path, api, static files, and common public assets
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login|signup|$).*)',
  ],
};