"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/providers/site-config-provider";
import { useLocale } from "next-intl";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { config } = useSiteConfig();
  const style = config.navbar.darkModeStyle;
  const locale = useLocale();
  const isAr = locale === "ar";

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-[38px] w-[38px]" />;

  const isDark = theme === "dark";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  // ── pill-switch ──
  if (style === "pill-switch") {
    return (
      <button
        onClick={toggle}
        className="relative h-[38px] w-[68px] rounded-full cursor-pointer"
        style={{
          background: isDark
            ? "rgba(var(--color-primary-rgb) / 0.15)"
            : "rgba(var(--color-primary-rgb) / 0.08)",
          border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)",
          transition: "all 0.3s ease",
        }}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <motion.div
          className="absolute top-[3px] h-[28px] w-[28px] rounded-full flex items-center justify-center"
          style={{
            background: "var(--color-primary)",
            boxShadow: "0 2px 8px rgba(var(--color-primary-rgb) / 0.3)",
          }}
          animate={{ left: isDark ? "calc(100% - 31px)" : "3px" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {isDark ? <Moon className="h-3 w-3 text-white" /> : <Sun className="h-3 w-3 text-white" />}
          </motion.div>
        </motion.div>
        {/* Background icons */}
        <Sun className="absolute top-[10px] left-[8px] h-3.5 w-3.5" style={{ color: "var(--color-primary)", opacity: isDark ? 0.3 : 0 }} />
        <Moon className="absolute top-[10px] right-[8px] h-3.5 w-3.5" style={{ color: "var(--color-primary)", opacity: isDark ? 0 : 0.3 }} />
      </button>
    );
  }

  // ── icon-label ──
  if (style === "icon-label") {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="header-btn !w-auto px-3 gap-1.5"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="flex items-center gap-1.5"
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span className="text-[11px] font-semibold">
            {isDark ? (isAr ? "فاتح" : "Light") : (isAr ? "داكن" : "Dark")}
          </span>
        </motion.div>
      </motion.button>
    );
  }

  // ── minimal ──
  if (style === "minimal") {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="h-[38px] w-[38px] flex items-center justify-center cursor-pointer"
        style={{ transition: "color 0.3s ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = ""; }}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.div>
      </motion.button>
    );
  }

  // ── icon (default) ──
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      className="header-btn"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        {isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </motion.div>
    </motion.button>
  );
}
