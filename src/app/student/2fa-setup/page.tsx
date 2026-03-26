"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-[#0a0f1c] p-6 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.2 }}
        className="max-w-[450px] w-full bg-white/5 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
             animate={success ? { rotate: 360, scale: 1.2 } : {}}
             transition={{ duration: 0.5 }}
             className={`w-20 h-20 ${success ? 'bg-green-500' : 'bg-gradient-to-br from-indigo-500 to-blue-600'} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-1 ring-white/20`}
          >
            {success ? (
               <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
            ) : (
               <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
               </svg>
            )}
          </motion.div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">{success ? "Secured!" : "Secure Account"}</h2>
          <p className="text-gray-400 mt-2 text-sm font-medium">
            {success ? "Redirecting smoothly..." : "Activate Two-Factor Authentication"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!qrCode && !success && (
            <motion.div key="start" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 mb-8">
                 <p className="text-sm text-gray-300 leading-relaxed text-center">Protect your Nexus ERP account against unauthorized access using cryptographic TOTP tokens.</p>
              </div>
              <button
                onClick={generateSecret}
                disabled={loading}
                className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all disabled:opacity-50"
              >
                {loading ? "Generating Protocol..." : "Initialize 2FA"}
              </button>
            </motion.div>
          )}

          {qrCode && !success && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="p-6 bg-white rounded-3xl flex flex-col items-center shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Scan with Authenticator</p>
                <div className="bg-white p-2 rounded-2xl border-4 border-gray-100">
                  <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
                </div>
                <div className="mt-6 text-center w-full">
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Manual Entry Key</p>
                  <p className="font-mono text-xl font-bold text-indigo-600 tracking-widest bg-indigo-50 py-2 rounded-xl">{secret}</p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="000000"
                  className="w-full text-center text-3xl tracking-[0.5em] font-mono py-5 rounded-2xl bg-black/40 text-white border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
                
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-400 text-sm text-center font-medium bg-red-500/10 py-2 rounded-xl border border-red-500/20">{error}</motion.p>
                  )}
                </AnimatePresence>
                
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold tracking-widest uppercase text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all active:scale-95"
                >
                  {verifying ? "Verifying Token..." : "Confirm & Activate"}
                </button>
              </form>
            </motion.div>
          )}

          {success && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-full bg-white/5 rounded-full h-1 mt-6 overflow-hidden">
                 <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2, ease: "linear" }} className="h-full bg-green-500"></motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
