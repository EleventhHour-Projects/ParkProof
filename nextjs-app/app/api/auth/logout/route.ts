import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json(
        { message: "Logout successful" },
        { status: 200 }
    );

    // Clear the session cookie by setting maxAge to 0 and expiring it immediately
    response.cookies.set("session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        expires: new Date(0),
    });

    return response;
}
