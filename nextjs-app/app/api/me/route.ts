import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await verifySession(req);

    if (!session) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    return NextResponse.json(
        {
            userId: session.userId,
            role: session.role,
        },
        { status: 200 }
    );
}
