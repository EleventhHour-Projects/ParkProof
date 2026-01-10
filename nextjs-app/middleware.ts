import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request); // { role } | null

  // ========================
  // LOGIN PAGE GUARDS
  // ========================

  if (session) {
    if (pathname === "/login" && session.role === "PARKER") {
      return NextResponse.redirect(new URL("/user", request.url));
    }

    if (
      pathname === "/attendant/login" &&
      session.role === "ATTENDANT"
    ) {
      return NextResponse.redirect(new URL("/attendant/dashboard", request.url));
    }

    if (pathname === "/admin/login" && session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // ========================
  // PROTECTED ROUTES
  // ========================

  if (pathname.startsWith("/user")) {
    if (!session || session.role !== "PARKER") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/attendant") && pathname !== "/attendant/login") {
    if (!session || session.role !== "ATTENDANT") {
      return NextResponse.redirect(
        new URL("/attendant/login", request.url)
      );
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/user/:path*",
    "/attendant/:path*",
    "/attendant/login",
    "/admin/:path*",
    "/admin/login",
  ],
};
