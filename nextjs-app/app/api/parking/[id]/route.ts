import { NextResponse } from 'next/server'
import { Types } from 'mongoose'
import dbConnect from '@/lib/db/dbConnect'
import ParkingLotModel from '@/model/ParkingLot'

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    await dbConnect()

    try {
        const { id } = await context.params
        console.log('[API] Received ID lookup:', id)

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID missing' },
                { status: 400 }
            )
        }

        let parkingLot = null;

        // Try finding by ObjectId first if valid
        if (Types.ObjectId.isValid(id)) {
            parkingLot = await ParkingLotModel.findById(id);
        }

        // If not found or not ObjectId, try finding by PID
        if (!parkingLot) {
            parkingLot = await ParkingLotModel.findOne({ pid: id })
        }

        if (!parkingLot) {
            return NextResponse.json(
                { success: false, message: 'Parking lot not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: parkingLot })
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch parking lot' },
            { status: 500 }
        )
    }
}
