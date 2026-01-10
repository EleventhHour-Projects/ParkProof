"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Download,
  Phone,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { AdminParkingLot, RiskLevel } from "@/lib/types/adminParkingLot";

export default function ParkingLotsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminParkingLot[]>([]);
  const [filteredData, setFilteredData] = useState<AdminParkingLot[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  useEffect(() => {
    fetchParkingLots();
  }, []);

  useEffect(() => {
    filterData();
  }, [data, searchQuery, areaFilter, riskFilter]);

  const fetchParkingLots = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/parking-lots");
      if (!res.ok) throw new Error("Failed to fetch parking lots");
      const jsonData = await res.json();
      setData(jsonData);
      setFilteredData(jsonData);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching parking lots");
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let temp = [...data];

    // Search by Name or Area
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      temp = temp.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.area.toLowerCase().includes(q)
      );
    }

    // Filter by Area
    if (areaFilter !== "All") {
      temp = temp.filter((item) => item.area === areaFilter);
    }

    // Filter by Risk Level
    if (riskFilter !== "All") {
      temp = temp.filter((item) => item.riskLevel === riskFilter);
    }

    setFilteredData(temp);
  };

  const uniqueAreas = Array.from(new Set(data.map((item) => item.area)));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Parking Lots</h1>
        <button className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 active:scale-95 transition-all">
          <Plus className="h-4 w-4" />
          Add New Lot
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name or area"
            className="block w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Area Filter */}
        <div className="md:col-span-3">
          <select
            className="block w-full rounded-lg border border-input bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: `right 0.5rem center`,
              backgroundRepeat: `no-repeat`,
              backgroundSize: `1.5em 1.5em`,
              paddingRight: `2.5rem`,
            }}
          >
            <option value="All">All Areas</option>
            {uniqueAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="md:col-span-3">
          <select
            className="block w-full rounded-lg border border-input bg-background py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: `right 0.5rem center`,
              backgroundRepeat: `no-repeat`,
              backgroundSize: `1.5em 1.5em`,
              paddingRight: `2.5rem`,
            }}
          >
            <option value="All">All Risk Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        {/* Export Button (Optional, as per design) */}
        <div className="md:col-span-1 flex justify-end">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background hover:bg-muted text-muted-foreground transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Rank</th>
                <th className="px-6 py-4 font-medium">Lot Name</th>
                <th className="px-6 py-4 font-medium">Area</th>
                <th className="px-6 py-4 font-medium w-32">Capacity</th>
                <th className="px-6 py-4 font-medium">Occupancy</th>
                <th className="px-6 py-4 font-medium">Contractor</th>
                <th className="px-6 py-4 font-medium">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Loading parking lots...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No parking lots found.
                  </td>
                </tr>
              ) : (
                filteredData.map((lot, index) => (
                  <tr key={lot.parkingLotId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {(index + 1).toString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      <Link
                        href={`/admin/parking-lots/${lot.parkingLotId}`}
                        target="_blank"
                        className="hover:text-primary hover:underline underline-offset-4 decoration-2"
                      >
                        {lot.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{lot.area}</td>
                    <td className="px-6 py-4">
                      <div className="text-foreground font-medium">{lot.capacity}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5 w-32">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${getOccupancyColor(lot.occupancyPercent)
                              }`}
                            style={{ width: `${Math.min(lot.occupancyPercent, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          <span className="text-foreground">{lot.occupied}</span> / {lot.capacity}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group relative w-fit">
                        <span className="text-foreground font-medium">Ravi Yadav</span>
                        {/* Phone Icon with Tooltip */}
                        <div className="relative">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer transition-colors">
                            <Phone className="h-3 w-3" />
                          </div>
                          {/* Hover Tooltip - Styled to match design aesthetics roughly */}
                          <div className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 scale-0 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 z-50">
                            <div className="rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md border border-border">
                              {lot.contractorPhone || "N/A"}
                            </div>
                            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-border bg-popover"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge risk={lot.riskLevel} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Mockup */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4 text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{filteredData.length > 0 ? 1 : 0}</span> to <span className="font-medium text-foreground">{Math.min(filteredData.length, 10)}</span> of <span className="font-medium text-foreground">{filteredData.length}</span>
          </div>
          <div className="flex gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background hover:bg-muted disabled:opacity-50" disabled>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-primary text-primary-foreground font-medium">
              1
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background hover:bg-muted disabled:opacity-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components & Functions

function getOccupancyColor(percent: number) {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-orange-500";
  return "bg-green-500";
}

function Badge({ risk }: { risk: string }) {
  let styles = "bg-gray-100 text-gray-700 border-gray-200";
  let dotColor = "bg-gray-500";
  let label = risk;

  if (risk === "HIGH") {
    styles = "bg-red-50 text-red-700 border-red-100";
    dotColor = "bg-red-500";
    label = "High";
  } else if (risk === "MEDIUM") {
    styles = "bg-orange-50 text-orange-700 border-orange-100";
    dotColor = "bg-orange-500";
    label = "Medium";
  } else if (risk === "LOW") {
    styles = "bg-green-50 text-green-700 border-green-100";
    dotColor = "bg-green-500";
    label = "Low";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </div>
  );
}
