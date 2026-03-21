"use client";

import { useLocale } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { Container } from "@/components/shared/container";
import { Users, Briefcase, Clock, Server, Star, Zap, Globe, Award, ChevronUp, ChevronDown, Heart, Coffee, Code, Rocket } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useSiteConfig } from "@/providers/site-config-provider";

const countedValues = new Set<string>();

function AnimatedCounter({ value, suffix, id }: { value: number; suffix: string; id: string }) {
  const [count, setCount] = useState(countedValues.has(id) ? value : 0);

  useEffect(() => {
    if (countedValues.has(id)) { setCount(value); return; }
    countedValues.add(id);
    let start = 0;
    const end = value;
    if (end === 0) return;
    const inc = end / (1200 / 16);
    const timer = setInterval(() => {
      start += inc;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, id]);

  return <span>{count}{suffix}</span>;
}

const statRows = [
  [
    { icon: Users, value: 500, suffix: "+", labelEn: "Happy Clients", labelAr: "عميل سعيد", descEn: "Trusted worldwide", descAr: "موثوق عالمياً" },
    { icon: Briefcase, value: 200, suffix: "+", labelEn: "Projects Completed", labelAr: "مشروع مكتمل", descEn: "Successfully delivered", descAr: "تم التسليم بنجاح" },
    { icon: Clock, value: 15, suffix: "+", labelEn: "Years Experience", labelAr: "سنة خبرة", descEn: "Industry expertise", descAr: "خبرة في المجال" },
    { icon: Server, value: 99.9, suffix: "%", labelEn: "Uptime Guaranteed", labelAr: "ضمان التشغيل", descEn: "Reliable infrastructure", descAr: "بنية تحتية موثوقة" },
  ],
  [
    { icon: Star, value: 50, suffix: "+", labelEn: "Awards Won", labelAr: "جائزة", descEn: "Industry recognition", descAr: "تقدير المجال" },
    { icon: Globe, value: 30, suffix: "+", labelEn: "Countries Served", labelAr: "دولة", descEn: "Global presence", descAr: "حضور عالمي" },
    { icon: Zap, value: 99, suffix: "%", labelEn: "Client Satisfaction", labelAr: "رضا العملاء", descEn: "5-star rated", descAr: "تقييم 5 نجوم" },
    { icon: Award, value: 40, suffix: "+", labelEn: "Team Members", labelAr: "عضو فريق", descEn: "Expert professionals", descAr: "محترفون خبراء" },
  ],
  [
    { icon: Code, value: 10, suffix: "M+", labelEn: "Lines of Code", labelAr: "سطر برمجي", descEn: "Clean & scalable", descAr: "نظيف وقابل للتوسع" },
    { icon: Coffee, value: 1200, suffix: "+", labelEn: "Cups of Coffee", labelAr: "كوب قهوة", descEn: "Fueling innovation", descAr: "وقود الابتكار" },
    { icon: Heart, value: 98, suffix: "%", labelEn: "Retention Rate", labelAr: "معدل الاحتفاظ", descEn: "Clients stay with us", descAr: "العملاء يبقون معنا" },
    { icon: Rocket, value: 150, suffix: "+", labelEn: "Products Launched", labelAr: "منتج أُطلق", descEn: "From idea to market", descAr: "من الفكرة للسوق" },
  ],
];

export function StatsSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [activeRow, setActiveRow] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = down, -1 = up
  const { config } = useSiteConfig();
  const stc = config.stats;

  const goNext = () => {
    setDirection(1);
    setActiveRow((prev) => (prev + 1) % statRows.length);
  };

  const goPrev = () => {
    setDirection(-1);
    setActiveRow((prev) => (prev - 1 + statRows.length) % statRows.length);
  };

  useEffect(() => {
    if (!isInView || !stc.autoPlay) return;
    const timer = setInterval(goNext, stc.interval);
    return () => clearInterval(timer);
  }, [isInView, stc.autoPlay, stc.interval]);

  const currentStats = statRows[activeRow];

  return (
    <section
      ref={sectionRef}
      className="relative section-lazy"
      style={{ paddingBlock: "var(--section-y)" }}
    >
      <Container>
        <div className="flex flex-col items-center gap-2">
        {/* Up arrow */}
        <button
          onClick={goPrev}
          className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{
            border: "1.5px solid rgba(var(--color-primary-rgb) / 0.15)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
            e.currentTarget.style.borderColor = "var(--color-primary)";
            const svg = e.currentTarget.querySelector("svg");
            if (svg) (svg as unknown as HTMLElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
            const svg = e.currentTarget.querySelector("svg");
            if (svg) (svg as unknown as HTMLElement).style.color = "var(--color-primary)";
          }}
        >
          <ChevronUp className="h-4 w-4" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} />
        </button>

        <div
          className="rounded-2xl overflow-hidden relative w-full"
          style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.12)" }}
        >
          <motion.div
            key={activeRow}
            initial={{ opacity: 0, y: direction * 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 md:grid-cols-4"
          >
            {currentStats.map((stat, i) => (
              <div
                key={stat.labelEn}
                className="group relative text-center py-5 px-3 cursor-default"
                style={{
                  background: "var(--color-card)",
                  borderInlineEnd: i < currentStats.length - 1 ? "1px solid rgba(var(--color-primary-rgb) / 0.08)" : "none",
                  transition: "background 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-card)";
                }}
              >
                {/* Icon */}
                <div
                  className="h-7 w-7 rounded-md flex items-center justify-center mx-auto mb-2"
                  style={{
                    border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)",
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
                      el.style.background = "transparent";
                      el.style.borderColor = "rgba(var(--color-primary-rgb) / 0.12)";
                      const svg = el.querySelector("svg");
                      if (svg) (svg as unknown as HTMLElement).style.color = "var(--color-primary)";
                    };
                    card.addEventListener("mouseenter", enter);
                    card.addEventListener("mouseleave", leave);
                  }}
                >
                  <stat.icon className="h-3.5 w-3.5" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} />
                </div>

                {/* Counter */}
                <div
                  className="text-xl md:text-2xl font-extrabold tracking-tight mb-0.5"
                  style={{ color: "var(--color-primary)" }}
                >
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} id={stat.labelEn} />
                </div>

                {/* Label */}
                <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5">
                  {isAr ? stat.labelAr : stat.labelEn}
                </div>

                {/* Description */}
                <div className="text-[9px] text-foreground" style={{ opacity: 0.4 }}>
                  {isAr ? stat.descAr : stat.descEn}
                </div>

                {/* Bottom accent on hover */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-2/3 rounded-full"
                  style={{
                    background: "var(--color-primary)",
                    transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            ))}
          </motion.div>

          {/* Row indicators */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {statRows.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveRow(i)}
                className="h-1 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  width: activeRow === i ? "16px" : "6px",
                  background: activeRow === i ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.2)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Down arrow */}
        <button
          onClick={goNext}
          className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{
            border: "1.5px solid rgba(var(--color-primary-rgb) / 0.15)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
            e.currentTarget.style.borderColor = "var(--color-primary)";
            const svg = e.currentTarget.querySelector("svg");
            if (svg) (svg as unknown as HTMLElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
            const svg = e.currentTarget.querySelector("svg");
            if (svg) (svg as unknown as HTMLElement).style.color = "var(--color-primary)";
          }}
        >
          <ChevronDown className="h-4 w-4" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} />
        </button>
        </div>
      </Container>
    </section>
  );
}
