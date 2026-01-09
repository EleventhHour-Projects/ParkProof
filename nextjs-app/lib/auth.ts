import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function verifySession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as {
      userId: string;
      role: "PARKER" | "ATTENDANT" | "ADMIN";
    };
  } catch {
    return null;
  }
}
