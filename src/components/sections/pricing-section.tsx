"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRef, useState } from "react";
import { Container } from "@/components/shared/container";
import { Check } from "lucide-react";
import { motion, useInView } from "framer-motion";

const plans = [
  {
    key: "basic",
    nameEn: "Basic",
    nameAr: "أساسي",
    priceMonthly: 29,
    priceYearly: 290,
    popular: false,
    featuresEn: [
      "5 pages website",
      "Basic SEO setup",
      "Mobile responsive",
      "Contact form",
    ],
    featuresAr: [
      "موقع 5 صفحات",
      "إعداد SEO أساسي",
      "متجاوب مع الهاتف",
      "نموذج تواصل",
    ],
  },
  {
    key: "pro",
    nameEn: "Pro",
    nameAr: "احترافي",
    priceMonthly: 79,
    priceYearly: 790,
    popular: true,
    featuresEn: [
      "15 pages website",
      "Advanced SEO & analytics",
      "CMS integration",
      "Priority support",
      "Custom animations",
      "Performance optimization",
    ],
    featuresAr: [
      "موقع 15 صفحة",
      "SEO وتحليلات متقدمة",
      "تكامل نظام إدارة المحتوى",
      "دعم ذو أولوية",
      "رسوم متحركة مخصصة",
      "تحسين الأداء",
    ],
  },
  {
    key: "enterprise",
    nameEn: "Enterprise",
    nameAr: "مؤسسي",
    priceMonthly: 149,
    priceYearly: 1490,
    popular: false,
    featuresEn: [
      "Unlimited pages",
      "Full-stack development",
      "Dedicated account manager",
      "24/7 priority support",
      "Custom integrations",
      "SLA guarantee",
    ],
    featuresAr: [
      "صفحات غير محدودة",
      "تطوير متكامل",
      "مدير حساب مخصص",
      "دعم على مدار الساعة",
      "تكاملات مخصصة",
      "ضمان اتفاقية الخدمة",
    ],
  },
];

export function PricingSection() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden section-lazy"
      style={{ paddingBlock: "var(--section-y)" }}
    >
      <Container>
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8 md:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              <span className="h-px w-3" style={{ background: "var(--color-primary)" }} />
              {t("subtitle")}
              <span className="h-px w-3" style={{ background: "var(--color-primary)" }} />
            </span>
            <h2 className="font-bold tracking-tight" style={{ fontSize: "var(--text-h2)" }}>
              {t("title")}
            </h2>
            <p className="mt-2 text-[13px] text-foreground leading-relaxed">
              {t("description")}
            </p>
          </motion.div>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-5 inline-flex items-center gap-3 rounded-full px-1 py-1"
            style={{
              background: "rgba(var(--color-primary-rgb) / 0.04)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
            }}
          >
            <button
              onClick={() => setIsYearly(false)}
              className="px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200"
              style={
                !isYearly
                  ? { background: "var(--color-primary)", color: "white" }
                  : { color: "var(--color-foreground)", opacity: 1 }
              }
            >
              {t("monthly")}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className="px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200"
              style={
                isYearly
                  ? { background: "var(--color-primary)", color: "white" }
                  : { color: "var(--color-foreground)", opacity: 1 }
              }
            >
              {t("yearly")}
            </button>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.45,
                delay: 0.1 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative rounded-xl overflow-hidden"
              style={{
                border: plan.popular
                  ? "1.5px solid rgba(var(--color-primary-rgb) / 0.3)"
                  : "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                background: "var(--color-card)",
                boxShadow: plan.popular
                  ? "0 8px 32px rgba(var(--color-primary-rgb) / 0.1)"
                  : "none",
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div
                  className="text-center py-1.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: "var(--color-primary)" }}
                >
                  {t("popular")}
                </div>
              )}

              <div className="p-5">
                <h3 className="text-[15px] font-semibold mb-1">
                  {isAr ? plan.nameAr : plan.nameEn}
                </h3>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold tracking-tight">
                    ${isYearly ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  <span className="text-[12px] text-foreground">
                    {isYearly ? t("perYear") : t("perMonth")}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-5">
                  {(isAr ? plan.featuresAr : plan.featuresEn).map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-[12px] text-foreground"
                    >
                      <Check
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: "var(--color-primary)" }}
                      />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  className="w-full h-9 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer"
                  style={
                    plan.popular
                      ? {
                          background: "var(--color-primary)",
                          color: "white",
                          boxShadow:
                            "0 2px 8px rgba(var(--color-primary-rgb) / 0.2)",
                        }
                      : {
                          border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                          color: "var(--color-primary)",
                          background: "transparent",
                        }
                  }
                >
                  {plan.key === "enterprise" ? t("contactSales") : t("getStarted")}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
