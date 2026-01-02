import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import dbConnect from "@/lib/db/dbConnect";
import TicketModel from "@/model/Tickets";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");

    // ---- Basic validation ----
    if (!ticketId) {
      return NextResponse.json(
        { message: "ticketId is required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { message: "Invalid ticketId format" },
        { status: 400 }
      );
    }

    // ---- Fetch ticket ----
    const ticket = await TicketModel.findById(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { valid: false, reason: "TICKET_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ---- Status check ----
    if (ticket.status === "USED") {
      return NextResponse.json(
        { valid: false, reason: "TICKET_ALREADY_USED" },
        { status: 409 }
      );
    }

    // ---- Expiry check ----
    const now = new Date();

    if (ticket.validTill < now) {
      // Lazy expiry (MVP-safe)
      if (ticket.status !== "EXPIRED") {
        ticket.status = "EXPIRED";
        await ticket.save();
      }

      return NextResponse.json(
        { valid: false, reason: "TICKET_EXPIRED" },
        { status: 410 }
      );
    }

    // ---- Ticket is valid (RESERVED) ----
    return NextResponse.json(
      {
        valid: true,
        ticketId: ticket._id,
        parkingLotId: ticket.parkingLotId,
        vehicleNumber: ticket.vehicleNumber,
        validTill: ticket.validTill,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ticket validation error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
