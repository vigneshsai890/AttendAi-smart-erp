"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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
        phoneNumber,
        callbackURL: "/onboarding",
      });
      if (signUpError) setError(signUpError.message || "Signup failed. Please try again.");
      else router.push("/onboarding");
    } catch {
      setError("An unexpected error occurred. Please try again later.");
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
          setError(sendError.message || "Failed to send code.");
        } else {
          setShowOtp(true);
        }
      } else {
        const { error: verifyError } = await authClient.phoneNumber.verify({
          phoneNumber,
          code: otp,
        });
        if (verifyError) {
          setError(verifyError.message || "Verification failed.");
        } else {
          // Note: Password and Name are handled by the session update or post-signup flow
          // since signUpOnVerification creates a temp user.
          router.push("/onboarding");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans selection:bg-white/20">
      {/* Global Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] h-12 bg-black/80 backdrop-blur-md border-b border-[#333336] flex items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-[1024px] flex items-center justify-between">
          <Link href="/" className="text-white hover:opacity-70 transition-opacity">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2L2 22h20L12 2zm0 4l7.5 15h-15L12 6z"/></svg>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[12px] font-normal text-[#f5f5f7] hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] z-10"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold text-[#f5f5f7] tracking-tight mb-3">
              Create your AttendAI ID
            </h1>
            <p className="text-[15px] text-[#86868b] font-medium tracking-tight">
              One ID is all you need to access all services.
            </p>
          </div>

          <div className="bg-[#1d1d1f] rounded-3xl p-8 border border-[#333336] shadow-2xl relative overflow-hidden">

            {/* Identity Switcher */}
            <div className="flex p-1 bg-black rounded-xl relative mb-8">
              <motion.div
                className="absolute inset-y-1 rounded-lg bg-[#333336]"
                animate={{
                  left: method === "EMAIL" ? "4px" : "50%",
                  width: "calc(50% - 4px)"
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
              <button
                onClick={() => { setMethod("EMAIL"); setShowOtp(false); setError(""); }}
                className={`relative flex-1 py-2 text-[13px] font-medium transition-colors duration-300 ${method === "EMAIL" ? "text-white" : "text-[#86868b] hover:text-white"}`}
              >
                Use Email
              </button>
              <button
                onClick={() => { setMethod("PHONE"); setShowOtp(false); setError(""); }}
                className={`relative flex-1 py-2 text-[13px] font-medium transition-colors duration-300 ${method === "PHONE" ? "text-white" : "text-[#86868b] hover:text-white"}`}
              >
                Use Phone
              </button>
            </div>

            <form onSubmit={method === "EMAIL" ? handleEmailSignup : handlePhoneSignup} className="space-y-4">
              <AnimatePresence mode="wait">
                {method === "EMAIL" ? (
                  <motion.div
                    key="email-form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <input
                      type="text" required placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                    />
                    <div className="space-y-1">
                      <input
                        type="tel" required placeholder="Phone Number (+91...)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                      />
                      <p className="text-[10px] text-[#86868b] px-2 italic">Format: +[CountryCode][Number] (e.g. +919876543210)</p>
                    </div>
                    <input
                      type="email" required placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                    />
                    <input
                      type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="phone-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {!showOtp ? (
                      <>
                        <input
                          type="text" required placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                        />
                        <input
                          type="tel" required placeholder="Phone Number (+1...)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                        />
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-[#2997ff]/10 border border-[#2997ff]/20 rounded-xl">
                          <p className="text-[13px] text-[#2997ff] font-medium text-center">Code sent to {phoneNumber}</p>
                        </div>
                        <input
                          type="text" required placeholder="Verification Code" value={otp} onChange={e => setOtp(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all tracking-widest text-center"
                        />
                        <input
                          type="password" required placeholder="Set Password" value={password} onChange={e => setPassword(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                        />
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                    className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[#ff3b30] text-[13px] font-medium text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-6 rounded-xl bg-[#f5f5f7] text-black text-[15px] font-medium hover:bg-white active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : showOtp ? "Create ID" : "Continue"}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[13px] text-[#86868b] font-medium">
              Already have an AttendAI ID? <Link href="/login" className="text-[#2997ff] hover:underline">Sign In.</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
