"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, TrendingUp, AlertCircle, CheckCircle2, BookOpen } from "lucide-react";

interface Student {
  userId: string;
  rollNumber: string;
  name: string;
  percentage: number;
}

interface Subject {
  id?: string;
  name: string;
  attended: number;
  total: number;
  percentage: number;
}

interface StudentDrawerProps {
  student: Student | null;
  onClose: () => void;
  // subjects per student — passed from parent if available, otherwise derived from percentage
  subjects?: Subject[];
}

// Calculate classes needed to reach 75%
// Formula: if attended/total < 0.75, need x more classes where (attended+x)/(total+x) = 0.75
// => x = (0.75*total - attended) / (1 - 0.75) = (0.75*total - attended) / 0.25
function classesNeeded(attended: number, total: number, target = 75): number {
  if (total === 0) return 0;
  const pct = (attended / total) * 100;
  if (pct >= target) return 0;
  const needed = Math.ceil((target * total - 100 * attended) / (100 - target));
  return Math.max(0, needed);
}

// Animated ring
function AttendanceRing({ percentage, size = 80 }: { percentage: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const color = percentage >= 75 ? "#22c55e" : percentage >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="currentColor" strokeWidth="6"
          className="text-zinc-100 dark:text-zinc-800" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * percentage) / 100 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{percentage}%</span>
      </div>
    </div>
  );
}

export default function StudentDrawer({ student, onClose, subjects }: StudentDrawerProps) {
  // If no per-subject breakdown is available from backend, show aggregate only
  const hasSubjects = subjects && subjects.length > 0;

  return (
    <AnimatePresence>
      {student && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{student.name}</p>
                  <p className="text-xs text-zinc-400 font-mono">{student.rollNumber}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Overall ring + status */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 flex items-center gap-5">
                <AttendanceRing percentage={student.percentage} size={80} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Overall Attendance</p>
                  <p className={`text-2xl font-bold tabular-nums ${
                    student.percentage >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                    student.percentage >= 60 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-600 dark:text-red-400"
                  }`}>
                    {student.percentage}%
                  </p>
                  <div className={`inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    student.percentage >= 75
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                      : student.percentage >= 60
                      ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                      : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                  }`}>
                    {student.percentage >= 75
                      ? <><CheckCircle2 size={10} /> On track</>
                      : student.percentage >= 60
                      ? <><AlertCircle size={10} /> At risk</>
                      : <><AlertCircle size={10} /> Critical</>
                    }
                  </div>
                </div>
              </div>

              {/* Classes needed calculator */}
              {student.percentage < 75 && hasSubjects && (
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
                  <div className="flex items-start gap-2.5">
                    <TrendingUp size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-2">
                        To reach 75% in each subject:
                      </p>
                      <div className="space-y-1.5">
                        {subjects!
                          .filter(s => s.percentage < 75)
                          .map((s, i) => {
                            const needed = classesNeeded(s.attended, s.total);
                            return (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-amber-800 dark:text-amber-400 truncate max-w-[160px]">{s.name}</span>
                                <span className="font-semibold text-amber-900 dark:text-amber-300 ml-2 shrink-0">
                                  {needed === 0 ? "✓ OK" : `${needed} more class${needed === 1 ? "" : "es"}`}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aggregate classes needed if no per-subject data */}
              {student.percentage < 75 && !hasSubjects && (
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4">
                  <div className="flex items-start gap-2.5">
                    <TrendingUp size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      This student needs to attend consecutive classes to recover their attendance above 75%.
                      Contact them before the next assessment.
                    </p>
                  </div>
                </div>
              )}

              {/* Subject breakdown */}
              {hasSubjects && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={13} className="text-zinc-400" />
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Subject Breakdown
                    </p>
                  </div>
                  <div className="space-y-3">
                    {subjects!.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl p-3.5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[180px]">{s.name}</p>
                          <span className={`text-sm font-bold tabular-nums shrink-0 ${
                            s.percentage >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                            s.percentage >= 60 ? "text-amber-600 dark:text-amber-400" :
                            "text-red-600 dark:text-red-400"
                          }`}>
                            {s.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden mb-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.15 + i * 0.05, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              s.percentage >= 75 ? "bg-emerald-500" :
                              s.percentage >= 60 ? "bg-amber-500" : "bg-red-500"
                            }`}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-zinc-400">{s.attended} / {s.total} classes</p>
                          {s.percentage < 75 && (
                            <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              {classesNeeded(s.attended, s.total)} needed
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Faculty action tip */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-700">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Recommended action</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {student.percentage >= 75
                    ? "Student is on track. Continue monitoring."
                    : student.percentage >= 60
                    ? "Send an attendance warning. Encourage them to attend all remaining classes."
                    : "Escalate to department coordinator. Student is at serious risk of failing attendance criteria."}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
