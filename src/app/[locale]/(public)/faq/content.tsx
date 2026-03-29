"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import { useSiteConfig } from "@/providers/site-config-provider";
import { DEFAULT_PAGES_CONTENT } from "@/lib/site-config";
import {
  Search,
  ChevronDown,
  MessageCircle,
  Clock,
  HelpCircle,
  ArrowRight,
  Mail,
  Headphones,
  Zap,
  Shield,
  Code,
  Globe,
  CreditCard,
  Wrench,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useRef, useState, useMemo } from "react";

/* ───────────────── Types ───────────────── */

interface FaqCategory {
  key: string;
  labelEn: string;
  labelAr: string;
  icon: typeof HelpCircle;
  items: { questionEn: string; questionAr: string; answerEn: string; answerAr: string }[];
}

const categoryIconMap: Record<string, typeof HelpCircle> = {
  general: HelpCircle,
  services: Code,
  projects: Code,
  pricing: CreditCard,
  technical: Shield,
  support: Headphones,
};

const categoryLabelMap: Record<string, { labelEn: string; labelAr: string }> = {
  general: { labelEn: "General", labelAr: "عام" },
  services: { labelEn: "Services", labelAr: "الخدمات" },
  projects: { labelEn: "Projects", labelAr: "المشاريع" },
  pricing: { labelEn: "Pricing", labelAr: "الأسعار" },
  technical: { labelEn: "Technical", labelAr: "تقني" },
  support: { labelEn: "Support", labelAr: "الدعم" },
};

/* ───────────────── FAQ Data (legacy fallback, now from config) ───────────────── */

const _legacyFaqCategories: FaqCategory[] = [
  {
    key: "general",
    labelEn: "General",
    labelAr: "عام",
    icon: HelpCircle,
    items: [
      {
        questionEn: "What services do you offer?",
        questionAr: "ما هي الخدمات التي تقدمونها؟",
        answerEn:
          "We offer a comprehensive range of digital services including web development, mobile app development, UI/UX design, and digital marketing. Our team specializes in creating custom solutions tailored to your specific business needs and goals.",
        answerAr:
          "نقدم مجموعة شاملة من الخدمات الرقمية تشمل تطوير المواقع الإلكترونية وتطبيقات الجوال وتصميم واجهات المستخدم والتسويق الرقمي. فريقنا متخصص في إنشاء حلول مخصصة تتناسب مع احتياجات عملك وأهدافك.",
      },
      {
        questionEn: "How long have you been in business?",
        questionAr: "منذ متى وأنتم في هذا المجال؟",
        answerEn:
          "We have been delivering exceptional digital solutions for over a decade. Throughout our journey, we have successfully completed hundreds of projects across various industries, building a reputation for quality and reliability.",
        answerAr:
          "نعمل في تقديم الحلول الرقمية المتميزة منذ أكثر من عقد من الزمان. خلال مسيرتنا أنجزنا بنجاح مئات المشاريع في مختلف القطاعات، وبنينا سمعة قوية في الجودة والموثوقية.",
      },
      {
        questionEn: "Do you work with international clients?",
        questionAr: "هل تعملون مع عملاء دوليين؟",
        answerEn:
          "Absolutely! We work with clients from around the globe. Our team is experienced in managing remote collaborations across different time zones, ensuring seamless communication and project delivery regardless of location.",
        answerAr:
          "بالتأكيد! نعمل مع عملاء من جميع أنحاء العالم. فريقنا ذو خبرة في إدارة التعاون عن بُعد عبر مناطق زمنية مختلفة، مما يضمن تواصلاً سلساً وتسليم المشاريع بغض النظر عن الموقع.",
      },
    ],
  },
  {
    key: "projects",
    labelEn: "Projects",
    labelAr: "المشاريع",
    icon: Code,
    items: [
      {
        questionEn: "How long does a typical project take?",
        questionAr: "كم يستغرق المشروع النموذجي؟",
        answerEn:
          "Project timelines vary based on scope and complexity. A simple website typically takes 4-6 weeks, while complex web applications may take 3-6 months. We provide detailed timelines during the proposal phase so you know exactly what to expect.",
        answerAr:
          "تختلف الجداول الزمنية للمشاريع حسب النطاق والتعقيد. يستغرق الموقع البسيط عادةً من 4 إلى 6 أسابيع، بينما قد تستغرق تطبيقات الويب المعقدة من 3 إلى 6 أشهر. نقدم جداول زمنية مفصلة خلال مرحلة العرض حتى تعرف ما يمكن توقعه.",
      },
      {
        questionEn: "What is your development process?",
        questionAr: "ما هي عملية التطوير لديكم؟",
        answerEn:
          "We follow an agile development methodology with iterative sprints. This includes discovery and planning, design prototyping, development, testing, and deployment. You will receive regular updates and have opportunities to provide feedback at every stage.",
        answerAr:
          "نتبع منهجية التطوير الرشيقة مع دورات تطوير متكررة. تشمل العملية الاكتشاف والتخطيط، والتصميم الأولي، والتطوير، والاختبار، والنشر. ستتلقى تحديثات منتظمة وسيكون لديك فرص لتقديم ملاحظاتك في كل مرحلة.",
      },
      {
        questionEn: "Do you provide ongoing maintenance?",
        questionAr: "هل توفرون صيانة مستمرة؟",
        answerEn:
          "Yes, we offer comprehensive maintenance and support packages. These include regular updates, security patches, performance monitoring, and content updates. We ensure your digital products remain secure, fast, and up-to-date.",
        answerAr:
          "نعم، نقدم باقات صيانة ودعم شاملة. تشمل التحديثات المنتظمة وإصلاحات الأمان ومراقبة الأداء وتحديثات المحتوى. نضمن أن تبقى منتجاتك الرقمية آمنة وسريعة ومحدثة.",
      },
      {
        questionEn: "Can I see examples of your work?",
        questionAr: "هل يمكنني رؤية أمثلة على أعمالكم؟",
        answerEn:
          "Of course! Visit our portfolio page to explore our latest projects. We showcase a diverse range of work across different industries, demonstrating our versatility and commitment to quality in every project we undertake.",
        answerAr:
          "بالطبع! قم بزيارة صفحة أعمالنا لاستكشاف أحدث مشاريعنا. نعرض مجموعة متنوعة من الأعمال في مختلف القطاعات، مما يُظهر تنوعنا والتزامنا بالجودة في كل مشروع ننفذه.",
      },
    ],
  },
  {
    key: "pricing",
    labelEn: "Pricing",
    labelAr: "الأسعار",
    icon: CreditCard,
    items: [
      {
        questionEn: "How much does a website cost?",
        questionAr: "كم تكلفة الموقع الإلكتروني؟",
        answerEn:
          "Website costs depend on the project scope, features, and complexity. We provide custom quotes after understanding your requirements. Our transparent pricing ensures you get the best value without any surprises along the way.",
        answerAr:
          "تعتمد تكلفة الموقع على نطاق المشروع والميزات والتعقيد. نقدم عروض أسعار مخصصة بعد فهم متطلباتك. أسعارنا الشفافة تضمن حصولك على أفضل قيمة دون أي مفاجآت.",
      },
      {
        questionEn: "Do you offer payment plans?",
        questionAr: "هل تقدمون خطط دفع؟",
        answerEn:
          "Yes, we offer flexible payment plans to accommodate different budgets. Typically, projects are divided into milestone-based payments, so you pay as the project progresses. We are happy to discuss a plan that works best for you.",
        answerAr:
          "نعم، نقدم خطط دفع مرنة تناسب الميزانيات المختلفة. عادةً ما تُقسم المشاريع إلى دفعات مرتبطة بمراحل إنجاز محددة. يسعدنا مناقشة خطة دفع تناسبك.",
      },
      {
        questionEn: "Are there any hidden fees?",
        questionAr: "هل هناك رسوم مخفية؟",
        answerEn:
          "No, we believe in complete transparency. All costs are outlined in our proposal before the project begins. If any additional work is needed during the project, we discuss it with you first and provide a clear estimate before proceeding.",
        answerAr:
          "لا، نؤمن بالشفافية الكاملة. جميع التكاليف موضحة في عرضنا قبل بدء المشروع. إذا كان هناك حاجة لعمل إضافي أثناء المشروع، نناقشه معك أولاً ونقدم تقديراً واضحاً قبل المتابعة.",
      },
    ],
  },
  {
    key: "technical",
    labelEn: "Technical",
    labelAr: "تقني",
    icon: Shield,
    items: [
      {
        questionEn: "What technologies do you use?",
        questionAr: "ما هي التقنيات التي تستخدمونها؟",
        answerEn:
          "We use modern, industry-leading technologies including React, Next.js, TypeScript, Node.js, and cloud platforms like AWS and Vercel. We select the best tech stack for each project to ensure optimal performance and scalability.",
        answerAr:
          "نستخدم تقنيات حديثة ورائدة في الصناعة تشمل React وNext.js وTypeScript وNode.js ومنصات سحابية مثل AWS وVercel. نختار أفضل مجموعة تقنيات لكل مشروع لضمان الأداء الأمثل وقابلية التوسع.",
      },
      {
        questionEn: "Do you provide hosting?",
        questionAr: "هل توفرون الاستضافة؟",
        answerEn:
          "Yes, we provide managed hosting solutions with high availability and performance. Our hosting infrastructure includes SSL certificates, CDN integration, automatic backups, and 24/7 monitoring to keep your site running smoothly.",
        answerAr:
          "نعم، نوفر حلول استضافة مُدارة بتوفر عالٍ وأداء ممتاز. تشمل بنيتنا التحتية شهادات SSL وتكامل CDN ونسخ احتياطية تلقائية ومراقبة على مدار الساعة للحفاظ على تشغيل موقعك بسلاسة.",
      },
      {
        questionEn: "Is my website mobile-friendly?",
        questionAr: "هل موقعي متوافق مع الجوال؟",
        answerEn:
          "Every website we build is fully responsive and optimized for all devices. We follow a mobile-first approach to ensure a seamless experience across smartphones, tablets, and desktops with fast loading times on every platform.",
        answerAr:
          "كل موقع نبنيه متجاوب بالكامل ومُحسّن لجميع الأجهزة. نتبع نهج الجوال أولاً لضمان تجربة سلسة عبر الهواتف الذكية والأجهزة اللوحية وأجهزة الكمبيوتر مع أوقات تحميل سريعة على كل منصة.",
      },
      {
        questionEn: "How do you handle security?",
        questionAr: "كيف تتعاملون مع الأمان؟",
        answerEn:
          "Security is a top priority in everything we build. We implement industry best practices including HTTPS encryption, input validation, secure authentication, regular security audits, and compliance with data protection regulations.",
        answerAr:
          "الأمان أولوية قصوى في كل ما نبنيه. نطبق أفضل ممارسات الصناعة بما في ذلك تشفير HTTPS والتحقق من المدخلات والمصادقة الآمنة وعمليات تدقيق الأمان الدورية والامتثال للوائح حماية البيانات.",
      },
    ],
  },
  {
    key: "support",
    labelEn: "Support",
    labelAr: "الدعم",
    icon: Headphones,
    items: [
      {
        questionEn: "How can I reach support?",
        questionAr: "كيف يمكنني الوصول للدعم؟",
        answerEn:
          "You can reach our support team through multiple channels: email, phone, or our online contact form. We also offer a dedicated client portal where you can submit tickets and track the status of your requests in real-time.",
        answerAr:
          "يمكنك الوصول لفريق الدعم لدينا عبر قنوات متعددة: البريد الإلكتروني أو الهاتف أو نموذج الاتصال عبر الإنترنت. نوفر أيضاً بوابة عملاء مخصصة حيث يمكنك تقديم التذاكر وتتبع حالة طلباتك في الوقت الفعلي.",
      },
      {
        questionEn: "What are your support hours?",
        questionAr: "ما هي ساعات الدعم؟",
        answerEn:
          "Our standard support is available Sunday through Thursday, 9 AM to 6 PM. For clients with premium support packages, we offer 24/7 emergency support to ensure critical issues are resolved promptly at any time.",
        answerAr:
          "دعمنا القياسي متاح من الأحد إلى الخميس من 9 صباحاً حتى 6 مساءً. للعملاء الذين لديهم باقات الدعم المميزة، نقدم دعماً طارئاً على مدار الساعة لضمان حل المشكلات الحرجة فوراً في أي وقت.",
      },
      {
        questionEn: "Do you offer training?",
        questionAr: "هل تقدمون تدريباً؟",
        answerEn:
          "Yes, we provide comprehensive training for all our deliverables. This includes video tutorials, documentation, and live training sessions to ensure your team can confidently manage and update your digital products independently.",
        answerAr:
          "نعم، نقدم تدريباً شاملاً على جميع منتجاتنا. يشمل ذلك دروس فيديو ووثائق وجلسات تدريبية مباشرة لضمان قدرة فريقك على إدارة وتحديث منتجاتك الرقمية بثقة واستقلالية.",
      },
    ],
  },
];

/* ───────────────── Component ───────────────── */

export function FaqContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("faq");
  const { config } = useSiteConfig();
  const sections = config.pagesContent?.faq?.sections ?? DEFAULT_PAGES_CONTENT.faq.sections;

  // Build categories from config faqItems
  const faqCategories = useMemo(() => {
    const categoryMap = new Map<string, FaqCategory>();
    for (const item of config.faqItems) {
      const cat = item.category || "general";
      if (!categoryMap.has(cat)) {
        const meta = categoryLabelMap[cat] ?? { labelEn: cat, labelAr: cat };
        categoryMap.set(cat, {
          key: cat,
          labelEn: meta.labelEn,
          labelAr: meta.labelAr,
          icon: categoryIconMap[cat] ?? HelpCircle,
          items: [],
        });
      }
      categoryMap.get(cat)!.items.push({
        questionEn: item.questionEn,
        questionAr: item.questionAr,
        answerEn: item.answerEn,
        answerAr: item.answerAr,
      });
    }
    return Array.from(categoryMap.values());
  }, [config.faqItems]);

  const [activeCategory, setActiveCategory] = useState("general");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Filtered FAQs ── */
  const filteredItems = useMemo(() => {
    const category = faqCategories.find((c) => c.key === activeCategory);
    if (!category) return [];

    if (!searchQuery.trim()) return category.items;

    const query = searchQuery.toLowerCase();
    return category.items.filter(
      (item) =>
        item.questionEn.toLowerCase().includes(query) ||
        item.questionAr.includes(query) ||
        item.answerEn.toLowerCase().includes(query) ||
        item.answerAr.includes(query)
    );
  }, [activeCategory, searchQuery]);

  /* ── Refs ── */
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-60px" });
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsInView = useInView(tabsRef, { once: true, margin: "-60px" });
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  return (
    <div style={{ background: "var(--color-background)" }}>
      {sections.hero?.visible !== false && (<>
      {/* ═══════════════ 1. PREMIUM HERO ═══════════════ */}
      <section
        style={{
          paddingBlock: "var(--section-y)",
          background:
            "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.08) 0%, var(--color-background) 50%, rgba(var(--color-primary-rgb) / 0.04) 100%)",
        }}
      >
        <Container>
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.1)",
                color: "var(--color-primary)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
              }}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {t("subtitle")}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4"
              style={{ color: "var(--color-foreground)" }}
            >
              {t("title")}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.7)" }}
            >
              {t("description")}
            </motion.p>

            {/* Search Bar (decorative + filter) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative max-w-md mx-auto"
            >
              <Search
                className="absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5"
                style={{
                  color: "var(--color-primary)",
                  [isAr ? "right" : "left"]: "16px",
                }}
              />
              <input
                type="text"
                placeholder={
                  isAr ? "ابحث في الأسئلة الشائعة..." : "Search FAQs..."
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenIndex(null);
                }}
                className="w-full rounded-xl py-3 text-sm outline-none transition-all duration-300"
                style={{
                  paddingInlineStart: "44px",
                  paddingInlineEnd: "16px",
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                  color: "var(--color-foreground)",
                }}
                dir={isAr ? "rtl" : "ltr"}
              />
            </motion.div>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.categories?.visible !== false && (<>
      {/* ═══════════════ 2. CATEGORY TABS ═══════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            ref={tabsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={tabsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {faqCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    setOpenIndex(null);
                  }}
                  className="relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer"
                  style={{
                    color: isActive
                      ? "var(--color-background)"
                      : "var(--color-foreground)",
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryPill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "var(--color-primary)" }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  {!isActive && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.06)",
                        border:
                          "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                      }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">
                    {isAr ? cat.labelAr : cat.labelEn}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ═══════════════ 3. FAQ ACCORDION ═══════════════ */}
          <div className="max-w-2xl mx-auto space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory + searchQuery}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Search
                      className="w-10 h-10 mx-auto mb-3"
                      style={{
                        color: "rgba(var(--color-primary-rgb) / 0.3)",
                      }}
                    />
                    <p
                      className="text-sm"
                      style={{
                        color: "rgba(var(--color-primary-rgb) / 0.5)",
                      }}
                    >
                      {isAr
                        ? "لم يتم العثور على نتائج"
                        : "No results found"}
                    </p>
                  </motion.div>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isOpen = openIndex === idx;
                    const currentCat = faqCategories.find(
                      (c) => c.key === activeCategory
                    );
                    return (
                      <AccordionItem
                        key={`${activeCategory}-${idx}`}
                        item={item}
                        isOpen={isOpen}
                        onToggle={() =>
                          setOpenIndex(isOpen ? null : idx)
                        }
                        isAr={isAr}
                        categoryLabel={
                          isAr
                            ? currentCat?.labelAr ?? ""
                            : currentCat?.labelEn ?? ""
                        }
                        index={idx}
                      />
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.stats?.visible !== false && (<>
      {/* ═══════════════ 4. QUICK STATS ═══════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0, y: 24 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-8 md:p-10 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.06) 0%, rgba(var(--color-primary-rgb) / 0.02) 100%)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
            }}
          >
            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{ color: "var(--color-foreground)" }}
            >
              {isAr ? "لا تزال لديك أسئلة؟" : "Still have questions?"}
            </h3>
            <p
              className="text-sm mb-8 max-w-md mx-auto"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
            >
              {isAr
                ? "فريقنا مستعد لمساعدتك في أي وقت"
                : "Our team is ready to help you anytime"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Headphones,
                  valueEn: "24/7",
                  valueAr: "24/7",
                  labelEn: "Support",
                  labelAr: "الدعم",
                },
                {
                  icon: Zap,
                  valueEn: "<2hr",
                  valueAr: "أقل من ساعتين",
                  labelEn: "Response Time",
                  labelAr: "وقت الاستجابة",
                },
                {
                  icon: MessageCircle,
                  valueEn: "500+",
                  valueAr: "+500",
                  labelEn: "Questions Answered",
                  labelAr: "سؤال تمت الإجابة عليه",
                },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 16 }}
                    animate={statsInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.15 * idx }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.1)",
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: "var(--color-primary)" }}
                      />
                    </div>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {isAr ? stat.valueAr : stat.valueEn}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: "rgba(var(--color-primary-rgb) / 0.6)",
                      }}
                    >
                      {isAr ? stat.labelAr : stat.labelEn}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.cta?.visible !== false && (<>
      {/* ═══════════════ 5. CONTACT CTA ═══════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 24 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center max-w-lg mx-auto"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.1)",
              }}
            >
              <Mail
                className="w-6 h-6"
                style={{ color: "var(--color-primary)" }}
              />
            </div>

            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{ color: "var(--color-foreground)" }}
            >
              {isAr
                ? "لم تجد ما تبحث عنه؟"
                : "Can't find what you're looking for?"}
            </h3>
            <p
              className="text-sm mb-8"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
            >
              {isAr
                ? "تواصل مع فريقنا وسنسعد بمساعدتك"
                : "Get in touch with our team and we will be happy to help"}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/contact">
                <motion.span
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer"
                  style={{
                    background: "var(--color-primary)",
                    color: "var(--color-background)",
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isAr ? "تواصل معنا" : "Contact Us"}
                  <ArrowRight
                    className="w-4 h-4"
                    style={{
                      transform: isAr ? "scaleX(-1)" : undefined,
                    }}
                  />
                </motion.span>
              </Link>

              <a href="mailto:support@example.com">
                <motion.span
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold cursor-pointer"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.08)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Mail className="w-4 h-4" />
                  {isAr ? "راسلنا بالبريد" : "Email Us"}
                </motion.span>
              </a>
            </div>
          </motion.div>
        </Container>
      </section>
      </>)}
    </div>
  );
}

/* ───────────────── Accordion Item ───────────────── */

function AccordionItem({
  item,
  isOpen,
  onToggle,
  isAr,
  categoryLabel,
  index,
}: {
  item: { questionEn: string; questionAr: string; answerEn: string; answerAr: string };
  isOpen: boolean;
  onToggle: () => void;
  isAr: boolean;
  categoryLabel: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: isOpen
          ? "rgba(var(--color-primary-rgb) / 0.04)"
          : "var(--color-card)",
        border: `1px solid ${
          isOpen
            ? "rgba(var(--color-primary-rgb) / 0.2)"
            : "rgba(var(--color-primary-rgb) / 0.08)"
        }`,
      }}
    >
      {/* Question button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 md:p-5 text-start cursor-pointer"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Category badge */}
        <span
          className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: "rgba(var(--color-primary-rgb) / 0.1)",
            color: "var(--color-primary)",
          }}
        >
          {categoryLabel}
        </span>

        {/* Question text */}
        <span
          className="flex-1 text-sm font-medium"
          style={{ color: "var(--color-foreground)" }}
        >
          {isAr ? item.questionAr : item.questionEn}
        </span>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <ChevronDown
            className="w-4 h-4"
            style={{ color: "var(--color-primary)" }}
          />
        </motion.span>
      </button>

      {/* Answer panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className="px-4 md:px-5 pb-4 md:pb-5 text-sm leading-relaxed"
              style={{
                color: "rgba(var(--color-primary-rgb) / 0.7)",
                borderTop:
                  "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                paddingTop: "16px",
              }}
              dir={isAr ? "rtl" : "ltr"}
            >
              {isAr ? item.answerAr : item.answerEn}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
