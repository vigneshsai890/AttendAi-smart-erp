"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Magnetic from "@/components/Magnetic";
import { ShieldCheck, Mail, Lock, ChevronRight, ArrowLeft, Loader2, User, GraduationCap, Settings } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"SELECT" | "CREDENTIALS" | "TOTP">("SELECT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "unauthorized") setError("Please sign in with the correct role.");
    else if (err === "AccessDenied") setError("Access Denied.");
  }, [searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "TOTP" && otpTimer > 0) {
      timer = setInterval(() => setOtpTimer(p => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimer]);

  const resendOtp = async () => {
    setOtpTimer(30);
    await doLogin(email, password);
  };

  const doLogin = async (loginEmail: string, loginPassword: string, loginOtp = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
        totp: loginOtp,
      });

      if (res?.error === "OTP_REQUIRED" || res?.error?.includes("OTP_REQUIRED")) {
        setStep("TOTP");
        setOtpTimer(30);
      } else if (res?.error) {
        console.log("[LOGIN] Signin error:", res.error);
        setError(res.error === "CredentialsSignin" ? "Invalid credentials" : res.error);
      } else {
        const s = await fetch("/api/auth/session").then(r => r.json());
        const role = s?.user?.role;
        if (role === "ADMIN") router.push("/admin");
        else if (role === "FACULTY") router.push("/faculty/dashboard");
        else router.push("/student/dashboard");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: "ADMIN" | "FACULTY" | "STUDENT") => {
    let e = "", p = "";
    if (role === "ADMIN") { e = "admin@apollo.edu"; p = "admin123"; }
    else if (role === "FACULTY") { e = "vignesh@apollo.edu"; p = "faculty123"; }
    else { e = "vignesh.s@apollo.edu"; p = "student123"; }
    setEmail(e); setPassword(p);
    doLogin(e, p);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(email, password, step === "TOTP" ? totp : "");
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-['Inter',sans-serif] relative overflow-hidden">
      {/* Vengance UI Aesthetic Glows */}
      <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/[0.08] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-300px] left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/[0.05] rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="bg-[#0c0c0e]/80 border border-white/[0.08] rounded-[3rem] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">

          {/* Decorative element */}
          <div className="absolute top-0 right-0 p-8 text-white/[0.02] -z-10">
            <ShieldCheck size={200} strokeWidth={0.5} />
          </div>

          {/* Logo & Header */}
          <div className="text-center mb-10">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 mx-auto mb-6 rounded-[22px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 border border-white/20"
            >
              <ShieldCheck className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">AttendAI</h1>
            <p className="text-[11px] text-white/30 font-black uppercase tracking-[0.3em] mt-2 font-mono">Smart ERP Gateway</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === "SELECT" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest text-center mb-6">Authorize via Entity Role</p>
                  {[
                    { role: "FACULTY" as const, label: "Faculty Portal", sub: "vignesh@apollo.edu", icon: <User size={18} /> },
                    { role: "STUDENT" as const, label: "Student Terminal", sub: "vignesh.s@apollo.edu", icon: <GraduationCap size={18} /> },
                    { role: "ADMIN" as const, label: "Admin Core", sub: "admin@apollo.edu", icon: <Settings size={18} /> },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handleQuickLogin(r.role)}
                      disabled={loading}
                      className="w-full flex items-center gap-5 p-5 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all text-left group disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all border border-white/5">
                        {r.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-black text-white/90 tracking-tight">{r.label}</div>
                        <div className="text-[10px] text-white/25 truncate font-mono">{r.sub}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                  <div className="pt-6 text-center">
                    <button type="button" onClick={() => setStep("CREDENTIALS")} className="text-[10px] font-black text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest">
                      Custom Secure Link
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "CREDENTIALS" && (
                <motion.div
                  key="creds"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-indigo-400 transition-colors">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-all shadow-inner"
                        placeholder="Neural ID (Email)"
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center text-white/20 group-focus-within:text-indigo-400 transition-colors">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-[1.5rem] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-all shadow-inner"
                        placeholder="Access Key"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <button type="button" onClick={() => setStep("SELECT")} className="flex items-center gap-2 text-[10px] font-black text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest">
                      <ArrowLeft size={12} /> Return
                    </button>
                    <button type="button" className="text-[10px] font-black text-indigo-400/60 hover:text-indigo-400 transition-colors uppercase tracking-widest">
                      Forgot?
                    </button>
                  </div>

                  <Magnetic strength={0.2}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-4 py-5 rounded-[2rem] bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-white/90 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authenticate"}
                    </button>
                  </Magnetic>
                </motion.div>
              )}

              {step === "TOTP" && (
                <motion.div
                  key="totp"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-8 text-center"
                >
                  <div className="space-y-3">
                    <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                      <Mail className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-white text-xl font-black tracking-tight uppercase italic">Neural Sync</h3>
                    <p className="text-[11px] text-white/30 font-medium px-4 leading-relaxed">
                      Verification code transmitted to <span className="text-white/70 font-bold">{email}</span>. Decrypt and input below.
                    </p>
                  </div>

                  <div className="relative group">
                    <input
                      type="text" required maxLength={6} autoFocus
                      value={totp}
                      onChange={e => setTotp(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-6 rounded-[2rem] bg-white/[0.04] border border-white/[0.08] text-white text-center tracking-[0.5em] font-mono text-4xl font-black focus:border-indigo-500/60 focus:bg-white/[0.06] outline-none transition-all shadow-inner"
                      placeholder="••••••"
                    />
                  </div>

                  <div className="flex flex-col gap-5">
                    <Magnetic strength={0.2}>
                      <button
                        type="submit"
                        disabled={loading || totp.length !== 6}
                        className="w-full py-5 rounded-[2.5rem] bg-white text-black text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_25px_50px_rgba(255,255,255,0.2)]"
                      >
                        {loading ? "Decrypting..." : "Verify & Connect"}
                      </button>
                    </Magnetic>

                    <div className="flex justify-between items-center px-2">
                      <button type="button" onClick={() => setStep("CREDENTIALS")} className="text-[10px] font-black text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest">
                        ← Re-Link
                      </button>

                      <button
                        type="button"
                        disabled={otpTimer > 0 || loading}
                        onClick={resendOtp}
                        className={`text-[10px] font-black transition-colors uppercase tracking-widest ${otpTimer > 0 ? "text-white/10 cursor-not-allowed" : "text-indigo-400 hover:text-indigo-300"}`}
                      >
                        {otpTimer > 0 ? `Retry in ${otpTimer}s` : "Resend"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold text-center flex items-center justify-center gap-2"
                >
                  <Loader2 className="w-3 h-3 rotate-45" /> {error}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>

      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-4">
          <div className="w-10 h-10 border-[3px] border-white/10 border-t-white rounded-full animate-spin" />
          <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] font-mono animate-pulse">Establishing Secure Neural Link</span>
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
