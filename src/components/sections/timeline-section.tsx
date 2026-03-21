"use client";

import { useLocale } from "next-intl";
import { useRef } from "react";
import { Container } from "@/components/shared/container";
import { motion, useInView } from "framer-motion";

const milestones = [
  {
    year: "2020",
    titleEn: "Company Founded",
    titleAr: "تأسيس الشركة",
    descEn: "Started with a small team of 3 passionate developers, driven by the vision to create exceptional digital experiences.",
    descAr: "بدأنا بفريق صغير من 3 مطورين شغوفين، مدفوعين برؤية إنشاء تجارب رقمية استثنائية.",
  },
  {
    year: "2021",
    titleEn: "First Major Client",
    titleAr: "أول عميل رئيسي",
    descEn: "Secured our first enterprise client and expanded the team to 15 members across development and design.",
    descAr: "حصلنا على أول عميل مؤسسي ووسعنا الفريق إلى 15 عضوًا في التطوير والتصميم.",
  },
  {
    year: "2022",
    titleEn: "Regional Expansion",
    titleAr: "التوسع الإقليمي",
    descEn: "Opened new offices and started serving clients across the Middle East with localized digital solutions.",
    descAr: "فتحنا مكاتب جديدة وبدأنا خدمة العملاء في جميع أنحاء الشرق الأوسط بحلول رقمية محلية.",
  },
  {
    year: "2024",
    titleEn: "200+ Projects Delivered",
    titleAr: "تسليم أكثر من 200 مشروع",
    descEn: "Reached the milestone of 200 successfully delivered projects with a 98% client satisfaction rate.",
    descAr: "وصلنا إلى إنجاز 200 مشروع تم تسليمه بنجاح مع معدل رضا عملاء 98%.",
  },
  {
    year: "2025",
    titleEn: "AI-Powered Solutions",
    titleAr: "حلول مدعومة بالذكاء الاصطناعي",
    descEn: "Launched our AI integration services, helping clients leverage cutting-edge technology for smarter digital products.",
    descAr: "أطلقنا خدمات تكامل الذكاء الاصطناعي، لمساعدة العملاء على الاستفادة من أحدث التقنيات لمنتجات رقمية أذكى.",
  },
];

export function TimelineSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden section-lazy"
      style={{ paddingBlock: "var(--section-y)" }}
    >
      <Container>
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8 md:mb-12">
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
              {isAr ? "رحلتنا" : "Our Journey"}
              <span className="h-px w-3" style={{ background: "var(--color-primary)" }} />
            </span>
            <h2 className="font-bold tracking-tight" style={{ fontSize: "var(--text-h2)" }}>
              {isAr ? "محطات بارزة في مسيرتنا" : "Key Milestones"}
            </h2>
          </motion.div>
        </div>

        {/* Timeline */}
        <div className="relative max-w-2xl mx-auto">
          {/* Vertical line */}
          <div
            className="absolute top-0 bottom-0 start-[19px] md:start-1/2 w-px -translate-x-1/2"
            style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
          />

          <div className="space-y-8">
            {milestones.map((milestone, i) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.45,
                  delay: 0.1 + i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative flex items-start gap-4 md:gap-0"
              >
                {/* Dot */}
                <div
                  className="relative z-10 shrink-0 h-10 w-10 rounded-full flex items-center justify-center md:absolute md:start-1/2 md:-translate-x-1/2"
                  style={{
                    background: "var(--color-card)",
                    border: "2px solid rgba(var(--color-primary-rgb) / 0.2)",
                  }}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: "var(--color-primary)" }}
                  />
                </div>

                {/* Content card */}
                <div
                  className={`flex-1 rounded-xl p-4 md:w-[calc(50%-2rem)] ${
                    i % 2 === 0 ? "md:me-auto md:pe-0 md:ms-0" : "md:ms-auto md:ps-0 md:me-0"
                  }`}
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  }}
                >
                  <span
                    className="text-[11px] font-bold tracking-wider"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {milestone.year}
                  </span>
                  <h3 className="text-[14px] font-semibold mt-1 mb-1.5">
                    {isAr ? milestone.titleAr : milestone.titleEn}
                  </h3>
                  <p className="text-[12px] text-foreground leading-relaxed">
                    {isAr ? milestone.descAr : milestone.descEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
