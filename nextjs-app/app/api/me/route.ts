import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import UserModel from "@/model/User";
import dbConnect from "@/lib/db/dbConnect";

export async function GET(req: NextRequest) {
    const session = await verifySession(req);

    if (!session) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        await dbConnect();
        const user = await UserModel.findById(session.userId);

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                userId: session.userId,
                role: session.role,
                parkingLotId: user.parkingLotId || null
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Me API Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
