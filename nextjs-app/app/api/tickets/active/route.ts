import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import TicketModel from "@/model/Tickets";
import ParkingSessionModel from "@/model/ParkingSession";
import ParkingLotModel from "@/model/ParkingLot";

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const vehicleNumber = searchParams.get("vehicleNumber");

        if (!vehicleNumber) {
            return NextResponse.json(
                { success: false, message: "Vehicle Number is required" },
                { status: 400 }
            );
        }

        // 1. Find the latest active ticket (CREATED)
        const ticket = await TicketModel.findOne({
            vehicleNumber: vehicleNumber,
            status: { $in: ["CREATED", "USED"] },
            validTill: { $gt: new Date() }, // Not expired
        })
            .sort({ createdAt: -1 })
            .populate("parkingLotId"); // Get lot details

        // 2. Check for an active Parking Session
        const session = await ParkingSessionModel.findOne({
            vehicleNumber: vehicleNumber,
            status: "ACTIVE",
        }).populate("parkingLotId");


        // Helper to fetch QR
        const fetchQRCode = async (ticket: any) => {
            //console.log("ticket", ticket);
            try {
                const vehicleTypeMap: Record<string, string> = {
                    '4w': 'CAR',
                    '2w': 'BIKE',
                    '3w': 'Rickshaw',
                };

                const payload = {
                    ticket_id: ticket._id,
                    vehicle: ticket.vehicleNumber,
                    parking_lot: ticket.parkingLotId._id || ticket.parkingLotId,
                    vehicle_type: vehicleTypeMap[ticket.vehicleType] || 'CAR',
                };

                const qrRes = await fetch('http://localhost:8000/internal/vehicleqr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (qrRes.ok) {
                    const arrayBuffer = await qrRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64Image = buffer.toString('base64');
                    return `data:image/png;base64,${base64Image}`;
                }
            } catch (e) {
                console.error("Failed to fetch external QR", e);
            }
            return '/qr.png'; // Fallback
        };

        // 3. Determine Response
        if (session) {
            // Vehicle has entered -> PARKED

            const qrCode = await fetchQRCode(ticket);

            return NextResponse.json({
                success: true,
                active: true,
                status: "PARKED",
                entryTime: session.entryTime,
                ticket: ticket || null,
                session: session,
                parkingLot: session.parkingLotId,
                qrCode
            });
        } else if (ticket) {
            // Vehicle has a valid ticket but hasn't entered -> RESERVED
            const qrCode = await fetchQRCode(ticket);

            return NextResponse.json({
                success: true,
                active: true,
                status: "RESERVED",
                entryTime: null,
                ticket: ticket,
                session: null,
                parkingLot: ticket.parkingLotId,
                qrCode
            });
        } else {
            // No active ticket or session
            return NextResponse.json({
                success: true,
                active: false,
                message: "No active ticket or session found",
            });
        }

    } catch (error: any) {
        console.error("Active Ticket Fetch Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch ticket status", error: error.message },
            { status: 500 }
        );
    }
}
