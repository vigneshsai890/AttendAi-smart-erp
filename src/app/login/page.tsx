"use client";

import { useState, useEffect, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Magnetic from "@/components/Magnetic";
import { 
  ShieldCheck, Mail, Lock, 
  Loader2, Chrome, Apple, Phone,
  ShieldAlert, Fingerprint
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [step, setStep] = useState<"SELECT" | "PHONE">("SELECT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(err);
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid credentials");
      } else {
        await handleAuthSuccess();
      }
    } catch {
      setError("Connect protocol failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/onboarding",
      });
    } catch {
      setError(`Failed to bridge with ${provider}`);
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!showOtp) {
        const { error: sendError } = await authClient.phoneNumber.sendOtp({ phoneNumber });
        if (sendError) setError(sendError.message || "Failed to send code");
        else setShowOtp(true);
      } else {
        const { error: verifyError } = await authClient.phoneNumber.verify({ 
          phoneNumber, 
          code: otp 
        });
        if (verifyError) setError(verifyError.message || "Verification failed");
        else await handleAuthSuccess();
      }
    } catch {
      setError("Mobile sync protocol failure");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    const { data: session } = await authClient.getSession();
    const userPayload = session?.user as any;
    if (!userPayload?.isProfileComplete && userPayload?.role === "STUDENT") {
      router.push("/onboarding");
    } else {
      const userRole = userPayload?.role;
      if (userRole === "ADMIN") router.push("/admin");
      else if (userRole === "FACULTY") router.push("/faculty/dashboard");
      else router.push("/student/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-['Inter',sans-serif] relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="bg-[#0c0c0e]/80 border border-white/[0.05] rounded-[4rem] p-10 pt-12 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-white/10">
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-6 rounded-[22px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 border border-white/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-widest uppercase italic">AttendAI</h1>
            <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.6em] mt-3 font-mono">Industry Grade ERP Gateway</p>
            
            {/* Identity Switcher - Industry Grade Segmented Control */}
            <div className="mt-10 flex p-1.5 bg-white/[0.02] border border-white/5 rounded-3xl relative">
              <motion.div
                className="absolute inset-y-1.5 rounded-2xl bg-gradient-to-br from-white/[0.1] to-white/[0.05] border border-white/10 shadow-2xl"
                animate={{ 
                  left: role === "STUDENT" ? "6px" : "50%",
                  width: "calc(50% - 6px)"
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
              />
              <button 
                onClick={() => { setRole("STUDENT"); setStep("SELECT"); setShowOtp(false); }}
                className={`relative flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${role === "STUDENT" ? "text-white" : "text-white/20 hover:text-white/40"}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Academic Hub</span>
                </div>
              </button>
              <button 
                onClick={() => { setRole("FACULTY"); setStep("SELECT"); setShowOtp(false); }}
                className={`relative flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${role === "FACULTY" ? "text-white" : "text-white/20 hover:text-white/40"}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Admin Console</span>
                </div>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {role === "STUDENT" && step === "SELECT" && (
              <motion.div
                key="student-select"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="flex gap-4">
                  {[
                    { id: "google" as const, icon: <Chrome size={22} />, label: "Google" },
                    { id: "apple" as const, icon: <Apple size={22} />, label: "Apple" },
                    { id: "phone" as const, icon: <Phone size={22} />, label: "Mobile" },
                  ].map((btn) => (
                    <Magnetic key={btn.id} strength={0.2}>
                      <button 
                        onClick={() => btn.id === "phone" ? setStep("PHONE") : handleSocial(btn.id as "google" | "apple")}
                        className="flex-1 p-6 rounded-[2.2rem] bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-2 group"
                      >
                        <div className="text-white/20 group-hover:text-white transition-colors">{btn.icon}</div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/10 group-hover:text-white/40">{btn.label}</span>
                      </button>
                    </Magnetic>
                  ))}
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.03]"></div></div>
                  <div className="relative flex justify-center text-[8px] uppercase tracking-[0.8em] font-black text-white/10">Neural Access Node</div>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div className="grid gap-4">
                    <div className="relative group">
                      <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="email" required placeholder="Academic Signal (Email)" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] text-white text-[13px] placeholder:text-white/20 focus:border-indigo-500/30 outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="password" required placeholder="Neural Key (Password)" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] text-white text-[13px] placeholder:text-white/20 focus:border-indigo-500/30 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <button disabled={loading} className="w-full py-6 rounded-[3rem] bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Student Sync"}
                  </button>
                </form>
              </motion.div>
            )}

            {role === "FACULTY" && (
              <motion.div
                key="faculty-login"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="space-y-8"
              >
                <div className="text-center p-8 border border-white/5 bg-white/[0.01] rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all duration-1000" />
                  <Fingerprint size={32} className="mx-auto mb-4 text-white/5 group-hover:text-indigo-400/20 transition-all" />
                  <p className="relative text-[10px] text-white/20 font-black uppercase tracking-[0.4em] leading-relaxed px-4">
                    University Authorization Required
                  </p>
                  <p className="relative text-[8px] text-white/10 font-bold uppercase tracking-[0.2em] mt-3">
                    Provide secure credentials to link your workstation
                  </p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div className="grid gap-4">
                    <div className="relative group">
                      <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type="email" required placeholder="Faculty Registry ID (Email)" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] text-white text-[13px] placeholder:text-white/20 focus:border-purple-500/30 outline-none transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type="password" required placeholder="University Access Pin" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full pl-16 pr-8 py-6 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] text-white text-[13px] placeholder:text-white/20 focus:border-purple-500/30 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button disabled={loading} className="w-full py-6 rounded-[3rem] bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-black uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(99,102,241,0.2)] flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize Node Access"}
                  </button>
                </form>
              </motion.div>
            )}

            {step === "PHONE" && (
              <motion.div
                key="phone-sync"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 text-center">
                   <p className="text-[9px] text-indigo-300 font-black uppercase tracking-[0.4em]">SMS Sync Terminal</p>
                </div>
                
                <div className="relative group">
                  <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="tel" required placeholder="+Mobile Protocol Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full pl-16 pr-8 py-6 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 outline-none focus:border-indigo-500/30 transition-all"
                  />
                </div>
                
                {showOtp && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                    <ShieldCheck size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400" />
                    <input
                      type="text" required placeholder="Verification Signal (OTP)" value={otp} onChange={e => setOtp(e.target.value)}
                      className="w-full pl-16 pr-8 py-6 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/20 text-white text-[13px] placeholder:text-white/20 outline-none transition-all"
                    />
                  </motion.div>
                )}
                
                <button onClick={handlePhoneAuth} disabled={loading} className="w-full py-6 rounded-[2.5rem] bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] transition-all shadow-2xl flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : showOtp ? "Verify Signal" : "Send SMS Sync"}
                </button>
                
                <button onClick={() => setStep("SELECT")} className="w-full text-[9px] font-black text-white/10 hover:text-white transition-colors uppercase tracking-[0.5em] italic">
                  ← Return to selection
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-[2.5rem] bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-black text-center uppercase tracking-widest leading-relaxed flex items-center justify-center gap-3"
              >
                <ShieldAlert size={16} />
                <span>SYNC ERROR: {error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-12 pt-8 border-t border-white/[0.03] text-center space-y-6">
            <p className="text-[9px] text-white/10 font-black tracking-[0.6em] uppercase">
              First Signal? <button onClick={() => router.push("/signup")} className="text-white/40 hover:text-indigo-400 transition-colors hover:underline underline-offset-4 decoration-indigo-500/30">Establish Identity</button>
            </p>
            
            <div className="flex items-center justify-center gap-3 text-white/[0.05]">
              <ShieldCheck size={12} />
              <span className="text-[7px] font-black uppercase tracking-[0.3em]">End-to-End Encrypted Neural Protocol</span>
            </div>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 gap-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_50px_rgba(99,102,241,0.2)]" />
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 w-6 h-6" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-white text-[12px] font-black uppercase tracking-[0.8em] animate-pulse">Syncing...</span>
            <span className="text-white/20 text-[8px] font-bold uppercase tracking-[0.4em]">Bridging secure identity node</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <LoginForm />
    </Suspense>
  );
}
