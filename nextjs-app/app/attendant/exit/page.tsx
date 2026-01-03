"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import { IoCheckmarkCircle } from "react-icons/io5";
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
    onScanFailure,
}: {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const onScanSuccessRef = useRef(onScanSuccess);
    const onScanFailureRef = useRef(onScanFailure);

    // Keep refs updated to avoid re-initialization
    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
        onScanFailureRef.current = onScanFailure;
    }, [onScanSuccess, onScanFailure]);

    useEffect(() => {
        // Safety cleanup before init
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }

        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                supportedScanTypes: [] // Default to camera
            },
            false
        );

        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                if (onScanSuccessRef.current) onScanSuccessRef.current(decodedText);
            },
            (error) => {
                if (onScanFailureRef.current) onScanFailureRef.current(error);
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error) => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, []); // MOUNT ONCE

    return <div id="reader" className="w-full h-full rounded-[2rem] overflow-hidden bg-black shadow-inner" />;
};


// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

export default function AttendantExitPage() {
    const [scanStatus, setScanStatus] = useState<"IDLE" | "SCANNED" | "PAID">("IDLE");

    // Real Data State
    const [vehicleNumber, setVehicleNumber] = useState<string>("");
    const [overdueAmount, setOverdueAmount] = useState<number>(0);
    const [ticketId, setTicketId] = useState<string | null>(null);

    const handleScanSuccess = async (decodedText: string) => {

        try {
            // 1. Attempt to Parse JSON
            let tId = "";
            try {
                const parsed: VehicleQRCodeData = JSON.parse(decodedText);
                console.log("✅ [EXIT] Parsed JSON:", parsed);
                tId = parsed.ticket_id;
            } catch (err) {
                console.warn("⚠️ [EXIT] Not JSON, checking raw string...");
                // Fallback: If it's just the ID string
                if (decodedText.length > 5) tId = decodedText;
            }

            if (!tId) {
                console.error("❌ [EXIT] No ticket_id found");
                throw new Error("QR missing ticket_id");
            }

            // 2. Fetch Session Details from Backend
            console.log("📡 [EXIT] Fetching API for:", tId);
            const res = await fetch(`/api/attendee/exit?ticketId=${tId}`);
            const data = await res.json();
            console.log("📥 [EXIT] API Response:", data);

            if (!res.ok) {
                console.error("❌ [EXIT] API Error:", data.message);
                toast.error(data.message || "Entry Not Found", { id: "scan-ui" });
                return;
            }

            // 3. Update UI
            setTicketId(tId);
            setVehicleNumber(data.vehicleNumber);
            setOverdueAmount(data.amountDue);
            setScanStatus("SCANNED");

            toast.success("Vehicle Verified", { id: "scan-ui" });

        } catch (e: any) {
            console.error("❌ [EXIT] Handler Error", e);
            toast.error("Invalid QR", {
                description: "See console for details",
                id: "scan-ui"
            });
        }
    };

    const handleCashPayment = async () => {
        if (scanStatus !== "SCANNED" || !ticketId) return;

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

                {/* Scanner Card */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-br from-slate-200 to-white rounded-[2.8rem] blur-lg opacity-70 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative w-full aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white shadow-slate-200 mx-auto max-w-[320px] transition-transform duration-500 hover:scale-[1.02]">
                        {scanStatus === "PAID" ? (
                            <div className="absolute inset-0 bg-green-500 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
                                <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm mb-4">
                                    <FaCheck className="text-5xl drop-shadow-sm" />
                                </div>
                                <span className="text-2xl font-bold tracking-tight">Paid & Clear</span>
                                <p className="text-green-100 font-medium mt-1">Gate Opening...</p>
                            </div>
                        ) : (
                            <>
                                <QRCodeScanner onScanSuccess={handleScanSuccess} />

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
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-4" />

                {/* Ticket/Info Card */}
                <div className={`bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 ${scanStatus === "SCANNED" ? "translate-y-0 opacity-100" : "translate-y-4 opacity-50 grayscale"}`}>
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
                            <span className={`text-6xl font-black tracking-tighter ${scanStatus === "PAID" ? "text-green-500" : "text-green-600"}`}>
                                {overdueAmount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto space-y-3">
                    <button className="w-full py-4 bg-[#FF9F0A] hover:bg-[#FFB340] active:bg-[#E08B00] text-white rounded-[1.5rem] font-bold text-lg shadow-lg shadow-orange-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        <span className="italic font-extrabold tracking-tighter text-2xl mr-1">UPI</span>
                        <span className="opacity-90 text-sm font-semibold tracking-wide">PAYMENT</span>
                    </button>

                    <button
                        onClick={handleCashPayment}
                        disabled={scanStatus !== "SCANNED"}
                        className="w-full py-4.5 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
                    >
                        <span>Full Cash Payment</span>
                        <div className="bg-white/20 p-1 rounded-full group-hover:bg-white/30 transition-colors">
                            <IoCheckmarkCircle className="text-xl text-green-400" />
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
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
