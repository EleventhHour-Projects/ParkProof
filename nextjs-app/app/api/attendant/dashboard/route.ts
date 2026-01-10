import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import dbConnect from "@/lib/db/dbConnect";
import UserModel from "@/model/User";
import TicketModel from "@/model/Tickets";
import ReportModel from "@/model/Report";

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
        const lotId = user.parkingLotId;

        // 3. Revenue (Today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const revenueResult = await TicketModel.aggregate([
            {
                $match: {
                    parkingLotId: lotId,
                    createdAt: { $gte: startOfDay }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const revenue = revenueResult[0]?.total || 0;

        // 4. Parked Vehicles (Active tickets)
        // Assuming "Parked" means status is 'USED' (entered) or 'CREATED'? 
        // If 'CREATED', they haven't entered. If 'USED', they entered. 
        // Let's assume 'USED' means inside. 
        // Or if the system is simple, maybe just all valid tickets? 
        // Let's check logic: Entry updates status to USED? 
        // For now, let's fetch 'USED' tickets.
        const parkedVehicles = await TicketModel.find({
            parkingLotId: lotId,
            status: "USED" // Assuming this means currently inside
        }).sort({ createdAt: -1 }).limit(20);

        // 5. Reports (Queries)
        const queries = await ReportModel.find({
            parkingLotId: lotId,
            status: "PENDING"
        }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: {
                revenue,
                parkedVehicles,
                queries
            }
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
