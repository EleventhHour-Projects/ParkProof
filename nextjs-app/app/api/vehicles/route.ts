import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import dbConnect from "@/lib/db/dbConnect";
import VehicleModel from "@/model/Vehicle";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Verify Authentication
        const session = await verifySession(req);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Body
        const { vehicleNumber } = await req.json();

        if (!vehicleNumber) {
            return NextResponse.json(
                { message: "Vehicle number is required" },
                { status: 400 }
            );
        }

        const normalizedNumber = vehicleNumber.trim().toUpperCase();

        // 3. Check for existing vehicle
        const existingVehicle = await VehicleModel.findOne({
            vehicleNumber: normalizedNumber,
        });

        if (existingVehicle) {
            // If vehicle exists and belongs to another user
            if (existingVehicle.userId && existingVehicle.userId.toString() !== session.userId) {
                return NextResponse.json(
                    { message: "Vehicle already registered by another user" },
                    { status: 409 }
                );
            }

            // If vehicle exists and belongs to current user
            if (existingVehicle.userId && existingVehicle.userId.toString() === session.userId) {
                return NextResponse.json(existingVehicle, { status: 200 }); // Idempotent success
            }

            // If vehicle exists but has no user (e.g. from attendant entry), claim it? 
            // For now, let's update it to belong to this user.
            existingVehicle.userId = session.userId;
            await existingVehicle.save();
            return NextResponse.json(existingVehicle, { status: 200 });
        }

        // 4. Create new vehicle
        const newVehicle = await VehicleModel.create({
            vehicleNumber: normalizedNumber,
            userId: session.userId,
        });

        return NextResponse.json(newVehicle, { status: 201 });
    } catch (error) {
        console.error("Add vehicle error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Verify Authentication
        const session = await verifySession(req);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Determine target userId
        // If admin/attendant, maybe allow querying by ?userId=...
        // For now, simpler: always return current user's vehicles.
        const targetUserId = session.userId;

        // 3. Fetch Vehicles
        const vehicles = await VehicleModel.find({ userId: targetUserId });

        return NextResponse.json(vehicles, { status: 200 });
    } catch (error) {
        console.error("Get vehicles error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
