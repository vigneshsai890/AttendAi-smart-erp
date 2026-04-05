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
    <section ref={ref} className="relative min-h-[100svh] flex flex-col items-center justify-start pt-32 pb-40 overflow-hidden bg-black">
      <motion.div
        style={{ y, opacity, scale }}
        className="flex flex-col items-center text-center z-10 w-full px-4 mb-20"
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

      {/* Cinematic Hardware/Image Element */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1200px] h-[50vh] md:h-[60vh] bg-[#1d1d1f] rounded-t-[3rem] border-t border-x border-[#333336] shadow-[0_-20px_80px_rgba(255,255,255,0.02)] overflow-hidden flex items-start justify-center relative mt-auto"
      >
         <img
           src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
           alt="AttendAI Advanced Core"
           className="w-full h-full object-cover opacity-80"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

         <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/50 backdrop-blur-md rounded-full mb-12" />
      </motion.div>
    </section>
  );
}
