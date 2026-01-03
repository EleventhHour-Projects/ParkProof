import { Types } from "mongoose";

export interface ParkingLot {
    _id?: string
    pid?: string
    name: string
    area: string
    address: string
    location?: string
    capacity: number
    lng: number
    lat: number
    hasEVCharger?: boolean
    occupied?: number
    contractorPhone?: string;
}
