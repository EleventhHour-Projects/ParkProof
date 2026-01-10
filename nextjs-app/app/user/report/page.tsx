'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Camera, Plus, X } from 'lucide-react'

export default function ReportPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const paramLotId = searchParams?.get('parkingLotId')

    const [issueType, setIssueType] = useState('OVERPARKING')
    const [description, setDescription] = useState('')
    const [images, setImages] = useState<string[]>([]) // Base64 strings
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Parking Lots Data
    const [parkingLots, setParkingLots] = useState<any[]>([])
    const [selectedLotId, setSelectedLotId] = useState<string>('')
    const [loadingLots, setLoadingLots] = useState(true)

    // Fetch Parking Lots
    useEffect(() => {
        const fetchLots = async () => {
            try {
                const res = await fetch('/api/parking')
                const data = await res.json()
                if (data.success && Array.isArray(data.data)) {
                    setParkingLots(data.data)

                    // Auto-select logic
                    if (paramLotId) {
                        const found = data.data.find((l: any) => l._id === paramLotId)
                        if (found) setSelectedLotId(found._id)
                    } else if (data.data.length > 0) {
                        // Optional: Auto-select the first one if none provided? 
                        // Or keep empty to force user selection. Let's keep empty but maybe set first if user has no preference.
                        // For now, let's leave it empty to prompt user.
                    }
                }
            } catch (e) {
                console.error("Failed to fetch parking lots", e)
                toast.error("Failed to load parking locations")
            } finally {
                setLoadingLots(false)
            }
        }
        fetchLots()
    }, [paramLotId])


    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            if (images.length + e.target.files.length > 3) {
                toast.error("You can only upload up to 3 photos")
                return
            }

            const files = Array.from(e.target.files)
            files.forEach(file => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setImages(prev => [...prev, reader.result as string])
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        try {
            if (!selectedLotId) {
                toast.error("Please select a parking location")
                return
            }

            setIsSubmitting(true)

            const payload = {
                type: issueType,
                description,
                images,
                parkingLotId: selectedLotId
            }

            const res = await fetch('/api/user/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (res.ok) {
                toast.success("Report submitted successfully")
                setTimeout(() => router.back(), 1500)
            } else {
                toast.error(data.message || "Failed to submit report")
            }

        } catch (error) {
            console.error("Submit error", error)
            toast.error("Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    const issueTypes = [
        { id: 'OVERPARKING', label: 'Overparking observed' },
        { id: 'UNAUTHORIZED_PARKING', label: 'Unauthorized parking' },
        { id: 'TICKET_FRAUD', label: 'Fake QR / Invalid ticket' },
        { id: 'OVERCHARGING', label: 'Overcharged for parking' },
        { id: 'OTHER', label: 'Other' },
    ]

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.replace('/login');
        } catch (e) { toast.error("Logout failed") }
    }


    return (
        <div className="min-h-screen bg-[#F4F4F4] font-sans pb-10">

            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-4 shadow-sm sticky top-0 z-40 rounded-b-[2rem]">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="bg-[#FFA640] text-white px-5 py-2 rounded-full text-xs font-bold shadow-md shadow-orange-200"
                    >
                        Logout
                    </button>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Report Parking Issue</h1>

                    {/* Parking Lot Selection */}
                    <div className="mt-4 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                            <MapPin className="w-4 h-4" />
                        </div>

                        {loadingLots ? (
                            <div className="w-full pl-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400">
                                Loading locations...
                            </div>
                        ) : (
                            <select
                                value={selectedLotId}
                                onChange={(e) => setSelectedLotId(e.target.value)}
                                className="w-full pl-9 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-[#FFA640] focus:ring-1 focus:ring-[#FFA640] appearance-none transition-all cursor-pointer hover:bg-slate-100"
                            >
                                <option value="" disabled>Select Parking Location</option>
                                {parkingLots.map(lot => (
                                    <option key={lot._id} value={lot._id}>
                                        {lot.name} {lot.area ? `(${lot.area})` : ''}
                                    </option>
                                ))}
                            </select>
                        )}

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 mt-6 flex flex-col gap-6">

                {/* Issue Type */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-1 mb-4">
                        <h2 className="text-base font-bold text-slate-800">Issue Type</h2>
                        <span className="text-red-500">*</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {issueTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setIssueType(type.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between
                            ${issueType === type.id
                                        ? 'bg-orange-50 border-[#FFA640] text-slate-900 shadow-sm'
                                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}
                        `}
                            >
                                <span className="font-semibold text-sm">{type.label}</span>
                                {issueType === type.id && (
                                    <div className="w-5 h-5 rounded-full bg-[#FFA640] flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <h2 className="text-base font-bold text-slate-800 mb-4">
                        Add Description <span className="text-xs font-normal text-slate-400 ml-1">(optional)</span>
                    </h2>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please describe the issue."
                        className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#FFA640] text-sm text-slate-700 placeholder:text-slate-400 resize-none"
                    />
                </div>

                {/* Photos */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Camera className="w-5 h-5 text-slate-400" />
                        <h2 className="text-base font-bold text-slate-800">
                            Attach Photos <span className="text-xs font-normal text-slate-400 ml-1">(optional)</span>
                        </h2>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">You may attach up to 3 photos as proof</p>

                    <div className="grid grid-cols-3 gap-3">
                        {images.map((img, idx) => (
                            <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                <Image src={img} alt="Preview" fill className="object-cover" />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {images.length < 3 && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-all"
                            >
                                <Plus className="w-8 h-8 opacity-50" />
                            </button>
                        )}

                        {/* Empty placeholders to keep grid nice if just 1 photo uploaded */}
                        {images.length === 0 && (
                            <div className="aspect-square rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-center">
                                <Plus className="w-8 h-8 text-slate-200" />
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-[#FFA640] text-white py-4 rounded-[1.5rem] font-bold text-lg shadow-lg shadow-orange-200 hover:bg-[#ff9922] transition-all active:scale-[0.98] disabled:opacity-70 disabled:grayscale uppercase tracking-wide"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>

            </div>
        </div>
    )
}
