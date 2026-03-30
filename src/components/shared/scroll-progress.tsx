"use client";

import { useScroll, motion, useTransform } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const widthPercent = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const heightPercent = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 inset-x-0 z-[60] h-[5px]">
        <motion.div
          className="h-full origin-left rounded-e-full"
          style={{
            width: widthPercent,
            background: "var(--color-primary)",
            boxShadow: `0 0 20px rgba(var(--color-primary-rgb) / 0.6), 0 0 8px rgba(var(--color-primary-rgb) / 0.4)`,
          }}
        />
      </div>

      {/* Right side progress bar (LTR) / Left side progress bar (RTL) */}
      <div className="fixed top-0 end-0 z-[60] w-[5px] h-full">
        <motion.div
          className="w-full origin-top rounded-b-full"
          style={{
            height: heightPercent,
            background: "var(--color-primary)",
            boxShadow: `0 0 20px rgba(var(--color-primary-rgb) / 0.6), 0 0 8px rgba(var(--color-primary-rgb) / 0.4)`,
          }}
        />
      </div>
    </>
  );
}
