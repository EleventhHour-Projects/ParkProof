import { Types } from "mongoose";

export type TicketStatus = "CREATED" | "USED" | "EXPIRED";

export interface Ticket {
  _id?: string;

  parkingLotId: Types.ObjectId;   // reserved parking lot
  vehicleNumber: string;          // reserved vehicle

  status: TicketStatus;           // CREATED = reserved

  vehicleType: '4w' | '2w' | '3w';
  amount: number;

  validTill: Date;                // booking time + 1h 10m

  createdAt?: Date;
  usedAt?: Date;
}
