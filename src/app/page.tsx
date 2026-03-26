"use client";

import Link from "next/link";
import Background from "@/components/Background";

export default function Home() {
  return (
    <>
      <Background />
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-[28px] h-[60px]" style={{ animation: "att-fup .5s both" }}>
          <div className="flex items-center gap-[8px]">
            <div className="w-[36px] h-[36px] rounded-[11px] bg-gradient-to-br from-[#5EAEFF] via-[#818CF8] to-[#A78BFA] flex items-center justify-center text-[17px] shadow-[0_2px_14px_rgba(94,174,255,0.35)]">🏛️</div>
            <div>
              <div className="text-[13px] font-bold tracking-[-0.3px]">The Apollo University</div>
              <div className="text-[8px] text-white/40 font-['DM_Sans',sans-serif] tracking-[0.5px] -mt-[1px]">AttendAI · Smart Attendance System</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-[6px] text-[11px] font-semibold text-white/60 hover:text-white transition-colors no-underline">
              Sign In
            </Link>
            <Link href="/login" className="px-4 py-[6px] rounded-full bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white text-[11px] font-bold no-underline shadow-[0_4px_16px_rgba(94,174,255,.35)] hover:-translate-y-[1px] active:scale-[0.98] transition-all">
              Get Started →
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-12">
          <div style={{ animation: "att-fup .5s .1s both" }} className="mb-4">
            <span className="inline-flex items-center gap-[5px] text-[10px] font-bold tracking-[0.8px] text-[#5EAEFF] bg-[rgba(94,174,255,.08)] border border-[rgba(94,174,255,.2)] rounded-full px-[12px] py-[4px] font-['DM_Sans',sans-serif]">
              ✨ AI-Powered · Real-Time · Tamper-Proof
            </span>
          </div>

          <h1 style={{ animation: "att-fup .6s .15s both" }} className="text-[clamp(28px,5.5vw,64px)] font-extrabold tracking-[-1.5px] leading-[1.05] max-w-[700px] mb-4">
            Attendance with{" "}
            <span className="bg-gradient-to-r from-[#5EAEFF] via-[#818CF8] to-[#A78BFA] bg-clip-text text-transparent">
              absolute integrity
            </span>
          </h1>

          <p style={{ animation: "att-fup .5s .2s both" }} className="text-[clamp(13px,1.5vw,16px)] text-white/50 max-w-[500px] font-['DM_Sans',sans-serif] leading-[1.6] mb-6">
            QR codes that rotate every 60 seconds. GPS verification. Device fingerprinting. Proxy detection powered by pattern analysis.
          </p>

          <div style={{ animation: "att-fup .5s .25s both" }} className="flex gap-3">
            <Link href="/login" className="px-6 py-[11px] rounded-full bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white text-[12px] font-bold no-underline shadow-[0_6px_24px_rgba(94,174,255,.4)] hover:-translate-y-[1px] hover:shadow-[0_10px_35px_rgba(94,174,255,.5)] active:scale-[0.98] transition-all">
              Launch Dashboard →
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 pb-16">
          <div className="max-w-[900px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-[14px]">
            {[
              { icon: "📱", title: "60-Second QR Rotation", desc: "Dynamic QR codes that regenerate every minute. Share attempts are instantly invalidated." },
              { icon: "🛡️", title: "Multi-Layer Detection", desc: "GPS fencing, device fingerprinting, IP clustering, and timing analysis in real-time." },
              { icon: "🔐", title: "2FA Authentication", desc: "TOTP-based two-factor auth for faculty and admin accounts. Military-grade security." },
            ].map((f, i) => (
              <div key={i} className="att-glass p-[20px]" style={{ animation: `att-fup .5s ${0.3 + i * 0.08}s both` }}>
                <div className="text-[28px] mb-[10px]">{f.icon}</div>
                <h3 className="text-[14px] font-bold mb-[5px]">{f.title}</h3>
                <p className="text-[11px] text-white/40 font-['DM_Sans',sans-serif] leading-[1.5]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/30 font-['DM_Sans',sans-serif]">
            © 2026 The Apollo University · AttendAI Smart Attendance System
          </p>
        </div>
      </div>
    </>
  );
}
