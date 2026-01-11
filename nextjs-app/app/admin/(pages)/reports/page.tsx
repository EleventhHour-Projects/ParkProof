"use client";

import React, { useEffect, useState } from "react";
import { Phone, MessageSquare, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Report {
  sno: number;
  reportId: string;
  parkingLotName: string;
  parkingLotPid: string;
  issueType: string;
  reportedBy: string;
  contractorPhone: string;
  status: string;
  createdAt: string;
}

const ReportsAdminPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Issue removed successfully");
        // Update functionality: remove from local state
        setReports((prev) => prev.filter((r) => r.reportId !== reportId));
      } else {
        toast.error("Failed to remove issue");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting report");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading reports...</div>;
  }

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 font-medium">
                <th className="py-5 px-6 text-center w-20">S.No</th>
                <th className="py-5 px-6">Parking Lot</th>
                <th className="py-5 px-6">Issue Type</th>
                <th className="py-5 px-6">Reported By</th>
                <th className="py-5 px-6 text-center">Contact Contractor</th>
                <th className="py-5 px-6 text-center">Detailed Report</th>
                <th className="py-5 px-6 text-center">Remove Issue</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.reportId}
                  className="border-b border-gray-100 hover:bg-slate-50 transition"
                >
                  <td className="py-6 px-6 text-center font-medium text-gray-700">
                    {report.sno}.
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">
                        {report.parkingLotPid}
                      </span>
                      <span className="text-sm text-gray-400 mt-1">
                        {report.parkingLotName}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-gray-700 font-medium">
                    {report.issueType}
                  </td>
                  <td className="py-6 px-6 text-gray-600 font-medium">
                    {report.reportedBy}
                  </td>
                  <td className="py-6 px-6 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <div
                        className="group relative flex items-center justify-center w-8 h-8 rounded-full border border-green-500 text-green-500 cursor-pointer hover:bg-green-50"
                        title={report.contractorPhone}
                      >
                        <Phone size={16} />
                      </div>
                      <div
                        className="group relative flex items-center justify-center w-8 h-8 rounded-full border border-yellow-500 text-yellow-500 cursor-pointer hover:bg-yellow-50"
                        title={report.contractorPhone}
                      >
                        <MessageSquare size={16} />
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <button
                      className="flex items-center justify-center w-full text-gray-800 hover:text-black"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Smartphone size={24} className="mx-auto" />
                    </button>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <button
                      onClick={() => handleDelete(report.reportId)}
                      className="flex items-center justify-center w-full text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 size={20} className="mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsAdminPage;

