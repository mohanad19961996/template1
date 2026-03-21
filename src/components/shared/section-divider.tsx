"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function SectionDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  return (
    <div ref={ref} className="relative py-6">
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
        {/* Left line — solid & thick */}
        <motion.div
          className="flex-1 h-[2px] relative overflow-hidden rounded-full"
          initial={{ scaleX: 0, originX: 1 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--color-primary) 100%)",
            }}
          />
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 divider-shimmer-rtl"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
              backgroundSize: "50% 100%",
            }}
          />
        </motion.div>

        {/* Center ornament */}
        <motion.div
          className="mx-5 flex items-center gap-2.5 relative"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{
            duration: 0.5,
            delay: 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/* Outer glow pulse */}
          <div
            className="absolute -inset-4 rounded-full divider-glow-pulse pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.25) 0%, transparent 70%)",
            }}
          />

          {/* Left dash */}
          <motion.div
            className="h-[2px] w-4 rounded-full"
            style={{ background: "var(--color-primary)" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Left dot */}
          <motion.div
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--color-primary)",
              boxShadow: "0 0 6px rgba(var(--color-primary-rgb) / 0.4)",
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />

          {/* Center diamond */}
          <motion.div
            className="relative"
            animate={{ rotate: [0, 180, 360] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="h-3 w-3 rotate-45 rounded-[2px]"
              style={{
                background: "var(--color-primary)",
                boxShadow:
                  "0 0 12px rgba(var(--color-primary-rgb) / 0.5), 0 0 24px rgba(var(--color-primary-rgb) / 0.2)",
              }}
            />
          </motion.div>

          {/* Right dot */}
          <motion.div
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--color-primary)",
              boxShadow: "0 0 6px rgba(var(--color-primary-rgb) / 0.4)",
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6,
            }}
          />

          {/* Right dash */}
          <motion.div
            className="h-[2px] w-4 rounded-full"
            style={{ background: "var(--color-primary)" }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </motion.div>

        {/* Right line — solid & thick */}
        <motion.div
          className="flex-1 h-[2px] relative overflow-hidden rounded-full"
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, var(--color-primary) 0%, transparent 100%)",
            }}
          />
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 divider-shimmer-ltr"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
              backgroundSize: "50% 100%",
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
