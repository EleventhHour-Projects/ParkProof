// lib/types/adminDashboardStats.ts

export interface AdminDashboardStats {
  revenueThisMonth: string;           // "7Cr"
  revenueGrowth: string;     // "+4.2%"

  totalLots: number;
  lotsAdded: number;

  occupiedSlots: number;
  availableSlots: number;
}
