import { Types } from "mongoose";

export interface ParkingSession {
  _id?: string;
  userId?: Types.ObjectId;
  parkingLotId: Types.ObjectId;
  vehicleNumber: string;   
  entryTime: Date;
  exitTime?: Date;
  entryMethod: "QR" | "OFFLINE";
  status: "ACTIVE" | "CLOSED";
  createdAt?: Date;
}
