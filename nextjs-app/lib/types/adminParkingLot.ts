// lib/types/adminParkingLot.ts

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export interface AdminParkingLot {
  parkingLotId: string;      // Mongo _id as string
  pid: string;               // PLID0001
  name: string;
  area: string;

  capacity: number;
  occupied: number;
  occupancyPercent: number;

  riskScore: number;
  riskLevel: RiskLevel;
  riskReason: string | null;
}
