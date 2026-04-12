"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession, getAuthToken } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { RefreshCw } from "lucide-react";
import {
  LayoutDashboard, BookOpen, Bell, LogOut, Sun, Moon,
  Activity, Zap, CheckCircle2, AlertCircle,
  TrendingUp, ChevronRight, GraduationCap,
  Target, Eye, QrCode, X
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scanner } from '@yudiel/react-qr-scanner';

interface Subject {
  id: string; code: string; name: string; facultyName: string;
  attended: number; total: number; percentage: number; status: string;
}
interface DashboardData {
  user: { name: string; email: string; registrationId?: string; phoneNumber?: string };
  student: { rollNumber: string; year: number; semester: number; department: string; section: string };
  stats: { overallPercentage: number; totalAttended: number; totalClasses: number; safeCount: number; atRiskCount: number };
  subjects: Subject[];
  activeSession: { id: string; courseName: string; courseCode: string; token: string } | null;
  notifications: Array<{ id: string; title: string; message: string; type: string; isRead: boolean }>;
}

// Generate some fake trend data for the chart to make it look premium
const generateTrendData = (basePercentage: number) => {
  return Array.from({ length: 7 }).map((_, i) => ({
    name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    attendance: Math.max(0, Math.min(100, basePercentage + (Math.random() * 15 - 7)))
  }));
};

function classesNeeded(attended: number, total: number, target = 75): number {
  if (total === 0 || (attended / total) * 100 >= target) return 0;
  return Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target)));
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const step = (end - start) / (1200 / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

// Nav item
function NavItem({ icon, label, active, onClick, badge }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; badge?: number;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
        ${active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"}`}
    >
      <span className={active ? "text-white dark:text-zinc-900" : "text-zinc-400"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{badge}</span>
      )}
    </button>
  );
}

// Subject card
function SubjectCard({ subject, index }: { subject: Subject; index: number }) {
  const needed = classesNeeded(subject.attended, subject.total);
  const isGood = subject.percentage >= 75;
  const isCritical = subject.percentage < 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <BookOpen size={48} className={isGood ? "text-emerald-500" : isCritical ? "text-red-500" : "text-amber-500"} />
      </div>

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-base font-bold text-zinc-900 dark:text-white truncate">{subject.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">{subject.code} · {subject.facultyName}</p>
        </div>
        <div className={`text-2xl font-black tabular-nums tracking-tight shrink-0 ${
          isGood ? "text-emerald-600 dark:text-emerald-400" :
          isCritical ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
        }`}>
          {subject.percentage}%
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-3 relative z-10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${subject.percentage}%` }}
          transition={{ duration: 1.2, delay: 0.2 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${
            isGood ? "bg-emerald-500" : isCritical ? "bg-red-500" : "bg-amber-500"
          }`}
        />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <CheckCircle2 size={12} className={isGood ? "text-emerald-500" : "text-zinc-400"} />
          {subject.attended} / {subject.total} attended
        </span>
        {!isGood && needed > 0 ? (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCritical ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
            Attend {needed} more
          </span>
        ) : (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            On Track
          </span>
        )}
      </div>
    </motion.div>
  );
}

function StudentDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "subjects" | "notifications">("overview");
  const [chartData, setChartData] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const url = result[0].rawValue;
      if (url.includes('/student/mark-attendance')) {
        setIsScannerOpen(false);
        router.push(url);
      }
    }
  };

  const fetchDashboard = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch("/api/student/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load dashboard");

      setDashboardData(data);
      setChartData(generateTrendData(data.stats.overallPercentage));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      if (session.user.role === "FACULTY") {
        router.push("/faculty/dashboard");
      } else if (session.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        fetchDashboard();
      }
    }
  }, [status, router, session]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (status === "loading" || loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full mb-4" />
      <p className="text-sm font-medium animate-pulse">Loading neural link...</p>
    </div>
  );

  const unreadCount = dashboardData?.notifications.filter(n => !n.isRead).length || 0;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = session?.user?.name?.split(' ')[0] || "Student";

  const isSafe = (dashboardData?.stats.overallPercentage || 0) >= 75;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex">

      {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-white dark:text-zinc-900" />
            </div>
            <span className="font-bold text-lg tracking-tight">AttendAI<span className="text-zinc-400">.</span></span>
          </div>

          <div className="space-y-1">
            <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
            <NavItem icon={<BookOpen size={18} />} label="My Subjects" active={activeTab === "subjects"} onClick={() => setActiveTab("subjects")} />
            <NavItem icon={<Bell size={18} />} label="Notifications" active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} badge={unreadCount} />
          </div>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <p className="text-sm font-semibold truncate">{isSafe ? 'On Track' : 'Needs Attention'}</p>
            </div>
            <p className="text-xs text-zinc-500 mt-1 truncate">{dashboardData?.student.department} • Sec {dashboardData?.student.section}</p>
          </div>

          <button onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-all">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-all">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 w-full">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 md:hidden">
              {firstName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">{greeting}</p>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-white md:text-base">{session?.user?.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchDashboard} disabled={loading} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
              {dashboardData?.student.rollNumber}
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 pb-24 md:pb-10">

          <AnimatePresence mode="wait">
            {activeTab === "overview" && dashboardData && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">

                {/* Hero insight banner */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.03] dark:opacity-[0.05] -translate-y-12 translate-x-12 pointer-events-none">
                    <svg viewBox="0 0 200 200" fill="none"><defs><pattern id="hero-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor" /></pattern></defs><rect width="200" height="200" fill="url(#hero-dots)" className="text-zinc-900 dark:text-white" /></svg>
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity size={16} className={isSafe ? "text-emerald-500" : "text-amber-500"} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isSafe ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                          Current Status
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight mb-4">
                        You have <span className={isSafe ? "text-emerald-500" : "text-amber-500"}><AnimatedNumber value={dashboardData.stats.overallPercentage} suffix="%" /></span> attendance this semester.
                      </h2>
                      <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                        {isSafe
                          ? "Great job! You are meeting the university requirements. Keep up the consistency to maintain your standing."
                          : "You are currently below the 75% requirement. You need to attend your upcoming classes consistently to avoid academic penalties."}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800/50">
                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Safe Subjects</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-5xl font-black tabular-nums tracking-tighter text-zinc-900 dark:text-white">{dashboardData.stats.safeCount}</span>
                          <span className="text-xl font-bold text-zinc-400">/{dashboardData.subjects.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Active Session Alert */}
                <AnimatePresence>
                  {dashboardData.activeSession && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.98 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
                            <Zap size={24} className="text-white" />
                          </div>
                          <div>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-0.5">Live Session Happening Now</p>
                            <h3 className="text-lg font-bold">{dashboardData.activeSession.courseName}</h3>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/attend/${dashboardData.activeSession?.id}/${dashboardData.activeSession?.token}`)}
                          className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-sm hover:scale-105 transition-transform whitespace-nowrap active:scale-95 flex items-center justify-center gap-2"
                        >
                          Mark Attendance <ChevronRight size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Trend Analysis</p>
                        <h3 className="text-zinc-900 dark:text-white font-bold">7-Day Trajectory</h3>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-400">
                        <TrendingUp size={18} />
                      </div>
                    </div>
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isSafe ? "#10b981" : "#f59e0b"} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={isSafe ? "#10b981" : "#f59e0b"} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.1} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="attendance" stroke={isSafe ? "#10b981" : "#f59e0b"} strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Activity</p>
                        <h3 className="text-zinc-900 dark:text-white font-bold">Total Classes</h3>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-400">
                        <Target size={18} />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-6">
                      <div className="flex items-end gap-4">
                        <div>
                          <div className="text-5xl font-black tabular-nums tracking-tighter text-zinc-900 dark:text-white">
                            <AnimatedNumber value={dashboardData.stats.totalAttended} />
                          </div>
                          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">Attended</p>
                        </div>
                        <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-800 mb-2" />
                        <div>
                          <div className="text-4xl font-bold tabular-nums tracking-tighter text-zinc-400">
                            {dashboardData.stats.totalClasses}
                          </div>
                          <p className="text-sm font-medium text-zinc-500 mt-1">Conducted</p>
                        </div>
                      </div>

                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                          <Eye size={16} /> At-Risk Subjects
                        </span>
                        <span className="text-lg font-bold tabular-nums text-red-500">{dashboardData.stats.atRiskCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Title */}
                <div className="flex items-center gap-4 pt-4">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Your Subjects</span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>

                {/* Subjects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {dashboardData.subjects.map((subject, index) => (
                    <SubjectCard key={subject.id} subject={subject} index={index} />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "subjects" && dashboardData && (
              <motion.div key="subjects" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Subject Breakdown</h2>
                    <p className="text-sm text-zinc-500 mt-1">Detailed view of your academic standing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {dashboardData.subjects.map((subject, index) => (
                    <SubjectCard key={subject.id} subject={subject} index={index} />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && dashboardData && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Recent Alerts</h2>
                {dashboardData.notifications.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
                    <Bell className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">You&apos;re all caught up</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                    {dashboardData.notifications.map((notif, i) => (
                      <div key={notif.id} className={`p-6 flex items-start gap-4 ${i !== dashboardData.notifications.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'ALERT' ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10'}`}>
                          {notif.type === 'ALERT' ? <AlertCircle size={20} /> : <Bell size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{notif.title}</h4>
                            {!notif.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{notif.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* ── Mobile Tab Bar ──────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe z-50">
        <div className="flex items-center justify-around px-2 py-2">
          <button onClick={() => setActiveTab("overview")} className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] ${activeTab === 'overview' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <LayoutDashboard size={20} className="mb-1" />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={() => setActiveTab("subjects")} className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] ${activeTab === 'subjects' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <BookOpen size={20} className="mb-1" />
            <span className="text-[10px] font-bold">Subjects</span>
          </button>
          <button onClick={() => setActiveTab("notifications")} className={`relative flex flex-col items-center p-2 rounded-xl min-w-[64px] ${activeTab === 'notifications' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            <div className="relative">
              <Bell size={20} className="mb-1" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />}
            </div>
            <span className="text-[10px] font-bold">Alerts</span>
          </button>
          <button onClick={toggle} className="flex flex-col items-center p-2 rounded-xl min-w-[64px] text-zinc-500 dark:text-zinc-400">
            {theme === 'dark' ? <Sun size={20} className="mb-1" /> : <Moon size={20} className="mb-1" />}
            <span className="text-[10px] font-bold">Theme</span>
          </button>
        </div>
      </nav>

      {/* ── Floating In-App QR Scanner ────────────────────────────────── */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="absolute top-10 right-6 md:right-10 z-[110]">
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/20 active:scale-95 transition-transform"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="w-full max-w-md bg-transparent rounded-3xl overflow-hidden shadow-2xl relative ring-1 ring-white/10">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
              
              <Scanner 
                onScan={handleScan}
              />

              <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <QrCode size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Scan Attendance QR</h3>
                <p className="text-white/60 text-sm">Point your camera at the professor's screen</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      {!isScannerOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsScannerOpen(true)}
          className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[60] bg-indigo-600 text-white p-4 rounded-full shadow-[0_10px_40px_rgba(79,70,229,0.4)] flex items-center justify-center gap-3 pr-6 group border border-indigo-500"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
            <QrCode size={18} />
          </div>
          <span className="font-bold tracking-wide text-sm hidden md:block">Scan QR</span>
          <span className="font-bold tracking-wide text-sm md:hidden">Scan</span>
        </motion.button>
      )}

    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full" /></div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}