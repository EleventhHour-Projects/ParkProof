import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/dbConnect'
import ParkingLotModel from '@/model/ParkingLot'

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    await dbConnect()

    try {
        const { id } = await context.params
        console.log('[API] Received PID:', id)

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'PID missing' },
                { status: 400 }
            )
        }

        const parkingLot = await ParkingLotModel.findOne({ pid: id })

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
