"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const letters = "AttendAI".split("");

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[10000] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Subtle radial pulse behind logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.5, 1.2], opacity: [0, 0.15, 0] }}
            transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
            className="absolute w-80 h-80 rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 blur-3xl"
          />

          {/* Logo icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="mb-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-7 h-7 text-white dark:text-zinc-900">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
          </motion.div>

          {/* Staggered letter reveal */}
          <div className="flex items-center overflow-hidden">
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.3 + i * 0.06,
                }}
                className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight"
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Subtitle fade */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-sm text-zinc-400 mt-3 tracking-wide"
          >
            Smart Attendance System
          </motion.p>

          {/* Progress ring */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-10"
          >
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-zinc-300 dark:text-zinc-700">
              <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <motion.circle
                cx="16" cy="16" r="13"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 13}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 13 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.4, ease: "easeInOut", delay: 1.3 }}
                className="-rotate-90 origin-center"
                style={{ transformOrigin: "center" }}
              />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
