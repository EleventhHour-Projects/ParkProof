import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db/dbConnect";
import TicketModel from "@/model/Tickets";
import ParkingLotModel from "@/model/ParkingLot";
import ParkingSessionModel from "@/model/ParkingSession";

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        let { parkingLotId, vehicleNumber, vehicleType, amount, manualEntry } = body;

        // Validate inputs
        if (!parkingLotId || !vehicleNumber || !vehicleType || !amount) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Handle PID resolution if not an ObjectId
        let lotStringId = ""; // To store the string PID for the PDF

        if (!Types.ObjectId.isValid(parkingLotId)) {
            // Assume it's a PID and try to find the lot
            lotStringId = parkingLotId; // It was passed as PID
            const lot = await ParkingLotModel.findOne({ pid: parkingLotId });
            if (!lot) {
                return NextResponse.json(
                    { success: false, message: `Invalid Parking Lot PID: ${parkingLotId}` },
                    { status: 404 }
                );
            }
            parkingLotId = lot._id;
        } else {
            // Fetch lot to get PID string
            const lot = await ParkingLotModel.findById(parkingLotId);
            if (!lot) {
                return NextResponse.json(
                    { success: false, message: `Invalid Parking Lot ID` },
                    { status: 404 }
                );
            }
            lotStringId = lot.pid || "";
        }

        // --- MANUAL ENTRY FLOW (Attendant) ---
        if (manualEntry) {
            // 1. Check if vehicle is already inside
            const existingSession = await ParkingSessionModel.findOne({
                vehicleNumber: vehicleNumber.trim().toUpperCase(),
                status: "ACTIVE",
            });
            if (existingSession) {
                return NextResponse.json(
                    { success: false, message: "Vehicle already inside" },
                    { status: 409 }
                );
            }

            // 2. Create Ticket (USED because they are entering now)
            const newTicket = await TicketModel.create({
                parkingLotId,
                vehicleNumber,
                vehicleType,
                amount,
                status: "USED",
                usedAt: new Date()
            });

            // 3. Create Session
            await ParkingSessionModel.create({
                parkingLotId,
                vehicleNumber: vehicleNumber.trim().toUpperCase(),
                entryTime: new Date(),
                entryMethod: "OFFLINE",
                status: "ACTIVE",
            });

            // 4. Update Occupancy
            await ParkingLotModel.findByIdAndUpdate(
                parkingLotId,
                { $inc: { occupied: 1 } }
            );

            // 5. Generate PDF from Go Service
            try {
                const pdfRes = await fetch("https://parkproof.onrender.com/internal/physicalticket", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "MANUAL",
                        ticket_id: newTicket._id,
                        vehicle: vehicleNumber,
                        parking_lot: lotStringId, // Send String PID
                        vehicle_type: vehicleType === '2w' ? 'BIKE' : 'CAR' // Map to Go Enum
                    })
                });

                if (!pdfRes.ok) throw new Error("PDF Generation Failed");

                const pdfBuffer = await pdfRes.arrayBuffer();

                return new NextResponse(pdfBuffer, {
                    headers: {
                        "Content-Type": "application/pdf",
                        "Content-Disposition": `inline; filename="ticket_${vehicleNumber}.pdf"`
                    }
                });

            } catch (err) {
                console.error("PDF Fetch Error:", err);
                // Fallback: Return JSON success but warn about PDF
                return NextResponse.json(
                    { success: true, message: "Entry Recorded, PDF Generation Failed", ticketId: newTicket._id },
                    { status: 201 }
                );
            }
        }

        // --- STANDARD PRE-BOOKING FLOW ---

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
