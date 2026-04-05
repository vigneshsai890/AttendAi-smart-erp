"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function DocumentationPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-20"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-4">
              Documentation
            </h1>
            <p className="text-xl text-[#86868b] font-medium tracking-tight">
              Everything you need to integrate and deploy AttendAI Pro.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { title: "Getting Started", desc: "Initial setup, domain verification, and institutional onboarding.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { title: "API Reference", desc: "Connect your existing LMS or custom dashboard via secure REST endpoints.", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
              { title: "Authentication", desc: "Implement Single Sign-On (SSO) and Multi-Factor Authentication (MFA).", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
              { title: "Geo-Fencing Setup", desc: "Configure location boundaries, tolerance ranges, and IP locking.", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { title: "Analytics", desc: "Exporting compliance reports, student health metrics, and proxy alerts.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              { title: "Hardware Specs", desc: "Device requirements, supported OS versions, and browser compatibilities.", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }
            ].map((doc, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-8 rounded-[2rem] bg-[#1d1d1f] border border-[#333336] hover:bg-[#252528] transition-colors cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mb-6 text-[#f5f5f7] group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={doc.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#f5f5f7] mb-2">{doc.title}</h3>
                <p className="text-[#86868b] text-sm font-medium leading-relaxed">{doc.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
