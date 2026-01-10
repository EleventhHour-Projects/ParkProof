"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BrowserQRCodeReader } from "@zxing/browser";
import { FaArrowLeft, FaCheck, FaTimes, FaCheckCircle } from "react-icons/fa";
import { IoCheckmarkCircle } from "react-icons/io5";
import { MdQrCodeScanner, MdOutlineConfirmationNumber } from "react-icons/md";
import { BsLightningChargeFill } from "react-icons/bs";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type VehicleTypeEnum = "4w" | "2w" | "3w";

interface VehicleQRCodeData {
    type: string;
    ticket_id: string; // The Key Field
    vehicle: string;
    parking_lot: string;
    vehicle_type: VehicleTypeEnum;
}

// ----------------------------------------------------------------------
// Scanner Component (Premium Redesign + Robust Logic)
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

export default function AttendantExitPage() {
    const [scanStatus, setScanStatus] = useState<"IDLE" | "SCANNED" | "PAID" | "ERROR">("IDLE");
    const [isScanning, setIsScanning] = useState(true);
    const [pendingExit, setPendingExit] = useState<{ ticketId: string; vehicleNumber?: string; amountDue?: number } | null>(null);

    // Real Data State
    const [vehicleNumber, setVehicleNumber] = useState<string>("");
    const [overdueAmount, setOverdueAmount] = useState<number>(0);
    const [ticketId, setTicketId] = useState<string | null>(null);

    const handleScanSuccess = async (decodedText: string) => {
        if (!isScanning || pendingExit) return;

        try {
            // 1. Attempt to Parse JSON
            let tId = "";
            let vNum = "";
            try {
                const parsed: VehicleQRCodeData = JSON.parse(decodedText);
                console.log("✅ [EXIT] Parsed JSON:", parsed);
                tId = parsed.ticket_id;
                vNum = parsed.vehicle;
            } catch (err) {
                console.warn("⚠️ [EXIT] Not JSON, checking raw string...");
                // Fallback: If it's just the ID string
                if (decodedText.length > 5) tId = decodedText;
            }

            if (!tId) {
                console.error("❌ [EXIT] No ticket_id found");
                throw new Error("QR missing ticket_id");
            }

            // Stop scanner and set pending state
            setIsScanning(false);

            // We temporarily set pending state with basic info while we fetch details
            // Or we can fetch details first. Let's fetch first to show amount on confirmation.

            const loadingToast = toast.loading("Verifying Ticket...");

            // 2. Fetch Session Details from Backend
            console.log("📡 [EXIT] Fetching API for:", tId);
            const res = await fetch("/api/attendee/exit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: tId, action: "verify" })
            });

            const data = await res.json();
            console.log("📥 [EXIT] API Response:", data);

            toast.dismiss(loadingToast);

            if (!res.ok) {
                console.error("❌ [EXIT] API Error:", data.message);
                toast.error(data.message || "Entry Not Found", { id: "scan-ui" });

                // Resume scanning after error
                setTimeout(() => {
                    setIsScanning(true);
                }, 2000);
                return;
            }

            // 3. Set Pending Confirm State
            setPendingExit({
                ticketId: tId,
                vehicleNumber: data.vehicleNumber || vNum,
                amountDue: data.amountDue
            });

            // Update legacy state for compatibility with render
            setTicketId(tId);
            setVehicleNumber(data.vehicleNumber || vNum);
            setOverdueAmount(data.amountDue);

        } catch (e: any) {
            console.error("❌ [EXIT] Handler Error", e);
            toast.error("Invalid QR", {
                description: "See console for details",
                id: "scan-ui"
            });

            // Resume scanning after error
            setTimeout(() => {
                setIsScanning(true);
            }, 2000);
        }
    };

    const handleConfirmExit = () => {
        // Just move to the payment view (SCANNED state in the original logic seems to cover payment view)
        setScanStatus("SCANNED");
        setPendingExit(null); // Clear pending popup to show the payment card
    };

    const handleCancelScan = () => {
        setPendingExit(null);
        setScanStatus("IDLE");

        // 🔁 force clean restart
        setIsScanning(false);
        requestAnimationFrame(() => {
            setIsScanning(true);
        });
    };

    const handleCashPayment = async () => {
        if (!ticketId) return;

        const loadingToast = toast.loading("Processing Exit...");

        try {
            const res = await fetch("/api/attendee/exit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId })
            });

            if (!res.ok) throw new Error("Exit Failed");

            setScanStatus("PAID");
            toast.success("Exit Approved", { id: loadingToast });

            // Reset after success
            setTimeout(() => {
                setScanStatus("IDLE");
                setTicketId(null);
                setVehicleNumber("");
                setOverdueAmount(0);
                setIsScanning(true);
            }, 2000);

        } catch (e) {
            toast.error("Failed to process exit", { id: loadingToast });
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] font-sans flex flex-col text-slate-900 selection:bg-green-100 selection:text-green-900">

            {/* iOS-Style Header */}
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#F2F2F7]/80 backdrop-blur-xl z-30 border-b border-slate-200/50">
                <Link
                    href="/attendant/dashboard"
                    className="p-2 -ml-2 rounded-full hover:bg-white/50 transition-colors text-slate-500 hover:text-slate-900"
                >
                    <FaArrowLeft className="text-xl" />
                </Link>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Vehicle Exit</h1>
                <div className="w-8" />
            </header>

            <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full gap-8 pb-10">

                {/* Scanner/Confirmation Area */}
                <div className="relative group">
                    {!pendingExit && scanStatus === "IDLE" ? (
                        <>
                            <div className="absolute -inset-1 bg-gradient-to-br from-slate-200 to-white rounded-[2.8rem] blur-lg opacity-70 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative w-full aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white shadow-slate-200 mx-auto max-w-[320px] transition-transform duration-500 hover:scale-[1.02]">
                                <QRCodeScanner onScanSuccess={handleScanSuccess} isScanning={isScanning} />

                                {/* New Futuristic HUD Overlay (Green for Exit) */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]"></div>

                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-white/20 rounded-[1.5rem] shadow-[0_0_0_4000px_rgba(0,0,0,0.3)]">
                                        {/* Animated Corner Brackets */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-green-500 rounded-tl-2xl shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-green-500 rounded-tr-2xl shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-green-500 rounded-bl-2xl shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-green-500 rounded-br-2xl shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>

                                        {/* Scanning Laser Line */}
                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_20px_rgba(74,222,128,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                                    </div>

                                    {/* Status Text */}
                                    <div className="absolute bottom-10 left-0 right-0 text-center">
                                        <span className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-green-400 tracking-widest uppercase shadow-lg">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            Active Scanner
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : pendingExit ? (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[2.5rem] p-8 shadow-2xl border-2 border-green-200 animate-in zoom-in-95 duration-300">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <MdQrCodeScanner className="text-4xl text-white" />
                                </div>
                                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">QR Code Scanned</h2>
                                <p className="text-sm text-slate-500 font-medium">Verified vehicle details</p>
                            </div>

                            {/* Vehicle Details */}
                            <div className="bg-white rounded-3xl p-6 mb-6 shadow-inner border border-green-100">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vehicle Number</span>
                                    <span className="text-xs font-bold text-green-600 uppercase">Paid: ₹{pendingExit.amountDue}</span>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-black text-slate-900 tracking-wider mb-2 font-mono">
                                        {pendingExit.vehicleNumber || "-----"}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">
                                        Ticket ID: {pendingExit.ticketId.slice(0, 8)}...
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
                                    onClick={handleConfirmExit}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-[1.5rem] font-bold text-sm shadow-xl hover:shadow-2xl hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 group active:scale-95"
                                >
                                    <IoCheckmarkCircle className="text-lg" />
                                    <span>Confirm Exit</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Paid / Scanned State */
                        <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in zoom-in-95">
                            {scanStatus === "PAID" ? (
                                <div className="flex flex-col items-center justify-center text-green-500 py-10">
                                    <div className="bg-green-50 p-6 rounded-full mb-4">
                                        <FaCheck className="text-5xl drop-shadow-sm" />
                                    </div>
                                    <span className="text-2xl font-bold tracking-tight text-slate-800">Paid & Clear</span>
                                    <p className="text-slate-400 font-medium mt-1">Gate Opening...</p>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <h2 className="text-xl font-bold text-slate-800">Processing Payment</h2>
                                    <p className="text-sm text-slate-500">Please collect ₹{overdueAmount}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Only show payment info when not in pending/scan mode, i.e., SCANNED mode */}
                {scanStatus === "SCANNED" && (
                    <div className="animate-in slide-in-from-bottom-5 duration-500">
                        {/* Ticket/Info Card */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
                            {/* License Plate */}
                            <div className="bg-slate-100 border border-slate-200 p-1.5 rounded-2xl mb-6">
                                <div className="bg-white border border-slate-200 rounded-xl py-3 flex items-center justify-center gap-3 shadow-sm">
                                    <div className="flex flex-col items-center leading-none">
                                        <span className="text-[0.5rem] font-bold text-blue-600">IND</span>
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-b from-orange-400 via-white to-green-600 opacity-80 mt-0.5"></div>
                                    </div>
                                    <span className="text-2xl font-black text-slate-800 tracking-wider font-mono">
                                        {vehicleNumber || "----------"}
                                    </span>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="text-center">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Due</p>
                                <div className="flex items-center justify-center gap-1 text-slate-900">
                                    <span className="text-3xl font-bold text-slate-400">₹</span>
                                    <span className="text-6xl font-black tracking-tighter text-green-600">
                                        {overdueAmount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button className="w-full py-4 bg-[#FF9F0A] hover:bg-[#FFB340] active:bg-[#E08B00] text-white rounded-[1.5rem] font-bold text-lg shadow-lg shadow-orange-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                <span className="italic font-extrabold tracking-tighter text-2xl mr-1">UPI</span>
                                <span className="opacity-90 text-sm font-semibold tracking-wide">PAYMENT</span>
                            </button>

                            <button
                                onClick={handleCashPayment}
                                className="w-full py-4.5 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
                            >
                                <span>Full Cash Payment</span>
                                <div className="bg-white/20 p-1 rounded-full group-hover:bg-white/30 transition-colors">
                                    <IoCheckmarkCircle className="text-xl text-green-400" />
                                </div>
                            </button>

                            <button
                                onClick={handleCancelScan}
                                className="w-12 h-12 flex items-center justify-center mx-auto text-slate-400 hover:text-slate-600 mt-4 rounded-full hover:bg-slate-100 transition-all"
                            >
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-auto">
                    ParkProof Municipal Systems
                </p>

            </main>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
