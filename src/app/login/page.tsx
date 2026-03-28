"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, Mail, Lock, UserCircle2 } from "lucide-react";

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
    if (err === "unauthorized") {
      setError("Please sign in with the correct role to access that page.");
    } else if (err === "AccessDenied") {
      setError("Access Denied. Please check your permissions.");
    }
  }, [searchParams]);

  // Quick Login pre-fill logic
  const handleQuickLogin = async (role: "ADMIN" | "FACULTY" | "STUDENT") => {
    setError("");
    let loginEmail = "";
    let loginPassword = "";
    if (role === "ADMIN") {
      loginEmail = "admin@apollo.edu";
      loginPassword = "admin123";
    } else if (role === "FACULTY") {
      loginEmail = "mehta@apollo.edu";
      loginPassword = "faculty123";
    } else {
      loginEmail = "alex@apollo.edu";
      loginPassword = "student123";
    }
    setEmail(loginEmail);
    setPassword(loginPassword);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
        totp: "",
      });

      if (res?.error === "2FA_REQUIRED") {
        // User has 2FA enabled — show TOTP step
        setStep("TOTP");
      } else if (res?.error) {
        setError("Invalid credentials");
        setStep("CREDENTIALS");
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const userRole = session?.user?.role;
        if (userRole === "ADMIN") router.push("/admin");
        else if (userRole === "FACULTY") router.push("/faculty/dashboard");
        else router.push("/student/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        totp: step === "TOTP" ? totp : "", // Send empty totp to trigger 2FA if they bypass Step 2
      });

      if (res?.error) {
        if (res.error === "2FA_REQUIRED") {
          setStep("TOTP");
        } else {
          setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
          if (step === "TOTP") setStep("CREDENTIALS");
        }
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;
        // Auto-routing based purely on Role
        if (role === "ADMIN") router.push("/admin");
        else if (role === "FACULTY") router.push("/faculty/dashboard");
        else router.push("/student/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
      setStep("CREDENTIALS");
    } finally {
      setLoading(false);
    }
  };

  const QuickCard = ({ role, title, emailLabel }: { role: "ADMIN" | "FACULTY" | "STUDENT", title: string, emailLabel: string }) => (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleQuickLogin(role)}
      className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A]/80 border border-white/5 hover:border-[#F43F5E]/30 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[#F43F5E] group-hover:bg-[#F43F5E]/10 transition-colors">
          <UserCircle2 size={20} />
        </div>
        <div className="text-left">
          <h3 className="text-[14px] font-semibold text-white/90">{title}</h3>
          <p className="text-[11px] text-white/40">{emailLabel}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-white/80 group-hover:bg-white/10 transition-all">
        →
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative flex items-center justify-center p-4 sm:p-6 overflow-hidden font-['Inter',sans-serif]">
      {/* Dynamic 3D Blur Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#F43F5E]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#3B82F6]/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[400px] relative z-10"
      >
        <div className="bg-[#121212]/90 backdrop-blur-xl p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8 relative z-10">
            <motion.div 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F43F5E] to-[#3B82F6] flex items-center justify-center text-white mb-4 shadow-lg shadow-[#F43F5E]/20"
            >
              <ShieldCheck size={28} strokeWidth={2.5} />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              AttendAI Mobile
            </h1>
            <p className="text-[13px] text-white/40">
              Select your university role to proceed
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <AnimatePresence mode="wait">
              {step === "SELECT" && (
                <motion.div 
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  <QuickCard role="STUDENT" title="Student Access" emailLabel="alex@apollo.edu" />
                  <QuickCard role="FACULTY" title="Faculty Portal" emailLabel="mehta@apollo.edu" />
                  <QuickCard role="ADMIN" title="System Admin" emailLabel="admin@apollo.edu" />
                  
                  <div className="pt-4 text-center">
                    <button type="button" onClick={() => setStep("CREDENTIALS")} className="text-[12px] text-white/30 hover:text-white/70 transition-colors">
                      Use separate credentials
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "CREDENTIALS" && (
                <motion.div 
                  key="credentials"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/40 ml-1">Work Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#1A1A1A] border border-white/5 text-white placeholder-white/20 focus:bg-[#202020] focus:border-[#F43F5E]/50 focus:ring-1 focus:ring-[#F43F5E]/30 transition-all outline-none text-[14px]"
                        placeholder="you@apollo.edu"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-white/40 ml-1">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#1A1A1A] border border-white/5 text-white placeholder-white/20 focus:bg-[#202020] focus:border-[#F43F5E]/50 focus:ring-1 focus:ring-[#F43F5E]/30 transition-all outline-none text-[14px]"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="button" onClick={() => setStep("SELECT")}
                    className="w-full text-center py-2 text-[12px] text-white/30 hover:text-white/70 transition-colors"
                  >
                    ← Back to selection
                  </button>
                </motion.div>
              )}

              {step === "TOTP" && (
                <motion.div 
                  key="totp"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-5 text-center"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center mb-2">
                    <ShieldCheck size={28} className="text-[#3B82F6]" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold tracking-tight">Two-Factor Auth</h3>
                    <p className="text-[13px] text-white/40 mt-1">Enter your 6-digit backup code or Authenticator PIN</p>
                  </div>
                  <div className="px-4">
                    <input
                      type="text" required maxLength={6} autoFocus
                      value={totp} onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-4 rounded-xl bg-[#1A1A1A] border border-white/10 text-white focus:bg-[#202020] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/30 transition-all outline-none text-center tracking-[0.5em] font-mono text-2xl font-bold"
                      placeholder="000000"
                    />
                  </div>
                  <button
                    type="button" onClick={() => setStep("SELECT")}
                    className="text-[12px] text-white/30 hover:text-white/70 transition-colors"
                  >
                    ← Cancel login
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 text-[#F43F5E] text-[13px] font-medium text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {step !== "SELECT" && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-black text-[14px] font-semibold tracking-[-0.2px] hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Verifying..." : step === "CREDENTIALS" ? "Continue to 2FA" : "Secure Sign In"}
              </motion.button>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
      <LoginForm />
    </Suspense>
  );
}
