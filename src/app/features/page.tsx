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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-[#1d1d1f] p-10 rounded-[2.5rem] border border-[#333336]"
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6 border border-[#333336]">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Live Roster Sync</h4>
              <p className="text-[#86868b] leading-relaxed font-medium">Instantly synchronize your student roster with existing university databases. Attendance is automatically tallied and pushed to the centralized records without manual data entry.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-[#1d1d1f] p-10 rounded-[2.5rem] border border-[#333336]"
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6 border border-[#333336]">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Smart QR Rotations</h4>
              <p className="text-[#86868b] leading-relaxed font-medium">Dynamic QR codes regenerate every few seconds on the faculty display. Even if a student attempts to photograph or share the code, it expires before a proxy can use it remotely.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-[#1d1d1f] p-10 rounded-[2.5rem] border border-[#333336]"
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6 border border-[#333336]">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-3">Predictive Analytics</h4>
              <p className="text-[#86868b] leading-relaxed font-medium">Identify at-risk students before they fall behind. Machine learning algorithms analyze attendance trends and automatically alert faculty when intervention is recommended.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
