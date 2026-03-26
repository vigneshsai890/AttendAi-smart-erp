"use client";

import { useEffect, useState, useMemo } from "react";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  facultyName: string;
  attended: number;
  total: number;
  percentage: number;
  status: string;
}

interface TimetableEntry {
  courseId: string;
  courseName: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  room: string;
  facultyName: string;
  lectureNumber: number;
  isLive: boolean;
}

interface Activity {
  courseName: string;
  courseCode: string;
  status: string;
  markedAt: string;
  sessionDate: string;
  startTime: string;
}

interface DashboardData {
  user: { name: string; email: string };
  student: { rollNumber: string; year: number; semester: number; department: string; section: string };
  stats: { overallPercentage: number; totalAttended: number; totalClasses: number; safeCount: number; atRiskCount: number };
  subjects: Subject[];
  timetable: TimetableEntry[];
  recentActivity: Activity[];
  notifications: Array<{ id: string; title: string; message: string; type: string }>;
  activeSession: { id: string; courseName: string; courseCode: string; qrCode: string; qrExpiry: string } | null;
  exams: Array<{ examName: string; courseCode: string; marks: number; maxMarks: number; grade: string; date: string; percentage: number }>;
}

const subjectIcons: Record<string, string> = { CS401: "🗄️", CS302: "🌲", CS303: "⚙️", CS404: "🌐" };
const subjectColors: Record<string, { bar: string; text: string; glow: string }> = {
  CS401: { bar: "from-[#5EAEFF] to-[#818CF8]", text: "#5EAEFF", glow: "rgba(94,174,255,.11)" },
  CS302: { bar: "from-[#818CF8] to-[#A78BFA]", text: "#818CF8", glow: "rgba(129,140,248,.11)" },
  CS303: { bar: "from-[#34D399] to-[#5EAEFF]", text: "#34D399", glow: "rgba(52,211,153,.11)" },
  CS404: { bar: "from-[#F87171] to-[#FBBF24]", text: "#F87171", glow: "rgba(248,113,113,.11)" },
};

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState({ name: "", icon: "" });
  const [selectedQrSubject, setSelectedQrSubject] = useState("DBMS");
  const [qrCountdown, setQrCountdown] = useState(167);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const i = setInterval(() => setQrCountdown(c => (c <= 0 ? 180 : c - 1)), 1000);
    return () => clearInterval(i);
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }, []);

  const firstName = data?.user?.name?.split(" ")[0] || "Student";

  const formatCountdown = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const formatActivityTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return `Today · ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    if (diff < 172800000) return `Yesterday · ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString("en-IN", { weekday: "long" }) + " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const statusTag = (s: string) => {
    if (s === "safe") return <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-[rgba(52,211,153,.11)] text-[#34D399] border border-[rgba(52,211,153,.2)]">✅ Safe</span>;
    if (s === "borderline") return <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-[rgba(251,191,36,.11)] text-[#FBBF24] border border-[rgba(251,191,36,.2)]">⚠️ Borderline</span>;
    return <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-[rgba(248,113,113,.11)] text-[#F87171] border border-[rgba(248,113,113,.2)]">🚨 At Risk</span>;
  };

  const activityBadge = (status: string) => {
    if (status === "PRESENT") return <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-[rgba(52,211,153,.11)] text-[#34D399] border border-[rgba(52,211,153,.2)]">Present</span>;
    if (status === "LATE") return <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-[rgba(251,191,36,.11)] text-[#FBBF24] border border-[rgba(251,191,36,.2)]">Late</span>;
    return <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-[rgba(248,113,113,.11)] text-[#F87171] border border-[rgba(248,113,113,.2)]">Absent</span>;
  };

  // Calendar data
  const calendarDays = useMemo(() => {
    const presentDays = [2, 3, 5, 6, 9, 10, 12, 16, 17, 19, 23, 24, 25];
    const absentDays = [4, 11, 18];
    return Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      present: presentDays.includes(i + 1),
      absent: absentDays.includes(i + 1),
      today: i + 1 === new Date().getDate(),
    }));
  }, []);

  if (loading) {
    return (
      <>
        <Background />
        <Navbar />
        <div className="relative z-10 pt-[60px] flex items-center justify-center min-h-screen">
          <div className="text-white/50 text-lg animate-pulse">Loading dashboard...</div>
        </div>
      </>
    );
  }

  if (!data || !data.subjects) {
    return (
      <>
        <Background />
        <Navbar />
        <div className="relative z-10 pt-[60px] flex items-center justify-center min-h-screen">
          <div className="text-white/50 text-lg">Please log in to view your dashboard.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />
      <Navbar />

      <div className="relative z-10 pt-[60px]">
        <div className="max-w-[1280px] mx-auto px-[26px] py-[30px] pb-12">

          {/* ── HERO ── */}
          <div className="att-a1 relative overflow-hidden rounded-[22px] p-[26px_28px] mb-[22px] bg-gradient-to-br from-[rgba(94,174,255,.1)] via-[rgba(129,140,248,.07)] to-[rgba(167,139,250,.05)] border border-[rgba(94,174,255,.18)]">
            <div className="absolute top-[-70px] right-[-70px] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(94,174,255,.16),transparent_65%)] pointer-events-none" />
            <div className="inline-flex items-center gap-[5px] text-[10px] font-bold uppercase tracking-[1.2px] text-[#5EAEFF] bg-[rgba(94,174,255,.11)] border border-[rgba(94,174,255,.22)] rounded-full px-[10px] py-[3px] mb-[10px] font-['DM_Sans',sans-serif]">
              🎓 Semester {data.student.semester} · B.Tech {data.student.department.split(" ")[0]}
            </div>
            <h1 className="text-[clamp(20px,3.2vw,32px)] font-extrabold tracking-[-0.8px] leading-[1.1] bg-gradient-to-br from-white/100 to-white/50 bg-clip-text text-transparent mb-[6px]">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-[13px] text-white/50 font-['DM_Sans',sans-serif] leading-[1.55] max-w-[460px]">
              You have <strong>{data.timetable.length} classes today</strong> at The Apollo University. Overall attendance is tracking
              {data.stats.atRiskCount > 0 ? ` — ${data.subjects.find(s => s.status === "at-risk")?.name?.split(" ").pop()} needs attention.` : " well."}
            </p>
            <div className="flex gap-[7px] flex-wrap mt-[13px]">
              <span className="px-[11px] py-[4px] rounded-full text-[10px] font-bold font-['DM_Sans',sans-serif] bg-white/5 border border-white/[0.09] text-white/50">
                📅 {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              {data.subjects.map(s => (
                <span key={s.code} className={`px-[11px] py-[4px] rounded-full text-[10px] font-bold font-['DM_Sans',sans-serif] ${
                  s.status === "at-risk"
                    ? "bg-[rgba(248,113,113,.1)] border border-[rgba(248,113,113,.22)] text-[#F87171]"
                    : "bg-[rgba(52,211,153,.1)] border border-[rgba(52,211,153,.22)] text-[#34D399]"
                }`}>
                  {s.status === "at-risk" ? "⚠️" : "✅"} {s.name.split(" ").pop()} {s.percentage}%
                </span>
              ))}
            </div>
            {/* Ring */}
            <div className="absolute right-[26px] top-1/2 -translate-y-1/2 text-center hidden md:block">
              <div className="relative w-[78px] h-[78px] mx-auto mb-[5px]">
                <svg style={{ transform: "rotate(-90deg)" }} width="78" height="78" viewBox="0 0 78 78">
                  <circle cx="39" cy="39" r="31" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="6" />
                  <circle cx="39" cy="39" r="31" fill="none" stroke="url(#rg)" strokeWidth="6"
                    strokeDasharray="195" strokeDashoffset={195 - (195 * data.stats.overallPercentage / 100)} strokeLinecap="round" />
                  <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#5EAEFF" /><stop offset="100%" stopColor="#818CF8" /></linearGradient></defs>
                </svg>
                <div className="absolute text-[18px] font-extrabold text-[#5EAEFF] tracking-[-0.5px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{data.stats.overallPercentage}%</div>
              </div>
              <div className="text-[10px] text-white/50 font-['DM_Sans',sans-serif]">Overall<br />Attendance</div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div className="att-a2 grid grid-cols-2 lg:grid-cols-4 gap-[13px] mb-[22px]">
            {[
              { label: "Overall Attendance", value: `${data.stats.overallPercentage}%`, hint: "↑ 2% vs last week", color: "#5EAEFF", icon: "📊", accent: "from-[#5EAEFF]" },
              { label: "Classes Attended", value: String(data.stats.totalAttended), hint: `of ${data.stats.totalClasses} total sessions`, color: "#818CF8", icon: "✅", accent: "from-[#818CF8]" },
              { label: "Subjects Safe", value: String(data.stats.safeCount), hint: "above 75% threshold", color: "#34D399", icon: "🛡️", accent: "from-[#34D399]" },
              { label: "At Risk", value: String(data.stats.atRiskCount), hint: data.stats.atRiskCount > 0 ? `${data.subjects.find(s => s.status === "at-risk")?.name?.split(" ").pop()} needs attention` : "All subjects safe", color: "#F87171", icon: "⚠️", accent: "from-[#F87171]" },
            ].map((stat, i) => (
              <div key={i} className="att-glass relative overflow-hidden p-[17px_19px] cursor-default hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,.45)] transition-all duration-300">
                <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-[2px] bg-gradient-to-r ${stat.accent} to-transparent`} />
                <div className="text-[9px] uppercase tracking-[0.9px] text-white/50 font-['DM_Sans',sans-serif] mb-[6px]">{stat.label}</div>
                <div className="text-[28px] font-extrabold tracking-[-1.5px] leading-none" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[10px] text-white/50 font-['DM_Sans',sans-serif] mt-[4px]">{stat.hint}</div>
                <div className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[32px] opacity-10">{stat.icon}</div>
              </div>
            ))}
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-[18px]">
            <div>
              {/* Subjects */}
              <div className="att-a3 text-[10px] font-bold uppercase tracking-[1px] text-white/50 font-['DM_Sans',sans-serif] mb-[11px] flex items-center gap-[7px]">
                <span className="flex-1">My Subjects</span>
                <span className="px-2 py-[2px] rounded-full text-[9px] font-bold tracking-[0.2px] bg-[rgba(94,174,255,.1)] text-[#5EAEFF] border border-[rgba(94,174,255,.2)]">Sem {data.student.semester} · 2025–26</span>
              </div>
              <div className="att-a3 grid grid-cols-1 sm:grid-cols-2 gap-[13px] mb-5">
                {data.subjects.map(subj => {
                  const colors = subjectColors[subj.code] || subjectColors.CS401;
                  const icon = subjectIcons[subj.code] || "📚";
                  return (
                    <div key={subj.id} onClick={() => { setModalSubject({ name: subj.name, icon }); setModalOpen(true); }}
                      className="att-glass relative overflow-hidden p-[18px] cursor-pointer hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(0,0,0,.45)] transition-all duration-300 group">
                      <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ background: `radial-gradient(circle at 25% 30%, ${colors.glow}, transparent 60%)` }} />
                      <div className="flex items-start justify-between mb-[11px]">
                        <div className="text-[24px]">{icon}</div>
                        <div className="text-[21px] font-extrabold tracking-[-1px]" style={{ color: colors.text }}>{subj.percentage}%</div>
                      </div>
                      <div className="text-[13px] font-bold tracking-[-0.1px] mb-[2px]">{subj.name}</div>
                      <div className="text-[10px] text-white/50 font-['DM_Sans',sans-serif] mb-[11px]">{subj.code} · {subj.facultyName} · {subj.credits} Credits</div>
                      <div className="h-1 bg-white/[0.07] rounded-[10px] overflow-hidden mb-[7px]">
                        <div className={`h-full rounded-[10px] bg-gradient-to-r ${colors.bar} transition-all duration-1000`} style={{ width: `${subj.percentage}%` }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/50 font-['DM_Sans',sans-serif]">{subj.attended} / {subj.total} classes</span>
                        {statusTag(subj.status)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timetable */}
              <div className="att-a4 text-[10px] font-bold uppercase tracking-[1px] text-white/50 font-['DM_Sans',sans-serif] mb-[11px] flex items-center gap-[7px]">
                <span className="flex-1">Today&apos;s Timetable</span>
                <span className="px-2 py-[2px] rounded-full text-[9px] font-bold tracking-[0.2px] bg-[rgba(94,174,255,.1)] text-[#5EAEFF] border border-[rgba(94,174,255,.2)]">
                  {new Date().toLocaleDateString("en-IN", { weekday: "long" })} · {new Date().getDate()} {new Date().toLocaleDateString("en-IN", { month: "short" })}
                </span>
              </div>
              <div className="att-glass att-a4 p-[18px] mb-5">
                {data.timetable.length === 0 ? (
                  <div className="text-center text-white/30 text-sm py-4">No classes scheduled for today</div>
                ) : (
                  data.timetable.map((entry, i) => {
                    const colors = subjectColors[entry.courseCode] || subjectColors.CS401;
                    return (
                      <div key={i} className={`flex gap-[13px] py-[11px] items-center ${i < data.timetable.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                        <div className="text-[10px] font-['DM_Sans',sans-serif] text-white/50 w-12 shrink-0 text-right leading-[1.4]">
                          {formatTime(entry.startTime).split(" ")[0]}<br />{formatTime(entry.startTime).split(" ")[1]}
                        </div>
                        <div className="w-[2px] rounded-[2px] self-stretch shrink-0 min-h-[36px]" style={{ background: colors.text }} />
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold mb-[2px] tracking-[-0.1px]">{entry.courseName}</div>
                          <div className="text-[10px] text-white/50 font-['DM_Sans',sans-serif]">{entry.room} · {entry.facultyName} · Lecture {entry.lectureNumber}</div>
                        </div>
                        {entry.isLive ? (
                          <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-[rgba(94,174,255,.14)] text-[#5EAEFF] border border-[rgba(94,174,255,.24)] shrink-0">🔴 Live</span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-white/5 text-white/50 border border-white/[0.09] shrink-0">Upcoming</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Recent Activity */}
              <div className="att-a5 text-[10px] font-bold uppercase tracking-[1px] text-white/50 font-['DM_Sans',sans-serif] mb-[11px] mt-5">
                <span>Recent Activity</span>
              </div>
              <div className="att-glass att-a5 p-[18px]">
                {data.recentActivity.map((act, i) => (
                  <div key={i} className={`flex items-center gap-[11px] py-[10px] ${i < data.recentActivity.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                    <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{
                      background: act.status === "PRESENT" ? "#34D399" : act.status === "LATE" ? "#FBBF24" : "#F87171"
                    }} />
                    <div className="flex-1">
                      <div className="text-[12px] font-semibold tracking-[-0.1px]">{act.courseName}</div>
                      <div className="text-[10px] text-white/50 font-['DM_Sans',sans-serif] mt-[1px]">{formatActivityTime(act.markedAt)}</div>
                    </div>
                    {activityBadge(act.status)}
                  </div>
                ))}
                {data.recentActivity.length === 0 && <div className="text-center text-white/30 text-sm py-2">No recent activity</div>}
              </div>

              {/* Exam Results */}
              <div className="att-a6 text-[10px] font-bold uppercase tracking-[1px] text-white/50 font-['DM_Sans',sans-serif] mb-[11px] mt-5">
                <span>Academic Results</span>
              </div>
              <div className="att-glass att-a6 p-[18px]">
                {data.exams && data.exams.length > 0 ? (
                  data.exams.map((exam, i) => (
                    <div key={i} className={`flex items-center gap-[11px] py-[10px] ${i < data.exams.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                      <div className="w-[32px] h-[32px] rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-[14px] shrink-0">
                        {exam.percentage >= 90 ? "🏆" : exam.percentage >= 75 ? "📚" : "📝"}
                      </div>
                      <div className="flex-1">
                        <div className="text-[12px] font-semibold tracking-[-0.1px]">{exam.examName}</div>
                        <div className="text-[10px] text-white/50 font-['DM_Sans',sans-serif] mt-[1px]">
                          {exam.courseCode} · {new Date(exam.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-bold tracking-[-0.5px]" style={{ color: exam.percentage >= 75 ? "#34D399" : "#F87171" }}>
                          {exam.marks} <span className="text-[10px] text-white/40">/ {exam.maxMarks}</span>
                        </div>
                        <div className="text-[10px] uppercase font-bold text-[#818CF8]">Grade {exam.grade || "-"}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/30 text-[12px] py-4">No exam records available</div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-4">
              {/* QR Panel */}
              <div className="att-glass p-5 text-center">
                <h3 className="text-[14px] font-bold mb-[3px] tracking-[-0.2px]">QR Check-In</h3>
                <p className="text-[11px] text-white/50 font-['DM_Sans',sans-serif] mb-4 leading-[1.5]">
                  Select subject, then tap Scan to mark attendance. Code refreshes every 3 minutes.
                </p>
                <div className="flex gap-[5px] justify-center flex-wrap mb-4">
                  {["DBMS", "DS", "OS", "CN"].map(s => (
                    <div key={s} onClick={() => { setSelectedQrSubject(s); showToast(`Subject set to ${s}. Scan the QR in class.`); }}
                      className={`px-[10px] py-1 rounded-full text-[10px] font-bold font-['DM_Sans',sans-serif] cursor-pointer transition-all border ${
                        selectedQrSubject === s
                          ? "bg-gradient-to-br from-[rgba(94,174,255,.2)] to-[rgba(167,139,250,.2)] text-white border-[rgba(94,174,255,.32)]"
                          : "bg-white/[0.04] text-white/50 border-white/[0.08]"
                      }`}>
                      {s}
                    </div>
                  ))}
                </div>
                <div className="w-[152px] h-[152px] rounded-2xl bg-white p-[11px] mx-auto mb-[13px] relative shadow-[0_0_0_1px_rgba(255,255,255,.1),0_8px_38px_rgba(94,174,255,.18)]" style={{ animation: "att-qr-pulse 3s ease-in-out infinite" }}>
                  <div className="absolute left-[11px] right-[11px] h-[2px] bg-gradient-to-r from-transparent via-[#5EAEFF] to-transparent rounded-[2px]" style={{ animation: "att-scan 2s ease-in-out infinite", top: "11px" }} />
                  <svg viewBox="0 0 100 100" width="128" height="128" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="5" width="36" height="36" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/>
                    <rect x="13" y="13" width="20" height="20" rx="3" fill="#111"/>
                    <rect x="59" y="5" width="36" height="36" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/>
                    <rect x="67" y="13" width="20" height="20" rx="3" fill="#111"/>
                    <rect x="5" y="59" width="36" height="36" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/>
                    <rect x="13" y="67" width="20" height="20" rx="3" fill="#111"/>
                    <rect x="59" y="59" width="8" height="8" rx="1" fill="#111"/><rect x="71" y="59" width="8" height="8" rx="1" fill="#111"/>
                    <rect x="83" y="59" width="12" height="8" rx="1" fill="#111"/><rect x="59" y="71" width="8" height="8" rx="1" fill="#111"/>
                    <rect x="71" y="71" width="8" height="8" rx="1" fill="#111"/><rect x="59" y="83" width="8" height="12" rx="1" fill="#111"/>
                    <rect x="71" y="83" width="24" height="8" rx="1" fill="#111"/>
                    <rect x="45" y="5" width="9" height="9" rx="1" fill="#111"/><rect x="45" y="18" width="9" height="9" rx="1" fill="#111"/>
                    <rect x="5" y="45" width="9" height="9" rx="1" fill="#111"/><rect x="18" y="45" width="9" height="9" rx="1" fill="#111"/>
                  </svg>
                </div>
                <div className="text-[11px] text-white/50 font-['DM_Sans',sans-serif] mb-[13px]">
                  Refreshes in <strong className="text-[#5EAEFF] text-[13px]">{formatCountdown(qrCountdown)}</strong>
                </div>
                <button onClick={() => {
                  showToast(`✅ Checked in for ${selectedQrSubject} — Room 301`);
                  // Also try hitting the real API
                  fetch("/api/attendance/mark", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      qrCode: data?.activeSession?.qrCode || "apollo-dbms-live-qr-2026",
                      latitude: 12.9716, longitude: 77.5946,
                      deviceFingerprint: navigator.userAgent,
                    }),
                  }).then(r => r.json()).then(res => {
                    if (res.status === "PRESENT") showToast("✅ Attendance marked at The Apollo University!");
                    else if (res.status === "PROXY") showToast("🚨 " + res.message);
                  }).catch(() => {});
                }}
                  className="w-full py-[11px] border-none rounded-xl bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white text-[12px] font-bold cursor-pointer tracking-[0.2px] shadow-[0_4px_18px_rgba(94,174,255,.28)] hover:-translate-y-[1px] hover:shadow-[0_8px_26px_rgba(94,174,255,.42)] active:scale-[0.98] transition-all">
                  📷 &nbsp;Scan QR Code
                </button>
              </div>

              {/* Calendar */}
              <div className="att-glass p-4">
                <div className="flex items-center justify-between mb-[13px]">
                  <div className="text-[13px] font-bold tracking-[-0.2px]">
                    {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </div>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.04] text-white/50 cursor-pointer text-[10px] hover:bg-[rgba(94,174,255,.12)] hover:text-[#5EAEFF] transition-all">‹</button>
                    <button className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.04] text-white/50 cursor-pointer text-[10px] hover:bg-[rgba(94,174,255,.12)] hover:text-[#5EAEFF] transition-all">›</button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-[2px] text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                    <div key={d} className="text-[8px] text-white/50 py-[3px] uppercase tracking-[0.3px] font-['DM_Sans',sans-serif]">{d}</div>
                  ))}
                  {calendarDays.map(cd => (
                    <div key={cd.day} className={`aspect-square flex items-center justify-center text-[10px] rounded-full cursor-pointer transition-all relative font-['DM_Sans',sans-serif] hover:bg-white/[0.07] ${
                      cd.today ? "bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white font-extrabold shadow-[0_2px_10px_rgba(94,174,255,.38)]" : ""
                    } ${cd.present && !cd.today ? "cal-dot-present" : ""} ${cd.absent ? "cal-dot-absent" : ""}`}>
                      {cd.day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div className="att-glass p-4">
                <div className="text-[10px] font-bold uppercase tracking-[1px] text-white/50 font-['DM_Sans',sans-serif] mb-[10px]">Smart Alerts</div>
                {data.notifications.map((n, i) => (
                  <div key={n.id || i} onClick={() => showToast(n.message)}
                    className="flex gap-[9px] p-[10px] rounded-xl mb-[7px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:translate-x-[3px] transition-all cursor-pointer last:mb-0">
                    <div className="text-[17px] shrink-0 mt-[1px]">
                      {n.type === "WARNING" ? "🚨" : n.type === "ALERT" ? "📍" : "🏆"}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold mb-[2px]" style={{
                        color: n.type === "WARNING" ? "#F87171" : n.type === "INFO" ? "#34D399" : "inherit"
                      }}>{n.title}</div>
                      <div className="text-[10px] text-white/50 font-['DM_Sans',sans-serif] leading-[1.4]">{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/65 backdrop-blur-[8px]"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="w-[min(410px,92vw)] p-[26px] rounded-[22px] bg-[rgba(8,12,30,.94)] border border-white/[0.12] backdrop-blur-[30px]"
            style={{ animation: "att-fup .35s both" }}>
            <button onClick={() => setModalOpen(false)}
              className="float-right bg-white/[0.06] border border-white/10 text-white/50 w-7 h-7 rounded-full text-[14px] cursor-pointer hover:bg-white/[0.12] hover:text-white transition-all flex items-center justify-center">
              ✕
            </button>
            <h3 className="text-[17px] font-extrabold tracking-[-0.3px] mb-1">{modalSubject.icon} {modalSubject.name}</h3>
            <p className="text-[12px] text-white/50 font-['DM_Sans',sans-serif] mb-5 leading-[1.5]">
              Scan the QR on the board, or select your subject and confirm attendance.
            </p>
            <div className="w-[168px] h-[168px] rounded-[14px] bg-white p-3 mx-auto mb-[15px] flex items-center justify-center shadow-[0_4px_30px_rgba(94,174,255,.22)]">
              <svg viewBox="0 0 100 100" width="144" height="144" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="36" height="36" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/>
                <rect x="13" y="13" width="20" height="20" rx="3" fill="#111"/>
                <rect x="59" y="5" width="36" height="36" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/>
                <rect x="67" y="13" width="20" height="20" rx="3" fill="#111"/>
                <rect x="5" y="59" width="36" height="36" rx="5" fill="none" stroke="#111" strokeWidth="3.5"/>
                <rect x="13" y="67" width="20" height="20" rx="3" fill="#111"/>
                <rect x="59" y="59" width="8" height="8" fill="#111"/><rect x="71" y="59" width="8" height="8" fill="#111"/>
                <rect x="83" y="59" width="12" height="8" fill="#111"/><rect x="59" y="71" width="8" height="8" fill="#111"/>
                <rect x="59" y="83" width="8" height="12" fill="#111"/><rect x="71" y="83" width="24" height="8" fill="#111"/>
              </svg>
            </div>
            <button onClick={() => { setModalOpen(false); showToast("✅ Attendance marked at The Apollo University!"); }}
              className="w-full py-[11px] border-none rounded-xl bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white text-[12px] font-bold cursor-pointer tracking-[0.2px] shadow-[0_4px_18px_rgba(94,174,255,.28)] hover:-translate-y-[1px] active:scale-[0.98] transition-all">
              ✅ &nbsp;Confirm Check-In
            </button>
          </div>
        </div>
      )}
    </>
  );
}
