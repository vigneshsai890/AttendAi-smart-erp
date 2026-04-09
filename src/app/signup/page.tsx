"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft, User, Mail, Lock, Phone, ChevronDown, Check, Search, GraduationCap } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";

const SPECIALIZATIONS = DEPARTMENTS.map(d => ({ id: d.id, name: d.name }));

// Animated step indicator
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            animate={{
              width: i === current ? 28 : 8,
              backgroundColor: i <= current ? "#6366f1" : "#e4e4e7",
            }}
            transition={{ duration: 0.3 }}
            className="h-2 rounded-full dark:bg-zinc-700"
          />
        </div>
      ))}
    </div>
  );
}

// Searchable dropdown
function SelectDropdown({
  label, placeholder, options, value, onChange, icon, searchable = false,
}: {
  label: string; placeholder: string;
  options: { id: string; name: string }[];
  value: string; onChange: (v: string) => void;
  icon?: React.ReactNode; searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = searchable
    ? options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selected = options.find(o => o.id === value);

  return (
    <div className="relative">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1.5 ml-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-all duration-300 text-[15px]
          bg-white dark:bg-zinc-800/60 font-medium
          ${open
            ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/5"
            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
          }
          ${selected ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}`}
      >
        <div className="flex items-center gap-3 truncate">
          {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
          {selected ? selected.name : placeholder}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-zinc-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {searchable && (
                <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                      autoFocus
                    />
                  </div>
                </div>
              )}
              <div className="max-h-48 overflow-y-auto p-1">
                {filtered.map(o => (
                  <button
                    key={o.id} type="button"
                    onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className={value === o.id ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"}>
                      {o.name}
                    </span>
                    {value === o.id && <Check size={14} className="text-indigo-500 shrink-0" />}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-3 py-4 text-xs text-zinc-400 text-center">No results</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [method, setMethod] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  // ── Auth handlers (IDENTICAL — no changes) ──────────────────────────────────
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: name });
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: firebaseUser.uid, email, name, phoneNumber }),
      });
      const signupData = await signupRes.json();
      if (!signupRes.ok) { setError(signupData.error || "Profile creation failed"); return; }
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally { setLoading(false); }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("Phone signup is temporarily disabled. Please use Email.");
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3.5 rounded-2xl text-[15px] font-medium outline-none transition-all duration-300 border
    bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-white
    placeholder:text-zinc-400 dark:placeholder:text-zinc-500
    ${focused === field
      ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/5"
      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
    }`;

  const canProceedStep0 = name.length > 0;
  const canProceedStep1 = email.length > 0 && password.length > 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-[var(--font-inter)] selection:bg-indigo-500/20 relative">

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
          <Link href="/login" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline transition-colors">
            Sign in
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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {currentStep === 0 && "Let's start with your basic info"}
              {currentStep === 1 && "Set up your credentials"}
              {currentStep === 2 && "Choose your department"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-7 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 relative overflow-hidden"
          >
            <StepIndicator current={currentStep} total={3} />

            {/* Method switcher (only step 1) */}
            {currentStep === 1 && (
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl relative mb-6">
                <motion.div
                  className="absolute inset-y-1 rounded-xl bg-white dark:bg-zinc-700 shadow-sm"
                  animate={{ left: method === "EMAIL" ? "4px" : "50%", width: "calc(50% - 4px)" }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
                {[
                  { key: "EMAIL" as const, label: "Email" },
                  { key: "PHONE" as const, label: "Phone" },
                ].map(m => (
                  <button key={m.key} onClick={() => { setMethod(m.key); setShowOtp(false); setError(""); }}
                    className={`relative flex-1 py-2 text-sm font-medium transition-colors duration-300
                      ${method === m.key ? "text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={method === "EMAIL" ? handleEmailSignup : handlePhoneSignup}>
              <AnimatePresence mode="wait">

                {/* Step 0: Name + phone */}
                {currentStep === 0 && (
                  <motion.div key="step0"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input type="text" required placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
                        onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                        className={`${inputClass("name")} pl-11`} />
                    </div>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input type="tel" required placeholder="Phone (+91...)" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                        onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                        className={`${inputClass("phone")} pl-11`} />
                    </div>
                    <p className="text-[10px] text-zinc-400 px-2">Format: +CountryCode Number (e.g. +919876543210)</p>
                  </motion.div>
                )}

                {/* Step 1: Credentials */}
                {currentStep === 1 && method === "EMAIL" && (
                  <motion.div key="step1-email"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input type="email" required placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                        className={`${inputClass("email")} pl-11`} />
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input type="password" required placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
                        className={`${inputClass("pass")} pl-11`} />
                    </div>
                    {password.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        className="flex items-center gap-2 px-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? "bg-emerald-500" : "bg-zinc-300"}`} />
                        <span className={`text-xs ${password.length >= 6 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                          {password.length >= 6 ? "Strong enough" : `${6 - password.length} more characters needed`}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {currentStep === 1 && method === "PHONE" && (
                  <motion.div key="step1-phone"
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {!showOtp ? (
                      <p className="text-sm text-zinc-500 text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        Phone signup is temporarily disabled. Please use Email.
                      </p>
                    ) : (
                      <>
                        <input type="text" required placeholder="Verification code"
                          value={otp} onChange={e => setOtp(e.target.value)}
                          className={`${inputClass("otp")} tracking-[0.3em] text-center`} />
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                          <input type="password" required placeholder="Set password" value={password} onChange={e => setPassword(e.target.value)}
                            className={`${inputClass("set-pass")} pl-11`} />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Department */}
                {currentStep === 2 && (
                  <motion.div key="step2"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <SelectDropdown
                      label="Department"
                      placeholder="Choose your department"
                      options={SPECIALIZATIONS}
                      value={department}
                      onChange={setDepartment}
                      icon={<GraduationCap size={16} />}
                      searchable
                    />
                    <div className="pt-2 px-1">
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        This helps us assign you to the correct attendance groups. You can change this later in settings.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium text-center">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-6">
                {currentStep > 0 && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex-1 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={14} /> Back
                  </motion.button>
                )}

                {currentStep < 2 ? (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={currentStep === 0 ? !canProceedStep0 : !canProceedStep1}
                    onClick={() => { setError(""); setCurrentStep(prev => prev + 1); }}
                    className="flex-[2] py-3.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-zinc-900/10 dark:shadow-white/10"
                  >
                    Continue <ArrowRight size={16} />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="flex-[2] py-3.5 rounded-2xl bg-indigo-600 text-white text-[15px] font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <>Create account <ArrowRight size={16} /></>}
                  </motion.button>
                )}
              </div>
            </form>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-8 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Sign in</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
