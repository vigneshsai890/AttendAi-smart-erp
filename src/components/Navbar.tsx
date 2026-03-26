"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [clock, setClock] = useState("");
  const isStudent = pathname?.includes("/student");

  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const switchView = (view: "s" | "t") => {
    if (view === "s") router.push("/student/dashboard");
    else router.push("/faculty/dashboard");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[200] h-[60px] flex items-center justify-between px-[26px] bg-[rgba(3,5,14,0.6)] border-b border-white/[0.07] backdrop-blur-[28px]">
      <div className="flex items-center gap-[10px]">
        <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#5EAEFF] via-[#818CF8] to-[#A78BFA] flex items-center justify-center text-[17px] shadow-[0_2px_16px_rgba(94,174,255,0.35)] shrink-0">
          🏛️
        </div>
        <div className="flex flex-col leading-[1.15]">
          <span className="text-[13px] font-bold tracking-[-0.2px]">The Apollo University</span>
          <span className="text-[10px] text-white/50 font-['DM_Sans',sans-serif] tracking-[0.3px]">AttendAI · Smart Attendance System</span>
        </div>
      </div>

      <div className="hidden md:flex gap-[2px] bg-white/5 border border-white/[0.08] rounded-full p-[3px]">
        <button
          onClick={() => switchView("s")}
          className={`px-[17px] py-[5px] border-none rounded-full text-[11px] font-bold cursor-pointer transition-all tracking-[0.2px] ${
            isStudent
              ? "bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white shadow-[0_2px_12px_rgba(94,174,255,0.4)]"
              : "bg-transparent text-white/50"
          }`}
        >
          Student
        </button>
        <button
          onClick={() => switchView("t")}
          className={`px-[17px] py-[5px] border-none rounded-full text-[11px] font-bold cursor-pointer transition-all tracking-[0.2px] ${
            !isStudent
              ? "bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white shadow-[0_2px_12px_rgba(94,174,255,0.4)]"
              : "bg-transparent text-white/50"
          }`}
        >
          Teacher
        </button>
      </div>

      <div className="flex items-center gap-[11px]">
        <div className="text-[11px] text-white/50 font-['DM_Sans',sans-serif]">{clock}</div>
        <div className="relative w-[30px] h-[30px] rounded-full border border-white/10 bg-white/[0.04] text-white/50 cursor-pointer flex items-center justify-center text-[13px] hover:bg-white/[0.09] transition-all">
          🔔
          <span className="absolute top-[4px] right-[4px] w-[6px] h-[6px] rounded-full bg-[#F87171] border-[1.5px] border-[#03050e]" />
        </div>
        <div className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-[#818CF8] to-[#5EAEFF] flex items-center justify-center text-[13px] font-extrabold cursor-pointer border-2 border-white/[0.14] shadow-[0_2px_12px_rgba(129,140,248,0.3)]">
          {isStudent ? "A" : "M"}
        </div>
      </div>
    </nav>
  );
}
