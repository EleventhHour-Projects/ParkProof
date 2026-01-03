import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/db/dbConnect";
import TicketModel from "@/model/Tickets";
import ParkingSessionModel from "@/model/ParkingSession";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");
    const vehicleNumber = searchParams.get("vehicleNumber");

    let query: any = { status: "ACTIVE" };

    if (ticketId && Types.ObjectId.isValid(ticketId)) {
      query.ticketId = ticketId;
    } else if (vehicleNumber) {
      query.vehicleNumber = vehicleNumber;
    } else {
      return NextResponse.json({ message: "Identifier required" }, { status: 400 });
    }

    const session = await ParkingSessionModel.findOne(query);

    if (!session) {
      return NextResponse.json({ message: "Active session not found" }, { status: 404 });
    }

    // Calc Fee: Base 20 + 10/hr
    const now = new Date();
    const durationMs = now.getTime() - new Date(session.entryTime).getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const amount = 20 + (durationHours * 10);

    return NextResponse.json({
      success: true,
      vehicleNumber: session.vehicleNumber,
      entryTime: session.entryTime,
      amountDue: amount
    });

  } catch (error) {
    console.error("GET Exit Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const {
      ticketId,      // pre-booked QR
      userId,        // profile QR
      vehicleNumber  // manual / printed ticket
    } = await req.json();

    const now = new Date();

    let session = null;

    //   CASE 1: PRE-BOOKED TICKET EXIT

    if (ticketId) {
      if (!Types.ObjectId.isValid(ticketId)) {
        return NextResponse.json(
          { message: "Invalid ticketId" },
          { status: 400 }
        );
      }

      const ticket = await TicketModel.findById(ticketId);

      if (!ticket) {
        return NextResponse.json(
          { message: "Ticket not found" },
          { status: 404 }
        );
      }

      session = await ParkingSessionModel.findOne({
        vehicleNumber: ticket.vehicleNumber,
        status: "ACTIVE",
      });
    }

    //  CASE 2: USER PROFILE QR EXIT

    else if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { message: "Invalid userId" },
          { status: 400 }
        );
      }

      session = await ParkingSessionModel.findOne({
        userId,
        status: "ACTIVE",
      });
    }

    //   CASE 3: MANUAL / PRINTED TICKET EXIT

    else if (vehicleNumber) {
      const normalizedVehicle = vehicleNumber.trim().toUpperCase();

      session = await ParkingSessionModel.findOne({
        vehicleNumber: normalizedVehicle,
        status: "ACTIVE",
      });
    }

    //   NO IDENTIFIER PROVIDED

    else {
      return NextResponse.json(
        { message: "ticketId or userId or vehicleNumber is required" },
        { status: 400 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { message: "Active parking session not found" },
        { status: 404 }
      );
    }

    // Close session
    session.exitTime = now;
    session.status = "CLOSED";
    await session.save();

    // TODO: Call Go API here (fire-and-forget)
    // notifyGoExit(session)

    return NextResponse.json(
      {
        sessionId: session._id,
        vehicleNumber: session.vehicleNumber,
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        status: "CLOSED",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Attendant exit error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
