"use client";

export default function Background() {
  // Removed gradients and orbs to maintain a strictly flat, solid Apple-style background.
  return <div className="fixed inset-0 z-[-1] bg-black pointer-events-none" />;
}
