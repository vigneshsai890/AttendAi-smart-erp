"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import { io, Socket } from "socket.io-client";

interface LiveRecord {
  id: string;
  userId: string;
  name: string;
  rollNumber: string;
  status: string;
  markedAt: string;
  flagged: boolean;
  riskScore: number;
}

interface SessionData {
  sessionId: string;
  qrToken: string;
  qrExpiry: string;
  courseName: string;
}

interface DashboardData {
  faculty: { name: string; email: string; department: string };
  course: { id: string; code: string; name: string };
  stats: { totalStudents: number; avgAttendance: number; atRiskStudents: number; fraudFlagCount: number };
  students: Array<{ name: string; rollNumber: string; present: number; absent: number; percentage: number; flagged: boolean }>;
  fraudFlags: Array<{ studentName: string; rollNumber: string; alertType: string; description: string }>;
  activeSession: { id: string; courseName: string; qrCode: string; qrExpiry: string; room: string; totalStudents: number } | null;
}

export default function FacultyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // QR Session
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrTimer, setQrTimer] = useState(15);
  const [sessionLoading, setSessionLoading] = useState(false);

  // Live attendance
  const [liveRecords, setLiveRecords] = useState<LiveRecord[]>([]);

  const [networkIp, setNetworkIp] = useState("localhost");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { showToast } = useToast();

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/faculty/dashboard");
      if (!res.ok) { setError("Please log in as faculty."); setLoading(false); return; }
      const d: DashboardData = await res.json();
      setData(d);
      if (d.activeSession) {
        setActiveSession({
          sessionId: d.activeSession.id,
          qrToken: d.activeSession.qrCode,
          qrExpiry: d.activeSession.qrExpiry,
          courseName: d.activeSession.courseName,
        });
      }
    } catch { setError("Failed to load dashboard"); }
    setLoading(false);
  }, []);

  const fetchQrImage = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/attendance/session/${sessionId}/qr`);
      if (res.ok) {
        const d = await res.json();
        setQrDataUrl(d.qrDataUrl);
        setQrTimer(15);
      }
    } catch { console.error("Failed to fetch QR image"); }
  }, []);

  const fetchLiveAttendance = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/attendance/live?sessionId=${sessionId}`);
      if (res.ok) {
        const d = await res.json();
        setLiveRecords(d.records || []);
      }
    } catch { console.error("Failed to fetch live attendance"); }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetch("/api/network-ip").then(r => r.json()).then(d => setNetworkIp(d.ip)).catch(() => {});
  }, [fetchDashboard]);

  // Socket.io setup when session becomes active
  useEffect(() => {
    if (!activeSession) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setLiveRecords([]);
      setQrDataUrl("");
      return;
    }

    // Fetch initial QR image and live records
    fetchQrImage(activeSession.sessionId);
    fetchLiveAttendance(activeSession.sessionId);

    // Connect Socket.io
    const socket = io({ path: "/api/socket", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[SOCKET] Connected:", socket.id);
      socket.emit("join:session", activeSession.sessionId);
    });

    // Real-time: new attendance scan
    socket.on("attendance:new", (record: LiveRecord) => {
      console.log("[SOCKET] attendance:new", record.name, record.status);
      setLiveRecords(prev => {
        if (prev.find(r => r.userId === record.userId)) return prev; // dedup
        return [record, ...prev];
      });
      const icon = record.flagged ? "⚠️" : "✅";
      showToast(`${icon} ${record.name} (${record.rollNumber}) — ${record.status}`);
    });

    // Real-time: QR rotated — fetch new image
    socket.on("qr:rotated", ({ sessionId, token, expiresAt }: { sessionId: string; token: string; expiresAt: string }) => {
      console.log("[SOCKET] qr:rotated for session", sessionId);
      setActiveSession(prev => prev ? { ...prev, qrToken: token, qrExpiry: expiresAt } : null);
      fetchQrImage(sessionId);
    });

    socket.on("disconnect", () => console.log("[SOCKET] Disconnected"));

    return () => { socket.disconnect(); };
  }, [activeSession?.sessionId, fetchQrImage, fetchLiveAttendance, showToast]);

  // Countdown timer
  useEffect(() => {
    if (!activeSession) return;
    timerRef.current = setInterval(() => {
      setQrTimer(prev => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSession]);

  const startSession = async () => {
    if (!data?.course?.id) { showToast("❌ No course assigned"); return; }
    setSessionLoading(true);
    try {
      let lat: number | undefined, lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch { /* optional */ }

      const res = await fetch("/api/attendance/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: data.course.id, latitude: lat, longitude: lng }),
      });
      const d = await res.json();
      if (res.ok) {
        setActiveSession(d);
        setQrTimer(15);
        setLiveRecords([]);
        showToast(`✅ Session started — ${d.courseName}`);
      } else { showToast(`❌ ${d.error}`); }
    } catch { showToast("❌ Failed to start session"); }
    setSessionLoading(false);
  };

  const endSession = async () => {
    if (!activeSession) return;
    setSessionLoading(true);
    try {
      const res = await fetch("/api/attendance/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.sessionId }),
      });
      const d = await res.json();
      if (res.ok) {
        showToast(`✅ Session ended — ${d.summary?.present ?? 0} present, ${d.summary?.absent ?? 0} absent`);
        setActiveSession(null);
        setLiveRecords([]);
        setQrDataUrl("");
        fetchDashboard();
      } else { showToast(`❌ ${d.error}`); }
    } catch { showToast("❌ Failed to end session"); }
    setSessionLoading(false);
  };

  const getScanUrl = () => {
    const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
    const port = typeof window !== "undefined" ? window.location.port : "3000";
    const host = typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? window.location.host
      : `${networkIp}:${port}`;
    return `${protocol}//${host}/scan`;
  };

  if (loading) return <><Background /><Navbar /><div className="relative z-10 pt-[80px] flex justify-center"><div className="text-white/50 animate-pulse">Loading...</div></div></>;
  if (error) return <><Background /><Navbar /><div className="relative z-10 pt-[80px] flex justify-center"><div className="att-glass p-8 text-center"><div className="text-[36px] mb-3">🔒</div><p className="text-white/70">{error}</p></div></div></>;

  const students = data?.students || [];
  const fraudFlags = data?.fraudFlags || [];

  return (
    <>
      <Background />
      <Navbar />
      <div className="relative z-10 pt-[60px]">
        <div className="max-w-[1280px] mx-auto px-[26px] py-[30px] pb-12">

          {/* Hero */}
          <div className="att-a1 relative overflow-hidden rounded-[22px] p-[26px_28px] mb-[22px] bg-gradient-to-br from-[rgba(167,139,250,.1)] via-[rgba(129,140,248,.06)] to-[rgba(94,174,255,.05)] border border-[rgba(167,139,250,.18)]">
            <div className="inline-flex items-center gap-[5px] text-[10px] font-bold uppercase tracking-[1.2px] text-[#A78BFA] bg-[rgba(167,139,250,.1)] border border-[rgba(167,139,250,.2)] rounded-full px-[10px] py-[3px] mb-[10px] font-[&apos;DM_Sans&apos;,sans-serif]">
              👨‍🏫 Faculty Dashboard
            </div>
            <h1 className="text-[clamp(20px,3.2vw,30px)] font-extrabold tracking-[-0.8px] leading-[1.1] bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent mb-[6px]">
              Welcome back, {data?.faculty?.name || "Faculty"} 👋
            </h1>
            <p className="text-[13px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif]">
              {data?.course?.name || "—"} ({data?.course?.code || "—"}) · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[13px] mb-[22px]">
            {[
              { label: "TOTAL STUDENTS", value: data?.stats?.totalStudents || 0, sub: "enrolled this semester", color: "#5EAEFF", icon: "🎓" },
              { label: "AVG ATTENDANCE", value: `${data?.stats?.avgAttendance || 0}%`, sub: "across all classes", color: "#818CF8", icon: "📊" },
              { label: "AT RISK", value: data?.stats?.atRiskStudents || 0, sub: "below 75% threshold", color: "#FBBF24", icon: "⚠️" },
              { label: "FRAUD FLAGS", value: data?.stats?.fraudFlagCount || 0, sub: "pending review", color: "#F87171", icon: "🚩" },
            ].map((s, i) => (
              <div key={i} className={`att-glass att-a${i + 2} p-[16px_18px]`}>
                <div className="text-[9px] uppercase tracking-[0.8px] text-white/50 mb-[6px] font-[&apos;DM_Sans&apos;,sans-serif]">{s.label}</div>
                <div className="flex items-end justify-between">
                  <span className="text-[clamp(24px,3vw,32px)] font-extrabold tracking-[-0.8px]" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[22px]">{s.icon}</span>
                </div>
                <div className="text-[10px] text-white/35 font-[&apos;DM_Sans&apos;,sans-serif] mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[18px]">
            {/* Student Table */}
            <div className="att-glass p-[18px] overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-bold flex items-center gap-2">📋 Student Attendance</h2>
                <button
                  onClick={() => window.open(`/api/faculty/reports?courseId=${data?.course?.id}`, "_blank")}
                  className="px-3 py-[6px] text-[10px] font-bold uppercase tracking-[0.5px] rounded-[8px] bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-[#5EAEFF] cursor-pointer"
                >
                  📥 Download CSV
                </button>
              </div>
              <table className="w-full border-collapse">
                <thead><tr>
                  {["Name", "Roll No.", "Present", "Absent", "%", "Status"].map(h => (
                    <th key={h} className="text-[9px] uppercase tracking-[0.8px] text-white/50 p-[8px_11px] text-left border-b border-white/[0.07] font-[&apos;DM_Sans&apos;,sans-serif]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i} className="hover:[&_td]:bg-white/[0.02]">
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-bold">
                        {s.name} {s.flagged && <span title="Proxy flagged" className="ml-1 text-[#F87171]">🚩</span>}
                      </td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-[&apos;DM_Sans&apos;,sans-serif]">{s.rollNumber}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-[&apos;DM_Sans&apos;,sans-serif] text-[#34D399]">{s.present}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-[&apos;DM_Sans&apos;,sans-serif] text-[#F87171]">{s.absent}</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04] font-bold" style={{ color: s.percentage >= 75 ? "#34D399" : "#F87171" }}>{s.percentage}%</td>
                      <td className="p-[10px_11px] text-[11px] border-b border-white/[0.04]">
                        <span className={`px-[7px] py-[2px] rounded-full text-[9px] font-bold ${s.percentage >= 75 ? "bg-[rgba(52,211,153,.11)] text-[#34D399] border border-[rgba(52,211,153,.2)]" : "bg-[rgba(248,113,113,.11)] text-[#F87171] border border-[rgba(248,113,113,.2)]"}`}>
                          {s.percentage >= 75 ? "Safe" : "At Risk"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-white/30 text-[12px]">No student data available</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Right sidebar */}
            <div className="space-y-[14px]">
              {/* QR Session Panel */}
              <div className="att-glass p-[18px]">
                <h2 className="text-[14px] font-bold mb-3 flex items-center gap-2">📱 Live QR Session</h2>

                {!activeSession ? (
                  <div className="text-center">
                    <p className="text-[11px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif] mb-3">
                      Start a session to display a QR code. Students scan <strong>/scan</strong> on their phone. QR rotates every 15 seconds.
                    </p>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] mb-3 text-left">
                      <div className="text-[10px] font-bold text-white/60 font-[&apos;DM_Sans&apos;,sans-serif] mb-1">Course:</div>
                      <div className="text-[12px] font-bold">{data?.course?.code} — {data?.course?.name}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] mb-3 text-left">
                      <div className="text-[10px] font-bold text-white/60 font-[&apos;DM_Sans&apos;,sans-serif] mb-1">Student Scan URL:</div>
                      <div className="text-[11px] font-mono text-[#5EAEFF] break-all">{getScanUrl()}</div>
                    </div>
                    <button onClick={startSession} disabled={sessionLoading}
                      className="w-full py-[11px] border-none rounded-xl bg-gradient-to-br from-[#34D399] to-[#5EAEFF] text-white text-[12px] font-bold cursor-pointer shadow-[0_4px_18px_rgba(52,211,153,.28)] hover:-translate-y-[1px] active:scale-[0.98] transition-all disabled:opacity-50">
                      {sessionLoading ? "Starting..." : "🚀 Start Live Session"}
                    </button>
                  </div>
                ) : (
                  <div className="text-center" style={{ animation: "att-fup .4s both" }}>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#34D399] uppercase tracking-[0.8px] font-[&apos;DM_Sans&apos;,sans-serif]">
                        Live — {activeSession.courseName}
                      </span>
                    </div>

                    {/* Real QR code image from backend */}
                    <div className="inline-block p-3 rounded-2xl bg-white mb-3 shadow-[0_0_30px_rgba(52,211,153,.2)]">
                      {qrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrDataUrl} alt="Live QR Code" className="w-[200px] h-[200px]" />
                      ) : (
                        <div className="w-[200px] h-[200px] flex items-center justify-center text-black/30 text-[12px]">
                          Loading QR...
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="text-[28px] font-extrabold font-mono tracking-[-1px]" style={{ color: qrTimer <= 5 ? "#F87171" : "#5EAEFF" }}>
                        0:{String(qrTimer).padStart(2, "0")}
                      </div>
                      <div className="text-[9px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif]">QR refreshes every 15 seconds</div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="px-3 py-[5px] rounded-full bg-[rgba(52,211,153,.1)] border border-[rgba(52,211,153,.2)] text-[#34D399] text-[10px] font-bold">
                        ✅ {liveRecords.length} present
                      </div>
                    </div>

                    <button onClick={endSession} disabled={sessionLoading}
                      className="w-full py-[11px] border-none rounded-xl bg-gradient-to-br from-[#F87171] to-[#FBBF24] text-white text-[12px] font-bold cursor-pointer shadow-[0_4px_18px_rgba(248,113,113,.28)] hover:-translate-y-[1px] active:scale-[0.98] transition-all disabled:opacity-50">
                      {sessionLoading ? "Ending..." : "⏹ End Session"}
                    </button>
                  </div>
                )}
              </div>

              {/* Live Roll Feed */}
              {liveRecords.length > 0 && (
                <div className="att-glass p-[18px]">
                  <h2 className="text-[14px] font-bold mb-3 flex items-center gap-2">
                    ⚡ Live Check-Ins
                    <span className="ml-auto text-[9px] text-[#34D399] px-[7px] py-[2px] rounded-full bg-[rgba(52,211,153,.1)] border border-[rgba(52,211,153,.2)]">
                      {liveRecords.length} present
                    </span>
                  </h2>
                  <div className="space-y-[6px] max-h-[280px] overflow-y-auto">
                    {liveRecords.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-[8px_10px] rounded-xl bg-white/[0.03] border border-white/[0.06]"
                        style={{ animation: "att-fup .3s both" }}>
                        <div>
                          <div className="text-[11px] font-bold">
                            {r.flagged && <span className="mr-1 text-[#FBBF24]">⚠️</span>}
                            {r.name}
                          </div>
                          <div className="text-[9px] text-white/40 font-[&apos;DM_Sans&apos;,sans-serif]">
                            {r.rollNumber} · {new Date(r.markedAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-[7px] py-[2px] rounded-full ${
                          r.flagged
                            ? "bg-[rgba(251,191,36,.12)] text-[#FBBF24] border border-[rgba(251,191,36,.2)]"
                            : "bg-[rgba(52,211,153,.11)] text-[#34D399] border border-[rgba(52,211,153,.2)]"
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fraud Alerts */}
              {fraudFlags.length > 0 && (
                <div className="att-glass p-[18px]">
                  <h2 className="text-[14px] font-bold mb-3 flex items-center gap-2">🚩 Fraud Alerts</h2>
                  <div className="space-y-[8px]">
                    {fraudFlags.map((a, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[rgba(248,113,113,.06)] border border-[rgba(248,113,113,.15)]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold">{a.studentName}</span>
                          <span className="px-[6px] py-[2px] rounded-full text-[8px] font-bold bg-[rgba(248,113,113,.2)] text-[#F87171]">{a.alertType}</span>
                        </div>
                        <p className="text-[10px] text-white/50 font-[&apos;DM_Sans&apos;,sans-serif]">{a.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
