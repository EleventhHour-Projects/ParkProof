import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import UserModel from "@/model/User";
import ParkingLotModel from "@/model/ParkingLot";
import dbConnect from "@/lib/db/dbConnect";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Verify Session
        const session = await verifySession(req);
        if (!session || session.role !== 'ATTENDANT') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Get Attendant (User) & Parking Lot
        const user = await UserModel.findById(session.userId);
        if (!user || !user.parkingLotId) {
            return NextResponse.json({ message: "Attendant or Parking Lot not found" }, { status: 404 });
        }

        const parkingLot = await ParkingLotModel.findById(user.parkingLotId);
        if (!parkingLot) {
            return NextResponse.json({ message: "Parking Lot not found" }, { status: 404 });
        }

        // 3. Call Go Backend
        // Assuming Go backend is running on port 8000 locally
        console.log(`[AttendantProxy] Fetching queries for PID: ${parkingLot._id}`);
        const goRes = await fetch(`http://127.0.0.1:8000/api/admin/queries?pid=${parkingLot._id}`, {
            cache: 'no-store'
        });

        if (!goRes.ok) {
            console.error("Go Backend Error:", goRes.status);
            return NextResponse.json({ message: "Failed to fetch queries from backend" }, { status: 502 });
        }

        const queries = await goRes.json();

        return NextResponse.json(queries, { status: 200 });

    } catch (error) {
        console.error("Query Proxy Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
