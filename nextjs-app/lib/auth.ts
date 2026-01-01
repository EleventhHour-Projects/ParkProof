import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function verifySession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: "PARKER" | "ATTENDANT" | "ADMIN";
    };
  } catch {
    return null;
  }
}
