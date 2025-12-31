export interface ParkingSession {
  _id?: string;
  parkingLotId: string;
  vehicleNumber: string;   
  entryTime: Date;
  exitTime?: Date;
  entryMethod: "QR" | "OFFLINE";
  status: "ACTIVE" | "CLOSED";
  createdAt?: Date;
}
