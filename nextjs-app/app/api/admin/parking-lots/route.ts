import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import RiskScoreModel from "@/model/RiskScore";
import ParkingLotModel from "@/model/ParkingLot";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");

    const riskScores = await RiskScoreModel.find()
      .sort({ score: -1 })
      .limit(limit ? Number(limit) : 0)
      .lean();

    const parkingLotIds = riskScores.map(r => r.parkingLotId.toString());

    const parkingLots = await ParkingLotModel.find({
      _id: { $in: parkingLotIds },
    }).lean();

    const lotMap = new Map(
      parkingLots.map(lot => [lot._id.toString(), lot])
    );

    const response = riskScores.map(risk => {
      const lot = lotMap.get(risk.parkingLotId.toString());

      return {
        parkingLotId: risk.parkingLotId,
        name: lot?.name,
        location: lot?.location,
        capacity: lot?.capacity,
        riskScore: risk.score,
        riskReason: risk.reason,
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
