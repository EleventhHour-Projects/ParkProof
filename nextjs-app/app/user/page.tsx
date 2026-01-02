'use client'

import { useState, useRef, useEffect } from 'react'
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
  status: 'ACTIVE' | 'EXPIRED'
  entryTime: string
  remainingSeconds: number   // 👈 NEW
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

const mockFetchTicketStatus = (vehicleId: number): Promise<TicketStatus> =>
  new Promise(resolve =>
    setTimeout(() => {
      resolve({ vehicleId, active: vehicleId !== 2 })
    }, 300)
  )

const mockFetchTicketDetails = (vehicleId: number): Promise<TicketDetails> =>
  new Promise(resolve =>
    setTimeout(() => {
      resolve({
        qrImage: '/qr.png',
        status: 'ACTIVE',
        entryTime: '14/02/2026 • 03:14 PM',
        remainingSeconds: 3 * 3600 + 54 * 60 + 43,
        parking: {
          name: 'MCD Rohini',
          addressLine1: 'Near DTU',
          addressLine2: 'Rohini Sector - XX ND - 1100XX',
          ratePerHour: 20,
        },
        billing: {
          currentAmount: 60,
          originalAmount: 80,
        },
      })
    }, 300)
  )


const mockToggleTicketStatus = (
  vehicleId: number,
  current: boolean
): Promise<TicketStatus> =>
  new Promise(resolve =>
    setTimeout(() => {
      resolve({ vehicleId, active: !current })
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
  /* Fetch vehicles */
  useEffect(() => {
    mockFetchVehicles().then(data => {
      setVehicles(data)
      setSelectedVehicle(data[0])
    })
  }, [])

  /* Fetch ticket when vehicle changes */
  useEffect(() => {
    if (!selectedVehicle) return

    mockFetchTicketStatus(selectedVehicle.id).then(status => {
      setHasTicket(status.active)
      if (status.active) {
        mockFetchTicketDetails(selectedVehicle.id).then(details => {
          setTicketDetails(details)
          setRemainingSeconds(details.remainingSeconds)
        })
      } else {
        setTicketDetails(null)
      }
    })
  }, [selectedVehicle])

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

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  useEffect(() => {
    if (remainingSeconds === null) return

    if (remainingSeconds <= 0) {
      setHasTicket(false)
      setTicketDetails(null)
      setRemainingSeconds(null)
      return
    }

    const interval = setInterval(() => {
      setRemainingSeconds(prev => (prev !== null ? prev + 1 : prev))
    }, 1000)

    return () => clearInterval(interval)
  }, [remainingSeconds])
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
    <div className="min-h-screen bg-[#F4F4F4] flex justify-center relative">
      <div className="w-full max-w-105 min-h-screen flex flex-col px-4 pb-4">

        {/* DEV CHIP */}
        <button
          onClick={async () => {
            const res = await mockToggleTicketStatus(
              selectedVehicle.id,
              hasTicket
            )
            setHasTicket(res.active)
            if (res.active) {
              const details = await mockFetchTicketDetails(selectedVehicle.id)
              setTicketDetails(details)
              setRemainingSeconds(details.remainingSeconds)
            } else {
              setTicketDetails(null)
              setRemainingSeconds(null)
            }
          }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50
                     text-[10px] bg-black/80 text-white px-3 py-1 rounded-full"
        >
          DEV MODE: {hasTicket ? 'HAS TICKET' : 'NO TICKET'}
        </button>

        {/* Header */}
        <div className="flex items-center justify-between pt-6 pb-4">
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5 text-gray-700"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button className="bg-[#FFA640] text-white px-5 py-2 rounded-full text-sm font-medium">
            Logout
          </button>
        </div>

        {/* Vehicle Selector */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 bg-[#EDEDED]"
          >
            <Image src={selectedVehicle.icon} alt="Vehicle" width={28} height={28} />

            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-gray-900">
                {selectedVehicle.number}
              </div>
              <div className="text-xs text-gray-600">
                {selectedVehicle.model}
              </div>
            </div>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`w-4 h-4 text-gray-400 transition ${open ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {open && (
            <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-lg z-10">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicle(v)
                    setOpen(false)
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100"
                >
                  <Image src={v.icon} alt="Vehicle" width={24} height={24} />
                  <div>
                    <div className="text-sm text-black">{v.number}</div>
                    <div className="text-xs text-gray-500 ">{v.model}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* USER QR */}
        {!hasTicket && (
          <div className="bg-[#ECECEC] rounded-3xl mt-6 p-5">
            <div className="bg-white rounded-2xl p-5 text-center">
              <div className="text-xs text-gray-400 mb-2">USER PROFILE QR</div>
              <Image src="/qr.png" alt="QR" width={220} height={220} className="mx-auto" />
              <div className="mt-3 font-bold tracking-widest text-gray-700">MCD</div>
            </div>
            <p className="text-[11px] text-gray-500 mt-4 text-center">
              Show this QR to Parking Assistant for quick on-arrival booking
            </p>
          </div>
        )}

        {/* TICKET */}
        {hasTicket && ticketDetails && (
          <div className="bg-[#ECECEC] rounded-3xl mt-6 p-5 space-y-4">
            <div className="bg-white rounded-2xl p-4 text-center">
              <Image src={ticketDetails.qrImage} alt="Ticket QR" width={200} height={200} className="mx-auto" />
              <div className="text-xs text-gray-400 mt-2">
                Digital Ticket ({ticketDetails.status})
              </div>
              <div className="text-xs text-gray-500">{ticketDetails.entryTime}</div>
              <div className="text-xl font-bold text-blue-600 mt-1 tracking-wide">
                {remainingSeconds !== null && formatTime(remainingSeconds)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {ticketDetails.parking.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {ticketDetails.parking.addressLine1}
                    <br />
                    {ticketDetails.parking.addressLine2}
                  </div>
                  <button className="text-xs text-blue-600 mt-1">
                    Show Details
                  </button>
                </div>
                <div className="text-sm text-gray-700">
                  ₹{ticketDetails.parking.ratePerHour}{' '}
                  <span className="text-xs text-gray-400">per hour</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div>
                  <div className="text-xs text-gray-500">Cumulative Amount</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">
                      ₹{ticketDetails.billing.currentAmount}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ₹{ticketDetails.billing.originalAmount}
                    </span>
                  </div>
                </div>

                <button className="bg-blue-600 text-white text-sm px-6 py-2 rounded-full">
                  Pay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="mt-8 space-y-3">
          <button className="w-full bg-[#FFA640] text-white py-3 rounded-full">
            View Parking History
          </button>
<button
  onClick={() => router.push('/user/parking')}
  className="w-full bg-[#FFA640] text-white py-3 rounded-full font-medium shadow-sm"
>
  Find Parking
</button>

          <button className="w-full bg-[#E05A4F] text-white py-3 rounded-full">
            Report Discrepancy
          </button>
        </div>

        {/* FOOTER */}
        <div className="mt-auto py-5 text-center text-xs text-gray-400">
          Municipal Corporation of Delhi
        </div>
      </div>
    </div>
  )
}
