import { Types } from "mongoose";

export interface RiskScore {
  _id?: string;

  parkingLotId: Types.ObjectId;  
  score: number;                 

  reason?: string;               

  createdAt?: Date;
}
