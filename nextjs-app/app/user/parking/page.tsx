'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { ParkingLot } from '@/lib/types/parkingLot'

// Dynamically import the map to avoid SSR issues with Leaflet
const ParkingMap = dynamic(() => import('./ParkingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium">
      Loading Map...
    </div>
  )
})

export default function FindParkingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<ParkingLot | null>(null)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const response = await fetch('/api/parking')
        const data = await response.json()
        if (data.success) {
          setParkingLots(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch parking lots', error)
      } finally {
        setLoading(false)
      }
    }

    fetchParkingLots()
  }, [])

  const filteredLots = onlyAvailable
    ? parkingLots.filter(l => (l.capacity || 0) - (l.occupied || 0) > 0)
    : parkingLots

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col pb-32 font-sans text-slate-800">

      {/* Header */}
      <div className="flex items-center justify-between pt-8 pb-2 px-6 bg-[#F4F4F4]/80 backdrop-blur-md sticky top-0 z-40">
        <button
          onClick={() => router.push('/user')}
          className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="w-5 h-5 text-gray-700"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-xl font-bold text-slate-800">
          Find Parking
        </h1>

        <button className="bg-[#FFA640] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-orange-200 hover:shadow-xl hover:bg-[#ff9922] transition-all active:scale-95">
          Logout
        </button>
      </div>

      {/* Search */}
      <div className="px-6 mt-2 sticky top-[80px] z-30">
        <div className="relative group">
          <input
            placeholder="Search location, area..."
            className="w-full rounded-[1.5rem] pl-12 pr-4 py-4 bg-white border border-transparent focus:border-[#FFA640]/30 shadow-sm focus:shadow-lg transition-all outline-none text-base placeholder:text-gray-400 text-slate-700"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#FFA640] transition-colors"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </div>
      </div>

      {/* Map */}
      <div className="px-6 mt-6">
        <div className="rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-200/50 border-4 border-white relative z-0">
          <ParkingMap
            lots={filteredLots}
            selectedLotId={selected?._id ? String(selected._id) : undefined}
            onSelectLot={setSelected}
          />
        </div>
      </div>

      <div className="px-6 mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">
          Nearby Spots
        </h2>
        <span className="text-xs font-medium text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
          {filteredLots.length} results
        </span>
      </div>

      {/* Parking List */}
      <div className="flex-1 px-5 mt-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-white/50 animate-pulse rounded-[2rem]" />
            ))}
          </div>
        ) : filteredLots.map(lot => {
          const occupied = lot.occupied || 0
          const total = lot.capacity
          const available = total - occupied

          const isFull = available <= 0
          const isSelected = selected?._id === lot._id

          const fillPercent = (occupied / total) * 100
          const availabilityPercent = (available / total) * 100

          const statusColor =
            availabilityPercent >= 50
              ? 'text-emerald-600 bg-emerald-50 mb-1 ring-emerald-500/20'
              : availabilityPercent >= 20
                ? 'text-amber-600 bg-amber-50 mb-1 ring-amber-500/20'
                : 'text-rose-600 bg-rose-50 mb-1 ring-rose-500/20'

          const barColor =
            availabilityPercent >= 50 ? 'bg-emerald-500'
              : availabilityPercent >= 20 ? 'bg-amber-500'
                : 'bg-rose-500'

          return (
            <div
              key={String(lot._id)}
              onClick={() => {
                setSelected(lot)
                router.push(`/user/parking/${lot.pid}`)
              }}
              className={`
                relative overflow-hidden rounded-[2rem] p-5 cursor-pointer transition-all duration-300
                border-2
                ${isSelected
                  ? 'bg-orange-50/80 border-[#FFA640] shadow-xl shadow-orange-500/10 scale-[1.02]'
                  : 'bg-white border-transparent shadow-sm hover:shadow-md hover:border-gray-100'}
              `}
            >
              <div className="flex justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 text-base truncate">
                      {lot.name}
                    </h3>
                    {lot.hasEVCharger && (
                      <div title="EV Charging">
                        <img src="/charging.png" alt="EV" className="w-4 h-4 object-contain" />
                      </div>
                    )}
                  </div>

                  <p className="text-sm font-medium text-gray-500 truncate">{lot.area}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">{lot.address}</p>
                </div>

                {/* Occupied / Total */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {isFull ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-500">
                      FULL
                    </span>
                  ) : (
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ring-1 ring-inset ${statusColor}`}>
                        {available} spots left
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-400 w-12 text-right">
                  {Math.round(fillPercent)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Filter */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setOnlyAvailable(!onlyAvailable)}
          className={`
            flex items-center gap-3 px-6 py-4 rounded-full shadow-xl transition-all active:scale-95
            ${onlyAvailable
              ? 'bg-[#FFA640] text-white shadow-orange-200'
              : 'bg-white text-slate-700 shadow-gray-200/50 hover:bg-gray-50'}
          `}
        >
          <span className="text-sm font-bold">Available Only</span>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${onlyAvailable ? 'bg-white/20' : 'bg-slate-100'}`}>
            {onlyAvailable && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3 h-3"><path d="M5 13l4 4L19 7" /></svg>}
          </div>
        </button>
      </div>

    </div>
  )
}
