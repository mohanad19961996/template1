"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function SectionDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "50px" });

  return (
    <div ref={ref} className="relative py-6" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 60px" }}>
      {/* Top fade */}
      <div
        className="absolute top-0 inset-x-0 h-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-background), transparent)",
        }}
      />

      {/* Center divider */}
      <div className="relative flex items-center justify-center px-4 sm:px-8 md:px-16">
        {/* Left line */}
        <motion.div
          className="flex-1 h-[2px] relative overflow-hidden rounded-full"
          initial={{ scaleX: 0, originX: 1 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--color-primary) 100%)",
            }}
          />
        </motion.div>

        {/* Center ornament */}
        <motion.div
          className="mx-5 flex items-center gap-2.5 relative"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
          transition={{
            duration: 0.5,
            delay: 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/* Left dash */}
          <div
            className="h-[2px] w-4 rounded-full"
            style={{ background: "var(--color-primary)", opacity: 0.7 }}
          />

          {/* Left dot */}
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--color-primary)",
              boxShadow: "0 0 6px rgba(var(--color-primary-rgb) / 0.4)",
            }}
          />

          {/* Center diamond */}
          <div
            className="h-3 w-3 rotate-45 rounded-[2px]"
            style={{
              background: "var(--color-primary)",
              boxShadow:
                "0 0 12px rgba(var(--color-primary-rgb) / 0.5), 0 0 24px rgba(var(--color-primary-rgb) / 0.2)",
            }}
          />

          {/* Right dot */}
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--color-primary)",
              boxShadow: "0 0 6px rgba(var(--color-primary-rgb) / 0.4)",
            }}
          />

          {/* Right dash */}
          <div
            className="h-[2px] w-4 rounded-full"
            style={{ background: "var(--color-primary)", opacity: 0.7 }}
          />
        </motion.div>

        {/* Right line */}
        <motion.div
          className="flex-1 h-[2px] relative overflow-hidden rounded-full"
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, var(--color-primary) 0%, transparent 100%)",
            }}
          />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 inset-x-0 h-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, var(--color-background), transparent)",
        }}
      />
    </div>
  );
}
