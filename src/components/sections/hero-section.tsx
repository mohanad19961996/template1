"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft, ArrowRight, Play,
  BarChart3, Users, TrendingUp, Shield, Zap, Star,
  Sparkles, Check,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useSiteConfig } from "@/providers/site-config-provider";
import { HeroCentered, HeroSplit, HeroMinimal } from "./hero-variants";
import Image from "next/image";

export function HeroSection() {
  const { config } = useSiteConfig();
  switch (config.hero.variant) {
    case "centered": return <HeroCentered />;
    case "split": return <HeroSplit />;
    case "minimal": return <HeroMinimal />;
    default: return <DefaultHero />;
  }
}

function Counter({ value, inView }: { value: string; inView: boolean }) {
  const num = parseInt(value);
  const suffix = value.replace(/[0-9]/g, "");
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = num || 0;
    if (end === 0) return;
    const inc = end / (1800 / 16);
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, num]);
  return <>{inView ? count : 0}{suffix}</>;
}

/* ── Hero Background ── */
function HeroBg({ bgStyle }: { bgStyle: string }) {
  if (bgStyle === "clean") return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[70%]" style={{ background: "radial-gradient(ellipse at center top, rgba(var(--color-primary-rgb) / 0.04) 0%, transparent 65%)" }} />
    </div>
  );
  if (bgStyle === "gradient") return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[80%]" style={{ background: "radial-gradient(ellipse at center top, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%)" }} />
      <div className="absolute bottom-0 left-0 w-[60%] h-[40%]" style={{ background: "radial-gradient(ellipse at bottom left, rgba(var(--color-primary-rgb) / 0.05) 0%, transparent 60%)" }} />
      <div className="absolute top-[20%] end-0 w-[1px] h-[250px]" style={{ background: "linear-gradient(180deg, transparent, rgba(var(--color-primary-rgb) / 0.08), transparent)" }} />
    </div>
  );
  if (bgStyle === "grid") return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(var(--color-primary-rgb) / 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.3) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[70%]" style={{ background: "radial-gradient(ellipse at center top, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 65%)" }} />
    </div>
  );
  // dots (default)
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.5) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[70%]" style={{ background: "radial-gradient(ellipse at center top, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 65%)" }} />
      <div className="absolute top-[20%] start-0 w-[1px] h-[200px]" style={{ background: "linear-gradient(180deg, transparent, rgba(var(--color-primary-rgb) / 0.1), transparent)" }} />
      <div className="absolute top-[30%] end-0 w-[1px] h-[250px]" style={{ background: "linear-gradient(180deg, transparent, rgba(var(--color-primary-rgb) / 0.08), transparent)" }} />
    </div>
  );
}

/* ── Animation config ── */
function useHeroAnim(animation: string) {
  if (animation === "slide-in") return { initial: { opacity: 0, x: -30 }, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } };
  if (animation === "blur-in") return { initial: { opacity: 0, y: 14, filter: "blur(8px)" }, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } };
  if (animation === "scale") return { initial: { opacity: 0, scale: 0.92 }, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } };
  if (animation === "none") return { initial: {}, transition: { duration: 0 } };
  // fade-up (default)
  return { initial: { opacity: 0, y: 20 }, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } };
}

/* ── CTA Button Style ── */
function CtaButton({ style: ctaStyle, label, href, isAr }: { style: string; label: string; href: string; isAr: boolean }) {
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const baseClass = "group inline-flex items-center gap-2.5 h-12 px-7 rounded-2xl text-sm font-semibold text-white cursor-pointer cta-link-primary relative overflow-hidden";

  const getStyle = (): React.CSSProperties => {
    switch (ctaStyle) {
      case "outlined": return { color: "var(--color-primary)", border: "1.5px solid rgba(var(--color-primary-rgb) / 0.2)", background: "transparent", transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" };
      case "gradient": return { background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb)/0.7), var(--color-primary))", backgroundSize: "200% 200%", animation: "gradientShift 3s ease infinite", color: "white", boxShadow: "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)", transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" };
      case "glow": return { background: "var(--color-primary)", color: "white", boxShadow: "0 0 24px rgba(var(--color-primary-rgb)/0.4), 0 0 48px rgba(var(--color-primary-rgb)/0.15)", transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" };
      case "pill": return { background: "var(--color-primary)", color: "white", borderRadius: "9999px", boxShadow: "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)", transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" };
      default: return { background: "var(--color-primary)", color: "white", boxShadow: "0 6px 24px rgba(var(--color-primary-rgb) / 0.3), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.1)", transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" };
    }
  };

  return (
    <Link
      href={href}
      className={baseClass}
      style={getStyle()}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
        if (ctaStyle === "outlined") {
          e.currentTarget.style.background = "var(--color-primary)";
          e.currentTarget.style.color = "white";
          e.currentTarget.style.borderColor = "var(--color-primary)";
        }
        e.currentTarget.style.boxShadow = ctaStyle === "glow"
          ? "0 0 32px rgba(var(--color-primary-rgb)/0.5), 0 0 64px rgba(var(--color-primary-rgb)/0.2)"
          : "0 10px 32px rgba(var(--color-primary-rgb) / 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        if (ctaStyle === "outlined") {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--color-primary)";
          e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.2)";
        }
        const s = getStyle();
        e.currentTarget.style.boxShadow = (s.boxShadow as string) ?? "none";
      }}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)", transition: "transform 0.7s ease" }} />
      <span className="relative z-10">{label}</span>
      <Arrow className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5" />
    </Link>
  );
}

/* ── Premium Hero Visual ── */
function HeroVisual({ inView, isAr, imageStyle, showFloatingCards }: { inView: boolean; isAr: boolean; imageStyle: string; showFloatingCards: boolean }) {
  if (imageStyle === "none") return null;

  const imageContent = (
    <div className="relative aspect-[4/3] overflow-hidden">
      <Image src="https://picsum.photos/seed/hero-elegant/800/600" alt="Hero" fill className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105" priority />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.15) 0%, transparent 50%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
      <div className="absolute bottom-0 inset-x-0 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />)}</div>
            <span className="text-[11px] font-bold text-white">4.9</span>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="h-10 w-10 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Play className="h-4 w-4 text-white fill-white ms-0.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );

  const floatingCards = showFloatingCards && (
    <>
      <motion.div initial={{ opacity: 0, x: -30, y: -10 }} animate={inView ? { opacity: 1, x: 0, y: 0 } : {}} transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }} className="absolute -top-4 -start-6 z-20 hidden md:flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--color-card)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)", boxShadow: "0 16px 48px rgba(var(--color-foreground-rgb) / 0.08)" }}>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
          <Shield className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <div className="text-sm font-bold">99.9%</div>
          <div className="text-[10px] font-semibold" style={{ color: "var(--color-primary)" }}>{isAr ? "وقت التشغيل" : "Uptime"}</div>
        </div>
        <div className="h-6 w-6 rounded-full flex items-center justify-center ms-1" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}>
          <Check className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 30, y: 10 }} animate={inView ? { opacity: 1, x: 0, y: 0 } : {}} transition={{ delay: 0.85, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }} className="absolute -bottom-4 -end-6 z-20 hidden md:flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--color-card)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)", boxShadow: "0 16px 48px rgba(var(--color-foreground-rgb) / 0.08)" }}>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
          <TrendingUp className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <div className="text-sm font-bold">+500</div>
          <div className="text-[10px] font-semibold" style={{ color: "var(--color-primary)" }}>{isAr ? "مشروع مكتمل" : "Projects Done"}</div>
        </div>
        <div className="flex items-end gap-[3px] ms-1 h-5">
          {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
            <motion.div key={i} className="w-[3px] rounded-full" style={{ background: "var(--color-primary)", height: `${h}%` }} initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}} transition={{ delay: 1 + i * 0.05, duration: 0.4 }} />
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1, duration: 0.5, type: "spring", stiffness: 200 }} className="absolute top-1/2 -end-3 z-20 hidden lg:flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "var(--color-primary)", boxShadow: "0 8px 24px rgba(var(--color-primary-rgb) / 0.35)" }}>
        <Zap className="h-3 w-3 text-white" />
        <span className="text-[10px] font-bold text-white">{isAr ? "مباشر" : "Live"}</span>
      </motion.div>
    </>
  );

  return (
    <div className="relative w-full max-w-[560px] mx-auto lg:mx-0">
      <motion.div className="absolute -z-10 rounded-full blur-[100px]" style={{ width: "70%", height: "70%", top: "15%", left: "15%", background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.25) 0%, transparent 70%)" }} animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

      {imageStyle === "gradient-border" ? (
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <div className="relative rounded-3xl p-[3px] group cursor-pointer" style={{ background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.35), var(--color-primary), rgba(var(--color-primary-rgb) / 0.6), var(--color-primary))", backgroundSize: "400% 400%", animation: "gradientBorder 3s ease infinite", boxShadow: "0 40px 100px rgba(var(--color-foreground-rgb) / 0.1), 0 0 20px rgba(var(--color-primary-rgb) / 0.12)" }}>
            <div className="relative rounded-[calc(1.5rem-3px)] overflow-hidden">{imageContent}</div>
          </div>
        </motion.div>
      ) : imageStyle === "floating" ? (
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          <div className="relative rounded-3xl overflow-hidden group cursor-pointer" style={{ boxShadow: "0 40px 100px rgba(var(--color-foreground-rgb) / 0.12), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.08)" }}>
            <div className="absolute top-0 inset-x-0 h-[2px] z-10" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
            {imageContent}
          </div>
        </motion.div>
      ) : imageStyle === "masked" ? (
        <div className="relative group cursor-pointer" style={{ clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)" }}>
          <div className="rounded-2xl overflow-hidden">{imageContent}</div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95, rotateX: 8 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1, rotateX: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative rounded-3xl overflow-hidden group cursor-pointer"
          style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.12)", boxShadow: "0 40px 100px rgba(var(--color-foreground-rgb) / 0.1), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.04), inset 0 1px 0 rgba(255,255,255,0.06)", transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          whileHover={{ y: -6, boxShadow: "0 50px 120px rgba(var(--color-foreground-rgb) / 0.14), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.12), 0 0 40px rgba(var(--color-primary-rgb) / 0.08)" }}
        >
          {imageContent}
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
        </motion.div>
      )}

      {floatingCards}
    </div>
  );
}

/* ──────────────────────────────────────────────── */
function DefaultHero() {
  const ts = useTranslations("stats");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config } = useSiteConfig();
  const hero = config.hero;
  const c = hero.content;
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });
  const anim = useHeroAnim(hero.animation);

  const title = isAr ? c.titleAr : c.titleEn;
  const highlight = isAr ? c.highlightAr : c.highlightEn;
  const description = isAr ? c.descriptionAr : c.descriptionEn;
  const badge = isAr ? c.badgeAr : c.badgeEn;
  const cta = isAr ? c.ctaAr : c.ctaEn;
  const secondaryCta = isAr ? c.secondaryCtaAr : c.secondaryCtaEn;

  const metrics = [
    { value: "500+", label: ts("clients"), icon: Users },
    { value: "98%", label: ts("satisfaction"), icon: Star },
    { value: "15+", label: ts("experience"), icon: BarChart3 },
  ];

  const features = [
    { icon: Zap, label: isAr ? "سريع وموثوق" : "Fast & Reliable" },
    { icon: Shield, label: isAr ? "آمن ومحمي" : "Secure & Protected" },
    { icon: Sparkles, label: isAr ? "تصميم عصري" : "Modern Design" },
  ];

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ paddingBlock: "var(--section-y-lg)" }}>
      <HeroBg bgStyle={hero.bgStyle} />

      <Container>
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
          {/* ── Content Column ── */}
          <div className="max-w-xl">
            {/* Badge */}
            {hero.showBadge && (
              <motion.div
                initial={anim.initial}
                animate={isInView ? { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" } : {}}
                transition={anim.transition}
                className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-[11px] font-semibold mb-7"
                style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", color: "var(--color-primary)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)", boxShadow: "0 0 24px rgba(var(--color-primary-rgb) / 0.06)" }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--color-primary)", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--color-primary)" }} />
                </span>
                {badge}
              </motion.div>
            )}

            {/* Title */}
            <motion.div
              initial={anim.initial}
              animate={isInView ? { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" } : {}}
              transition={{ ...anim.transition, delay: 0.08 }}
            >
              <h1 className="font-bold tracking-tight leading-[1.06]" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}>
                {title}{" "}
                <span className="text-gradient-animated">{highlight}</span>
              </h1>
              <div className="relative mt-2 h-[3px] w-full max-w-xs overflow-hidden rounded-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}>
                <div className="absolute inset-y-0 w-1/2 rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)", animation: "underlineSweep 2.5s ease-in-out infinite" }} />
              </div>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={anim.initial}
              animate={isInView ? { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" } : {}}
              transition={{ ...anim.transition, delay: 0.15 }}
              className="mt-5 text-[15px] text-foreground leading-[1.7] max-w-md"
            >
              {description}
            </motion.p>

            {/* Feature pills */}
            {hero.showFeatures && (
              <motion.div
                initial={anim.initial}
                animate={isInView ? { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" } : {}}
                transition={{ ...anim.transition, delay: 0.2 }}
                className="mt-5 flex flex-wrap items-center gap-2"
              >
                {features.map((f) => (
                  <div key={f.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.04)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
                    <f.icon className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                    {f.label}
                  </div>
                ))}
              </motion.div>
            )}

            {/* CTAs */}
            <motion.div
              initial={anim.initial}
              animate={isInView ? { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" } : {}}
              transition={{ ...anim.transition, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <CtaButton style={hero.ctaStyle} label={cta} href="/contact" isAr={isAr} />
              {hero.showSecondaryCta && (
                <Link
                  href="/portfolio"
                  className="group inline-flex items-center gap-2 h-12 px-6 rounded-2xl text-sm font-semibold cursor-pointer relative overflow-hidden"
                  style={{ color: "var(--color-primary)", border: "1.5px solid rgba(var(--color-primary-rgb) / 0.15)", background: "rgba(var(--color-primary-rgb) / 0.03)", transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)"; e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {secondaryCta}
                  <Arrow className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Link>
              )}
            </motion.div>

            {/* Metrics */}
            {hero.showStats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-10 pt-7 flex flex-wrap items-center gap-4"
                style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
              >
                {metrics.map((m, i) => (
                  <div key={m.label} className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
                        <m.icon className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                      </div>
                      <div>
                        <div className="text-lg font-bold tracking-tight"><Counter value={m.value} inView={isInView} /></div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>{m.label}</div>
                      </div>
                    </div>
                    {i < metrics.length - 1 && <div className="h-9 w-px" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)" }} />}
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* ── Visual Column ── */}
          {hero.showImage && (
            <motion.div
              initial={{ opacity: 0, x: isAr ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <HeroVisual inView={isInView} isAr={isAr} imageStyle={hero.imageStyle} showFloatingCards={hero.showFloatingCards} />
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  );
}
