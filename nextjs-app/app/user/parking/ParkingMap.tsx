'use client'

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ParkingLot } from '@/lib/types/parkingLot'

/* =======================
   Leaflet Fixes
======================= */
// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

/* =======================
   LEAFLET ICON
======================= */
const parkingIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -40],
})

const activeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Could be a different color
    iconSize: [46, 46],
    iconAnchor: [23, 46],
    popupAnchor: [0, -48],
    className: 'animate-bounce'
})

/* =======================
   SUB-COMPONENTS
======================= */

// 1. Auto-Zoom to fit all markers
function MapUpdater({ lots }: { lots: ParkingLot[] }) {
    const map = useMap()

    useEffect(() => {
        if (lots.length > 0) {
            const bounds = L.latLngBounds(lots.map(l => [l.lat, l.lng]))
            map.fitBounds(bounds, { padding: [50, 50] })
        }
    }, [lots, map])

    return null
}

// 2. Locate User Button
function LocationMarker() {
    const map = useMap()

    const handleLocate = () => {
        map.locate().on("locationfound", function (e) {
            map.flyTo(e.latlng, 14)
            L.circle(e.latlng, { radius: e.accuracy }).addTo(map)
        })
    }

    return (
        <div className="absolute top-4 right-4 z-[400]">
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    handleLocate()
                }}
                className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-100 text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Locate Me"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
    )
}

/* =======================
   MAIN COMPONENT
======================= */

interface ParkingMapProps {
    lots: ParkingLot[]
    selectedLotId?: string
    onSelectLot: (lot: ParkingLot) => void
}

export default function ParkingMap({ lots, selectedLotId, onSelectLot }: ParkingMapProps) {
    return (
        <div className="h-[320px] w-full bg-slate-100">
            <MapContainer
                center={[28.61, 77.23]}
                zoom={11}
                attributionControl={false}
                className="h-full w-full"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <MapUpdater lots={lots} />
                <LocationMarker />

                {lots.map(lot => {
                    const isSelected = selectedLotId === String(lot._id)
                    return (
                        <Marker
                            key={String(lot._id)}
                            position={[lot.lat, lot.lng]}
                            icon={isSelected ? activeIcon : parkingIcon}
                            eventHandlers={{
                                click: () => onSelectLot(lot),
                            }}
                        >
                            <Popup className="font-sans text-sm font-medium">
                                <div className="p-1">
                                    <p className="font-bold text-slate-800">{lot.name}</p>
                                    <p className="text-slate-500 text-xs">{lot.area}</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                            {(lot.capacity - (lot.occupied || 0))} Available
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    )
}
