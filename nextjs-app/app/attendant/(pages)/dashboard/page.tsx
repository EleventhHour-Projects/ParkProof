'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Search, Mic, ChevronDown, LogOut, ScanLine, AlertTriangle, Car, Bike, Info, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

// Types
// Types
type Vehicle = {
  _id: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
  createdAt: string;
}

type Query = {
  id: string; // from Go
  query: string;
  to_parking_lot: string;
  response_required: boolean;
  time: string;
  with_in_time: number;
  status: number; // 0 open, 1 replied
  type: string;
}

export default function AttendantDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Data State
  const [user, setUser] = useState<any>(null)
  const [parkingLot, setParkingLot] = useState<any>(null)
  const [stats, setStats] = useState({ revenue: 0, parkedVehicles: [] as Vehicle[] })
  const [queries, setQueries] = useState<Query[]>([])

  // UI State
  const [filter, setFilter] = useState<'All' | '4w' | '2w'>('All')
  const [search, setSearch] = useState('')
  const [vehiclesExpanded, setVehiclesExpanded] = useState(true)
  const [queriesExpanded, setQueriesExpanded] = useState(true)

  const fetchQueries = async () => {
    try {
      const res = await fetch('/api/attendant/queries');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter out queries that are already answered
          // The backend might return status as string "ANSWERED" or number, so check both or based on type definition
          // Updated filter: exclude ANSWERED
          const activeQueries = data.filter((q: any) => q.status !== 'ANSWERED');
          setQueries(activeQueries.reverse()); // Show newest first
        }
      }
    } catch (e) {
      console.error("Query Poll Error", e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // 1. Fetch User & Lot Info (Existing logic)
        const meRes = await fetch('/api/me')
        if (meRes.status === 401) {
          router.push('/attendant/login')
          return
        }
        const meData = await meRes.json()
        setUser(meData)

        if (meData.parkingLotId) {
          const lotRes = await fetch(`/api/parking/${meData.parkingLotId}`)
          const lotData = await lotRes.json()
          if (lotData.success) {
            setParkingLot(lotData.data)
          }

          // 2. Fetch Stats
          const statsRes = await fetch('/api/attendant/dashboard')
          const statsData = await statsRes.json()
          if (statsData.success) {
            setStats(statsData.data)
          }

          // 3. Initial Query Fetch
          fetchQueries();
        }
      } catch (error) {
        console.error("Dashboard load error", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Polling Effect
  useEffect(() => {
    if (!parkingLot) return;
    const interval = setInterval(fetchQueries, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [parkingLot]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (e) { toast.error("Logout failed") }
  }

  // Filtered Vehicles
  const filteredVehicles = stats.parkedVehicles.filter(v => {
    const matchesFilter = filter === 'All' || v.vehicleType.toLowerCase() === filter.toLowerCase();
    const matchesSearch = v.vehicleNumber.includes(search.toUpperCase());
    return matchesFilter && matchesSearch;
  });

  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })


  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-slate-400 text-sm font-semibold">Loading Dashboard...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans pb-36 relative text-slate-800">

      {/* Top Bar */}
      <div className="px-6 pt-6 pb-2 flex justify-end">
        <button
          onClick={handleLogout}
          className="bg-[#FFA640] hover:bg-[#FF951A] text-white px-5 py-2 rounded-full font-bold shadow-lg shadow-orange-200 transition-all text-xs flex items-center gap-2 active:scale-95"
        >
          Logout
          <LogOut className="w-3 h-3" />
        </button>
      </div>

      {/* Header Container */}
      <div className="px-6 mb-6">
        {/* Parking Lot Card */}
        {parkingLot ? (
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 flex justify-between items-stretch border border-slate-100 relative overflow-hidden group">
            {/* Decorative Background blob */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-all duration-700"></div>

            <div className="relative z-10 flex flex-col justify-between">
              <div>
                <h2 className="font-extrabold text-xl mb-1 text-slate-800 leading-tight">{parkingLot.name}</h2>
                <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  <p className="text-[11px] font-medium leading-tight max-w-[160px]">
                    {parkingLot.address}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-slate-100 rounded-lg w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Live ID: {parkingLot.pid}</span>
              </div>
            </div>

            <div className="text-right relative z-10 flex flex-col justify-between items-end">
              <div className="flex flex-col items-end">
                <div className="text-3xl font-black text-[#2E95FA]">
                  {parkingLot.capacity - parkingLot.occupied}
                  <span className="text-sm font-bold text-slate-300 ml-1">/{parkingLot.capacity}</span>
                </div>
                <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">Slots Available</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl text-center text-slate-500 shadow-sm border border-slate-100">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No Parking Lot Assigned
          </div>
        )}
      </div>

      {/* Main Panel */}
      <div className="mx-6 bg-white rounded-[2.5rem] border-[3px] border-[#2E95FA]/10 shadow-2xl shadow-blue-200/20 overflow-hidden relative">

        {/* Date & Revenue Header */}
        <div className="bg-gradient-to-r from-slate-50 to-white p-5 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-3 bg-slate-800"></div>
              <div className="pt-2 font-bold text-sm text-slate-700">{new Date().getDate()}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Today</div>
              <div className="text-sm font-extrabold text-slate-700">{currentDate}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Revenue</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">₹{stats.revenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Parked Vehicles Section */}
        <div className="bg-white min-h-[300px] p-5 rounded-t-[2.5rem] relative z-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 text-lg">Parked Vehicles <span className="text-slate-400 text-sm ml-1">({stats.parkedVehicles.length})</span></h3>
            <button onClick={() => setVehiclesExpanded(!vehiclesExpanded)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${vehiclesExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-5 group">
            <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search vehicle number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 outline-none focus:border-blue-500/20 focus:bg-white transition-all relative z-10"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-50 rounded-xl w-fit">
            {['All', '4W', '2W'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300
                                ${filter === tab
                    ? 'bg-[#2E95FA] text-white shadow-md shadow-blue-500/20 scale-105'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                            `}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List Header */}
          <div className="flex text-[10px] uppercase text-slate-400 font-bold mb-3 pl-3 tracking-widest">
            <div className="w-12">S.No</div>
            <div className="flex-1">Number Details</div>
            <div className="w-20 text-center">Type</div>
          </div>

          {/* List */}
          <div className={`space-y-2 transition-all duration-500 ease-in-out relative ${vehiclesExpanded ? 'max-h-[600px] overflow-y-auto pr-1' : 'max-h-[180px] overflow-hidden'}`}>
            {filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                  <Car className="w-6 h-6 opacity-20" />
                </div>
                <span className="text-sm font-medium">No vehicles found</span>
              </div>
            ) : (
              filteredVehicles.map((v, i) => (
                <div key={v._id} className="flex items-center py-3 border border-transparent hover:border-slate-100 hover:bg-slate-50 rounded-2xl px-3 transition-all group cursor-default">
                  <div className="w-12 text-slate-300 font-bold text-sm group-hover:text-slate-400 transition-colors">#{i + 1}</div>
                  <div className="flex-1">
                    <div className="font-black text-slate-800 tracking-wider text-sm">{v.vehicleNumber}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">In: {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="w-20 flex justify-center">
                    {v.vehicleType === '4w' || v.vehicleType === 'CAR' ? (
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Car className="w-4 h-4 fill-current" />
                      </div>
                    ) : v.vehicleType === '2w' || v.vehicleType === 'BIKE' ? (
                      <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <Bike className="w-4 h-4 fill-current" />
                      </div>
                    ) : (
                      <Car className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                </div>
              ))
            )}

            {!vehiclesExpanded && filteredVehicles.length > 3 && (
              <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            )}
          </div>

          {!vehiclesExpanded && (
            <button
              onClick={() => setVehiclesExpanded(true)}
              className="w-full text-center text-xs text-slate-400 hover:text-[#2E95FA] font-bold py-3 mt-1 transition-colors flex items-center justify-center gap-1"
            >
              View All Vehicles <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Queries Section */}
        <div className={`bg-slate-50 border-t border-slate-100 p-5 transition-all duration-500 ${queriesExpanded ? 'bg-slate-50' : ''}`}>
          <div
            onClick={() => setQueriesExpanded(!queriesExpanded)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${queries.length > 0 ? 'text-orange-500 fill-orange-500/20' : 'text-slate-300'}`} />
              <div>
                <span className="font-bold text-slate-800 text-sm">Queries & Reports</span>
                {queries.length > 0 && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{queries.length} NEW</span>}
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${queriesExpanded ? 'rotate-180' : ''}`} />
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${queriesExpanded ? 'max-h-[300px] opacity-100 mt-4 overflow-y-auto' : 'max-h-0 opacity-0 mt-0'}`}>
            {queries.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-2">No pending queries today. Good job!</div>
            ) : (
              <div className="space-y-3">
                {queries.map((q, i) => (
                  <div key={q.id} className={`bg-white p-3.5 rounded-xl text-sm shadow-sm border border-slate-100 flex flex-col gap-2 ${q.response_required ? 'border-l-4 border-l-red-500' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-md">{q.type}</span>
                      <span className="text-[10px] text-slate-400">{new Date(q.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-slate-600 text-xs font-medium leading-relaxed">
                      {q.query}
                    </div>
                    {q.response_required && (
                      <div className="flex sm:flex-row flex-col gap-2 mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/attendant/queries/${q.id}`);
                          }}
                          className="flex-1 bg-blue-100 text-blue-700 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                        >
                          Reply
                        </button>
                        <button className="flex-1 bg-green-100 text-green-700 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors">
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-6 right-6 z-50 flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/attendant/entry')}
            className="flex-1 bg-[#5CB85C] hover:bg-[#4CA84C] text-white py-4 rounded-[1.5rem] text-lg font-bold shadow-lg shadow-green-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <ScanLine className="w-5 h-5" />
            </div>
            Entry
          </button>

          <button
            onClick={() => router.push('/attendant/exit')}
            className="flex-1 bg-[#FFA640] hover:bg-[#F29530] text-slate-900 py-4 rounded-[1.5rem] text-lg font-bold shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:-rotate-12 transition-transform">
              <LogOut className="w-5 h-5" />
            </div>
            Exit
          </button>
        </div>

        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center opacity-60">
          ParkProof System v1.0
        </div>
      </div>

      {/* Background Gradient */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>

    </div>
  )
}
