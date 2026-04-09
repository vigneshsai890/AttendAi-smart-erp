"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovered(!!target.closest("button, a, input, select, [role='button']"));
    };
    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleHover);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleHover);
    };
  }, [cursorX, cursorY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] hidden md:block">
      <motion.div
        className="fixed w-2.5 h-2.5 bg-zinc-900 dark:bg-white rounded-full mix-blend-difference"
        style={{ x: cursorXSpring, y: cursorYSpring, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: isHovered ? 2.5 : 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      />
    </div>
  );
}
