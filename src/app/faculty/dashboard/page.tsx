"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import Magnetic from "@/components/Magnetic";
import { useToast } from "@/components/Toast";
import TiltCard from "@/components/TiltCard";
import io from "socket.io-client";
import axios from "axios";
import { getAuthToken } from "@/components/AuthProvider";

axios.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Users, ShieldAlert, Activity,
  LayoutDashboard, QrCode, BookOpen, Layers, Clock,
  RefreshCw, AlertCircle, BarChart3, TrendingUp, ShieldCheck
} from "lucide-react";

import { DEPARTMENTS, TIME_PERIODS } from "@/lib/constants";
import { ENV } from "@/lib/env";

interface Subject {
  id: string;
  name: string;
  code?: string;
}

interface Section {
  id: string;
  name: string;
  subjects: Subject[];
}

interface Department {
  id: string;
  name: string;
  sections: Section[];
}

interface StudentRecord {
  _id: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  markedAt: string;
  flagged?: boolean;
  riskScore?: number;
  flags?: string[];
}

interface FraudFlag {
  studentName: string;
  riskScore: number;
  alerts: { description: string }[];
  date: string;
}

interface DashboardData {
  stats: {
    avgAttendance: number;
    totalStudents: number;
    atRiskStudents: number;
    fraudFlagCount: number;
  };
  students: {
    userId: string;
    rollNumber: string;
    name: string;
    percentage: number;
  }[];
  fraudFlags: FraudFlag[];
}

import { useRouter } from "next/navigation";
import { useSession } from "@/components/AuthProvider";

export default function FacultyDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isPending = status === "loading";
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole === "STUDENT" || userRole === "USER") {
        router.push("/student/dashboard");
      }
    }
  }, [session, status, router]);

  // Selection State
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Mouse Tracking for Spotlight Effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.getElementsByClassName("group");
      for (const card of cards as any) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // QR Session
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isWarRoomMode, setIsWarRoomMode] = useState(false);
  const [warRoomLogs, setWarRoomLogs] = useState<{ id: string; type: 'CHECKIN' | 'FLAG' | 'SYSTEM'; message: string; timestamp: string; studentName?: string; riskScore?: number }[]>([]);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [presentStudents, setPresentStudents] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [qrTimer, setQrTimer] = useState(15);

  const socketRef = useRef<any>(null);
  const { showToast } = useToast();

  const addWarRoomLog = useCallback((log: any) => {
    setWarRoomLogs(prev => [log, ...prev].slice(0, 50));
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get("/api/faculty/dashboard");
      if (res.data.stats) {
        setDashboardData(res.data);
      }
    } catch {
      showToast("❌ Failed to load dashboard data");
    }
    setLoading(false);
  }, [showToast]);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!hasFetched.current) {
      fetchDashboard();
      hasFetched.current = true;
    }
    const interval = setInterval(fetchDashboard, 60000);
    return () => {
      clearInterval(interval);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [fetchDashboard]);

  // Handle Socket for real-time updates
  useEffect(() => {
    if (activeSessionId) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || ENV.backendUrl;
      socketRef.current = io(socketUrl);
      socketRef.current.emit("join-session", activeSessionId);

      socketRef.current.on("attendance_marked", (newRecord: StudentRecord) => {
        setPresentStudents(prev => {
          if (prev.find(r => r._id === newRecord._id)) return prev;
          return [newRecord, ...prev];
        });
        
        const studentName = newRecord.user?.name || "Unknown Student";
        if (newRecord.flagged) {
          addWarRoomLog({
            id: Math.random().toString(36).substr(2, 9),
            type: 'FLAG',
            message: `THREAT: ${studentName} flagged with risk score ${newRecord.riskScore}`,
            timestamp: new Date().toLocaleTimeString(),
            studentName,
            riskScore: newRecord.riskScore
          });
        } else {
          addWarRoomLog({
            id: Math.random().toString(36).substr(2, 9),
            type: 'CHECKIN',
            message: `SECURE: ${studentName} identity verified`,
            timestamp: new Date().toLocaleTimeString(),
            studentName
          });
        }

        showToast(`${newRecord.flagged ? '⚠️' : '👤'} ${studentName} checked in`);
      });

      return () => {
        if (socketRef.current) socketRef.current.disconnect();
      };
    }
  }, [activeSessionId, showToast, addWarRoomLog]);

  // Selection State Reset Handlers (Directly in selection setters to avoid useEffect cascades)
  const handleDeptSelect = (dept: Department) => {
    setSelectedDept(dept);
    setSelectedSection(null);
    setSelectedSubject(null);
  };

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    setSelectedSubject(null);
  };

  const rotateQR = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await axios.post("/api/attendance/session/rotate", { sessionId: activeSessionId });
      const res = await axios.get(`/api/attendance/session/${activeSessionId}/qr`);
      if (res.data.qrDataUrl) {
        setQrImageUrl(res.data.qrDataUrl);
        setQrTimer(15);
      }
    } catch {
      showToast("⚠️ QR Rotation Failed");
    }
  }, [activeSessionId, showToast]);

  useEffect(() => {
    if (activeSessionId) {
      const timer = setInterval(() => {
        setQrTimer(prev => {
          if (prev <= 1) {
            rotateQR();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeSessionId, rotateQR]);

  const startSession = async () => {
    if (!selectedDept || !selectedSection || !selectedSubject || !selectedPeriod) return showToast("Complete all selections first");
    setSessionLoading(true);

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        showToast("⚠️ Location access denied. Geo-fencing disabled.");
      }

      const res = await axios.post("/api/attendance/session/create", {
        department: selectedDept.name,
        section: selectedSection.name,
        courseName: selectedSubject.name,
        period: selectedPeriod,
        latitude: lat,
        longitude: lng,
        geoRadius: 100
      });

      if (res.data.success) {
        const sessionId = res.data.session._id;
        setActiveSessionId(sessionId);
        setPresentStudents([]);
        const qrRes = await axios.get(`/api/attendance/session/${sessionId}/qr`);
        setQrImageUrl(qrRes.data.qrDataUrl);
        showToast(`✅ Live Session Started: ${selectedSubject.name}`);
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err.response?.data?.error || "Failed to start session"}`);
    }
    setSessionLoading(false);
  };

  const endSession = async () => {
    if (!activeSessionId) return;
    if (!confirm("Terminate this session and commit records to ledger?")) return;

    setSessionLoading(true);
    try {
      const res = await axios.post("/api/attendance/session/end", { sessionId: activeSessionId });
      if (res.data.success) {
        showToast(`✅ Session ended. Present: ${res.data.summary.present}`);
        setActiveSessionId(null);
        setQrImageUrl("");
        fetchDashboard();
      }
    } catch {
      showToast("❌ Failed to end session");
    }
    setSessionLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-white/20 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 relative overflow-hidden">
      {/* Vengance UI Glows */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 inset-x-0 h-[500px] bg-gradient-to-t from-emerald-500/10 via-teal-500/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      <Navbar />

      <main className="relative z-10 pt-28 pb-20 max-w-[1400px] mx-auto px-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4 text-[10px] font-black text-white/50 uppercase tracking-widest">
              <LayoutDashboard size={12} className="text-indigo-400" /> Faculty Neural Command
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
              {session?.user?.name ? (
                <>Welcome, <span className="text-indigo-400">Prof. {session.user.name.split(' ')[0]}</span></>
              ) : (
                <>Attendance <span className="text-white/20">System</span></>
              )}
            </h1>
          </motion.div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {[
              { id: "dept", label: "Department", icon: <Layers size={14} />, current: selectedDept?.name || "Select Dept", disabled: !!activeSessionId, items: DEPARTMENTS, onSelect: handleDeptSelect },
              { id: "sect", label: "Section", icon: <Users size={14} />, current: selectedSection?.name || "Section", disabled: !!activeSessionId || !selectedDept, items: selectedDept?.sections || [], onSelect: handleSectionSelect },
              { id: "subj", label: "Subject", icon: <BookOpen size={14} />, current: selectedSubject?.name || "Subject", disabled: !!activeSessionId || !selectedSection, items: selectedSection?.subjects || [], onSelect: setSelectedSubject },
              { id: "period", label: "Period", icon: <Clock size={14} />, current: selectedPeriod || "Select Time", disabled: !!activeSessionId, items: TIME_PERIODS.map(p => ({ id: p, name: p })), onSelect: (p: { name: string }) => setSelectedPeriod(p.name) }
            ].map((dropdown) => (
              <div key={dropdown.id} className="relative w-full md:w-auto min-w-[160px]">
                <label className="text-[10px] text-white/30 font-bold ml-1 mb-2 block uppercase tracking-widest font-mono">{dropdown.label}</label>
                <button
                  onClick={() => !dropdown.disabled && setActiveDropdown(activeDropdown === dropdown.id ? null : dropdown.id)}
                  disabled={dropdown.disabled}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border ${dropdown.disabled ? "border-white/5 bg-white/2 opacity-40" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"} backdrop-blur-3xl transition-all active:scale-[0.98] group`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-white/40 group-hover:text-indigo-400 transition-colors">{dropdown.icon}</span>
                    <span className="text-sm font-semibold truncate text-white/80">{dropdown.current}</span>
                  </div>
                  <ChevronDown size={14} className={`text-white/20 transition-transform duration-500 ${activeDropdown === dropdown.id ? "rotate-180 text-white" : ""}`} />
                </button>

                <AnimatePresence>
                  {activeDropdown === dropdown.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="absolute top-full left-0 right-0 mt-3 p-2 rounded-[2rem] border border-white/10 bg-[#0c0c0e]/95 backdrop-blur-3xl z-[100] shadow-2xl max-h-[300px] overflow-y-auto custom-scrollbar"
                    >
                      {dropdown.items.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => { dropdown.onSelect(item); setActiveDropdown(null); }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-xs text-left group"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white/70 group-hover:text-white transition-colors">{item.name}</span>
                            {item.code && <span className="text-[9px] text-white/20 font-mono tracking-tighter uppercase">{item.code}</span>}
                          </div>
                          {(dropdown.current === item.name) && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary Section */}
        {dashboardData && (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          >
            {[
              { label: "Avg Attendance", value: `${dashboardData.stats.avgAttendance}%`, sub: "Neural Yield", icon: <TrendingUp size={16}/>, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/10", glow: "rgba(16,185,129,0.15)" },
              { label: "Total Students", value: dashboardData.stats.totalStudents, sub: "Linked Entities", icon: <Users size={16}/>, color: "text-white", bg: "bg-white/5", border: "border-white/10", glow: "rgba(255,255,255,0.05)" },
              { label: "At-Risk Entities", value: dashboardData.stats.atRiskStudents, sub: "Threshold Alert", icon: <ShieldAlert size={16}/>, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/10", glow: "rgba(239,68,68,0.15)" },
              { label: "Neural Flags", value: dashboardData.stats.fraudFlagCount, sub: "Proxy Detected", icon: <AlertCircle size={16}/>, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/10", glow: "rgba(245,158,11,0.15)" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
              >
                <TiltCard
                  glowColor={stat.glow}
                  className="rounded-[3rem]"
                >
                  <div className={`p-10 rounded-[3rem] border ${stat.border} ${stat.bg} backdrop-blur-3xl shadow-2xl relative overflow-hidden h-full group`}>
                    <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/20 transition-all duration-700 relative z-10 group-hover:scale-125 group-hover:rotate-12">
                      {stat.icon}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mb-4 font-mono relative z-10">{stat.label}</p>
                    <div className="flex items-baseline gap-2 relative z-10">
                      <span className={`text-5xl font-black tracking-tighter ${stat.color} italic drop-shadow-2xl`}>{stat.value}</span>
                      <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">{stat.sub}</span>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Attendance Table: Neural Feed */}
          <div className="lg:col-span-8">
            <TiltCard glowColor="rgba(255,255,255,0.03)" className="rounded-[4rem]">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-1 rounded-[4rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-2xl relative overflow-hidden h-full"
              >
                <div className="p-10 pb-6 flex items-center justify-between relative z-10">
                  <div>
                    <h2 className="text-2xl font-black flex items-center gap-4 tracking-tight uppercase italic">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shadow-[0_0_15px_#10b981]" />
                      Neural Feed
                    </h2>
                    <p className="text-[11px] text-white/20 font-black uppercase tracking-[0.4em] mt-2 font-mono">Real-time Biometric Link State</p>
                  </div>
                  <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black font-mono text-white/50 uppercase tracking-widest ring-1 ring-white/5">
                    {presentStudents.length} SYNCED
                  </div>
                </div>

                <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar relative z-10">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0c0c0e]/80 backdrop-blur-md z-20">
                      <tr>
                        <th className="px-6 pb-8 text-[11px] font-black text-white/20 uppercase tracking-[0.3em] font-mono">Entity Identity</th>
                        <th className="px-6 pb-8 text-[11px] font-black text-white/20 uppercase tracking-[0.3em] font-mono">Temporal Mark</th>
                        <th className="px-6 pb-8 text-[11px] font-black text-white/20 uppercase tracking-[0.3em] font-mono text-right">Ledger Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      <AnimatePresence mode="popLayout">
                        {presentStudents.map((record: StudentRecord) => (
                          <motion.tr
                            layout
                            initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={record._id}
                            className="group/row hover:bg-white/[0.03] transition-colors"
                          >
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-sm font-black text-white italic border border-white/5 shadow-lg group-hover/row:scale-110 transition-transform duration-500 relative overflow-hidden">
                                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                  <span className="relative z-10">{record.user?.name?.charAt(0) || "S"}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-base font-black text-white/80 group-hover/row:text-white transition-colors italic">{record.user?.name || "Student Entity"}</span>
                                  <span className="text-[10px] text-white/20 font-mono font-bold tracking-tighter uppercase">ID-TRACE: {record._id.slice(-12).toUpperCase()}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-sm text-white/30 font-mono font-bold">
                              {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="px-6 py-6 text-right">
                              {record.flagged ? (
                                <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-red-500/5 text-red-400 border border-red-500/10 text-[10px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(239,68,68,0.1)] ring-1 ring-red-500/10 overflow-hidden relative">
                                  <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 1, repeat: Infinity }} className="absolute inset-0 bg-red-500/20" />
                                  <ShieldAlert size={14} className="relative z-10" /> <span className="relative z-10">PROXY_ALERT</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 text-[10px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/10">
                                  <ShieldCheck size={14} className="text-emerald-500" /> SECURE_LINK
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>

                  {presentStudents.length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center text-white/10 space-y-6">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                        <Activity size={48} strokeWidth={1} />
                      </motion.div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] italic">Awaiting Neural Uplink...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </TiltCard>
          </div>

          {/* Right Panel: QR Engine */}
          <div className="lg:col-span-4 space-y-8">
            <TiltCard glowColor="rgba(99,102,241,0.1)" className="rounded-[4rem]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-10 rounded-[4rem] border border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-2xl flex flex-col items-center relative overflow-hidden h-full"
              >
                <div className="w-full flex items-center justify-between mb-12 relative z-10">
                  <h2 className="text-xl font-black flex items-center gap-4 tracking-tighter uppercase italic">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg group-hover:scale-110 transition-transform duration-500">
                      {isWarRoomMode ? <ShieldAlert className="text-red-400 w-5 h-5 animate-pulse" /> : <QrCode className="text-indigo-400 w-5 h-5" />}
                    </div>
                    {isWarRoomMode ? "Sentinel Dashboard" : "Encryption"}
                  </h2>
                  {activeSessionId && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsWarRoomMode(!isWarRoomMode)}
                        className={`text-[9px] px-3 py-1.5 rounded-full border transition-all font-black uppercase tracking-widest ${isWarRoomMode ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
                      >
                        {isWarRoomMode ? "Standard View" : "War Room Mode"}
                      </button>
                      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-400 tracking-tighter uppercase shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-1 ring-red-500/10">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" /> Live Sync
                      </div>
                    </div>
                  )}
                </div>

              {!activeSessionId ? (
                <div className="w-full flex flex-col items-center text-center space-y-12 py-12 relative z-10">
                  <div className="w-48 h-48 rounded-[4rem] border border-white/[0.05] bg-white/[0.02] flex items-center justify-center shadow-inner group relative ring-1 ring-white/10">
                    <div className="absolute inset-0 bg-indigo-500/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <QrCode size={80} className="text-white/5 group-hover:text-indigo-400/40 transition-all duration-700 group-hover:scale-110" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-white/80 tracking-widest uppercase italic">Neural Link Ready</h3>
                    <p className="text-[12px] text-white/30 leading-relaxed font-bold uppercase tracking-tight max-w-[240px]">
                      Cryptographic rotation activates upon session start. Location and device fingerprinting enforced.
                    </p>
                  </div>

                  <Magnetic strength={0.2}>
                    <button
                      onClick={startSession}
                      disabled={sessionLoading || !selectedSubject}
                      className="w-full min-w-[280px] py-6 rounded-[3rem] bg-white text-black text-[13px] font-black uppercase tracking-[0.4em] hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_30px_70px_rgba(255,255,255,0.15)] ring-1 ring-white/20"
                    >
                      {sessionLoading ? "Initializing Terminal..." : "Initialize Link"}
                    </button>
                  </Magnetic>
                </div>
              ) : isWarRoomMode ? (
                <div className="w-full flex flex-col space-y-8 relative z-10 h-full">
                  {/* Neural Feed Monitor */}
                  <div className="w-full rounded-[3rem] border border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden flex flex-col h-[500px] shadow-2xl ring-1 ring-white/10">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Sentinel Activity Log</span>
                      </div>
                      <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Buffer: 50 Nodes</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      <AnimatePresence initial={false}>
                        {warRoomLogs.length > 0 ? warRoomLogs.map((log) => (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`p-5 rounded-[2rem] border transition-all ${
                              log.type === 'FLAG' 
                                ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]' 
                                : 'bg-white/[0.02] border-white/5'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                                log.type === 'FLAG' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {log.type}
                              </span>
                              <span className="text-[9px] font-mono text-white/20 uppercase">{log.timestamp}</span>
                            </div>
                            <p className={`text-[11px] font-bold tracking-tight leading-relaxed ${
                              log.type === 'FLAG' ? 'text-red-200/80' : 'text-white/60'
                            }`}>
                              {log.message}
                            </p>
                            {log.riskScore && (
                              <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${log.riskScore}%` }}
                                  className="h-full bg-red-500"
                                />
                              </div>
                            )}
                          </motion.div>
                        )) : (
                          <div className="h-full flex flex-col items-center justify-center space-y-6 text-white/10">
                            <RefreshCw className="w-10 h-10 animate-spin opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Scanning Neural Frequencies...</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="p-6 bg-white/[0.01] border-t border-white/5 grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Integrity</span>
                        <span className="text-xl font-black text-white italic">99.9%</span>
                      </div>
                      <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Trace Latency</span>
                        <span className="text-xl font-black text-emerald-400 italic">&lt;15ms</span>
                      </div>
                    </div>

                    <div className="px-6 pb-6">
                      <button 
                        onClick={() => {
                          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ENV.backendUrl;
                          window.open(`${backendUrl}/api/admin/audit-export`, '_blank');
                        }}
                        className="w-full py-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-3"
                      >
                        <BarChart3 size={14} /> Export Audit Log (Excel)
                      </button>
                    </div>
                  </div>

                  <Magnetic strength={0.2}>
                    <button
                      onClick={endSession}
                      className="w-full py-6 rounded-[3rem] bg-red-500 text-white text-[13px] font-black uppercase tracking-[0.4em] hover:bg-red-600 active:scale-[0.98] transition-all shadow-[0_30px_70px_rgba(239,68,68,0.2)] ring-1 ring-red-500/20"
                    >
                      Terminate Link
                    </button>
                  </Magnetic>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center space-y-12 relative z-10">
                <div className="p-8 bg-white rounded-[4rem] shadow-[0_0_150px_rgba(255,255,255,0.15)] relative overflow-hidden group ring-1 ring-white/20">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1500ms] z-20" />
                  
                  {/* Scanning Beam Animation */}
                  {activeSessionId && (
                    <motion.div 
                      initial={{ top: "-10%" }}
                      animate={{ top: "110%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1 bg-indigo-500/30 blur-[2px] z-30 shadow-[0_0_15px_#6366f1]"
                    />
                  )}

                  {qrImageUrl ? (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      key={qrImageUrl}
                      src={qrImageUrl}
                      alt="Dynamic QR"
                      className="w-[300px] h-[300px] rounded-[2.5rem] relative z-10"
                    />
                  ) : (
                    <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-50 rounded-[2.5rem]">
                      <RefreshCw className="w-12 h-12 text-gray-200 animate-spin" />
                    </div>
                  )}
                </div>

                  <div className="w-full flex flex-col items-center space-y-5 px-6">
                    <div className="flex justify-between w-full text-[11px] font-black font-mono tracking-[0.4em] text-white/30 uppercase">
                      <span>Neural Cycle</span>
                      <span className={qrTimer <= 5 ? "text-red-400" : "text-emerald-400 font-black animate-pulse"}>00:{String(qrTimer).padStart(2, "0")}</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                        initial={{ width: "100%" }}
                        animate={{ width: `${(qrTimer / 15) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                  </div>

                  <Magnetic strength={0.2}>
                    <button
                      onClick={endSession}
                      disabled={sessionLoading}
                      className="w-full min-w-[280px] py-6 rounded-[3rem] bg-red-500/5 border border-red-500/20 text-red-400 text-[13px] font-black uppercase tracking-[0.4em] hover:bg-red-500/10 active:scale-[0.98] transition-all ring-1 ring-red-500/10 shadow-2xl shadow-red-500/5"
                    >
                      {sessionLoading ? "De-coupling..." : "Terminate Link"}
                    </button>
                  </Magnetic>
                </div>
              )}
            </motion.div>
          </TiltCard>

          {/* Teacher Analytics Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-8 rounded-[3rem] border border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-2xl space-y-8"
            >
              <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                <BarChart3 size={14} className="text-indigo-400" /> Neural Analytics
              </h3>

              <div className="space-y-6">
                {/* Visual Analytics Example */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">Engagement Yield</span>
                    <span className="text-xs font-black text-emerald-400">92%</span>
                  </div>
                  <div className="flex gap-1 h-12 items-end">
                    {[40, 70, 45, 90, 65, 80, 55, 95, 30, 85, 60, 75].map((h, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, type: "spring" }}
                        className="flex-1 bg-gradient-to-t from-indigo-500/20 to-indigo-400/60 rounded-t-sm"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  {[
                    { label: "IP Clustering", status: "Active", color: "text-emerald-400" },
                    { label: "Temporal Lag", status: "0.2ms", color: "text-indigo-400" },
                    { label: "Proxy Resistance", status: "Ultra-High", color: "text-purple-400" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">{item.label}</span>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${item.color}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Extended Teacher Analytics Section */}
        {dashboardData && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Student Engagement Matrix */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-8 p-12 rounded-[4rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                   style={{ background: `radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.02), transparent 40%)` }} />

              <h2 className="text-2xl font-black mb-10 flex items-center gap-4 tracking-tight uppercase italic relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Users className="text-indigo-400 w-5 h-5" />
                </div>
                Engagement Matrix
              </h2>
              <div className="overflow-auto pr-4 custom-scrollbar max-h-[500px] relative z-10">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#0c0c0e]/80 backdrop-blur-md z-20">
                    <tr>
                      <th className="pb-8 text-[11px] font-black text-white/20 uppercase tracking-[0.3em] font-mono">Roll Number</th>
                      <th className="pb-8 text-[11px] font-black text-white/20 uppercase tracking-[0.3em] font-mono">Entity Name</th>
                      <th className="pb-8 text-[11px] font-black text-white/20 uppercase tracking-[0.3em] font-mono text-right">Yield Yield</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {dashboardData.students.map((student, idx: number) => (
                      <motion.tr 
                        key={student.userId} 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="group/row hover:bg-white/[0.03] transition-all"
                      >
                        <td className="py-6 text-xs font-black font-mono text-white/20 group-hover/row:text-indigo-400/60 transition-colors uppercase">{student.rollNumber}</td>
                        <td className="py-6 text-base font-black text-white/70 group-hover/row:text-white transition-colors italic">{student.name}</td>
                        <td className="py-6 text-right">
                          <div className="flex items-center justify-end gap-6">
                            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden hidden md:block ring-1 ring-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${student.percentage}%` }}
                                className={`h-full rounded-full ${student.percentage >= 75 ? "bg-emerald-500/40" : "bg-red-500/40"} shadow-[0_0_10px_rgba(255,255,255,0.05)]`}
                              />
                            </div>
                            <span className={`text-lg font-black italic tracking-tighter ${student.percentage >= 75 ? "text-emerald-400" : "text-red-400"}`}>
                              {student.percentage}%
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Neural Security Logs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-4 p-12 rounded-[4rem] border border-red-500/5 bg-red-500/[0.01] backdrop-blur-3xl shadow-2xl relative overflow-hidden group"
            >
              <h2 className="text-2xl font-black mb-10 flex items-center gap-4 text-red-400 tracking-tight uppercase italic relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                Risk Flags
              </h2>
              <div className="space-y-6 overflow-auto pr-2 custom-scrollbar max-h-[500px] relative z-10">
                {dashboardData.fraudFlags.length > 0 ? (
                  dashboardData.fraudFlags.map((flag: FraudFlag, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className="p-8 rounded-[2.5rem] border border-red-500/10 bg-red-500/[0.03] space-y-5 hover:border-red-500/20 transition-all group/flag active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-red-400/60 uppercase tracking-[0.2em] mb-1">Entity Flagged</span>
                          <span className="text-base font-black text-white italic group-hover/flag:text-red-400 transition-colors">{flag.studentName}</span>
                        </div>
                        <span className="text-[10px] px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-black tracking-widest uppercase shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                          SCORE: {flag.riskScore}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {flag.alerts.map((alert, j: number) => (
                          <div key={j} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/[0.02] border border-red-500/5">
                            <AlertCircle size={14} className="text-red-500/40 mt-0.5" />
                            <p className="text-[11px] text-white/30 font-bold leading-relaxed">{alert.description}</p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-red-500/5">
                        <span className="text-[9px] text-white/10 font-black font-mono uppercase tracking-[0.2em]">Neural Trace 0x{i.toString(16)}</span>
                        <span className="text-[9px] text-white/10 font-black font-mono uppercase tracking-widest">
                          {new Date(flag.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-white/10 space-y-6">
                    <div className="w-20 h-20 rounded-full border border-emerald-500/10 flex items-center justify-center bg-emerald-500/[0.02] shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                      <ShieldCheck size={40} strokeWidth={1} className="text-emerald-500/20 animate-pulse" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">Neural Perimeter Secure</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}} />
    </div>
  );
}
