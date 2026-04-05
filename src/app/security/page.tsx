"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans selection:bg-white/20">
      {/* Global Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] h-12 bg-black/80 backdrop-blur-md border-b border-[#333336] flex items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-[1024px] flex items-center justify-between">
          <Link href="/" className="text-white hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2L2 22h20L12 2zm0 4l7.5 15h-15L12 6z"/></svg>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[12px] font-normal tracking-wide text-[#f5f5f7] opacity-80">
            <Link href="/features" className="hover:opacity-100 transition-opacity cursor-pointer">Features</Link>
            <Link href="/security" className="hover:opacity-100 transition-opacity cursor-pointer text-white font-semibold">Security</Link>
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

      <div className="flex-1 pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-[1024px] mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-6">
              Ironclad security.<br/>
              <span className="text-[#86868b]">Zero compromises.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#86868b] font-medium max-w-2xl tracking-tight mb-16">
              Built on advanced encryption protocols, Sentinel velocity tracking, and precise geo-fencing. Your institutional data is locked down.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-[50vh] md:h-[60vh] bg-[#1d1d1f] rounded-[3rem] border border-[#333336] shadow-2xl overflow-hidden relative group"
          >
            <img
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop"
              alt="Cyber Security Server Tech"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-1000"
            />
            <div className="absolute inset-0 bg-black/30" />

            <div className="absolute bottom-12 left-12 right-12 z-10">
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 0.6 }}
                 className="flex flex-col md:flex-row gap-8 justify-between items-end"
               >
                 <div>
                   <h3 className="text-3xl font-semibold text-white tracking-tight mb-2">End-to-End Encryption</h3>
                   <p className="text-[#86868b] text-lg max-w-md font-medium tracking-tight">All internal communication and student presence signals are verified using advanced cryptographic signatures.</p>
                 </div>
                 <div className="px-6 py-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white font-mono text-sm tracking-widest">
                   STATUS: SECURE
                 </div>
               </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
