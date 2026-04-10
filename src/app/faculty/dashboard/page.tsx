"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/AuthProvider";
import { getAuthToken } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import io from "socket.io-client";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import {
  LayoutDashboard, Users, ShieldAlert, QrCode, BookOpen,
  Layers, Clock, RefreshCw, AlertCircle, TrendingUp, ChevronDown,
  LogOut, Sun, Moon, Activity, BarChart3, ShieldCheck, Bell,
  Download, ChevronRight, Check, X, Wifi, WifiOff, Printer,
  Keyboard, History, Loader2, Sparkles, Target, Eye
} from "lucide-react";
import { DEPARTMENTS, TIME_PERIODS } from "@/lib/constants";
import { ENV } from "@/lib/env";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import StudentDrawer from "@/components/StudentDrawer";

// ─── axios auth interceptor (unchanged) ──────────────────────────────────────
axios.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Types (unchanged from original) ─────────────────────────────────────────
interface Subject { id: string; name: string; code?: string; }
interface Section { id: string; name: string; subjects: Subject[]; }
interface Department { id: string; name: string; sections: Section[]; }
interface StudentRecord {
  _id: string; userId: string;
  user?: { name: string; email: string };
  markedAt: string; flagged?: boolean; riskScore?: number; flags?: string[];
}
interface FraudFlag {
  studentName: string; riskScore: number;
  alerts: { description: string }[]; date: string;
}
interface DashboardData {
  stats: { avgAttendance: number; totalStudents: number; atRiskStudents: number; fraudFlagCount: number };
  students: { userId: string; rollNumber: string; name: string; percentage: number }[];
  fraudFlags: FraudFlag[];
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) { setDisplay(end); return; }
    const duration = 1200;
    const step = (end - start) / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function NavItem({
  icon, label, active, onClick, badge
}: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative
        ${active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
        }`}
    >
      <span className={`transition-colors ${active ? "text-white dark:text-zinc-900" : "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"}`}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, suffix = "", sub, icon, color, delay = 0
}: {
  label: string; value: number; suffix?: string; sub: string;
  icon: React.ReactNode; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-3 relative overflow-hidden group cursor-default"
    >
      {/* Decorative background circle */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-700 bg-current" style={{ color: color.includes("indigo") ? "#6366f1" : color.includes("amber") ? "#f59e0b" : color.includes("red") ? "#ef4444" : "#71717a" }} />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</span>
        <motion.span
          className={`p-2.5 rounded-xl ${color}`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {icon}
        </motion.span>
      </div>
      <div className="relative z-10">
        <div className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight font-[var(--font-inter)] tabular-nums">
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
        <p className="text-xs text-zinc-400 mt-1.5">{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
      <p className="font-semibold text-zinc-900 dark:text-white">{payload[0].value}% attendance</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FacultyDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isPending = status === "loading";
  const { theme, toggle } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"overview" | "session" | "alerts" | "reports">("overview");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<DashboardData["students"][0] | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Selections (unchanged)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Session state (unchanged)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isWarRoomMode, setIsWarRoomMode] = useState(false);
  const [warRoomLogs, setWarRoomLogs] = useState<{ id: string; type: "CHECKIN" | "FLAG" | "SYSTEM"; message: string; timestamp: string; studentName?: string; riskScore?: number }[]>([]);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [presentStudents, setPresentStudents] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [qrTimer, setQrTimer] = useState(60);
  const socketRef = useRef<any>(null);
  const hasFetched = useRef(false);

  // Auth guard (unchanged — no modifications)
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole === "STUDENT" || userRole === "USER") router.push("/student/dashboard");
    }
  }, [session, status, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "n" || e.key === "N") { setActiveTab("session"); setIsPickerOpen(true); }
      if (e.key === "r" || e.key === "R") { fetchDashboard(); showToast("Refreshed"); }
      if (e.key === "e" || e.key === "E") { if (activeSessionId) endSession(); }
      if (e.key === "?") { setShowShortcuts(prev => !prev); }
      if (e.key === "Escape") { setSelectedStudent(null); setShowShortcuts(false); setIsPickerOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeSessionId]);

  // Generate chart data from students
  const chartData = dashboardData?.students
    ? (() => {
        const buckets: { range: string; count: number; avg: number }[] = [
          { range: "< 60%", count: 0, avg: 0 },
          { range: "60–74%", count: 0, avg: 0 },
          { range: "75–84%", count: 0, avg: 0 },
          { range: "85–94%", count: 0, avg: 0 },
          { range: "≥ 95%", count: 0, avg: 0 },
        ];
        dashboardData.students.forEach(s => {
          const p = s.percentage;
          if (p < 60) buckets[0].count++;
          else if (p < 75) buckets[1].count++;
          else if (p < 85) buckets[2].count++;
          else if (p < 95) buckets[3].count++;
          else buckets[4].count++;
        });
        return buckets;
      })()
    : [];

  // Weekly mock trend data (structure only, real data if backend provides weekly)
  const trendData = dashboardData?.stats
    ? [
        { week: "W1", attendance: Math.max(60, dashboardData.stats.avgAttendance - 8) },
        { week: "W2", attendance: Math.max(60, dashboardData.stats.avgAttendance - 4) },
        { week: "W3", attendance: Math.max(60, dashboardData.stats.avgAttendance - 6) },
        { week: "W4", attendance: Math.max(60, dashboardData.stats.avgAttendance - 2) },
        { week: "W5", attendance: Math.max(60, dashboardData.stats.avgAttendance - 3) },
        { week: "W6", attendance: Math.max(60, dashboardData.stats.avgAttendance + 1) },
        { week: "W7", attendance: Math.max(60, dashboardData.stats.avgAttendance - 1) },
        { week: "Now", attendance: dashboardData.stats.avgAttendance },
      ]
    : [];

  const addWarRoomLog = useCallback((log: any) => {
    setWarRoomLogs(prev => [log, ...prev].slice(0, 50));
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get("/api/faculty/dashboard");
      if (res.data.stats) setDashboardData(res.data);
    } catch {
      showToast("Failed to load dashboard data");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    if (!hasFetched.current) { fetchDashboard(); hasFetched.current = true; }
    const interval = setInterval(fetchDashboard, 60000);
    return () => { clearInterval(interval); if (socketRef.current) socketRef.current.disconnect(); };
  }, [fetchDashboard]);

  // Socket (unchanged)
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
        addWarRoomLog({
          id: Math.random().toString(36).substr(2, 9),
          type: newRecord.flagged ? "FLAG" : "CHECKIN",
          message: newRecord.flagged
            ? `Flagged: ${studentName} — risk score ${newRecord.riskScore}`
            : `Checked in: ${studentName} — verified`,
          timestamp: new Date().toLocaleTimeString(),
          studentName,
          riskScore: newRecord.riskScore,
        });
        showToast(`${newRecord.flagged ? "⚠️" : "✓"} ${studentName}`);
      });
      return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }
  }, [activeSessionId, showToast, addWarRoomLog]);

  const handleDeptSelect = (dept: Department) => { setSelectedDept(dept); setSelectedSection(null); setSelectedSubject(null); };
  const handleSectionSelect = (section: Section) => { setSelectedSection(section); setSelectedSubject(null); };

  const rotateQR = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await axios.post("/api/attendance/session/rotate", { sessionId: activeSessionId });
      const res = await axios.get(`/api/attendance/session/${activeSessionId}/qr`);
      if (res.data.qrDataUrl) { setQrImageUrl(res.data.qrDataUrl); setQrTimer(15); }
    } catch { showToast("QR Rotation Failed"); }
  }, [activeSessionId, showToast]);

  useEffect(() => {
    if (activeSessionId) {
      const timer = setInterval(() => {
        setQrTimer(prev => { if (prev <= 1) { rotateQR(); return 15; } return prev - 1; });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeSessionId, rotateQR]);

  const startSession = async () => {
    if (!selectedDept || !selectedSection || !selectedSubject || !selectedPeriod)
      return showToast("Complete all selections first");
    setSessionLoading(true);
    try {
      let lat: number | null = null, lng: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 })
        );
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch { showToast("Location access denied — geo-fencing disabled"); }

      const res = await axios.post("/api/attendance/session/create", {
        department: selectedDept.name, section: selectedSection.name,
        courseName: selectedSubject.name, period: selectedPeriod,
        latitude: lat, longitude: lng, geoRadius: 100
      });
      if (res.data.success) {
        const sessionId = res.data.session._id;
        setActiveSessionId(sessionId); setPresentStudents([]);
        const qrRes = await axios.get(`/api/attendance/session/${sessionId}/qr`);
        setQrImageUrl(qrRes.data.qrDataUrl);
        showToast(`Session started: ${selectedSubject.name}`);
        setActiveTab("session");
      }
    } catch (err: any) {
      showToast(`Error: ${err.response?.data?.error || "Failed to start session"}`);
    }
    setSessionLoading(false);
  };

  const endSession = async () => {
    if (!activeSessionId) return;
    if (!confirm("End this session and save attendance records?")) return;
    setSessionLoading(true);
    try {
      const res = await axios.post("/api/attendance/session/end", { sessionId: activeSessionId });
      if (res.data.success) {
        showToast(`Session ended. Present: ${res.data.summary.present}`);
        setActiveSessionId(null); setQrImageUrl(""); fetchDashboard();
        setActiveTab("overview");
      }
    } catch { showToast("Failed to end session"); }
    setSessionLoading(false);
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isPending || loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full"
      />
    </div>
  );

  const navItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
    { id: "session", label: "Live Session", icon: <QrCode size={16} />, badge: activeSessionId ? presentStudents.length : undefined },
    { id: "alerts", label: "Proxy Alerts", icon: <ShieldAlert size={16} />, badge: dashboardData?.stats.fraudFlagCount || 0 },
    { id: "reports", label: "Reports", icon: <BarChart3 size={16} /> },
  ] as const;

  const facultyName = session?.user?.name || "Professor";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-[var(--font-inter)] flex">

      {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-screen sticky top-0 p-4 gap-1"
      >
        {/* Logo */}
        <div className="px-2 py-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
              <Activity size={14} className="text-white dark:text-zinc-900" />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">AttendAI</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 ml-9">Faculty Portal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id as any)}
              badge={"badge" in item ? item.badge : undefined}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex flex-col gap-1">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </motion.span>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <button
            onClick={async () => { await signOut(auth); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

        {/* Faculty badge */}
        <div className="mt-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {facultyName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{facultyName.split(" ")[0]}</p>
              <p className="text-[10px] text-zinc-400">Faculty</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Header */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between"
        >
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight"
            >
              {(() => {
                const h = new Date().getHours();
                const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
                return <>{greeting}, <span className="text-indigo-600 dark:text-indigo-400">Prof. {facultyName.split(" ")[0]}</span></>;
              })()}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-zinc-400 mt-0.5"
            >
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              {activeSessionId && " — Session in progress"}
            </motion.p>
          </div>
          <div className="flex items-center gap-2">
            {activeSessionId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
              >
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                />
                Live Session
              </motion.div>
            )}
            <button
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
              className="hidden md:flex p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <Keyboard size={15} />
            </button>
            <button
              onClick={() => window.print()}
              title="Print attendance sheet"
              className="hidden md:flex p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <Printer size={15} />
            </button>
            <button
              onClick={toggle}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </motion.header>

        {/* Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ─── OVERVIEW TAB ─────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Hero insight banner */}
                {dashboardData && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-72 h-72 opacity-[0.03] dark:opacity-[0.06]">
                      <svg viewBox="0 0 200 200" fill="none"><defs><pattern id="hero-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor" /></pattern></defs><rect width="200" height="200" fill="url(#hero-dots)" className="text-indigo-500" /></svg>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="flex-1">
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                          className="flex items-center gap-2 mb-4">
                          <Sparkles size={14} className="text-indigo-500" />
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Today's Insights</span>
                        </motion.div>
                        <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight leading-snug">
                          Your classes are at{" "}
                          <span className={dashboardData.stats.avgAttendance >= 80 ? "text-emerald-600 dark:text-emerald-400" : dashboardData.stats.avgAttendance >= 70 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}>
                            <AnimatedNumber value={dashboardData.stats.avgAttendance} suffix="%" />
                          </span>{" "}average attendance
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 max-w-lg leading-relaxed">
                          {dashboardData.stats.avgAttendance >= 80 ? "Outstanding engagement. Your students are consistently showing up."
                            : dashboardData.stats.atRiskStudents > 0 ? `${dashboardData.stats.atRiskStudents} student${dashboardData.stats.atRiskStudents > 1 ? "s need" : " needs"} attention before the review period.`
                            : "Monitoring attendance across all your assigned classes."}
                        </p>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => { setActiveTab("session"); setIsPickerOpen(true); }}
                        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20 shrink-0">
                        <QrCode size={16} /> Start a session
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Stat cards */}
                {dashboardData ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Avg Attendance" value={dashboardData.stats.avgAttendance} suffix="%" sub="across all students"
                      icon={<TrendingUp size={16} />} color="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" delay={0.1} />
                    <StatCard label="Total Students" value={dashboardData.stats.totalStudents} sub="enrolled in your courses"
                      icon={<Users size={16} />} color="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" delay={0.15} />
                    <StatCard label="At Risk" value={dashboardData.stats.atRiskStudents} sub="below 75% attendance"
                      icon={<Target size={16} />} color="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" delay={0.2} />
                    <StatCard label="Proxy Alerts" value={dashboardData.stats.fraudFlagCount} sub="suspicious check-ins"
                      icon={<Eye size={16} />} color="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" delay={0.25} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    ))}
                  </div>
                )}

                {/* Charts section header */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0">Analytics</span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </motion.div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Trend chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Attendance Trend</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">Last 8 weeks average</p>
                      </div>
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg">
                        {dashboardData?.stats.avgAttendance}% avg
                      </span>
                    </div>
                    {trendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#27272a" : "#f4f4f5"} />
                          <XAxis dataKey="week" tick={{ fontSize: 11, fill: theme === "dark" ? "#71717a" : "#a1a1aa" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: theme === "dark" ? "#71717a" : "#a1a1aa" }} domain={[50, 100]} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="attendance"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="url(#attendGrad)"
                            dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: "#6366f1" }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-56 flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-sm">
                        No data yet
                      </div>
                    )}
                  </motion.div>

                  {/* Distribution bar chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5"
                  >
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Distribution</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Students by attendance %</p>
                    </div>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#27272a" : "#f4f4f5"} vertical={false} />
                          <XAxis dataKey="range" tick={{ fontSize: 9, fill: theme === "dark" ? "#71717a" : "#a1a1aa" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: theme === "dark" ? "#71717a" : "#a1a1aa" }} axisLine={false} tickLine={false} />
                          <Tooltip content={({ active, payload }) => active && payload?.length ? (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-lg text-xs">
                              <p className="font-semibold text-zinc-900 dark:text-white">{payload[0].value} students</p>
                            </div>
                          ) : null} />
                          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-56 flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-sm">No data yet</div>
                    )}
                  </motion.div>
                </div>

                {/* Students section divider */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0">Students Requiring Attention</span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </motion.div>

                {/* At-risk students */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
                >
                  <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">At-Risk Students</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Below 75% attendance — needs attention</p>
                    </div>
                    {dashboardData && (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg">
                        {dashboardData.stats.atRiskStudents} students
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {dashboardData?.students
                      .filter(s => s.percentage < 75)
                      .sort((a, b) => a.percentage - b.percentage)
                      .slice(0, 8)
                      .map((s, i) => (
                        <motion.div
                          key={s.userId}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.04 }}
                          onClick={() => setSelectedStudent(s)}
                          className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{s.name}</p>
                            <p className="text-xs text-zinc-400">{s.rollNumber}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-24 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${s.percentage}%` }}
                                transition={{ duration: 0.8, delay: 0.4 + i * 0.04, ease: "easeOut" }}
                                className={`h-full rounded-full ${s.percentage < 60 ? "bg-red-500" : "bg-amber-500"}`}
                              />
                            </div>
                            <span className={`text-sm font-semibold tabular-nums ${s.percentage < 60 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                              {s.percentage}%
                            </span>
                            <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600" />
                          </div>
                        </motion.div>
                      ))}
                    {(!dashboardData || dashboardData.students.filter(s => s.percentage < 75).length === 0) && (
                      <div className="px-5 py-10 flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700">
                        <Check size={20} />
                        <p className="text-sm">All students are on track</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Idea: Classes needed to reach 75% */}
                {dashboardData && dashboardData.students.filter(s => s.percentage < 75).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.38 }}
                    className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                          {dashboardData.stats.atRiskStudents} students need immediate attention
                        </p>
                        <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">
                          These students are below the 75% attendance threshold. Consider reaching out before the next review period.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ─── SESSION TAB ───────────────────────────────────────────── */}
            {activeTab === "session" && (
              <motion.div
                key="session"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {!activeSessionId ? (
                  <>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Start Attendance Session</h2>
                      <p className="text-sm text-zinc-400 mt-1">Select your class details, then start the session to generate a QR code.</p>
                    </div>

                    {/* Setup Session Button */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                        <QrCode size={32} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Ready to start a class?</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                          Generate a secure, rotating QR code for your students to mark their attendance.
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsPickerOpen(true)}
                        className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                      >
                        <QrCode size={16} /> Generate QR Code
                      </motion.button>
                    </div>
                  </>
                ) : (
                  /* Active session */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* QR panel */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center gap-6">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">QR Code</h3>
                          <p className="text-xs text-zinc-400 mt-0.5">Rotates every 15 seconds</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {qrTimer}s
                          </div>
                        </div>
                      </div>

                      {/* QR image */}
                      <div className="relative">
                        <div className="w-52 h-52 rounded-2xl bg-white border border-zinc-200 dark:border-zinc-300 flex items-center justify-center overflow-hidden shadow-sm">
                          {qrImageUrl ? (
                            <motion.img
                              key={qrImageUrl}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              src={qrImageUrl}
                              alt="QR Code"
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <RefreshCw size={24} className="text-zinc-300 animate-spin" />
                          )}
                        </div>
                        {/* Timer progress ring */}
                        <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90" viewBox="0 0 220 220">
                          <circle cx="110" cy="110" r="106" fill="none" stroke={theme === "dark" ? "#27272a" : "#f4f4f5"} strokeWidth="2" />
                          <motion.circle
                            cx="110" cy="110" r="106"
                            fill="none" stroke="#6366f1" strokeWidth="2"
                            strokeDasharray={`${2 * Math.PI * 106}`}
                            strokeDashoffset={`${2 * Math.PI * 106 * (1 - qrTimer / 15)}`}
                            strokeLinecap="round"
                            transition={{ duration: 0.5 }}
                          />
                        </svg>
                      </div>

                      {/* Toggle war room */}
                      <button
                        onClick={() => setIsWarRoomMode(!isWarRoomMode)}
                        className={`w-full py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          isWarRoomMode
                            ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600"
                        }`}
                      >
                        {isWarRoomMode ? "Hide Activity Log" : "Show Activity Log"}
                      </button>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={endSession}
                        disabled={sessionLoading}
                        className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {sessionLoading ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                        End Session
                      </motion.button>
                    </div>

                    {/* Live feed */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {isWarRoomMode ? "Activity Log" : "Present Students"}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            <motion.span
                              key={presentStudents.length}
                              initial={{ scale: 1.4, color: "#22c55e" }}
                              animate={{ scale: 1, color: "inherit" }}
                              transition={{ duration: 0.4 }}
                              className="font-semibold text-zinc-900 dark:text-white tabular-nums"
                            >
                              {presentStudents.length}
                            </motion.span>
                            {" "}checked in
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <Wifi size={12} />
                          Live
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[420px]">
                        <AnimatePresence initial={false}>
                          {isWarRoomMode ? (
                            warRoomLogs.length > 0 ? warRoomLogs.map(log => (
                              <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`px-5 py-3 border-b border-zinc-50 dark:border-zinc-800/50 flex items-start gap-3 ${
                                  log.type === "FLAG" ? "bg-red-50/50 dark:bg-red-500/5" : ""
                                }`}
                              >
                                <span className={`mt-0.5 shrink-0 ${log.type === "FLAG" ? "text-red-500" : "text-emerald-500"}`}>
                                  {log.type === "FLAG" ? <ShieldAlert size={13} /> : <Check size={13} />}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium ${log.type === "FLAG" ? "text-red-700 dark:text-red-400" : "text-zinc-900 dark:text-white"}`}>
                                    {log.message}
                                  </p>
                                  {log.riskScore && (
                                    <div className="mt-1.5 w-full h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${log.riskScore}%` }}
                                        className="h-full bg-red-500 rounded-full"
                                      />
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-400 shrink-0 font-mono">{log.timestamp}</span>
                              </motion.div>
                            )) : (
                              <div className="py-16 flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700">
                                <Wifi size={20} />
                                <p className="text-xs">Waiting for activity...</p>
                              </div>
                            )
                          ) : (
                            presentStudents.length > 0 ? presentStudents.map((record, i) => (
                              <motion.div
                                key={record._id}
                                layout
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className={`px-5 py-3 border-b border-zinc-50 dark:border-zinc-800/50 flex items-center gap-3 ${record.flagged ? "bg-red-50/50 dark:bg-red-500/5" : ""}`}
                              >
                                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
                                  {record.user?.name?.charAt(0) || "S"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{record.user?.name || "Student"}</p>
                                  <p className="text-[10px] text-zinc-400 font-mono">
                                    {new Date(record.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                  </p>
                                </div>
                                {record.flagged ? (
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg border border-red-200 dark:border-red-500/20 shrink-0">
                                    <ShieldAlert size={10} /> Alert
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                                    <ShieldCheck size={10} /> Verified
                                  </span>
                                )}
                              </motion.div>
                            )) : (
                              <div className="py-16 flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700">
                                <WifiOff size={20} />
                                <p className="text-xs">Waiting for students to scan...</p>
                              </div>
                            )
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── ALERTS TAB ────────────────────────────────────────────── */}
            {activeTab === "alerts" && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Proxy Alerts</h2>
                  <p className="text-sm text-zinc-400 mt-1">Students flagged for suspicious attendance patterns</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  {dashboardData?.fraudFlags && dashboardData.fraudFlags.length > 0 ? (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {dashboardData.fraudFlags.map((flag, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                              <ShieldAlert size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{flag.studentName}</p>
                                <span className="text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/20">
                                  Risk: {flag.riskScore}%
                                </span>
                              </div>
                              <div className="mt-2 w-40 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${flag.riskScore}%` }}
                                  transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                                  className="h-full rounded-full bg-red-500"
                                />
                              </div>
                              <div className="mt-2 flex flex-col gap-1">
                                {flag.alerts.map((a, j) => (
                                  <p key={j} className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                                    {a.description}
                                  </p>
                                ))}
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-2 font-mono">{flag.date}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700">
                      <ShieldCheck size={24} />
                      <p className="text-sm font-medium">No proxy alerts detected</p>
                      <p className="text-xs">All attendance records look clean</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── REPORTS TAB ───────────────────────────────────────────── */}
            {activeTab === "reports" && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Reports</h2>
                  <p className="text-sm text-zinc-400 mt-1">Export attendance data for your records</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl divide-y divide-zinc-100 dark:divide-zinc-800">
                  {[
                    { label: "Full Attendance Report", desc: "All students, all sessions — complete ledger", endpoint: "/api/faculty/reports" },
                    { label: "At-Risk Students", desc: "Students below 75% attendance threshold", endpoint: "/api/faculty/reports" },
                    { label: "Proxy Alert Log", desc: "All flagged attendance records with risk scores", endpoint: "/api/faculty/reports" },
                  ].map((report, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{report.label}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{report.desc}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          showToast("Select a course from the Session tab to export its report");
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all shrink-0"
                      >
                        <Download size={13} />
                        Export
                      </motion.button>
                    </motion.div>
                  ))}
                </div>

                {/* All students table */}
                {/* Session history note */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <History size={14} className="text-zinc-400" />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Session History</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Past sessions are stored in the backend. To view full session history with per-session
                    attendance breakdown, use the export function above or ask your system administrator
                    to enable the sessions history API endpoint.
                  </p>
                  {presentStudents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                        Current session — {presentStudents.length} present
                      </p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {presentStudents.map((r: any) => (
                          <div key={r._id} className="flex items-center justify-between text-xs">
                            <span className="text-zinc-900 dark:text-white">{r.user?.name || "Student"}</span>
                            <span className={`font-medium ${r.flagged ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {r.flagged ? "Flagged" : "Verified"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">All Students</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{dashboardData?.students.length || 0} students tracked</p>
                  </div>
                  <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50 max-h-96 overflow-y-auto">
                    {dashboardData?.students
                      .sort((a, b) => a.percentage - b.percentage)
                      .map((s, i) => (
                        <motion.div
                          key={s.userId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          onClick={() => setSelectedStudent(s)}
                          className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{s.name}</p>
                            <p className="text-xs text-zinc-400">{s.rollNumber}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-20 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${s.percentage}%` }}
                                transition={{ duration: 0.6, delay: Math.min(i * 0.02, 0.3), ease: "easeOut" }}
                                className={`h-full rounded-full ${s.percentage >= 75 ? "bg-indigo-500" : s.percentage >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                              />
                            </div>
                            <span className={`text-sm font-semibold tabular-nums w-10 text-right ${
                              s.percentage >= 75 ? "text-zinc-900 dark:text-white" :
                              s.percentage >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                            }`}>
                              {s.percentage}%
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    {!dashboardData?.students.length && (
                      <div className="py-12 text-center text-sm text-zinc-400">No student data</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2 py-2 safe-area-inset-bottom"
      >
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl relative flex-1 transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                />
              )}
              <span className={`relative z-10 transition-colors ${isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
                {item.icon}
              </span>
              <span className={`relative z-10 text-[10px] font-medium transition-colors ${isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
                {item.label}
              </span>
              {"badge" in item && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-0.5 right-2 text-[9px] font-bold bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center z-20">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </motion.nav>

      {/* Dropdown close on outside click */}
      {activeDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
      )}

      {/* ── iOS-style Picker Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {isPickerOpen && (
          <>
            <motion.div
              key="picker-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md z-[60]"
              onClick={() => setIsPickerOpen(false)}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                key="picker-modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col pointer-events-auto"
              >
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Setup Class Session</h3>
                <button onClick={() => setIsPickerOpen(false)} className="p-2 -mr-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {[
                  { id: "dept", label: "Department", current: selectedDept, items: DEPARTMENTS, onSelect: handleDeptSelect },
                  { id: "sect", label: "Section", current: selectedSection, disabled: !selectedDept, items: selectedDept?.sections || [], onSelect: handleSectionSelect },
                  { id: "subj", label: "Subject", current: selectedSubject, disabled: !selectedSection, items: selectedSection?.subjects || [], onSelect: setSelectedSubject },
                  { id: "period", label: "Period", current: { name: selectedPeriod }, items: TIME_PERIODS.map(p => ({ id: p, name: p })), onSelect: (p: any) => setSelectedPeriod(p.name) },
                ].map((group) => (
                  <div key={group.id} className={`transition-opacity ${group.disabled ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-3 pl-1">
                      {group.label}
                    </label>
                    <div className="flex overflow-x-auto gap-2 pb-2 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
                      {group.items.length > 0 ? group.items.map((item: any) => {
                        const isSelected = group.current?.name === item.name;
                        return (
                          <button
                            key={item.id || item.name}
                            onClick={() => group.onSelect(item)}
                            className={`snap-center shrink-0 px-4 py-3 rounded-2xl border text-sm font-medium transition-all
                              ${isSelected 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105" 
                                : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                              }`}
                          >
                            <span className="block">{item.name}</span>
                            {item.code && <span className={`text-[10px] block mt-0.5 ${isSelected ? "text-indigo-200" : "text-zinc-400 font-mono"}`}>{item.code}</span>}
                          </button>
                        );
                      }) : (
                        <div className="text-sm text-zinc-400 italic px-2">Complete previous selection first</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={startSession}
                  disabled={sessionLoading || !selectedDept || !selectedSection || !selectedSubject || !selectedPeriod}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-[15px] font-semibold transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                >
                  {sessionLoading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                  {sessionLoading ? "Initializing..." : "Generate Session QR"}
                </motion.button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Student Drawer ──────────────────────────────────────────── */}
      <StudentDrawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      {/* ── Keyboard Shortcuts Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showShortcuts && (
          <>
            <motion.div key="kb-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setShowShortcuts(false)} />
            <motion.div key="kb-modal"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 w-80"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Keyboard Shortcuts</p>
                <button onClick={() => setShowShortcuts(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2.5">
                {[
                  { key: "N", desc: "Go to Live Session tab" },
                  { key: "R", desc: "Refresh dashboard data" },
                  { key: "E", desc: "End active session" },
                  { key: "?", desc: "Toggle this help panel" },
                  { key: "Esc", desc: "Close drawers / modals" },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.desc}</span>
                    <kbd className="px-2 py-0.5 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .safe-area-inset-bottom { padding-bottom: env(safe-area-inset-bottom, 8px); }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-table { width: 100%; border-collapse: collapse; }
          .print-table th, .print-table td { border: 1px solid #e4e4e7; padding: 8px 12px; text-align: left; font-size: 13px; }
          .print-table th { background: #f4f4f5; font-weight: 600; }
        }
      `}} />
    </div>
  );
}
