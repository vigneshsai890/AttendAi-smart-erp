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

          {/* New Extensive Security Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-[#1d1d1f] p-10 rounded-[2.5rem] border border-[#333336]"
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6 border border-[#333336]">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Device Fingerprinting</h4>
              <p className="text-[#86868b] leading-relaxed font-medium">AttendAI maps unique device IDs directly to student profiles. Once an attendance token is requested, the system locks that identity to the active device, instantly neutralizing multi-account or buddy-login vulnerabilities.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-[#1d1d1f] p-10 rounded-[2.5rem] border border-[#333336]"
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6 border border-[#333336]">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Precision Geo-fencing</h4>
              <p className="text-[#86868b] leading-relaxed font-medium">Coordinate-based boundary verification establishes an invisible perimeter around your classrooms. Our algorithms reject any check-in attempts originating beyond a highly strict 50-meter variance threshold.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-[#1d1d1f] p-10 rounded-[2.5rem] border border-[#333336]"
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6 border border-[#333336]">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Velocity Tracking</h4>
              <p className="text-[#86868b] leading-relaxed font-medium">Real-time Sentinel analysis constantly monitors login speeds, impossible travel gaps, and network proxies. Any irregular or suspicious behavior instantly flags the session and notifies faculty administration.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
