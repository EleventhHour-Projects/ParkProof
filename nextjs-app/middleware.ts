import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = verifySession(request); // { role } | null

  // ---- USER (PARKER) ----
  if (pathname.startsWith("/user")) {
    if (!session || session.role !== "PARKER") {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  // ---- ATTENDANT ----
  if (pathname.startsWith("/attendant")) {
    if (!session || session.role !== "ATTENDANT") {
      return NextResponse.redirect(
        new URL("/attendant/login", request.url)
      );
    }
  }

  // ---- ADMIN ----
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/admin/:path*", "/attendant/:path*"],
};
