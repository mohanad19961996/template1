"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Globe,
  Smartphone,
  Palette,
  Layers,
  ShoppingCart,
  HeartPulse,
  Landmark,
  GraduationCap,
  Building2,
  UtensilsCrossed,
  Search,
  PenTool,
  Code2,
  Rocket,
  Quote,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";

/* ─────────────────────────── Data ─────────────────────────── */

const categories = [
  { key: "all", icon: Layers },
  { key: "web", icon: Globe },
  { key: "mobile", icon: Smartphone },
  { key: "branding", icon: Palette },
];

const projects = [
  {
    titleEn: "E-Commerce Platform",
    titleAr: "منصة تجارة إلكترونية",
    descEn: "Full-stack e-commerce solution with payment integration and inventory management.",
    descAr: "حل تجارة إلكترونية متكامل مع تكامل الدفع وإدارة المخزون.",
    category: "web",
    image: "https://picsum.photos/seed/project1/800/600",
    tags: ["Next.js", "Stripe", "PostgreSQL"],
  },
  {
    titleEn: "Health & Fitness App",
    titleAr: "تطبيق صحة ولياقة",
    descEn: "Cross-platform mobile app with real-time tracking and personalized workout plans.",
    descAr: "تطبيق جوال متعدد المنصات مع تتبع فوري وخطط تمارين مخصصة.",
    category: "mobile",
    image: "https://picsum.photos/seed/project2/800/600",
    tags: ["React Native", "Firebase", "AI"],
  },
  {
    titleEn: "Brand Identity — Luxe",
    titleAr: "هوية بصرية — لوكس",
    descEn: "Complete brand identity design including logo, typography, and brand guidelines.",
    descAr: "تصميم هوية بصرية شاملة تشمل الشعار والخطوط وإرشادات العلامة التجارية.",
    category: "branding",
    image: "https://picsum.photos/seed/project3/800/600",
    tags: ["Branding", "Figma", "Print"],
  },
  {
    titleEn: "SaaS Dashboard",
    titleAr: "لوحة تحكم SaaS",
    descEn: "Analytics dashboard with real-time data visualization and multi-tenant support.",
    descAr: "لوحة تحكم تحليلية مع عرض بيانات فوري ودعم متعدد المستأجرين.",
    category: "web",
    image: "https://picsum.photos/seed/project4/800/600",
    tags: ["React", "D3.js", "Node.js"],
  },
  {
    titleEn: "Food Delivery App",
    titleAr: "تطبيق توصيل طعام",
    descEn: "Real-time order tracking with driver matching and restaurant management portal.",
    descAr: "تتبع طلبات فوري مع مطابقة السائقين وبوابة إدارة المطاعم.",
    category: "mobile",
    image: "https://picsum.photos/seed/project5/800/600",
    tags: ["Flutter", "Maps API", "Socket.io"],
  },
  {
    titleEn: "Corporate Rebrand — Vertex",
    titleAr: "إعادة تصميم العلامة — فيرتكس",
    descEn: "Strategic rebrand for a tech company including digital and print collateral.",
    descAr: "إعادة تصميم استراتيجية لشركة تقنية تشمل المواد الرقمية والمطبوعة.",
    category: "branding",
    image: "https://picsum.photos/seed/project6/800/600",
    tags: ["Strategy", "Design System", "Motion"],
  },
];

const stats = [
  { valueEn: "120+", valueAr: "١٢٠+", labelEn: "Projects Delivered", labelAr: "مشروع تم تسليمه", icon: CheckCircle2 },
  { valueEn: "50+", valueAr: "٥٠+", labelEn: "Happy Clients", labelAr: "عميل سعيد", icon: Users },
  { valueEn: "15+", valueAr: "١٥+", labelEn: "Industries Served", labelAr: "قطاع تم خدمته", icon: TrendingUp },
  { valueEn: "98%", valueAr: "٩٨٪", labelEn: "On-Time Delivery", labelAr: "تسليم في الوقت", icon: Clock },
];

const industries = [
  { nameEn: "E-Commerce", nameAr: "التجارة الإلكترونية", icon: ShoppingCart },
  { nameEn: "Healthcare", nameAr: "الرعاية الصحية", icon: HeartPulse },
  { nameEn: "Finance", nameAr: "المالية", icon: Landmark },
  { nameEn: "Education", nameAr: "التعليم", icon: GraduationCap },
  { nameEn: "Real Estate", nameAr: "العقارات", icon: Building2 },
  { nameEn: "Food & Beverage", nameAr: "الأغذية والمشروبات", icon: UtensilsCrossed },
];

const processSteps = [
  { nameEn: "Research", nameAr: "البحث", descEn: "Deep dive into user needs, market analysis, and competitor landscape.", descAr: "تحليل عميق لاحتياجات المستخدمين والسوق والمنافسين.", icon: Search },
  { nameEn: "Design", nameAr: "التصميم", descEn: "Wireframes, prototypes, and pixel-perfect visual design systems.", descAr: "إطارات سلكية ونماذج أولية وأنظمة تصميم بصري متقنة.", icon: PenTool },
  { nameEn: "Develop", nameAr: "التطوير", descEn: "Clean, scalable code with modern frameworks and best practices.", descAr: "كود نظيف وقابل للتوسع باستخدام أحدث الأطر والممارسات.", icon: Code2 },
  { nameEn: "Launch", nameAr: "الإطلاق", descEn: "Thorough testing, deployment, and post-launch optimization.", descAr: "اختبار شامل ونشر وتحسين بعد الإطلاق.", icon: Rocket },
];

/* ─────────────────────── Animations ─────────────────────── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/* ─────────────────── Component ─────────────────── */

export function PortfolioContent() {
  const t = useTranslations("portfolio");
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const [activeFilter, setActiveFilter] = useState("all");

  /* Refs for scroll-triggered animations */
  const heroRef = useRef(null);
  const featuredRef = useRef(null);
  const gridRef = useRef(null);
  const statsRef = useRef(null);
  const industriesRef = useRef(null);
  const processRef = useRef(null);
  const testimonialRef = useRef(null);
  const ctaRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, margin: "-40px" });
  const featuredInView = useInView(featuredRef, { once: true, margin: "-60px" });
  const gridInView = useInView(gridRef, { once: true, margin: "-60px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });
  const industriesInView = useInView(industriesRef, { once: true, margin: "-60px" });
  const processInView = useInView(processRef, { once: true, margin: "-60px" });
  const testimonialInView = useInView(testimonialRef, { once: true, margin: "-60px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  const filtered =
    activeFilter === "all"
      ? projects
      : projects.filter((p) => p.category === activeFilter);

  const featuredProject = projects[0];

  return (
    <>
      {/* ══════════════════════════════════════════════════
          1. PREMIUM HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" ref={heroRef}>
        {/* Layered radial gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--color-primary-rgb) / 0.15) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 80% at 80% 50%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 40% 60% at 20% 80%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 60%)",
            }}
          />
        </div>

        {/* Animated dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(var(--color-primary-rgb) / 0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)",
          }}
        />

        <Container size="sm">
          <div
            className="relative z-10 flex flex-col items-center justify-center text-center"
            style={{ minHeight: "480px", paddingBlock: "var(--section-y)" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={heroInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.08)",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                  boxShadow: "0 0 20px rgba(var(--color-primary-rgb) / 0.08)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isAr ? "أعمالنا المميزة" : "Our Creative Work"}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-bold tracking-tight mb-4"
              style={{
                fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
                lineHeight: 1.1,
                color: "var(--color-foreground)",
              }}
            >
              {t("title")}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-lg mx-auto text-sm md:text-base leading-relaxed mb-8"
              style={{ color: "var(--color-foreground)", opacity: 0.7 }}
            >
              {t("subtitle")}
            </motion.p>

            {/* Project count highlight */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center gap-3"
            >
              <div
                className="flex items-center gap-3 px-5 py-2.5 rounded-2xl"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.05)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <span
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  120+
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-foreground)", opacity: 0.6 }}
                >
                  {isAr ? "مشروع مكتمل" : "Projects Completed"}
                </span>
              </div>
            </motion.div>
          </div>
        </Container>

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{
            background: "linear-gradient(to top, var(--color-background), transparent)",
          }}
        />
      </section>

      <SectionDivider />

      {/* ══════════════════════════════════════════════════
          2. FEATURED PROJECT
      ══════════════════════════════════════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={isAr ? "المشروع المميز" : "Featured Project"}
            subtitle={isAr ? "أبرز أعمالنا" : "Spotlight"}
          />

          <motion.div
            ref={featuredRef}
            initial={{ opacity: 0, y: 40 }}
            animate={featuredInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            className="group relative rounded-3xl overflow-hidden cursor-pointer"
            style={{
              background: "var(--color-card)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
              boxShadow: "0 4px 40px rgba(var(--color-primary-rgb) / 0.06)",
            }}
          >
            <div className="grid md:grid-cols-2">
              {/* Image side */}
              <div className="relative h-64 md:h-[420px] overflow-hidden">
                <Image
                  src={featuredProject.image}
                  alt={isAr ? featuredProject.titleAr : featuredProject.titleEn}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  priority
                />
                {/* Glass overlay on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.6)",
                    backdropFilter: "blur(4px)",
                    transition: "opacity 0.5s ease",
                  }}
                >
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.25)",
                    }}
                  >
                    <ExternalLink className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Category badge */}
                <div
                  className="absolute top-4 start-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.8)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {t(featuredProject.category)}
                </div>
              </div>

              {/* Content side */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <span
                  className="text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: "var(--color-primary)" }}
                >
                  {isAr ? "دراسة حالة" : "Case Study"}
                </span>

                <h3
                  className="text-xl md:text-2xl font-bold mb-3"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {isAr ? featuredProject.titleAr : featuredProject.titleEn}
                </h3>

                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: "var(--color-foreground)", opacity: 0.65 }}
                >
                  {isAr ? featuredProject.descAr : featuredProject.descEn}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {featuredProject.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.07)",
                        color: "var(--color-primary)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div>
                  <Link
                    href="/portfolio"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white"
                    style={{
                      background: "var(--color-primary)",
                      boxShadow: "0 4px 20px rgba(var(--color-primary-rgb) / 0.3)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    {isAr ? "عرض دراسة الحالة" : "View Case Study"}
                    <Arrow className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ══════════════════════════════════════════════════
          3. FILTER TABS + 4. PROJECT GRID
      ══════════════════════════════════════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={t("title")}
            subtitle={t("description")}
          />

          {/* Filter Tabs */}
          <div className="flex justify-center mb-12">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.04)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                boxShadow: "0 2px 20px rgba(var(--color-primary-rgb) / 0.04)",
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  className="relative px-5 py-2 rounded-full text-xs font-semibold cursor-pointer"
                  style={{
                    color:
                      activeFilter === cat.key
                        ? "white"
                        : "var(--color-foreground)",
                    opacity: activeFilter === cat.key ? 1 : 0.5,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  {activeFilter === cat.key && (
                    <motion.div
                      layoutId="portfolioFilterPill"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "var(--color-primary)",
                        boxShadow:
                          "0 4px 16px rgba(var(--color-primary-rgb) / 0.35)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <cat.icon className="h-3.5 w-3.5" />
                    {t(cat.key)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Grid */}
          <motion.div
            ref={gridRef}
            className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate={gridInView ? "visible" : "hidden"}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <motion.div
                  key={project.titleEn}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.3 } }}
                  className="group rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                    transition:
                      "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease",
                  }}
                  whileHover={{
                    y: -8,
                    transition: { duration: 0.3 },
                  }}
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={project.image}
                      alt={isAr ? project.titleAr : project.titleEn}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />

                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.7)",
                        transition: "opacity 0.4s ease",
                      }}
                    >
                      <div
                        className="h-11 w-11 rounded-full flex items-center justify-center text-white"
                        style={{
                          background: "rgba(255,255,255,0.15)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.25)",
                        }}
                      >
                        <ExternalLink className="h-4.5 w-4.5" />
                      </div>
                    </div>

                    {/* Category badge */}
                    <div
                      className="absolute top-3 start-3 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white"
                      style={{
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {t(project.category)}
                    </div>

                    {/* Spotlight glow on hover */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 100%, rgba(var(--color-primary-rgb) / 0.2) 0%, transparent 60%)",
                        transition: "opacity 0.5s ease",
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3
                      className="font-semibold text-sm mb-1.5"
                      style={{
                        color: "var(--color-foreground)",
                        transition: "color 0.3s ease",
                      }}
                    >
                      <span className="group-hover:text-[var(--color-primary)]" style={{ transition: "color 0.3s ease" }}>
                        {isAr ? project.titleAr : project.titleEn}
                      </span>
                    </h3>
                    <p
                      className="text-xs leading-relaxed mb-4"
                      style={{ color: "var(--color-foreground)", opacity: 0.6 }}
                    >
                      {isAr ? project.descAr : project.descEn}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-md text-[10px] font-medium"
                          style={{
                            background: "rgba(var(--color-primary-rgb) / 0.06)",
                            color: "var(--color-primary)",
                            border:
                              "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ══════════════════════════════════════════════════
          5. PROJECT STATS STRIP
      ══════════════════════════════════════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            ref={statsRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.labelEn}
                variants={itemVariants}
                className="relative text-center p-6 rounded-2xl overflow-hidden group"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  transition: "border-color 0.4s ease, box-shadow 0.4s ease",
                }}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.25 },
                }}
              >
                {/* Spotlight glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 0%, rgba(var(--color-primary-rgb) / 0.1) 0%, transparent 70%)",
                    transition: "opacity 0.5s ease",
                  }}
                />

                <div className="relative z-10">
                  <div
                    className="inline-flex items-center justify-center h-10 w-10 rounded-xl mb-3"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.08)",
                      color: "var(--color-primary)",
                    }}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div
                    className="text-2xl md:text-3xl font-bold mb-1"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {isAr ? stat.valueAr : stat.valueEn}
                  </div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: "var(--color-foreground)", opacity: 0.6 }}
                  >
                    {isAr ? stat.labelAr : stat.labelEn}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ══════════════════════════════════════════════════
          6. INDUSTRIES WE SERVE
      ══════════════════════════════════════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={isAr ? "القطاعات التي نخدمها" : "Industries We Serve"}
            subtitle={isAr ? "خبراتنا" : "Expertise"}
          />

          <motion.div
            ref={industriesRef}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate={industriesInView ? "visible" : "hidden"}
          >
            {industries.map((industry) => (
              <motion.div
                key={industry.nameEn}
                variants={itemVariants}
                className="group flex flex-col items-center text-center p-6 rounded-2xl cursor-default"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  transition: "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.3s ease",
                }}
                whileHover={{
                  y: -6,
                  transition: { duration: 0.25 },
                }}
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.07)",
                    color: "var(--color-primary)",
                  }}
                >
                  <industry.icon className="h-5.5 w-5.5" />
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {isAr ? industry.nameAr : industry.nameEn}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ══════════════════════════════════════════════════
          7. OUR DESIGN PROCESS
      ══════════════════════════════════════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={isAr ? "منهجيتنا في العمل" : "Our Design Process"}
            subtitle={isAr ? "كيف نعمل" : "How We Work"}
          />

          <motion.div
            ref={processRef}
            className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate={processInView ? "visible" : "hidden"}
          >
            {/* Connecting line (desktop only) */}
            <div
              className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-[2px] pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(var(--color-primary-rgb) / 0.2) 15%, rgba(var(--color-primary-rgb) / 0.2) 85%, transparent 100%)",
              }}
            />

            {processSteps.map((step, i) => (
              <motion.div
                key={step.nameEn}
                variants={itemVariants}
                className="relative flex flex-col items-center text-center p-6 rounded-2xl group"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  transition: "border-color 0.4s ease, box-shadow 0.4s ease",
                }}
                whileHover={{
                  y: -6,
                  transition: { duration: 0.25 },
                }}
              >
                {/* Step number */}
                <div
                  className="absolute -top-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: "var(--color-primary)",
                    color: "white",
                    boxShadow: "0 2px 10px rgba(var(--color-primary-rgb) / 0.3)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Icon */}
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4 mt-2"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.08)",
                    color: "var(--color-primary)",
                    transition: "background 0.3s ease",
                  }}
                >
                  <step.icon className="h-6 w-6" />
                </div>

                <h4
                  className="text-sm font-bold mb-2"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {isAr ? step.nameAr : step.nameEn}
                </h4>

                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--color-foreground)", opacity: 0.55 }}
                >
                  {isAr ? step.descAr : step.descEn}
                </p>

                {/* Arrow between steps (desktop) */}
                {i < processSteps.length - 1 && (
                  <div
                    className="hidden lg:flex absolute -end-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      background: "var(--color-background)",
                      border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Arrow className="h-3 w-3" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ══════════════════════════════════════════════════
          8. CLIENT TESTIMONIAL
      ══════════════════════════════════════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <motion.div
            ref={testimonialRef}
            initial={{ opacity: 0, y: 30 }}
            animate={testimonialInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            className="relative p-8 md:p-12 rounded-3xl text-center overflow-hidden"
            style={{
              background: "var(--color-card)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
              boxShadow: "0 8px 40px rgba(var(--color-primary-rgb) / 0.06)",
            }}
          >
            {/* Glass backdrop glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 60%)",
              }}
            />

            {/* Quote icon */}
            <div className="relative z-10">
              <div
                className="inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-6"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.08)",
                  color: "var(--color-primary)",
                }}
              >
                <Quote className="h-6 w-6" />
              </div>

              <blockquote
                className="text-base md:text-lg font-medium leading-relaxed mb-6 max-w-2xl mx-auto"
                style={{ color: "var(--color-foreground)", opacity: 0.85 }}
              >
                {isAr
                  ? "\"العمل مع هذا الفريق كان تجربة استثنائية. لقد حولوا رؤيتنا إلى واقع رقمي يفوق التوقعات. الاهتمام بالتفاصيل والجودة في كل مرحلة كان مذهلاً.\""
                  : "\"Working with this team was an exceptional experience. They transformed our vision into a digital reality that exceeded all expectations. The attention to detail and quality at every stage was remarkable.\""}
              </blockquote>

              {/* Client info */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white mb-2"
                  style={{
                    background: "var(--color-primary)",
                    boxShadow: "0 2px 12px rgba(var(--color-primary-rgb) / 0.3)",
                  }}
                >
                  {isAr ? "س ع" : "SA"}
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {isAr ? "سارة العبدالله" : "Sarah Abdullah"}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-foreground)", opacity: 0.5 }}
                >
                  {isAr ? "المديرة التنفيذية — شركة نوفا تك" : "CEO — Nova Tech"}
                </span>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ══════════════════════════════════════════════════
          9. BOTTOM CTA
      ══════════════════════════════════════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            className="relative p-10 md:p-14 rounded-3xl text-center overflow-hidden"
            style={{
              background: "var(--color-card)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
            }}
          >
            {/* Radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%)",
              }}
            />

            {/* Dot pattern */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(var(--color-primary-rgb) / 0.08) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                maskImage:
                  "radial-gradient(ellipse 50% 50% at 50% 50%, black 0%, transparent 70%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 50% 50% at 50% 50%, black 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10">
              <h2
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{ color: "var(--color-foreground)" }}
              >
                {isAr ? "هل لديك مشروع في ذهنك؟" : "Have a project in mind?"}
              </h2>

              <p
                className="text-sm leading-relaxed mb-8 max-w-md mx-auto"
                style={{ color: "var(--color-foreground)", opacity: 0.6 }}
              >
                {isAr
                  ? "دعنا نحول فكرتك إلى واقع رقمي مذهل. تواصل معنا اليوم لنبدأ رحلتك."
                  : "Let us transform your idea into a stunning digital reality. Get in touch today to start your journey."}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* Primary CTA */}
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white"
                  style={{
                    background: "var(--color-primary)",
                    boxShadow:
                      "0 4px 24px rgba(var(--color-primary-rgb) / 0.35)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  {isAr ? "تواصل معنا" : "Get in Touch"}
                  <Arrow className="h-4 w-4" />
                </Link>

                {/* Secondary CTA */}
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold"
                  style={{
                    color: "var(--color-primary)",
                    background: "rgba(var(--color-primary-rgb) / 0.06)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                    transition: "background 0.3s ease",
                  }}
                >
                  {isAr ? "خدماتنا" : "Our Services"}
                </Link>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
