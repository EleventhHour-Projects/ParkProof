// app/admin/layout.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Logout failed');
      toast.success('Logged out successfully')
      router.replace('/login');
    } catch (error) {
      toast.error('Logout failed')
    }
  };
  return (
    <div className="min-h-screen bg-white font-['Manrope',sans-serif]">
      {/* NAVBAR (paste your nav JSX here unchanged) */}
      <nav className="border-b border-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="text-xl sm:text-2xl font-light tracking-tight text-amber-600">
              ParkProof
            </div>

            {/* Nav Items */}
            <div className="flex items-center gap-6 sm:gap-10">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`text-xs sm:text-sm font-light tracking-wide transition-all duration-300 cursor-pointer active:scale-95 ${
                  activeTab === 'dashboard'
                    ? 'text-blue-500 font-normal'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('parking')}
                className={`text-xs sm:text-sm font-light tracking-wide transition-all duration-300 cursor-pointer active:scale-95 ${
                  activeTab === 'parking'
                    ? 'text-blue-500 font-normal'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Link href="/admin/parking-lots">Parking Lots</Link>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`text-xs sm:text-sm font-light tracking-wide transition-all duration-300 cursor-pointer active:scale-95 ${
                  activeTab === 'reports'
                    ? 'text-blue-500 font-normal'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Link href="/admin/reports">Reports</Link>
              </button>
            </div>

            {/* Logout Button */}
            <button onClick={handleLogout} className="hidden sm:block bg-amber-500 text-white px-5 py-2 text-xs font-light tracking-wide transition-all duration-300 hover:bg-amber-600 active:scale-95 cursor-pointer">
              Logout
            </button>
          </div>

          {/* Reports indicator */}
          {activeTab === 'reports' && (
            <div className="pb-3 text-xs text-red-500 font-light">
              +27 Reports Today
            </div>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}
