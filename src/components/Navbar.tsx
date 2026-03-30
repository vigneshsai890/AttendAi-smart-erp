"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Magnetic from "@/components/Magnetic";
import {
  LayoutDashboard, BookOpen, Activity, Bell,
  MessageSquare, User, LogOut, Settings, Shield
} from "lucide-react";

function NavbarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = session?.user?.role;
  const currentTab = searchParams.get("tab") || "classroom";

  // Don't show on login page
  if (pathname === "/login") return null;

  const getTabs = () => {
    if (role === "STUDENT") {
      return [
        { id: "feed", icon: <Activity size={20} />, label: "Feed", path: "/student/dashboard?tab=feed" },
        { id: "classroom", icon: <BookOpen size={20} />, label: "Classroom", path: "/student/dashboard?tab=classroom" },
        { id: "academics", icon: <LayoutDashboard size={20} />, label: "Academics", path: "/student/dashboard?tab=academics" },
        { id: "message", icon: <MessageSquare size={20} />, label: "Message", path: "/student/dashboard?tab=message" },
      ];
    }
    if (role === "FACULTY") {
      return [
        { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/faculty/dashboard" },
        { id: "reports", icon: <Activity size={20} />, label: "Reports", path: "/faculty/dashboard?tab=reports" },
        { id: "alerts", icon: <Bell size={20} />, label: "Alerts", path: "/faculty/dashboard?tab=alerts" },
      ];
    }
    if (role === "ADMIN") {
      return [
        { id: "admin", icon: <Shield size={20} />, label: "Core", path: "/admin" },
        { id: "users", icon: <User size={20} />, label: "Entities", path: "/admin/users" },
        { id: "settings", icon: <Settings size={20} />, label: "System", path: "/admin/settings" },
      ];
    }
    return [];
  };

  const tabs = getTabs();

  return (
    <div className="fixed bottom-10 left-0 right-0 z-[200] flex justify-center pointer-events-none px-6">
      <motion.nav
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 120, delay: 0.5 }}
        className="pointer-events-auto bg-[#0c0c0e]/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] px-5 py-4 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
      >
        {tabs.map((tab) => {
          const isActive = (pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")).includes(tab.path) ||
                          (tab.id === "classroom" && pathname === "/student/dashboard" && !searchParams.get("tab")) ||
                          (tab.id === "dashboard" && pathname === "/faculty/dashboard");

          return (
            <Magnetic key={tab.id} strength={0.15}>
              <button
                onClick={() => router.push(tab.path)}
                className="relative px-6 py-4 rounded-[2rem] flex flex-col items-center gap-2 transition-all group active:scale-90"
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-indigo-500/[0.08] border border-indigo-500/20 rounded-[2rem] -z-10 shadow-[0_0_30px_rgba(79,70,229,0.2)]"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    />
                  )}
                </AnimatePresence>

                <div className={`transition-all duration-500 ${isActive ? "text-indigo-400 scale-125 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "text-white/20 group-hover:text-white/60 group-hover:scale-110"}`}>
                  {tab.icon}
                </div>

                <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isActive ? "text-indigo-400 opacity-100" : "text-white/10 group-hover:text-white/30 opacity-0 group-hover:opacity-100"}`}>
                  {tab.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_15px_#6366f1]"
                  />
                )}
              </button>
            </Magnetic>
          );
        })}

        <div className="w-[1px] h-10 bg-white/5 mx-3" />

        <Magnetic strength={0.15}>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-6 py-4 rounded-[2rem] flex flex-col items-center gap-2 text-white/10 hover:text-red-400/80 transition-all group active:scale-90"
          >
            <LogOut size={20} className="group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all">Exit</span>
          </button>
        </Magnetic>
      </motion.nav>
    </div>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarInner />
    </Suspense>
  );
}
