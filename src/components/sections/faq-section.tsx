"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRef, useState } from "react";
import { Container } from "@/components/shared/container";
import { ChevronDown } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const faqs = [
  {
    questionEn: "What services do you offer?",
    questionAr: "ما هي الخدمات التي تقدمونها؟",
    answerEn:
      "We offer a full range of digital services including web development, mobile app development, UI/UX design, digital marketing, brand identity design, and technical consulting.",
    answerAr:
      "نقدم مجموعة كاملة من الخدمات الرقمية تشمل تطوير المواقع، تطوير تطبيقات الجوال، تصميم واجهات المستخدم، التسويق الرقمي، تصميم الهوية البصرية، والاستشارات التقنية.",
  },
  {
    questionEn: "How long does a typical project take?",
    questionAr: "كم يستغرق المشروع النموذجي؟",
    answerEn:
      "Project timelines vary based on scope and complexity. A standard website takes 4-8 weeks, while complex web applications may take 3-6 months. We provide detailed timelines during the discovery phase.",
    answerAr:
      "تختلف مدة المشروع حسب النطاق والتعقيد. يستغرق الموقع العادي 4-8 أسابيع، بينما قد تستغرق تطبيقات الويب المعقدة 3-6 أشهر. نقدم جداول زمنية مفصلة خلال مرحلة الاكتشاف.",
  },
  {
    questionEn: "Do you provide ongoing support after launch?",
    questionAr: "هل تقدمون دعمًا مستمرًا بعد الإطلاق؟",
    answerEn:
      "Yes, we offer comprehensive post-launch support including bug fixes, performance monitoring, security updates, and feature enhancements. Our support plans range from basic to 24/7 dedicated support.",
    answerAr:
      "نعم، نقدم دعمًا شاملاً بعد الإطلاق يشمل إصلاح الأخطاء، مراقبة الأداء، تحديثات الأمان، وتحسينات الميزات. تتراوح خطط الدعم لدينا من الأساسية إلى الدعم المخصص على مدار الساعة.",
  },
  {
    questionEn: "What technologies do you use?",
    questionAr: "ما هي التقنيات التي تستخدمونها؟",
    answerEn:
      "We use modern, industry-leading technologies including React, Next.js, TypeScript, Node.js, and cloud platforms like AWS and Vercel. We choose the best stack for each project's unique requirements.",
    answerAr:
      "نستخدم تقنيات حديثة ورائدة في الصناعة تشمل React و Next.js و TypeScript و Node.js ومنصات سحابية مثل AWS و Vercel. نختار أفضل حزمة تقنية لمتطلبات كل مشروع.",
  },
  {
    questionEn: "How do you handle project communication?",
    questionAr: "كيف تتعاملون مع التواصل خلال المشروع؟",
    answerEn:
      "We maintain transparent communication through regular updates, weekly progress meetings, and a dedicated project manager. You'll have real-time access to project status through our management tools.",
    answerAr:
      "نحافظ على تواصل شفاف من خلال تحديثات منتظمة، اجتماعات تقدم أسبوعية، ومدير مشروع مخصص. سيكون لديك وصول فوري لحالة المشروع من خلال أدوات الإدارة لدينا.",
  },
  {
    questionEn: "Can you work with our existing team?",
    questionAr: "هل يمكنكم العمل مع فريقنا الحالي؟",
    answerEn:
      "Absolutely. We frequently collaborate with in-house teams, providing specialized expertise where needed. Whether it's staff augmentation, consulting, or co-development, we adapt to your workflow.",
    answerAr:
      "بالتأكيد. نتعاون بشكل متكرر مع الفرق الداخلية، ونقدم خبرة متخصصة عند الحاجة. سواء كان ذلك تعزيز الفريق أو الاستشارات أو التطوير المشترك، نتكيف مع سير عملكم.",
  },
];

export function FaqSection() {
  const t = useTranslations("faq");
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden section-lazy"
      style={{ paddingBlock: "var(--section-y)" }}
    >
      <Container>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10">
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
          </div>

          {/* Accordion */}
          <div className="space-y-2">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.4,
                    delay: 0.08 + i * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                    background: "var(--color-card)",
                  }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-start cursor-pointer"
                  >
                    <span className="text-[13px] font-semibold">
                      {isAr ? faq.questionAr : faq.questionEn}
                    </span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 transition-transform duration-200"
                      style={{
                        color: "var(--color-primary)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-5 pb-4 text-[12px] text-foreground leading-relaxed"
                          style={{
                            borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.04)",
                            paddingTop: "0.75rem",
                          }}
                        >
                          {isAr ? faq.answerAr : faq.answerEn}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
