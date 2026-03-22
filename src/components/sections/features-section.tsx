"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRef, useState } from "react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { Modal } from "@/components/shared/modal";
import { useSiteConfig } from "@/providers/site-config-provider";
import {
  Zap,
  Palette,
  Shield,
  Headphones,
  TrendingUp,
  BarChart3,
  Check,
  Star,
  ArrowUpRight,
  Quote,
  Sparkles,
  X,
} from "lucide-react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    key: "performance",
    icon: Zap,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    stat: "99.8%",
    statLabel: { en: "Uptime", ar: "وقت التشغيل" },
    rating: 5,
    reviews: 2847,
    badge: { en: "Top Rated", ar: "الأعلى تقييماً" },
    ctaEn: "Boost Your Speed",
    ctaAr: "عزّز سرعتك",
    quoteEn: "Load time dropped from 4s to under 1s.",
    quoteAr: "انخفض وقت التحميل من 4 ثوانٍ إلى أقل من ثانية.",
    quoterEn: "Sarah M., CTO",
    quoterAr: "سارة م.، مديرة تقنية",
    detailsEn: [
      "Lightning-fast load times under 2 seconds",
      "CDN & edge caching on 200+ global nodes",
      "Automatic code splitting & lazy loading",
      "Core Web Vitals score A+ guaranteed",
      "Next-gen image formats & optimization",
      "HTTP/3 & Brotli compression",
    ],
    detailsAr: [
      "تحميل أقل من ثانيتين بسرعة البرق",
      "تخزين مؤقت ذكي على 200+ عقدة عالمية",
      "تقسيم الكود وتحميل كسول تلقائي",
      "مؤشرات الويب A+ مضمونة",
      "تنسيقات صور حديثة وتحسين تلقائي",
      "ضغط HTTP/3 و Brotli مفعّل",
    ],
    flipAxis: "Y" as const,
    flipDuration: "1.2s",
  },
  {
    key: "design",
    icon: Palette,
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop",
    stat: "100%",
    statLabel: { en: "Responsive", ar: "متجاوب" },
    rating: 5,
    reviews: 3214,
    badge: { en: "Award Winner", ar: "حائز جوائز" },
    ctaEn: "Explore Designs",
    ctaAr: "استكشف التصاميم",
    quoteEn: "The design system saved us 3 months.",
    quoteAr: "وفّر لنا نظام التصميم 3 أشهر.",
    quoterEn: "Alex K., Product Lead",
    quoterAr: "أحمد ك.، قائد المنتج",
    detailsEn: [
      "Cutting-edge 2026 design aesthetics",
      "Pixel-perfect across all breakpoints",
      "Dark, light & custom theme modes",
      "50+ reusable UI components included",
      "Micro-interactions & motion design",
      "WCAG 2.1 AA accessible",
    ],
    detailsAr: [
      "جماليات تصميم 2026 المتطورة",
      "دقة متناهية على جميع الأحجام",
      "وضع داكن وفاتح وسمات مخصصة",
      "50+ مكوّن واجهة قابل لإعادة الاستخدام",
      "تفاعلات دقيقة وتصميم حركي",
      "متوافق مع معايير الوصول WCAG 2.1",
    ],
    flipAxis: "X" as const,
    flipDuration: "1.3s",
  },
  {
    key: "security",
    icon: Shield,
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
    stat: "256-bit",
    statLabel: { en: "Encryption", ar: "تشفير" },
    rating: 5,
    reviews: 1893,
    badge: { en: "Enterprise", ar: "مؤسسي" },
    ctaEn: "Secure Your App",
    ctaAr: "أمّن تطبيقك",
    quoteEn: "Passed SOC2 audit with zero findings.",
    quoteAr: "اجتزنا تدقيق SOC2 بدون أي ملاحظات.",
    quoterEn: "David R., CISO",
    quoterAr: "داود ر.، مسؤول أمن المعلومات",
    detailsEn: [
      "End-to-end AES-256 military-grade encryption",
      "OWASP Top 10 vulnerability protection",
      "Quarterly penetration testing audits",
      "Full GDPR, SOC2 & HIPAA compliance",
      "Real-time threat monitoring & alerting",
      "Automated vulnerability scanning in CI/CD",
    ],
    detailsAr: [
      "تشفير AES-256 بمستوى عسكري شامل",
      "حماية ضد ثغرات OWASP العشر",
      "اختبارات اختراق ربع سنوية",
      "توافق كامل مع GDPR و SOC2 و HIPAA",
      "مراقبة تهديدات وتنبيهات فورية",
      "فحص ثغرات آلي في CI/CD",
    ],
    flipAxis: "-Y" as const,
    flipDuration: "1.4s",
  },
  {
    key: "support",
    icon: Headphones,
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop",
    stat: "24/7",
    statLabel: { en: "Available", ar: "متاح" },
    rating: 5,
    reviews: 4102,
    badge: { en: "Dedicated", ar: "مخصص" },
    ctaEn: "Get Support Now",
    ctaAr: "احصل على الدعم",
    quoteEn: "Best support team. Response in minutes.",
    quoteAr: "أفضل فريق دعم. استجابة خلال دقائق.",
    quoterEn: "Emily T., Founder",
    quoterAr: "إيمان ت.، مؤسسة",
    detailsEn: [
      "Round-the-clock expert technical help",
      "Personal dedicated account manager",
      "SLA-backed 2-hour response guarantee",
      "500+ article self-serve knowledge base",
      "Priority escalation for critical issues",
      "Monthly performance review calls",
    ],
    detailsAr: [
      "مساعدة تقنية متخصصة على مدار الساعة",
      "مدير حساب شخصي مخصص",
      "ضمان استجابة خلال ساعتين مدعوم بـ SLA",
      "قاعدة معرفة شاملة 500+ مقال",
      "تصعيد ذو أولوية للمشاكل الحرجة",
      "مكالمات مراجعة أداء شهرية",
    ],
    flipAxis: "-X" as const,
    flipDuration: "1.5s",
  },
  {
    key: "scalable",
    icon: TrendingUp,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    stat: "∞",
    statLabel: { en: "Scale", ar: "توسع" },
    rating: 4,
    reviews: 1567,
    badge: { en: "Auto-Scale", ar: "توسع تلقائي" },
    ctaEn: "Start Scaling",
    ctaAr: "ابدأ التوسع",
    quoteEn: "Scaled from 1K to 500K users seamlessly.",
    quoteAr: "توسعنا من 1K إلى 500K مستخدم بسلاسة.",
    quoterEn: "Mark L., VP Engineering",
    quoterAr: "مصطفى ل.، نائب رئيس الهندسة",
    detailsEn: [
      "Elastic auto-scaling cloud infrastructure",
      "Production-ready microservices architecture",
      "Intelligent load balancing & auto-failover",
      "99.9% uptime SLA with financial guarantee",
      "Multi-region deployment & data residency",
      "Zero-downtime rolling deployments",
    ],
    detailsAr: [
      "بنية سحابية مرنة قابلة للتوسع تلقائياً",
      "معمارية مايكروسيرفس جاهزة للإنتاج",
      "موازنة أحمال ذكية مع تجاوز أعطال تلقائي",
      "ضمان تشغيل 99.9% مع ضمان مالي",
      "نشر متعدد المناطق مع إقامة البيانات",
      "نشر متدحرج بدون توقف",
    ],
    flipAxis: "Y" as const,
    flipDuration: "1.3s",
  },
  {
    key: "analytics",
    icon: BarChart3,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80",
    stat: "360°",
    statLabel: { en: "Insights", ar: "رؤى" },
    rating: 5,
    reviews: 2341,
    badge: { en: "Real-time", ar: "فوري" },
    ctaEn: "View Live Demo",
    ctaAr: "شاهد العرض المباشر",
    quoteEn: "Transformed how we make decisions.",
    quoteAr: "غيّرت طريقة اتخاذنا للقرارات.",
    quoterEn: "Lisa W., Data Lead",
    quoterAr: "لينا و.، قائدة البيانات",
    detailsEn: [
      "Real-time interactive analytics dashboards",
      "Custom event & full-funnel tracking",
      "Built-in A/B & multivariate testing",
      "Automated weekly performance reports",
      "Cohort analysis & behavior heatmaps",
      "Revenue attribution & ROI tracking",
    ],
    detailsAr: [
      "لوحات تحكم تحليلية تفاعلية فورية",
      "تتبع أحداث مخصصة ومسار تحويل كامل",
      "اختبار A/B ومتعدد المتغيرات مدمج",
      "تقارير أداء أسبوعية تلقائية",
      "تحليل الأفواج وخرائط حرارة السلوك",
      "إسناد الإيرادات وتتبع العائد",
    ],
    flipAxis: "-X" as const,
    flipDuration: "1.4s",
  },
];

function FlipCard({
  feature,
  index,
  isInView,
  isAr,
  t,
  cfg,
}: {
  feature: (typeof features)[0];
  index: number;
  isInView: boolean;
  isAr: boolean;
  t: ReturnType<typeof useTranslations>;
  cfg: { showRatings: boolean; showBadges: boolean; showQuotes: boolean; showModal: boolean; showImages: boolean };
}) {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const flipTransform = hovered
    ? feature.flipAxis === "Y"
      ? "rotateY(180deg)"
      : feature.flipAxis === "-Y"
      ? "rotateY(-180deg)"
      : feature.flipAxis === "X"
      ? "rotateX(180deg)"
      : "rotateX(-180deg)"
    : "none";

  const backTransform =
    feature.flipAxis === "Y"
      ? "rotateY(180deg)"
      : feature.flipAxis === "-Y"
      ? "rotateY(-180deg)"
      : feature.flipAxis === "X"
      ? "rotateX(180deg)"
      : "rotateX(-180deg)";

  const details = isAr ? feature.detailsAr : feature.detailsEn;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ perspective: "2000px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="relative w-full cursor-pointer"
          style={{
            height: "540px",
            transformStyle: "preserve-3d",
            transition: `transform ${feature.flipDuration} cubic-bezier(0.4, 0, 0.2, 1)`,
            transform: flipTransform,
          }}
        >
          {/* ============ FRONT ============ */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden group transition-all duration-500"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "var(--color-card)",
              border: "2px solid var(--color-primary)",
              boxShadow: hovered
                ? "0 20px 60px rgba(var(--color-primary-rgb) / 0.15)"
                : "0 2px 20px rgba(var(--color-foreground-rgb, 0 0 0) / 0.04)",
            }}
          >

            {/* ---- Image ---- */}
            {cfg.showImages && (
            <div className="relative h-[220px] overflow-hidden rounded-t-3xl">
              <img
                src={feature.image}
                alt=""
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: "var(--color-primary)", mixBlendMode: "overlay" }}
              />

              {/* Badge */}
              {cfg.showBadges && (
              <span
                className="absolute top-4 start-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xl"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.65)",
                  boxShadow: "0 2px 12px rgba(var(--color-primary-rgb) / 0.3)",
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {isAr ? feature.badge.ar : feature.badge.en}
              </span>
              )}

              {/* Stat pill */}
              <div className="absolute bottom-4 end-4 backdrop-blur-xl rounded-xl px-3 py-1.5"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div className="text-[18px] font-black text-white leading-none">{feature.stat}</div>
                <div className="text-[8px] text-white font-bold uppercase tracking-widest mt-0.5">
                  {isAr ? feature.statLabel.ar : feature.statLabel.en}
                </div>
              </div>

            </div>
            )}

            {/* Icon chip — outside image to avoid clip */}
            {cfg.showImages && (
            <div
              className="absolute start-5 h-10 w-10 rounded-2xl flex items-center justify-center z-10"
              style={{
                top: "215px",
                background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.75))",
                boxShadow: "0 4px 20px rgba(var(--color-primary-rgb) / 0.4), 0 0 0 3px var(--color-card)",
              }}
            >
              <feature.icon className="h-[18px] w-[18px] text-white" />
            </div>
            )}

            {/* ---- Content ---- */}
            <div className="relative px-5 pt-8 pb-5 flex flex-col" style={{ height: cfg.showImages ? "calc(100% - 220px)" : "100%" }}>
              {/* Stars */}
              {cfg.showRatings && (
              <div className="flex items-center gap-0.5 mb-2">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5" style={{
                    color: s < feature.rating ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.1)",
                    fill: s < feature.rating ? "var(--color-primary)" : "transparent",
                  }} />
                ))}
                <span className="text-[10px] text-foreground ms-1.5 font-medium">
                  ({feature.reviews.toLocaleString()})
                </span>
              </div>
              )}

              {/* Title */}
              <h3 className="text-lg font-extrabold tracking-tight mb-1">{t(feature.key)}</h3>

              {/* Desc */}
              <p className="text-[12.5px] text-foreground leading-relaxed mb-4">
                {t(`${feature.key}Desc`)}
              </p>

              {/* Quote */}
              {cfg.showQuotes && (
              <div
                className="rounded-2xl px-3.5 py-2.5 mt-auto"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.04)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                }}
              >
                <div className="flex gap-2">
                  <Quote className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-30" style={{ color: "var(--color-primary)" }} />
                  <div>
                    <p className="text-[11px] text-foreground leading-snug italic">
                      &ldquo;{isAr ? feature.quoteAr : feature.quoteEn}&rdquo;
                    </p>
                    <p className="text-[10px] mt-1 font-semibold" style={{ color: "var(--color-primary)" }}>
                      {isAr ? feature.quoterAr : feature.quoterEn}
                    </p>
                  </div>
                </div>
              </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
                <span className="text-[10px] font-mono font-bold" style={{ color: "var(--color-primary)" }}>
                  {String(index + 1).padStart(2, "0")}/{String(features.length).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: "var(--color-primary)", opacity: 0.6 }}>
                  {isAr ? "حرّك لقلب البطاقة ←" : "Hover to flip →"}
                </span>
              </div>
            </div>
          </div>

          {/* ============ BACK ============ */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: backTransform,
              background: "var(--color-card)",
              border: "2px solid var(--color-primary)",
              boxShadow: "0 20px 60px rgba(var(--color-primary-rgb) / 0.15)",
            }}
          >

            {/* Top glow bar */}
            <div
              className="absolute top-0 inset-x-0 h-1 rounded-t-3xl"
              style={{
                background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
                boxShadow: "0 2px 20px rgba(var(--color-primary-rgb) / 0.3)",
              }}
            />

            {/* Decorative blurs */}
            <div className="absolute -top-20 -end-20 h-48 w-48 rounded-full pointer-events-none opacity-40"
              style={{ background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.08), transparent 70%)" }}
            />
            <div className="absolute -bottom-16 -start-16 h-40 w-40 rounded-full pointer-events-none opacity-30"
              style={{ background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.06), transparent 70%)" }}
            />

            {/* Content */}
            <div className="relative h-full flex flex-col p-6">
              {/* Header — hover: icon scales, text glows */}
              <div
                className="flex items-center gap-3.5 mb-4 rounded-2xl px-3 py-2.5 -mx-3 cursor-default"
                style={{ transition: "background 0.3s ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)";
                  const icon = e.currentTarget.querySelector<HTMLElement>("[data-back-icon]");
                  if (icon) icon.style.transform = "scale(1.1) rotate(5deg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  const icon = e.currentTarget.querySelector<HTMLElement>("[data-back-icon]");
                  if (icon) icon.style.transform = "scale(1) rotate(0deg)";
                }}
              >
                <div
                  data-back-icon
                  className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.7))",
                    boxShadow: "0 6px 20px rgba(var(--color-primary-rgb) / 0.3)",
                    transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease",
                  }}
                >
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[16px] font-extrabold tracking-tight">{t(feature.key)}</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="h-2.5 w-2.5" style={{
                        color: s < feature.rating ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.1)",
                        fill: s < feature.rating ? "var(--color-primary)" : "transparent",
                      }} />
                    ))}
                    <span className="text-[9px] text-foreground ms-1 font-medium">
                      {feature.reviews.toLocaleString()} {isAr ? "تقييم" : "reviews"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desc — hover: text brightens */}
              <p
                className="text-[12px] text-foreground leading-relaxed mb-3 rounded-xl px-2 py-1.5 -mx-2 cursor-default"
                style={{ transition: "color 0.3s ease, background 0.3s ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(var(--color-foreground-rgb, 0 0 0) / 0.7)";
                  e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {t(`${feature.key}Desc`)}
              </p>

              {/* Divider */}
              <div className="h-px mb-3" style={{ background: "linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.12), transparent)" }} />

              {/* Details list — each item has hover */}
              <div className="flex-1 space-y-1">
                {details.map((detail) => (
                  <div
                    key={detail}
                    className="flex items-start gap-3 rounded-xl px-2.5 py-1.5 -mx-1 cursor-default"
                    style={{ transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.05)";
                      e.currentTarget.style.transform = "translateX(4px)";
                      const check = e.currentTarget.querySelector<HTMLElement>("[data-check]");
                      if (check) {
                        check.style.background = "var(--color-primary)";
                        check.style.boxShadow = "0 2px 8px rgba(var(--color-primary-rgb) / 0.3)";
                        const svg = check.querySelector("svg");
                        if (svg) svg.style.color = "white";
                      }
                      const text = e.currentTarget.querySelector<HTMLElement>("[data-detail-text]");
                      if (text) text.style.color = "var(--foreground)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                      const check = e.currentTarget.querySelector<HTMLElement>("[data-check]");
                      if (check) {
                        check.style.background = "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.15), rgba(var(--color-primary-rgb) / 0.05))";
                        check.style.boxShadow = "none";
                        const svg = check.querySelector("svg");
                        if (svg) svg.style.color = "var(--color-primary)";
                      }
                      const text = e.currentTarget.querySelector<HTMLElement>("[data-detail-text]");
                      if (text) text.style.color = "";
                    }}
                  >
                    <div
                      data-check
                      className="h-5 w-5 rounded-lg flex items-center justify-center shrink-0 mt-px"
                      style={{
                        background: "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.15), rgba(var(--color-primary-rgb) / 0.05))",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <Check className="h-3 w-3" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} strokeWidth={3} />
                    </div>
                    <span data-detail-text className="text-[12px] text-foreground leading-snug" style={{ transition: "color 0.3s ease" }}>{detail}</span>
                  </div>
                ))}
              </div>

              {/* Stat row — hover: lifts and glows */}
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-2.5 mt-3 cursor-default"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.04)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.08)";
                  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.18)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(var(--color-primary-rgb) / 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)";
                  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span className="text-[20px] font-black" style={{ color: "var(--color-primary)" }}>{feature.stat}</span>
                <span className="text-[10px] text-foreground font-bold uppercase tracking-widest">
                  {isAr ? feature.statLabel.ar : feature.statLabel.en}
                </span>
                <div className="flex items-center gap-0.5 ms-auto">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-2.5 w-2.5" style={{
                      color: s < feature.rating ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.1)",
                      fill: s < feature.rating ? "var(--color-primary)" : "transparent",
                    }} />
                  ))}
                </div>
              </div>

              {/* CTA — opens modal */}
              <button
                className="group/cta w-full mt-3 h-11 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2.5 cursor-pointer relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))",
                  boxShadow: "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (cfg.showModal) setModalOpen(true);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 12px 36px rgba(var(--color-primary-rgb) / 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(var(--color-primary-rgb) / 0.3)";
                }}
              >
                {/* Shine */}
                <div
                  className="absolute inset-0 opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.2) 50%, transparent 65%)" }}
                />
                <span className="relative z-10">{isAr ? feature.ctaAr : feature.ctaEn}</span>
                <ArrowUpRight className="h-3.5 w-3.5 relative z-10 transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============ MODAL ============ */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t(feature.key)}>
        <div className="space-y-5">
          {/* Image */}
          <div className="relative h-40 rounded-xl overflow-hidden">
            <img src={feature.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 start-3 flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))",
                }}
              >
                <feature.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm drop-shadow-lg">{t(feature.key)}</span>
            </div>
            <div className="absolute bottom-3 end-3 backdrop-blur-md rounded-lg px-2.5 py-1"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span className="text-white font-black text-sm">{feature.stat}</span>
              <span className="text-white text-[8px] font-bold uppercase tracking-widest ms-1.5">
                {isAr ? feature.statLabel.ar : feature.statLabel.en}
              </span>
            </div>
          </div>

          {/* Rating + badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="h-4 w-4" style={{
                    color: s < feature.rating ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.1)",
                    fill: s < feature.rating ? "var(--color-primary)" : "transparent",
                  }} />
                ))}
              </div>
              <span className="text-[11px] text-foreground font-medium">
                {feature.rating}.0 ({feature.reviews.toLocaleString()} {isAr ? "تقييم" : "reviews"})
              </span>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{
                color: "var(--color-primary)",
                background: "rgba(var(--color-primary-rgb) / 0.08)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
              }}
            >
              {isAr ? feature.badge.ar : feature.badge.en}
            </span>
          </div>

          {/* Description */}
          <p className="text-[13px] text-foreground leading-relaxed">
            {t(`${feature.key}Desc`)}
          </p>

          {/* Divider */}
          <div className="h-px" style={{ background: "linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.12), transparent)" }} />

          {/* Full details — 2 column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {details.map((detail) => (
              <div
                key={detail}
                className="flex items-start gap-2.5 rounded-xl px-3 py-2"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.03)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.07)";
                  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)";
                  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-px"
                  style={{ background: "rgba(var(--color-primary-rgb) / 0.12)" }}
                >
                  <Check className="h-3 w-3" style={{ color: "var(--color-primary)" }} strokeWidth={3} />
                </div>
                <span className="text-[11.5px] text-foreground leading-snug">{detail}</span>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "rgba(var(--color-primary-rgb) / 0.04)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
            }}
          >
            <div className="flex gap-2.5">
              <Quote className="h-4 w-4 shrink-0 mt-0.5 opacity-40" style={{ color: "var(--color-primary)" }} />
              <div>
                <p className="text-[12px] text-foreground leading-relaxed italic">
                  &ldquo;{isAr ? feature.quoteAr : feature.quoteEn}&rdquo;
                </p>
                <p className="text-[11px] mt-1.5 font-semibold" style={{ color: "var(--color-primary)", opacity: 0.6 }}>
                  {isAr ? feature.quoterAr : feature.quoterEn}
                </p>
              </div>
            </div>
          </div>

          {/* CTA in modal */}
          <button
            onClick={() => setModalOpen(false)}
            className="w-full h-11 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group/mbtn"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))",
              boxShadow: "0 4px 18px rgba(var(--color-primary-rgb) / 0.3)",
              transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 28px rgba(var(--color-primary-rgb) / 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 18px rgba(var(--color-primary-rgb) / 0.3)";
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover/mbtn:opacity-100 transition-opacity duration-500"
              style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.2) 50%, transparent 65%)" }}
            />
            <span className="relative z-10">{isAr ? feature.ctaAr : feature.ctaEn}</span>
            <ArrowUpRight className="h-3.5 w-3.5 relative z-10" />
          </button>
        </div>
      </Modal>
    </>
  );
}

export function FeaturesSection() {
  const t = useTranslations("features");
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const { config } = useSiteConfig();
  const fc = config.features;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden section-lazy"
      style={{
        paddingBlock: "var(--section-y)",
        background: "rgba(var(--color-primary-rgb) / 0.015)",
      }}
    >
      {/* Soft edges */}
      <div className="absolute top-0 inset-x-0 h-12 pointer-events-none z-10"
        style={{ background: "linear-gradient(to bottom, var(--color-background), transparent)" }} />
      <div className="absolute bottom-0 inset-x-0 h-12 pointer-events-none z-10"
        style={{ background: "linear-gradient(to top, var(--color-background), transparent)" }} />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 70%)" }} />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: "linear-gradient(rgba(var(--color-primary-rgb) / 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.6) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }} />

      <Container>
        <SectionHeading title={isAr ? fc.titleAr : fc.titleEn} subtitle={isAr ? fc.subtitleAr : fc.subtitleEn} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {features.map((feature, i) => (
            <FlipCard key={feature.key} feature={feature} index={i} isInView={isInView} isAr={isAr} t={t} cfg={fc} />
          ))}
        </div>
      </Container>
    </section>
  );
}
