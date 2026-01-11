import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";

import ReportModel from "@/model/Report";
import ParkingLotModel from "@/model/ParkingLot";
import UserModel from "@/model/User";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Fetch reports sorted by newest first
    const reports = await ReportModel.find()
      .sort({ createdAt: -1 })
      .lean();

    if (reports.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // specific IDs to fetch related data
    const parkingLotIds = reports.map(r => r.parkingLotId).filter((id): id is any => !!id);
    const userIds = reports.map(r => r.userId).filter((id): id is any => !!id);

    // Fetch related documents in parallel
    const [parkingLots, users] = await Promise.all([
      ParkingLotModel.find({ _id: { $in: parkingLotIds } }).lean(),
      UserModel.find({ _id: { $in: userIds } }).select('phone').lean()
    ]);

    // Create maps for O(1) lookup
    const lotMap = new Map(
      parkingLots.map(lot => [lot._id.toString(), lot])
    );
    const userMap = new Map(
      users.map(u => [u._id.toString(), u])
    );

    const response = reports.map((report, index) => {
      const lotId = report.parkingLotId?.toString();
      const userId = report.userId?.toString();

      const lot = lotId ? lotMap.get(lotId) : undefined;
      const user = userId ? userMap.get(userId) : undefined;

      return {
        sno: index + 1,
        reportId: report._id,

        // Parking Lot Details
        parkingLotName: lot?.name ?? "Unknown Lot",
        parkingLotPid: lot?.pid ?? "N/A",

        issueType: report.type,

        // Reporter Details
        reportedBy: user?.phone ?? "Anonymous",

        // Contractor Details (Contact Info)
        contractorPhone: lot?.contractorPhone ?? "N/A",

        // Other meta
        status: report.status,
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
