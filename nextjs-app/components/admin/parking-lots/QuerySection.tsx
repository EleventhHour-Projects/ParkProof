
"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Send, CheckCircle, AlertCircle, History } from 'lucide-react';
import Image from 'next/image';

export interface Query {
    id: string;
    message: string;
    timestamp: Date;
    status: 'ACTIVE' | 'EXPIRED' | 'ANSWERED';
    responseRequired: boolean;
    expiresAt?: Date;
}

interface ActiveQueryProps {
    query: Query;
    onExpire: (query: Query) => void;
}

export const ActiveQuery: React.FC<ActiveQueryProps> = ({ query, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
    if (query.status !== 'ACTIVE' || !query.expiresAt) return;

    const calculateTimeLeft = () => {
        const now = new Date();
        const diff = Math.ceil(
            (query.expiresAt!.getTime() - now.getTime()) / 1000
        );
        return diff > 0 ? diff : 0;
    };

    const tick = () => {
        const diff = calculateTimeLeft();
        if (diff <= 0) {
            onExpire(query);
        } else {
            setTimeLeft(diff);
        }
    };

    // run once immediately
    tick();

    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
}, [query.status, query.expiresAt, onExpire]);


    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!query) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Active Query
                </h3>
                <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-mono font-medium">
                    Expires in: {formatTime(timeLeft)}
                </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-gray-700 text-sm">
                `{query.message}`
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Waiting for response from Ravi Yadav...
            </div>
        </div>
    );
};

interface PastQueriesProps {
    queries: Query[];
}

export const PastQueries: React.FC<PastQueriesProps> = ({ queries }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                Past Queries
            </h3>

            {queries.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No queries exist for this parking lot.
                </div>
            ) : (
                <div className="space-y-4">
                    {queries.map(q => (
                        <div key={q.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-gray-400">
                                    {q.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {q.timestamp.toLocaleDateString()}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.status === 'EXPIRED' ? 'bg-red-50 text-red-600 border border-red-100' :
                                        q.status === 'ANSWERED' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {q.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{q.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const RaiseQueryForm: React.FC<{
    onSend: (msg: string, reqResponse: boolean) => void;
    active: boolean;
}> = ({ onSend, active }) => {
    const [message, setMessage] = useState('');
    const [reqResponse, setReqResponse] = useState(true);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Raise a Query</h2>

            <div className="mb-4">
                <textarea
                    className="w-full text-sm border border-gray-200 rounded-lg p-3 min-h-35 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none placeholder:text-gray-400"
                    placeholder="Provide 4 photos of the parking lot from the specified corners within 10 minutes. Ensure all photos cover the entire area."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={2000}
                    disabled={active}
                ></textarea>
                <div className="text-right text-xs text-gray-400 mt-1">
                    {message.length} / 2000
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
                <input
                    type="checkbox"
                    id="reqResp"
                    checked={reqResponse}
                    onChange={(e) => setReqResponse(e.target.checked)}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    disabled={active}
                />
                <label htmlFor="reqResp" className="text-sm text-gray-600 select-none cursor-pointer">Require Response</label>
            </div>

            <button
                onClick={() => {
                    if (message.trim()) {
                        onSend(message, reqResponse);
                        setMessage('');
                    }
                }}
                disabled={active || !message.trim()}
                className={`w-full py-3 rounded-lg font-medium text-white transition-all ${active || !message.trim() ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-md hover:shadow-lg'
                    }`}
            >
                {active ? 'Query Active...' : 'Send Message'}
            </button>

            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                * Query will be sent in real-time to the on-duty parking attendant <strong className="text-gray-600">Ravi Yadav</strong>. He will have exactly 10 minutes to respond.
            </p>

            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {/* Placeholder Avatar */}
                        <Image src="@/assets/profile-user-attendant.svg" alt="Attendant" className="w-full h-full object-cover" width={40} height={40}/>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">Ravi Yadav</div>
                        <div className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Online
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
