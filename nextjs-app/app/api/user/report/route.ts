import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import dbConnect from "@/lib/db/dbConnect";
import ReportModel from "@/model/Report";
import ParkingLotModel from "@/model/ParkingLot";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Verify Session
        const session = await verifySession(req);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await req.json();
        const { type, description, images, parkingLotId } = body;

        // 3. Validation
        if (!type) {
            return NextResponse.json(
                { message: "Issue type is required" },
                { status: 400 }
            );
        }

        const validTypes = [
            'OVERPARKING',
            'UNAUTHORIZED_PARKING',
            'TICKET_FRAUD',
            'OVERCHARGING',
            'OTHER'
        ];

        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { message: "Invalid issue type" },
                { status: 400 }
            );
        }

        if (images && (!Array.isArray(images) || images.length > 3)) {
            return NextResponse.json(
                { message: "Maximum 3 images allowed" },
                { status: 400 }
            );
        }

        // Validate ParkingLot if provided
        if (parkingLotId) {
            const lot = await ParkingLotModel.findById(parkingLotId);
            if (!lot) {
                return NextResponse.json(
                    { message: "Invalid Parking Lot ID" },
                    { status: 404 }
                );
            }
        }

        // 4. Create Report
        const newReport = await ReportModel.create({
            userId: session.userId,
            parkingLotId: parkingLotId || null,
            type,
            description,
            images: images || [],
            status: 'PENDING'
        });

        return NextResponse.json(
            { message: "Report submitted successfully", reportId: newReport._id },
            { status: 201 }
        );

    } catch (error) {
        console.error("Report submission error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
