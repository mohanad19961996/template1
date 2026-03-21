"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Navigation,
  Eye,
  EyeOff,
  Paintbrush,
  MousePointer,
  Sparkles,
  RectangleHorizontal,
  ToggleLeft,
  ToggleRight,
  Layers,
  Circle,
  Ruler,
  CloudFog,
  MonitorSmartphone,
  Sun,
  Moon,
  ChevronDown,
  LayoutDashboard,
  Globe,
  Palette,
  SunMoon,
  Languages,
  PanelTop,
} from "lucide-react";
import type {
  NavbarVariant,
  NavbarHover,
  NavbarAnimation,
  CtaStyle,
  NavbarNavStyle,
  NavbarLogoShape,
  NavbarHeight,
  NavbarShadow,
  DarkModeStyle,
  LangSwitcherStyle,
  ThemePanelStyle,
} from "@/lib/site-config";

/* ═══════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl cursor-pointer"
      style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)", transition: "all 0.3s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.25)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.02)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; e.currentTarget.style.background = "transparent"; }}
    >
      <span className="text-[12px] font-medium">{label}</span>
      {checked ? <ToggleRight className="h-5 w-5" style={{ color: "var(--color-primary)" }} /> : <ToggleLeft className="h-5 w-5" style={{ opacity: 0.3 }} />}
    </button>
  );
}

function OptionGroup<T extends string>({ label, icon: Icon, options, value, onChange, columns = 2 }: {
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  options: { value: T; labelEn: string; labelAr: string; descEn?: string; descAr?: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: number;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
        <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ opacity: 0.5 }}>{label}</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="relative py-2 px-3 rounded-lg text-start cursor-pointer"
              style={{
                border: active ? "1.5px solid var(--color-primary)" : "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
                background: active ? "rgba(var(--color-primary-rgb) / 0.06)" : "transparent",
                color: active ? "var(--color-primary)" : "inherit",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.3)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)"; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; e.currentTarget.style.background = "transparent"; } }}
            >
              <div className="text-[12px] font-medium">{isAr ? opt.labelAr : opt.labelEn}</div>
              {opt.descEn && <div className="text-[9px] mt-0.5" style={{ opacity: 0.4 }}>{isAr ? opt.descAr : opt.descEn}</div>}
              {active && <div className="absolute top-1 right-1.5 rtl:right-auto rtl:left-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-primary)" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}>
      <h3 className="text-[13px] font-bold tracking-tight pb-3" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>{title}</h3>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVE PREVIEW — Full interactive navbar replica
   ═══════════════════════════════════════════════════════════════ */

function LivePreview() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config } = useSiteConfig();
  const nav = config.navbar;
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [ctaHovered, setCtaHovered] = useState(false);
  const [dashHovered, setDashHovered] = useState(false);
  const [langHovered, setLangHovered] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const pages = config.pages.filter((p) => p.inNavbar);
  const heightPx = nav.height === "sm" ? 44 : nav.height === "lg" ? 60 : 52;
  const logoShapeClass = nav.logoShape === "circle" ? "rounded-full" : nav.logoShape === "square" ? "rounded-[4px]" : "rounded-lg";

  /* variant background */
  const bgStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {};
    switch (nav.variant) {
      case "solid": return { ...base, background: darkMode ? "#0a0a0b" : "#ffffff" };
      case "minimal": return { ...base, background: darkMode ? "rgba(10,10,11,0.95)" : "rgba(255,255,255,0.95)" };
      case "gradient": return { ...base, background: `linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.06), rgba(var(--color-primary-rgb) / 0.14), rgba(var(--color-primary-rgb) / 0.06))`, backdropFilter: "blur(16px)" };
      case "bordered": return { ...base, background: darkMode ? "#0a0a0b" : "#ffffff", borderBottom: "2px solid rgba(var(--color-primary-rgb) / 0.15)" };
      case "floating": return { ...base, background: darkMode ? `linear-gradient(135deg, rgba(var(--color-primary-rgb)/0.1), rgba(15,15,17,0.9), rgba(var(--color-primary-rgb)/0.1))` : `linear-gradient(135deg, rgba(var(--color-primary-rgb)/0.08), rgba(255,255,255,0.9), rgba(var(--color-primary-rgb)/0.08))`, backdropFilter: "blur(16px)", margin: "8px 12px 0", borderRadius: "14px", border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)" };
      case "glass": default: return { ...base, background: darkMode ? `linear-gradient(135deg, rgba(var(--color-primary-rgb)/0.12), rgba(15,15,17,0.85), rgba(var(--color-primary-rgb)/0.12))` : `linear-gradient(135deg, rgba(var(--color-primary-rgb)/0.1), rgba(255,255,255,0.8), rgba(var(--color-primary-rgb)/0.1))`, backdropFilter: "blur(16px)" };
    }
  };

  const shadowStyles = (): React.CSSProperties => {
    if (nav.shadow === "none") return {};
    if (nav.shadow === "lg") return { boxShadow: "0 8px 28px rgba(var(--color-primary-rgb) / 0.1), 0 2px 8px rgba(0,0,0,0.06)" };
    return { boxShadow: "0 4px 16px rgba(var(--color-primary-rgb) / 0.06), 0 1px 4px rgba(0,0,0,0.03)" };
  };

  /* nav container */
  const navContainerStyle = (): React.CSSProperties => {
    switch (nav.navStyle) {
      case "separate": return {};
      case "underlined": return { borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.1)", borderRadius: "0", paddingBottom: "3px" };
      case "plain": return {};
      case "pill-container": default: return { background: "rgba(var(--color-primary-rgb) / 0.06)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)", borderRadius: "9999px", padding: "3px 6px" };
    }
  };

  /* animation config for layout transitions */
  const animConfig = () => {
    if (nav.animation === "spring") return { type: "spring" as const, stiffness: 400, damping: 28 };
    if (nav.animation === "bounce") return { type: "spring" as const, stiffness: 550, damping: 14 };
    if (nav.animation === "smooth") return { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };
    return { duration: 0 };
  };

  /* CTA styles */
  const ctaBaseStyle = (): React.CSSProperties => {
    const hov = ctaHovered;
    switch (nav.ctaStyle) {
      case "outlined": return { border: "1.5px solid rgba(var(--color-primary-rgb) / 0.2)", color: hov ? "white" : "var(--color-primary)", background: hov ? "var(--color-primary)" : "transparent", transform: hov ? "translateY(-1px)" : "none", transition: "all 0.3s ease" };
      case "gradient": return { background: `linear-gradient(135deg, var(--color-primary) 0%, rgba(var(--color-primary-rgb)/0.7) 50%, var(--color-primary) 100%)`, backgroundSize: "200% 200%", animation: "gradientShift 3s ease infinite", color: "white", boxShadow: hov ? "0 6px 20px rgba(var(--color-primary-rgb)/0.35)" : "0 2px 10px rgba(var(--color-primary-rgb)/0.2)", transform: hov ? "translateY(-1px)" : "none", transition: "all 0.3s ease" };
      case "glow": return { background: "var(--color-primary)", color: "white", boxShadow: hov ? "0 0 24px rgba(var(--color-primary-rgb)/0.5), 0 0 48px rgba(var(--color-primary-rgb)/0.2)" : "0 0 16px rgba(var(--color-primary-rgb)/0.35), 0 0 32px rgba(var(--color-primary-rgb)/0.12)", transform: hov ? "translateY(-1px)" : "none", transition: "all 0.3s ease" };
      case "filled": default: return { background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb)/0.85))", color: "white", boxShadow: hov ? "0 6px 20px rgba(var(--color-primary-rgb)/0.35)" : "0 2px 10px rgba(var(--color-primary-rgb)/0.2)", transform: hov ? "translateY(-1px)" : "none", transition: "all 0.3s ease" };
    }
  };

  const previewTextColor = darkMode ? "#e4e4e7" : "#18181b";
  const previewMutedColor = darkMode ? "rgba(228,228,231,0.4)" : "rgba(24,24,27,0.4)";
  const previewBg = darkMode ? "#0a0a0b" : "#fafafa";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
        <MonitorSmartphone className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
        <span className="text-[12px] font-bold tracking-tight">{isAr ? "معاينة حية تفاعلية" : "Interactive Live Preview"}</span>
        <div className="flex-1" />
        {/* Browser dots */}
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
        </div>
      </div>

      {/* Browser address bar */}
      <div className="px-5 py-2 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.04)" }}>
        <div className="flex-1 h-7 rounded-lg flex items-center px-3" style={{ background: "rgba(var(--color-primary-rgb) / 0.03)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
          <span className="text-[10px] font-medium" style={{ opacity: 0.3 }}>https://yoursite.com</span>
        </div>
      </div>

      {/* ─── Preview content ─── */}
      <div className="px-4 pb-4 pt-2">
        <div className="rounded-xl overflow-hidden" style={{ background: previewBg, border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>

          {/* ═══ NAVBAR PREVIEW ═══ */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${nav.variant}-${nav.height}-${nav.shadow}-${darkMode}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.35 }}
              className="relative"
              style={{ ...bgStyle(), ...shadowStyles() }}
            >
              {/* Top glow */}
              {nav.showTopGlow && (
                <div className="absolute top-0 inset-x-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent 5%, rgba(var(--color-primary-rgb)/0.5) 30%, rgba(var(--color-primary-rgb)/0.8) 50%, rgba(var(--color-primary-rgb)/0.5) 70%, transparent 95%)` }} />
              )}
              {/* Bottom border */}
              {nav.showBottomBorder && (
                <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb)/0.15), transparent)` }} />
              )}

              <div className="flex items-center justify-between px-5" style={{ height: `${heightPx}px` }}>

                {/* ── LEFT: Logo + Theme ── */}
                <div className="flex items-center gap-3">
                  {nav.showLogo && (
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        key={nav.logoShape}
                        className={cn("h-8 w-8 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden", logoShapeClass)}
                        style={{ background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb)/0.8))", boxShadow: "0 2px 8px rgba(var(--color-primary-rgb)/0.25)" }}
                        initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 18 }}
                      >
                        T
                      </motion.div>
                      {nav.showLogoText && (
                        <motion.span
                          className="text-[13px] font-bold tracking-tight"
                          style={{ color: previewTextColor }}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          Template
                        </motion.span>
                      )}
                    </div>
                  )}

                  {/* Theme switcher preview — variant-aware */}
                  {nav.showThemeSwitcher && (() => {
                    const themeColors = ["#E11D48", "#7C3AED", "#0066FF", "#059669", "#D97706", "#0891B2", "#4F46E5", "#DB2777", "#16A34A", "#EA580C"];
                    const themeDropdown = (
                      <AnimatePresence>
                        {themeOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full mt-1.5 start-0 z-50 rounded-xl p-2.5"
                            style={{ background: "var(--color-card)", border: "1px solid rgba(var(--color-primary-rgb)/0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.12)", width: "140px" }}
                          >
                            <div className="h-[1.5px] -mt-2.5 -mx-2.5 mb-2 rounded-t-xl" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
                            <div className="grid grid-cols-5 gap-1.5">
                              {themeColors.map((c) => (
                                <div key={c} className="h-5 w-5 rounded-full cursor-pointer" style={{ background: c, boxShadow: `0 1px 3px ${c}30`, transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }} />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    );

                    if (nav.themePanelStyle === "dots-inline") {
                      return (
                        <div className="flex items-center gap-1">
                          {themeColors.slice(0, 6).map((c) => (
                            <div key={c} className="h-4 w-4 rounded-full cursor-pointer" style={{ background: c, boxShadow: `0 1px 3px ${c}30`, transition: "transform 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }} />
                          ))}
                        </div>
                      );
                    }

                    if (nav.themePanelStyle === "swatch-only") {
                      return (
                        <div className="relative">
                          <button
                            onClick={() => setThemeOpen(!themeOpen)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer"
                            style={{ border: "1px solid rgba(var(--color-primary-rgb)/0.1)", transition: "all 0.3s ease" }}
                          >
                            <div className="h-4 w-4 rounded-full" style={{ background: "var(--color-primary)", boxShadow: "0 0 0 1px rgba(var(--color-primary-rgb)/0.15)" }} />
                          </button>
                          {themeDropdown}
                        </div>
                      );
                    }

                    if (nav.themePanelStyle === "minimal") {
                      return (
                        <div className="relative">
                          <button
                            onClick={() => setThemeOpen(!themeOpen)}
                            className="h-8 w-8 flex items-center justify-center cursor-pointer"
                          >
                            <div className="h-3.5 w-3.5 rounded-full" style={{ background: "var(--color-primary)" }} />
                          </button>
                          {themeDropdown}
                        </div>
                      );
                    }

                    // dropdown (default)
                    return (
                      <div className="relative">
                        <button
                          onClick={() => setThemeOpen(!themeOpen)}
                          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg cursor-pointer"
                          style={{
                            background: themeOpen ? "rgba(var(--color-primary-rgb)/0.1)" : "rgba(var(--color-primary-rgb)/0.04)",
                            border: themeOpen ? "1px solid rgba(var(--color-primary-rgb)/0.15)" : "1px solid rgba(var(--color-primary-rgb)/0.06)",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <div className="h-3.5 w-3.5 rounded-full" style={{ background: "var(--color-primary)", boxShadow: "0 0 0 1px rgba(var(--color-primary-rgb)/0.15)" }} />
                          <span className="text-[10px] font-semibold" style={{ color: previewTextColor }}>Theme</span>
                          <motion.div animate={{ rotate: themeOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="h-2.5 w-2.5" style={{ opacity: 0.4, color: previewTextColor }} />
                          </motion.div>
                        </button>
                        {themeDropdown}
                      </div>
                    );
                  })()}
                </div>

                {/* ── CENTER: Nav links ── */}
                <div className={cn("flex items-center gap-0.5")} style={navContainerStyle()}>
                  {pages.slice(0, 5).map((page, i) => {
                    const active = i === activeIdx;
                    const hovered = hoveredIdx === i;
                    return (
                      <button
                        key={page.key}
                        onClick={() => setActiveIdx(i)}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className="relative px-3 py-1.5 rounded-full text-[10px] font-semibold cursor-pointer"
                        style={{ transition: "color 0.2s ease", color: (!active && hovered) ? "var(--color-primary)" : undefined }}
                      >
                        {/* Active pill */}
                        {active && nav.hover === "pill" && (
                          <motion.div layoutId="pvPill" className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb)/0.85))`, boxShadow: `0 2px 10px rgba(var(--color-primary-rgb)/0.35)` }} transition={animConfig()} />
                        )}
                        {/* Active underline */}
                        {active && nav.hover === "underline" && (
                          <motion.div layoutId="pvPill" className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full" style={{ background: "var(--color-primary)" }} transition={animConfig()} />
                        )}
                        {/* Active glow */}
                        {active && nav.hover === "glow" && (
                          <motion.div layoutId="pvPill" className="absolute inset-0 rounded-full" style={{ background: "rgba(var(--color-primary-rgb)/0.1)", boxShadow: "0 0 14px rgba(var(--color-primary-rgb)/0.25), inset 0 0 6px rgba(var(--color-primary-rgb)/0.08)" }} transition={animConfig()} />
                        )}
                        {/* Active scale */}
                        {active && nav.hover === "scale" && (
                          <motion.div layoutId="pvPill" className="absolute inset-0 rounded-full" style={{ background: "rgba(var(--color-primary-rgb)/0.08)", border: "1.5px solid rgba(var(--color-primary-rgb)/0.2)" }} transition={animConfig()} />
                        )}
                        {/* Active fill */}
                        {active && nav.hover === "fill" && (
                          <motion.div layoutId="pvPill" className="absolute inset-0 rounded-full" style={{ background: "var(--color-primary)" }} transition={animConfig()} />
                        )}

                        {/* Hover effects (non-active) */}
                        {!active && hovered && nav.hover === "pill" && <div className="absolute inset-0 rounded-full" style={{ background: "rgba(var(--color-primary-rgb)/0.08)" }} />}
                        {!active && hovered && nav.hover === "underline" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full" style={{ background: "var(--color-primary)", opacity: 0.5 }} />}
                        {!active && hovered && nav.hover === "glow" && <div className="absolute inset-0 rounded-full" style={{ background: "rgba(var(--color-primary-rgb)/0.05)", boxShadow: "0 0 8px rgba(var(--color-primary-rgb)/0.12)" }} />}
                        {!active && hovered && nav.hover === "scale" && <div className="absolute inset-[-1px] rounded-full" style={{ background: "rgba(var(--color-primary-rgb)/0.05)", border: "1px solid rgba(var(--color-primary-rgb)/0.1)" }} />}
                        {!active && hovered && nav.hover === "fill" && <div className="absolute inset-0 rounded-full" style={{ background: "rgba(var(--color-primary-rgb)/0.08)" }} />}

                        <span className="relative z-10" style={{ color: active && (nav.hover === "pill" || nav.hover === "fill") ? "white" : active ? "var(--color-primary)" : previewTextColor }}>
                          {isAr ? page.labelAr : page.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* ── RIGHT: Actions ── */}
                <div className="flex items-center gap-2">
                  {/* Dark/light toggle — variant-aware */}
                  {nav.darkModeStyle === "pill-switch" ? (
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="relative h-8 w-[52px] rounded-full cursor-pointer"
                      style={{ background: darkMode ? "rgba(var(--color-primary-rgb)/0.15)" : "rgba(var(--color-primary-rgb)/0.08)", border: "1.5px solid rgba(var(--color-primary-rgb)/0.12)", transition: "all 0.3s ease" }}
                    >
                      <motion.div
                        className="absolute top-[2px] h-[24px] w-[24px] rounded-full flex items-center justify-center"
                        style={{ background: "var(--color-primary)", boxShadow: "0 2px 6px rgba(var(--color-primary-rgb)/0.3)" }}
                        animate={{ left: darkMode ? "calc(100% - 26px)" : "2px" }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <motion.div key={darkMode ? "d" : "l"} initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                          {darkMode ? <Moon className="h-2.5 w-2.5 text-white" /> : <Sun className="h-2.5 w-2.5 text-white" />}
                        </motion.div>
                      </motion.div>
                      <Sun className="absolute top-[7px] left-[6px] h-3 w-3" style={{ color: "var(--color-primary)", opacity: darkMode ? 0.3 : 0 }} />
                      <Moon className="absolute top-[7px] right-[6px] h-3 w-3" style={{ color: "var(--color-primary)", opacity: darkMode ? 0 : 0.3 }} />
                    </button>
                  ) : nav.darkModeStyle === "icon-label" ? (
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      style={{ border: "1px solid rgba(var(--color-primary-rgb)/0.1)", transition: "all 0.3s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb)/0.06)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb)/0.2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb)/0.1)"; }}
                    >
                      <motion.div key={darkMode ? "d" : "l"} initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="flex items-center gap-1.5">
                        {darkMode ? <Sun className="h-3 w-3" style={{ color: previewTextColor }} /> : <Moon className="h-3 w-3" style={{ color: previewTextColor }} />}
                        <span className="text-[9px] font-semibold" style={{ color: previewTextColor }}>{darkMode ? (isAr ? "فاتح" : "Light") : (isAr ? "داكن" : "Dark")}</span>
                      </motion.div>
                    </button>
                  ) : nav.darkModeStyle === "minimal" ? (
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="h-8 w-8 flex items-center justify-center cursor-pointer"
                      style={{ transition: "color 0.3s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = ""; }}
                    >
                      <motion.div key={darkMode ? "d" : "l"} initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                        {darkMode ? <Sun className="h-3.5 w-3.5" style={{ color: previewTextColor }} /> : <Moon className="h-3.5 w-3.5" style={{ color: previewTextColor }} />}
                      </motion.div>
                    </button>
                  ) : (
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer"
                      style={{ border: "1px solid rgba(var(--color-primary-rgb)/0.1)", transition: "all 0.3s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb)/0.06)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb)/0.2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb)/0.1)"; }}
                    >
                      <motion.div key={darkMode ? "d" : "l"} initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                        {darkMode ? <Sun className="h-3.5 w-3.5" style={{ color: previewTextColor }} /> : <Moon className="h-3.5 w-3.5" style={{ color: previewTextColor }} />}
                      </motion.div>
                    </button>
                  )}

                  {/* Language switcher — variant-aware */}
                  {nav.showLanguageSwitcher && nav.langSwitcherStyle === "icon-text" ? (
                    <button
                      className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      style={{ border: "1px solid rgba(var(--color-primary-rgb)/0.1)", transition: "all 0.3s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb)/0.06)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb)/0.2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb)/0.1)"; }}
                    >
                      <Globe className="h-3 w-3" style={{ color: previewTextColor, opacity: 0.6 }} />
                      <span style={{ color: previewTextColor }}>{isAr ? "EN" : "عربي"}</span>
                    </button>
                  ) : nav.showLanguageSwitcher && nav.langSwitcherStyle === "badge" ? (
                    <button
                      className="h-8 px-3 rounded-full flex items-center justify-center text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      style={{
                        background: langHovered ? "var(--color-primary)" : "rgba(var(--color-primary-rgb)/0.06)",
                        border: langHovered ? "1.5px solid var(--color-primary)" : "1.5px solid rgba(var(--color-primary-rgb)/0.1)",
                        color: langHovered ? "white" : "var(--color-primary)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={() => setLangHovered(true)}
                      onMouseLeave={() => setLangHovered(false)}
                    >
                      {isAr ? "EN" : "عربي"}
                    </button>
                  ) : nav.showLanguageSwitcher && nav.langSwitcherStyle === "minimal" ? (
                    <button
                      className="h-8 px-2 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      style={{ color: langHovered ? "var(--color-primary)" : previewTextColor, transition: "color 0.3s ease" }}
                      onMouseEnter={() => setLangHovered(true)}
                      onMouseLeave={() => setLangHovered(false)}
                    >
                      {isAr ? "EN" : "عربي"}
                    </button>
                  ) : nav.showLanguageSwitcher ? (
                    <button
                      className="h-8 px-2.5 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      style={{
                        border: langHovered ? "1px solid rgba(var(--color-primary-rgb)/0.2)" : "1px solid rgba(var(--color-primary-rgb)/0.1)",
                        background: langHovered ? "rgba(var(--color-primary-rgb)/0.06)" : "transparent",
                        color: langHovered ? "var(--color-primary)" : previewTextColor,
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={() => setLangHovered(true)}
                      onMouseLeave={() => setLangHovered(false)}
                    >
                      {isAr ? "EN" : "عربي"}
                    </button>
                  ) : null}

                  {/* Dashboard button */}
                  {nav.showDashboardBtn && (
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer"
                      style={{
                        border: dashHovered ? "1.5px solid var(--color-primary)" : "1.5px solid rgba(var(--color-primary-rgb)/0.12)",
                        background: dashHovered ? "var(--color-primary)" : "transparent",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={() => setDashHovered(true)}
                      onMouseLeave={() => setDashHovered(false)}
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" style={{ color: dashHovered ? "white" : "var(--color-primary)", transition: "color 0.3s ease" }} />
                    </div>
                  )}

                  {/* CTA */}
                  {nav.ctaStyle !== "none" && (
                    <motion.div
                      key={nav.ctaStyle}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="h-8 px-3.5 rounded-lg flex items-center gap-1.5 text-[10px] font-semibold cursor-pointer"
                      style={ctaBaseStyle()}
                      onMouseEnter={() => setCtaHovered(true)}
                      onMouseLeave={() => setCtaHovered(false)}
                    >
                      {isAr ? "ابدأ الآن" : "Get Started"}
                      {isAr ? <ArrowLeft className="h-2.5 w-2.5" /> : <ArrowRight className="h-2.5 w-2.5" />}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ═══ SIMULATED PAGE BODY ═══ */}
          <div style={{ background: previewBg, color: previewTextColor, transition: "all 0.4s ease" }}>
            {/* Hero */}
            <div className="px-6 pt-8 pb-6 text-center">
              <motion.div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-semibold mb-3"
                style={{ background: "rgba(var(--color-primary-rgb)/0.06)", border: "1px solid rgba(var(--color-primary-rgb)/0.08)", color: "var(--color-primary)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Sparkles className="h-2 w-2" />
                {isAr ? "قالب احترافي" : "Premium Template"}
              </motion.div>
              <div className="h-4 w-3/4 mx-auto rounded-full mb-2" style={{ background: `linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb)/0.1), transparent)` }} />
              <div className="h-3 w-1/2 mx-auto rounded-full mb-4" style={{ background: previewMutedColor, opacity: 0.3 }} />
              <div className="flex items-center justify-center gap-2">
                <div className="h-6 w-20 rounded-lg" style={{ background: "var(--color-primary)" }} />
                <div className="h-6 w-16 rounded-lg" style={{ border: "1px solid rgba(var(--color-primary-rgb)/0.15)" }} />
              </div>
            </div>
            {/* Cards row */}
            <div className="px-6 pb-6 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg p-3" style={{ border: "1px solid rgba(var(--color-primary-rgb)/0.06)", background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }}>
                  <div className="h-5 w-5 rounded-md mb-2" style={{ background: "rgba(var(--color-primary-rgb)/0.08)", border: "1px solid rgba(var(--color-primary-rgb)/0.06)" }} />
                  <div className="h-2 w-3/4 rounded-full mb-1" style={{ background: previewMutedColor, opacity: 0.2 }} />
                  <div className="h-1.5 w-1/2 rounded-full" style={{ background: previewMutedColor, opacity: 0.1 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interaction hint */}
      <div className="px-5 pb-3 flex items-center gap-2 justify-center" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.04)" }}>
        <MousePointer className="h-2.5 w-2.5" style={{ color: "var(--color-primary)" }} />
        <span className="text-[9px] font-medium" style={{ opacity: 0.35 }}>
          {isAr ? "حرّك الماوس على العناصر وانقر للتفاعل — كل شيء يعمل" : "Hover & click any element — everything is interactive"}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export function NavbarDashboard() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowRight : ArrowLeft;

  const { config, updateNavbar, updatePage, resetConfig } = useSiteConfig();
  const nav = config.navbar;

  const variantOptions: { value: NavbarVariant; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "glass", labelEn: "Glass", labelAr: "زجاجي", descEn: "Blur + transparency", descAr: "ضبابي + شفاف" },
    { value: "solid", labelEn: "Solid", labelAr: "صلب", descEn: "Opaque background", descAr: "خلفية صلبة" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "Clean & subtle", descAr: "نظيف ومتواضع" },
    { value: "floating", labelEn: "Floating", labelAr: "عائم", descEn: "Detached with border", descAr: "منفصل مع حدود" },
    { value: "gradient", labelEn: "Gradient", labelAr: "تدرج", descEn: "Color gradient flow", descAr: "تدفق لوني متدرج" },
    { value: "bordered", labelEn: "Bordered", labelAr: "محدد", descEn: "Strong bottom line", descAr: "خط سفلي قوي" },
  ];

  const hoverOptions: { value: NavbarHover; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "pill", labelEn: "Pill", labelAr: "كبسولة", descEn: "Filled pill indicator", descAr: "مؤشر كبسولة ممتلئ" },
    { value: "underline", labelEn: "Underline", labelAr: "خط سفلي", descEn: "Bottom line accent", descAr: "خط سفلي مميز" },
    { value: "glow", labelEn: "Glow", labelAr: "توهج", descEn: "Soft glow effect", descAr: "تأثير توهج ناعم" },
    { value: "scale", labelEn: "Scale", labelAr: "تكبير", descEn: "Border + scale up", descAr: "حدود + تكبير" },
    { value: "fill", labelEn: "Fill", labelAr: "تعبئة", descEn: "Solid color fill", descAr: "تعبئة لون صلب" },
    { value: "none", labelEn: "None", labelAr: "بدون", descEn: "No hover effect", descAr: "بدون تأثير" },
  ];

  const animationOptions: { value: NavbarAnimation; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "spring", labelEn: "Spring", labelAr: "نابض", descEn: "Bouncy spring physics", descAr: "فيزياء نابضية" },
    { value: "smooth", labelEn: "Smooth", labelAr: "سلس", descEn: "Eased transition", descAr: "انتقال سلس" },
    { value: "bounce", labelEn: "Bounce", labelAr: "ارتداد", descEn: "Elastic bounce", descAr: "ارتداد مرن" },
    { value: "none", labelEn: "None", labelAr: "بدون", descEn: "Instant, no animation", descAr: "فوري بدون حركة" },
  ];

  const ctaOptions: { value: CtaStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "filled", labelEn: "Filled", labelAr: "ممتلئ", descEn: "Solid gradient button", descAr: "زر متدرج صلب" },
    { value: "outlined", labelEn: "Outlined", labelAr: "محدد", descEn: "Border only button", descAr: "زر بحدود فقط" },
    { value: "gradient", labelEn: "Gradient", labelAr: "متدرج", descEn: "Animated gradient", descAr: "تدرج متحرك" },
    { value: "glow", labelEn: "Glow", labelAr: "توهج", descEn: "Neon glow button", descAr: "زر بتوهج نيون" },
    { value: "none", labelEn: "Hidden", labelAr: "مخفي", descEn: "No CTA button", descAr: "بدون زر" },
  ];

  const navStyleOptions: { value: NavbarNavStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "pill-container", labelEn: "Pill Container", labelAr: "حاوية كبسولة", descEn: "Links inside pill bg", descAr: "روابط داخل خلفية" },
    { value: "separate", labelEn: "Separate", labelAr: "منفصل", descEn: "Individual link items", descAr: "عناصر منفصلة" },
    { value: "underlined", labelEn: "Underlined", labelAr: "مسطر", descEn: "Bottom line container", descAr: "حاوية بخط سفلي" },
    { value: "plain", labelEn: "Plain", labelAr: "عادي", descEn: "No container style", descAr: "بدون حاوية" },
  ];

  const logoShapeOptions: { value: NavbarLogoShape; labelEn: string; labelAr: string }[] = [
    { value: "rounded", labelEn: "Rounded", labelAr: "مستدير" },
    { value: "circle", labelEn: "Circle", labelAr: "دائري" },
    { value: "square", labelEn: "Square", labelAr: "مربع" },
  ];

  const heightOptions: { value: NavbarHeight; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "sm", labelEn: "Small", labelAr: "صغير", descEn: "48px compact", descAr: "مضغوط 48px" },
    { value: "md", labelEn: "Medium", labelAr: "متوسط", descEn: "64px default", descAr: "افتراضي 64px" },
    { value: "lg", labelEn: "Large", labelAr: "كبير", descEn: "80px spacious", descAr: "واسع 80px" },
  ];

  const shadowOptions: { value: NavbarShadow; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "none", labelEn: "None", labelAr: "بدون", descEn: "No shadow", descAr: "بدون ظل" },
    { value: "sm", labelEn: "Subtle", labelAr: "خفيف", descEn: "Light drop shadow", descAr: "ظل خفيف" },
    { value: "lg", labelEn: "Strong", labelAr: "قوي", descEn: "Heavy drop shadow", descAr: "ظل كثيف" },
  ];

  const darkModeOptions: { value: DarkModeStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "icon", labelEn: "Icon", labelAr: "أيقونة", descEn: "Bordered icon button", descAr: "زر أيقونة بحدود" },
    { value: "icon-label", labelEn: "Icon + Label", labelAr: "أيقونة + نص", descEn: "Icon with text label", descAr: "أيقونة مع نص" },
    { value: "pill-switch", labelEn: "Pill Switch", labelAr: "مفتاح كبسولة", descEn: "Sliding toggle pill", descAr: "مفتاح منزلق" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "No border, icon only", descAr: "بدون حدود" },
  ];

  const langSwitcherOptions: { value: LangSwitcherStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "text", labelEn: "Text", labelAr: "نص", descEn: "Bordered text button", descAr: "زر نص بحدود" },
    { value: "icon-text", labelEn: "Icon + Text", labelAr: "أيقونة + نص", descEn: "Globe icon with text", descAr: "أيقونة كرة مع نص" },
    { value: "badge", labelEn: "Badge", labelAr: "شارة", descEn: "Pill badge style", descAr: "نمط شارة" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "No border, text only", descAr: "بدون حدود" },
  ];

  const themePanelOptions: { value: ThemePanelStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "dropdown", labelEn: "Dropdown", labelAr: "قائمة منسدلة", descEn: "Swatch + label + menu", descAr: "لون + نص + قائمة" },
    { value: "dots-inline", labelEn: "Dots Inline", labelAr: "نقاط مدمجة", descEn: "Color dots in navbar", descAr: "نقاط ألوان في الشريط" },
    { value: "swatch-only", labelEn: "Swatch Only", labelAr: "لون فقط", descEn: "Dot button + dropdown", descAr: "زر لون + قائمة" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "Small dot, no border", descAr: "نقطة صغيرة بدون حدود" },
  ];

  const navPages = config.pages.filter((p) => p.key !== "dashboard");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 px-4 sm:px-6" style={{ background: "var(--color-background)", borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
        <div className="max-w-6xl mx-auto h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-1.5 rounded-lg cursor-pointer"
            style={{ color: "var(--color-primary)", border: "1px solid rgba(var(--color-primary-rgb) / 0.15)", transition: "all 0.3s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--color-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)"; }}
          >
            <Arrow className="h-3 w-3" />
            {isAr ? "لوحة التحكم" : "Dashboard"}
          </Link>
          <h1 className="text-[15px] font-bold tracking-tight">{isAr ? "شريط التنقل" : "Navbar"}</h1>
          <button
            onClick={resetConfig}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg cursor-pointer"
            style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.12)", transition: "all 0.3s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.3)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.12)"; e.currentTarget.style.background = "transparent"; }}
          >
            <RotateCcw className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
            {isAr ? "إعادة تعيين" : "Reset"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ═══ LIVE PREVIEW — Full width at top ═══ */}
        <LivePreview />

        {/* ═══ CONTROLS ═══ */}
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title={isAr ? "نمط شريط التنقل" : "Navbar Variant"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={Paintbrush} options={variantOptions} value={nav.variant} onChange={(v) => updateNavbar({ variant: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "حاوية الروابط" : "Links Container"}>
            <OptionGroup label={isAr ? "نمط الحاوية" : "Nav Style"} icon={Layers} options={navStyleOptions} value={nav.navStyle} onChange={(v) => updateNavbar({ navStyle: v })} columns={2} />
          </SectionCard>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title={isAr ? "تأثير التحويم" : "Hover Effect"}>
            <OptionGroup label={isAr ? "التأثير" : "Effect"} icon={MousePointer} options={hoverOptions} value={nav.hover} onChange={(v) => updateNavbar({ hover: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "الحركة والانتقال" : "Animation"}>
            <OptionGroup label={isAr ? "نوع الحركة" : "Type"} icon={Sparkles} options={animationOptions} value={nav.animation} onChange={(v) => updateNavbar({ animation: v })} columns={2} />
          </SectionCard>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title={isAr ? "زر الإجراء (CTA)" : "CTA Button"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={RectangleHorizontal} options={ctaOptions} value={nav.ctaStyle} onChange={(v) => updateNavbar({ ctaStyle: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "الأبعاد والشكل" : "Size & Shape"}>
            <OptionGroup label={isAr ? "ارتفاع الشريط" : "Navbar Height"} icon={Ruler} options={heightOptions} value={nav.height} onChange={(v) => updateNavbar({ height: v })} columns={3} />
            <OptionGroup label={isAr ? "شكل الشعار" : "Logo Shape"} icon={Circle} options={logoShapeOptions} value={nav.logoShape} onChange={(v) => updateNavbar({ logoShape: v })} columns={3} />
            <OptionGroup label={isAr ? "الظل عند التمرير" : "Scroll Shadow"} icon={CloudFog} options={shadowOptions} value={nav.shadow} onChange={(v) => updateNavbar({ shadow: v })} columns={3} />
          </SectionCard>
        </div>

        {/* Row 4: Button Styles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SectionCard title={isAr ? "زر الوضع الداكن" : "Dark Mode Button"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={SunMoon} options={darkModeOptions} value={nav.darkModeStyle} onChange={(v) => updateNavbar({ darkModeStyle: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "محوّل اللغة" : "Language Switcher"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={Languages} options={langSwitcherOptions} value={nav.langSwitcherStyle} onChange={(v) => updateNavbar({ langSwitcherStyle: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "لوحة السمات" : "Theme Panel"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={Palette} options={themePanelOptions} value={nav.themePanelStyle} onChange={(v) => updateNavbar({ themePanelStyle: v })} columns={2} />
          </SectionCard>
        </div>

        {/* Toggles */}
        <SectionCard title={isAr ? "عناصر الواجهة" : "UI Elements"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <Toggle checked={nav.showTopGlow} onChange={(v) => updateNavbar({ showTopGlow: v })} label={isAr ? "خط التوهج العلوي" : "Top Glow Line"} />
            <Toggle checked={nav.showBottomBorder} onChange={(v) => updateNavbar({ showBottomBorder: v })} label={isAr ? "الحد السفلي" : "Bottom Border"} />
            <Toggle checked={nav.sticky} onChange={(v) => updateNavbar({ sticky: v })} label={isAr ? "ثابت عند التمرير" : "Sticky on Scroll"} />
            <Toggle checked={nav.showLogo} onChange={(v) => updateNavbar({ showLogo: v })} label={isAr ? "إظهار الشعار" : "Show Logo"} />
            <Toggle checked={nav.showLogoText} onChange={(v) => updateNavbar({ showLogoText: v })} label={isAr ? "نص الشعار" : "Logo Text"} />
            <Toggle checked={nav.showThemeSwitcher} onChange={(v) => updateNavbar({ showThemeSwitcher: v })} label={isAr ? "محوّل السمة" : "Theme Switcher"} />
            <Toggle checked={nav.showLanguageSwitcher} onChange={(v) => updateNavbar({ showLanguageSwitcher: v })} label={isAr ? "محوّل اللغة" : "Language Switcher"} />
            <Toggle checked={nav.showDashboardBtn} onChange={(v) => updateNavbar({ showDashboardBtn: v })} label={isAr ? "زر لوحة التحكم" : "Dashboard Button"} />
          </div>
        </SectionCard>

        {/* Pages */}
        <SectionCard title={isAr ? "صفحات التنقل" : "Navigation Pages"}>
          <div className="space-y-1.5">
            {navPages.map((page) => (
              <div key={page.key} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: page.inNavbar ? "rgba(var(--color-primary-rgb) / 0.08)" : "rgba(var(--color-primary-rgb) / 0.02)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
                    {page.inNavbar ? <Eye className="h-3 w-3" style={{ color: "var(--color-primary)" }} /> : <EyeOff className="h-3 w-3" style={{ opacity: 0.25 }} />}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold">{isAr ? page.labelAr : page.labelEn}</div>
                    <div className="text-[10px]" style={{ opacity: 0.35 }}>{page.href}</div>
                  </div>
                </div>
                <button
                  onClick={() => updatePage(page.key, { inNavbar: !page.inNavbar })}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-md cursor-pointer"
                  style={{
                    border: page.inNavbar ? "1px solid var(--color-primary)" : "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                    color: page.inNavbar ? "var(--color-primary)" : "inherit",
                    background: page.inNavbar ? "rgba(var(--color-primary-rgb) / 0.06)" : "transparent",
                    opacity: page.inNavbar ? 1 : 0.5,
                    transition: "all 0.25s ease",
                  }}
                >
                  {page.inNavbar ? (isAr ? "في التنقل" : "In Navbar") : (isAr ? "مخفي" : "Hidden")}
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Info */}
        <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.08)", background: "rgba(var(--color-primary-rgb) / 0.02)" }}>
          <Navigation className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
          <p className="text-[11px] leading-relaxed" style={{ opacity: 0.5 }}>
            {isAr ? "جميع التغييرات تُحفظ تلقائياً وتُطبق مباشرة. عد للصفحة الرئيسية لرؤية النتيجة الكاملة." : "All changes save automatically and apply instantly. Go back to homepage to see the full result."}
          </p>
        </div>
      </div>
    </div>
  );
}
