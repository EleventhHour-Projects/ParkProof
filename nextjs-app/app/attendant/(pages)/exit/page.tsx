"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BrowserQRCodeReader } from "@zxing/browser";
import { FaArrowLeft, FaCheck, FaTimes, FaHistory, FaCheckCircle, FaCar } from "react-icons/fa";
import { IoCheckmarkCircle, IoCarSport, IoTimeOutline } from "react-icons/io5";
import { MdQrCodeScanner, MdOutlineConfirmationNumber } from "react-icons/md";
import { BsLightningChargeFill } from "react-icons/bs";
import { toast } from "sonner";
import { format } from "date-fns";
import { MapPin } from "lucide-react";

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
// Scanner Component
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

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isScanning || !isMounted) return;

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
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isScanning, isMounted, onScanSuccess]);

    if (!isMounted) return <div className="bg-slate-900 w-full h-full rounded-[2rem]"></div>;

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

    // Data State
    const [loading, setLoading] = useState(true);
    const [attendantData, setAttendantData] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Real Data State
    const [vehicleNumber, setVehicleNumber] = useState<string>("");
    const [overdueAmount, setOverdueAmount] = useState<number>(0);
    const [ticketId, setTicketId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch User
                const meRes = await fetch('/api/me');
                if (meRes.status === 401) return;
                const meData = await meRes.json();

                if (meData.parkingLotId) {
                    // 2. Fetch Lot
                    const lotRes = await fetch(`/api/parking/${meData.parkingLotId}`);
                    const lotData = await lotRes.json();
                    if (lotData.success) {
                        setAttendantData({ parkingLot: lotData.data });
                    }

                    // 3. Fetch History
                    const histRes = await fetch(`/api/attendant/history`);
                    const histData = await histRes.json();
                    if (histData.success) {
                        setHistory(histData.data);
                    }
                }
            } catch (error) {
                console.error("Exit Page Load Error", error);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const refreshHistory = async () => {
        try {
            const histRes = await fetch(`/api/attendant/history`);
            const histData = await histRes.json();
            if (histData.success) {
                setHistory(histData.data);
            }
        } catch (e) { }
    }

    const handleScanSuccess = async (decodedText: string) => {
        if (!isScanning || pendingExit) return;

        try {
            let tId = "";
            let vNum = "";
            try {
                const parsed: VehicleQRCodeData = JSON.parse(decodedText);
                tId = parsed.ticket_id;
                vNum = parsed.vehicle;
            } catch (err) {
                if (decodedText.length > 5) tId = decodedText;
            }

            if (!tId) throw new Error("QR missing ticket_id");

            setIsScanning(false);
            const loadingToast = toast.loading("Verifying Ticket...");

            const res = await fetch("/api/attendee/exit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: tId, action: "verify" })
            });

            const data = await res.json();
            toast.dismiss(loadingToast);

            if (!res.ok) {
                toast.error(data.message || "Entry Not Found");
                setTimeout(() => setIsScanning(true), 2000);
                return;
            }

            setPendingExit({
                ticketId: tId,
                vehicleNumber: data.vehicleNumber || vNum,
                amountDue: data.amountDue
            });

            setTicketId(tId);
            setVehicleNumber(data.vehicleNumber || vNum);
            setOverdueAmount(data.amountDue);

        } catch (e: any) {
            toast.error("Invalid QR");
            setTimeout(() => setIsScanning(true), 2000);
        }
    };

    const handleConfirmExit = () => {
        setScanStatus("SCANNED");
        setPendingExit(null);
    };

    const handleCancelScan = () => {
        setPendingExit(null);
        setScanStatus("IDLE");
        setIsScanning(false);
        requestAnimationFrame(() => setIsScanning(true));
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
            refreshHistory(); // Update list

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

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium animate-pulse">
            Loading Exit...
        </div>
    );

    const parkingLot = attendantData?.parkingLot;

    return (
        <div className="min-h-screen bg-[#F0F2F5] font-sans flex flex-col text-slate-900 pb-10">
            {/* Top Bar */}
            <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#F0F2F5]/90 backdrop-blur-md z-30">
                <Link
                    href="/attendant/dashboard"
                    className="p-2 -ml-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-900"
                >
                    <FaArrowLeft className="text-xl" />
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Attendant Exit</span>
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">Ex</div>
                </div>
            </div>

            <main className="flex-1 px-6 max-w-md mx-auto w-full flex flex-col gap-6">

                {/* Header Card */}
                {parkingLot ? (
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 flex justify-between items-stretch border border-slate-100 relative overflow-hidden">
                        {/* Decorative Background blob */}
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full blur-2xl"></div>

                        <div className="relative z-10 flex flex-col justify-between">
                            <div>
                                <h2 className="font-extrabold text-lg mb-1 text-slate-800 leading-tight">{parkingLot.name}</h2>
                                <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <p className="text-[11px] font-medium leading-tight max-w-[160px]">
                                        {parkingLot.address}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-right relative z-10">
                            <div className="text-3xl font-black text-[#2E95FA]">
                                {parkingLot.capacity - parkingLot.occupied}
                                <span className="text-sm font-bold text-slate-300 ml-1">/{parkingLot.capacity}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase margin-top-1">Slots Available</div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-4 rounded-xl text-center text-slate-400 font-bold text-sm">Loading Info...</div>
                )}


                {/* Scanner Area */}
                <div className="relative group">
                    {!pendingExit && scanStatus === "IDLE" ? (
                        <>
                            {/* Scanner UI */}
                            <div className="relative w-full aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white shadow-slate-200 mx-auto max-w-[320px] transition-transform duration-500 hover:scale-[1.02]">
                                <QRCodeScanner onScanSuccess={handleScanSuccess} isScanning={isScanning} />
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-white/20 rounded-[1.5rem] shadow-[0_0_0_4000px_rgba(0,0,0,0.3)]">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-orange-500 rounded-tl-2xl"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-orange-500 rounded-tr-2xl"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-orange-500 rounded-bl-2xl"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-orange-500 rounded-br-2xl"></div>
                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_20px_rgba(251,146,60,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                                    </div>
                                    <div className="absolute bottom-10 left-0 right-0 text-center">
                                        <span className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-orange-400 tracking-widest uppercase shadow-lg">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                            Exit Scanner
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : pendingExit ? (
                        /* Confirmation UI (Same as before but cleaned up) */
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-[2.5rem] p-8 shadow-2xl border-2 border-orange-100 animate-in zoom-in-95 duration-300">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-extrabold text-slate-800 mb-1">Verify Exit</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase">Ticket ID: {pendingExit.ticketId.slice(0, 8)}</p>
                            </div>
                            <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-orange-100 text-center">
                                <div className="text-4xl font-black text-slate-900 tracking-wider mb-2 font-mono">{pendingExit.vehicleNumber}</div>
                                <div className="text-sm font-bold text-orange-600">Total Due: ₹{pendingExit.amountDue}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleCancelScan} className="bg-white py-4 rounded-xl font-bold text-slate-500 shadow-sm border border-slate-200">Cancel</button>
                                <button onClick={handleConfirmExit} className="bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200">Confirm</button>
                            </div>
                        </div>
                    ) : (
                        /* Payment UI */
                        <div className="bg-white rounded-[2rem] p-6 shadow-xl animate-in fade-in zoom-in-95">
                            {scanStatus === "PAID" ? (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-4xl"><IoCheckmarkCircle /></div>
                                    <h2 className="text-2xl font-bold text-slate-800">Exit Approved</h2>
                                    <p className="text-slate-500 text-sm mt-2">Vehicle cleared.</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-4">Collect Payment</h2>
                                    <div className="text-6xl font-black text-slate-800 mb-8">₹{overdueAmount}</div>
                                    <button onClick={handleCashPayment} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl mb-3">Confirm Cash</button>
                                    <button onClick={handleCancelScan} className="text-slate-400 font-bold text-sm">Cancel</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent History Section */}
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <FaHistory className="text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Recent Exits</h3>
                    </div>

                    <div className="space-y-3">
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">No recent exits found</div>
                        ) : (
                            history.map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                            <FaCar />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{item.vehicleNumber}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">{format(new Date(item.exitTime), 'hh:mm a')}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-md uppercase">Cleared</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

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
