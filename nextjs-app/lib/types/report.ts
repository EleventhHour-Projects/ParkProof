import { Types } from "mongoose";

export type ReportType =
  | "OVERPARKING"
  | "TICKET_FRAUD"
  | "ATTENDANT_MISBEHAVIOUR"
  | "OTHER";

export interface Report {
  _id?: string;
  parkingLotId: Types.ObjectId;
  type: ReportType;
  createdAt?: Date;
}
