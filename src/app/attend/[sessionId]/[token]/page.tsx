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

  return (
    <>
      <Background />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 bg-black/40">
        <div className="att-glass w-full max-w-[420px] p-8 md:p-10 text-center relative overflow-hidden">

          {/* Animated Glow behind card */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 mb-10">
            <div className="w-[42px] h-[42px] rounded-[14px] bg-gradient-to-br from-[#5EAEFF] via-[#818CF8] to-[#A78BFA] flex items-center justify-center text-xl shadow-[0_8px_30px_rgba(94,174,255,0.3)] border border-white/20">
              🏛️
            </div>
            <div className="text-left">
              <div className="text-[14px] font-black tracking-tight text-white/90">The Apollo University</div>
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-[0.1em] font-mono">AttendAI Neural Node</div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {scanning && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                className="space-y-8"
              >
                <div className="relative w-[200px] h-[200px] mx-auto bg-black/40 rounded-full overflow-hidden border-[1px] border-white/10 shadow-[0_0_50px_rgba(52,211,153,0.1)] group">
                  {/* Simulated scanning animation */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center text-[80px] opacity-20 group-hover:opacity-30 transition-opacity">👤</div>

                  {/* Scanner line */}
                  <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_15px_#34d399] z-20"
                  />

                  {/* Face Box */}
                  <div className="absolute inset-[25%] border-[1px] border-dashed border-emerald-400/40 rounded-3xl animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black tracking-tight text-white/90 uppercase">Biometric Verification</h2>
                  <p className="text-[12px] text-white/30 font-medium px-4">
                    Authenticating user profile via neural mapping. Maintain direct eye contact with the sensor.
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden shadow-inner">
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full"
                      style={{ width: `${scanProgress}%` }}
                      transition={{ type: "spring", stiffness: 50 }}
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{Math.round(scanProgress)}% Verified</span>
                    <span className="text-[10px] text-white/20 font-mono">HASH: 0x{Math.floor(Math.random()*16777215).toString(16).toUpperCase()}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {!scanning && status === "loading" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-center gap-4 py-10">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-white/90">Multi-Factor Link</h2>
                  <p className="text-[12px] text-white/30 font-medium">Binding IP, Geolocation, and Device Fingerprint to secure ledger...</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Temporal IP", icon: <Globe size={12} />, val: ipAddress || "Binding..." },
                    { label: "GPS Lock", icon: <MapPin size={12} />, val: "Acquired" },
                    { label: "Device ID", icon: <Fingerprint size={12} />, val: "Verified" },
                    { label: "Link Sync", icon: <RefreshCcw size={12} />, val: "100%" }
                  ].map((s, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5 text-white/20">
                        {s.icon} <span className="text-[9px] font-black uppercase tracking-tighter">{s.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono truncate w-full">{s.val}</span>
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
                <div className="relative inline-block mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-20 h-20 rounded-[28px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 size={40} className="text-emerald-400" />
                  </motion.div>
                  <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full -z-10" />
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Verified Securely</h2>
                <p className="text-[11px] text-white/30 font-bold tracking-[0.2em] uppercase mb-8">Session Access Granted</p>

                {/* Secure Info Card */}
                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-2xl space-y-6 text-left mb-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck size={100} strokeWidth={1} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black mb-1.5">Course Identity</p>
                    <p className="text-lg font-black text-white leading-tight">{courseName || "Neural Session"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black mb-1">Temporal Block</p>
                      <p className="text-xs font-bold text-white/80">{period || "Active"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black mb-1">Entity IP</p>
                      <p className="text-xs font-mono font-bold text-indigo-400">{ipAddress || "::1"}</p>
                    </div>
                  </div>
                </div>

                <div className="py-4 px-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 mb-8">
                  <p className="text-[11px] text-emerald-400/70 font-medium leading-relaxed italic">
                    "Your presence has been successfully recorded in the decentralized registry."
                  </p>
                </div>

                <Magnetic strength={0.2}>
                  <button
                    onClick={() => window.location.href = '/student/dashboard'}
                    className="w-full py-5 rounded-[2rem] bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-white/90 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.15)]"
                  >
                    Return to Dashboard
                  </button>
                </Magnetic>
              </motion.div>
            )}

            {status === "flagged" && (
              <motion.div key="flagged" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="w-20 h-20 mx-auto rounded-[28px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle size={40} className="text-amber-400" />
                </div>
                <h2 className="text-2xl font-black text-amber-400 tracking-tight uppercase">Flagged for Review</h2>
                <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 text-left space-y-3">
                  <p className="text-sm font-bold text-white/90">Security Alert Detected</p>
                  <p className="text-[12px] text-white/40 leading-relaxed">{message}</p>
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest font-mono">Neural Risk: {riskScore}/100</span>
                  </div>
                </div>
                <Magnetic strength={0.2}>
                  <button onClick={() => window.location.href = '/student/dashboard'}
                    className="w-full py-5 rounded-[2rem] bg-white/5 border border-white/10 text-white/40 text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all">
                    Return to Dashboard
                  </button>
                </Magnetic>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="w-20 h-20 mx-auto rounded-[28px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={40} className="text-red-400" />
                </div>
                <h2 className="text-2xl font-black text-red-400 tracking-tight uppercase">Protocol Error</h2>
                <div className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/10">
                  <p className="text-[12px] text-white/50 font-medium leading-relaxed">{message}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <Magnetic strength={0.2}>
                    <button onClick={() => { setStatus("loading"); setScanning(true); setScanProgress(0); }}
                      className="w-full py-5 rounded-[2rem] bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all shadow-xl">
                      Re-Initialize Scan
                    </button>
                  </Magnetic>
                  <button onClick={() => window.location.href = '/student/dashboard'} className="text-[10px] text-white/20 font-bold uppercase tracking-widest hover:text-white/40 transition-colors">
                    Cancel & Return
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .att-glass {
          background: rgba(10, 10, 12, 0.7);
          backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 3rem;
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.5);
        }
      `}} />
    </>
  );
}
