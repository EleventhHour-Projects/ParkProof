export type QueryStatus = "OPEN" | "ANSWERED" | "EXPIRED";

export type QueryType =
  | "GROUND_VERIFICATION"
  | "OCCUPANCY_CHECK"
  | "GENERAL";

export interface Query {
  _id?: string;
  parkingLotId: string;
  type: QueryType;
  status: QueryStatus;
  createdAt?: Date;
}
