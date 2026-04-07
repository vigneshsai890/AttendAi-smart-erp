"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { finalizeStudentProfile } from "@/lib/identity";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Building2, 
  BookOpen, Sparkles, Loader2, 
  ChevronRight, CheckCircle2,
  Database
} from "lucide-react";
import Magnetic from "@/components/Magnetic";

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
  const user = sessionData?.user as any; // Cast for custom ERP fields
  
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
      router.push("/student/dashboard");
    }
  }, [status, user, router]);

  const handleFinalize = async () => {
    setLoading(true);
    setError("");
    try {
      if (!user?.id) throw new Error("No session found");
      
      const profile = await finalizeStudentProfile(user.id, specialization, department);
      
      // Update the user record via our new API
      const updateRes = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: profile.studentId,
          regId: profile.regId,
          specialization: profile.specialization,
          isProfileComplete: true,
        }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to update profile record");
      }

      // Refresh session to pick up isProfileComplete: true
      router.refresh();

      setResult(profile);
      setStep(3); // Result/Welcome screen
    } catch (err: any) {
      setError(err.message || "Failed to finalize profile");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-white/20 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Matrix */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[640px] z-10"
      >
        <div className="bg-[#0c0c0e]/80 border border-white/5 rounded-[4.5rem] p-12 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden ring-1 ring-white/10">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-10"
              >
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-6 ring-1 ring-white/5">
                    <Sparkles size={10} /> Sequence Initialization
                  </div>
                  <h1 className="text-5xl font-black tracking-tighter italic">CHOOSE YOUR <span className="text-white/20">DOMAIN</span></h1>
                  <p className="text-[14px] text-white/30 font-bold uppercase tracking-wide mt-4">Select your primary academic node to begin synchronization.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEPARTMENTS.map(d => (
                    <button 
                      key={d.code}
                      onClick={() => { setDepartment(d.code); setStep(2); }}
                      className="group p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/20 transition-all text-left relative overflow-hidden active:scale-[0.98]"
                    >
                      <div className="absolute top-0 right-0 p-6 text-white/[0.02] group-hover:text-white/[0.05] transition-all -z-10 group-hover:scale-110">
                        <Building2 size={80} strokeWidth={0.5} />
                      </div>
                      <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2 font-mono">{d.code}</div>
                      <div className="text-[17px] font-black text-white italic leading-tight">{d.name}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <button onClick={() => setStep(1)} className="text-[10px] font-black text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest mb-4">← Back to Nodes</button>
                    <h1 className="text-5xl font-black tracking-tighter italic">NEURAL <span className="text-white/20">LINK</span></h1>
                  </div>
                  <div className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">{department} CLUSTER</div>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] text-white/20 font-black uppercase tracking-[0.4em] mb-6">Select Specialization Node</p>
                  <div className="grid grid-cols-1 gap-3">
                    {SPECIALIZATIONS[department]?.map(s => (
                      <button 
                        key={s}
                        onClick={() => setSpecialization(s)}
                        className={`p-6 rounded-[2rem] border transition-all text-left flex items-center justify-between group ${specialization === s ? "bg-white text-black border-white" : "bg-white/[0.02] border-white/5 hover:border-white/20"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${specialization === s ? "bg-black/5" : "bg-white/5 group-hover:bg-white/10"}`}>
                            <BookOpen size={18} className={specialization === s ? "text-black" : "text-white/30"} />
                          </div>
                          <span className="text-[15px] font-black uppercase tracking-tight italic">{s}</span>
                        </div>
                        {specialization === s && <CheckCircle2 size={20} className="text-black" />}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] font-bold text-center">
                    {error}
                  </div>
                )}

                <Magnetic strength={0.3}>
                  <button 
                    onClick={handleFinalize}
                    disabled={!specialization || loading}
                    className="w-full py-6 rounded-[2.5rem] bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-400 active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <>Finalize ERP Credentials <ChevronRight size={14} /></>}
                  </button>
                </Magnetic>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-12"
              >
                <div className="space-y-4">
                  <div className="w-24 h-24 bg-white text-black rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_30px_60px_rgba(255,255,255,0.15)] rotate-6">
                    <CheckCircle2 size={48} strokeWidth={3} />
                  </div>
                  <h1 className="text-6xl font-black tracking-tighter italic">CREDENTIALS <span className="text-white/20">DEPLOYED</span></h1>
                  <p className="text-[13px] text-white/30 font-bold uppercase tracking-widest">Synchronization complete. Your neural identity is live.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 text-white/[0.02] -z-10 group-hover:scale-110 transition-transform">
                      <GraduationCap size={60} />
                    </div>
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Student ID Node</div>
                    <div className="text-2xl font-mono font-black text-indigo-400 tracking-tighter">{result?.studentId}</div>
                  </div>
                  <div className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 text-white/[0.02] -z-10 group-hover:scale-110 transition-transform">
                      <Database size={60} />
                    </div>
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Registry Hash</div>
                    <div className="text-2xl font-mono font-black text-purple-400 tracking-tighter">{result?.regId}</div>
                  </div>
                </div>

                <div className="pt-8">
                  <Magnetic strength={0.2}>
                    <button 
                      onClick={() => router.push("/student/dashboard")}
                      className="w-full py-6 rounded-[3rem] border border-white/10 hover:bg-white/5 transition-all text-[11px] font-black uppercase tracking-[0.4em] italic"
                    >
                      Enter ERP Environment <ArrowRight className="inline-block ml-2 w-4 h-4" />
                    </button>
                  </Magnetic>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Decorative Glows */}
      <div className="absolute bottom-10 left-10 text-[10px] text-white/5 font-black uppercase tracking-[1em] vertical-text">SECURE PROTOCOL CLONE-7</div>
      <div className="absolute top-10 right-10 text-[10px] text-white/5 font-black uppercase tracking-[1em] vertical-text">D-CAMPUS BACKEND SYNC</div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );
}
