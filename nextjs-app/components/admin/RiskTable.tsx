// components/admin/RiskTable.tsx
'use client';

import { Download } from "lucide-react";
import { useState } from "react";
import {AdminParkingLot} from "@/lib/types/adminParkingLot"

export default function RiskTable({ parkingLots }: { parkingLots: AdminParkingLot[] }) {
  const [topN, setTopN] = useState(3);
    const getRiskColor = (level: string) => {
        if (level === 'HIGH') return 'bg-red-500';
        if (level === 'MEDIUM') return 'bg-orange-500';
        return 'bg-green-500';
    };

  return (
    <div className="bg-linear-to-br from-gray-50 to-blue-50 rounded-sm p-4 sm:p-8 mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h1 className="text-xl sm:text-2xl font-light tracking-tight text-gray-900">
              Parking Lot Risk Ranking
            </h1>
            
            <div className="flex items-center gap-3">
              <select
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="text-xs font-light px-3 py-2 border border-gray-200 bg-white cursor-pointer transition-all duration-300 active:scale-95"
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
              </select>
              
              <button className="p-2 border border-gray-200 bg-white transition-all duration-300 hover:bg-gray-50 active:scale-95 cursor-pointer">
                <Download size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full bg-gray-900 text-white rounded-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs font-normal tracking-wide">Rank</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs font-normal tracking-wide">Parking Lot</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs font-normal tracking-wide hidden sm:table-cell">Area</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs font-normal tracking-wide hidden md:table-cell">Capacity</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs font-normal tracking-wide">Risk Level</th>
                  <th className="text-left py-3 sm:py-4 px-3 sm:px-4 text-xs font-normal tracking-wide hidden lg:table-cell">Reason</th>
                </tr>
              </thead>
              <tbody>
                {parkingLots.slice(0, topN).map((lot, index) => (
                  <tr key={index} className="border-b border-gray-800 last:border-none">
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs font-light">{index + 1}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs font-light">{lot.name || 'N/A'}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs font-light hidden sm:table-cell">{lot.area || 'N/A'}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs font-light hidden md:table-cell">{lot.capacity || 'N/A'}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getRiskColor(lot.riskLevel)}`}></span>
                        <span className="text-xs font-light">{lot.riskLevel || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs font-light hidden lg:table-cell">{lot.riskReason || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
    </div>
  );
}
