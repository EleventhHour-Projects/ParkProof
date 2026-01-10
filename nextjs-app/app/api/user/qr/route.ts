import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import dbConnect from "@/lib/db/dbConnect";
import UserModel from "@/model/User";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Verify Authentication
        const session = await verifySession(req);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 2. Get User Details (Phone as Username)
        const user = await UserModel.findById(session.userId);
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // 3. Get Query Params
        const { searchParams } = new URL(req.url);
        const vehicleNumber = searchParams.get("vehicle");
        const typeParam = searchParams.get("type");

        if (!vehicleNumber) {
            return new NextResponse("Vehicle number required", { status: 400 });
        }

        // 4. Map Vehicle Type
        let vehicleType = "CAR";
        if (typeParam === "2w" || typeParam?.toLowerCase().includes("bike")) {
            vehicleType = "BIKE";
        } else if (typeParam === "3w" || typeParam?.toLowerCase().includes("auto") || typeParam?.toLowerCase().includes("rickshaw")) {
            vehicleType = "Rickshaw";
        }

        // 5. Call Go Backend
        const backendUrl = "https://parkproof.onrender.com/internal/userqr";
        const payload = {
            vehicle: vehicleNumber,
            vehicle_type: vehicleType,
            username: user.phone
        };

        const backendRes = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!backendRes.ok) {
            console.error("Backend QR generation failed", backendRes.status, await backendRes.text());
            return new NextResponse("Failed to generate QR", { status: 502 });
        }

        // 6. Return Image
        const imageBuffer = await backendRes.arrayBuffer();

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        });

    } catch (error) {
        console.error("QR Proxy Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
