import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Session
        const session = await verifySession(req);
        if (!session || session.role !== 'ATTENDANT') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // 2. Call Go Backend
        const goRes = await fetch("http://127.0.0.1:8000/api/attendant/query/reply", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!goRes.ok) {
            console.error("Go Backend Reply Error:", goRes.status);
            return NextResponse.json({ message: "Failed to reply" }, { status: 502 });
        }

        const data = await goRes.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Reply Proxy Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
