import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based route protection
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    if (path.startsWith("/faculty") && token?.role !== "FACULTY" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    if (path.startsWith("/student") && token?.role !== "STUDENT" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/student/:path*",
    "/faculty/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
