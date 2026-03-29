"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"SELECT" | "CREDENTIALS" | "TOTP">("SELECT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "unauthorized") setError("Please sign in with the correct role.");
    else if (err === "AccessDenied") setError("Access Denied.");
  }, [searchParams]);

  const doLogin = async (loginEmail: string, loginPassword: string, loginTotp = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        redirect: false, email: loginEmail, password: loginPassword, totp: loginTotp,
      });
      if (res?.error === "2FA_REQUIRED") {
        setStep("TOTP");
      } else if (res?.error) {
        setError("Invalid credentials");
        setStep("CREDENTIALS");
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
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-5 font-['Inter',sans-serif]">
      {/* Ambient light */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[380px]"
      >
        <div className="bg-[#0f0f13] border border-white/[0.06] rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">AttendAI</h1>
            <p className="text-[13px] text-white/40 mt-1">Smart Attendance System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {step === "SELECT" && (
                <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                  {[
                    { role: "FACULTY" as const, label: "Faculty", sub: "vignesh@apollo.edu", icon: "👨‍🏫" },
                    { role: "STUDENT" as const, label: "Student", sub: "vignesh.s@apollo.edu", icon: "🎓" },
                    { role: "ADMIN" as const, label: "Admin", sub: "admin@apollo.edu", icon: "⚙️" },
                  ].map((r) => (
                    <button
                      key={r.role} type="button" onClick={() => handleQuickLogin(r.role)}
                      disabled={loading}
                      className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left group disabled:opacity-50"
                    >
                      <span className="text-lg">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-white/90">{r.label}</div>
                        <div className="text-[11px] text-white/35 truncate">{r.sub}</div>
                      </div>
                      <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                  <div className="pt-3 text-center">
                    <button type="button" onClick={() => setStep("CREDENTIALS")} className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
                      Use custom credentials
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "CREDENTIALS" && (
                <motion.div key="creds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/25 focus:border-violet-500/40 outline-none transition-all"
                    placeholder="Email" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/25 focus:border-violet-500/40 outline-none transition-all"
                    placeholder="Password" />
                  <button type="button" onClick={() => setStep("SELECT")} className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
                    ← Back
                  </button>
                </motion.div>
              )}

              {step === "TOTP" && (
                <motion.div key="totp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-center">
                  <div>
                    <h3 className="text-white text-[15px] font-semibold">Two-Factor Auth</h3>
                    <p className="text-[12px] text-white/40 mt-1">Enter your 6-digit code</p>
                  </div>
                  <input type="text" required maxLength={6} autoFocus
                    value={totp} onChange={e => setTotp(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-center tracking-[0.4em] font-mono text-xl font-bold focus:border-violet-500/40 outline-none transition-all"
                    placeholder="000000" />
                  <button type="button" onClick={() => setStep("SELECT")} className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
                    ← Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] text-center">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {step !== "SELECT" && (
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            )}
          </form>
        </div>
      </motion.div>

      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <LoginForm />
    </Suspense>
  );
}
