"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRef, useState } from "react";
import { Container } from "@/components/shared/container";
import { Modal } from "@/components/shared/modal";
import { Link } from "@/i18n/navigation";
import { Code, Smartphone, Figma, Megaphone, PenTool, MessageSquare, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useSiteConfig } from "@/providers/site-config-provider";

const services = [
  {
    key: "webDev", icon: Code,
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop",
    category: { en: "Development", ar: "تطوير" },
    featuresEn: ["Custom web applications", "E-commerce platforms", "Progressive Web Apps", "API development"],
    featuresAr: ["تطبيقات ويب مخصصة", "منصات تجارة إلكترونية", "تطبيقات ويب تقدمية", "تطوير API"],
  },
  {
    key: "mobileDev", icon: Smartphone,
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop",
    category: { en: "Mobile", ar: "الجوال" },
    featuresEn: ["iOS & Android apps", "Cross-platform development", "App store optimization", "Push notifications"],
    featuresAr: ["تطبيقات iOS و Android", "تطوير متعدد المنصات", "تحسين متاجر التطبيقات", "إشعارات فورية"],
  },
  {
    key: "uiux", icon: Figma,
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop",
    category: { en: "Design", ar: "تصميم" },
    featuresEn: ["User research", "Wireframing & prototyping", "Visual design systems", "Usability testing"],
    featuresAr: ["بحث المستخدمين", "التخطيط والنماذج الأولية", "أنظمة التصميم البصري", "اختبار قابلية الاستخدام"],
  },
  {
    key: "marketing", icon: Megaphone,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    category: { en: "Marketing", ar: "تسويق" },
    featuresEn: ["SEO optimization", "Social media management", "Content strategy", "Analytics & reporting"],
    featuresAr: ["تحسين محركات البحث", "إدارة وسائل التواصل", "استراتيجية المحتوى", "التحليلات والتقارير"],
  },
  {
    key: "branding", icon: PenTool,
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop",
    category: { en: "Branding", ar: "العلامة التجارية" },
    featuresEn: ["Logo design", "Brand guidelines", "Visual identity", "Print & digital assets"],
    featuresAr: ["تصميم الشعار", "دليل العلامة التجارية", "الهوية البصرية", "أصول مطبوعة ورقمية"],
  },
  {
    key: "consulting", icon: MessageSquare,
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=250&fit=crop",
    category: { en: "Strategy", ar: "استراتيجية" },
    featuresEn: ["Tech strategy", "Architecture review", "Team mentoring", "Process optimization"],
    featuresAr: ["استراتيجية تقنية", "مراجعة البنية", "تدريب الفرق", "تحسين العمليات"],
  },
];

export function ServicesSection() {
  const t = useTranslations("services");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [modalService, setModalService] = useState<typeof services[0] | null>(null);
  const { config } = useSiteConfig();
  const sc = config.services;

  return (
    <section
      ref={sectionRef}
      className="relative section-lazy"
      style={{ paddingBlock: "var(--section-y)" }}
    >
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--color-primary)" }}>
            {isAr ? sc.subtitleAr : sc.subtitleEn}
          </p>
          <h2 className="font-bold tracking-tight" style={{ fontSize: "var(--text-h2)" }}>{isAr ? sc.titleAr : sc.titleEn}</h2>
        </motion.div>

        {/* Compact grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((service, i) => (
            <motion.div
              key={service.key}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
              className="group cursor-pointer rounded-xl overflow-hidden"
              style={{
                border: "2px solid rgba(var(--color-primary-rgb) / 0.25)",
                background: "var(--color-card)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onClick={() => setModalService(service)}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--color-primary)";
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 12px 32px rgba(var(--color-primary-rgb) / 0.12)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "rgba(var(--color-primary-rgb) / 0.25)";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              }}
            >
              {/* Thumbnail */}
              {sc.showImages && (
              <div className="relative h-56 overflow-hidden -mx-[2px] -mt-[2px] rounded-t-xl">
                <img
                  src={service.image}
                  alt={t(service.key)}
                  className="w-full h-full object-cover"
                  style={{ transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-10"
                  style={{ background: "linear-gradient(to top, var(--color-card), transparent)" }}
                />
              </div>
              )}

              <div className="p-4 pt-2">
                {/* Icon + category + number row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.06)",
                        border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
                        transition: "all 0.3s ease",
                      }}
                      ref={(el) => {
                        if (!el) return;
                        const card = el.closest(".group");
                        if (!card) return;
                        const enter = () => {
                          el.style.background = "var(--color-primary)";
                          el.style.borderColor = "var(--color-primary)";
                          const svg = el.querySelector("svg");
                          if (svg) (svg as unknown as HTMLElement).style.color = "white";
                        };
                        const leave = () => {
                          el.style.background = "rgba(var(--color-primary-rgb) / 0.06)";
                          el.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)";
                          const svg = el.querySelector("svg");
                          if (svg) (svg as unknown as HTMLElement).style.color = "var(--color-primary)";
                        };
                        card.addEventListener("mouseenter", enter);
                        card.addEventListener("mouseleave", leave);
                      }}
                    >
                      <service.icon className="h-4.5 w-4.5" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} />
                    </div>
                    {sc.showCategories && (
                    <span
                      className="text-[9px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-md hidden sm:inline"
                      style={{
                        color: "var(--color-primary)",
                        background: "rgba(var(--color-primary-rgb) / 0.05)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                      }}
                    >
                      {isAr ? service.category.ar : service.category.en}
                    </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium" style={{ opacity: 0.2 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-[14px] font-bold tracking-tight mb-1">{t(service.key)}</h3>

                {/* Description */}
                <p className="text-[11px] text-foreground leading-relaxed line-clamp-2 mb-3" style={{ opacity: 0.5 }}>
                  {t(`${service.key}Desc`)}
                </p>

                {/* Feature highlights */}
                {sc.showFeatureList && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(isAr ? service.featuresAr : service.featuresEn).slice(0, 2).map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-md"
                      style={{
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                      }}
                    >
                      <Check className="h-2.5 w-2.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                      {f}
                    </span>
                  ))}
                </div>
                )}

                {/* Learn more button */}
                <div
                  className="pt-3 mt-1"
                  style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
                >
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                    style={{
                      color: "var(--color-primary)",
                      border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                      transition: "all 0.3s ease",
                    }}
                    ref={(el) => {
                      if (!el) return;
                      const card = el.closest(".group");
                      if (!card) return;
                      const enter = () => {
                        el.style.background = "var(--color-primary)";
                        el.style.color = "white";
                        el.style.borderColor = "var(--color-primary)";
                      };
                      const leave = () => {
                        el.style.background = "transparent";
                        el.style.color = "var(--color-primary)";
                        el.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
                      };
                      card.addEventListener("mouseenter", enter);
                      card.addEventListener("mouseleave", leave);
                    }}
                  >
                    {isAr ? "المزيد" : "Learn more"}
                    <Arrow className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all */}
        {sc.showViewAll && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-8"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-[12px] font-semibold px-5 py-2 rounded-full cursor-pointer group"
            style={{
              color: "var(--color-primary)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.color = "white";
              e.currentTarget.style.borderColor = "var(--color-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-primary)";
              e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
            }}
          >
            {tc("viewAll")}
            <Arrow className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </motion.div>
        )}
      </Container>

      {/* Modal */}
      <Modal open={!!modalService} onClose={() => setModalService(null)} title={modalService ? t(modalService.key) : ""}>
        {modalService && (
          <div className="space-y-3">
            <p className="text-[13px] text-foreground leading-relaxed">{t(`${modalService.key}Desc`)}</p>
            <div className="space-y-1">
              {(isAr ? modalService.featuresAr : modalService.featuresEn).map((f) => (
                <div key={f} className="flex items-center gap-2 py-1.5">
                  <Check className="h-3 w-3 shrink-0" style={{ color: "var(--color-primary)" }} />
                  <span className="text-[12px]">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/services"
              className="w-full h-8 rounded-lg text-[12px] font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
              style={{ background: "var(--color-primary)" }}
            >
              {isAr ? "عرض جميع الخدمات" : "View All Services"}
              <Arrow className="h-3 w-3" />
            </Link>
          </div>
        )}
      </Modal>
    </section>
  );
}
