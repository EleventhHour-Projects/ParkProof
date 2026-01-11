'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

const AttendantLoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/attendee/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Login successful');
        router.replace('/attendant/dashboard');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-between py-8 px-6 relative font-['Manrope',sans-serif]">
      {/* Header */}
      <div className="w-full max-w-md z-10 pt-4 text-start sm:text-left pl-3">
        <h1 className="text-5xl font-extrabold text-[#F59E0B] tracking-tight leading-tight">
          Park
          <br />
          Proof
        </h1>
        <h2 className="text-xl font-bold text-gray-800 mt-2">
          Parking Attendant App
        </h2>
        <p className="text-xs text-gray-500 font-medium">
          Verify tickets • Manage parking • Report violations
        </p>
      </div>

      {/* Illustration */}
      <div className="relative w-full max-w-sm aspect-[4/3] my-4">
        <Image
          src="/attendant-login.png"
          alt="Attendant Illustration"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Login Card/Form Section */}
      <div className="w-full max-w-md z-10 mb-8">
        <div className="bg-gray-100 rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-6 pl-1">
            Attendant Login
          </h3>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <input
                type="text"
                name="phone"
                placeholder="Parking Lot Identification Number"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-6 py-4 bg-gray-200/50 rounded-full border-none outline-none focus:ring-2 focus:ring-[#F59E0B] transition-all font-medium placeholder-gray-500 text-gray-800 text-sm"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-4 bg-gray-200/50 rounded-full border-none outline-none focus:ring-2 focus:ring-[#F59E0B] transition-all font-medium placeholder-gray-500 text-gray-800 text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-full bg-[#F59E0B] hover:bg-amber-500 text-white font-bold text-lg shadow-lg hover:shadow-amber-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="z-10 flex flex-col items-center gap-2 pb-4">
        <div className="flex items-center gap-4 opacity-100">
          <Image
            src="/assets/DigitalIndiaBlack.svg"
            alt="Digital India"
            width={120}
            height={80}
            className="object-contain"
          />
        </div>
        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">
          Municipal Corporation of Delhi
        </p>
      </div>
    </div>
  );
};

export default AttendantLoginPage;

