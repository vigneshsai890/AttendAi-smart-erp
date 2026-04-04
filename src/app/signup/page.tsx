"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Mail, Phone,
  ArrowRight, Loader2,
  CheckCircle2, AlertCircle
} from "lucide-react";
import Magnetic from "@/components/Magnetic";

export default function SignupPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/onboarding",
      });
      if (signUpError) setError(signUpError.message || "Signup failed");
      else router.push("/onboarding");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!showOtp) {
        const { error: sendError } = await authClient.phoneNumber.sendOtp({
          phoneNumber,
        });
        if (sendError) {
          setError(sendError.message || "Failed to send OTP");
        } else {
          setShowOtp(true);
        }
      } else {
        const { error: verifyError } = await authClient.signUp.phoneNumber({
          phoneNumber,
          code: otp,
          password,
          name,
          callbackURL: "/onboarding",
        });
        if (verifyError) {
          setError(verifyError.message || "Verification failed");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Neural Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="bg-[#0c0c0e]/80 border border-white/10 rounded-[3.5rem] p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic">NEURAL SIGNUP</h1>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mt-3 font-mono">AttendAI · Smart ERP Node</p>
          </div>

          {/* Form Node */}
          <form onSubmit={method === "EMAIL" ? handleEmailSignup : handlePhoneSignup} className="space-y-4">
            <AnimatePresence mode="wait">
              {method === "EMAIL" ? (
                <motion.div 
                  key="email-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input 
                      type="text" required placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[13px] placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all font-medium"
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="email" required placeholder="Email Cluster" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[13px] placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all font-medium"
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="password" required placeholder="Access Code" value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[13px] placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all font-medium"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="phone-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  {!showOtp ? (
                    <>
                      <div className="relative">
                        <input 
                          type="text" required placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                          className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[13px] placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all font-medium"
                        />
                      </div>
                      <div className="relative">
                        <input 
                          type="tel" required placeholder="Mobile Endpoint (+...)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                          className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[13px] placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all font-medium"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-indigo-400" />
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest tracking-tighter truncate">OTP Sent to {phoneNumber}</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="text" required placeholder="Neural OTP" value={otp} onChange={e => setOtp(e.target.value)}
                          className="w-full px-6 py-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <input 
                          type="password" required placeholder="Set Access Key" value={password} onChange={e => setPassword(e.target.value)}
                          className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[13px] placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-all font-medium"
                        />
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
                <AlertCircle size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
              </div>
            )}

            <Magnetic strength={0.3}>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-[2rem] bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-6"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : showOtp ? "INITIALIZE NODE" : "CONTINUE SYNC"}
                {!loading && <ArrowRight size={14} />}
              </button>
            </Magnetic>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
              Already Synced? <button onClick={() => router.push("/login")} className="text-white hover:text-indigo-400 transition-colors">LOGIN TERMINAL</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
