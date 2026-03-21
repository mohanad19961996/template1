"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface TimelineItem {
  title: string;
  description: string;
  date?: string;
  icon?: LucideIcon;
  isCurrent?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className={cn("timeline", className)}>
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="timeline-item"
          initial={{ opacity: 0, x: -16 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
          transition={{
            duration: 0.45,
            delay: i * 0.12,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div
            className={cn("timeline-dot", item.isCurrent && "is-current")}
          />

          <div className="space-y-1">
            {item.date && (
              <span
                className="text-[0.6875rem] font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {item.date}
              </span>
            )}
            <h4 className="text-[0.8125rem] font-semibold flex items-center gap-2">
              {item.icon && (
                <item.icon
                  className="h-3.5 w-3.5 flex-shrink-0"
                  style={{ color: "var(--color-primary)" }}
                />
              )}
              {item.title}
            </h4>
            <p className="text-[0.8125rem] text-[var(--color-muted-foreground)] leading-relaxed">
              {item.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
