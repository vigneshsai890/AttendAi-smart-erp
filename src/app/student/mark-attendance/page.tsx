"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, getAuthToken } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldAlert, Loader2, MapPin, Fingerprint, Clock, Check, AlertCircle, XCircle, ShieldCheck, Target } from "lucide-react";
import axios from "axios";

// Haversine distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function MarkAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<{lat: number, lng: number} | null>(null);
  
  const sessionId = searchParams.get("sessionId");
  const token = searchParams.get("token");
  const subjectName = searchParams.get("subject");
  const expStr = searchParams.get("exp");

  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  useEffect(() => {
    if (status === "unauthenticated") {
      const currentPath = encodeURIComponent(window.location.href);
      router.push(`/login?redirect=${currentPath}`);
    }
  }, [status, router]);

  useEffect(() => {
    if (expStr) {
      const expTime = parseInt(expStr, 10);
      if (!isNaN(expTime) && expTime > 0) {
        const updateTimer = () => {
          const now = new Date().getTime();
          const diff = Math.max(0, Math.floor((expTime - now) / 1000));
          setTimeLeft(diff);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [expStr]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoData({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied or error", err)
      );
    }
  }, []);

  const generateFingerprint = async () => {
    const nav = window.navigator;
    const screen = window.screen;
    const str = `${nav.userAgent}|${nav.language}|${screen.width}x${screen.height}|${new Date().getTimezoneOffset()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  // Liveness Check & Impossible Travel State
  const [livenessStatus, setLivenessStatus] = useState<"idle" | "active" | "failed">("idle");
  const [livenessTarget, setLivenessTarget] = useState({ x: 0, y: 0 });

  const initiateAttendance = () => {
    if (!sessionId || !token) {
      setError("Invalid QR code. Missing session data.");
      return;
    }
    
    // Impossible Travel Check
    const lastCheckinStr = localStorage.getItem("attendai_last_checkin");
    if (lastCheckinStr && geoData) {
      try {
        const last = JSON.parse(lastCheckinStr);
        const dist = getDistance(geoData.lat, geoData.lng, last.lat, last.lng);
        const timeDiffMs = new Date().getTime() - last.timestamp;
        
        // If distance > 100 meters and time elapsed < 2 minutes (120000 ms), flag impossible travel
        if (dist > 100 && timeDiffMs < 120000) {
          setError(`Impossible Travel Detected: You moved ${Math.round(dist)}m in ${Math.round(timeDiffMs/1000)}s. Proxy flagged.`);
          return;
        }
      } catch(e) {
        console.warn("Failed to parse last checkin data");
      }
    }

    // Start Liveness Check
    setLivenessTarget({
      x: Math.floor(Math.random() * 200) - 100, // random x between -100 and +100
      y: Math.floor(Math.random() * 100) - 50   // random y between -50 and +50
    });
    setLivenessStatus("active");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (livenessStatus === "active") {
      timer = setTimeout(() => {
        setLivenessStatus("failed");
        setError("Liveness check failed. Are you a bot? Try again.");
      }, 3000); // 3 seconds to click
    }
    return () => clearTimeout(timer);
  }, [livenessStatus]);

  const handleMarkAttendance = async () => {
    setLivenessStatus("idle");
    setLoading(true);
    setError(null);
    
    try {
      const authToken = await getAuthToken();
      const fingerprint = await generateFingerprint();
      
      const payload = {
        sessionId,
        qrToken: token,
        userId: session?.user?.id,
        latitude: geoData?.lat || null,
        longitude: geoData?.lng || null,
        deviceFingerprint: fingerprint
      };

      const res = await axios.post("/api/attendance/mark", payload, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (res.data.success) {
        setSuccess(`Attendance marked for ${subjectName || 'this session'}`);
        // Save current check-in location and time
        if (geoData) {
          localStorage.setItem("attendai_last_checkin", JSON.stringify({
            lat: geoData.lat,
            lng: geoData.lng,
            timestamp: new Date().getTime()
          }));
        }
        setTimeout(() => {
          router.push("/student/dashboard");
        }, 3000);
      } else {
        setError(res.data.error || "Failed to mark attendance");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to communicate with server");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (session?.user?.role === "FACULTY") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Faculty Account</h1>
        <p className="text-zinc-500 mb-8 max-w-sm">You are logged in as Faculty. Only students can mark attendance.</p>
        <button onClick={() => router.push("/faculty/dashboard")} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium">Return to Dashboard</button>
      </div>
    );
  }

  const isExpired = !!(expStr && timeLeft <= 0 && parseInt(expStr) > 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-200 dark:border-zinc-800 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Mark Attendance</h1>
            <p className="text-indigo-100 text-sm font-medium opacity-90">{subjectName || "Class Session"}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold shrink-0">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{session?.user?.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{session?.user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 flex items-center gap-2"><MapPin size={16} /> Location</span>
              <span className={geoData ? "text-emerald-600 font-medium" : "text-amber-500 font-medium"}>
                {geoData ? "Acquired" : "Pending..."}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 flex items-center gap-2"><Fingerprint size={16} /> Device Verification</span>
              <span className="text-emerald-600 font-medium">Ready</span>
            </div>
            {expStr && parseInt(expStr) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 flex items-center gap-2"><Clock size={16} /> QR Expiry</span>
                <span className={isExpired ? "text-red-500 font-bold" : "text-zinc-900 dark:text-white font-medium"}>
                  {isExpired ? "Expired" : `${timeLeft}s remaining`}
                </span>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex gap-2 items-start border border-red-200 dark:border-red-500/20">
                <XCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium flex gap-2 items-start border border-emerald-200 dark:border-emerald-500/20">
                <Check size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={initiateAttendance}
            disabled={loading || !!success || isExpired || livenessStatus === "active"}
            className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] font-bold shadow-lg shadow-zinc-900/20 dark:shadow-white/10 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:scale-100 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Fingerprint size={20} />}
            {loading ? "Verifying..." : success ? "Attendance Verified" : isExpired ? "QR Expired" : "Confirm Attendance"}
          </button>

          <div className="pt-2 text-center">
            <button onClick={() => router.push("/student/dashboard")} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Cancel & Return to Dashboard
            </button>
          </div>
        </div>
      </motion.div>

      {/* Liveness Modal */}
      <AnimatePresence>
        {livenessStatus === "active" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
            >
              <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl relative pointer-events-auto border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                    <Target className="text-indigo-500" />
                    Liveness Check
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">Tap the target before time runs out!</p>
                </div>
                
                {/* 3s Progress Bar */}
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-6">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: 0 }}
                    transition={{ duration: 3, ease: "linear" }}
                    className="h-full bg-indigo-500"
                  />
                </div>

                {/* Target Area */}
                <div className="relative w-full h-48 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                  <motion.button
                    initial={{ x: 0, y: 0 }}
                    animate={{ 
                      x: livenessTarget.x, 
                      y: livenessTarget.y 
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    onClick={handleMarkAttendance}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-90"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-2 border-white/50"
                    />
                    <Fingerprint size={20} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Decorative */}
      <p className="mt-8 text-xs text-zinc-400 font-medium flex items-center gap-1.5 opacity-60">
        <ShieldCheck size={14} /> Secured by AttendAI Neural Anti-Proxy Engine
      </p>
    </div>
  );
}

export default function MarkAttendance() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"><Loader2 className="animate-spin text-zinc-400" /></div>}>
      <MarkAttendanceContent />
    </Suspense>
  );
}
