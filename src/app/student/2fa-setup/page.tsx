"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Background from "@/components/Background";
import Magnetic from "@/components/Magnetic";
import { ShieldCheck, Lock, Smartphone, RefreshCcw, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function TwoFactorSetup() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const generateSecret = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCodeImage);
        setSecret(data.secret);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to generate 2FA secret");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/student/dashboard");
        }, 2000);
      } else {
        setError(data.error || "Invalid Token");
      }
    } catch {
      setError("Failed to verify code");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <Background />

      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        <div className="bg-[#0c0c0e]/60 border border-white/[0.05] rounded-[4rem] p-12 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] relative overflow-hidden ring-1 ring-white/10">

          {/* Internal Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="absolute top-0 right-0 p-8 text-white/[0.02] -z-10 group-hover:opacity-10 transition-opacity duration-700">
            <ShieldCheck size={240} strokeWidth={0.5} />
          </div>

          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-20 h-20 mx-auto mb-6 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all duration-700 ${
                success ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
              }`}
            >
              {success ? (
                <CheckCircle2 size={40} className="text-white animate-in zoom-in duration-500" />
              ) : (
                <Lock size={36} className="text-white" />
              )}
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              {success ? "Identity Secured" : "Neural Shield"}
            </h1>
            <p className="text-[11px] text-white/30 font-black uppercase tracking-[0.3em] mt-2 font-mono">
              {success ? "Cryptographic Link Established" : "Multi-Factor Authentication Setup"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!qrCode && !success && (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 text-center">
                  <p className="text-sm font-bold text-white/40 leading-relaxed italic">
                    "Elevate your account security by linking a physical authenticator terminal. This protocol enforces identity persistence across all neural nodes."
                  </p>
                </div>

                <Magnetic strength={0.2}>
                  <button
                    onClick={generateSecret}
                    disabled={loading}
                    className="w-full py-6 rounded-[3rem] bg-white text-black text-[13px] font-black uppercase tracking-[0.4em] shadow-[0_30px_70px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-[0.98] transition-all ring-1 ring-white/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <RefreshCcw size={16} className="animate-spin" />
                    ) : (
                      <>Initialize Shield</>
                    )}
                  </button>
                </Magnetic>
              </motion.div>
            )}

            {qrCode && !success && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="text-center space-y-6">
                  <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] leading-relaxed max-w-sm mx-auto">
                    Scan the neural matrix with your mobile terminal (Google Auth, Authy, etc.)
                  </p>

                  <div className="inline-block p-8 bg-white rounded-[3.5rem] shadow-[0_0_100px_rgba(255,255,255,0.15)] relative overflow-hidden group ring-1 ring-white/20">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1500 z-10" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="2FA QR Code" className="w-[200px] h-[200px] relative z-0" />
                  </div>

                  <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 group/secret relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.03] to-transparent opacity-0 group-hover/secret:opacity-100 transition-opacity" />
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] mb-2 relative z-10">Manual Cipher Key</p>
                    <code className="text-sm text-indigo-400 font-mono font-black tracking-[0.3em] relative z-10">{secret}</code>
                  </div>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-6 flex items-center text-white/20 group-focus-within/input:text-indigo-400 transition-colors">
                      <Smartphone size={18} />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={token}
                      onChange={e => setToken(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-white/[0.04] border border-white/10 text-white tracking-[0.5em] font-mono text-2xl font-black focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-all shadow-inner ring-1 ring-white/5"
                      placeholder="••••••"
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold text-center flex items-center justify-center gap-2"
                      >
                        <AlertTriangle size={14} /> {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Magnetic strength={0.2}>
                    <button
                      type="submit"
                      disabled={verifying || token.length !== 6}
                      className="w-full py-6 rounded-[3rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[13px] font-black uppercase tracking-[0.4em] shadow-[0_30px_70px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 ring-1 ring-white/10 flex items-center justify-center gap-3"
                    >
                      {verifying ? (
                        <RefreshCcw size={16} className="animate-spin" />
                      ) : (
                        <>Verify & Activate</>
                      )}
                    </button>
                  </Magnetic>
                </form>
              </motion.div>
            )}

            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="space-y-6">
                  <div className="p-8 rounded-[3rem] bg-emerald-500/[0.03] border border-emerald-500/10">
                    <p className="text-sm font-bold text-white/60 leading-relaxed italic">
                      "Perimeter secured. Your digital footprint is now anchored to the neural decentralized registry."
                    </p>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden ring-1 ring-white/5">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "linear" }}
                      className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]"
                    />
                  </div>
                  <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] animate-pulse">Syncing Dashboard Node...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Decoration */}
          <div className="mt-10 pt-10 border-t border-white/[0.03] flex justify-between items-center px-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mb-1">State</span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter italic">
                {success ? "Encrypted" : "Decoupled"}
              </span>
            </div>
            <div className="text-right flex flex-col">
              <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] mb-1">Trace</span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter font-mono">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
