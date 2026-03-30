"use client";

import Link from "next/link";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Background from "@/components/Background";

export default function Home() {
  return (
    <>
      <Background />
      <div className="relative z-10 min-h-screen flex flex-col bg-[#0c0c0e]">
        {/* Navbar - Kept simple here, actual Navbar.tsx handles the floating one */}
        <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-8 h-20 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">🏛️</div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">The Apollo University</div>
              <div className="text-[10px] text-white/40 font-medium tracking-wide uppercase">AttendAI Smart ERP</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="px-6 py-2.5 rounded-2xl bg-white text-black text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
              Get Started
            </Link>
          </div>
        </nav>

        <Hero />

        <Features />

        {/* Stats Section */}
        <section className="py-24 border-y border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto text-center">
              {[
                { label: "Attendance Records", value: "2M+" },
                { label: "Active Students", value: "50k+" },
                { label: "Verification Speed", value: "<1s" },
                { label: "Proxy Attempts Blocked", value: "100%" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tighter">{stat.value}</div>
                  <div className="text-xs font-semibold text-white/30 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/5 text-center">
          <p className="text-xs text-white/30 tracking-wide font-medium">
            © 2026 The Apollo University · AttendAI Smart ERP · Built for Institutional Excellence
          </p>
        </footer>
      </div>
    </>
  );
}
