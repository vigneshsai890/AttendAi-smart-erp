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
  Activity, Zap, ShieldAlert, CheckCircle2, AlertCircle,
  TrendingUp, ChevronRight, GraduationCap
} from "lucide-react";

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

// Classes needed to reach 75%
function classesNeeded(attended: number, total: number, target = 75): number {
  if (total === 0 || (attended / total) * 100 >= target) return 0;
  return Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target)));
}

// Animated number
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) { setDisplay(end); return; }
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

// Circular progress ring
function AttendanceRing({ percentage }: { percentage: number }) {
  const color = percentage >= 75 ? "#22c55e" : percentage >= 60 ? "#f59e0b" : "#ef4444";
  const r = 54;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" strokeWidth="10"
          className="text-zinc-100 dark:text-zinc-800" />
        <motion.circle
          cx="72" cy="72" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * percentage) / 100 }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white"
        >
          <AnimatedNumber value={percentage} suffix="%" />
        </motion.span>
        <span className="text-xs text-zinc-400 mt-0.5">Overall</span>
      </div>
    </div>
  );
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{subject.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">{subject.code} · {subject.facultyName}</p>
        </div>
        <span className={`text-lg font-bold tabular-nums shrink-0 ml-3 ${
          isGood ? "text-emerald-600 dark:text-emerald-400" :
          isCritical ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
        }`}>
          {subject.percentage}%
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${subject.percentage}%` }}
          transition={{ duration: 1, delay: 0.3 + index * 0.05, ease: "easeOut" }}
          className={`h-full rounded-full ${
            isGood ? "bg-emerald-500" : isCritical ? "bg-red-500" : "bg-amber-500"
          }`}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{subject.attended} / {subject.total} classes</span>
        {!isGood && needed > 0 ? (
          <span className={`text-xs font-medium ${isCritical ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
            {needed} more to reach 75%
          </span>
        ) : isGood ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 size={10} /> On track
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isPending = status === "loading";
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState<"home" | "academics" | "notifications">("home");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard — untouched logic
  useEffect(() => {
    if (!isPending && !session) router.push("/login");
    else if (!isPending) {
      const role = String((session?.user as any)?.role || "").toUpperCase();
      if (role === "FACULTY" || role === "ADMIN") router.push("/faculty/dashboard");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setError(null);
      try {
        const token = await getAuthToken();
        if (!token) { router.push("/login"); return; }
        const res = await fetch("/api/student/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || `Error ${res.status}`);
        }
      } catch {
        setError("Connection lost. Please check your network.");
      } finally {
        setLoading(false);
      }
    };
    if (!isPending && session) fetchDashboard();
  }, [isPending, session, router]);

  if (isPending || loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
        <ShieldAlert size={20} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">Failed to load dashboard</h2>
        <p className="text-sm text-zinc-400 max-w-xs">{error || "Please try again."}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
          Retry
        </button>
        <button onClick={() => signOut(auth).then(() => router.push("/login"))}
          className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
          Sign out
        </button>
      </div>
    </div>
  );

  const navItems = [
    { id: "home", label: "Home", icon: <LayoutDashboard size={16} /> },
    { id: "academics", label: "Academics", icon: <BookOpen size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} />, badge: data.notifications.filter(n => !n.isRead).length },
  ] as const;

  const studentName = data.user.name;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-[var(--font-inter)] flex">

      {/* ── Sidebar (desktop) ──────────────────────────────────── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="hidden md:flex flex-col w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-screen sticky top-0 p-4 gap-1"
      >
        <div className="px-2 py-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
              <Activity size={14} className="text-white dark:text-zinc-900" />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">AttendAI</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 ml-9">Student Portal</p>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5">
          {navItems.map(item => (
            <NavItem key={item.id} icon={item.icon} label={item.label}
              active={activeTab === item.id} onClick={() => setActiveTab(item.id as any)}
              badge={"badge" in item ? item.badge : undefined} />
          ))}
        </nav>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex flex-col gap-1">
          <button onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </motion.span>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <button onClick={() => signOut(auth).then(() => router.push("/login"))}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <div className="mt-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {studentName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{studentName.split(" ")[0]}</p>
              <p className="text-[10px] text-zinc-400">{data.student.rollNumber}</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Header */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-white">
              Hi, <span className="text-indigo-600">{studentName.split(" ")[0]}</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {data.student.department} · Sem {data.student.semester} · {data.student.section}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {data.activeSession && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Class in progress
              </motion.div>
            )}
            <button onClick={toggle}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </motion.header>

        {/* Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── HOME ─────────────────────────────────────────── */}
            {activeTab === "home" && (
              <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-6">

                {/* Active session banner */}
                <AnimatePresence>
                  {data.activeSession && (
                    <motion.button
                      key="session-banner"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onClick={() => window.location.href = `/attend/${data.activeSession!.id}/${data.activeSession!.token}`}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm relative">
                          <Zap size={16} className="text-white" />
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-xl bg-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                            Attendance session active
                          </p>
                          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mt-0.5">
                            {data.activeSession.courseName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold">
                        Mark now <ChevronRight size={12} />
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Overall attendance ring + quick stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center gap-3">
                    <AttendanceRing percentage={data.stats.overallPercentage} />
                    <div className="text-center">
                      <p className={`text-xs font-semibold ${
                        data.stats.overallPercentage >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                        data.stats.overallPercentage >= 60 ? "text-amber-600 dark:text-amber-400" :
                        "text-red-600 dark:text-red-400"
                      }`}>
                        {data.stats.overallPercentage >= 75 ? "On track" :
                         data.stats.overallPercentage >= 60 ? "At risk" : "Critical"}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{data.student.rollNumber}</p>
                    </div>
                  </div>

                  <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                    {[
                      { label: "Classes Attended", value: data.stats.totalAttended, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                      { label: "Classes Missed", value: data.stats.totalClasses - data.stats.totalAttended, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
                      { label: "Safe Subjects", value: data.stats.safeCount, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                      { label: "At-Risk Subjects", value: data.stats.atRiskCount, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
                    ].map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-1">
                        <span className={`text-2xl font-bold tabular-nums ${s.color}`}>
                          <AnimatedNumber value={s.value} />
                        </span>
                        <span className="text-xs text-zinc-400">{s.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Classes-needed tip banner (overall) */}
                {data.stats.atRiskCount > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <TrendingUp size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      You have <strong>{data.stats.atRiskCount} subject{data.stats.atRiskCount > 1 ? "s" : ""}</strong> below
                      75%. Check the Academics tab to see exactly how many classes you need to attend in each.
                    </p>
                  </motion.div>
                )}

                {/* Subject overview — top 4 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Subjects</p>
                    <button onClick={() => setActiveTab("academics")}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {data.subjects.slice(0, 4).map((s, i) => (
                      <SubjectCard key={s.id || i} subject={s} index={i} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ACADEMICS ────────────────────────────────────── */}
            {activeTab === "academics" && (
              <motion.div key="academics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-6">

                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Academics</h2>
                  <p className="text-sm text-zinc-400 mt-1">All subjects with attendance breakdown and recovery plan</p>
                </div>

                {/* Summary bar */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Attended", value: data.stats.totalAttended, color: "text-indigo-600 dark:text-indigo-400" },
                    { label: "Missed", value: data.stats.totalClasses - data.stats.totalAttended, color: "text-red-600 dark:text-red-400" },
                    { label: "Overall", value: `${data.stats.overallPercentage}%`, color: "text-zinc-900 dark:text-white" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* All subjects */}
                <div className="space-y-3">
                  {data.subjects.map((s, i) => (
                    <SubjectCard key={s.id || i} subject={s} index={i} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── NOTIFICATIONS ────────────────────────────────── */}
            {activeTab === "notifications" && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">

                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Notifications</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    {data.notifications.filter(n => !n.isRead).length} unread
                  </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  {data.notifications.length > 0 ? (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {data.notifications.map((n, i) => (
                        <motion.div key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`px-5 py-4 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${!n.isRead ? "bg-indigo-50/30 dark:bg-indigo-500/5" : ""}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            n.type === "WARNING" ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400" :
                            n.type === "ALERT" ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400" :
                            "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                          }`}>
                            {n.type === "WARNING" || n.type === "ALERT"
                              ? <AlertCircle size={14} />
                              : <GraduationCap size={14} />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{n.title}</p>
                              {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700">
                      <CheckCircle2 size={24} />
                      <p className="text-sm font-medium">You're all caught up</p>
                      <p className="text-xs">No notifications yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ───────────────────────────── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2 py-2 safe-area-inset-bottom"
      >
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl relative flex-1 transition-all">
              {isActive && (
                <motion.div layoutId="student-mobile-active"
                  className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                  transition={{ type: "spring", damping: 20, stiffness: 300 }} />
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

      <style dangerouslySetInnerHTML={{ __html: `.safe-area-inset-bottom { padding-bottom: env(safe-area-inset-bottom, 8px); }` }} />
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
