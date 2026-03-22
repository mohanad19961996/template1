"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft, ArrowRight, Sparkles, Zap, Shield, Star,
  Play, Users, TrendingUp, Check, Globe,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useSiteConfig } from "@/providers/site-config-provider";
import Image from "next/image";

/* ── Animated Counter ── */
function Counter({ value, inView }: { value: string; inView: boolean }) {
  const num = parseInt(value);
  const suffix = value.replace(/[0-9]/g, "");
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = num || 0;
    if (end === 0) return;
    const inc = end / (1600 / 16);
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, num]);
  return <>{inView ? count : 0}{suffix}</>;
}

/* ══════════════════════════════════════════════════════════════ */
/* ── HeroCentered ──                                            */
/* ══════════════════════════════════════════════════════════════ */
export function HeroCentered() {
  const ts = useTranslations("stats");
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { config } = useSiteConfig();
  const hero = config.hero;
  const c = hero.content;

  const title = isAr ? c.titleAr : c.titleEn;
  const highlight = isAr ? c.highlightAr : c.highlightEn;
  const description = isAr ? c.descriptionAr : c.descriptionEn;
  const badge = isAr ? c.badgeAr : c.badgeEn;
  const cta = isAr ? c.ctaAr : c.ctaEn;
  const secondaryCta = isAr ? c.secondaryCtaAr : c.secondaryCtaEn;

  const stats = [
    { value: "500+", label: ts("clients"), icon: Users },
    { value: "98%", label: ts("satisfaction"), icon: Star },
    { value: "15+", label: ts("experience"), icon: TrendingUp },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ paddingBlock: "var(--section-y-lg)" }}>
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[80%]" style={{ background: "radial-gradient(ellipse at center top, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.4) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <motion.div className="absolute top-[12%] start-[6%] h-2 w-2 rounded-full" style={{ background: "var(--color-primary)", opacity: 0.3 }} animate={{ y: [0, -25, 0], x: [0, 8, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-[22%] end-[8%] h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-primary)", opacity: 0.2 }} animate={{ y: [0, 18, 0], x: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        <motion.div className="absolute bottom-[25%] start-[12%] h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-primary)", opacity: 0.25 }} animate={{ y: [0, -15, 0], x: [0, 6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
        <motion.div className="absolute top-[60%] end-[15%] h-1 w-1 rounded-full" style={{ background: "var(--color-primary)", opacity: 0.2 }} animate={{ y: [0, -12, 0], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        <motion.div className="absolute top-[35%] start-[4%] h-8 w-8 rounded-full hidden lg:block" style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }} animate={{ y: [0, -10, 0], rotate: [0, 180, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute bottom-[20%] end-[5%] h-6 w-6 rounded-full hidden lg:block" style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }} animate={{ y: [0, 8, 0], rotate: [360, 180, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute top-[18%] start-0 w-[1px] h-[180px]" style={{ background: "linear-gradient(180deg, transparent, rgba(var(--color-primary-rgb) / 0.12), transparent)" }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-[28%] end-0 w-[1px] h-[220px]" style={{ background: "linear-gradient(180deg, transparent, rgba(var(--color-primary-rgb) / 0.1), transparent)" }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />
      </div>

      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Text Column ── */}
          <div className="max-w-xl">
            {hero.showBadge && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }} className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-[11px] font-semibold mb-7" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", color: "var(--color-primary)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)", boxShadow: "0 0 24px rgba(var(--color-primary-rgb) / 0.06)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--color-primary)", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--color-primary)" }} />
                </span>
                {badge}
              </motion.div>
            )}

            <div className="relative">
              <h1 className="font-bold tracking-tight leading-[1.06]" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}>
                <motion.span initial={{ opacity: 0, y: 24, filter: "blur(8px)" }} animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}} transition={{ duration: 0.7, delay: 0.06, ease: [0.16, 1, 0.3, 1] as const }} className="inline-block">{title}</motion.span>{" "}
                <motion.span initial={{ opacity: 0, y: 24, filter: "blur(8px)" }} animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}} transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] as const }} className="inline-block text-gradient-animated">{highlight}</motion.span>
              </h1>
              <motion.div initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] as const }} className="relative mt-3 h-[3px] w-full overflow-hidden rounded-full origin-start" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}>
                <div className="absolute inset-y-0 w-1/3 rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)", animation: "underlineSweep 2s ease-in-out infinite" }} />
              </motion.div>
            </div>

            <motion.p initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] as const }} className="mt-5 text-[15px] text-foreground leading-[1.7] max-w-md">
              {description}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/contact" className="group inline-flex items-center gap-2.5 h-12 px-8 rounded-2xl text-sm font-semibold text-white cursor-pointer cta-link-primary relative overflow-hidden" style={{ background: "var(--color-primary)", boxShadow: "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)", transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(var(--color-primary-rgb) / 0.4), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)"; }}>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)", transition: "transform 0.7s ease" }} />
                <span className="relative z-10">{cta}</span>
                <Arrow className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5" />
              </Link>
              {hero.showSecondaryCta && (
                <Link href="/portfolio" className="group inline-flex items-center gap-2 h-12 px-7 rounded-2xl text-sm font-semibold cursor-pointer relative overflow-hidden" style={{ color: "var(--color-primary)", border: "1.5px solid rgba(var(--color-primary-rgb) / 0.15)", background: "rgba(var(--color-primary-rgb) / 0.03)", transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)"; e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  {secondaryCta}
                  <Arrow className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Link>
              )}
            </motion.div>

            {hero.showStats && (
              <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.4, duration: 0.5 }} className="mt-10 pt-7 flex flex-wrap items-center gap-4" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
                {stats.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
                        <s.icon className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                      </div>
                      <div>
                        <div className="text-lg font-bold tracking-tight"><Counter value={s.value} inView={inView} /></div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>{s.label}</div>
                      </div>
                    </div>
                    {i < stats.length - 1 && <div className="h-9 w-px hidden md:block" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)" }} />}
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* ── Image Column ── */}
          {hero.showImage && (
            <motion.div initial={{ opacity: 0, x: isAr ? -30 : 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }} className="relative">
              <motion.div className="absolute -z-10 rounded-full blur-[100px]" style={{ width: "70%", height: "70%", top: "15%", left: "15%", background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.25) 0%, transparent 70%)" }} animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                <div className="relative rounded-3xl p-[3px] group cursor-pointer" style={{ background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.35), var(--color-primary), rgba(var(--color-primary-rgb) / 0.6), var(--color-primary))", backgroundSize: "400% 400%", animation: "gradientBorder 3s ease infinite", boxShadow: "0 40px 100px rgba(0,0,0,0.1), 0 0 20px rgba(var(--color-primary-rgb) / 0.12)", transition: "box-shadow 0.5s ease" }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 50px 120px rgba(0,0,0,0.14), 0 0 60px rgba(var(--color-primary-rgb) / 0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 40px 100px rgba(0,0,0,0.1), 0 0 20px rgba(var(--color-primary-rgb) / 0.12)"; }}>
                  <div className="relative rounded-[calc(1.5rem-3px)] overflow-hidden">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image src="https://picsum.photos/seed/digital-workspace/800/600" alt="Hero" fill className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" priority />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.12) 0%, transparent 40%)" }} />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />
                      <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />)}</div>
                            <span className="text-[10px] font-bold text-white">4.9</span>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                            <Globe className="h-3 w-3 text-white" />
                            <span className="text-[10px] font-bold text-white">{isAr ? "12 دولة" : "12 Countries"}</span>
                          </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="h-10 w-10 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                          <Play className="h-4 w-4 text-white fill-white ms-0.5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {hero.showFloatingCards && (
                <>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.8, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }} className="absolute -top-4 -start-5 z-20 hidden md:flex items-center gap-2.5 rounded-2xl px-4 py-3" style={{ background: "var(--color-card)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)", boxShadow: "0 16px 48px rgba(var(--color-foreground-rgb) / 0.08)" }}>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}><Shield className="h-4 w-4" style={{ color: "var(--color-primary)" }} /></div>
                    <div><div className="text-sm font-bold">99.9%</div><div className="text-[10px] font-semibold" style={{ color: "var(--color-primary)" }}>{isAr ? "وقت التشغيل" : "Uptime SLA"}</div></div>
                    <Check className="h-4 w-4 ms-1" style={{ color: "var(--color-primary)" }} />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.95, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }} className="absolute -bottom-4 -end-5 z-20 hidden md:flex items-center gap-2.5 rounded-2xl px-4 py-3" style={{ background: "var(--color-card)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)", boxShadow: "0 16px 48px rgba(var(--color-foreground-rgb) / 0.08)" }}>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}><Zap className="h-4 w-4" style={{ color: "var(--color-primary)" }} /></div>
                    <div><div className="text-sm font-bold">+500</div><div className="text-[10px] font-semibold" style={{ color: "var(--color-primary)" }}>{isAr ? "مشروع مكتمل" : "Projects Done"}</div></div>
                    <div className="flex items-end gap-[3px] ms-1 h-5">
                      {[40, 65, 50, 80, 60, 95, 75].map((h, i) => (
                        <motion.div key={i} className="w-[3px] rounded-full" style={{ background: "var(--color-primary)", height: `${h}%` }} initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}} transition={{ delay: 1.1 + i * 0.05, duration: 0.4 }} />
                      ))}
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1, duration: 0.5, type: "spring", stiffness: 200 }} className="absolute top-1/2 -end-3 z-20 hidden lg:flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "var(--color-primary)", boxShadow: "0 8px 24px rgba(var(--color-primary-rgb) / 0.35)" }}>
                    <Zap className="h-3 w-3 text-white" /><span className="text-[10px] font-bold text-white">{isAr ? "مباشر" : "Live"}</span>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* ── HeroSplit ──                                               */
/* ══════════════════════════════════════════════════════════════ */
export function HeroSplit() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { config } = useSiteConfig();
  const hero = config.hero;
  const c = hero.content;

  const title = isAr ? c.titleAr : c.titleEn;
  const highlight = isAr ? c.highlightAr : c.highlightEn;
  const description = isAr ? c.descriptionAr : c.descriptionEn;
  const badge = isAr ? c.badgeAr : c.badgeEn;
  const cta = isAr ? c.ctaAr : c.ctaEn;
  const secondaryCta = isAr ? c.secondaryCtaAr : c.secondaryCtaEn;

  const features = [
    { icon: Zap, label: isAr ? "أداء فائق" : "High Performance" },
    { icon: Shield, label: isAr ? "حماية متقدمة" : "Enterprise Security" },
    { icon: Sparkles, label: isAr ? "تصميم حديث" : "Modern Design" },
    { icon: Globe, label: isAr ? "وصول عالمي" : "Global Reach" },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ paddingBlock: "var(--section-y-lg)" }}>
      <div className="absolute inset-0 -z-10 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.4) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="max-w-xl">
            {hero.showBadge && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }} className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-[11px] font-semibold mb-6" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", color: "var(--color-primary)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)" }}>
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--color-primary)", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} /><span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--color-primary)" }} /></span>
                {badge}
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.06, ease: [0.16, 1, 0.3, 1] as const }}>
              <h1 className="font-bold tracking-tight leading-[1.08]" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}>
                {title}{" "}<span className="text-gradient-animated">{highlight}</span>
              </h1>
              <div className="relative mt-2 h-[3px] w-full max-w-xs overflow-hidden rounded-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}>
                <div className="absolute inset-y-0 w-1/2 rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)", animation: "underlineSweep 2.5s ease-in-out infinite" }} />
              </div>
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] as const }} className="mt-4 text-[14px] text-foreground leading-[1.7] max-w-md">
              {description}
            </motion.p>

            {hero.showFeatures && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] as const }} className="mt-6 grid grid-cols-2 gap-3">
                {features.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
                      <f.icon className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                    </div>
                    <span className="text-[12px] font-medium">{f.label}</span>
                  </div>
                ))}
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] as const }} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/contact" className="group inline-flex items-center gap-2 h-11 px-7 rounded-2xl text-sm font-semibold text-white cursor-pointer cta-link-primary relative overflow-hidden" style={{ background: "var(--color-primary)", boxShadow: "0 4px 20px rgba(var(--color-primary-rgb) / 0.25)", transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(var(--color-primary-rgb) / 0.4)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(var(--color-primary-rgb) / 0.25)"; }}>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)", transition: "transform 0.7s ease" }} />
                <span className="relative z-10">{cta}</span>
                <Arrow className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5" />
              </Link>
              {hero.showSecondaryCta && (
                <Link href="/portfolio" className="group inline-flex items-center gap-2 h-11 px-6 rounded-2xl text-sm font-semibold cursor-pointer" style={{ color: "var(--color-primary)", border: "1.5px solid rgba(var(--color-primary-rgb) / 0.15)", background: "rgba(var(--color-primary-rgb) / 0.03)", transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)"; e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  {secondaryCta}
                  <Arrow className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Link>
              )}
            </motion.div>
          </div>

          {hero.showImage && (
            <motion.div initial={{ opacity: 0, x: isAr ? -30 : 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }} className="relative">
              <div className="absolute -z-10 rounded-full blur-[80px]" style={{ width: "60%", height: "60%", top: "20%", left: "20%", background: "rgba(var(--color-primary-rgb) / 0.12)" }} />
              <div className="relative rounded-3xl overflow-hidden group cursor-pointer" style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)", transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 50px 120px rgba(0,0,0,0.12), 0 0 40px rgba(var(--color-primary-rgb) / 0.08)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 32px 80px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; }}>
                <div className="absolute top-0 inset-x-0 h-[2px] z-10" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src="https://picsum.photos/seed/hero-split/800/600" alt="Hero" fill className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105" priority />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.1), transparent 50%)" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)" }} />
                  <div className="absolute bottom-3 inset-x-3 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />)}</div>
                      <span className="text-[10px] font-bold text-white">4.9</span>
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="h-9 w-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                      <Play className="h-3.5 w-3.5 text-white fill-white ms-0.5" />
                    </motion.button>
                  </div>
                </div>
              </div>
              {hero.showFloatingCards && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.9, type: "spring", stiffness: 200 }} className="absolute -top-3 -end-3 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "var(--color-primary)", boxShadow: "0 6px 20px rgba(var(--color-primary-rgb) / 0.35)" }}>
                  <Zap className="h-3 w-3 text-white" /><span className="text-[10px] font-bold text-white">{isAr ? "مباشر" : "Live"}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* ── HeroMinimal ──                                             */
/* ══════════════════════════════════════════════════════════════ */
export function HeroMinimal() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { config } = useSiteConfig();
  const hero = config.hero;
  const c = hero.content;

  const title = isAr ? c.titleAr : c.titleEn;
  const highlight = isAr ? c.highlightAr : c.highlightEn;
  const description = isAr ? c.descriptionAr : c.descriptionEn;
  const cta = isAr ? c.ctaAr : c.ctaEn;

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ paddingBlock: "calc(var(--section-y-lg) * 1.1)" }}>
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%]" style={{ background: "radial-gradient(ellipse at center top, rgba(var(--color-primary-rgb) / 0.04) 0%, transparent 60%)" }} />
      </div>

      <Container size="sm">
        <div className="text-center">
          <motion.div initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }} className="mx-auto mb-8 h-[2px] w-16" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }} className="inline-block">
            <h1 className="font-bold tracking-tight leading-[1.08]" style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)" }}>
              {title}{" "}<span className="text-gradient-animated">{highlight}</span>
            </h1>
            <div className="relative mt-2 mx-auto h-[3px] w-48 overflow-hidden rounded-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}>
              <div className="absolute inset-y-0 w-1/2 rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)", animation: "underlineSweep 2.5s ease-in-out infinite" }} />
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }} className="mt-6 text-[15px] text-foreground leading-[1.7] max-w-md mx-auto">
            {description}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }} className="mt-8 flex items-center justify-center gap-3">
            <Link href="/contact" className="group inline-flex items-center gap-2.5 h-12 px-8 rounded-2xl text-sm font-semibold text-white cursor-pointer cta-link-primary relative overflow-hidden" style={{ background: "var(--color-primary)", boxShadow: "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)", transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(var(--color-primary-rgb) / 0.4)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)"; }}>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)", transition: "transform 0.7s ease" }} />
              <span className="relative z-10">{cta}</span>
              <Arrow className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5" />
            </Link>
          </motion.div>

          <motion.div initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] as const }} className="mx-auto mt-8 h-[2px] w-16" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
        </div>
      </Container>
    </section>
  );
}
