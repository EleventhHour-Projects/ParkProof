import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/dbConnect'
import ParkingLotModel from '@/model/ParkingLot'

export async function GET() {
    try {
        await dbConnect()
        const lots = await ParkingLotModel.find({})
        return NextResponse.json({ success: true, data: lots })
    } catch (error) {
        console.error('Error fetching parking lots:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch parking lots' }, { status: 500 })
    }
}
