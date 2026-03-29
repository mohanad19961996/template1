"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Paintbrush,
  Sparkles,
  MousePointer,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Type,
  MonitorSmartphone,
  Zap,
  Shield,
  Star,
  Play,
  Check,
  TrendingUp,
  Users,
  BarChart3,
  Navigation,
  Globe,
} from "lucide-react";
import type {
  HeroVariant,
  HeroBgStyle,
  HeroCtaStyle,
  HeroImageStyle,
  HeroAnimation,
} from "@/lib/site-config";
import { DEFAULT_HERO_CONTENT } from "@/lib/site-config";

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

function TextInput({ label, value, onChange, placeholder, dir }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; dir?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ opacity: 0.4 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full h-9 px-3 rounded-lg text-[12px] font-medium outline-none"
        style={{
          border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; }}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, dir }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; dir?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ opacity: 0.4 }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        rows={3}
        className="w-full px-3 py-2 rounded-lg text-[12px] font-medium outline-none resize-none"
        style={{
          border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVE PREVIEW — Hero section replica
   ═══════════════════════════════════════════════════════════════ */

function HeroLivePreview() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config } = useSiteConfig();
  const hero = config.hero;
  const c = hero.content;
  const [ctaHovered, setCtaHovered] = useState(false);

  const title = isAr ? c.titleAr : c.titleEn;
  const highlight = isAr ? c.highlightAr : c.highlightEn;
  const description = isAr ? c.descriptionAr : c.descriptionEn;
  const badge = isAr ? c.badgeAr : c.badgeEn;
  const cta = isAr ? c.ctaAr : c.ctaEn;
  const secondaryCta = isAr ? c.secondaryCtaAr : c.secondaryCtaEn;

  /* Background */
  const renderBg = () => {
    if (hero.bgStyle === "clean") return null;
    if (hero.bgStyle === "gradient") return (
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[80%]" style={{ background: "radial-gradient(ellipse at center top, rgba(var(--color-primary-rgb) / 0.1) 0%, transparent 60%)" }} />
      </div>
    );
    if (hero.bgStyle === "grid") return (
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(var(--color-primary-rgb) / 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.3) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>
    );
    // dots
    return (
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.5) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%]" style={{ background: "radial-gradient(ellipse at center top, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 60%)" }} />
      </div>
    );
  };

  /* CTA style */
  const ctaStyle = (): React.CSSProperties => {
    const h = ctaHovered;
    switch (hero.ctaStyle) {
      case "outlined": return { border: "1.5px solid rgba(var(--color-primary-rgb)/0.2)", color: h ? "white" : "var(--color-primary)", background: h ? "var(--color-primary)" : "transparent", transform: h ? "translateY(-1px)" : "none", transition: "all 0.3s ease" };
      case "gradient": return { background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb)/0.7), var(--color-primary))", backgroundSize: "200% 200%", animation: "gradientShift 3s ease infinite", color: "white", boxShadow: h ? "0 6px 20px rgba(var(--color-primary-rgb)/0.35)" : "0 2px 10px rgba(var(--color-primary-rgb)/0.2)", transform: h ? "translateY(-1px)" : "none", transition: "all 0.3s ease" };
      case "glow": return { background: "var(--color-primary)", color: "white", boxShadow: h ? "0 0 24px rgba(var(--color-primary-rgb)/0.5), 0 0 48px rgba(var(--color-primary-rgb)/0.2)" : "0 0 16px rgba(var(--color-primary-rgb)/0.35)", transform: h ? "translateY(-1px)" : "none", transition: "all 0.3s ease" };
      case "pill": return { background: "var(--color-primary)", color: "white", borderRadius: "9999px", boxShadow: h ? "0 6px 20px rgba(var(--color-primary-rgb)/0.35)" : "0 2px 10px rgba(var(--color-primary-rgb)/0.2)", transform: h ? "translateY(-1px)" : "none", transition: "all 0.3s ease" };
      default: return { background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb)/0.85))", color: "white", boxShadow: h ? "0 6px 20px rgba(var(--color-primary-rgb)/0.35)" : "0 2px 10px rgba(var(--color-primary-rgb)/0.2)", transform: h ? "translateY(-1px)" : "none", transition: "all 0.3s ease" };
    }
  };

  const isMinimal = hero.variant === "minimal";
  const isSplit = hero.variant === "split";
  const isCentered = hero.variant === "centered";
  const showVisual = hero.showImage && !isMinimal;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
        <MonitorSmartphone className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
        <span className="text-[12px] font-bold tracking-tight">{isAr ? "معاينة حية للهيرو" : "Hero Live Preview"}</span>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
        </div>
      </div>

      {/* Browser bar */}
      <div className="px-5 py-2 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.04)" }}>
        <div className="flex-1 h-7 rounded-lg flex items-center px-3" style={{ background: "rgba(var(--color-primary-rgb) / 0.03)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
          <span className="text-[10px] font-medium" style={{ opacity: 0.3 }}>https://yoursite.com</span>
        </div>
      </div>

      {/* ─── Preview content ─── */}
      <div className="px-4 pb-4 pt-2">
        <div className="rounded-xl overflow-hidden relative" style={{ background: "var(--color-background)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${hero.variant}-${hero.bgStyle}-${hero.imageStyle}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
              style={{ padding: isMinimal ? "40px 24px" : "28px 24px" }}
            >
              {renderBg()}

              <div className={isMinimal ? "text-center max-w-md mx-auto" : `grid ${showVisual ? "grid-cols-[1fr_1fr]" : ""} gap-8 items-center`}>
                {/* Text side */}
                <div className={isMinimal ? "" : "max-w-full"}>
                  {/* Badge */}
                  {hero.showBadge && (
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-semibold mb-3 ${isMinimal ? "mx-auto" : ""}`} style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", color: "var(--color-primary)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)" }}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--color-primary)", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "var(--color-primary)" }} />
                      </span>
                      {badge}
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="font-bold tracking-tight leading-[1.1] text-[18px] mb-2">
                    {title}{" "}
                    <span className="text-gradient-animated">{highlight}</span>
                  </h2>
                  <div className={`relative h-[2px] ${isMinimal ? "w-24 mx-auto" : "w-24"} overflow-hidden rounded-full mb-3`} style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}>
                    <div className="absolute inset-y-0 w-1/2 rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)", animation: "underlineSweep 2.5s ease-in-out infinite" }} />
                  </div>

                  {/* Description */}
                  <p className="text-[10px] leading-[1.6] mb-4" style={{ opacity: 0.6 }}>
                    {description.slice(0, 120)}{description.length > 120 ? "..." : ""}
                  </p>

                  {/* Features */}
                  {hero.showFeatures && !isMinimal && (
                    <div className={`flex flex-wrap gap-1.5 mb-4 ${isSplit ? "grid grid-cols-2" : ""}`}>
                      {[
                        { icon: Zap, label: isAr ? "سريع" : "Fast" },
                        { icon: Shield, label: isAr ? "آمن" : "Secure" },
                        { icon: Sparkles, label: isAr ? "عصري" : "Modern" },
                        ...(isSplit ? [{ icon: Globe, label: isAr ? "عالمي" : "Global" }] : []),
                      ].map((f) => (
                        <div key={f.label} className="inline-flex items-center gap-1 text-[8px] font-medium px-2 py-1 rounded-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.04)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
                          <f.icon className="h-2 w-2" style={{ color: "var(--color-primary)" }} />
                          {f.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTAs */}
                  <div className={`flex items-center gap-2 ${isMinimal ? "justify-center" : ""}`}>
                    <div
                      className="h-7 px-3 rounded-lg flex items-center gap-1 text-[9px] font-semibold cursor-pointer"
                      style={ctaStyle()}
                      onMouseEnter={() => setCtaHovered(true)}
                      onMouseLeave={() => setCtaHovered(false)}
                    >
                      {cta}
                      {isAr ? <ArrowLeft className="h-2 w-2" /> : <ArrowRight className="h-2 w-2" />}
                    </div>
                    {hero.showSecondaryCta && !isMinimal && (
                      <div className="h-7 px-3 rounded-lg flex items-center gap-1 text-[9px] font-semibold cursor-pointer" style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.15)", color: "var(--color-primary)" }}>
                        {secondaryCta}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  {hero.showStats && !isMinimal && (
                    <div className="mt-4 pt-3 flex items-center gap-3" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
                      {[
                        { value: "500+", label: isAr ? "عميل" : "Clients", icon: Users },
                        { value: "98%", label: isAr ? "رضا" : "Happy", icon: Star },
                        { value: "15+", label: isAr ? "خبرة" : "Years", icon: BarChart3 },
                      ].map((s, i) => (
                        <div key={s.label} className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)" }}>
                              <s.icon className="h-2.5 w-2.5" style={{ color: "var(--color-primary)" }} />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold">{s.value}</div>
                              <div className="text-[7px] font-semibold uppercase" style={{ color: "var(--color-primary)" }}>{s.label}</div>
                            </div>
                          </div>
                          {i < 2 && <div className="h-5 w-px" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)" }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visual side */}
                {showVisual && (
                  <div className="relative">
                    {/* Image card */}
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        border: hero.imageStyle === "gradient-border" ? "none" : "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
                        padding: hero.imageStyle === "gradient-border" ? "2px" : "0",
                        background: hero.imageStyle === "gradient-border" ? "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb)/0.3), var(--color-primary))" : undefined,
                        clipPath: hero.imageStyle === "masked" ? "polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)" : undefined,
                      }}
                    >
                      <div className={hero.imageStyle === "gradient-border" ? "rounded-[calc(0.75rem-2px)] overflow-hidden" : ""}>
                        <div className="relative aspect-[4/3]" style={{ background: "rgba(var(--color-primary-rgb) / 0.04)" }}>
                          {/* Simulated image */}
                          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(var(--color-primary-rgb)/0.08), rgba(var(--color-primary-rgb)/0.02))` }} />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)" }} />

                          {/* Rating badge */}
                          <div className="absolute bottom-2 start-2 flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "rgba(var(--color-primary-rgb) / 0.15)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)" }}>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => <Star key={i} className="h-1.5 w-1.5" style={{ color: "var(--color-primary)", fill: "var(--color-primary)" }} />)}
                            </div>
                            <span className="text-[7px] font-bold">4.9</span>
                          </div>
                          <div className="absolute bottom-2 end-2 h-5 w-5 rounded-full flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.15)" }}>
                            <Play className="h-2 w-2" style={{ color: "var(--color-primary)", fill: "var(--color-primary)" }} />
                          </div>

                          {/* Top accent */}
                          <div className="absolute top-0 inset-x-0 h-[1.5px]" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
                        </div>
                      </div>
                    </div>

                    {/* Floating cards */}
                    {hero.showFloatingCards && (
                      <>
                        <div className="absolute -top-2 -start-2 z-10 flex items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ background: "var(--color-card)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                          <div className="h-4 w-4 rounded-md flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}>
                            <Shield className="h-2 w-2" style={{ color: "var(--color-primary)" }} />
                          </div>
                          <div>
                            <div className="text-[8px] font-bold">99.9%</div>
                            <div className="text-[6px] font-semibold" style={{ color: "var(--color-primary)" }}>{isAr ? "تشغيل" : "Uptime"}</div>
                          </div>
                          <Check className="h-2 w-2" style={{ color: "var(--color-primary)" }} />
                        </div>
                        <div className="absolute -bottom-2 -end-2 z-10 flex items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ background: "var(--color-card)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                          <div className="h-4 w-4 rounded-md flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}>
                            <TrendingUp className="h-2 w-2" style={{ color: "var(--color-primary)" }} />
                          </div>
                          <div>
                            <div className="text-[8px] font-bold">+500</div>
                            <div className="text-[6px] font-semibold" style={{ color: "var(--color-primary)" }}>{isAr ? "مشروع" : "Projects"}</div>
                          </div>
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 -end-1.5 z-10 flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "var(--color-primary)", boxShadow: "0 4px 12px rgba(var(--color-primary-rgb)/0.3)" }}>
                          <Zap className="h-2 w-2 text-white" />
                          <span className="text-[7px] font-bold text-white">{isAr ? "مباشر" : "Live"}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Minimal bottom line */}
              {isMinimal && (
                <div className="mx-auto mt-4 h-[1.5px] w-12" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Hint */}
      <div className="px-5 pb-3 flex items-center gap-2 justify-center" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.04)" }}>
        <MousePointer className="h-2.5 w-2.5" style={{ color: "var(--color-primary)" }} />
        <span className="text-[9px] font-medium" style={{ opacity: 0.35 }}>
          {isAr ? "المعاينة تتحدث مباشرة مع كل تغيير" : "Preview updates instantly with every change"}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HERO DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export function HeroDashboard() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowRight : ArrowLeft;

  const { config, updateHero, updateHeroContent, resetConfig } = useSiteConfig();
  const hero = config.hero;
  const c = hero.content;

  const variantOptions: { value: HeroVariant; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "default", labelEn: "Default", labelAr: "افتراضي", descEn: "Two-column with visual", descAr: "عمودين مع صورة" },
    { value: "centered", labelEn: "Centered", labelAr: "مركزي", descEn: "Animated gradient border", descAr: "حدود متدرجة متحركة" },
    { value: "split", labelEn: "Split", labelAr: "منقسم", descEn: "Feature checklist grid", descAr: "شبكة ميزات" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "Centered text only", descAr: "نص مركزي فقط" },
  ];

  const bgOptions: { value: HeroBgStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "dots", labelEn: "Dots", labelAr: "نقاط", descEn: "Dot pattern background", descAr: "خلفية نقاط" },
    { value: "gradient", labelEn: "Gradient", labelAr: "تدرج", descEn: "Radial gradient glow", descAr: "توهج متدرج" },
    { value: "grid", labelEn: "Grid", labelAr: "شبكة", descEn: "Fine grid lines", descAr: "خطوط شبكة دقيقة" },
    { value: "clean", labelEn: "Clean", labelAr: "نظيف", descEn: "Minimal background", descAr: "خلفية بسيطة" },
  ];

  const ctaOptions: { value: HeroCtaStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "filled", labelEn: "Filled", labelAr: "ممتلئ", descEn: "Solid gradient button", descAr: "زر متدرج صلب" },
    { value: "outlined", labelEn: "Outlined", labelAr: "محدد", descEn: "Border only, fill on hover", descAr: "حدود فقط" },
    { value: "gradient", labelEn: "Gradient", labelAr: "متدرج", descEn: "Animated gradient", descAr: "تدرج متحرك" },
    { value: "glow", labelEn: "Glow", labelAr: "توهج", descEn: "Neon glow shadow", descAr: "ظل نيون متوهج" },
    { value: "pill", labelEn: "Pill", labelAr: "كبسولة", descEn: "Full rounded pill", descAr: "كبسولة كاملة" },
  ];

  const imageOptions: { value: HeroImageStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "card", labelEn: "Card", labelAr: "بطاقة", descEn: "Rounded card with border", descAr: "بطاقة بحدود" },
    { value: "gradient-border", labelEn: "Gradient Border", labelAr: "حدود متدرجة", descEn: "Animated gradient frame", descAr: "إطار متدرج متحرك" },
    { value: "floating", labelEn: "Floating", labelAr: "عائم", descEn: "Floating with shadow", descAr: "عائم مع ظل" },
    { value: "masked", labelEn: "Masked", labelAr: "مقنّع", descEn: "Geometric clip shape", descAr: "شكل هندسي مقطوع" },
    { value: "none", labelEn: "Hidden", labelAr: "مخفي", descEn: "No image display", descAr: "بدون صورة" },
  ];

  const animOptions: { value: HeroAnimation; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "fade-up", labelEn: "Fade Up", labelAr: "ظهور للأعلى", descEn: "Fade in from below", descAr: "ظهور من الأسفل" },
    { value: "slide-in", labelEn: "Slide In", labelAr: "انزلاق", descEn: "Slide from the side", descAr: "انزلاق من الجانب" },
    { value: "blur-in", labelEn: "Blur In", labelAr: "ضبابي", descEn: "Blur to sharp reveal", descAr: "من ضبابي إلى واضح" },
    { value: "scale", labelEn: "Scale", labelAr: "تكبير", descEn: "Scale up from small", descAr: "تكبير من صغير" },
    { value: "none", labelEn: "None", labelAr: "بدون", descEn: "No entrance animation", descAr: "بدون حركة دخول" },
  ];

  return (
    <div className="space-y-6">
        {/* ═══ CONTROLS ═══ */}
        {/* Row 1: Variant + Background */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title={isAr ? "نمط الهيرو" : "Hero Layout"}>
            <OptionGroup label={isAr ? "التصميم" : "Layout"} icon={Paintbrush} options={variantOptions} value={hero.variant} onChange={(v) => updateHero({ variant: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "نمط الخلفية" : "Background Style"}>
            <OptionGroup label={isAr ? "الخلفية" : "Background"} icon={Sparkles} options={bgOptions} value={hero.bgStyle} onChange={(v) => updateHero({ bgStyle: v })} columns={2} />
          </SectionCard>
        </div>

        {/* Row 2: CTA + Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title={isAr ? "زر الإجراء" : "CTA Button Style"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={MousePointer} options={ctaOptions} value={hero.ctaStyle} onChange={(v) => updateHero({ ctaStyle: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "نمط الصورة" : "Image Style"}>
            <OptionGroup label={isAr ? "العرض" : "Display"} icon={ImageIcon} options={imageOptions} value={hero.imageStyle} onChange={(v) => updateHero({ imageStyle: v })} columns={2} />
          </SectionCard>
        </div>

        {/* Row 3: Animation */}
        <SectionCard title={isAr ? "حركة الدخول" : "Entrance Animation"}>
          <OptionGroup label={isAr ? "الحركة" : "Animation"} icon={Sparkles} options={animOptions} value={hero.animation} onChange={(v) => updateHero({ animation: v })} columns={5} />
        </SectionCard>

        {/* Toggles */}
        <SectionCard title={isAr ? "عناصر الهيرو" : "Hero Elements"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <Toggle checked={hero.showBadge} onChange={(v) => updateHero({ showBadge: v })} label={isAr ? "شارة العنوان" : "Top Badge"} />
            <Toggle checked={hero.showStats} onChange={(v) => updateHero({ showStats: v })} label={isAr ? "إحصائيات" : "Statistics Row"} />
            <Toggle checked={hero.showFeatures} onChange={(v) => updateHero({ showFeatures: v })} label={isAr ? "ميزات" : "Feature Pills"} />
            <Toggle checked={hero.showImage} onChange={(v) => updateHero({ showImage: v })} label={isAr ? "صورة الهيرو" : "Hero Image"} />
            <Toggle checked={hero.showFloatingCards} onChange={(v) => updateHero({ showFloatingCards: v })} label={isAr ? "بطاقات عائمة" : "Floating Cards"} />
            <Toggle checked={hero.showSecondaryCta} onChange={(v) => updateHero({ showSecondaryCta: v })} label={isAr ? "زر ثانوي" : "Secondary CTA"} />
          </div>
        </SectionCard>

        {/* Content Editing — English */}
        <SectionCard title={isAr ? "محتوى الهيرو — الإنجليزية" : "Hero Content — English"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Badge" value={c.badgeEn} onChange={(v) => updateHeroContent({ badgeEn: v })} placeholder={DEFAULT_HERO_CONTENT.badgeEn} />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Title" value={c.titleEn} onChange={(v) => updateHeroContent({ titleEn: v })} placeholder={DEFAULT_HERO_CONTENT.titleEn} />
              <TextInput label="Highlight" value={c.highlightEn} onChange={(v) => updateHeroContent({ highlightEn: v })} placeholder={DEFAULT_HERO_CONTENT.highlightEn} />
            </div>
            <TextArea label="Description" value={c.descriptionEn} onChange={(v) => updateHeroContent({ descriptionEn: v })} placeholder={DEFAULT_HERO_CONTENT.descriptionEn} />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="CTA Button" value={c.ctaEn} onChange={(v) => updateHeroContent({ ctaEn: v })} placeholder={DEFAULT_HERO_CONTENT.ctaEn} />
              <TextInput label="Secondary CTA" value={c.secondaryCtaEn} onChange={(v) => updateHeroContent({ secondaryCtaEn: v })} placeholder={DEFAULT_HERO_CONTENT.secondaryCtaEn} />
            </div>
          </div>
        </SectionCard>

        {/* Content Editing — Arabic */}
        <SectionCard title={isAr ? "محتوى الهيرو — العربية" : "Hero Content — Arabic"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label={isAr ? "الشارة" : "Badge"} value={c.badgeAr} onChange={(v) => updateHeroContent({ badgeAr: v })} placeholder={DEFAULT_HERO_CONTENT.badgeAr} dir="rtl" />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label={isAr ? "العنوان" : "Title"} value={c.titleAr} onChange={(v) => updateHeroContent({ titleAr: v })} placeholder={DEFAULT_HERO_CONTENT.titleAr} dir="rtl" />
              <TextInput label={isAr ? "الكلمة المميزة" : "Highlight"} value={c.highlightAr} onChange={(v) => updateHeroContent({ highlightAr: v })} placeholder={DEFAULT_HERO_CONTENT.highlightAr} dir="rtl" />
            </div>
            <TextArea label={isAr ? "الوصف" : "Description"} value={c.descriptionAr} onChange={(v) => updateHeroContent({ descriptionAr: v })} placeholder={DEFAULT_HERO_CONTENT.descriptionAr} dir="rtl" />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label={isAr ? "زر الإجراء" : "CTA Button"} value={c.ctaAr} onChange={(v) => updateHeroContent({ ctaAr: v })} placeholder={DEFAULT_HERO_CONTENT.ctaAr} dir="rtl" />
              <TextInput label={isAr ? "الزر الثانوي" : "Secondary CTA"} value={c.secondaryCtaAr} onChange={(v) => updateHeroContent({ secondaryCtaAr: v })} placeholder={DEFAULT_HERO_CONTENT.secondaryCtaAr} dir="rtl" />
            </div>
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
  );
}
