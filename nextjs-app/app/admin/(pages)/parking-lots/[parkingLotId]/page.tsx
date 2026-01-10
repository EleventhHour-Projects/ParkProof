
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ParkingLotStats from '@/components/admin/parking-lots/ParkingLotStats';
import { RaiseQueryForm, ActiveQuery, PastQueries, Query } from '@/components/admin/parking-lots/QuerySection';
import { AdminParkingLot } from '@/lib/types/adminParkingLot';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const SelectedParkingLotPage = () => {
  const params = useParams();
  const parkingLotId = params?.parkingLotId as string;

  const [parkingLot, setParkingLot] = useState<AdminParkingLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeQuery, setActiveQuery] = useState<Query | null>(null);
  const [pastQueries, setPastQueries] = useState<Query[]>([]);

  useEffect(() => {
    const fetchParkingLot = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/parking-lots/${parkingLotId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch parking lot details');
        }
        const data = await res.json();
        setParkingLot(data);
      } catch (e) {
        setError( 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    if (parkingLotId) {
      fetchParkingLot();
    }
  }, [parkingLotId]);

  const handleSendQuery = (message: string, reqResponse: boolean) => {
    const newQuery: Query = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      status: 'ACTIVE',
      responseRequired: reqResponse,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    setActiveQuery(newQuery);
  };

  const handleExpireQuery = (query: Query) => {
    const expiredQuery: Query = { ...query, status: 'EXPIRED' };
    setActiveQuery(null);
    setPastQueries(prev => [expiredQuery, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !parkingLot) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-8 flex flex-col items-center justify-center text-gray-500">
        <p>Error: {error || 'Parking lot not found'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <Link href="/admin/parking-lots">
        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" /> Back to Parking Lots
        </button>
      </Link>
      

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-6">

        {/* LEFT COLUMN - Main Content */}
        <div className="xl:col-span-2 space-y-8">
          {/* Stats Section */}
          <ParkingLotStats
            parkingLot={parkingLot}
            attendantName="Ravi Yadav" // This could also safely come from API if added later
            lastUpdated="Just now"
          />

          {/* Active Query Section */}
          {activeQuery && (
            <ActiveQuery
              query={activeQuery}
              onExpire={handleExpireQuery}
            />
          )}

          {/* Past Queries Section */}
          <PastQueries queries={pastQueries} />
        </div>

        {/* RIGHT COLUMN - Query Form */}
        <div className="xl:col-span-1">
          <RaiseQueryForm
            onSend={handleSendQuery}
            active={!!activeQuery}
          />
        </div>

      </div>
    </div>
  );
};

export default SelectedParkingLotPage;
