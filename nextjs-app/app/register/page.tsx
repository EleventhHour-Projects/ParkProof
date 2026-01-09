"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

const RegisterPage = () => {
    const router = useRouter();
    const [mobileNumber, setMobileNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phone: mobileNumber,
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("User registered successfully");
                router.push("/login");
            } else {
                // If user already exists (409) or other error
                if (response.status === 409) {
                    toast.error("User already exists. Redirecting to login...");
                    setTimeout(() => {
                        router.push("/login");
                    }, 2000);
                } else {
                    setError(data.message || "Registration failed. Please try again.");
                    toast.error(data.message || "Registration failed");
                }
            }
        } catch (err) {
            setError("An error occurred. Please try again later.");
            toast.error("An error occurred. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-[#3b82f6] to-[#1e40af] flex flex-col items-center justify-between py-10 px-4 relative overflow-hidden font-sans">
            {/* Background decoration */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[url('https://ui.shadcn.com/placeholder.svg')] bg-cover opacity-10 pointer-events-none" />

            {/* Header Section */}
            <div className="w-full max-w-md flex flex-col items-start z-10 pt-10">
                <h1 className="text-5xl font-extrabold text-orange-400 drop-shadow-md tracking-tight">
                    Park
                    <br />
                    <span className="text-orange-400">Proof</span>
                </h1>
                <p className="text-white mt-2 text-sm font-medium tracking-wide">
                    Where Parking Accountability Begins
                </p>
            </div>

            {/* Register Card */}
            <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl z-10 mt-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-6">User Registration</h2>

                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="relative">
                        <input
                            type="tel"
                            placeholder="Mobile number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="w-full bg-gray-200 text-gray-800 placeholder:text-gray-500 rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-200 text-gray-800 placeholder:text-gray-500 rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all font-medium pr-12"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    <div className="flex justify-end">
                        <Link
                            href="/login"
                            className="text-xs text-blue-900 hover:underline font-medium"
                        >
                            Already a user? Login Here
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-full shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-2",
                            isLoading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin w-5 h-5" />
                                Registering...
                            </span>
                        ) : "Register"}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-10 flex flex-col items-center z-10 text-white text-center">
                {/* Placeholder for logos */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-14 w-13  rounded-full flex items-center justify-center backdrop-blur-sm p-2">
                        <span className="text-[0.6rem] font-bold">
                            <Image
                                src="/assets/Emblem.svg"
                                alt="Digital India Logo"
                                width={120}
                                height={120}
                            />
                        </span>
                    </div>
                    <div className="h-14 w-28  rounded-md flex items-center justify-center backdrop-blur-sm p-2">
                        <span className="text-[0.6rem] font-bold"><Image
                            src="/assets/DigitalIndiaLogo.svg"
                            alt="Digital India Logo"
                            width={120}
                            height={120}
                        /></span>
                    </div>
                </div>
                <p className="text-xs font-medium opacity-90 mt-5">
                    Municipal Corporation of Delhi
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
