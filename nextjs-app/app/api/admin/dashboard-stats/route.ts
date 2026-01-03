import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import ParkingLotModel from "@/model/ParkingLot";
import ParkingSessionModel from "@/model/ParkingSession";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // --- Compute cheap, real stats ---
    const totalParkingLots = await ParkingLotModel.countDocuments();

    const occupiedSlots = await ParkingSessionModel.countDocuments({
      status: "ACTIVE",
    });

    // Sum total capacity
    const lots = await ParkingLotModel.find({}, { capacity: 1 }).lean();
    const totalCapacity = lots.reduce(
      (sum, lot) => sum + (lot.capacity || 0),
      0
    );

    const availableSlots = Math.max(
      totalCapacity - occupiedSlots,
      0
    );

    //  Hardcoded for MVP
    const revenueThisMonth = 125000; // INR 

    return NextResponse.json(
      {
        revenueThisMonth,
        totalParkingLots,
        occupiedSlots,
        availableSlots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin dashboard-stats error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
