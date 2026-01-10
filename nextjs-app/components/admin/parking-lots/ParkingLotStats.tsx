
import React from 'react';
import { AdminParkingLot } from '@/lib/types/adminParkingLot';
import { MapPin, AlertCircle, PlayCircle, AlertTriangle } from 'lucide-react';

interface ParkingLotStatsProps {
    parkingLot: AdminParkingLot;
    attendantName?: string; // Optional for now as it's not in AdminParkingLot type
    lastUpdated?: string;
}

const ParkingLotStats: React.FC<ParkingLotStatsProps> = ({
    parkingLot,
    attendantName = "Ravi Yadav", // Default/Mock for now
    lastUpdated = "2 min ago"
}) => {
    // Determine Risk Colors based on riskScore
    const getRiskConfig = (score: number) => {
        if (score >= 70) return { dot: 'bg-red-600', text: 'text-black', pill: 'bg-red-50', icon: 'text-red-500', label: 'HIGH' };
        if (score <= 30) return { dot: 'bg-green-600', text: 'text-black', pill: 'bg-green-50', icon: 'text-green-500', label: 'LOW' };
        return { dot: 'bg-yellow-500', text: 'text-black', pill: 'bg-yellow-50', icon: 'text-yellow-500', label: 'MEDIUM' };
    };

    const riskConfig = getRiskConfig(parkingLot.riskScore);

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">{parkingLot.name}</h1>
                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{parkingLot.area || 'Central Delhi'}</span>
                    </div>
                    <span className="hidden sm:inline text-gray-300">•</span>
                    <div className="font-medium text-gray-900">
                        {attendantName}
                    </div>
                    <div className="ml-auto flex items-center gap-4 text-xs">
                        <span>Updated {lastUpdated}</span>
                        <span>Lot ID {parkingLot.pid}</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center">
                {/* Capacity */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 text-gray-500 text-sm font-medium">
                        <PlayCircle className="w-4 h-4 text-orange-400 rotate-90" />
                        <span>Capacity</span>
                    </div>
                    <div className="text-4xl font-light text-gray-900">
                        {parkingLot.capacity}
                    </div>
                </div>

                {/* Occupied */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 text-gray-500 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span>Occupied</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">{parkingLot.occupied}</span>
                        <span className="text-sm text-gray-500">
                            Spots ({parkingLot.occupancyPercent}%)
                        </span>
                    </div>
                </div>

                {/* Risk Level */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 text-gray-500 text-sm font-medium">
                        <AlertTriangle className={`w-4 h-4 ${riskConfig.icon}`} />
                        <span>Risk Level</span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${riskConfig.pill} ${riskConfig.text} text-sm font-medium mt-1`}>
                        <span className={`w-2 h-2 rounded-full ${riskConfig.dot}`}></span>
                        {riskConfig.label}
                    </div>
                </div>

                {/* Spacer/Empty area matching design */}
                <div className="flex-1 hidden lg:block"></div>
            </div>

            {/* Warning Text */}
            {parkingLot.riskLevel === 'HIGH' && (
                <div className="text-red-500 text-sm font-medium">
                    *This parking lot has received frequent concerns, Audit recommended
                </div>
            )}
        </div>
    );
};

export default ParkingLotStats;
