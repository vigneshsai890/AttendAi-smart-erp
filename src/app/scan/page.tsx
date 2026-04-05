"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Background from "@/components/Background";
import { Html5Qrcode } from "html5-qrcode";

interface QRPayload {
  sessionId: string;
  token: string;
  exp: number;
  subject?: string;
  period?: string;
  department?: string;
  section?: string;
}

export default function StudentScanPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanState, setScanState] = useState<
    "idle" | "scanning" | "info" | "submitting" | "success" | "error" | "flagged" | "expired"
  >("idle");
  const [message, setMessage] = useState("");
  const [courseName, setCourseName] = useState("");
  const [qrPayload, setQrPayload] = useState<QRPayload | null>(null);
  const [studentName, setStudentName] = useState("");
  const [regId, setRegId] = useState("");
  const [riskScore, setRiskScore] = useState(0);
  const [geoError, setGeoError] = useState("");

  // Start camera and scanner on mount
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {} // ignore decode errors
      )
      .then(() => setScanState("scanning"))
      .catch((err) => {
        console.error("Camera error:", err);
        setMessage("Camera permission denied. Please allow camera access and reload.");
        setScanState("error");
      });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, []);

  const stopScanner = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    stopScanner();
    
    // Parse QR payload
    let payload: any;
    try {
      payload = JSON.parse(decodedText);
    } catch {
      setMessage("Invalid QR code. Please scan the AttendAI QR.");
      setScanState("error");
      return;
    }

    // Client-side expiry check
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && nowSec > payload.exp) {
      setMessage("This QR code has expired. Please ask the faculty to show the latest code.");
      setScanState("expired");
      return;
    }

    setQrPayload(payload);
    setCourseName(payload.subject || "Unknown Course");
    setScanState("info");
  };

  const submitAttendance = async () => {
    if (!studentName || !regId) {
      setMessage("Please enter your name and registration ID.");
      return;
    }

    setScanState("submitting");

    // Get geolocation
    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      setGeoError("Location access denied.");
    }

    // Device fingerprint
    const fp = `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}`;

    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: qrPayload?.sessionId,
          qrToken: qrPayload?.token,
          latitude: lat,
          longitude: lng,
          deviceFingerprint: fp,
          // Sending extra info for manual audit
          manualName: studentName,
          manualRegId: regId
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCourseName(data.courseName || courseName);
        setRiskScore(data.riskScore);
        setMessage(data.message);
        setScanState(data.flagged ? "flagged" : "success");
      } else {
        setMessage(data.error || "Failed to mark attendance");
        setScanState("error");
      }
    } catch {
      setMessage("Network error. Please try again.");
      setScanState("error");
    }
  };

  const retry = () => {
    setScanState("idle");
    setMessage("");
    setGeoError("");
    // Re-mount scanner by navigating back and forth (simplest in Next.js)
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <Background />

      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="bg-[#0c0c0e]/60 border border-white/[0.05] rounded-[4rem] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden ring-1 ring-white/10">

          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-2xl shadow-indigo-500/20 mb-6">
              <div className="w-full h-full rounded-[1.5rem] bg-[#0c0c0e] flex items-center justify-center text-2xl">🏛️</div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white mb-1">Neural Check-In</h1>
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Biometric Identity Verification</p>
            </div>
          </div>

          {/* Scanner Viewport */}
          <div className="relative group mb-10">
            <div className={`relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 bg-white/[0.02] shadow-inner transition-all duration-700 ${scanState === "scanning" ? "ring-2 ring-indigo-500/20" : ""}`}>
              <div
                id="qr-reader"
                className={`w-full h-full ${
                  scanState === "scanning" || scanState === "idle" ? "block" : "hidden"
                }`}
              />

              {/* Scanning Overlay */}
              {scanState === "scanning" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute inset-0 border-[20px] border-[#0c0c0e] opacity-40" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_20px_rgba(129,140,248,0.8)] animate-att-scan z-20" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
                </div>
              )}

              {/* Status Views */}
              {(scanState === "info" || scanState === "success" || scanState === "flagged" || scanState === "error" || scanState === "expired" || scanState === "submitting") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#0c0c0e]/40 backdrop-blur-md animate-in fade-in zoom-in duration-500 overflow-y-auto">
                  
                  {scanState === "info" && (
                    <div className="w-full flex flex-col space-y-6 animate-in slide-in-from-bottom-10 duration-700">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Signal Captured</p>
                        <h2 className="text-xl font-black text-white italic mb-1">{courseName}</h2>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                          {qrPayload?.department} • {qrPayload?.section} • Period {qrPayload?.period}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Full Name</label>
                          <input 
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">Reg ID / Roll No</label>
                          <input 
                            type="text"
                            value={regId}
                            onChange={(e) => setRegId(e.target.value)}
                            placeholder="e.g. 2024CS001"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-white/10"
                          />
                        </div>
                      </div>

                      <button
                        onClick={submitAttendance}
                        className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white text-[12px] font-black uppercase tracking-[0.3em] shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all"
                      >
                        Transmit Identity
                      </button>
                      
                      {message && <p className="text-[10px] text-red-400 text-center font-bold uppercase">{message}</p>}
                    </div>
                  )}

                  {scanState === "submitting" && (
                    <div className="flex flex-col items-center space-y-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Syncing Ledger</p>
                        <h2 className="text-xl font-black text-white italic">Verifying...</h2>
                      </div>
                    </div>
                  )}

                  {scanState === "success" && (
                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <div className="text-4xl">✅</div>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Access Granted</p>
                        <h2 className="text-2xl font-black text-white italic">{courseName || "Success"}</h2>
                      </div>
                    </div>
                  )}

                  {scanState === "flagged" && (
                    <div className="flex flex-col items-center space-y-6 text-center">
                      <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                        <div className="text-4xl text-amber-500">⚠️</div>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-amber-400 uppercase tracking-[0.3em] mb-2">Review Required</p>
                        <h2 className="text-2xl font-black text-white italic">{courseName || "Flagged"}</h2>
                        <p className="text-[11px] text-white/40 mt-3 font-bold uppercase tracking-tight">{message}</p>
                      </div>
                    </div>
                  )}

                  {(scanState === "error" || scanState === "expired") && (
                    <div className="flex flex-col items-center space-y-6 text-center">
                      <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <div className="text-4xl">❌</div>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-red-400 uppercase tracking-[0.3em] mb-2">Request Failed</p>
                        <h2 className="text-2xl font-black text-white italic">{scanState === "expired" ? "Link Expired" : "Error"}</h2>
                        <p className="text-[11px] text-white/40 mt-3 font-bold uppercase tracking-tight">{message}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Viewport Corner Accents */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-3xl pointer-events-none" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-indigo-500/40 rounded-tr-3xl pointer-events-none" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-indigo-500/40 rounded-bl-3xl pointer-events-none" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-indigo-500/40 rounded-br-3xl pointer-events-none" />
          </div>

          {/* Controls & Feedback */}
          <div className="space-y-8">
            {scanState === "scanning" && (
              <div className="text-center animate-pulse">
                <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.2em] mb-4">Awaiting Signal</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Establishing Link...</span>
                </div>
              </div>
            )}

            {(scanState === "success" || scanState === "flagged" || scanState === "error" || scanState === "expired") && (
              <button
                onClick={retry}
                className="w-full py-6 rounded-[2.5rem] bg-white text-black text-[13px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                Re-Initialize Scanner
              </button>
            )}

            <div className="pt-6 border-t border-white/5">
              <div className="flex justify-between items-center px-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mb-1">Status</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Encryption Active</span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mb-1">Trace</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter font-mono">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes att-scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-att-scan {
          animation: att-scan 3s linear infinite;
        }
      `}} />
    </div>
  );
}
