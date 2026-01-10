import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db/dbConnect";
import TicketModel from "@/model/Tickets";
import ParkingLotModel from "@/model/ParkingLot";

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        let { parkingLotId, vehicleNumber, vehicleType, amount } = body;

        // Validate inputs
        if (!parkingLotId || !vehicleNumber || !vehicleType || !amount) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Handle PID resolution if not an ObjectId
        if (!Types.ObjectId.isValid(parkingLotId)) {
            // Assume it's a PID and try to find the lot
            const lot = await ParkingLotModel.findOne({ pid: parkingLotId });
            if (!lot) {
                return NextResponse.json(
                    { success: false, message: `Invalid Parking Lot PID: ${parkingLotId}` },
                    { status: 404 }
                );
            }
            parkingLotId = lot._id;
        }

        // Create Ticket
        const newTicket = await TicketModel.create({
            parkingLotId,
            vehicleNumber,
            vehicleType,
            amount,
            status: "CREATED",
        });

        // Update Parking Lot Occupancy
        await ParkingLotModel.findByIdAndUpdate(
            parkingLotId,
            { $inc: { occupied: 1 } }
        );

        return NextResponse.json(
            { success: true, message: "Ticket booked successfully", ticketId: newTicket._id },
            { status: 201 }
        );

    } catch (error) {
        console.error("Booking Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to book ticket" },
            { status: 500 }
        );
    }
}
