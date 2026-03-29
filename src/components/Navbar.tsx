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
    <div className="fixed bottom-8 left-0 right-0 z-[200] flex justify-center pointer-events-none">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="pointer-events-auto bg-[#0c0c0e]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] px-4 py-3 flex items-center gap-2 shadow-2xl"
      >
        {tabs.map((tab) => {
          const isActive = (pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")).includes(tab.path) ||
                          (tab.id === "classroom" && pathname === "/student/dashboard" && !searchParams.get("tab")) ||
                          (tab.id === "dashboard" && pathname === "/faculty/dashboard");

          return (
            <Magnetic key={tab.id} strength={0.15}>
              <button
                onClick={() => router.push(tab.path)}
                className={`relative px-5 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all group`}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl -z-10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </AnimatePresence>

                <span className={`transition-all duration-300 ${isActive ? "text-indigo-400 scale-110" : "text-white/20 group-hover:text-white/50"}`}>
                  {tab.icon}
                </span>

                <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? "text-indigo-400/80" : "text-white/10 group-hover:text-white/30"}`}>
                  {tab.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-1 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"
                  />
                )}
              </button>
            </Magnetic>
          );
        })}

        <div className="w-[1px] h-8 bg-white/10 mx-2" />

        <Magnetic strength={0.15}>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-5 py-3 rounded-2xl flex flex-col items-center gap-1 text-white/20 hover:text-red-400 transition-all group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/10 group-hover:text-red-400/50">Exit</span>
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
