"use client";

import { useEffect, useRef } from "react";

export default function Background() {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = starsRef.current;
    if (!container || container.childNodes.length > 0) return;
    for (let i = 0; i < 80; i++) {
      const s = document.createElement("div");
      const sz = Math.random() * 2 + 0.8;
      s.className = "att-star";
      s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${sz}px;height:${sz}px;--d:${2 + Math.random() * 4}s;--dl:${Math.random() * 4}s;--op:${0.3 + Math.random() * 0.55}`;
      container.appendChild(s);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-base-gradient" />
      <div className="att-orb att-o1" />
      <div className="att-orb att-o2" />
      <div className="att-orb att-o3" />
      <div className="att-gridlines" />
      <div ref={starsRef} className="absolute inset-0" />
    </div>
  );
}
