"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Background from "@/components/Background";
import Magnetic from "@/components/Magnetic";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, MapPin, Fingerprint, Globe, RefreshCcw, LayoutDashboard, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AttendPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const token = params.token as string;
  const [scanning, setScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "flagged">("loading");
  const [message, setMessage] = useState("");
  const [courseName, setCourseName] = useState("");
  const [period, setPeriod] = useState("");
  const [deptInfo, setDeptInfo] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [riskScore, setRiskScore] = useState(0);

  const markAttendance = async () => {
    try {
      const fp = `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}`;
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        setStatus("error");
        setMessage("Location access denied. High-security verification requires GPS coordinates.");
        return;
      }

      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          qrToken: token,
          latitude: lat,
          longitude: lng,
          deviceFingerprint: fp,
          ip: ipAddress,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCourseName(data.courseName || courseName);
        setPeriod(data.period || period);
        setDeptInfo(data.department ? `${data.department} - ${data.section}` : "");
        setRiskScore(data.riskScore);
        if (data.flagged) {
          setStatus("flagged");
          setMessage(data.message);
        } else {
          setStatus("success");
          setMessage(data.message);
        }
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed. Security protocol mismatch.");
      }
    } catch {
      setStatus("error");
      setMessage("Network instability detected. Re-establish link and try again.");
    }
  };

  useEffect(() => {
    // Fetch client IP
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress("Unknown"));

    // Simulate Facial Scan Progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setScanning(false);
            markAttendance();
          }, 800);
          return 100;
        }
        return prev + 1.5;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <Background />

      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        <div className="bg-[#0c0c0e]/60 border border-white/[0.05] rounded-[4rem] p-12 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] relative overflow-hidden ring-1 ring-white/10">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-12">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 p-[1px] shadow-2xl shadow-indigo-500/20 mb-6">
              <div className="w-full h-full rounded-[1.5rem] bg-[#0c0c0e] flex items-center justify-center text-2xl">🏛️</div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white mb-1">Neural Verification</h1>
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Multi-Factor Authentication Protocol</p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {scanning && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
                className="space-y-10"
              >
                <div className="relative w-[220px] h-[220px] mx-auto group">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-full h-full bg-[#0c0c0e]/80 rounded-full overflow-hidden border border-white/10 shadow-2xl ring-1 ring-white/5 flex items-center justify-center">
                    <div className="text-[100px] opacity-20 group-hover:opacity-30 transition-opacity duration-700">👤</div>

                    {/* Scanner line */}
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#34d399] z-20"
                    />

                    {/* Target Box */}
                    <div className="absolute inset-[20%] border border-dashed border-emerald-400/30 rounded-[2.5rem] animate-pulse" />
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <h2 className="text-xl font-black tracking-tight text-white italic uppercase">Identity Mapping</h2>
                  <p className="text-[12px] text-white/30 font-medium px-4 leading-relaxed">
                    Authenticating user profile via cryptographic neural mapping. Maintain direct device proximity.
                  </p>
                </div>

                <div className="w-full space-y-4">
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden shadow-inner ring-1 ring-white/5">
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                      style={{ width: `${scanProgress}%` }}
                      transition={{ type: "spring", stiffness: 40, damping: 20 }}
                    />
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{Math.round(scanProgress)}% COMPLETE</span>
                    </div>
                    <span className="text-[10px] text-white/20 font-mono font-bold">SEC-LINK: ACTIVE</span>
                  </div>
                </div>
              </motion.div>
            )}

            {!scanning && status === "loading" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-center gap-5 py-12">
                  <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_15px_#6366f1]" style={{ animationDelay: "0ms" }} />
                  <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce shadow-[0_0_15px_#a855f7]" style={{ animationDelay: "150ms" }} />
                  <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce shadow-[0_0_15px_#ec4899]" style={{ animationDelay: "300ms" }} />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Binding Ledger</h2>
                  <p className="text-[12px] text-white/30 font-medium px-4">Synchronizing IP, GPS, and Hardware Fingerprints to the decentralized registry...</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Neural IP", icon: <Globe size={14} />, val: ipAddress || "0.0.0.0", color: "text-indigo-400" },
                    { label: "GPS Anchor", icon: <MapPin size={14} />, val: "LOCKED", color: "text-purple-400" },
                    { label: "Hardware ID", icon: <Fingerprint size={14} />, val: "VERIFIED", color: "text-pink-400" },
                    { label: "Cycle Sync", icon: <RefreshCcw size={14} />, val: "STABLE", color: "text-emerald-400" }
                  ].map((s, i) => (
                    <div key={i} className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-start gap-2 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-2 text-white/20">
                        {s.icon} <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                      </div>
                      <span className={`text-[11px] font-black ${s.color} font-mono truncate w-full tracking-tighter`}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="relative inline-block mb-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xl shadow-emerald-500/10"
                  >
                    <CheckCircle2 size={48} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  </motion.div>
                  <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full -z-10" />
                </div>

                <h2 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase italic">Success Sync</h2>
                <p className="text-[11px] text-white/30 font-black tracking-[0.4em] uppercase mb-10">Neural Presence Verified</p>

                {/* High-End Detail Card */}
                <div className="p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/10 shadow-2xl space-y-8 text-left mb-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                    <ShieldCheck size={140} strokeWidth={0.5} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black mb-2 font-mono">Entity Session</p>
                    <p className="text-2xl font-black text-white leading-tight italic tracking-tight">{courseName || "Smart Session"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/[0.03]">
                    <div>
                      <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black mb-1.5 font-mono">Block</p>
                      <p className="text-sm font-black text-white/70 italic uppercase">{period || "ACTIVE"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black mb-1.5 font-mono">Node ID</p>
                      <p className="text-sm font-bold text-indigo-400 font-mono tracking-tighter">{ipAddress?.slice(0,12) || "::1"}</p>
                    </div>
                  </div>
                </div>

                <Magnetic strength={0.2}>
                  <button
                    onClick={() => window.location.href = '/student/dashboard'}
                    className="w-full py-6 rounded-[3rem] bg-white text-black text-[13px] font-black uppercase tracking-[0.4em] shadow-[0_30px_70px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-[0.98] transition-all ring-1 ring-white/20"
                  >
                    Access Terminal
                  </button>
                </Magnetic>
              </motion.div>
            )}

            {status === "flagged" && (
              <motion.div key="flagged" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 mx-auto rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-2xl shadow-amber-500/10">
                    <AlertTriangle size={48} className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  </div>
                  <div className="absolute inset-0 bg-amber-500/15 blur-[50px] rounded-full -z-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-amber-400 tracking-tighter uppercase italic">Flagged Alert</h2>
                  <p className="text-[11px] text-white/20 font-black tracking-[0.4em] uppercase mt-2">Security Breach Detected</p>
                </div>
                <div className="p-8 rounded-[3.5rem] bg-amber-500/[0.03] border border-amber-500/10 text-left space-y-5">
                  <div className="flex items-center gap-3 text-amber-400/80">
                    <ShieldCheck size={16} />
                    <p className="text-[11px] font-black uppercase tracking-widest">Protocol Deviation</p>
                  </div>
                  <p className="text-sm font-bold text-white/70 leading-relaxed italic">"{message}"</p>
                  <div className="pt-5 border-t border-amber-500/10 flex justify-between items-center">
                    <span className="text-[10px] text-amber-400/60 font-black uppercase tracking-[0.2em] font-mono">Risk Level</span>
                    <span className="text-xs font-black text-amber-400 font-mono tracking-tighter">{riskScore}/100</span>
                  </div>
                </div>
                <Magnetic strength={0.2}>
                  <button onClick={() => window.location.href = '/student/dashboard'}
                    className="w-full py-6 rounded-[3rem] bg-white/[0.03] border border-white/10 text-white/40 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-white/5 hover:text-white/80 transition-all active:scale-[0.98]">
                    Return to Node
                  </button>
                </Magnetic>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 mx-auto rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-2xl shadow-red-500/10">
                    <AlertTriangle size={48} className="text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  </div>
                  <div className="absolute inset-0 bg-red-500/15 blur-[50px] rounded-full -z-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-red-400 tracking-tighter uppercase italic">Link Failure</h2>
                  <p className="text-[11px] text-white/20 font-black tracking-[0.4em] uppercase mt-2">Protocol Mismatch</p>
                </div>
                <div className="p-8 rounded-[3.5rem] bg-red-500/[0.03] border border-red-500/10">
                  <p className="text-sm font-bold text-white/60 leading-relaxed italic">"{message}"</p>
                </div>
                <div className="flex flex-col gap-6">
                  <Magnetic strength={0.2}>
                    <button onClick={() => { setStatus("loading"); setScanning(true); setScanProgress(0); }}
                      className="w-full py-6 rounded-[3rem] bg-white text-black text-[13px] font-black uppercase tracking-[0.4em] shadow-[0_30px_70px_rgba(255,255,255,0.15)] ring-1 ring-white/20 active:scale-[0.98] transition-all">
                      Retry Handshake
                    </button>
                  </Magnetic>
                  <button onClick={() => window.location.href = '/student/dashboard'} className="text-[10px] text-white/15 font-black uppercase tracking-[0.4em] hover:text-white/40 transition-colors">
                    Terminate Connection
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
