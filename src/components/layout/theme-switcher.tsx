"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Palette, Check, Pipette, ChevronDown, Sparkles } from "lucide-react";
import { themes, defaultTheme } from "@/config/themes";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { useSiteConfig } from "@/providers/site-config-provider";

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 102 255";
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

const PANEL_EASE = [0.16, 1, 0.3, 1] as const;

const swatchStaggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.036, delayChildren: 0.05 } },
};

const swatchStaggerChild = {
  hidden: { opacity: 0, y: 8, scale: 0.88 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: PANEL_EASE },
  },
};

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

  const isAr = locale === "ar";

  // ═══ Shared dropdown panel ═══
  const dropdownPanel = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.28, ease: PANEL_EASE }}
          className="fixed z-[9999] overflow-hidden rounded-[20px]"
          dir={isAr ? "rtl" : "ltr"}
          style={{
            top: dropPos.top,
            left: dropPos.left,
            right: dropPos.right,
            width: "min(320px, calc(100vw - 24px))",
            background: "var(--color-card)",
            border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
            boxShadow:
              "0 0 0 1px rgba(var(--color-primary-rgb) / 0.04), 0 32px 64px -12px rgba(0,0,0,0.22), 0 12px 28px -8px rgba(0,0,0,0.12)",
            backdropFilter: "blur(28px) saturate(1.15)",
            WebkitBackdropFilter: "blur(28px) saturate(1.15)",
          }}
        >
          <div
            className="pointer-events-none absolute -end-16 -top-20 h-44 w-44 rounded-full opacity-[0.14]"
            style={{ background: "radial-gradient(circle at center, var(--color-primary), transparent 68%)" }}
          />
          <div
            className="h-[3px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(var(--color-primary-rgb) / 0.35) 22%, var(--color-primary) 50%, rgba(var(--color-primary-rgb) / 0.35) 78%, transparent 100%)",
            }}
          />

          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
                  style={{
                    background: "linear-gradient(145deg, rgba(var(--color-primary-rgb) / 0.14), rgba(var(--color-primary-rgb) / 0.05))",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                >
                  <Palette className="h-4 w-4" style={{ color: "var(--color-primary)" }} strokeWidth={2} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-[14px] font-semibold leading-tight tracking-tight" style={{ color: "var(--color-foreground)" }}>
                    {isAr ? "لون التمييز" : "Accent color"}
                  </h3>
                  <p className="mt-1 text-[11px] leading-snug opacity-55" style={{ color: "var(--color-foreground)" }}>
                    {isAr ? "يُستخدم للأزرار والتقدم والتأكيدات" : "Buttons, progress, and highlights follow this tone"}
                  </p>
                </div>
              </div>
              <div
                className="relative h-11 w-11 shrink-0 rounded-2xl shadow-lg ring-2 ring-white/25 dark:ring-white/10"
                style={{
                  background: `linear-gradient(145deg, ${currentColor}, ${currentColor}bb)`,
                  boxShadow: `0 10px 28px -4px rgb(var(--color-primary-rgb) / 0.45), inset 0 1px 0 rgba(255,255,255,0.25)`,
                }}
                aria-hidden
              />
            </div>
          </div>

          <div
            className="mx-5 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.12), transparent)" }}
          />

          <div className="px-5 pt-4 pb-1">
            <div className="mb-3 flex items-center gap-1.5 opacity-70" style={{ color: "var(--color-primary)" }}>
              <Sparkles className="h-3 w-3 shrink-0" strokeWidth={2.25} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                {isAr ? "جاهزة" : "Presets"}
              </span>
            </div>
            <motion.div
              className="grid grid-cols-4 gap-x-2 gap-y-3"
              variants={swatchStaggerParent}
              initial="hidden"
              animate="show"
            >
              {themeList.map((t) => {
                const isActive = current === t.name;
                return (
                  <motion.button
                    key={t.name}
                    type="button"
                    variants={swatchStaggerChild}
                    onClick={() => selectTheme(t.name)}
                    className="group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl pb-1 pt-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)]"
                    aria-label={t.label}
                    aria-pressed={isActive}
                  >
                    <div className="relative">
                      <div
                        className="h-9 w-9 rounded-full transition-transform duration-300 ease-out group-hover:scale-[1.12] group-active:scale-95"
                        style={{
                          background:
                            t.name === "black"
                              ? "linear-gradient(145deg, #3f3f3f, #0a0a0a)"
                              : `linear-gradient(145deg, ${t.primary.light}, ${t.accent.light})`,
                          border: t.name === "black" ? "1.5px solid rgba(160,160,160,0.28)" : "1px solid rgba(255,255,255,0.22)",
                          boxShadow: isActive
                            ? `0 0 0 2px var(--color-card), 0 0 0 4px ${t.primary.light}, 0 8px 22px ${t.primary.light}45`
                            : `0 3px 10px -2px ${t.primary.light}35, inset 0 1px 0 rgba(255,255,255,0.2)`,
                          transform: isActive ? "scale(1.06)" : "scale(1)",
                        }}
                      />
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, rotate: -50 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 520, damping: 22 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="h-4 w-4 text-white drop-shadow-md" strokeWidth={2.75} />
                        </motion.div>
                      )}
                    </div>
                    <span
                      className="max-w-[4.5rem] truncate text-center text-[9px] font-semibold leading-none transition-colors duration-200"
                      style={{
                        color: "var(--color-foreground)",
                        opacity: isActive ? 1 : 0.42,
                      }}
                    >
                      {isAr ? t.labelAr : t.label}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          <div
            className="mx-5 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.1), transparent)" }}
          />

          <motion.div
            className="p-4 pt-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.25, ease: PANEL_EASE }}
          >
            <div
              className="rounded-2xl p-[1px]"
              style={{
                background: isCustom
                  ? "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.45), rgba(var(--color-primary-rgb) / 0.12))"
                  : "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.2), rgba(var(--color-primary-rgb) / 0.06))",
              }}
            >
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="flex w-full cursor-pointer items-center gap-3 rounded-[15px] px-3.5 py-3 transition-colors duration-200"
                style={{
                  background: isCustom ? "rgba(var(--color-primary-rgb) / 0.08)" : "var(--color-card)",
                  border: isCustom ? "none" : "1px solid transparent",
                }}
              >
                <div className="relative shrink-0">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105"
                    style={{
                      background:
                        isCustom && customColor
                          ? `linear-gradient(145deg, ${customColor}, ${customColor}cc)`
                          : "conic-gradient(from 220deg, #E11D48, #7C3AED, #0066FF, #0D9488, #D97706, #4F46E5, #E11D48)",
                      boxShadow: isCustom
                        ? `0 0 0 2px var(--color-card), 0 0 0 3.5px ${customColor}, 0 6px 18px ${customColor}40`
                        : "inset 0 0 0 1px rgba(255,255,255,0.2), 0 3px 10px rgba(0,0,0,0.12)",
                    }}
                  >
                    {isCustom ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <Check className="h-4 w-4 text-white drop-shadow-md" strokeWidth={2.75} />
                      </motion.span>
                    ) : (
                      <Pipette className="h-3.5 w-3.5 text-white drop-shadow-md" strokeWidth={2.25} />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1 text-start">
                  <span
                    className="block text-[12px] font-semibold tracking-tight"
                    style={{ color: isCustom ? "var(--color-primary)" : "var(--color-foreground)" }}
                  >
                    {isAr ? "لون مخصص" : "Custom color"}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] opacity-50" style={{ color: "var(--color-foreground)" }}>
                    {isCustom && customColor ? customColor.toUpperCase() : isAr ? "افتح منتقي الألوان" : "Open the color picker"}
                  </span>
                </div>
                <input
                  ref={colorInputRef}
                  type="color"
                  className="sr-only"
                  value={customColor || "#E11D48"}
                  onChange={(e) => handleCustomColor(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </button>
            </div>
          </motion.div>

          <div
            className="h-1 w-full opacity-90"
            style={{
              background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── dots-inline: show color dots directly in navbar ──
  if (style === "dots-inline") {
    return (
      <div
        ref={containerRef}
        className="relative flex items-center gap-1 rounded-full border px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{
          borderColor: "rgba(var(--color-primary-rgb) / 0.1)",
          background: "rgba(var(--color-primary-rgb) / 0.04)",
        }}
        title={isAr ? "ألوان التمييز" : "Accent colors"}
      >
        {themeList.map((t) => {
          const isActive = current === t.name;
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => selectTheme(t.name)}
              className="shrink-0 cursor-pointer rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              aria-label={t.label}
              aria-pressed={isActive}
            >
              <div
                className="h-4 w-4 rounded-full transition-all duration-200 ease-out"
                style={{
                  background:
                    t.name === "black"
                      ? "linear-gradient(145deg, #333, #0a0a0a)"
                      : `linear-gradient(145deg, ${t.primary.light}, ${t.accent.light})`,
                  boxShadow: isActive
                    ? `0 0 0 2px var(--color-card), 0 0 0 3px ${t.primary.light}, 0 2px 8px ${t.primary.light}50`
                    : "0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
                  transform: isActive ? "scale(1.12)" : "scale(1)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.transform = "scale(1.22)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.transform = "scale(1)";
                }}
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
  const triggerLabel = isAr ? "التمييز" : "Theme";
  const currentLabel =
    isCustom && customColor
      ? customColor.toUpperCase()
      : currentTheme
        ? (isAr ? currentTheme.labelAr : currentTheme.label)
        : triggerLabel;

  return (
    <div ref={containerRef} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        className="inline-flex h-[38px] cursor-pointer items-center gap-2 rounded-xl px-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        style={{
          background: open ? "rgba(var(--color-primary-rgb) / 0.11)" : "rgba(var(--color-primary-rgb) / 0.045)",
          border: open ? "1px solid rgba(var(--color-primary-rgb) / 0.22)" : "1px solid rgba(var(--color-primary-rgb) / 0.09)",
          color: open ? "var(--color-primary)" : "var(--color-foreground)",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: open ? "translateY(-1px)" : "translateY(0)",
          boxShadow: open
            ? "0 8px 24px rgba(var(--color-primary-rgb) / 0.14), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.09)";
            e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.16)";
            e.currentTarget.style.color = "var(--color-primary)";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(var(--color-primary-rgb) / 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.045)";
            e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.09)";
            e.currentTarget.style.color = "var(--color-foreground)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04)";
          }
        }}
        aria-label={isAr ? "تغيير لون التمييز" : "Change accent color"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <div
          className="h-4 w-4 shrink-0 rounded-full"
          style={{
            background: `linear-gradient(145deg, ${currentColor}, ${currentColor}cc)`,
            boxShadow: `0 0 0 1.5px rgba(var(--color-primary-rgb) / 0.18), 0 2px 8px ${currentColor}35`,
            transition: "all 0.3s ease",
          }}
        />
        <span className="hidden max-w-[5.5rem] truncate sm:block text-[12px] font-semibold tracking-tight">{currentLabel}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: PANEL_EASE }}>
          <ChevronDown className="h-3.5 w-3.5 opacity-45" strokeWidth={2.25} />
        </motion.div>
      </button>
      {dropdownPanel}
    </div>
  );
}
