'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

/* =======================
   TYPES
======================= */

type Vehicle = {
  id: number
  number: string
  model: string
  icon: string
}

type TicketStatus = {
  vehicleId: number
  active: boolean
}

type TicketDetails = {
  qrImage: string
  status: 'ACTIVE' | 'EXPIRED' | 'RESERVED' | 'PARKED'
  entryTime: string
  remainingSeconds: number
  parking: {
    name: string
    addressLine1: string
    addressLine2: string
    ratePerHour: number
  }
  billing: {
    currentAmount: number
    originalAmount: number
  }
}


/* =======================
   MOCK API
======================= */

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


/* =======================
   COMPONENT
======================= */

export default function UserDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const [hasTicket, setHasTicket] = useState(false)
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null)

  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  /* Fetch vehicles */
  useEffect(() => {
    mockFetchVehicles().then(data => {
      setVehicles(data)
      setSelectedVehicle(data[0])
    })
  }, [])

  const fetchTicketStatus = useCallback(async (vehicleNumber: string) => {
    try {
      const res = await fetch(`/api/tickets/active?vehicleNumber=${vehicleNumber}`)
      const data = await res.json()

      if (data.success && data.active) {
        setHasTicket(true)

        // Map API response to TicketDetails
        const validTill = data.ticket ? new Date(data.ticket.validTill) : new Date(Date.now() + 3600000)
        const entryTime = data.status === 'PARKED' ? new Date(data.entryTime) : (data.ticket ? new Date(data.ticket.createdAt) : new Date())

        let remaining = 0;

        if (data.status === 'RESERVED') {
          // For RESERVED, show time left to enter (validTill - now)
          remaining = Math.max(0, Math.floor((validTill.getTime() - Date.now()) / 1000))
        } else {
          // For PARKED, show elapsed time (now - entryTime)
          remaining = Math.floor((Date.now() - entryTime.getTime()) / 1000)
        }


        setTicketDetails({
          qrImage: data.qrCode || './qr.png', // Use API provided QR or fallback
          status: data.status,
          entryTime: entryTime.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
          remainingSeconds: remaining,
          parking: {
            name: data.parkingLot.name,
            addressLine1: data.parkingLot.address,
            addressLine2: data.parkingLot.area,
            ratePerHour: data.ticket ? data.ticket.amount : 20, // Fallback rate
          },
          billing: {
            currentAmount: data.ticket ? data.ticket.amount : 0,
            originalAmount: data.ticket ? data.ticket.amount : 0,
          }
        })
        setRemainingSeconds(remaining)

      } else {
        setHasTicket(false)
        setTicketDetails(null)
        setRemainingSeconds(null)
      }
    } catch (error) {
      console.error("Failed to fetch ticket status", error)
      setHasTicket(false)
    }
  }, [])


  /* Fetch ticket when vehicle changes */
  useEffect(() => {
      if (!selectedVehicle) return

      const timeoutId = setTimeout(() => {
        fetchTicketStatus(selectedVehicle.number)
      }, 0)

      const pollInterval = setInterval(() => {
        fetchTicketStatus(selectedVehicle.number)
      }, 30000)

      return () => {
        clearTimeout(timeoutId)
        clearInterval(pollInterval)
      }
    }, [selectedVehicle, fetchTicketStatus])


  /* Close dropdown */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  

  // Timer Logic
  useEffect(() => {
    if (remainingSeconds === null || !ticketDetails) return

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev === null) return null

        if (ticketDetails.status === 'PARKED') {
          // Elapsed time increases
          return prev + 1
        } else {
          // Reserved time decreases
          return prev > 0 ? prev - 1 : 0
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [ticketDetails?.status]) // Re-run if status changes

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }


  if (!selectedVehicle) return null


  return (
    <div className="min-h-screen bg-[#F4F4F4] text-slate-800 font-sans pb-10">

      {/* Header */}
      <div className="flex items-center justify-between pt-8 pb-4 px-6 sticky top-0 bg-[#F4F4F4]/80 backdrop-blur-md z-40">
        <button className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="w-5 h-5 text-gray-700"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        <h1 className="text-xl font-bold text-slate-800">
          Dashboard
        </h1>

        <button className="bg-[#FFA640] text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-orange-200 hover:shadow-xl hover:bg-[#ff9922] transition-all active:scale-95">
          Logout
        </button>
      </div>

      <div className="px-6 flex flex-col gap-6">

        {/* Vehicle Selector */}
        <div ref={dropdownRef} className="relative z-30">
          <button
            onClick={() => setOpen(!open)}
            className="w-full rounded-[1.5rem] px-5 py-4 flex items-center gap-4 bg-white shadow-sm border border-slate-100 transition-all hover:shadow-md active:scale-[0.99]"
          >
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
                    ${selectedVehicle.id === v.id ? 'bg-slate-50' : ''}
                `}
              >
                <div className="relative w-8 h-8 shrink-0 opacity-80">
                  <Image src={v.icon} alt="Vehicle" fill className="object-contain" />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-bold ${selectedVehicle.id === v.id ? 'text-slate-900' : 'text-slate-600'}`}>{v.number}</div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{v.model}</div>
                </div>
                {selectedVehicle.id === v.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* USER QR */}
        {!hasTicket && (
          <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-lg shadow-gray-200/50 border border-white">
            <div className="relative mb-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Scan to Park</div>
              <div className="p-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-50 inline-block">
                <Image src="/qr.png" alt="QR" width={200} height={200} className="" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">Ready to Park?</h2>
              <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                Show this QR code to the parking assistant for quick entry.
              </p>
            </div>
          </div>
        )}

        {/* TICKET */}
        {hasTicket && ticketDetails && (
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden">
            {/* Decorative Top */}
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${ticketDetails.status === 'RESERVED' ? 'from-orange-400 to-orange-500' : 'from-blue-500 to-blue-600'}`} />

            <div className="text-center pt-2 pb-6 border-b border-dashed border-slate-200 relative">
              {/* Notches */}
              <div className="absolute -left-9 bottom-[-10px] w-6 h-6 rounded-full bg-[#F4F4F4]" />
              <div className="absolute -right-9 bottom-[-10px] w-6 h-6 rounded-full bg-[#F4F4F4]" />

              <Image src={ticketDetails.qrImage} alt="Ticket QR" width={160} height={160} className="mx-auto mix-blend-multiply opacity-90" />

              <div className="mt-4 flex flex-col items-center gap-1">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${ticketDetails.status === 'RESERVED' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                  {ticketDetails.status}
                </span>
                <div className="text-3xl font-mono font-bold text-slate-800 tracking-tight mt-1">
                  {remainingSeconds !== null && formatTime(remainingSeconds)}
                </div>
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                  {ticketDetails.status === 'RESERVED' ? 'Time to Entry' : 'Elapsed Time'}
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-bold text-slate-800 leading-tight">
                    {ticketDetails.parking.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {ticketDetails.parking.addressLine1}
                    <br />
                    {ticketDetails.parking.addressLine2}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-800">
                    ₹{ticketDetails.parking.ratePerHour}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase">per hour</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Due</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      ₹{ticketDetails.billing.currentAmount}
                    </span>
                  </div>
                </div>

                <button className="bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                  Pay Now
                </button>
              </div>

              <div className="text-center">
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button className="col-span-2 w-full bg-[#FFA640] text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-[#ff9922] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 opacity-80"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Parking History
          </button>

          <button
            onClick={() => router.push('/user/parking')}
            className="w-full bg-[#FFA640] text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-[#ff9922] transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6 opacity-90"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-sm">Find Parking</span>
          </button>

          <button className="w-full bg-[#E05A4F] text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-[#d6453a] transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6 opacity-90"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="text-sm">Report</span>
          </button>
        </div>

        {/* FOOTER */}
        <div className="py-6 text-center">
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            ParkProof App • v1.0.2
          </div>
        </div>

      </div>
    </div>
  )
}
