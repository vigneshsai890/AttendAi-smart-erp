"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import { io, Socket } from "socket.io-client";

interface LiveRecord {
  id: string; userId: string; name: string; rollNumber: string;
  status: string; markedAt: string; flagged: boolean; riskScore: number;
}
interface SessionData { sessionId: string; qrToken: string; qrExpiry: string; courseName: string; }
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
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrTimer, setQrTimer] = useState(15);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [liveRecords, setLiveRecords] = useState<LiveRecord[]>([]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertResult, setAlertResult] = useState<{ alertsSent: number; alerts: Array<{ name: string; percentage: number }> } | null>(null);
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
        setActiveSession({ sessionId: d.activeSession.id, qrToken: d.activeSession.qrCode, qrExpiry: d.activeSession.qrExpiry, courseName: d.activeSession.courseName });
      }
    } catch { setError("Failed to load dashboard"); }
    setLoading(false);
  }, []);

  const fetchQrImage = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/attendance/session/${sessionId}/qr`);
      if (res.ok) { const d = await res.json(); setQrDataUrl(d.qrDataUrl); setQrTimer(15); }
    } catch { /* */ }
  }, []);

  const fetchLiveAttendance = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/attendance/live?sessionId=${sessionId}`);
      if (res.ok) { const d = await res.json(); setLiveRecords(d.records || []); }
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Socket.io
  useEffect(() => {
    if (!activeSession) { socketRef.current?.disconnect(); socketRef.current = null; setLiveRecords([]); setQrDataUrl(""); return; }
    fetchQrImage(activeSession.sessionId);
    fetchLiveAttendance(activeSession.sessionId);
    const socket = io({ path: "/api/socket", transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => { socket.emit("join:session", activeSession.sessionId); });
    socket.on("attendance:new", (record: LiveRecord) => {
      setLiveRecords(prev => prev.find(r => r.userId === record.userId) ? prev : [record, ...prev]);
      showToast(`${record.flagged ? "⚠️" : "✅"} ${record.name} — ${record.status}`);
    });
    socket.on("qr:rotated", ({ sessionId }: { sessionId: string }) => { fetchQrImage(sessionId); });
    return () => { socket.disconnect(); };
  }, [activeSession?.sessionId, fetchQrImage, fetchLiveAttendance, showToast]);

  // Timer
  useEffect(() => {
    if (!activeSession) return;
    timerRef.current = setInterval(() => setQrTimer(p => p <= 1 ? 15 : p - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSession]);

  const startSession = async () => {
    if (!data?.course?.id) return;
    setSessionLoading(true);
    try {
      let lat: number | undefined, lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch { /* optional */ }
      const res = await fetch("/api/attendance/session/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: data.course.id, latitude: lat, longitude: lng }),
      });
      const d = await res.json();
      if (res.ok) { setActiveSession(d); setQrTimer(15); setLiveRecords([]); showToast("Session started"); }
      else showToast(d.error);
    } catch { showToast("Failed to start session"); }
    setSessionLoading(false);
  };

  const endSession = async () => {
    if (!activeSession) return;
    setSessionLoading(true);
    try {
      const res = await fetch("/api/attendance/session/end", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.sessionId }),
      });
      if (res.ok) { setActiveSession(null); setLiveRecords([]); setQrDataUrl(""); fetchDashboard(); showToast("Session ended"); }
    } catch { showToast("Failed to end session"); }
    setSessionLoading(false);
  };

  const sendAlerts = async () => {
    if (!data?.course?.id) return;
    setAlertLoading(true);
    try {
      const res = await fetch("/api/attendance/alert-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: data.course.id, threshold: 80 }),
      });
      const d = await res.json();
      if (res.ok) {
        setAlertResult(d);
        showToast(d.alertsSent > 0 ? `⚠️ ${d.alertsSent} warning(s) sent` : "✅ All students above 80%");
      } else showToast(d.error);
    } catch { showToast("Failed to send alerts"); }
    setAlertLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="bg-[#0f0f13] border border-white/[0.06] rounded-2xl p-8 text-center max-w-sm"><p className="text-white/60 text-sm">{error}</p></div></div>;

  const students = data?.students || [];
  const fraudFlags = data?.fraudFlags || [];

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-['Inter',sans-serif]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 pt-20 pb-12">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-medium text-violet-400 uppercase tracking-widest mb-1">Faculty Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight">{data?.faculty?.name || "Faculty"}</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {data?.course?.name} ({data?.course?.code}) · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Students", value: data?.stats?.totalStudents || 0, color: "text-blue-400" },
            { label: "Avg Attendance", value: `${data?.stats?.avgAttendance || 0}%`, color: "text-emerald-400" },
            { label: "Below 75%", value: data?.stats?.atRiskStudents || 0, color: "text-amber-400" },
            { label: "Flagged", value: data?.stats?.fraudFlagCount || 0, color: "text-red-400" },
          ].map((s, i) => (
            <div key={i} className="bg-[#0f0f13] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2">{s.label}</p>
              <p className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          {/* Left: Student Table + Alerts */}
          <div className="space-y-5">
            {/* Table */}
            <div className="bg-[#0f0f13] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                <h2 className="text-sm font-semibold">Student Attendance</h2>
                <div className="flex gap-2">
                  <button onClick={sendAlerts} disabled={alertLoading}
                    className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50">
                    {alertLoading ? "Sending..." : "⚠️ Send Warnings (<80%)"}
                  </button>
                  <button onClick={() => window.open(`/api/faculty/reports?courseId=${data?.course?.id}`, "_blank")}
                    className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] transition-all">
                    Export CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      {["Name", "Roll No.", "Present", "Absent", "%", "Status"].map(h => (
                        <th key={h} className="text-[10px] font-medium text-white/35 uppercase tracking-wider px-5 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 text-[13px] font-medium">
                          {s.name}
                          {s.flagged && <span className="ml-1.5 text-[9px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">flagged</span>}
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-white/50 font-mono">{s.rollNumber}</td>
                        <td className="px-5 py-3.5 text-[12px] text-emerald-400 font-medium">{s.present}</td>
                        <td className="px-5 py-3.5 text-[12px] text-red-400 font-medium">{s.absent}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${s.percentage}%`, backgroundColor: s.percentage >= 80 ? "#34d399" : s.percentage >= 75 ? "#fbbf24" : "#f87171" }} />
                            </div>
                            <span className="text-[12px] font-semibold" style={{ color: s.percentage >= 80 ? "#34d399" : s.percentage >= 75 ? "#fbbf24" : "#f87171" }}>
                              {s.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-md ${
                            s.percentage >= 80 ? "bg-emerald-500/10 text-emerald-400" : s.percentage >= 75 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {s.percentage >= 80 ? "Good" : s.percentage >= 75 ? "Warning" : "Critical"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-white/25 text-sm">
                        No attendance data yet. Start a session and have students scan the QR code.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alert results */}
            {alertResult && alertResult.alertsSent > 0 && (
              <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">⚠️ {alertResult.alertsSent} Warning(s) Sent</h3>
                <div className="space-y-2">
                  {alertResult.alerts.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <span className="text-white/70">{a.name}</span>
                      <span className="text-red-400 font-semibold">{a.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fraud Alerts */}
            {fraudFlags.length > 0 && (
              <div className="bg-red-500/[0.04] border border-red-500/15 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-red-400 mb-3">Proxy Alerts</h3>
                <div className="space-y-2">
                  {fraudFlags.map((a, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-xl p-3">
                      <div>
                        <p className="text-[12px] font-medium">{a.studentName}</p>
                        <p className="text-[10px] text-white/40">{a.description}</p>
                      </div>
                      <span className="text-[9px] font-semibold bg-red-500/15 text-red-400 px-2 py-1 rounded-md">{a.alertType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: QR Session */}
          <div className="space-y-4">
            <div className="bg-[#0f0f13] border border-white/[0.06] rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-4">Live Session</h2>

              {!activeSession ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75H16.5v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75H16.5v-.75z" />
                    </svg>
                  </div>
                  <p className="text-[12px] text-white/40 mb-1">{data?.course?.code} — {data?.course?.name}</p>
                  <p className="text-[11px] text-white/25 mb-5">Start a session to display a QR code for students to scan</p>
                  <button onClick={startSession} disabled={sessionLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[13px] font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-violet-600/20">
                    {sessionLoading ? "Starting..." : "Start Live Session"}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  {/* Live indicator */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Live — {activeSession.courseName}
                    </span>
                  </div>

                  {/* QR Code */}
                  <div className="inline-block p-3 rounded-2xl bg-white mb-4">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">Loading...</div>
                    )}
                  </div>

                  {/* Timer */}
                  <div className="mb-4">
                    <p className={`text-3xl font-bold font-mono tracking-tight ${qrTimer <= 5 ? "text-red-400" : "text-white"}`}>
                      0:{String(qrTimer).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] text-white/30 mt-1">Refreshes every 15s</p>
                  </div>

                  {/* Count */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mb-4">
                    ✓ {liveRecords.length} present
                  </div>

                  <button onClick={endSession} disabled={sessionLoading}
                    className="w-full py-3 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 text-[13px] font-semibold hover:bg-red-500/25 active:scale-[0.98] transition-all disabled:opacity-50">
                    {sessionLoading ? "Ending..." : "End Session"}
                  </button>
                </div>
              )}
            </div>

            {/* Live Check-ins */}
            {liveRecords.length > 0 && (
              <div className="bg-[#0f0f13] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  Live Check-Ins
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md">{liveRecords.length}</span>
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {liveRecords.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div>
                        <p className="text-[12px] font-medium">
                          {r.flagged && <span className="text-amber-400 mr-1">⚠</span>}
                          {r.name}
                        </p>
                        <p className="text-[10px] text-white/30">{r.rollNumber} · {new Date(r.markedAt).toLocaleTimeString()}</p>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-1 rounded-md ${
                        r.flagged ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                      }`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
