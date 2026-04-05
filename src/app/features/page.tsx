"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans selection:bg-white/20">
      {/* Global Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] h-12 bg-black/80 backdrop-blur-md border-b border-[#333336] flex items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-[1024px] flex items-center justify-between">
          <Link href="/" className="text-white hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2L2 22h20L12 2zm0 4l7.5 15h-15L12 6z"/></svg>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[12px] font-normal tracking-wide text-[#f5f5f7] opacity-80">
            <Link href="/features" className="hover:opacity-100 transition-opacity cursor-pointer text-white font-semibold">Features</Link>
            <Link href="/security" className="hover:opacity-100 transition-opacity cursor-pointer">Security</Link>
            <Link href="/" className="hover:opacity-100 transition-opacity cursor-pointer">Institutions</Link>
            <Link href="/" className="hover:opacity-100 transition-opacity cursor-pointer">AttendAI</Link>
            <Link href="/support" className="hover:opacity-100 transition-opacity cursor-pointer">Support</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[12px] font-normal text-[#f5f5f7] hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="text-[12px] px-3 py-1 rounded-full bg-white text-black font-medium hover:scale-105 active:scale-95 transition-transform duration-300">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-[1024px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              Powerful features.<br/>
              <span className="text-[#86868b]">Effortless control.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#86868b] font-medium max-w-2xl tracking-tight mb-16">
              AttendAI is designed to eliminate proxy attendance completely while providing an incredibly smooth experience for faculty and students alike.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#1d1d1f] rounded-[2.5rem] overflow-hidden border border-[#333336] flex flex-col group relative"
            >
              <div className="p-10 pb-0">
                <h3 className="text-2xl font-semibold text-[#f5f5f7] mb-2">Real-time Dashboard</h3>
                <p className="text-[#86868b] text-lg font-medium">Monitor attendance patterns as they happen.</p>
              </div>
              <div className="h-64 mt-8 w-full relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                  alt="Dashboard Data"
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1f] to-transparent" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#1d1d1f] rounded-[2.5rem] overflow-hidden border border-[#333336] flex flex-col group relative"
            >
              <div className="p-10 pb-0">
                <h3 className="text-2xl font-semibold text-[#f5f5f7] mb-2">Automated Reports</h3>
                <p className="text-[#86868b] text-lg font-medium">Generate compliance-ready data in a single click.</p>
              </div>
              <div className="h-64 mt-8 w-full relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2400&auto=format&fit=crop"
                  alt="Abstract Data flow"
                  className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1f] to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
