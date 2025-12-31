export type ReportType =
  | "OVERPARKING"
  | "TICKET_FRAUD"
  | "ATTENDANT_MISBEHAVIOUR"
  | "OTHER";

export interface Report {
  _id?: string;
  parkingLotId: string;
  type: ReportType;
  createdAt?: Date;
}
