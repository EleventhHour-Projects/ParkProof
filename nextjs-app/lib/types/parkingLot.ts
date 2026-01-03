import { Types } from "mongoose";

export interface ParkingLot {
  _id?: Types.ObjectId;
  pid: string;
  name: string;
  location: string;
  capacity: number;
  lng: number;
  lat: number;
  hasEVCharger: boolean;
  occupied: number;
  contractorPhone?: string;
}
