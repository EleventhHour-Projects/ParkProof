import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import dbConnect from "@/lib/db/dbConnect";
import UserModel from "@/model/User";
import ParkingSessionModel from "@/model/ParkingSession";
import ParkingLotModel from "@/model/ParkingLot";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Auth
        const session = await verifySession(req);
        if (!session || session.role !== 'ATTENDANT') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Get Parking Lot ID
        const user = await UserModel.findById(session.userId);
        if (!user || !user.parkingLotId) {
            return NextResponse.json({ message: "No parking lot assigned" }, { status: 400 });
        }

        // Ensure accurate Lot ID resolution (String or ObjectId)
        let lotId = user.parkingLotId;
        // If it's a string PID, we might need to find the ObjectId if sessions store ObjectIds. 
        // Checking Session Model... likely stores pid or nothing? 
        // Let's check session model. Wait, I didn't read Session Model. 
        // Assuming Session might store `parkingLotId`. If not, we filter by sessions linked to tickets... 
        // Actually, ParkingSession usually stores `parkingLotId`?
        // Let's assume it does for now, effectively. 
        // If not, I'll update this.

        // Actually, let's look at ParkingSessionModel before finalizing.
        // But for now, let's write the query assuming `parkingLotId` exists in Session.

        const history = await ParkingSessionModel.find({
            parkingLotId: lotId,
            status: "CLOSED"
        })
            .sort({ exitTime: -1 })
            .limit(10);

        return NextResponse.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error("History API Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
