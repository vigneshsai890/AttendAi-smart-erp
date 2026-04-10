"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, getAuthToken } from "@/components/AuthProvider";
import { finalizeStudentProfile } from "@/lib/identity";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Building2,
  BookOpen, Sparkles, Loader2,
  ChevronRight, CheckCircle2,
  Database, Briefcase, UserCircle2, ShieldCheck, ChevronLeft
} from "lucide-react";

const DEPARTMENTS = [
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "ECE", name: "Electronics & Comm Engineering" },
  { code: "MECH", name: "Mechanical Engineering" },
  { code: "CIVIL", name: "Civil Engineering" },
];

const SPECIALIZATIONS: Record<string, string[]> = {
  CSE: ["Artificial Intelligence & ML", "Cyber Security", "Data Science", "Cloud Computing"],
  ECE: ["VLSI Design", "Embedded Systems", "Signal Processing"],
  MECH: ["Robotics", "Automobile", "Manufacturing"],
  CIVIL: ["Structural Engineering", "Urban Planning"],
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: sessionData, status } = useSession();
  const sessionLoading = status === "loading";
  const user = sessionData?.user as any;

  const [step, setStep] = useState(1);
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signup");
    }
    if (user?.isProfileComplete) {
      if (user?.role === "FACULTY") {
        router.push("/faculty/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    }
  }, [status, user, router]);

  const handleFacultyFinalize = async () => {
    setLoading(true);
    setError("");
    try {
      const authToken = await getAuthToken();
      if (!authToken) throw new Error("Authentication token not available. Please log in again.");
      if (!user?.id) throw new Error("No session found. Please log in again.");

      const updateRes = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          isProfileComplete: true,
        }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update profile record");
      }

      router.refresh();
      router.push("/faculty/dashboard");
    } catch (err: any) {
      console.error("[ONBOARD] Error:", err);
      setError(err.message || "Failed to finalize profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    setError("");
    try {
      const authToken = await getAuthToken();
      if (!authToken) throw new Error("Authentication token not available. Please log in again.");
      if (!user?.id) throw new Error("No session found. Please log in again.");

      const profile = await finalizeStudentProfile(user.id, specialization, department, authToken);

      const updateRes = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          studentId: profile.studentId,
          regId: profile.regId,
          specialization: profile.specialization,
          isProfileComplete: true,
        }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update profile record");
      }

      router.refresh();
      setResult(profile);
      setStep(3);
    } catch (err: any) {
      console.error("[ONBOARD] Error:", err);
      setError(err.message || "Failed to finalize profile");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full mb-4" />
      <p className="text-sm font-medium animate-pulse">Initializing setup...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans">

      {/* Top Navigation Bar */}
      <header className="p-6 md:p-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-white dark:text-zinc-900" />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">AttendAI<span className="text-zinc-400">.</span></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <UserCircle2 size={16} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{user?.name}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 pb-20">

        {/* Background Grid Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" className="text-zinc-900 dark:text-white" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[600px] z-10"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 relative overflow-hidden">

            <AnimatePresence mode="wait">
              {/* --- FACULTY BYPASS --- */}
              {user?.role === "FACULTY" && (
                <motion.div
                  key="faculty-welcome"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8"
                >
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Briefcase size={36} strokeWidth={2.5} />
                  </div>

                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">Welcome, Faculty</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mx-auto">
                      Your account has been successfully provisioned. You can now start managing classes, generating attendance sessions, and tracking student performance.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleFacultyFinalize}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>Enter Faculty Dashboard <ChevronRight size={18} /></>}
                  </button>
                </motion.div>
              )}

              {/* --- STUDENT STEP 1: DEPARTMENT --- */}
              {user?.role !== "FACULTY" && step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-6">
                      <Sparkles size={14} /> Step 1 of 2
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">Select Department</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Choose your primary academic department to proceed.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DEPARTMENTS.map(d => (
                      <button
                        key={d.code}
                        onClick={() => { setDepartment(d.code); setStep(2); }}
                        className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all text-center relative overflow-hidden"
                      >
                        <Building2 size={32} className="text-zinc-400 dark:text-zinc-500 mb-4 group-hover:text-indigo-500 transition-colors" strokeWidth={1.5} />
                        <span className="text-sm font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{d.code}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 px-2">{d.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* --- STUDENT STEP 2: SPECIALIZATION --- */}
              {user?.role !== "FACULTY" && step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6">
                      <ChevronLeft size={14} /> Back to Departments
                    </button>
                    <div className="flex items-center justify-between mb-3">
                      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Specialization</h1>
                      <div className="px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-500">{department}</div>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Select your specialization to complete registration.</p>
                  </div>

                  <div className="space-y-3">
                    {SPECIALIZATIONS[department]?.map(s => (
                      <button
                        key={s}
                        onClick={() => setSpecialization(s)}
                        className={`w-full p-5 rounded-2xl border transition-all text-left flex items-center justify-between group
                          ${specialization === s
                            ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-md"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <BookOpen size={18} className={specialization === s ? "text-white dark:text-zinc-900" : "text-zinc-400"} />
                          <span className="text-sm font-bold">{s}</span>
                        </div>
                        {specialization === s && <CheckCircle2 size={18} className="text-white dark:text-zinc-900" />}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleFinalize}
                    disabled={!specialization || loading}
                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>Finalize Enrollment <ChevronRight size={18} /></>}
                  </button>
                </motion.div>
              )}

              {/* --- STUDENT STEP 3: SUCCESS --- */}
              {user?.role !== "FACULTY" && step === 3 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-10"
                >
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <ShieldCheck size={36} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Registration Complete</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">Your academic profile has been successfully generated.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 text-zinc-100 dark:text-zinc-800 -z-10 group-hover:scale-110 transition-transform">
                        <GraduationCap size={48} />
                      </div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Student ID</div>
                      <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{result?.studentId}</div>
                    </div>
                    <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 text-zinc-100 dark:text-zinc-800 -z-10 group-hover:scale-110 transition-transform">
                        <Database size={48} />
                      </div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Registry Hash</div>
                      <div className="text-xl font-black text-zinc-900 dark:text-white tracking-tight line-clamp-1">{result?.regId}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push("/student/dashboard")}
                    className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all font-bold shadow-lg flex items-center justify-center gap-2"
                  >
                    Go to Dashboard <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}