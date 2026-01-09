// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json({ authenticated: true }, { status: 200 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
