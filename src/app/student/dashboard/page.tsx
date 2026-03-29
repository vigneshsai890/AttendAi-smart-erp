"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

interface Subject {
  id: string; code: string; name: string; facultyName: string;
  attended: number; total: number; percentage: number; status: string;
}
interface DashboardData {
  user: { name: string; email: string };
  student: { rollNumber: string; year: number; semester: number; department: string; section: string };
  stats: { overallPercentage: number; totalAttended: number; totalClasses: number; safeCount: number; atRiskCount: number };
  subjects: Subject[];
  activeSession: { id: string; courseName: string; courseCode: string } | null;
  notifications: Array<{ id: string; title: string; message: string; type: string; isRead: boolean }>;
}

function CircularProgress({ percentage, size = 120 }: { percentage: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 80 ? "#34d399" : percentage >= 75 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700" />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold" style={{ color }}>{percentage}</span>
        <span className="text-sm text-white/30">%</span>
      </div>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "classroom";
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard").then(r => r.json()).then(d => setData(d));
  }, []);

  if (!data) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white pb-24 font-['Inter',sans-serif]">
      <AnimatePresence mode="wait">
        {tab === "classroom" && <HomeView key="home" data={data} />}
        {tab === "academics" && <AcademicsView key="academics" data={data} />}
        {(tab === "feed" || tab === "message" || tab === "reminders") && (
          <NotificationsView key="notif" data={data} />
        )}
      </AnimatePresence>
      <Navbar />
    </div>
  );
}

function HomeView({ data }: { data: DashboardData }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="max-w-lg mx-auto px-5 pt-16">

      {/* Welcome */}
      <div className="mb-6">
        <p className="text-[11px] font-medium text-violet-400 uppercase tracking-widest mb-1">Welcome back</p>
        <h1 className="text-xl font-bold tracking-tight">{data.user.name}</h1>
        <p className="text-[12px] text-white/35 mt-0.5">
          {data.student.department} · Year {data.student.year} · {data.student.section}
        </p>
      </div>

      {/* Overall attendance */}
      <div className="bg-[#0f0f13] border border-white/[0.06] rounded-2xl p-6 mb-5 flex items-center gap-6">
        <CircularProgress percentage={data.stats.overallPercentage} />
        <div>
          <p className="text-sm font-semibold mb-1">Overall Attendance</p>
          <p className="text-[12px] text-white/40">{data.stats.totalAttended} / {data.stats.totalClasses} sessions</p>
          <div className="flex gap-3 mt-3">
            <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">{data.stats.safeCount} safe</span>
            {data.stats.atRiskCount > 0 && (
              <span className="text-[10px] px-2 py-1 rounded-md bg-red-500/10 text-red-400 font-medium">{data.stats.atRiskCount} at risk</span>
            )}
          </div>
        </div>
      </div>

      {/* Active session banner */}
      {data.activeSession && (
        <a href="/scan" className="block bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-5 hover:bg-emerald-500/15 transition-all">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-emerald-400">Live Session — Scan QR</p>
              <p className="text-[11px] text-white/40">{data.activeSession.courseName}</p>
            </div>
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      )}

      {/* Subject cards */}
      <h2 className="text-sm font-semibold mb-3">Subjects</h2>
      <div className="space-y-2.5">
        {data.subjects.map((s, i) => {
          const color = s.percentage >= 80 ? "#34d399" : s.percentage >= 75 ? "#fbbf24" : "#f87171";
          return (
            <div key={i} className="bg-[#0f0f13] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <p className="text-[13px] font-medium">{s.name}</p>
                  <p className="text-[10px] text-white/30">{s.code} · {s.facultyName}</p>
                </div>
                <span className="text-[15px] font-bold" style={{ color }}>{s.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.percentage}%`, backgroundColor: color }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-white/25">{s.attended}/{s.total} attended</span>
                <span className={`text-[10px] font-medium ${s.percentage >= 80 ? "text-emerald-400" : s.percentage >= 75 ? "text-amber-400" : "text-red-400"}`}>
                  {s.percentage >= 80 ? "Good" : s.percentage >= 75 ? "Warning" : "Critical"}
                </span>
              </div>
            </div>
          );
        })}
        {data.subjects.length === 0 && (
          <div className="bg-[#0f0f13] border border-white/[0.06] rounded-xl p-8 text-center">
            <p className="text-[13px] text-white/30">No subjects enrolled yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AcademicsView({ data }: { data: DashboardData }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="max-w-lg mx-auto px-5 pt-16">
      <h1 className="text-lg font-bold mb-5 text-center">Attendance Records</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#0f0f13] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-emerald-400">{data.stats.totalAttended}</p>
          <p className="text-[10px] text-white/30 mt-1">Present</p>
        </div>
        <div className="bg-[#0f0f13] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-red-400">{data.stats.totalClasses - data.stats.totalAttended}</p>
          <p className="text-[10px] text-white/30 mt-1">Absent</p>
        </div>
        <div className="bg-[#0f0f13] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-xl font-bold" style={{ color: data.stats.overallPercentage >= 80 ? "#34d399" : "#f87171" }}>
            {data.stats.overallPercentage}%
          </p>
          <p className="text-[10px] text-white/30 mt-1">Overall</p>
        </div>
      </div>

      {/* Per-subject */}
      <div className="space-y-3">
        {data.subjects.map((s, i) => (
          <div key={i} className="bg-[#0f0f13] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[13px] font-medium">{s.name}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{s.attended}/{s.total} sessions</p>
            </div>
            <span className="text-[15px] font-bold" style={{ color: s.percentage >= 80 ? "#34d399" : s.percentage >= 75 ? "#fbbf24" : "#f87171" }}>
              {s.percentage}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function NotificationsView({ data }: { data: DashboardData }) {
  const notifications = data.notifications || [];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="max-w-lg mx-auto px-5 pt-16">
      <h1 className="text-lg font-bold mb-5 text-center">Notifications</h1>
      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id} className={`bg-[#0f0f13] border rounded-xl p-4 ${
            n.type === "WARNING" ? "border-amber-500/20" : n.type === "ALERT" ? "border-red-500/20" : "border-white/[0.06]"
          }`}>
            <p className="text-[12px] font-semibold">{n.title}</p>
            <p className="text-[11px] text-white/40 mt-1">{n.message}</p>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-10 text-white/25 text-sm">No notifications</div>
        )}
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
