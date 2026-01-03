'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import type { ParkingLot } from '@/lib/types/parkingLot'

type Vehicle = {
  id: number
  number: string
  model: string
  icon: string
}

export default function SelectedParkingLotPage() {
  const router = useRouter()
  const params = useParams()
  const parkingLotId = params?.parkingLotId as string

  // -- HOOKS MUST BE AT THE TOP LEVEL --
  const [lot, setLot] = useState<ParkingLot | null>(null)
  const [loading, setLoading] = useState(true)

  // Vehicle Selection State
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicleType, setVehicleType] = useState('4w')
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Mock Fetcher
  const mockFetchVehicles = (): Promise<Vehicle[]> =>
    new Promise(resolve =>
      setTimeout(() => {
        resolve([
          { id: 1, number: 'DL 53EF 5438', model: 'BMW M4', icon: '/car.png' },
          { id: 2, number: 'DL 01AB 1122', model: 'Santa Sleigh', icon: '/sleigh.png' },
          { id: 3, number: 'DL 09XY 7788', model: 'Bike', icon: '/bike.png' },
        ])
      }, 300)
    )

  // Fetch Parking Lot
  useEffect(() => {
    if (!parkingLotId) return

    const fetchLot = async () => {
      try {
        const response = await fetch(`/api/parking/${parkingLotId}`)
        const data = await response.json()
        if (data.success) {
          setLot(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch parking lot', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLot()
  }, [parkingLotId])

  // Fetch Vehicles
  useEffect(() => {
    mockFetchVehicles().then(data => {
      setVehicles(data)
      if (data.length > 0) {
        setSelectedVehicle(data[0])
      }
    })
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Update vehicle type based on selection
  useEffect(() => {
    if (selectedVehicle) {
      const type =
        selectedVehicle.model.toLowerCase().includes('bike') || selectedVehicle.model.toLowerCase().includes('scooter') ? '2w' :
          selectedVehicle.model.toLowerCase().includes('auto') ? '3w' : '4w'
      setVehicleType(type)
    }
  }, [selectedVehicle])

  // -- CONDITIONAL RENDERING --
  if (loading) return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFA640]"></div>
    </div>
  )

  if (!lot) return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-bold text-slate-800">Parking Lot Not Found</h2>
      <button
        onClick={() => router.back()}
        className="mt-4 px-6 py-2 bg-[#FFA640] text-white rounded-full font-bold"
      >
        Go Back
      </button>
    </div>
  )

  const available = (lot.capacity || 100) - (lot.occupied || 0)

  const handleBooking = async () => {
    if (!selectedVehicle || !lot) {
      alert("Please select a vehicle first")
      return
    }

    try {
      setLoading(true)
      const amount = vehicleType === '4w' ? 20 : vehicleType === '3w' ? 20 : 10

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkingLotId: lot._id, // Ensure lot object has _id from DB
          vehicleNumber: selectedVehicle.number,
          vehicleType,
          amount
        })
      })

      const data = await response.json()
      if (data.success) {
        alert("Booking Successful!")
        router.push('/user/tickets')
      } else {
        alert(data.message || "Booking Failed")
      }
    } catch (error) {
      console.error("Booking failed", error)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // Calculate pricing for display
  const getPrice = (type: string) => {
    switch (type) {
      case '4w': return 20;
      case '3w': return 20;
      case '2w': return 10;
      default: return 20;
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col font-sans text-slate-800 pb-10 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between pt-8 pb-2 px-6 bg-[#F4F4F4]/80 backdrop-blur-md sticky top-0 z-40">
        <button
          onClick={() => router.push('/user/parking')}
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
          Booking
        </h1>

        <button className="bg-[#FFA640] text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-orange-200 hover:shadow-xl hover:bg-[#ff9922] transition-all active:scale-95">
          Logout
        </button>
      </div>

      <div className="px-6 flex flex-col gap-6">

        {/* Main Card */}
        <div className="bg-white rounded-[2.5rem] p-7 shadow-lg shadow-gray-200/50 border border-white/50 relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div className="flex-1 pr-4">
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">
                {lot.name}
              </h1>
              <div className="flex items-start gap-2 mt-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#FFA640] shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  {lot.address}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 bg-blue-50/50 p-3 rounded-2xl">
              <div className="text-3xl font-extrabold text-blue-600 tracking-tight">
                {available}<span className="text-lg text-blue-400 font-bold">/{lot.capacity}</span>
              </div>
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">
                Slots Left
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-[2.5rem] p-7 shadow-lg shadow-gray-200/50 border border-white/50">
          <h2 className="text-xl font-bold text-slate-800 mb-6 px-1 flex items-center gap-2">
            Select Vehicle
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Auto-selected</span>
          </h2>

          <div className="space-y-4">
            {/* 4 Wheeler */}
            <div
              onClick={() => setVehicleType('4w')}
              className={`
                flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all duration-300 border-2
                ${vehicleType === '4w'
                  ? 'bg-orange-50 border-[#FFA640] shadow-md shadow-orange-100'
                  : 'bg-gray-50/50 border-transparent hover:bg-gray-100'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm p-2 transition-colors ${vehicleType === '4w' ? 'bg-white' : 'bg-white'}`}>
                  <img src="/car.png" alt="Car" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className={`font-bold text-lg transition-colors ${vehicleType === '4w' ? 'text-[#FFA640]' : 'text-slate-800'}`}>4 Wheeler</div>
                  <div className="text-xs text-slate-500 font-medium">Sedan, SUV</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-xl transition-colors ${vehicleType === '4w' ? 'text-[#FFA640]' : 'text-slate-800'}`}>₹20 <span className="text-xs font-medium text-slate-400">/hr</span></div>
                <div className="text-[10px] text-slate-400 font-medium">₹400 /day</div>
              </div>
            </div>

            {/* 2 Wheeler */}
            <div
              onClick={() => setVehicleType('2w')}
              className={`
                flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all duration-300 border-2
                ${vehicleType === '2w'
                  ? 'bg-orange-50 border-[#FFA640] shadow-md shadow-orange-100'
                  : 'bg-gray-50/50 border-transparent hover:bg-gray-100'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm p-2">
                  <img src="/bike.png" alt="Bike" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className={`font-bold text-lg transition-colors ${vehicleType === '2w' ? 'text-[#FFA640]' : 'text-slate-800'}`}>2 Wheeler</div>
                  <div className="text-xs text-slate-500 font-medium">Bike, Scooter</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-xl transition-colors ${vehicleType === '2w' ? 'text-[#FFA640]' : 'text-slate-800'}`}>₹10 <span className="text-xs font-medium text-slate-400">/hr</span></div>
                <div className="text-[10px] text-slate-400 font-medium">₹40 /day</div>
              </div>
            </div>

            {/* 3 Wheeler */}
            <div
              onClick={() => setVehicleType('3w')}
              className={`
                flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all duration-300 border-2
                ${vehicleType === '3w'
                  ? 'bg-orange-50 border-[#FFA640] shadow-md shadow-orange-100'
                  : 'bg-gray-50/50 border-transparent hover:bg-gray-100'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-amber-600 font-bold border border-amber-100">
                  Auto
                </div>
                <div>
                  <div className={`font-bold text-lg transition-colors ${vehicleType === '3w' ? 'text-[#FFA640]' : 'text-slate-800'}`}>3 Wheeler</div>
                  <div className="text-xs text-slate-500 font-medium">Rickshaw</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-xl transition-colors ${vehicleType === '3w' ? 'text-[#FFA640]' : 'text-slate-800'}`}>₹20 <span className="text-xs font-medium text-slate-400">/hr</span></div>
                <div className="text-[10px] text-slate-400 font-medium">₹480 /day</div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Selector Dropdown */}
        <div ref={dropdownRef} className="relative z-30">
          <label className="block text-sm font-bold text-slate-600 mb-2 ml-1">
            Select Saved Vehicle
          </label>
          <button
            onClick={() => setOpen(!open)}
            className="w-full rounded-[1.5rem] px-5 py-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100 transition-all hover:shadow-md active:scale-[0.99]"
          >
            {selectedVehicle ? (
              <>
                <div className="relative w-10 h-10 shrink-0">
                  <Image src={selectedVehicle.icon} alt="Vehicle" fill className="object-contain" />
                </div>

                <div className="flex-1 text-left">
                  <div className="text-base font-bold text-slate-900">
                    {selectedVehicle.number}
                  </div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {selectedVehicle.model}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 text-left font-bold text-slate-400">Loading vehicles...</div>
            )}

            <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-180 bg-slate-100' : ''}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="w-4 h-4 text-slate-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          <div
            className={`
              absolute w-full mt-2 bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 origin-top
              ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
          `}
          >
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVehicle(v)
                  setOpen(false)
                }}
                className={`w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-50
                  ${selectedVehicle?.id === v.id ? 'bg-slate-50' : ''}
              `}
              >
                <div className="relative w-8 h-8 shrink-0 opacity-80">
                  <Image src={v.icon} alt="Vehicle" fill className="object-contain" />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-bold ${selectedVehicle?.id === v.id ? 'text-slate-900' : 'text-slate-600'}`}>{v.number}</div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{v.model}</div>
                </div>
                {selectedVehicle?.id === v.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 space-y-4">
          <button className="w-full bg-[#E05A4F] text-white py-4 rounded-[2rem] text-xl font-bold shadow-lg shadow-red-200 hover:bg-[#d6453a] hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6 opacity-90">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Report Discrepancy
          </button>

          <button
            onClick={handleBooking}
            disabled={loading}
            className="w-full bg-[#98FB98] text-[#2E8B57] py-4 rounded-[2rem] text-xl font-bold shadow-lg shadow-green-100 hover:bg-[#8cee8c] hover:shadow-green-200 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2E8B57]"></div>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6 opacity-90">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                </svg>
                Book Ticket (₹{getPrice(vehicleType)}/hr)
              </>
            )}

          </button>

          {/* UPI Logo */}
          <div className="flex justify-center py-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/2560px-UPI-Logo-vector.svg.png"
              alt="UPI"
              className="h-5 object-contain"
            />
          </div>


          <div className="text-center space-y-1 pb-6">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">No refunds once booked</p>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Municipal Corporation of Delhi</p>
          </div>
        </div>

      </div>
    </div>
  )
}
