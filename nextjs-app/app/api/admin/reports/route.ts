import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";

import ReportModel from "@/model/Report";
import ParkingLotModel from "@/model/ParkingLot";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const reports = await ReportModel.find()
      .sort({ createdAt: -1 })
      .lean();

    if (reports.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const parkingLotIds = reports.map(r => r.parkingLotId).filter((id): id is any => !!id);

    const parkingLots = await ParkingLotModel.find({
      _id: { $in: parkingLotIds },
    }).lean();

    const lotMap = new Map(
      parkingLots.map(lot => [lot._id.toString(), lot])
    );

    const response = reports.map((report, index) => {
      const lotId = report.parkingLotId?.toString();
      const lot = lotId ? lotMap.get(lotId) : undefined;

      return {
        sno: index + 1,
        reportId: report._id,
        parkingLotId: report.parkingLotId,
        parkingLotName: lot?.pid ?? lot?.name ?? "General / Unknown",

        issueType: report.type,
        reportedBy: report.userId ? report.userId.toString() : "Anonymous",

        contractorPhone: lot?.contractorPhone ?? "N/A",

        status: "OPEN", // MVP hardcoded
        createdAt: report.createdAt,
      };
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Admin reports API error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
