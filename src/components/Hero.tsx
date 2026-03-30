"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
              Next-Gen Smart Attendance ERP
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-8"
          >
            Attendance with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              absolute integrity
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg lg:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            QR codes that rotate every 60 seconds. GPS verification. Device fingerprinting. Proxy detection powered by AI pattern analysis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="group relative px-8 py-4 rounded-2xl bg-white text-black font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 group-hover:text-white transition-colors">Launch Dashboard</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:text-white transition-colors group-hover:translate-x-1" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold backdrop-blur-md transition-all hover:bg-white/10 active:scale-95"
            >
              See Security Protocol
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="mt-20 relative max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-transparent pointer-events-none" />
          <div className="aspect-[16/9] bg-[#0c0c0e] rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
             {/* Abstract Dashboard Mockup */}
             <div className="absolute inset-0 flex flex-col gap-4 p-8 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
               <div className="h-12 w-1/3 bg-white/10 rounded-xl" />
               <div className="grid grid-cols-3 gap-4 h-full">
                  <div className="col-span-2 bg-white/5 rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
                    <div className="h-8 w-1/2 bg-white/10 rounded-lg" />
                    <div className="flex-1 bg-white/5 rounded-xl animate-pulse" />
                  </div>
                  <div className="bg-white/5 rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
                    <div className="h-8 w-full bg-white/10 rounded-lg" />
                    <div className="h-32 w-32 rounded-full border-4 border-indigo-500/20 border-t-indigo-500/80 mx-auto animate-spin" />
                  </div>
               </div>
             </div>
             <div className="relative z-10 flex flex-col items-center gap-4 text-center px-10">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                  <Shield className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Military Grade Protection</h3>
                <p className="text-white/40 max-w-sm">Every attendance record is verified through 4 independent security layers in real-time.</p>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />
    </div>
  );
}
