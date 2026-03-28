"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Background from "@/components/Background";
import { Html5Qrcode } from "html5-qrcode";

interface QRPayload {
  sessionId: string;
  token: string;
  exp: number;
}

export default function StudentScanPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanState, setScanState] = useState<
    "idle" | "scanning" | "submitting" | "success" | "error" | "flagged" | "expired"
  >("idle");
  const [message, setMessage] = useState("");
  const [courseName, setCourseName] = useState("");
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
        () => {} // ignore decode errors (normal during scanning)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    stopScanner();
    setScanState("submitting");

    // Parse QR payload
    let payload: QRPayload;
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
      setGeoError("Location access denied. Attendance will be marked without GPS.");
    }

    // Device fingerprint
    const fp = `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}`;

    console.log(`[SCAN] Submitting attendance: session=${payload.sessionId} token=${payload.token.slice(0, 8)}...`);

    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: payload.sessionId,
          qrToken: payload.token,
          latitude: lat,
          longitude: lng,
          deviceFingerprint: fp,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCourseName(data.courseName);
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
    <>
      <Background />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="att-glass w-full max-w-[420px] p-8 text-center" style={{ animation: "att-fup .5s both" }}>

          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-[38px] h-[38px] rounded-[11px] bg-gradient-to-br from-[#5EAEFF] via-[#818CF8] to-[#A78BFA] flex items-center justify-center text-[18px] shadow-[0_2px_16px_rgba(94,174,255,0.35)]">
              🏛️
            </div>
            <div className="text-left">
              <div className="text-[13px] font-bold tracking-[-0.2px]">The Apollo University</div>
              <div className="text-[9px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif]">AttendAI QR Check-In</div>
            </div>
          </div>

          {/* Camera scanner view — always mounted but hidden once done */}
          <div
            id="qr-reader"
            className={`w-full rounded-2xl overflow-hidden mb-4 ${
              scanState === "scanning" || scanState === "idle" ? "block" : "hidden"
            }`}
          />

          {scanState === "idle" && (
            <div className="text-white/50 text-[12px] animate-pulse font-[&apos;DM_Sans&apos;,sans-serif]">
              Starting camera...
            </div>
          )}

          {scanState === "scanning" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <p className="text-[11px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif] mb-1">
                Point your camera at the QR code displayed in class
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                <span className="text-[9px] text-[#34D399] font-bold uppercase tracking-[0.8px]">Scanning…</span>
              </div>
            </div>
          )}

          {scanState === "submitting" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="text-[48px] mb-3 animate-pulse">📡</div>
              <h2 className="text-[18px] font-bold mb-1">Verifying…</h2>
              <p className="text-[12px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif]">
                Checking QR code, location &amp; device…
              </p>
              {geoError && (
                <p className="text-[10px] text-[#FBBF24] mt-2 font-[&apos;DM_Sans&apos;,sans-serif]">⚠️ {geoError}</p>
              )}
            </div>
          )}

          {scanState === "success" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="text-[64px] mb-3">✅</div>
              <h2 className="text-[20px] font-extrabold text-[#34D399] mb-1">Attendance Marked!</h2>
              <p className="text-[14px] font-bold mb-2">{courseName}</p>
              <p className="text-[12px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif] mb-4">{message}</p>
              <div className="p-3 rounded-xl bg-[rgba(52,211,153,.08)] border border-[rgba(52,211,153,.18)]">
                <div className="text-[10px] text-white/40 font-[&apos;DM_Sans&apos;,sans-serif]">
                  📍 Location verified · 🔒 Device recorded · ⏱️ {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {scanState === "flagged" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="text-[64px] mb-3">⚠️</div>
              <h2 className="text-[20px] font-extrabold text-[#FBBF24] mb-1">Flagged for Review</h2>
              <p className="text-[14px] font-bold mb-2">{courseName}</p>
              <p className="text-[12px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif] mb-4">{message}</p>
              <div className="p-3 rounded-xl bg-[rgba(251,191,36,.08)] border border-[rgba(251,191,36,.18)]">
                <div className="text-[10px] text-white/40 font-[&apos;DM_Sans&apos;,sans-serif]">
                  Risk Score: {riskScore}/100 · Attendance recorded but flagged.
                </div>
              </div>
            </div>
          )}

          {scanState === "expired" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="text-[64px] mb-3">⏰</div>
              <h2 className="text-[20px] font-extrabold text-[#FBBF24] mb-1">QR Code Expired</h2>
              <p className="text-[12px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif] mb-4">{message}</p>
              <button onClick={retry}
                className="w-full py-3 border-none rounded-xl bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white text-[12px] font-bold cursor-pointer shadow-[0_4px_18px_rgba(94,174,255,.28)] hover:-translate-y-[1px] active:scale-[0.98] transition-all">
                🔄 Scan Again
              </button>
            </div>
          )}

          {scanState === "error" && (
            <div style={{ animation: "att-fup .4s both" }}>
              <div className="text-[64px] mb-3">❌</div>
              <h2 className="text-[20px] font-extrabold text-[#F87171] mb-1">Check-In Failed</h2>
              <p className="text-[12px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif] mb-4">{message}</p>
              <button onClick={retry}
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
