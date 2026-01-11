"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Send, CheckCircle, AlertTriangle, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

export default function ReplyPage() {
    const router = useRouter();
    const params = useParams();
    const queryId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState<any>(null);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchQuery = async () => {
            try {
                setLoading(true);
                // We reuse the existing dashboard logic: fetch all and find the one.
                const res = await fetch("/api/attendant/queries");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                const found = data.find((q: any) => q.id === queryId);
                if (found) {
                    setQuery(found);
                } else {
                    toast.error("Query not found");
                    router.push("/attendant/dashboard");
                }
            } catch (error) {
                toast.error("Error loading query");
            } finally {
                setLoading(false);
            }
        };

        if (queryId) {
            fetchQuery();
        }
    }, [queryId, router]);

    const handleSend = async () => {
        if (!reply.trim()) return;

        try {
            setSending(true);
            let replyImage = "";

            // 1. Upload Image (if selected)
            if (file) {
                const formData = new FormData();
                formData.append("image", file);

                try {
                    const upRes = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                    });
                    if (upRes.ok) {
                        const upData = await upRes.json();
                        // Prepend backend URL if the path is relative and starts with /
                        if (upData.url && upData.url.startsWith('/')) {
                            replyImage = `https://parkproof.onrender.com${upData.url}`;
                        } else {
                            replyImage = upData.url;
                        }
                    } else {
                        toast.error("Image upload failed");
                        setSending(false);
                        return;
                    }
                } catch (e) {
                    console.error("Upload error", e);
                    toast.error("Image upload error");
                    setSending(false);
                    return;
                }
            }

            // 2. Send Reply
            const res = await fetch("/api/attendant/reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: queryId, reply, reply_image: replyImage }),
            });

            if (res.ok) {
                toast.success("Reply sent successfully");
                router.push("/attendant/dashboard");
            } else {
                toast.error("Failed to send reply");
            }
        } catch (error) {
            toast.error("Error sending reply");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!query) return null;

    return (
        <div className="min-h-screen bg-[#F0F2F5] p-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.back()}
                    className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-slate-800">Reply to Query</h1>
            </div>

            <div className="space-y-6">
                {/* Original Query Card */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-slate-700 text-sm">Query Message</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm font-medium leading-relaxed border border-slate-100">
                        {query.query}
                    </div>

                    <div className="flex justify-end mt-3">
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-lg">
                            Sent at {new Date(query.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Reply Section */}
                <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-blue-100 border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">Your Response</label>
                    <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-800 font-medium focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all min-h-[150px] resize-none placeholder:text-slate-400"
                        placeholder="Type your response here..."
                    ></textarea>

                    {/* Image Upload UI */}
                    <div className="mt-4">
                        <input
                            type="file"
                            id="imageUpload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />

                        {!file ? (
                            <label
                                htmlFor="imageUpload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer transition-colors text-sm font-bold"
                            >
                                <Paperclip className="w-4 h-4" />
                                Attach Image
                            </label>
                        ) : (
                            <div className="flex items-center gap-3 bg-blue-50 p-2 pr-4 rounded-xl border border-blue-100 w-fit">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                    <Paperclip className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate">{file.name}</span>
                                    <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="ml-2 p-1 hover:bg-blue-200 rounded-full text-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={sending || !reply.trim()}
                        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg mt-6 flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                    ${sending || !reply.trim() ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-[#2E95FA] hover:bg-blue-600 shadow-blue-200'}
                `}
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Send Reply
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
