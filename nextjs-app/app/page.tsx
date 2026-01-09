import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Clock, CreditCard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo Placeholder */}
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-900">
              ParkProof
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-full font-semibold bg-[#FFA640] text-white shadow-lg shadow-orange-200 hover:bg-[#ff9922] transition-all transform hover:scale-105"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-8 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live Parking Updates
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            Where Parking <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-[#1e40af]">
              Accountability Begins
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience the future of parking management with real-time tracking,
            secure digital payments, and transparent verified records for the Municipal Corporation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Transparent Records</h3>
              <p className="text-slate-500 leading-relaxed">
                Every transaction is digitally recorded and verified, ensuring complete accountability and eliminating fraud.
              </p>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 text-orange-600">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time Tracking</h3>
              <p className="text-slate-500 leading-relaxed">
                Monitor parking availability and duration in real-time with our advanced digital entry system.
              </p>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Digital Payments</h3>
              <p className="text-slate-500 leading-relaxed">
                Seamless UPI and card payments integrated directly into the workflow for faster exits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e40af] text-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-6 mb-8 opacity-90">
            <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm p-2">
              {/* Placeholder for Digital India */}
              <Image
                src="/assets/Emblem.svg"
                alt="Emblem"
                width={100}
                height={100}
                className="object-contain"
              />
            </div>
            <div className="h-16 w-32 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm p-2">
              {/* Placeholder for Another Logo */}
              <Image
                src="/assets/DigitalIndiaLogo.svg"
                alt="Digital India"
                width={100}
                height={100}
                className="object-contain"
              />
            </div>
          </div>

          <p className="text-lg font-semibold mb-2">Municipal Corporation of Delhi</p>
          <p className="text-blue-200 text-sm">
            &copy; 2026 ParkProof. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
