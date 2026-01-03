import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import TicketModel from "@/model/Tickets";
import ParkingLotModel from "@/model/ParkingLot";

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        const { parkingLotId, vehicleNumber, vehicleType, amount } = body;

        // Validate inputs
        if (!parkingLotId || !vehicleNumber || !vehicleType || !amount) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Optional: Check if parking lot exists and has space (omitted for basic implementation)
        // const lot = await ParkingLotModel.findOne({ pid: parkingLotId });
        // if (!lot) return NextResponse.json({ success: false, message: "Invalid Parking Lot" }, { status: 404 });

        // Create Ticket
        const newTicket = await TicketModel.create({
            parkingLotId, // Expecting ObjectId or string that matches Schema
            vehicleNumber,
            vehicleType,
            amount,
            status: "CREATED",
        });

        return NextResponse.json(
            { success: true, message: "Ticket booked successfully", ticketId: newTicket._id },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Booking Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to book ticket", error: error.message },
            { status: 500 }
        );
    }
}
