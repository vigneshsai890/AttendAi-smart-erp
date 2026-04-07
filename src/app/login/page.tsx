"use client";

import { useState, useEffect, Suspense } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useSession } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

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
    console.log("[AUTH_DEBUG] Attempting email login for:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("[AUTH_DEBUG] Firebase signIn success, waiting for AuthProvider sync...");
      
      // Zombie State Safety Net: If the user was already logged in to Firebase but we threw them onto the login page
      // because of a missing MongoDB DB record previously, Firebase's onAuthStateChanged will NOT fire locally since
      // the logged-in user technically hasn't changed. We aggressively perform a router redirect if nothing happens.
      setTimeout(() => {
         const firebaseUser = userCredential.user;
         if (firebaseUser) {
           console.log("[AUTH_DEBUG] Safety timeout triggered. Force redirecting to break out of UI freeze.");
           window.location.href = "/student/dashboard";
         }
      }, 1500);
    } catch (err: any) {
      console.error("[AUTH_DEBUG] Email login failed:", err);
      setLoading(false);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         setError("Invalid email or password");
      } else {
         setError(err.message || "Sign in failed. Please try again.");
      }
    }
  };

  // Reset loading if we are authenticated
  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      console.log("[AUTH_DEBUG] User authenticated, redirecting based on role:", (session.user as any)?.role);
      const user = session.user as any;
      const rawRole = String(user?.role || "").toUpperCase();
      const userRole = rawRole === "USER" ? "STUDENT" : rawRole;

      if (!user?.isProfileComplete && userRole === "STUDENT") {
        router.push("/onboarding");
        return;
      }

      if (userRole === "ADMIN") router.push("/admin");
      else if (userRole === "FACULTY") router.push("/faculty/dashboard");
      else router.push("/student/dashboard");
    } else if (status === "authenticated" && !session?.user) {
      // This is the case where Firebase is logged in but MongoDB profile fetch failed
      console.error("[AUTH_DEBUG] Firebase logged in but MongoDB profile missing");
      setError("Your account exists but your profile could not be loaded. Please contact support.");
      setLoading(false);
    }
  }, [status, session, router]);

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("Phone login is temporarily disabled. Please use Email.");
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
            <Link href="/signup" className="text-[12px] font-normal text-[#f5f5f7] hover:text-white transition-colors">
              Sign Up
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
              Sign in to AttendAI
            </h1>
            <p className="text-[15px] text-[#86868b] font-medium tracking-tight">
              Manage your academic presence securely.
            </p>
          </div>

          <div className="bg-[#1d1d1f] rounded-3xl p-8 border border-[#333336] shadow-2xl relative overflow-hidden">

            {/* Identity Switcher */}
            <div className="flex p-1 bg-black rounded-xl relative mb-8">
              <motion.div
                className="absolute inset-y-1 rounded-lg bg-[#333336]"
                animate={{
                  left: role === "STUDENT" ? "4px" : "50%",
                  width: "calc(50% - 4px)"
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
              <button
                onClick={() => { setRole("STUDENT"); setStep("SELECT"); setShowOtp(false); setError(""); }}
                className={`relative flex-1 py-2 text-[13px] font-medium transition-colors duration-300 ${role === "STUDENT" ? "text-white" : "text-[#86868b] hover:text-white"}`}
              >
                Student
              </button>
              <button
                onClick={() => { setRole("FACULTY"); setStep("SELECT"); setShowOtp(false); setError(""); }}
                className={`relative flex-1 py-2 text-[13px] font-medium transition-colors duration-300 ${role === "FACULTY" ? "text-white" : "text-[#86868b] hover:text-white"}`}
              >
                Faculty
              </button>
            </div>

            <AnimatePresence mode="wait">
              {role === "STUDENT" && step === "SELECT" && (
                <motion.div
                  key="student-select"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-4">
                      <input
                        type="email" required placeholder="Email or AttendAI ID" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                      />
                      <input
                        type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                      />
                    </div>
                    <button disabled={loading} className="w-full py-3.5 rounded-xl bg-[#f5f5f7] text-black text-[15px] font-medium hover:bg-white active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                    </button>
                  </form>

                  <div className="relative py-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#333336]"></div></div>
                    <div className="relative px-4 text-[13px] text-[#86868b] bg-[#1d1d1f] font-medium">Or</div>
                  </div>

                  <button
                    onClick={() => setStep("PHONE")}
                    className="w-full py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] font-medium hover:border-[#86868b] transition-all"
                  >
                    Use Phone Number
                  </button>
                </motion.div>
              )}

              {role === "FACULTY" && (
                <motion.div
                  key="faculty-login"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-4">
                      <input
                        type="email" required placeholder="Faculty ID (Email)" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                      />
                      <input
                        type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all"
                      />
                    </div>
                    <button disabled={loading} className="w-full py-3.5 rounded-xl bg-[#2997ff] text-white text-[15px] font-medium hover:bg-[#0077ED] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In securely"}
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
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <form onSubmit={handlePhoneAuth} className="space-y-4">
                    <div className="space-y-4">
                      <input
                        type="tel" required placeholder="Phone Number (+1...)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                        disabled={showOtp}
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all disabled:opacity-50"
                      />

                      {showOtp && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                          <input
                            type="text" required placeholder="Verification Code" value={otp} onChange={e => setOtp(e.target.value)}
                            className="w-full px-4 py-3.5 mt-4 rounded-xl bg-black border border-[#333336] text-[#f5f5f7] text-[15px] placeholder:text-[#86868b] focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff] outline-none transition-all tracking-widest"
                          />
                        </motion.div>
                      )}
                    </div>

                    <button disabled={loading} className="w-full py-3.5 rounded-xl bg-[#f5f5f7] text-black text-[15px] font-medium hover:bg-white active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : showOtp ? "Verify" : "Send Code"}
                    </button>

                    <button type="button" onClick={() => setStep("SELECT")} className="w-full text-[13px] font-medium text-[#2997ff] hover:underline transition-colors mt-2 text-center">
                      Use email instead
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                  className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[#ff3b30] text-[13px] font-medium text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[13px] text-[#86868b] font-medium">
              Don't have an AttendAI ID? <Link href="/signup" className="text-[#2997ff] hover:underline">Create yours now.</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}
