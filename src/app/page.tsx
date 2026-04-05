"use client";

import Link from "next/link";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Background from "@/components/Background";

export default function Home() {
  return (
    <>
      <Background />
      <div className="relative z-10 flex flex-col bg-black text-white font-sans selection:bg-white/20 overflow-x-hidden">
        {/* Apple-style Global Nav */}
        <nav className="fixed top-0 left-0 right-0 z-[100] h-12 bg-black/80 backdrop-blur-md border-b border-[#333336] flex items-center justify-center px-4 md:px-8">
          <div className="w-full max-w-[1024px] flex items-center justify-between">
            <Link href="/" className="text-white hover:opacity-70 transition-opacity">
              {/* Minimal Abstract Logo */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2L2 22h20L12 2zm0 4l7.5 15h-15L12 6z"/></svg>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-[12px] font-normal tracking-wide text-[#f5f5f7] opacity-80">
              <Link href="/features" className="hover:opacity-100 transition-opacity cursor-pointer">Features</Link>
              <Link href="/security" className="hover:opacity-100 transition-opacity cursor-pointer">Security</Link>
              <Link href="/institutions" className="hover:opacity-100 transition-opacity cursor-pointer">Institutions</Link>
              <Link href="/" className="hover:opacity-100 transition-opacity cursor-pointer text-white font-semibold">AttendAI</Link>
              <Link href="/support" className="hover:opacity-100 transition-opacity cursor-pointer">Support</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[12px] font-normal text-[#f5f5f7] hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-[12px] px-3 py-1 rounded-full bg-white text-black font-medium hover:scale-105 active:scale-95 transition-transform duration-300">
                Sign Up
              </Link>
            </div>
          </div>
        </nav>

        {/* Global Sub-Nav (Local Nav) */}
        <div className="sticky top-12 z-[90] h-14 bg-black/80 backdrop-blur-md border-b border-[#333336] flex items-center justify-center px-4 md:px-8">
          <div className="w-full max-w-[1024px] flex items-center justify-between">
            <span className="text-xl font-semibold tracking-tight text-white">AttendAI Pro</span>
            <div className="flex items-center gap-4 text-xs font-medium">
              <Link href="/" className="hidden sm:block text-[#86868b] hover:text-white cursor-pointer transition-colors">Overview</Link>
              <Link href="/documentation" className="hidden sm:block text-[#86868b] hover:text-white cursor-pointer transition-colors">Documentation</Link>
              <Link href="/signup" className="px-3 py-1 rounded-full bg-[#0071e3] text-white hover:bg-[#0077ED] transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>

        <Hero />
        <Features />

        {/* Cinematic Grid Stats Section */}
        <section className="py-32 bg-black">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[1024px] mx-auto text-center divide-x divide-[#333336]/30">
              {[
                { label: "Attendance Records", value: "2M+" },
                { label: "Active Students", value: "50k+" },
                { label: "Verification Speed", value: "<1s" },
                { label: "Proxy Block Rate", value: "100%" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center px-4">
                  <div className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-2 tracking-tighter">{stat.value}</div>
                  <div className="text-xs font-medium text-[#86868b] uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Apple Footer */}
        <footer className="bg-[#1d1d1f] py-8 border-t border-[#333336]">
          <div className="max-w-[1024px] mx-auto px-4 md:px-8 text-center">
            <p className="text-[11px] text-[#86868b] leading-relaxed font-normal">
              1. AttendAI requires an active institutional license and a compatible device. <br/>
              2. 100% Proxy Block Rate is based on clinical university trials running our Secure protocol. <br/>
              <br/>
              Copyright © 2026 The Apollo University Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
