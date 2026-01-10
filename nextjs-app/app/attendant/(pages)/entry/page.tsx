"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BrowserQRCodeReader } from "@zxing/browser";
import {
    FaArrowLeft,
    FaPrint,
    FaParking,
    FaCheckCircle,
    FaTimes,
} from "react-icons/fa";
import { MdOutlineConfirmationNumber, MdOutlineQrCodeScanner, MdQrCodeScanner } from "react-icons/md";
import { BsLightningChargeFill } from "react-icons/bs";
import { IoCarSport, IoBicycle, IoArrowForwardCircle, IoScan } from "react-icons/io5";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type VehicleTypeEnum = "4w" | "2w" | "3w";

interface VehicleQRCodeData {
    type: string;
    ticket_id: string;
    vehicle: string;
    parking_lot: string;
    vehicle_type: VehicleTypeEnum;
}

// ----------------------------------------------------------------------
// Scanner Component using ZXing
// ----------------------------------------------------------------------

const QRCodeScanner = ({
    onScanSuccess,
    isScanning,
}: {
    onScanSuccess: (decodedText: string) => void;
    isScanning: boolean;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const scanLockRef = useRef(false);

    // Ensure we're on client side
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isScanning || !isMounted) return;

        // Reset lock when scanner restarts
        scanLockRef.current = false;

        const codeReader = new BrowserQRCodeReader();
        codeReaderRef.current = codeReader;

        codeReader
            .decodeFromVideoDevice(undefined, videoRef.current!, (result, error) => {
                if (result && !scanLockRef.current) {
                    scanLockRef.current = true;
                    onScanSuccess(result.getText());
                }
            })
            .catch((err) => {
                console.error("QR Scanner Error:", err);
            });

        return () => {
            // Properly stop the video stream
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isScanning, isMounted, onScanSuccess]);

    if (!isMounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-[2rem]">
                <div className="text-white text-sm">Initializing camera...</div>
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            className="w-full h-full object-cover rounded-[2rem]"
        />
    );
};

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

export default function AttendantEntryPage() {
    const [activeMode, setActiveMode] = useState<"SCAN" | "MANUAL">("SCAN");
    const [vehicleType, setVehicleType] = useState<VehicleTypeEnum>("4w");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [attendantData, setAttendantData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Scanned State
    const [lastScannedData, setLastScannedData] = useState<VehicleQRCodeData | null>(null);
    const [scanStatus, setScanStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
    const [scanMessage, setScanMessage] = useState("");

    // Confirmation State
    const [pendingEntry, setPendingEntry] = useState<VehicleQRCodeData | null>(null);
    const [isScanning, setIsScanning] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch User to get ParkingLot ID
                const meRes = await fetch('/api/me');
                if (meRes.status === 401) {
                    return;
                }
                const meData = await meRes.json();

                if (meData.parkingLotId) {
                    // 2. Fetch Parking Lot Details
                    const lotRes = await fetch(`/api/parking/${meData.parkingLotId}`);
                    const lotData = await lotRes.json();

                    if (lotData.success) {
                        setAttendantData({ parkingLot: lotData.data });
                    } else {
                        toast.error("Failed to load parking lot details");
                    }
                } else {
                    toast.error("No parking lot assigned to this attendant");
                }
            } catch (error) {
                console.error("Entry Page Load Error", error);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handler for QR Scan - Now just stores data, doesn't process entry
    const handleScanSuccess = async (decodedText: string) => {
        if (!isScanning || pendingEntry) return;

        try {
            const parsed: VehicleQRCodeData = JSON.parse(decodedText);

            if (!parsed.ticket_id || !parsed.vehicle) {
                throw new Error("Invalid QR Data");
            }

            // Stop scanning and show confirmation
            setIsScanning(false);
            setPendingEntry(parsed);
            setScanStatus("IDLE");

        } catch (e) {
            console.error("Scan Parse Error", e);
            setScanMessage("Invalid QR Code");
            setScanStatus("ERROR");
            toast.error("Invalid QR Code");
        }
    };

    // New handler for confirming entry
    const handleConfirmEntry = async () => {
        if (!pendingEntry) return;

        try {
            setScanStatus("IDLE");
            setScanMessage("");

            // Validate ticket
            const validateRes = await fetch(`/api/ticket/validate?ticketId=${pendingEntry.ticket_id}`);
            const valData = await validateRes.json();

            if (!validateRes.ok || !valData.valid) {
                setScanMessage(`Invalid: ${valData.reason || "Unknown"}`);
                setScanStatus("ERROR");
                toast.error(`Invalid: ${valData.reason || "Unknown"}`);

                // Clear pending and resume scanning after showing error
                setTimeout(() => {
                    setPendingEntry(null);
                    setIsScanning(true);
                    setScanStatus("IDLE");
                    setScanMessage("");
                    setPendingEntry(null);
                }, 2000);
                return;
            }

            // Process entry
            const enterRes = await fetch(`/api/attendee/entry`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: pendingEntry.ticket_id }),
            });
            const enterData = await enterRes.json();

            if (!enterRes.ok) {
                setScanMessage(`Error: ${enterData.message}`);
                setScanStatus("ERROR");
                toast.error(`Error: ${enterData.message}`);

                // Clear pending and resume scanning after showing error
                setTimeout(() => {
                    setPendingEntry(null);
                    setIsScanning(true);
                    setScanStatus("IDLE");
                    setScanMessage("");
                    setPendingEntry(null);
                }, 2000);
                return;
            }

            setScanMessage(`Vehicle Entered: ${pendingEntry.vehicle}`);
            setScanStatus("SUCCESS");
            toast.success(`Vehicle Entered: ${pendingEntry.vehicle}`);

            // Clear pending and resume scanning after delay
            setTimeout(() => {
                setPendingEntry(null);
                setIsScanning(true);
                setScanStatus("IDLE");
            }, 2000);

        } catch (e) {
            setScanMessage("Network Error");
            setScanStatus("ERROR");
            toast.error("Network Error");

            // Clear pending and resume scanning after showing error
            setTimeout(() => {
                setPendingEntry(null);
                setIsScanning(true);
                setScanStatus("IDLE");
                setScanMessage("");
            }, 2000);
        }
    };

    // Handler to cancel and rescan
    const handleCancelScan = () => {
        setScanStatus("IDLE");
        setScanMessage("");
        setPendingEntry(null);

        // 🔁 force clean restart
        setIsScanning(false);

        requestAnimationFrame(() => {
            setIsScanning(true);
        });
    };


    const handleManualPrint = async () => {
        if (!attendantData?.parkingLot?.pid || !vehicleNumber) {
            setScanMessage("Missing Details");
            setScanStatus("ERROR");
            return;
        }

        try {
            const bookRes = await fetch("/api/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    parkingLotId: attendantData.parkingLot.pid,
                    vehicleNumber: vehicleNumber,
                    vehicleType: vehicleType,
                    amount: vehicleType === '2w' ? 10 : 20,
                })
            });

            if (!bookRes.ok) throw new Error("Booking Failed");

            setScanStatus("SUCCESS");
            setScanMessage(`Ticket: ${vehicleNumber}`);
            setVehicleNumber("");

        } catch (e: any) {
            setScanMessage("Booking Failed");
            setScanStatus("ERROR");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium animate-pulse">
            Loading Dashboard...
        </div>
    );

    const lotName = attendantData?.parkingLot?.name || "MCD Parking";
    const capacity = attendantData?.parkingLot?.capacity || 100;
    const occupied = attendantData?.parkingLot?.occupied || 0;
    const available = Math.max(0, capacity - occupied);
    const occupancyPercent = Math.round((occupied / capacity) * 100);

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans select-none">
            {/* Header */}
            <header className="px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-b border-gray-100/50">
                <Link
                    href="/attendant/dashboard"
                    className="text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 p-2 rounded-full active:scale-95"
                >
                    <FaArrowLeft className="text-lg" />
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Attendant Entry</span>
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs ring-2 ring-orange-50">A</div>
                </div>
            </header>

            <main className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full gap-8">
                {/* Modern Parking Info Card */}
                <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group border border-slate-100">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-700 blur-xl"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <FaParking className="text-blue-600 text-xl drop-shadow-sm" />
                                <h1 className="text-xl font-bold text-slate-800 tracking-tight">{lotName}</h1>
                            </div>
                            <p className="text-sm text-slate-500 font-medium max-w-[200px] leading-relaxed opacity-80">
                                {attendantData?.parkingLot?.address || "Loading..."}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-extrabold text-blue-600 tabular-nums tracking-tighter loading-none drop-shadow-sm">
                                {available}
                                <span className="text-sm font-bold text-slate-300 ml-1">/{capacity}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slots Available</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                            <span>Occupancy</span>
                            <span>{occupancyPercent}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${occupancyPercent > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${occupancyPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Floating Toggle */}
                <div className="bg-white p-1.5 rounded-full shadow-lg shadow-slate-200/50 flex relative border border-slate-100">
                    <div
                        className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-900 rounded-full shadow-md transition-transform duration-300 ease-spring ${activeMode === "MANUAL" ? "translate-x-0" : "translate-x-[102%]"
                            }`}
                    ></div>
                    <button
                        onClick={() => setActiveMode("MANUAL")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-colors relative z-10 ${activeMode === "MANUAL" ? "text-white" : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        <FaPrint className="text-lg" />
                        <span>Ticket</span>
                    </button>
                    <button
                        onClick={() => setActiveMode("SCAN")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-colors relative z-10 ${activeMode === "SCAN" ? "text-white" : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        <MdQrCodeScanner className="text-xl" />
                        <span>Scan QR</span>
                    </button>
                </div>

                {/* Dynamic Content Area */}
                <div className="flex-1 flex flex-col justify-start pt-2 min-h-[400px]">
                    {activeMode === "SCAN" ? (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Conditional: Show Scanner or Confirmation */}
                            {!pendingEntry ? (
                                <>
                                    {/* QR Scanner */}
                                    <div className="relative w-full aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white border border-slate-800 group">
                                        <QRCodeScanner onScanSuccess={handleScanSuccess} isScanning={isScanning} />

                                        {/* HUD Overlay */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            {/* Dark Vignette */}
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]"></div>

                                            {/* Center Focus Frame */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-white/20 rounded-[1.5rem]">
                                                {/* Animated Corner Brackets */}
                                                <div className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-blue-500 rounded-tl-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                                <div className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-blue-500 rounded-tr-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-blue-500 rounded-bl-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-blue-500 rounded-br-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>

                                                {/* Scanning Laser Line */}
                                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(96,165,250,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                                            </div>

                                            {/* Status Text */}
                                            <div className="absolute bottom-10 left-0 right-0 text-center">
                                                <span className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-blue-400 tracking-widest uppercase shadow-lg">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                                    Active Scanner
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Confirmation Card */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-8 shadow-2xl border-2 border-blue-200 animate-in zoom-in-95 duration-300">
                                        <div className="text-center mb-6">
                                            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                <MdQrCodeScanner className="text-4xl text-white" />
                                            </div>
                                            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">QR Code Scanned</h2>
                                            <p className="text-sm text-slate-500 font-medium">Verify vehicle details below</p>
                                        </div>

                                        {/* Vehicle Details */}
                                        <div className="bg-white rounded-3xl p-6 mb-6 shadow-inner border border-blue-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vehicle Number</span>
                                                <span className="text-xs font-bold text-blue-600 uppercase">{pendingEntry.vehicle_type}</span>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-4xl font-black text-slate-900 tracking-wider mb-2 font-mono">
                                                    {pendingEntry.vehicle}
                                                </div>
                                                <div className="text-xs text-slate-400 font-medium">
                                                    Ticket ID: {pendingEntry.ticket_id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={handleCancelScan}
                                                className="bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-[1.5rem] font-bold text-sm shadow-md hover:shadow-lg hover:border-slate-300 transition-all flex items-center justify-center gap-2 group active:scale-95"
                                            >
                                                <FaTimes className="text-lg text-slate-400 group-hover:text-red-500 transition-colors" />
                                                <span>Cancel</span>
                                            </button>
                                            <button
                                                onClick={handleConfirmEntry}
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-[1.5rem] font-bold text-sm shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 group active:scale-95"
                                            >
                                                <FaCheckCircle className="text-lg" />
                                                <span>Confirm Entry</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Result Card */}
                            {scanStatus !== "IDLE" && (
                                <div className={`p-5 rounded-3xl flex items-center gap-4 shadow-xl border animate-in slide-in-from-bottom-2 ${scanStatus === "SUCCESS" ? "bg-green-50/80 border-green-100 backdrop-blur-sm" : "bg-red-50/80 border-red-100 backdrop-blur-sm"
                                    }`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${scanStatus === "SUCCESS" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                        }`}>
                                        {scanStatus === "SUCCESS" ? <BsLightningChargeFill /> : <MdOutlineConfirmationNumber />}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${scanStatus === "SUCCESS" ? "text-green-800" : "text-red-800"}`}>
                                            {scanStatus === "SUCCESS" ? "Verified" : "Error"}
                                        </h3>
                                        <p className="text-sm text-slate-600 font-medium leading-tight opacity-80">{scanMessage}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Vehicle Type Selection */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: '4w', icon: IoCarSport, label: 'Car' },
                                    { id: '2w', icon: IoBicycle, label: 'Bike' },
                                    { id: '3w', icon: IoCarSport, label: 'Other' },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setVehicleType(type.id as VehicleTypeEnum)}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border transition-all duration-200 ${vehicleType === type.id
                                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105"
                                            : "border-transparent bg-white text-slate-400 hover:bg-slate-50 shadow-sm"
                                            }`}
                                    >
                                        <type.icon className="text-2xl" />
                                        <span className="text-xs font-bold">{type.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Input Field */}
                            <div className="bg-white p-2.5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center group focus-within:ring-4 focus-within:ring-slate-100 transition-all">
                                <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-focus-within:bg-slate-900 group-focus-within:text-white transition-colors duration-300 shadow-inner">
                                    <span className="font-bold text-lg">DL</span>
                                </div>
                                <input
                                    type="text"
                                    value={vehicleNumber}
                                    onChange={(e) => setVehicleNumber(e.target.value)}
                                    placeholder="AB 12 XXXX"
                                    className="flex-1 h-14 bg-transparent border-none text-xl font-bold text-slate-800 placeholder-slate-200 focus:ring-0 text-center uppercase tracking-widest"
                                />
                            </div>

                            {/* Print Button */}
                            <button
                                onClick={handleManualPrint}
                                className="mt-2 bg-slate-900 hover:bg-black text-white py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
                            >
                                <span>Generate Ticket</span>
                                <IoArrowForwardCircle className="text-3xl text-slate-500 group-hover:text-white transition-colors" />
                            </button>

                            {/* Feedback for manual mode */}
                            {scanStatus !== "IDLE" && activeMode === "MANUAL" && (
                                <div className={`text-center text-xs font-bold uppercase tracking-widest animate-pulse ${scanStatus === "SUCCESS" ? "text-green-600" : "text-red-500"}`}>
                                    {scanMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <style jsx global>{`
        .ease-spring { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes scan {
            0% { top: 10%; opacity: 0; }
            50% { opacity: 1; }
            100% { top: 90%; opacity: 0; }
        }
      `}</style>
        </div>
    );
}
