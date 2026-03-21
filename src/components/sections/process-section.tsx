"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { MessageSquare, Lightbulb, Code, Rocket, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useSiteConfig } from "@/providers/site-config-provider";

const steps = [
  {
    icon: MessageSquare,
    titleEn: "Discovery",
    titleAr: "الاكتشاف",
    descEn: "We dive deep into your vision, goals, and challenges to craft the perfect strategy.",
    descAr: "نتعمق في رؤيتك وأهدافك وتحدياتك لصياغة الاستراتيجية المثالية.",
    detailsEn: ["Stakeholder interviews", "Market analysis", "Goal definition", "Roadmap planning"],
    detailsAr: ["مقابلات أصحاب المصلحة", "تحليل السوق", "تحديد الأهداف", "تخطيط خارطة الطريق"],
  },
  {
    icon: Lightbulb,
    titleEn: "Design",
    titleAr: "التصميم",
    descEn: "Transforming ideas into stunning visual experiences with pixel-perfect precision.",
    descAr: "تحويل الأفكار إلى تجارب بصرية مذهلة بدقة متناهية.",
    detailsEn: ["Wireframing", "UI/UX design", "Prototyping", "Design system"],
    detailsAr: ["التخطيط الأولي", "تصميم الواجهات", "النماذج الأولية", "نظام التصميم"],
  },
  {
    icon: Code,
    titleEn: "Develop",
    titleAr: "التطوير",
    descEn: "Building robust, scalable solutions with cutting-edge technologies.",
    descAr: "بناء حلول قوية وقابلة للتوسع بأحدث التقنيات.",
    detailsEn: ["Clean architecture", "Performance tuning", "Testing & QA", "Security audit"],
    detailsAr: ["هندسة نظيفة", "تحسين الأداء", "الاختبار والجودة", "تدقيق أمني"],
  },
  {
    icon: Rocket,
    titleEn: "Launch",
    titleAr: "الإطلاق",
    descEn: "Deploying your project with confidence and ongoing support for growth.",
    descAr: "إطلاق مشروعك بثقة مع دعم مستمر للنمو.",
    detailsEn: ["Deployment", "Monitoring", "Analytics setup", "Ongoing support"],
    detailsAr: ["النشر", "المراقبة", "إعداد التحليلات", "الدعم المستمر"],
  },
];

export function ProcessSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const { config } = useSiteConfig();
  const pc = config.process;

  return (
    <section
      ref={sectionRef}
      className="relative section-lazy overflow-hidden"
      style={{ paddingBlock: "var(--section-y)" }}
    >
      {/* Layered background */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 70%)`,
          }}
        />
        {/* Bottom gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 100%, rgba(var(--color-primary-rgb) / 0.04) 0%, transparent 60%)`,
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(var(--color-primary-rgb) / 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.5) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4"
            style={{
              color: "var(--color-primary)",
              background: "rgba(var(--color-primary-rgb) / 0.06)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
              boxShadow: "0 0 20px rgba(var(--color-primary-rgb) / 0.05)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 0 6px var(--color-primary)",
              }}
            />
            {isAr ? pc.badgeAr : pc.badgeEn}
          </motion.span>

          <h2 className="font-bold tracking-tight mb-3" style={{ fontSize: "var(--text-h2)" }}>
            {isAr ? pc.titleAr : pc.titleEn}
          </h2>
          <p className="text-[13px] max-w-md mx-auto" style={{ opacity: 0.45 }}>
            {isAr ? pc.subtitleAr : pc.subtitleEn}
          </p>
        </motion.div>

        {/* Process cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Connection line — desktop */}
          {pc.showConnectors && (
          <div
            className="hidden md:block absolute top-[52px] left-[12%] right-[12%] h-px z-0"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.15), rgba(var(--color-primary-rgb) / 0.15), transparent)`,
            }}
          />
          )}

          {steps.map((step, i) => {
            const isActive = activeCard === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.15 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative z-10 group"
                onMouseEnter={() => setActiveCard(i)}
                onMouseLeave={() => setActiveCard(null)}
              >
                <div
                  className="relative rounded-2xl p-5 cursor-default overflow-hidden h-full"
                  style={{
                    background: "var(--color-card)",
                    border: isActive
                      ? "2px solid var(--color-primary)"
                      : "2px solid rgba(var(--color-primary-rgb) / 0.08)",
                    boxShadow: isActive
                      ? "0 20px 50px rgba(var(--color-primary-rgb) / 0.12), 0 0 30px rgba(var(--color-primary-rgb) / 0.05)"
                      : "0 2px 8px rgba(0,0,0,0.03)",
                    transform: isActive ? "translateY(-6px)" : "translateY(0)",
                    transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {/* Spotlight hover glow */}
                  <div
                    className="absolute -top-20 -end-20 w-40 h-40 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, rgba(var(--color-primary-rgb) / ${isActive ? "0.08" : "0"}) 0%, transparent 70%)`,
                      transition: "all 0.5s ease",
                    }}
                  />

                  {/* Top accent line */}
                  <div
                    className="absolute top-0 inset-x-0 h-[2px]"
                    style={{
                      background: isActive
                        ? "linear-gradient(90deg, transparent, var(--color-primary), transparent)"
                        : "transparent",
                      transition: "background 0.5s ease",
                    }}
                  />

                  {/* Step number + icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="relative h-11 w-11 rounded-xl flex items-center justify-center"
                      style={{
                        background: isActive
                          ? "var(--color-primary)"
                          : "rgba(var(--color-primary-rgb) / 0.06)",
                        border: isActive
                          ? "2px solid var(--color-primary)"
                          : "2px solid rgba(var(--color-primary-rgb) / 0.1)",
                        boxShadow: isActive ? "0 0 20px rgba(var(--color-primary-rgb) / 0.2)" : "none",
                        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      <step.icon
                        className="h-5 w-5"
                        style={{
                          color: isActive ? "white" : "var(--color-primary)",
                          transition: "color 0.3s ease",
                        }}
                      />
                    </div>
                    <span
                      className="text-[32px] font-black tabular-nums leading-none"
                      style={{
                        color: isActive ? "var(--color-primary)" : "transparent",
                        WebkitTextStroke: isActive
                          ? "none"
                          : "1px rgba(var(--color-primary-rgb) / 0.12)",
                        transition: "all 0.4s ease",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[16px] font-bold tracking-tight mb-1.5">
                    {isAr ? step.titleAr : step.titleEn}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] leading-relaxed mb-4" style={{ opacity: 0.45 }}>
                    {isAr ? step.descAr : step.descEn}
                  </p>

                  {/* Detail items — reveal on hover */}
                  {pc.showDetails && (
                  <div
                    className="space-y-1.5 overflow-hidden"
                    style={{
                      maxHeight: isActive ? "200px" : "0",
                      opacity: isActive ? 1 : 0,
                      transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <div
                      className="pt-3 mb-2"
                      style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
                    />
                    {(isAr ? step.detailsAr : step.detailsEn).map((detail, j) => (
                      <motion.div
                        key={j}
                        className="flex items-center gap-2 px-2 py-1 rounded-md"
                        style={{
                          background: "rgba(var(--color-primary-rgb) / 0.03)",
                          border: "1px solid rgba(var(--color-primary-rgb) / 0.05)",
                        }}
                      >
                        <div
                          className="h-1 w-1 rounded-full shrink-0"
                          style={{ background: "var(--color-primary)" }}
                        />
                        <span className="text-[10px] font-medium">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                  )}

                  {/* Arrow connector — desktop only, not on last */}
                  {pc.showConnectors && i < steps.length - 1 && (
                    <div className="hidden md:block absolute -end-5 top-[52px] z-20">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center"
                        style={{
                          background: "var(--color-card)",
                          border: "2px solid rgba(var(--color-primary-rgb) / 0.12)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }}
                      >
                        <Arrow className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        {pc.showBottomCta && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex justify-center mt-10"
        >
          <div
            className="inline-flex items-center gap-6 px-6 py-3 rounded-full"
            style={{
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
              background: "rgba(var(--color-primary-rgb) / 0.02)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  background: "var(--color-primary)",
                  boxShadow: "0 0 8px var(--color-primary)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <span className="text-[11px] font-medium" style={{ opacity: 0.6 }}>
                {isAr ? "متوسط وقت التسليم: 4-8 أسابيع" : "Avg. delivery: 4-8 weeks"}
              </span>
            </div>
            <div className="h-4 w-px" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
            <span className="text-[11px] font-bold" style={{ color: "var(--color-primary)" }}>
              {isAr ? "ابدأ مشروعك" : "Start your project"} →
            </span>
          </div>
        </motion.div>
        )}
      </Container>
    </section>
  );
}
