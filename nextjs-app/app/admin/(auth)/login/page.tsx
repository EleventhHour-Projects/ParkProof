'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

const AdminLogin = () => {
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
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Login successful');
        router.replace('/admin/dashboard');
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
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-white">

        {/* Header */}
        <div className="z-10 mt-8">
          <h1 className="text-6xl font-bold text-[#FF9F43] mb-2 tracking-tight">ParkProof</h1>
          <div className="flex items-center gap-3 text-3xl font-bold text-black mb-2">
            Admin Panel <ShieldCheck className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
          <p className="text-gray-500 text-lg font-medium">Municipal Corporation of Delhi</p>
        </div>

        {/* Illustration */}
        <div className="relative z-10 flex-1 flex items-center justify-center my-8">
          <div className="relative w-full max-w-lg aspect-auto">
            <Image
              src="/admin-login.png"
              alt="Admin Login Illustration"
              width={600}
              height={400}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Footer Logos */}
        <div className="z-10 flex items-center mb-4">
          <div className="h-32 w-32 relative">
            <Image
              src="/assets/EmblemBlack.svg"
              alt="Emblem of India"
              fill
              className="object-contain"
            />
          </div>
          <div className="h-32 w-64 relative">
            <Image
              src="/assets/DigitalIndiaBlack.svg"
              alt="Digital India"
              fill
              className="object-contain"
            />
          </div>
          <div className="h-24 w-24 relative">
            <Image
              src="/assets/MCD.svg"
              alt="MCD"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-700 mb-8">Admin Login</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  placeholder="Admin ID"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-4 bg-gray-100/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#FF9F43] transition-all font-medium placeholder-gray-500 text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-4 bg-gray-100/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#FF9F43] transition-all font-medium placeholder-gray-500 text-gray-700 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-xs text-blue-600 hover:underline font-medium">
                  Forgot Password? <span className="text-blue-500">Email Us</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-full bg-[#FF9F43] hover:bg-orange-500 text-white font-bold text-lg shadow-lg hover:shadow-orange-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.98] mt-4 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
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

export default AdminLogin;

