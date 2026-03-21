"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, Clock, Flame } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useSiteConfig } from "@/providers/site-config-provider";

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calc());
    const timer = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

export function CtaSection() {
  const t = useTranslations("cta");
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const isAr = locale === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const { config } = useSiteConfig();
  const cc = config.cta;

  // Countdown target: 7 days from now (resets on page load for demo)
  const [targetDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const { days, hours, minutes, seconds } = useCountdown(targetDate);

  const timeBlocks = [
    { value: days, labelEn: "Days", labelAr: "يوم" },
    { value: hours, labelEn: "Hours", labelAr: "ساعة" },
    { value: minutes, labelEn: "Min", labelAr: "دقيقة" },
    { value: seconds, labelEn: "Sec", labelAr: "ثانية" },
  ];

  return (
    <section
      className="relative section-lazy"
      ref={sectionRef}
      style={{ paddingBlock: "var(--section-y)" }}
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden relative"
          style={{
            border: "2px solid rgba(var(--color-primary-rgb) / 0.15)",
            background: "var(--color-card)",
          }}
        >
          {/* Top accent */}
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.3), var(--color-primary))" }} />

          <div className="px-6 md:px-10 py-8 md:py-10">
            {/* Badge */}
            {cc.showBadge && (
            <div className="flex items-center justify-center mb-5">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                style={{
                  color: "var(--color-primary)",
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                }}
              >
                <Flame className="h-3 w-3" />
                {isAr ? cc.badgeAr : cc.badgeEn}
              </span>
            </div>
            )}

            {/* Title */}
            <h2 className="text-center font-bold tracking-tight mb-2" style={{ fontSize: "var(--text-h2)" }}>
              {isAr ? cc.titleAr : cc.titleEn}
            </h2>
            <p className="text-center text-[13px] text-foreground mb-8 max-w-md mx-auto" style={{ opacity: 0.5 }}>
              {isAr ? cc.descAr : cc.descEn}
            </p>

            {/* Countdown */}
            {cc.showCountdown && (
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-8">
              {timeBlocks.map((block, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="relative h-16 w-16 md:h-20 md:w-20 rounded-xl flex items-center justify-center"
                    style={{
                      border: "2px solid rgba(var(--color-primary-rgb) / 0.15)",
                      background: "rgba(var(--color-primary-rgb) / 0.03)",
                    }}
                  >
                    <span
                      className="text-2xl md:text-3xl font-extrabold tabular-nums"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {String(block.value).padStart(2, "0")}
                    </span>
                    {/* Flip line */}
                    <div
                      className="absolute inset-x-2 top-1/2 h-px"
                      style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}
                    />
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider mt-1.5" style={{ opacity: 0.4 }}>
                    {isAr ? block.labelAr : block.labelEn}
                  </span>
                  {/* Separator dots */}
                  {i < timeBlocks.length - 1 && (
                    <div className="absolute" style={{ display: "none" }} />
                  )}
                </div>
              ))}
            </div>
            )}

            {/* Colon separators between blocks */}
            <div className="hidden" aria-hidden />

            {/* CTA Button */}
            <div className="flex justify-center mb-6">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-[13px] font-bold text-white cursor-pointer"
                style={{
                  background: "var(--color-primary)",
                  boxShadow: "0 4px 16px rgba(var(--color-primary-rgb) / 0.25)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(var(--color-primary-rgb) / 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(var(--color-primary-rgb) / 0.25)";
                }}
              >
                {isAr ? cc.buttonAr : cc.buttonEn}
                <Arrow className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Bottom info */}
            {cc.showBottomInfo && (
            <div
              className="flex items-center justify-center gap-4 pt-5"
              style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}
            >
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                <span className="text-[10px] font-medium" style={{ opacity: 0.5 }}>
                  {isAr ? "ينتهي قريباً" : "Offer ends soon"}
                </span>
              </div>
              <div className="h-3 w-px" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
              <span className="text-[10px] font-medium" style={{ opacity: 0.5 }}>
                {isAr ? "لا يحتاج كود" : "No code needed"}
              </span>
              <div className="h-3 w-px" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
              <span className="text-[10px] font-medium" style={{ opacity: 0.5 }}>
                {isAr ? "جميع الخدمات" : "All services included"}
              </span>
            </div>
            )}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
