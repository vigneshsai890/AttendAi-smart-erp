"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, ShieldAlert } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string, t: ToastType = "success") => {
    if (timeoutId) clearTimeout(timeoutId);
    setMessage(msg);
    setType(t);
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 4000);
    setTimeoutId(id);
  }, [timeoutId]);

  const getStyles = () => {
    switch (type) {
      case "error": return "bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/10";
      case "warning": return "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/10";
      case "info": return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-indigo-500/10";
      default: return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "error": return <ShieldAlert size={16} />;
      case "warning": return <AlertCircle size={16} />;
      case "info": return <Info size={16} />;
      default: return <CheckCircle2 size={16} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: "-50%", scale: 0.9 }}
            animate={{ y: 0, opacity: 1, x: "-50%", scale: 1 }}
            exit={{ y: 20, opacity: 0, x: "-50%", scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`fixed bottom-10 left-1/2 z-[999] px-6 py-4 rounded-[2rem] backdrop-blur-3xl border flex items-center gap-4 shadow-2xl ring-1 ring-white/5 whitespace-nowrap min-w-[280px] justify-center ${getStyles()}`}
          >
            <div className="shrink-0">{getIcon()}</div>
            <span className="text-[11px] font-black uppercase tracking-widest italic">{message}</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
