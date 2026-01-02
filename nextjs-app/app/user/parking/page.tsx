'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useRouter } from 'next/navigation'

/* =======================
   TYPES & DATA
======================= */

export type ParkingLot = {
  id: string
  name: string
  area: string
  address: string
  lat: number
  lng: number
  capacity: number
  occupied: number
  hasEVCharger?: boolean
}

export const parkingLots: ParkingLot[] = [
  {
    id: 'geeta',
    name: 'MCD Geeta Colony',
    area: 'Near NSUT East Campus',
    address: 'Geeta Colony ND - 1100XX',
    lat: 28.6562,
    lng: 77.2689,
    capacity: 69,
    occupied: 2,
    hasEVCharger: true,
  },
  {
    id: 'rohini',
    name: 'MCD Rohini',
    area: 'Near DTU',
    address: 'Rohini Sector - XX ND - 1100XX',
    lat: 28.7499,
    lng: 77.1177,
    capacity: 100,
    occupied: 100,
  },
  {
    id: 'vasant',
    name: 'MCD Vasant Vihar',
    area: 'Near Metro Gate No - 2',
    address: 'Vasant Vihar ND - 110057',
    lat: 28.5588,
    lng: 77.1620,
    capacity: 100,
    occupied: 54,
    hasEVCharger: true,
  },
]

/* =======================
   LEAFLET ICON
======================= */

const parkingIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
})

/* =======================
   PAGE
======================= */

export default function FindParkingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<ParkingLot | null>(null)
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  const filteredLots = onlyAvailable
    ? parkingLots.filter(l => l.capacity - l.occupied > 0)
    : parkingLots

  return (
    <div className="min-h-screen bg-[#f6f3f1] flex flex-col pb-28">

      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4 px-4">
<button
  onClick={() => router.push('/user')}
  className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-5 h-5 text-gray-700"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
</button>


        <button className="bg-[#FFA640] text-white px-5 py-2 rounded-full text-sm font-medium shadow">
          Logout
        </button>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <input
            placeholder="Search parking area"
            className="w-full rounded-full pl-11 pr-4 py-2.5 bg-white shadow-sm outline-none text-sm placeholder-gray-400"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </div>
      </div>

      {/* Map */}
      <div className="px-4 mt-4">
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <MapContainer
            center={[28.61, 77.23]}
            zoom={11}
            attributionControl={false}
            className="h-[260px] w-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredLots.map(lot => (
              <Marker
                key={lot.id}
                position={[lot.lat, lot.lng]}
                icon={parkingIcon}
                eventHandlers={{ click: () => setSelected(lot) }}
              />
            ))}
          </MapContainer>
        </div>
      </div>

      <p className="px-4 mt-3 text-xs text-gray-500">
        Tap a marker or card to select parking
      </p>

      {/* Parking List */}
      <div className="flex-1 px-4 mt-3 space-y-3">
        {filteredLots.map(lot => {
          const occupied = lot.occupied
          const total = lot.capacity
          const available = total - occupied

          const isFull = available <= 0
          const isSelected = selected?.id === lot.id

          const fillPercent = (occupied / total) * 100
          const availabilityPercent = (available / total) * 100

          const availabilityColor =
            availabilityPercent >= 50
              ? { text: 'text-green-700', bar: 'bg-green-500', bg: 'bg-green-100' }
              : availabilityPercent >= 20
              ? { text: 'text-yellow-700', bar: 'bg-yellow-500', bg: 'bg-yellow-100' }
              : { text: 'text-red-700', bar: 'bg-red-500', bg: 'bg-red-100' }

          return (
            <div
              key={lot.id}
              onClick={() => setSelected(lot)}
              className={`
                rounded-xl p-4 cursor-pointer transition border shadow-sm
                ${isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white'}
              `}
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    {lot.name}

                    {lot.hasEVCharger && (
                      <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-green-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                        </svg>
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">{lot.area}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{lot.address}</p>
                </div>

                {/* Occupied / Total */}
                <div className="flex items-start">
                  {isFull ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M8 12h8" />
                      </svg>
                      Full
                    </span>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-sm font-semibold ${availabilityColor.text}`}>
                        {occupied}/{total}
                      </span>
                      <div className={`w-16 h-2 rounded-full overflow-hidden ${availabilityColor.bg}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${availabilityColor.bar}`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Filter */}
      <div className="
  fixed bottom-0 left-0 right-0
  bg-white border-t
  shadow-[0_-6px_24px_rgba(0,0,0,0.08)]
  px-4 py-4
  flex items-center justify-between
">
  <span className="text-sm font-medium text-gray-700">
    Show available parking only
  </span>

  <button
    onClick={() => setOnlyAvailable(!onlyAvailable)}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition
      ${onlyAvailable ? 'bg-blue-600' : 'bg-gray-300'}
    `}
  >
    <span
      className={`
        inline-block h-5 w-5 transform rounded-full bg-white shadow transition
        ${onlyAvailable ? 'translate-x-5' : 'translate-x-1'}
      `}
    />
  </button>
</div>

    </div>
  )
}
