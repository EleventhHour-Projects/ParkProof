import { Types } from "mongoose";

export type TicketStatus = "CREATED" | "USED" | "EXPIRED";

export interface Ticket {
  _id?: string;

  parkingLotId: Types.ObjectId;   // reserved parking lot
  vehicleNumber: string;          // reserved vehicle

  status: TicketStatus;           // CREATED = reserved

  validTill: Date;                // booking time + 1h 10m

  createdAt?: Date;
  usedAt?: Date;
}
