"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  description?: string;
  align?: "center" | "start";
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
      className={cn(
        "mb-8 md:mb-10",
        align === "center" && "text-center",
        className
      )}
    >
      {subtitle && (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary tracking-widest uppercase mb-2">
          <span className="h-px w-5" style={{ background: "var(--color-primary)" }} />
          {subtitle}
          <span className="h-px w-5" style={{ background: "var(--color-primary)" }} />
        </span>
      )}

      {subtitle && (
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: 36 } : { width: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" as const }}
          className={cn(
            "h-[2px] rounded-full mt-2 mb-2",
            align === "center" && "mx-auto"
          )}
          style={{ background: "var(--color-primary)" }}
        />
      )}

      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-2">
        {title}
      </h2>

      {description && (
        <p className={cn(
          "text-foreground mt-3 max-w-xl text-sm leading-relaxed",
          align === "center" && "mx-auto"
        )}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
