"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Palette, Check, Pipette, ChevronDown } from "lucide-react";
import { themes, defaultTheme } from "@/config/themes";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { useSiteConfig } from "@/providers/site-config-provider";

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "225 29 72";
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

export function ThemeSwitcher() {
  const [current, setCurrent] = useState(defaultTheme);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const { config } = useSiteConfig();
  const style = config.navbar.themePanelStyle;

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("color-theme") || defaultTheme;
    const savedCustom = localStorage.getItem("color-theme-custom");
    if (savedCustom) {
      setCustomColor(savedCustom);
      setCurrent("custom");
      applyCustomColor(savedCustom);
    } else {
      setCurrent(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = useCallback((themeName: string) => {
    const t = themes[themeName];
    if (!t) return;
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    root.style.setProperty("--color-primary", isDark ? t.primary.dark : t.primary.light);
    root.style.setProperty("--color-ring", isDark ? t.primary.dark : t.primary.light);
    root.style.setProperty("--color-primary-rgb", isDark ? t.rgb.dark : t.rgb.light);
  }, []);

  const applyCustomColor = useCallback((hex: string) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", hex);
    root.style.setProperty("--color-ring", hex);
    root.style.setProperty("--color-primary-rgb", hexToRgb(hex));
  }, []);

  function selectTheme(name: string) {
    setCurrent(name);
    setCustomColor(null);
    localStorage.setItem("color-theme", name);
    localStorage.removeItem("color-theme-custom");
    applyTheme(name);
  }

  function handleCustomColor(hex: string) {
    setCustomColor(hex);
    setCurrent("custom");
    localStorage.setItem("color-theme-custom", hex);
    localStorage.removeItem("color-theme");
    applyCustomColor(hex);
  }

  useEffect(() => {
    if (!mounted) return;
    const observer = new MutationObserver(() => {
      if (customColor) applyCustomColor(customColor);
      else applyTheme(current);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [mounted, current, customColor, applyTheme, applyCustomColor]);

  const [dropPos, setDropPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });

  const updateDropPos = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const btnCenter = rect.left + rect.width / 2;
      if (btnCenter > vw / 2) {
        // Button is on right half — anchor panel's right edge to viewport right
        setDropPos({ top: rect.bottom + 10, right: Math.max(8, vw - rect.right), left: undefined });
      } else {
        // Button is on left half — anchor panel's left edge to button left
        setDropPos({ top: rect.bottom + 10, left: Math.max(8, rect.left), right: undefined });
      }
    }
  }, []);

  const handleEnter = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); updateDropPos(); setOpen(true); };
  const handleLeave = () => { timeoutRef.current = setTimeout(() => setOpen(false), 300); };

  if (!mounted) return <div className="h-[38px] w-[100px] rounded-xl" />;

  const themeList = Object.values(themes);
  const isCustom = current === "custom";
  const currentTheme = themes[current];
  const currentColor = isCustom && customColor ? customColor : currentTheme ? currentTheme.primary.light : "#E11D48";

  // ═══ Shared dropdown panel ═══
  const dropdownPanel = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-[9999] rounded-2xl overflow-hidden"
          style={{
            top: dropPos.top,
            left: dropPos.left,
            right: dropPos.right,
            width: "296px",
            background: "var(--color-card)",
            border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.03)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
                <Palette className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--color-foreground)" }}>{locale === "ar" ? "لون الموقع" : "Theme Color"}</h3>
                <p className="text-[10px] text-foreground mt-0.5">{locale === "ar" ? "اختر لونك المفضل" : "Choose your accent color"}</p>
              </div>
            </div>
          </div>
          <div className="mx-4 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.08), transparent)" }} />
          <div className="p-4">
            <div className="grid grid-cols-7 gap-3">
              {themeList.map((t) => {
                const isActive = current === t.name;
                return (
                  <button key={t.name} onClick={() => selectTheme(t.name)} className="relative flex flex-col items-center gap-2 cursor-pointer" aria-label={t.label}>
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full" style={{
                        background: t.name === "black" ? "linear-gradient(135deg, #2a2a2a, #0a0a0a)" : `linear-gradient(135deg, ${t.primary.light}, ${t.accent.light})`,
                        border: t.name === "black" ? "1.5px solid rgba(128,128,128,0.25)" : "none",
                        boxShadow: isActive ? `0 0 0 2px var(--color-card), 0 0 0 3.5px ${t.primary.light}, 0 4px 14px ${t.primary.light}35` : `0 2px 6px ${t.primary.light}20`,
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", transform: isActive ? "scale(1.08)" : "scale(1)",
                      }}
                        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.transform = "scale(1.18)"; e.currentTarget.style.boxShadow = `0 4px 16px ${t.primary.light}40`; } }}
                        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 2px 6px ${t.primary.light}20`; } }}
                      />
                      {isActive && (
                        <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="absolute inset-0 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />
                        </motion.div>
                      )}
                    </div>
                    <span className="text-[8px] font-medium leading-none" style={{ color: isActive ? "var(--color-primary)" : "var(--color-foreground)", opacity: isActive ? 1 : 0.45, transition: "all 0.2s ease" }}>
                      {locale === "ar" ? t.labelAr : t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mx-4 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.08), transparent)" }} />
          <div className="p-3">
            <button onClick={() => colorInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer" style={{
              background: isCustom ? "rgba(var(--color-primary-rgb) / 0.06)" : "transparent",
              border: isCustom ? "1px solid rgba(var(--color-primary-rgb) / 0.12)" : "1px solid transparent", transition: "all 0.3s ease",
            }}
              onMouseEnter={(e) => { if (!isCustom) { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)"; } }}
              onMouseLeave={(e) => { if (!isCustom) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
            >
              <div className="relative">
                <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{
                  background: isCustom && customColor ? `linear-gradient(135deg, ${customColor}, ${customColor}cc)` : "conic-gradient(from 0deg, #E11D48, #7C3AED, #0066FF, #059669, #D97706, #E11D48)",
                  boxShadow: isCustom && customColor ? `0 0 0 2px var(--color-card), 0 0 0 3.5px ${customColor}, 0 4px 14px ${customColor}35` : "inset 0 0 0 1px rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease", transform: isCustom ? "scale(1.08)" : "scale(1)",
                }}>
                  {isCustom ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}><Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} /></motion.div> : <Pipette className="h-3 w-3 text-white drop-shadow" />}
                </div>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-semibold" style={{ color: isCustom ? "var(--color-primary)" : "var(--color-foreground)", transition: "color 0.2s" }}>{locale === "ar" ? "لون مخصص" : "Custom Color"}</span>
                <span className="text-[9px] text-foreground">{isCustom && customColor ? customColor.toUpperCase() : locale === "ar" ? "اختر أي لون" : "Pick any color"}</span>
              </div>
              <input ref={colorInputRef} type="color" className="sr-only" value={customColor || "#E11D48"} onChange={(e) => handleCustomColor(e.target.value)} onClick={(e) => e.stopPropagation()} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── dots-inline: show color dots directly in navbar ──
  if (style === "dots-inline") {
    return (
      <div ref={containerRef} className="relative flex items-center gap-1">
        {themeList.slice(0, 7).map((t) => {
          const isActive = current === t.name;
          return (
            <button
              key={t.name}
              onClick={() => selectTheme(t.name)}
              className="shrink-0 cursor-pointer"
              aria-label={t.label}
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{
                  background: t.name === "black" ? "#1a1a1a" : t.primary.light,
                  boxShadow: isActive ? `0 0 0 1.5px var(--color-card), 0 0 0 3px ${t.primary.light}` : "none",
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.transform = "scale(1.25)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.transform = "scale(1)"; }}
              />
            </button>
          );
        })}
      </div>
    );
  }

  // ── swatch-only: just the dot, click opens dropdown ──
  if (style === "swatch-only") {
    return (
      <div ref={containerRef} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <button
          onClick={() => setOpen(!open)}
          className="h-[38px] w-[38px] rounded-xl flex items-center justify-center cursor-pointer"
          style={{
            border: open ? "1.5px solid rgba(var(--color-primary-rgb) / 0.2)" : "1.5px solid rgba(var(--color-primary-rgb) / 0.08)",
            background: open ? "rgba(var(--color-primary-rgb) / 0.08)" : "transparent",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => { if (!open) { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.2)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.05)"; } }}
          onMouseLeave={(e) => { if (!open) { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)"; e.currentTarget.style.background = "transparent"; } }}
          aria-label="Change theme color"
        >
          <div className="h-5 w-5 rounded-full" style={{ background: `linear-gradient(135deg, ${currentColor}, ${currentColor}cc)`, boxShadow: `0 0 0 1.5px rgba(var(--color-primary-rgb) / 0.15)`, transition: "all 0.3s ease" }} />
        </button>
        {dropdownPanel}
      </div>
    );
  }

  // ── minimal: small dot + no border ──
  if (style === "minimal") {
    return (
      <div ref={containerRef} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        <button
          onClick={() => setOpen(!open)}
          className="h-[38px] flex items-center justify-center px-1 cursor-pointer"
          style={{ transition: "transform 0.3s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          aria-label="Change theme color"
        >
          <div className="h-4 w-4 rounded-full" style={{ background: `linear-gradient(135deg, ${currentColor}, ${currentColor}cc)`, boxShadow: `0 1px 4px ${currentColor}30`, transition: "all 0.3s ease" }} />
        </button>
        {dropdownPanel}
      </div>
    );
  }

  // ── dropdown (default) ──
  return (
    <div ref={containerRef} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className="inline-flex items-center gap-2 h-[38px] px-3 rounded-xl cursor-pointer"
        style={{
          background: open ? "rgba(var(--color-primary-rgb) / 0.12)" : "rgba(var(--color-primary-rgb) / 0.05)",
          border: open ? "1px solid rgba(var(--color-primary-rgb) / 0.2)" : "1px solid rgba(var(--color-primary-rgb) / 0.08)",
          color: open ? "var(--color-primary)" : "var(--color-foreground)",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: open ? "translateY(-1px)" : "translateY(0)",
          boxShadow: open ? "0 6px 20px rgba(var(--color-primary-rgb) / 0.12)" : "none",
        }}
        onMouseEnter={(e) => { if (!open) { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.1)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)"; e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(var(--color-primary-rgb) / 0.1)"; } }}
        onMouseLeave={(e) => { if (!open) { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.05)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)"; e.currentTarget.style.color = "var(--color-foreground)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; } }}
        aria-label="Change theme color"
        onClick={() => setOpen(!open)}
      >
        <div className="h-4 w-4 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${currentColor}, ${currentColor}cc)`, boxShadow: `0 0 0 1.5px rgba(var(--color-primary-rgb) / 0.15), 0 1px 4px ${currentColor}30`, transition: "all 0.3s ease" }} />
        <span className="hidden sm:block text-[12px] font-semibold whitespace-nowrap">Theme</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </motion.div>
      </button>
      {dropdownPanel}
    </div>
  );
}
