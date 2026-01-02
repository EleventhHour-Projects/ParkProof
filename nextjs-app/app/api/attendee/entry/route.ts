import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/db/dbConnect";
import TicketModel from "@/model/Tickets";
import ParkingLotModel from "@/model/ParkingLot";
import ParkingSessionModel from "@/model/ParkingSession";
import UserModel from "@/model/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const {
      ticketId,        // pre-book QR
      userId,          // profile QR
      parkingLotId,
      vehicleNumber,
    } = await req.json();

    const now = new Date();

    
    // CASE 1A: PRE-BOOKED TICKET (RESERVED ENTRY)
    
    if (ticketId) {
      if (!Types.ObjectId.isValid(ticketId)) {
        return NextResponse.json({ message: "Invalid ticketId" }, { status: 400 });
      }

      const ticket = await TicketModel.findById(ticketId);

      if (!ticket) {
        return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
      }

      if (ticket.status === "USED") {
        return NextResponse.json({ message: "Ticket already used" }, { status: 409 });
      }

      if (ticket.validTill < now) {
        ticket.status = "EXPIRED";
        await ticket.save();
        return NextResponse.json({ message: "Ticket expired" }, { status: 410 });
      }

      const existingSession = await ParkingSessionModel.findOne({
        vehicleNumber: ticket.vehicleNumber,
        status: "ACTIVE",
      });

      if (existingSession) {
        return NextResponse.json(
          { message: "Vehicle already inside parking" },
          { status: 409 }
        );
      }

      const session = await ParkingSessionModel.create({
        parkingLotId: ticket.parkingLotId,
        vehicleNumber: ticket.vehicleNumber,
        entryTime: now,
        entryMethod: "QR",
        status: "ACTIVE",
      });

      ticket.status = "USED";
      ticket.usedAt = now;
      await ticket.save();

      // TODO: Call Go API here

      return NextResponse.json(
        {
          sessionId: session._id,
          entryMethod: "QR",
          type: "RESERVED",
        },
        { status: 201 }
      );
    }

  
    // COMMON VALIDATION FOR NON-RESERVED FLOWS
    
    if (!parkingLotId || !vehicleNumber) {
      return NextResponse.json(
        { message: "parkingLotId and vehicleNumber are required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(parkingLotId)) {
      return NextResponse.json(
        { message: "Invalid parkingLotId" },
        { status: 400 }
      );
    }

    const normalizedVehicle = vehicleNumber.trim().toUpperCase();

    const parkingLot = await ParkingLotModel.findById(parkingLotId);
    if (!parkingLot) {
      return NextResponse.json(
        { message: "Parking lot not found" },
        { status: 404 }
      );
    }

    const activeSession = await ParkingSessionModel.findOne({
      vehicleNumber: normalizedVehicle,
      status: "ACTIVE",
    });

    if (activeSession) {
      return NextResponse.json(
        { message: "Vehicle already inside parking" },
        { status: 409 }
      );
    }

    const activeCount = await ParkingSessionModel.countDocuments({
      parkingLotId,
      status: "ACTIVE",
    });

    const reservedCount = await TicketModel.countDocuments({
      parkingLotId,
      status: "CREATED",
      validTill: { $gt: now },
    });

    if (activeCount + reservedCount >= parkingLot.capacity) {
      return NextResponse.json(
        { message: "Parking lot is full" },
        { status: 409 }
      );
    }

       // CASE 1B: USER PROFILE QR (REGISTERED, NO PRE-BOOK)
    
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      const session = await ParkingSessionModel.create({
        parkingLotId,
        vehicleNumber: normalizedVehicle,
        userId,
        entryTime: now,
        entryMethod: "QR",
        status: "ACTIVE",
      });

      // TODO: Call Go API here

      return NextResponse.json(
        {
          sessionId: session._id,
          entryMethod: "QR",
          type: "PROFILE",
        },
        { status: 201 }
      );
    }

    /* =====================================================
       CASE 2: MANUAL ENTRY (UNREGISTERED)
    ===================================================== */
    const session = await ParkingSessionModel.create({
      parkingLotId,
      vehicleNumber: normalizedVehicle,
      entryTime: now,
      entryMethod: "OFFLINE",
      status: "ACTIVE",
    });

    // TODO: Call Go API here

    return NextResponse.json(
      {
        sessionId: session._id,
        entryMethod: "OFFLINE",
        type: "MANUAL",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attendant entry error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
