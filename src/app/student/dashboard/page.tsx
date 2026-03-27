"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

interface Subject {
  id: string; code: string; name: string; facultyName: string;
  attended: number; total: number; percentage: number; status: string;
}
interface Exam {
  examName: string; courseCode: string; marks: number; maxMarks: number; grade: string; date: string; percentage: number;
}
interface DashboardData {
  stats: { overallPercentage: number; totalAttended: number; totalClasses: number; safeCount: number; atRiskCount: number };
  subjects: Subject[]; exams: Exam[];
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "classroom";
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard").then(r => r.json()).then(d => setData(d));
  }, []);

  if (!data) return <div className="min-h-screen bg-[#111111]"><Navbar /></div>;

  return (
    <div className="min-h-screen bg-[#111111] text-white pb-[80px] font-['Inter',sans-serif]">
      <AnimatePresence mode="wait">
        {tab === "classroom" && <ClassroomView key="classroom" subjects={data.subjects} />}
        {tab === "academics" && <AcademicsView key="academics" data={data} />}
        {(tab === "feed" || tab === "message" || tab === "reminders") && (
          <motion.div key="wip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-20 text-center text-white/40">
            Work in Progress
          </motion.div>
        )}
      </AnimatePresence>
      <Navbar />
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111]"><Navbar /></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function ClassroomView({ subjects }: { subjects: Subject[] }) {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
      {/* Search Header */}
      <div className="pt-[50px] px-4 pb-4 bg-[#111111] sticky top-0 z-10 border-b border-white/5">
        <h1 className="text-center font-semibold text-[15px] mb-4 text-white/90">Classroom</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
             <span className="text-white/40 text-[14px]">🔍</span>
          </div>
          <input 
            type="text" 
            placeholder="Search with course name, course code..." 
            className="w-full bg-[#1C1C1E] text-[13px] rounded-[10px] py-2.5 pl-9 pr-4 text-white placeholder:text-white/40 outline-none"
          />
        </div>
      </div>
      
      {/* Subject List */}
      <div className="px-4 py-2">
        {subjects.map((s, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.01 }}
            className="border-b border-white/[0.08] py-4 pr-1 relative cursor-pointer group"
          >
            <h2 className="text-[14px] text-white/95 font-medium mb-1 tracking-tight">
              {s.name} [{s.code}]
            </h2>
            <p className="text-[11px] text-white/40 uppercase tracking-[0.2px]">
              {s.name.toUpperCase()}-LECTURE (CSE B 2024) - <span className="text-[#3A82F6]">Lecture</span>
            </p>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/60 text-[16px] font-light">
              ›
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function AcademicsView({ data }: { data: DashboardData }) {
  const [mode, setMode] = useState<"attendance"|"exams">("attendance");

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
      {/* Header */}
      <div className="pt-[50px] px-4 pb-3 bg-[#111111] sticky top-0 z-10">
        <div className="flex items-center justify-center relative mb-4 text-white/90">
          <button className="absolute left-0 text-[#F43F5E] text-[14px] font-medium tracking-tight">
            ‹ Back
          </button>
          <h1 className="font-semibold text-[15px]">Academics</h1>
        </div>
        
        {/* Segmented Control */}
        <div className="flex p-0.5 bg-[#1C1C1E] rounded-xl relative">
          <button 
            onClick={() => setMode("attendance")}
            className={`flex-1 py-1.5 text-[12px] font-medium z-10 transition-colors ${mode === "attendance" ? "text-white" : "text-white/40"}`}
          >
            Attendance Records
          </button>
          <button 
            onClick={() => setMode("exams")}
            className={`flex-1 py-1.5 text-[12px] font-medium z-10 transition-colors ${mode === "exams" ? "text-white" : "text-white/40"}`}
          >
            Examination Records
          </button>
          <div 
            className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-[#007AFF] rounded-[10px] transition-all duration-300"
            style={{ left: mode === "attendance" ? "2px" : "calc(50%)" }}
          />
        </div>
      </div>

      {mode === "attendance" ? (
        <div className="px-5 py-2">
          <div className="mb-4">
            <div className="text-[12px] font-medium text-white/70 mb-1 tracking-tight">
              Overall Attendance: <span className="text-white ml-2 text-[13px]">{data.stats.overallPercentage}%</span>
            </div>
            <div className="text-[12px] font-medium text-white/70 tracking-tight">
              Total Session Attended: <span className="text-white ml-2 text-[13px]">{data.stats.totalAttended}/{data.stats.totalClasses}</span>
            </div>
          </div>
          
          <div className="space-y-4 pt-2">
            {data.subjects.map((s, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.03)" }}
                className="flex justify-between items-center py-4 px-4 bg-[#1A1A1C] rounded-[14px] border border-white/5"
              >
                <div className="text-[14px] text-white/90 font-medium tracking-tight max-w-[200px] leading-tight flex-1">
                  {s.name}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/40 font-medium mb-0.5">Attendance</div>
                  <div className="text-[15px] text-white font-semibold">{s.percentage}%</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-5 py-4">
          <div className="space-y-4">
            {data.exams.length === 0 && <div className="text-white/40 text-[13px] text-center mt-10">No examinations found</div>}
            {data.exams.map((e, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.01 }}
                className="flex justify-between items-center py-4 px-4 bg-[#1A1A1C] rounded-[14px] border border-white/5"
              >
                <div>
                  <div className="text-[14px] text-white/90 font-medium tracking-tight mb-1">{e.examName}</div>
                  <div className="text-[11px] text-[#3A82F6]">{e.courseCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/40 font-medium mb-0.5">Marks</div>
                  <div className="text-[15px] text-white font-semibold">{e.marks}/{e.maxMarks}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
