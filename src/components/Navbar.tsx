"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CopySlash, BookOpen, LifeBuoy, MessageSquareText, Clock } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const isStudent = pathname?.includes("/student");
  if (!isStudent) return null;

  const currentTab = searchParams.get("tab") || "classroom";

  const tabs = [
    { id: "feed", icon: <CopySlash size={22} strokeWidth={2} />, label: "Feed" },
    { id: "classroom", icon: <BookOpen size={22} strokeWidth={2} />, label: "Classroom" },
    { id: "academics", icon: <LifeBuoy size={22} strokeWidth={2} />, label: "Academics" },
    { id: "message", icon: <MessageSquareText size={22} strokeWidth={2} />, label: "Message" },
    { id: "reminders", icon: <Clock size={22} strokeWidth={2} />, label: "Reminders" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[200] pb-safe bg-[#111111]/95 backdrop-blur-2xl border-t border-white/5 font-['Inter',sans-serif]">
      <div className="flex justify-around items-end h-[70px] px-2 pb-[16px]">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(`/student/dashboard?tab=${tab.id}`)}
              className={`flex flex-col items-center justify-center gap-[5px] min-w-[64px] transition-all px-1 ${
                isActive ? "text-[#F43F5E] opacity-100" : "text-white/40 hover:text-white/60"
              }`}
            >
              <div className={`transition-all duration-300 ${isActive ? "scale-110 mb-[2px]" : "scale-100"}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] font-medium tracking-[0.2px] leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
