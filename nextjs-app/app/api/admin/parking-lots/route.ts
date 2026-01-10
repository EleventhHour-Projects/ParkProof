import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";

import RiskScoreModel from "@/model/RiskScore";
import ParkingLotModel from "@/model/ParkingLot";
import ParkingSessionModel from "@/model/ParkingSession";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    //  Get risk scores (highest first)
    const riskScores = await RiskScoreModel.find()
      .sort({ score: -1 })
      .limit(limit ?? 0)
      .lean();

    if (riskScores.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    //  Collect parkingLotIds
    const parkingLotIds = riskScores.map(r => r.parkingLotId);

    //  Fetch parking lots
    const parkingLots = await ParkingLotModel.find({
      _id: { $in: parkingLotIds },
    }).lean();

    const lotMap = new Map(
      parkingLots.map(lot => [lot._id.toString(), lot])
    );

    //  Compute occupied counts in bulk
    const activeSessions = await ParkingSessionModel.aggregate([
      {
        $match: {
          parkingLotId: { $in: parkingLotIds },
          status: "ACTIVE",
        },
      },
      {
        $group: {
          _id: "$parkingLotId",
          count: { $sum: 1 },
        },
      },
    ]);

    const occupiedMap = new Map(
      activeSessions.map(s => [s._id.toString(), s.count])
    );

    // Build response
    const response = riskScores.map(risk => {
      const lot = lotMap.get(risk.parkingLotId.toString());
      const occupied = occupiedMap.get(risk.parkingLotId.toString()) ?? 0;

      const riskScore = risk.score;
      let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
      if (riskScore >= 70) riskLevel = "HIGH";
      else if (riskScore >= 40) riskLevel = "MEDIUM";

      const capacity = lot?.capacity ?? 0;
      const occupancyPercent =
        capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

      return {
        parkingLotId: risk.parkingLotId.toString(),
        pid: lot?.pid ?? "N/A",
        name: lot?.name ?? "Unknown",
        area: lot?.area ?? "N/A",

        capacity,
        occupied,
        occupancyPercent,
        contractorPhone: lot?.contractorPhone ?? "9818091234",
        riskScore,
        riskLevel,
        riskReason: risk.reason ?? null,
      };
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Admin parking-lots error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
