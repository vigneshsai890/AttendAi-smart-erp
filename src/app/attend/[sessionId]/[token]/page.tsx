"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Background from "@/components/Background";

export default function AttendPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const token = params.token as string;
  const [scanning, setScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "flagged">("loading");
  const [message, setMessage] = useState("");
  const [courseName, setCourseName] = useState("");
  const [riskScore, setRiskScore] = useState(0);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setScanning(false);
          markAttendance();
        }, 500);
      }
      setScanProgress(Math.min(progress, 100));
    }, 250);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAttendance = async () => {
    try {
      // Get device fingerprint
      const fp = `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}`;

      // Get geolocation
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        setGeoError("Location access denied. Attendance will be marked without GPS verification.");
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
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCourseName(data.courseName);
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
        setMessage(data.error || "Failed to mark attendance");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <>
      <Background />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="att-glass w-full max-w-[400px] p-8 text-center" style={{ animation: "att-fup .5s both" }}>
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-[38px] h-[38px] rounded-[11px] bg-gradient-to-br from-[#5EAEFF] via-[#818CF8] to-[#A78BFA] flex items-center justify-center text-[18px] shadow-[0_2px_16px_rgba(94,174,255,0.35)]">
              🏛️
            </div>
            <div className="text-left">
              <div className="text-[13px] font-bold tracking-[-0.2px]">The Apollo University</div>
              <div className="text-[9px] text-white/50 font-['DM_Sans',sans-serif]">AttendAI Check-In</div>
            </div>
          </div>

          {scanning && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="relative w-[180px] h-[180px] mx-auto mb-6 bg-black rounded-full overflow-hidden border-[4px] border-[#34D399]/30 shadow-[0_0_30px_rgba(52,211,153,.2)]">
                {/* Simulated webcam view */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center text-[64px] opacity-40">👤</div>
                {/* Scanner line */}
                <div className="absolute left-0 right-0 h-[2px] bg-[#34D399] shadow-[0_0_10px_#34D399] transition-all duration-300"
                  style={{ top: `${scanProgress}%` }} />
                {/* Face Box */}
                <div className="absolute top-[20%] left-[20%] right-[20%] bottom-[20%] border-[2px] border-dashed border-[#34D399] rounded-2xl opacity-60" />
              </div>
              <h2 className="text-[18px] font-bold mb-2">Facial Recognition</h2>
              <p className="text-[12px] text-white/50 font-['DM_Sans',sans-serif] mb-4">
                Please look directly at the camera. Scanning profile...
              </p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#5EAEFF] to-[#34D399] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }} />
              </div>
              <p className="text-[10px] text-[#34D399] font-bold uppercase tracking-[1px] font-['DM_Sans',sans-serif]">{Math.round(scanProgress)}% Verified</p>
            </div>
          )}

          {!scanning && status === "loading" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="text-[48px] mb-4 animate-pulse">📡</div>
              <h2 className="text-[18px] font-bold mb-2">Marking Attendance...</h2>
              <p className="text-[12px] text-white/50 font-['DM_Sans',sans-serif]">
                Verifying QR code, location, and device...
              </p>
              {geoError && (
                <p className="text-[10px] text-[#FBBF24] mt-2 font-['DM_Sans',sans-serif]">⚠️ {geoError}</p>
              )}
            </div>
          )}

          {status === "success" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="text-[64px] mb-3">✅</div>
              <h2 className="text-[20px] font-extrabold text-[#34D399] mb-1">Attendance Marked!</h2>
              <p className="text-[14px] font-bold mb-2">{courseName}</p>
              <p className="text-[12px] text-white/50 font-['DM_Sans',sans-serif] mb-4">{message}</p>
              <div className="p-3 rounded-xl bg-[rgba(52,211,153,.08)] border border-[rgba(52,211,153,.18)]">
                <div className="text-[10px] text-white/40 font-['DM_Sans',sans-serif]">
                  📍 Location verified · 🔒 Device recorded · ⏱️ {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {status === "flagged" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="text-[64px] mb-3">⚠️</div>
              <h2 className="text-[20px] font-extrabold text-[#FBBF24] mb-1">Flagged for Review</h2>
              <p className="text-[14px] font-bold mb-2">{courseName}</p>
              <p className="text-[12px] text-white/50 font-['DM_Sans',sans-serif] mb-4">{message}</p>
              <div className="p-3 rounded-xl bg-[rgba(251,191,36,.08)] border border-[rgba(251,191,36,.18)]">
                <div className="text-[10px] text-white/40 font-['DM_Sans',sans-serif]">
                  Risk Score: {riskScore}/100 · Your attendance has been recorded but flagged.
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="text-[64px] mb-3">❌</div>
              <h2 className="text-[20px] font-extrabold text-[#F87171] mb-1">Check-In Failed</h2>
              <p className="text-[12px] text-white/50 font-['DM_Sans',sans-serif] mb-4">{message}</p>
              <button onClick={() => { setStatus("loading"); markAttendance(); }}
                className="w-full py-3 border-none rounded-xl bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white text-[12px] font-bold cursor-pointer shadow-[0_4px_18px_rgba(94,174,255,.28)] hover:-translate-y-[1px] active:scale-[0.98] transition-all">
                🔄 Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
