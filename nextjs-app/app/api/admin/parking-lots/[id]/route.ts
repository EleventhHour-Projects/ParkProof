import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/db/dbConnect";
import ParkingLotModel from "@/model/ParkingLot";
import ParkingSessionModel from "@/model/ParkingSession";
import RiskScoreModel from "@/model/RiskScore";


export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id: parkingLotId } = await context.params;

    if (!Types.ObjectId.isValid(parkingLotId)) {
      return NextResponse.json(
        { message: "Invalid parkingLotId" },
        { status: 400 }
      );
    }
    const parkingLotObjectId = new Types.ObjectId(parkingLotId);
    const parkingLot = await ParkingLotModel.findById(parkingLotId).lean();

    if (!parkingLot) {
      return NextResponse.json(
        { message: "Parking lot not found" },
        { status: 404 }
      );
    }

    // Count active sessions
    const occupied = await ParkingSessionModel.countDocuments({
      parkingLotId: parkingLotObjectId,
      status: "ACTIVE",
    });

    const occupancyPercent = Math.round(
      (occupied / parkingLot.capacity) * 100
    );

    // Latest risk score (if exists)
    const risk = await RiskScoreModel.findOne({
      parkingLotId: parkingLotObjectId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const riskScore = risk?.score ?? 0;
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

    if (riskScore >= 70) riskLevel = "HIGH";
    else if (riskScore >= 40) riskLevel = "MEDIUM";

    return NextResponse.json(
      {
        parkingLotId: parkingLot._id,
        name: parkingLot.name,
        location: parkingLot.location,
        capacity: parkingLot.capacity,

        occupied,
        occupancyPercent,

        riskScore: riskScore,
        riskLevel,
        riskReason: risk?.reason ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin parking-lot detail error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
