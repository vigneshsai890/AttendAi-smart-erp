"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  return (
    <section ref={ref} className="relative h-screen flex flex-col items-center justify-center pt-12 overflow-hidden bg-black">
      <motion.div
        style={{ y, opacity, scale }}
        className="flex flex-col items-center text-center z-10 w-full px-4 mt-16"
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[#f5f5f7] text-2xl md:text-3xl font-semibold tracking-tight mb-2"
        >
          AttendAI Pro
        </motion.h2>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-white text-6xl md:text-8xl lg:text-[140px] font-bold tracking-tighter leading-none mb-6"
        >
          Flawless.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[#86868b] text-xl md:text-3xl font-medium max-w-3xl mx-auto tracking-tight mb-10"
        >
          The most secure attendance protocol ever created. <br className="hidden md:block" />Built for modern educational institutions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-6"
        >
          <Link href="/login" className="px-6 py-3 rounded-full bg-[#f5f5f7] text-black text-[15px] font-medium hover:scale-105 transition-transform duration-300">
            Learn more
          </Link>
          <Link href="/signup" className="text-[17px] font-medium text-[#2997ff] hover:underline flex items-center gap-1">
            Sign Up <span className="text-[14px]">›</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Cinematic Hardware/Mockup Element */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 w-full max-w-[1024px] h-[40vh] bg-[#1d1d1f] rounded-t-[3rem] border-t border-x border-[#333336] shadow-[0_-20px_80px_rgba(255,255,255,0.02)] overflow-hidden flex items-start justify-center pt-8 px-4"
      >
         <div className="w-full max-w-[800px] h-full bg-black rounded-t-3xl border-t border-x border-[#333336] flex flex-col items-center pt-10 px-8 relative overflow-hidden">
            <div className="w-32 h-1.5 bg-[#333336] rounded-full mb-12" />
            <div className="text-[#86868b] text-xs font-semibold tracking-widest uppercase mb-10">Live Verification Interface</div>
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-24 bg-[#1d1d1f] rounded-2xl border border-[#333336]" />
              <div className="h-24 bg-[#1d1d1f] rounded-2xl border border-[#333336]" />
              <div className="h-24 bg-[#1d1d1f] rounded-2xl border border-[#333336]" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
         </div>
      </motion.div>
    </section>
  );
}
