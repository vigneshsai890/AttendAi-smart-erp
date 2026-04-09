"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useSession } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft, Mail, Lock, Phone, GraduationCap, Briefcase } from "lucide-react";

// Floating ambient particles
function Particles() {
  const dots = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      dur: Math.random() * 20 + 15,
      delay: Math.random() * -20,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map(d => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-indigo-500/20 dark:bg-indigo-400/15"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [role, setRole] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [step, setStep] = useState<"SELECT" | "PHONE" | "FORGOT">("SELECT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(err);
  }, [searchParams]);

  // ── Auth handlers (IDENTICAL — no changes) ──────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setTimeout(() => setLoading(false), 500);
    } catch (err: any) {
      setLoading(false);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password")
        setError("Invalid email or password");
      else setError(err.message || "Sign in failed. Please try again.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address first."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Reset link sent! Check your inbox.");
      setTimeout(() => setStep("SELECT"), 3000);
    } catch (err: any) { setError(err.message || "Failed to send reset email."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") setLoading(false);
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as any;
      const userRole = String(user?.role || "").trim().toUpperCase();
      if (!user?.isProfileComplete && userRole !== "FACULTY" && userRole !== "ADMIN") { router.replace("/onboarding"); return; }
      if (userRole === "ADMIN") router.replace("/admin");
      else if (userRole === "FACULTY") router.replace("/faculty/dashboard");
      else router.replace("/student/dashboard");
    } else if (status === "authenticated" && !session?.user && !loading) {
      router.replace("/onboarding");
    }
  }, [status, session, router, loading]);

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("Phone login is temporarily disabled. Please use Email.");
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3.5 rounded-2xl text-[15px] font-medium outline-none transition-all duration-300 border
    bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-white
    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
    ${focused === field
      ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/5"
      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
    }`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-[var(--font-inter)] selection:bg-indigo-500/20 relative">
      <Particles />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center px-6 h-14">
        <div className="w-full max-w-[480px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-900 dark:text-white hover:opacity-70 transition-opacity">
            <div className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="w-3.5 h-3.5 text-white dark:text-zinc-900">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span className="text-sm font-semibold">AttendAI</span>
          </Link>
          <Link href="/signup" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">
            Create account
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6 relative mt-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] z-10"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Sign in to your AttendAI account
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-7 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 relative overflow-hidden"
          >
            {/* Role switcher */}
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl relative mb-7">
              <motion.div
                className="absolute inset-y-1 rounded-xl bg-white dark:bg-zinc-700 shadow-sm"
                animate={{
                  left: role === "STUDENT" ? "4px" : "50%",
                  width: "calc(50% - 4px)",
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
              {[
                { key: "STUDENT" as const, label: "Student", icon: <GraduationCap size={14} /> },
                { key: "FACULTY" as const, label: "Faculty", icon: <Briefcase size={14} /> },
              ].map(r => (
                <button
                  key={r.key}
                  onClick={() => { setRole(r.key); setStep("SELECT"); setShowOtp(false); setError(""); }}
                  className={`relative flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-300 rounded-xl
                    ${role === r.key ? "text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Email login (both roles) */}
              {step === "SELECT" && (
                <motion.div
                  key={`${role}-select`}
                  initial={{ opacity: 0, x: role === "STUDENT" ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: role === "STUDENT" ? 12 : -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-3">
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <input
                          type="email" required
                          placeholder={role === "FACULTY" ? "Faculty email" : "Email or ID"}
                          value={email} onChange={e => setEmail(e.target.value)}
                          onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                          className={`${inputClass("email")} pl-11`}
                        />
                      </div>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <input
                          type="password" required placeholder="Password"
                          value={password} onChange={e => setPassword(e.target.value)}
                          onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
                          className={`${inputClass("pass")} pl-11`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button type="button" onClick={() => { setStep("FORGOT"); setError(""); setSuccess(""); }}
                        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        Forgot password?
                      </button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                      className={`w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50
                        ${role === "FACULTY"
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10 dark:shadow-white/10"
                        }`}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
                    </motion.button>
                  </form>

                  {role === "STUDENT" && (
                    <>
                      <div className="relative flex items-center justify-center py-1">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
                        <span className="relative px-4 text-xs text-zinc-400 bg-white dark:bg-zinc-900 font-medium">or</span>
                      </div>
                      <button onClick={() => setStep("PHONE")}
                        className="w-full py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                        <Phone size={14} /> Use phone number
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* Phone */}
              {step === "PHONE" && (
                <motion.div key="phone" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-4">
                  <form onSubmit={handlePhoneAuth} className="space-y-4">
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input type="tel" required placeholder="Phone Number (+91...)" disabled={showOtp}
                        value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                        onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                        className={`${inputClass("phone")} pl-11 disabled:opacity-50`} />
                    </div>
                    {showOtp && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <input type="text" required placeholder="Verification code"
                          value={otp} onChange={e => setOtp(e.target.value)}
                          className={`${inputClass("otp")} tracking-[0.3em] text-center`} />
                      </motion.div>
                    )}
                    <motion.button whileTap={{ scale: 0.98 }} disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {loading ? <Loader2 size={20} className="animate-spin" /> : showOtp ? "Verify" : "Send code"}
                    </motion.button>
                    <button type="button" onClick={() => setStep("SELECT")}
                      className="w-full text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-center flex items-center justify-center gap-1.5">
                      <ArrowLeft size={14} /> Use email instead
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Forgot */}
              {step === "FORGOT" && (
                <motion.div key="forgot" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-4">
                  <div className="text-center mb-2">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Reset password</h2>
                    <p className="text-sm text-zinc-400 mt-1">We'll send a recovery link to your email.</p>
                  </div>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input type="email" required placeholder="Enter your email"
                        value={email} onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused("reset-email")} onBlur={() => setFocused(null)}
                        className={`${inputClass("reset-email")} pl-11`} />
                    </div>
                    <motion.button whileTap={{ scale: 0.98 }} disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white text-[15px] font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                      {loading ? <Loader2 size={20} className="animate-spin" /> : "Send reset link"}
                    </motion.button>
                    <button type="button" onClick={() => setStep("SELECT")}
                      className="w-full text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-center flex items-center justify-center gap-1.5">
                      <ArrowLeft size={14} /> Back to sign in
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error / Success */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mt-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium text-center">
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
                  className="mt-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium text-center">
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-sm text-zinc-400"
          >
            Don't have an account?{" "}
            <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Create one
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <LoginForm />
    </Suspense>
  );
}
