"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { Modal } from "@/components/shared/modal";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSiteConfig } from "@/providers/site-config-provider";

const testimonials = [
  {
    name: "أحمد الراشدي", nameEn: "Ahmed Al-Rashdi",
    role: "مدير تنفيذي", roleEn: "CEO",
    company: "TechVentures", companyAr: "تك فنتشرز",
    content: "تجربة استثنائية في العمل مع هذا الفريق. جودة العمل والاحترافية في التنفيذ كانت مبهرة. أنصح بشدة!",
    contentEn: "An exceptional experience working with this team. The quality and professionalism were impressive. Highly recommended!",
    fullContentAr: "تجربة استثنائية في العمل مع هذا الفريق. جودة العمل والاحترافية في التنفيذ كانت مبهرة. من البداية، أظهروا فهمًا عميقًا لاحتياجاتنا وقدموا حلولًا مبتكرة تجاوزت توقعاتنا.",
    fullContentEn: "An exceptional experience working with this team. The quality and professionalism were impressive. From the start, they showed a deep understanding of our needs and delivered innovative solutions that exceeded our expectations.",
    rating: 5,
    avatar: "https://picsum.photos/seed/avatar1/100/100",
  },
  {
    name: "سارة المنصور", nameEn: "Sara Al-Mansour",
    role: "مديرة تسويق", roleEn: "Marketing Director",
    company: "GrowthHub", companyAr: "جروث هب",
    content: "فريق متميز وخدمة ممتازة. ساعدونا في تحسين تواجدنا الرقمي بشكل كبير وزادت مبيعاتنا بنسبة 150%.",
    contentEn: "Outstanding team and excellent service. They helped improve our digital presence significantly, increasing sales by 150%.",
    fullContentAr: "فريق متميز وخدمة ممتازة. ساعدونا في تحسين تواجدنا الرقمي بشكل كبير وزادت مبيعاتنا بنسبة 150%. الاستراتيجية التسويقية التي وضعوها كانت دقيقة ومبنية على بيانات حقيقية.",
    fullContentEn: "Outstanding team and excellent service. They helped improve our digital presence significantly, increasing sales by 150%. The marketing strategy they developed was precise and data-driven.",
    rating: 5,
    avatar: "https://picsum.photos/seed/avatar2/100/100",
  },
  {
    name: "خالد العتيبي", nameEn: "Khaled Al-Otaibi",
    role: "رائد أعمال", roleEn: "Entrepreneur",
    company: "StartupX", companyAr: "ستارتب إكس",
    content: "من أفضل الفرق التي تعاملت معها. التزام تام بالمواعيد والجودة. المشروع تم تسليمه قبل الموعد المحدد!",
    contentEn: "One of the best teams I've worked with. Full commitment to deadlines and quality. The project was delivered early!",
    fullContentAr: "من أفضل الفرق التي تعاملت معها. التزام تام بالمواعيد والجودة. المشروع تم تسليمه قبل الموعد المحدد! الفريق يتميز بالمرونة والقدرة على التكيف مع المتطلبات المتغيرة.",
    fullContentEn: "One of the best teams I've worked with. Full commitment to deadlines and quality. The project was delivered early! The team stands out for its flexibility and ability to adapt to changing requirements.",
    rating: 5,
    avatar: "https://picsum.photos/seed/avatar3/100/100",
  },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 400 : -400, opacity: 0, scale: 0.9 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 400 : -400, opacity: 0, scale: 0.9 }),
};

export function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [modalTestimonial, setModalTestimonial] = useState<typeof testimonials[0] | null>(null);
  const [[activeIndex, direction], setActiveIndex] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const { config } = useSiteConfig();
  const tc = config.testimonials;

  const paginate = useCallback((newDirection: number) => {
    setActiveIndex(([prev]) => {
      const next = (prev + newDirection + testimonials.length) % testimonials.length;
      return [next, newDirection];
    });
  }, []);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(([prev]) => [index, index > prev ? 1 : -1]);
  }, []);

  useEffect(() => {
    if (isPaused || !tc.autoPlay) return;
    const interval = setInterval(() => paginate(1), 5000);
    return () => clearInterval(interval);
  }, [isPaused, paginate, tc.autoPlay]);

  const current = testimonials[activeIndex];
  const prevIndex = (activeIndex - 1 + testimonials.length) % testimonials.length;
  const nextIndex = (activeIndex + 1) % testimonials.length;

  return (
    <section
      className="relative section-lazy overflow-hidden"
      ref={sectionRef}
      style={{ paddingBlock: "var(--section-y)" }}
    >
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--color-primary)" }}>
            {isAr ? tc.subtitleAr : tc.subtitleEn}
          </p>
          <h2 className="font-bold tracking-tight" style={{ fontSize: "var(--text-h2)" }}>{isAr ? tc.titleAr : tc.titleEn}</h2>
        </motion.div>

        {/* Slider */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Side preview cards — desktop only */}
          {tc.showSidePreviews && (<>
          <div className="hidden md:block absolute top-0 bottom-0 start-0 w-[18%] z-0 pointer-events-none">
            <div
              className="h-full rounded-xl p-4 flex flex-col justify-center"
              style={{
                border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                background: "var(--color-card)",
                opacity: 0.4,
                filter: "blur(1px)",
              }}
            >
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: testimonials[prevIndex].rating }).map((_, j) => (
                  <Star key={j} className="h-2.5 w-2.5" style={{ color: "var(--color-primary)", fill: "var(--color-primary)" }} />
                ))}
              </div>
              <p className="text-[10px] line-clamp-2 italic" style={{ opacity: 0.5 }}>
                &ldquo;{isAr ? testimonials[prevIndex].content : testimonials[prevIndex].contentEn}&rdquo;
              </p>
            </div>
          </div>
          <div className="hidden md:block absolute top-0 bottom-0 end-0 w-[18%] z-0 pointer-events-none">
            <div
              className="h-full rounded-xl p-4 flex flex-col justify-center"
              style={{
                border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                background: "var(--color-card)",
                opacity: 0.4,
                filter: "blur(1px)",
              }}
            >
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: testimonials[nextIndex].rating }).map((_, j) => (
                  <Star key={j} className="h-2.5 w-2.5" style={{ color: "var(--color-primary)", fill: "var(--color-primary)" }} />
                ))}
              </div>
              <p className="text-[10px] line-clamp-2 italic" style={{ opacity: 0.5 }}>
                &ldquo;{isAr ? testimonials[nextIndex].content : testimonials[nextIndex].contentEn}&rdquo;
              </p>
            </div>
          </div>
          </>)}

          {/* Main slider card */}
          <div className={`${tc.showSidePreviews ? "md:mx-[20%]" : ""} relative z-10`}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="rounded-xl p-5 md:p-6"
                style={{
                  border: "2px solid rgba(var(--color-primary-rgb) / 0.15)",
                  background: "var(--color-card)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  {/* Quote icon */}
                  <Quote className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-primary)", opacity: 0.3 }} />
                  {/* Stars */}
                  <div className="flex gap-0.5 ms-auto">
                    {Array.from({ length: current.rating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3" style={{ color: "var(--color-primary)", fill: "var(--color-primary)" }} />
                    ))}
                  </div>
                </div>

                {/* Quote text */}
                <p className="text-[14px] md:text-[15px] text-foreground leading-relaxed mb-5 italic">
                  &ldquo;{isAr ? current.content : current.contentEn}&rdquo;
                </p>

                {/* Author row */}
                <div
                  className="flex items-center justify-between pt-4"
                  style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full overflow-hidden shrink-0"
                      style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.15)" }}
                    >
                      <Image
                        src={current.avatar}
                        alt={isAr ? current.name : current.nameEn}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold">{isAr ? current.name : current.nameEn}</div>
                      <div className="text-[11px]" style={{ opacity: 0.5 }}>
                        {isAr ? current.role : current.roleEn} · <span style={{ color: "var(--color-primary)" }}>{isAr ? current.companyAr : current.company}</span>
                      </div>
                    </div>
                  </div>

                  {tc.showReadMore && (
                  <button
                    onClick={() => setModalTestimonial(current)}
                    className="text-[11px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg"
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
                    {isAr ? "المزيد" : "Read more"}
                  </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Left/Right arrows — overlapping the slider edges */}
          <button
            onClick={() => paginate(-1)}
            className="absolute top-1/2 -translate-y-1/2 start-0 md:start-[16%] z-20 h-9 w-9 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "var(--color-card)",
              border: "1.5px solid rgba(var(--color-primary-rgb) / 0.15)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.borderColor = "var(--color-primary)";
              const svg = e.currentTarget.querySelector("svg");
              if (svg) (svg as unknown as HTMLElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-card)";
              e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
              const svg = e.currentTarget.querySelector("svg");
              if (svg) (svg as unknown as HTMLElement).style.color = "var(--color-primary)";
            }}
          >
            {isAr
              ? <ChevronRight className="h-4 w-4" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} />
              : <ChevronLeft className="h-4 w-4" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} />
            }
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute top-1/2 -translate-y-1/2 end-0 md:end-[16%] z-20 h-9 w-9 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "var(--color-card)",
              border: "1.5px solid rgba(var(--color-primary-rgb) / 0.15)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.borderColor = "var(--color-primary)";
              const svg = e.currentTarget.querySelector("svg");
              if (svg) (svg as unknown as HTMLElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-card)";
              e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
              const svg = e.currentTarget.querySelector("svg");
              if (svg) (svg as unknown as HTMLElement).style.color = "var(--color-primary)";
            }}
          >
            {isAr
              ? <ChevronLeft className="h-4 w-4" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} />
              : <ChevronRight className="h-4 w-4" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} />
            }
          </button>
        </div>

        {/* Dots + counter */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <div className="flex gap-1">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className="h-1 rounded-full cursor-pointer transition-all duration-300"
                style={{
                  width: activeIndex === i ? "18px" : "6px",
                  background: activeIndex === i ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.2)",
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-foreground font-medium" style={{ opacity: 0.4 }}>
            {String(activeIndex + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
          </span>
        </div>
      </Container>

      {/* Modal */}
      <Modal open={!!modalTestimonial} onClose={() => setModalTestimonial(null)}>
        {modalTestimonial && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full overflow-hidden shrink-0"
                style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.2)" }}
              >
                <Image
                  src={modalTestimonial.avatar}
                  alt={isAr ? modalTestimonial.name : modalTestimonial.nameEn}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
              <div>
                <h3 className="text-[13px] font-bold">{isAr ? modalTestimonial.name : modalTestimonial.nameEn}</h3>
                <p className="text-[10px]" style={{ opacity: 0.5 }}>
                  {isAr ? modalTestimonial.role : modalTestimonial.roleEn} · <span style={{ color: "var(--color-primary)" }}>{isAr ? modalTestimonial.companyAr : modalTestimonial.company}</span>
                </p>
              </div>
              <div className="flex gap-0.5 ms-auto">
                {Array.from({ length: modalTestimonial.rating }).map((_, j) => (
                  <Star key={j} className="h-3 w-3" style={{ color: "var(--color-primary)", fill: "var(--color-primary)" }} />
                ))}
              </div>
            </div>
            <div
              className="rounded-lg p-3"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.03)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}
            >
              <Quote className="h-3.5 w-3.5 mb-2" style={{ color: "var(--color-primary)", opacity: 0.3 }} />
              <p className="text-[12px] text-foreground leading-relaxed italic">
                {isAr ? modalTestimonial.fullContentAr : modalTestimonial.fullContentEn}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
