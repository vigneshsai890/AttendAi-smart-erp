"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function SupportPage() {
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
            <Link href="/security" className="hover:opacity-100 transition-opacity cursor-pointer">Security</Link>
            <Link href="/" className="hover:opacity-100 transition-opacity cursor-pointer">Institutions</Link>
            <Link href="/" className="hover:opacity-100 transition-opacity cursor-pointer">AttendAI</Link>
            <Link href="/support" className="hover:opacity-100 transition-opacity cursor-pointer text-white font-semibold">Support</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[12px] font-normal text-[#f5f5f7] hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="text-[12px] px-3 py-1 rounded-full bg-white text-black font-medium hover:scale-105 active:scale-95 transition-transform duration-300">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 pt-32 pb-20 px-6 flex items-center justify-center">
        <div className="max-w-[800px] w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <div className="w-20 h-20 mx-auto bg-[#1d1d1f] rounded-full flex items-center justify-center mb-6">
               <svg className="w-8 h-8 text-[#f5f5f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter mb-4">
              Here to help.
            </h1>
            <p className="text-xl text-[#86868b] font-medium tracking-tight">
              Get support for your institutional deployment or report a security incident.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#1d1d1f] rounded-[3rem] p-10 border border-[#333336] shadow-2xl"
          >
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[#86868b] text-xs font-semibold uppercase tracking-widest ml-2">Name</label>
                  <input type="text" className="w-full px-5 py-4 rounded-2xl bg-black border border-[#333336] text-white focus:border-[#2997ff] outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[#86868b] text-xs font-semibold uppercase tracking-widest ml-2">Institution Email</label>
                  <input type="email" className="w-full px-5 py-4 rounded-2xl bg-black border border-[#333336] text-white focus:border-[#2997ff] outline-none transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[#86868b] text-xs font-semibold uppercase tracking-widest ml-2">How can we help?</label>
                <textarea rows={4} className="w-full px-5 py-4 rounded-2xl bg-black border border-[#333336] text-white focus:border-[#2997ff] outline-none transition-colors resize-none"></textarea>
              </div>
              <button type="button" className="w-full py-4 rounded-full bg-[#f5f5f7] text-black font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform">
                Submit Request
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
