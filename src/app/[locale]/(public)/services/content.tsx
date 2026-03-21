"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import { Modal } from "@/components/shared/modal";
import {
  Code,
  Smartphone,
  Figma,
  Megaphone,
  PenTool,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  Palette,
  Rocket,
  Layers,
  ChevronDown,
  Star,
  Users,
  FolderCheck,
  Zap,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

/* ─── Data ──────────────────────────────────────────────────────── */

const services = [
  {
    key: "webDev",
    icon: Code,
    category: "development",
    featuresEn: ["Custom web applications", "E-commerce platforms", "Progressive Web Apps", "API development"],
    featuresAr: ["تطبيقات ويب مخصصة", "منصات تجارة إلكترونية", "تطبيقات ويب تقدمية", "تطوير API"],
  },
  {
    key: "mobileDev",
    icon: Smartphone,
    category: "development",
    featuresEn: ["iOS & Android apps", "Cross-platform development", "App store optimization", "Push notifications"],
    featuresAr: ["تطبيقات iOS و Android", "تطوير متعدد المنصات", "تحسين متاجر التطبيقات", "إشعارات فورية"],
  },
  {
    key: "uiux",
    icon: Figma,
    category: "design",
    featuresEn: ["User research", "Wireframing & prototyping", "Visual design systems", "Usability testing"],
    featuresAr: ["بحث المستخدمين", "التخطيط والنماذج الأولية", "أنظمة التصميم البصري", "اختبار قابلية الاستخدام"],
  },
  {
    key: "marketing",
    icon: Megaphone,
    category: "marketing",
    featuresEn: ["SEO optimization", "Social media management", "Content strategy", "Analytics & reporting"],
    featuresAr: ["تحسين محركات البحث", "إدارة وسائل التواصل", "استراتيجية المحتوى", "التحليلات والتقارير"],
  },
  {
    key: "branding",
    icon: PenTool,
    category: "design",
    featuresEn: ["Logo design", "Brand guidelines", "Visual identity", "Print & digital assets"],
    featuresAr: ["تصميم الشعار", "دليل العلامة التجارية", "الهوية البصرية", "أصول مطبوعة ورقمية"],
  },
  {
    key: "consulting",
    icon: MessageSquare,
    category: "development",
    featuresEn: ["Tech strategy", "Architecture review", "Team mentoring", "Process optimization"],
    featuresAr: ["استراتيجية تقنية", "مراجعة البنية", "تدريب الفرق", "تحسين العمليات"],
  },
];

type Category = "all" | "development" | "design" | "marketing";

const categories: { key: Category; en: string; ar: string }[] = [
  { key: "all", en: "All Services", ar: "جميع الخدمات" },
  { key: "development", en: "Development", ar: "التطوير" },
  { key: "design", en: "Design", ar: "التصميم" },
  { key: "marketing", en: "Marketing", ar: "التسويق" },
];

const processSteps = [
  { num: "01", icon: Search, en: "Discover", ar: "اكتشاف", descEn: "Deep dive into your goals, audience, and competitive landscape.", descAr: "الغوص العميق في أهدافك وجمهورك والمشهد التنافسي." },
  { num: "02", icon: Palette, en: "Design", ar: "تصميم", descEn: "Craft pixel-perfect interfaces with intuitive user flows.", descAr: "تصميم واجهات مثالية مع تدفقات مستخدم بديهية." },
  { num: "03", icon: Code, en: "Develop", ar: "تطوير", descEn: "Build robust, scalable solutions using modern technologies.", descAr: "بناء حلول قوية وقابلة للتوسع باستخدام تقنيات حديثة." },
  { num: "04", icon: Rocket, en: "Deploy", ar: "إطلاق", descEn: "Launch with confidence, monitor performance, and iterate.", descAr: "إطلاق بثقة ومراقبة الأداء والتحسين المستمر." },
];

const techCategories = [
  { en: "Frontend", ar: "الواجهة الأمامية", techs: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"] },
  { en: "Backend", ar: "الواجهة الخلفية", techs: ["Node.js", "Python", "PostgreSQL", "Redis", "GraphQL"] },
  { en: "Mobile", ar: "الجوال", techs: ["React Native", "Flutter", "Swift", "Kotlin"] },
  { en: "Cloud", ar: "السحابة", techs: ["AWS", "Vercel", "Docker", "CI/CD", "Cloudflare"] },
];

const tiers = [
  { en: "Basic", ar: "أساسي", features: [true, true, false, false, false] },
  { en: "Professional", ar: "احترافي", features: [true, true, true, true, false], highlighted: true },
  { en: "Enterprise", ar: "مؤسسات", features: [true, true, true, true, true] },
];

const tierFeatures = [
  { en: "Responsive Design", ar: "تصميم متجاوب" },
  { en: "SEO Optimization", ar: "تحسين محركات البحث" },
  { en: "Custom Development", ar: "تطوير مخصص" },
  { en: "Priority Support", ar: "دعم أولوية" },
  { en: "Dedicated Team", ar: "فريق مخصص" },
];

const impactStats = [
  { value: "98%", en: "Client Satisfaction", ar: "رضا العملاء", icon: Star },
  { value: "200+", en: "Projects Delivered", ar: "مشروع منجز", icon: FolderCheck },
  { value: "4.9/5", en: "Average Rating", ar: "متوسط التقييم", icon: Zap },
  { value: "50+", en: "Team Experts", ar: "خبير في الفريق", icon: Users },
];

const faqData = [
  { qEn: "How long does a typical project take?", qAr: "كم يستغرق المشروع النموذجي؟", aEn: "Timelines vary based on scope. A standard website takes 4-8 weeks, while complex applications can take 3-6 months. We provide detailed timelines during our discovery phase.", aAr: "تختلف الجداول الزمنية حسب النطاق. يستغرق الموقع القياسي 4-8 أسابيع، بينما قد تستغرق التطبيقات المعقدة 3-6 أشهر. نقدم جداول زمنية مفصلة خلال مرحلة الاكتشاف." },
  { qEn: "Do you offer ongoing support?", qAr: "هل تقدمون دعمًا مستمرًا؟", aEn: "Absolutely. We offer flexible maintenance and support packages to keep your product running smoothly, including updates, monitoring, and feature enhancements.", aAr: "بالتأكيد. نقدم حزم صيانة ودعم مرنة للحفاظ على تشغيل منتجك بسلاسة، بما في ذلك التحديثات والمراقبة وتحسين الميزات." },
  { qEn: "What technologies do you specialize in?", qAr: "ما التقنيات التي تتخصصون فيها؟", aEn: "We specialize in React, Next.js, React Native, Node.js, and cloud infrastructure. Our team stays current with the latest tools to deliver cutting-edge solutions.", aAr: "نتخصص في React وNext.js وReact Native وNode.js والبنية التحتية السحابية. يبقى فريقنا على اطلاع بأحدث الأدوات لتقديم حلول متطورة." },
  { qEn: "How do you handle project communication?", qAr: "كيف تتعاملون مع التواصل في المشاريع؟", aEn: "We use a combination of regular video calls, shared project boards, and real-time messaging. You will have full visibility into progress with weekly updates and milestone reviews.", aAr: "نستخدم مزيجًا من مكالمات الفيديو المنتظمة ولوحات المشاريع المشتركة والرسائل الفورية. ستحصل على رؤية كاملة للتقدم مع تحديثات أسبوعية ومراجعات المراحل." },
];

/* ─── Animation Variants ────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const staggerUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: "easeOut" as const },
  }),
};

/* ─── Component ─────────────────────────────────────────────────── */

export function ServicesContent() {
  const t = useTranslations("services");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [modalService, setModalService] = useState<(typeof services)[0] | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const gridRef = useRef(null);
  const whyRef = useRef(null);
  const processRef = useRef(null);
  const techRef = useRef(null);
  const tableRef = useRef(null);
  const impactRef = useRef(null);
  const faqRef = useRef(null);
  const ctaRef = useRef(null);

  const gridInView = useInView(gridRef, { once: true, margin: "-80px" });
  const whyInView = useInView(whyRef, { once: true, margin: "-80px" });
  const processInView = useInView(processRef, { once: true, margin: "-80px" });
  const techInView = useInView(techRef, { once: true, margin: "-80px" });
  const tableInView = useInView(tableRef, { once: true, margin: "-80px" });
  const impactInView = useInView(impactRef, { once: true, margin: "-80px" });
  const faqInView = useInView(faqRef, { once: true, margin: "-80px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  const filteredServices = activeCategory === "all" ? services : services.filter((s) => s.category === activeCategory);

  const whyChooseUs = [
    { num: "01", en: "Expert Team", ar: "فريق خبراء", descEn: "Seasoned professionals with deep expertise across design, development, and strategy, delivering exceptional results on every project.", descAr: "محترفون متمرسون بخبرة عميقة في التصميم والتطوير والاستراتيجية، يقدمون نتائج استثنائية في كل مشروع." },
    { num: "02", en: "Proven Process", ar: "عملية مُثبتة", descEn: "Our refined methodology ensures transparency, predictability, and quality at every stage from concept to deployment.", descAr: "منهجيتنا المحسّنة تضمن الشفافية والتوقع والجودة في كل مرحلة من المفهوم إلى النشر." },
    { num: "03", en: "Results Driven", ar: "مدفوع بالنتائج", descEn: "We measure success by your success. Every decision is backed by data, ensuring measurable impact and real business growth.", descAr: "نقيس النجاح بنجاحك. كل قرار مدعوم بالبيانات، مما يضمن تأثيرًا قابلاً للقياس ونموًا حقيقيًا للأعمال." },
  ];

  return (
    <>
      {/* ─── 1. Premium Hero ────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingBlock: "var(--section-y)",
          background: "var(--color-background)",
        }}
      >
        {/* Layered radial gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 80% 100%, rgba(var(--color-primary-rgb) / 0.05) 0%, transparent 50%),
              radial-gradient(ellipse 40% 60% at 10% 60%, rgba(var(--color-primary-rgb) / 0.04) 0%, transparent 50%)
            `,
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Floating orb */}
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 300,
            height: 300,
            top: "10%",
            right: "5%",
            background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <Container>
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.08)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
              }}
            >
              <Layers className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
              <span className="text-xs font-semibold tracking-wide" style={{ color: "var(--color-primary)" }}>
                {isAr ? "خدمات احترافية" : "Premium Services"}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight"
              style={{ color: "var(--color-foreground)" }}
            >
              {t("title")}
            </motion.h1>

            {/* Accent bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 48 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-[3px] rounded-full mx-auto mt-5 mb-5"
              style={{ background: "var(--color-primary)" }}
            />

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
              style={{ color: "var(--color-foreground)", opacity: 0.7 }}
            >
              {t("subtitle")}
            </motion.p>
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ─── 2. Service Categories Filter ───────────────────────── */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="relative px-5 py-2 rounded-full text-sm font-medium cursor-pointer"
                style={{
                  color: activeCategory === cat.key ? "#ffffff" : "var(--color-foreground)",
                  background: activeCategory === cat.key ? "transparent" : "rgba(var(--color-primary-rgb) / 0.04)",
                  border: `1px solid ${activeCategory === cat.key ? "transparent" : "rgba(var(--color-primary-rgb) / 0.08)"}`,
                  transitionProperty: "color, background, border-color",
                  transitionDuration: "300ms",
                  transitionTimingFunction: "ease",
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== cat.key) {
                    e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.08)";
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat.key) {
                    e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)";
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)";
                  }
                }}
              >
                {activeCategory === cat.key && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--color-primary)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{isAr ? cat.ar : cat.en}</span>
              </button>
            ))}
          </motion.div>

          {/* ─── 3. Services Grid ─────────────────────────────────── */}
          <motion.div
            ref={gridRef}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate={gridInView ? "visible" : "hidden"}
          >
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, i) => (
                <motion.div
                  key={service.key}
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                    transitionProperty: "border-color, box-shadow, transform",
                    transitionDuration: "400ms",
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onClick={() => setModalService(service)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.2)";
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(var(--color-primary-rgb) / 0.08), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Top accent line */}
                  <div
                    className="h-[2px] w-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / ${0.3 + i * 0.1}), transparent)`,
                    }}
                  />

                  <div className="p-5">
                    {/* Icon + Category */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center relative overflow-hidden"
                        style={{
                          background: "rgba(var(--color-primary-rgb) / 0.08)",
                        }}
                      >
                        {/* Dot pattern inside icon */}
                        <div
                          className="absolute inset-0 opacity-[0.06]"
                          style={{
                            backgroundImage: "radial-gradient(circle at 1px 1px, var(--color-primary) 0.5px, transparent 0)",
                            backgroundSize: "8px 8px",
                          }}
                        />
                        <service.icon
                          className="h-5.5 w-5.5 relative z-10"
                          style={{
                            color: "var(--color-primary)",
                            transitionProperty: "transform",
                            transitionDuration: "400ms",
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                        style={{
                          color: "var(--color-primary)",
                          background: "rgba(var(--color-primary-rgb) / 0.06)",
                        }}
                      >
                        {isAr
                          ? categories.find((c) => c.key === service.category)?.ar
                          : categories.find((c) => c.key === service.category)?.en}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-lg font-bold mb-2"
                      style={{
                        color: "var(--color-foreground)",
                        transitionProperty: "color",
                        transitionDuration: "300ms",
                      }}
                    >
                      {t(service.key)}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-sm leading-relaxed mb-4"
                      style={{ color: "var(--color-foreground)", opacity: 0.6 }}
                    >
                      {t(`${service.key}Desc`)}
                    </p>

                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(isAr ? service.featuresAr : service.featuresEn).slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                          style={{
                            background: "rgba(var(--color-primary-rgb) / 0.05)",
                            color: "var(--color-primary)",
                            border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Learn More link */}
                    <div
                      className="flex items-center gap-1.5 text-sm font-semibold"
                      style={{
                        color: "var(--color-primary)",
                        opacity: 0,
                        transitionProperty: "opacity",
                        transitionDuration: "300ms",
                      }}
                      ref={(el) => {
                        if (!el) return;
                        const card = el.closest(".group");
                        if (!card) return;
                        card.addEventListener("mouseenter", () => { el.style.opacity = "1"; });
                        card.addEventListener("mouseleave", () => { el.style.opacity = "0"; });
                      }}
                    >
                      {tc("learnMore")}
                      <Arrow className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ─── 4. Why Choose Us ───────────────────────────────────── */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={isAr ? "لماذا تختارنا" : "Why Choose Us"}
            subtitle={isAr ? "مزايانا" : "Our Edge"}
          />

          <motion.div
            ref={whyRef}
            className="grid gap-6 md:grid-cols-3 mt-2"
          >
            {whyChooseUs.map((item, i) => (
              <motion.div
                key={item.num}
                custom={i}
                variants={staggerUp}
                initial="hidden"
                animate={whyInView ? "visible" : "hidden"}
                className="relative p-6 rounded-2xl overflow-hidden"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  transitionProperty: "border-color, box-shadow",
                  transitionDuration: "400ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(var(--color-primary-rgb) / 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Large number background */}
                <div
                  className="absolute top-3 right-4 text-6xl font-black leading-none pointer-events-none select-none"
                  style={{
                    color: "rgba(var(--color-primary-rgb) / 0.05)",
                  }}
                >
                  {item.num}
                </div>

                <div className="relative z-10">
                  <span
                    className="text-xs font-bold tracking-widest uppercase mb-3 block"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {item.num}
                  </span>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "var(--color-foreground)" }}>
                    {isAr ? item.ar : item.en}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)", opacity: 0.6 }}>
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ─── 5. Our Process ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
        }}
      >
        <Container>
          <SectionHeading
            title={isAr ? "كيف نعمل" : "Our Process"}
            subtitle={isAr ? "المنهجية" : "Methodology"}
          />

          <motion.div
            ref={processRef}
            className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-4"
          >
            {/* Connecting line (desktop) */}
            <div
              className="absolute top-16 left-[12.5%] right-[12.5%] h-[1px] hidden lg:block pointer-events-none"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.12)" }}
            />

            {processSteps.map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                variants={staggerUp}
                initial="hidden"
                animate={processInView ? "visible" : "hidden"}
                className="relative text-center cursor-pointer"
                onClick={() => setActiveStep(i)}
              >
                {/* Step circle */}
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center relative z-10"
                    style={{
                      background: activeStep === i ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.08)",
                      color: activeStep === i ? "#ffffff" : "var(--color-primary)",
                      transitionProperty: "background, color, box-shadow",
                      transitionDuration: "400ms",
                      boxShadow: activeStep === i ? "0 8px 24px rgba(var(--color-primary-rgb) / 0.25)" : "none",
                    }}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                  {/* Step number badge */}
                  <div
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold z-20"
                    style={{
                      background: "var(--color-card)",
                      color: "var(--color-primary)",
                      border: "2px solid rgba(var(--color-primary-rgb) / 0.15)",
                    }}
                  >
                    {step.num}
                  </div>
                </div>

                <h4
                  className="text-base font-bold mb-1.5"
                  style={{ color: activeStep === i ? "var(--color-primary)" : "var(--color-foreground)" }}
                >
                  {isAr ? step.ar : step.en}
                </h4>
                <p
                  className="text-xs leading-relaxed max-w-[200px] mx-auto"
                  style={{ color: "var(--color-foreground)", opacity: 0.55 }}
                >
                  {isAr ? step.descAr : step.descEn}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ─── 6. Technologies We Use ─────────────────────────────── */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={isAr ? "التقنيات التي نستخدمها" : "Technologies We Use"}
            subtitle={isAr ? "أدواتنا" : "Our Stack"}
          />

          <motion.div
            ref={techRef}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-2"
            variants={containerVariants}
            initial="hidden"
            animate={techInView ? "visible" : "hidden"}
          >
            {techCategories.map((cat) => (
              <motion.div
                key={cat.en}
                variants={itemVariants}
                className="p-5 rounded-2xl"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                }}
              >
                <h4
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: "var(--color-primary)" }}
                >
                  {isAr ? cat.ar : cat.en}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {cat.techs.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.05)",
                        color: "var(--color-foreground)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                        transitionProperty: "background, border-color",
                        transitionDuration: "300ms",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.1)";
                        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.05)";
                        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ─── 7. Service Comparison Table ─────────────────────────── */}
      <section
        className="relative"
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
        }}
      >
        <Container>
          <SectionHeading
            title={isAr ? "مقارنة الباقات" : "Compare Plans"}
            subtitle={isAr ? "الخطط" : "Packages"}
          />

          <motion.div
            ref={tableRef}
            initial={{ opacity: 0, y: 24 }}
            animate={tableInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-x-auto mt-2"
          >
            <table className="w-full min-w-[600px]" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th
                    className="text-left p-4 text-sm font-semibold"
                    style={{
                      color: "var(--color-foreground)",
                      borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                    }}
                  >
                    {isAr ? "الميزات" : "Features"}
                  </th>
                  {tiers.map((tier) => (
                    <th
                      key={tier.en}
                      className="p-4 text-center text-sm font-bold"
                      style={{
                        color: tier.highlighted ? "#ffffff" : "var(--color-foreground)",
                        background: tier.highlighted ? "var(--color-primary)" : "transparent",
                        borderBottom: tier.highlighted ? "none" : "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                        borderRadius: tier.highlighted ? "12px 12px 0 0" : undefined,
                      }}
                    >
                      {isAr ? tier.ar : tier.en}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tierFeatures.map((feature, fi) => (
                  <tr key={feature.en}>
                    <td
                      className="p-4 text-sm"
                      style={{
                        color: "var(--color-foreground)",
                        borderBottom: fi < tierFeatures.length - 1 ? "1px solid rgba(var(--color-primary-rgb) / 0.05)" : "none",
                      }}
                    >
                      {isAr ? feature.ar : feature.en}
                    </td>
                    {tiers.map((tier) => (
                      <td
                        key={tier.en}
                        className="p-4 text-center"
                        style={{
                          background: tier.highlighted ? "rgba(var(--color-primary-rgb) / 0.04)" : "transparent",
                          borderBottom: fi < tierFeatures.length - 1 ? "1px solid rgba(var(--color-primary-rgb) / 0.05)" : "none",
                          borderRadius: fi === tierFeatures.length - 1 && tier.highlighted ? "0 0 12px 12px" : undefined,
                        }}
                      >
                        {tier.features[fi] ? (
                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}>
                            <Check className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                          </div>
                        ) : (
                          <span className="inline-block h-[2px] w-4 rounded-full" style={{ background: "rgba(var(--color-primary-rgb) / 0.15)" }} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ─── 8. Client Results / Impact ──────────────────────────── */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={isAr ? "تأثيرنا بالأرقام" : "Our Impact in Numbers"}
            subtitle={isAr ? "النتائج" : "Results"}
          />

          <motion.div
            ref={impactRef}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mt-2"
          >
            {impactStats.map((stat, i) => (
              <motion.div
                key={stat.en}
                custom={i}
                variants={staggerUp}
                initial="hidden"
                animate={impactInView ? "visible" : "hidden"}
                className="relative p-6 rounded-2xl text-center overflow-hidden"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  transitionProperty: "border-color, box-shadow, transform",
                  transitionDuration: "400ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(var(--color-primary-rgb) / 0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Background glow */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0"
                  style={{
                    background: "radial-gradient(circle at 50% 50%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 70%)",
                    transitionProperty: "opacity",
                    transitionDuration: "400ms",
                  }}
                  ref={(el) => {
                    if (!el) return;
                    const card = el.parentElement;
                    if (!card) return;
                    card.addEventListener("mouseenter", () => { el.style.opacity = "1"; });
                    card.addEventListener("mouseleave", () => { el.style.opacity = "0"; });
                  }}
                />

                <div className="relative z-10">
                  <div
                    className="h-12 w-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}
                  >
                    <stat.icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div
                    className="text-3xl font-black mb-1"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--color-foreground)", opacity: 0.6 }}
                  >
                    {isAr ? stat.ar : stat.en}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ─── 9. FAQ Mini Section ─────────────────────────────────── */}
      <section
        className="relative"
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
        }}
      >
        <Container size="sm">
          <SectionHeading
            title={isAr ? "أسئلة شائعة" : "Frequently Asked Questions"}
            subtitle={isAr ? "الأسئلة" : "FAQ"}
          />

          <motion.div
            ref={faqRef}
            className="space-y-3 mt-2"
            variants={containerVariants}
            initial="hidden"
            animate={faqInView ? "visible" : "hidden"}
          >
            {faqData.map((faq, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                }}
              >
                <button
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--color-foreground)",
                  }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold pr-4">{isAr ? faq.qAr : faq.qEn}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-4 pb-4 text-sm leading-relaxed"
                        style={{
                          color: "var(--color-foreground)",
                          opacity: 0.65,
                          borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                          paddingTop: "12px",
                        }}
                      >
                        {isAr ? faq.aAr : faq.aEn}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ─── 10. Bottom CTA ──────────────────────────────────────── */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl overflow-hidden text-center"
            style={{
              padding: "clamp(40px, 8vw, 80px) clamp(24px, 5vw, 60px)",
              background: "var(--color-card)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
            }}
          >
            {/* Decorative gradient blobs */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse 50% 60% at 20% 20%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 60%),
                  radial-gradient(ellipse 50% 60% at 80% 80%, rgba(var(--color-primary-rgb) / 0.04) 0%, transparent 60%)
                `,
              }}
            />
            {/* Grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(var(--color-primary) 1px, transparent 1px),
                  linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={ctaInView ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
                className="h-14 w-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.1)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                }}
              >
                <Rocket className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
              </motion.div>

              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "var(--color-foreground)" }}
              >
                {isAr ? "لنبنِ شيئًا مذهلاً معًا" : "Let's Build Something Amazing"}
              </h2>

              <p
                className="text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8"
                style={{ color: "var(--color-foreground)", opacity: 0.6 }}
              >
                {isAr
                  ? "مستعدون لتحويل رؤيتك إلى واقع رقمي. تواصل معنا لبدء مشروعك القادم."
                  : "Ready to turn your vision into digital reality. Get in touch to start your next project."}
              </p>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold cursor-pointer"
                style={{
                  background: "var(--color-primary)",
                  color: "#ffffff",
                  transitionProperty: "box-shadow, transform",
                  transitionDuration: "400ms",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(var(--color-primary-rgb) / 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {isAr ? "تواصل معنا" : "Get in Touch"}
                <Arrow className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ─── Service Modal ───────────────────────────────────────── */}
      <Modal
        open={!!modalService}
        onClose={() => setModalService(null)}
        title={modalService ? t(modalService.key) : ""}
      >
        {modalService && (
          <div className="space-y-5">
            {/* Header with icon */}
            <div
              className="flex items-center gap-3 pb-4"
              style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}
              >
                <modalService.icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--color-foreground)" }}>
                  {t(modalService.key)}
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--color-foreground)", opacity: 0.5 }}>
                  {isAr ? "خدمة احترافية" : "Professional Service"}
                </p>
              </div>
            </div>

            {/* Description */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-foreground)", opacity: 0.7 }}
            >
              {t(`${modalService.key}Desc`)}
            </p>

            {/* Features list */}
            <div>
              <h4
                className="text-[11px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "var(--color-primary)" }}
              >
                {isAr ? "ما نقدمه" : "What We Offer"}
              </h4>
              <div className="space-y-2">
                {(isAr ? modalService.featuresAr : modalService.featuresEn).map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.03)",
                      border: "1px solid rgba(var(--color-primary-rgb) / 0.05)",
                    }}
                  >
                    <div
                      className="h-5 w-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
                    >
                      <Check className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                    </div>
                    <span className="text-[13px] font-medium" style={{ color: "var(--color-foreground)" }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/contact"
              className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: "var(--color-primary)",
                color: "#ffffff",
                transitionProperty: "box-shadow",
                transitionDuration: "300ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(var(--color-primary-rgb) / 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
              onClick={() => setModalService(null)}
            >
              {isAr ? "طلب هذه الخدمة" : "Request This Service"}
              <Arrow className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </Modal>
    </>
  );
}
