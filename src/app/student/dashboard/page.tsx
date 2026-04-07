"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Magnetic from "@/components/Magnetic";
import Background from "@/components/Background";
import TiltCard from "@/components/TiltCard";
import {
  Activity, GraduationCap, LayoutDashboard,
  BookOpen, Clock, ShieldAlert, CheckCircle2,
  ChevronRight, Bell, User, History, Zap
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

import { useRouter } from "next/navigation";
import { useSession } from "@/components/AuthProvider";

function DashboardContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isPending = status === "loading";
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "classroom";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    } else if (!isPending) {
      const role = String((session?.user as any)?.role || "").toUpperCase();
      if (role === "FACULTY" || role === "ADMIN") {
        router.push("/faculty/dashboard");
      }
    }
  }, [session, isPending, router]);

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

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading || !data) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      <Background />

      {/* Vengance UI Aesthetic Glows */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 inset-x-0 h-[400px] bg-gradient-to-t from-purple-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto px-6 pt-24"
    >
      {/* Premium Profile Header with Mesh Gradient */}
      <TiltCard glowColor="rgba(99, 102, 241, 0.1)" className="rounded-[3rem] mb-12">
        <div className="relative p-8 rounded-[3rem] overflow-hidden bg-white/[0.01] border border-white/5 h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent -z-10" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700" />

          <div className="flex items-end justify-between relative z-10">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-6 text-[10px] font-black text-indigo-400 uppercase tracking-widest ring-1 ring-white/5"
              >
                <GraduationCap size={12} /> Student Node · Online
              </motion.div>
              <h1 className="text-5xl font-black tracking-tight text-white mb-2 italic drop-shadow-2xl">
                Hi, {data.user.name.split(' ')[0]}
              </h1>
              <p className="text-[12px] text-white/40 font-bold uppercase tracking-tight flex items-center gap-2 mb-4">
                <span className="text-white/60">{data.student.department}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Section {data.student.section}</span>
              </p>
              
              {/* Registration ID Badge */}
              <div className="inline-flex flex-col p-4 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl shadow-inner">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Neural Identity</span>
                <span className="text-lg font-black text-indigo-400 font-mono tracking-tighter">{data.user.registrationId || "PENDING..."}</span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-2xl shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-500">
              <div className="w-full h-full rounded-[2rem] bg-[#0c0c0e] flex items-center justify-center text-2xl font-black text-white italic">
                {data.user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </TiltCard>

      {/* Active Session Portal: High-Tech Neural Link */}
      <AnimatePresence>
        {data.activeSession && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mb-4 ml-4">Active Neural Link</p>
            <TiltCard glowColor="rgba(16, 185, 129, 0.15)" className="rounded-[4rem]">
              <Magnetic strength={0.1}>
                <button
                  onClick={() => window.location.href = `/attend/${data.activeSession?.id}/${data.activeSession?.token}`}
                  className="w-full p-10 rounded-[4rem] bg-emerald-500/[0.03] border border-emerald-500/20 hover:bg-emerald-500/[0.07] hover:border-emerald-500/40 transition-all text-left relative overflow-hidden group shadow-2xl shadow-emerald-500/5 ring-1 ring-emerald-500/10"
                >
                  {/* High-tech background elements */}
                  <div className="absolute top-0 right-0 p-10 text-emerald-500/[0.03] -z-10 group-hover:scale-110 group-hover:text-emerald-500/[0.08] transition-all duration-700">
                    <Activity size={120} strokeWidth={0.5} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center gap-8 relative z-10">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                        <Zap size={36} className="fill-emerald-400/20" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#0c0c0e] shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Neural Sync in Progress</p>
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight italic">{data.activeSession.courseName}</h3>
                      <p className="text-[11px] text-white/40 font-mono tracking-tighter mt-1 flex items-center gap-2 uppercase">
                        <span className="text-white/60 font-bold">{data.activeSession.courseCode}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>Faculty Terminal A-101</span>
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all group-hover:translate-x-2">
                      <ChevronRight size={24} className="text-emerald-500/60" />
                    </div>
                  </div>
                </button>
              </Magnetic>
            </TiltCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject Registry */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">Subject Registry</h2>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            {data.stats.overallPercentage}% Overall
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {data.subjects.map((s, i) => {
            const color = s.percentage >= 80 ? "text-emerald-400" : s.percentage >= 75 ? "text-amber-400" : "text-red-400";
            const bgColor = s.percentage >= 80 ? "bg-emerald-500" : s.percentage >= 75 ? "bg-amber-500" : "bg-red-500";
            const glowColor = s.percentage >= 80 ? "rgba(16,185,129,0.1)" : s.percentage >= 75 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";

            return (
              <TiltCard
                key={i}
                glowColor={glowColor}
                className="rounded-[3rem]"
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all shadow-2xl h-full"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div className="space-y-1.5">
                        <h4 className="text-lg font-black tracking-tight text-white/90 group-hover:text-white transition-colors italic">{s.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          <p className="text-[10px] text-white/30 font-mono tracking-tighter uppercase font-bold">{s.code} · {s.facultyName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-black italic tracking-tighter ${color} drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`}>{s.percentage}%</div>
                      </div>
                    </div>

                    <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4 shadow-inner ring-1 ring-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.percentage}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1.5, ease: "circOut" }}
                        className={`h-full rounded-full ${bgColor} shadow-[0_0_15px_rgba(255,255,255,0.1)] relative`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                      </motion.div>
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Presence</span>
                          <span className="text-[11px] font-bold text-white/60 font-mono tracking-tighter">{s.attended} / {s.total} Sessions</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Neural Status</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>
                          {s.percentage >= 80 ? "Optimal" : s.percentage >= 75 ? "Warning" : "Critical"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function AcademicsView({ data }: { data: DashboardData }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="max-w-2xl mx-auto px-6 pt-24"
    >
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Neural History</h1>
        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Comprehensive Attendance Ledger</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Temporal Marks", value: data.stats.totalAttended, color: "text-emerald-400" },
          { label: "Lost Frames", value: data.stats.totalClasses - data.stats.totalAttended, color: "text-red-400" },
          { label: "Link Yield", value: `${data.stats.overallPercentage}%`, color: "text-indigo-400" }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 text-center shadow-2xl">
            <p className={`text-2xl font-black tracking-tighter italic ${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {data.subjects.map((s, i) => (
          <div key={i} className="p-5 rounded-[2rem] bg-white/[0.01] border border-white/5 flex items-center justify-between group hover:bg-white/[0.03] transition-all">
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white/80 group-hover:text-white italic">{s.name}</p>
              <p className="text-[10px] text-white/20 font-mono tracking-tighter uppercase mt-1">{s.attended} / {s.total} Verified Sessions</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`text-lg font-black italic tracking-tighter ${s.percentage >= 75 ? "text-white" : "text-red-400"}`}>{s.percentage}%</p>
              </div>
              <ChevronRight size={16} className="text-white/10" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function NotificationsView({ data }: { data: DashboardData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto px-6 pt-24"
    >
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Neural Signals</h1>
        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Encrypted System Dispatches</p>
      </div>

      <div className="space-y-4">
        {data.notifications.map(n => (
          <div key={n.id} className={`p-8 rounded-[3rem] bg-white/[0.01] border backdrop-blur-3xl relative overflow-hidden group ${
            n.type === "WARNING" ? "border-amber-500/20 shadow-amber-500/5" : n.type === "ALERT" ? "border-red-500/20 shadow-red-500/5" : "border-white/5 shadow-white/5"
          }`}>
            <div className={`absolute top-0 right-0 p-8 opacity-5 -z-10 group-hover:scale-110 transition-transform ${
              n.type === "WARNING" ? "text-amber-500" : n.type === "ALERT" ? "text-red-500" : "text-white"
            }`}>
              <Bell size={100} strokeWidth={1} />
            </div>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${
                n.type === "WARNING" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                n.type === "ALERT" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              }`}>
                {n.type === "WARNING" ? <ShieldAlert size={20} /> : <Bell size={20} />}
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ${
                  n.type === "WARNING" ? "text-amber-400" : n.type === "ALERT" ? "text-red-400" : "text-indigo-400"
                }`}>
                  {n.type} · System Dispatch
                </p>
                <h3 className="text-[15px] font-black text-white/90 group-hover:text-white transition-colors mb-2 italic">{n.title}</h3>
                <p className="text-[12px] text-white/30 font-medium leading-relaxed">{n.message}</p>
              </div>
            </div>
          </div>
        ))}
        {data.notifications.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center text-white/10 space-y-6">
            <Bell size={48} strokeWidth={1} />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] italic">No Neural Interrupts</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <DashboardContent />
    </Suspense>
  );
}
