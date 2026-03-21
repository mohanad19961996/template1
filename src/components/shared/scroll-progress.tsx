"use client";

import { useEffect, useState } from "react";
import { useScroll } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => setProgress(v));
    return unsubscribe;
  }, [scrollYProgress]);

  if (progress < 0.01) return null;

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 inset-x-0 z-[60] h-[5px]">
        <div
          className="h-full origin-left transition-none rounded-e-full"
          style={{
            transform: `scaleX(${progress})`,
            background: "var(--color-primary)",
            boxShadow: `0 0 20px rgba(var(--color-primary-rgb) / 0.6), 0 0 8px rgba(var(--color-primary-rgb) / 0.4)`,
          }}
        />
      </div>

      {/* Right side progress bar (LTR) / Left side progress bar (RTL) */}
      <div className="fixed top-0 end-0 z-[60] w-[5px] h-full">
        <div
          className="w-full origin-top transition-none rounded-b-full"
          style={{
            height: `${progress * 100}%`,
            background: "var(--color-primary)",
            boxShadow: `0 0 20px rgba(var(--color-primary-rgb) / 0.6), 0 0 8px rgba(var(--color-primary-rgb) / 0.4)`,
          }}
        />
      </div>
    </>
  );
}
