"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Activity, Zap, Layers } from "lucide-react";

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  const steps = [
    { label: "Initializing Neural Core", icon: <Zap className="text-indigo-400" /> },
    { label: "Syncing Decentralized Registry", icon: <Layers className="text-purple-400" /> },
    { label: "Establishing Secure Protocol", icon: <ShieldCheck className="text-emerald-400" /> },
    { label: "Neural Link Established", icon: <Activity className="text-pink-400" /> }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)", scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Ambient Glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)]" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"
            />
          </div>

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-2xl mb-12"
            >
              <div className="w-full h-full rounded-[2.5rem] bg-[#0c0c0e] flex items-center justify-center text-3xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.5, rotate: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {steps[step].icon}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="text-center space-y-6">
              <div className="space-y-2">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-black text-white tracking-tighter uppercase italic"
                >
                  AttendAI <span className="text-white/20">Nexus</span>
                </motion.h1>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                  className="h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent w-64 mx-auto"
                />
              </div>

              <div className="h-8 flex flex-col items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.5em] font-mono"
                  >
                    {steps[step].label}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-16 w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_#6366f1]"
              />
            </div>
          </div>

          <div className="absolute bottom-12 text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
            Institutional Intelligence System v2.1.0
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
