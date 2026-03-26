"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastContextType = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timeoutId) clearTimeout(timeoutId);
    setMessage(msg);
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 3000);
    setTimeoutId(id);
  }, [timeoutId]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={`fixed bottom-[26px] left-1/2 z-[999] px-5 py-[11px] rounded-full bg-[rgba(52,211,153,0.13)] border border-[rgba(52,211,153,0.26)] backdrop-blur-[18px] text-[#34D399] font-bold text-[12px] flex items-center gap-[7px] shadow-[0_8px_28px_rgba(52,211,153,0.15)] whitespace-nowrap transition-transform duration-400 ${
          visible
            ? "-translate-x-1/2 translate-y-0"
            : "-translate-x-1/2 translate-y-[110px]"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)" }}
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
