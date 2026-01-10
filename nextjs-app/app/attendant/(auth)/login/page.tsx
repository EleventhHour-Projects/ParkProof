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
    <div className="flex min-h-screen bg-white font-['Manrope',sans-serif]">
      {/* Left Panel - Branding & Illustration */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background elements if needed, or simple color/gradient. Keeping it clean white/gray per design or light brand color */}
        <div className="z-10">
          <h1 className="text-5xl font-bold text-amber-500 mb-2">ParkProof</h1>
          <div className="flex items-center gap-3 text-3xl font-semibold text-black mb-2">
            Attendant Panel <ShieldCheck className="w-8 h-8 text-black" strokeWidth={2.5} />
          </div>
          <p className="text-gray-500 text-lg">Municipal Corporation of Delhi</p>
        </div>

        {/* Illustration Placeholder - Trying to mimic the provided design */}
        <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none select-none">
          {/* Using a placeholder SVG or composition since I don't have the exact asset */}
          <div className="relative w-full max-w-md aspect-square">
            {/*  We can leave this empty or put a generic parking illustration logic if we had one. 
                      For now, I'll put a subtle gradient blob or similar to fill space pleasantly.
                  */}
            <div className="absolute inset-0 bg-blue-50 rounded-3xl transform rotate-3 scale-90 opacity-50"></div>
            <div className="absolute inset-0 bg-amber-50 rounded-3xl transform -rotate-2 scale-95 opacity-50"></div>
            {/* If user provided an image, we could use it. The user uploaded one, but I don't have the URL easily accessible in code unless I upload it to public. 
                     I will leave a commented out Image component for them to fill.
                  */}
            {/* <Image src="/path/to/illustration.png" alt="Admin Login Illustration" layout="fill" objectFit="contain" /> */}
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <div className="w-64 h-64 bg-gradient-to-tr from-blue-100 to-amber-100 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-4xl">🅿️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Logos Placeholder */}
        <div className="z-10 flex gap-6 mt-8 grayscale hover:grayscale-0 transition-all opacity-70">
          {/* Mock logos */}
          <div className="h-10 w-10 bg-contain bg-no-repeat bg-center" style={{ backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg)' }} title="Govt of India"></div>
          <div className="h-10 w-10 bg-contain bg-no-repeat bg-center" style={{ backgroundImage: 'url(https://digitalindia.gov.in/assets/images/logo.png)' }} title="Digital India"></div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50/50">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8">Attendant Login</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-gray-100 rounded-xl border-none outline-none focus:ring-2 focus:ring-amber-200 transition-all font-medium placeholder-gray-400 text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-gray-100 rounded-xl border-none outline-none focus:ring-2 focus:ring-amber-200 transition-all font-medium placeholder-gray-400 text-gray-700 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <button type="button" className="text-xs text-blue-500 hover:text-blue-600 font-medium">
                  Forgot Password? <span className="text-blue-500">Email Us</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AttendantLoginPage;

