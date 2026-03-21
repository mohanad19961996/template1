"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";

/* ─────────────────────────── DATA ─────────────────────────── */

interface ResultMetric {
  metricEn: string;
  metricAr: string;
  value: string;
  descEn: string;
  descAr: string;
}

interface Project {
  slug: string;
  titleEn: string;
  titleAr: string;
  clientEn: string;
  clientAr: string;
  categoryEn: string;
  categoryAr: string;
  year: string;
  heroImage: string;
  overviewEn: string;
  overviewAr: string;
  challengeEn: string;
  challengeAr: string;
  solutionEn: string;
  solutionAr: string;
  techStack: string[];
  results: ResultMetric[];
  galleryImages: string[];
  testimonialEn: string;
  testimonialAr: string;
  testimonialAuthorEn: string;
  testimonialAuthorAr: string;
}

const projects: Project[] = [
  {
    slug: "e-commerce-platform",
    titleEn: "E-Commerce Platform",
    titleAr: "منصة تجارة إلكترونية",
    clientEn: "RetailMax",
    clientAr: "ريتيل ماكس",
    categoryEn: "Web Development",
    categoryAr: "تطوير الويب",
    year: "2025",
    heroImage: "https://picsum.photos/seed/case1/1920/800",
    overviewEn:
      "A complete e-commerce solution built from the ground up, featuring real-time inventory management, multi-currency support, and a seamless checkout experience that increased conversion rates by 40%.",
    overviewAr:
      "حل تجارة إلكترونية متكامل مبني من الصفر، يتميز بإدارة مخزون فورية ودعم متعدد العملات وتجربة دفع سلسة زادت معدلات التحويل بنسبة 40%.",
    challengeEn:
      "RetailMax needed to replace their outdated e-commerce system that was losing customers due to slow load times and a confusing checkout process.",
    challengeAr:
      "احتاجت ريتيل ماكس لاستبدال نظام التجارة الإلكترونية القديم الذي كان يفقد العملاء بسبب بطء التحميل وعملية دفع مربكة.",
    solutionEn:
      "We built a modern, blazing-fast platform using Next.js with server-side rendering, optimized images, and a streamlined 3-step checkout flow.",
    solutionAr:
      "بنينا منصة حديثة فائقة السرعة باستخدام Next.js مع العرض من جانب الخادم وصور محسّنة وتدفق دفع مبسط من 3 خطوات.",
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Stripe", "Redis", "AWS"],
    results: [
      {
        metricEn: "Conversion Rate",
        metricAr: "معدل التحويل",
        value: "+40%",
        descEn: "Increase in checkout completion",
        descAr: "زيادة في إتمام عمليات الشراء",
      },
      {
        metricEn: "Page Load",
        metricAr: "سرعة التحميل",
        value: "0.8s",
        descEn: "Average page load time",
        descAr: "متوسط وقت تحميل الصفحة",
      },
      {
        metricEn: "Revenue",
        metricAr: "الإيرادات",
        value: "+65%",
        descEn: "Revenue growth in 6 months",
        descAr: "نمو الإيرادات في 6 أشهر",
      },
      {
        metricEn: "Uptime",
        metricAr: "وقت التشغيل",
        value: "99.9%",
        descEn: "System reliability",
        descAr: "موثوقية النظام",
      },
    ],
    galleryImages: [
      "https://picsum.photos/seed/case1a/800/600",
      "https://picsum.photos/seed/case1b/800/600",
      "https://picsum.photos/seed/case1c/800/600",
    ],
    testimonialEn:
      "The new platform exceeded our expectations. Sales have grown significantly and our customers love the new experience.",
    testimonialAr:
      "المنصة الجديدة تجاوزت توقعاتنا. نمت المبيعات بشكل كبير وعملاؤنا يحبون التجربة الجديدة.",
    testimonialAuthorEn: "Sarah Johnson, CEO",
    testimonialAuthorAr: "سارة جونسون، المديرة التنفيذية",
  },
  {
    slug: "health-fitness-app",
    titleEn: "Health & Fitness App",
    titleAr: "تطبيق الصحة واللياقة",
    clientEn: "FitLife Pro",
    clientAr: "فيت لايف برو",
    categoryEn: "Mobile Development",
    categoryAr: "تطوير التطبيقات",
    year: "2025",
    heroImage: "https://picsum.photos/seed/case2/1920/800",
    overviewEn:
      "A comprehensive health and fitness mobile application with AI-powered workout plans, nutrition tracking, real-time heart rate monitoring, and social challenges that boosted user retention by 55%.",
    overviewAr:
      "تطبيق صحة ولياقة شامل للهاتف المحمول مع خطط تمارين مدعومة بالذكاء الاصطناعي وتتبع التغذية ومراقبة معدل ضربات القلب في الوقت الفعلي وتحديات اجتماعية عززت الاحتفاظ بالمستخدمين بنسبة 55%.",
    challengeEn:
      "FitLife Pro wanted a single app to replace their fragmented set of tools — a workout tracker, a meal planner, and a community forum — into one seamless experience that keeps users engaged daily.",
    challengeAr:
      "أرادت فيت لايف برو تطبيقًا واحدًا يحل محل مجموعة أدواتها المتفرقة — متتبع تمارين ومخطط وجبات ومنتدى مجتمعي — في تجربة واحدة سلسة تحافظ على تفاعل المستخدمين يوميًا.",
    solutionEn:
      "We designed and developed a cross-platform mobile app using React Native with a custom AI engine for personalized workout and meal plans, integrated wearable device syncing, and gamified social features.",
    solutionAr:
      "صممنا وطورنا تطبيقًا متعدد المنصات باستخدام React Native مع محرك ذكاء اصطناعي مخصص لخطط التمارين والوجبات الشخصية ومزامنة الأجهزة القابلة للارتداء وميزات اجتماعية تفاعلية.",
    techStack: ["React Native", "TypeScript", "Node.js", "MongoDB", "TensorFlow", "Firebase"],
    results: [
      {
        metricEn: "User Retention",
        metricAr: "الاحتفاظ بالمستخدمين",
        value: "+55%",
        descEn: "Daily active user retention",
        descAr: "الاحتفاظ بالمستخدمين النشطين يوميًا",
      },
      {
        metricEn: "App Rating",
        metricAr: "تقييم التطبيق",
        value: "4.8",
        descEn: "Average store rating",
        descAr: "متوسط تقييم المتجر",
      },
      {
        metricEn: "Downloads",
        metricAr: "التنزيلات",
        value: "500K+",
        descEn: "Downloads in first quarter",
        descAr: "تنزيل في الربع الأول",
      },
      {
        metricEn: "Engagement",
        metricAr: "التفاعل",
        value: "23min",
        descEn: "Average daily session time",
        descAr: "متوسط وقت الجلسة اليومية",
      },
    ],
    galleryImages: [
      "https://picsum.photos/seed/case2a/800/600",
      "https://picsum.photos/seed/case2b/800/600",
      "https://picsum.photos/seed/case2c/800/600",
    ],
    testimonialEn:
      "Our users can't stop talking about the app. The AI workout plans feel truly personal, and the social challenges have built an amazing community.",
    testimonialAr:
      "مستخدمونا لا يتوقفون عن الحديث عن التطبيق. خطط التمارين بالذكاء الاصطناعي تبدو شخصية حقًا والتحديات الاجتماعية بنت مجتمعًا رائعًا.",
    testimonialAuthorEn: "Mark Chen, Founder",
    testimonialAuthorAr: "مارك تشين، المؤسس",
  },
  {
    slug: "brand-identity-luxe",
    titleEn: "Luxe Brand Identity",
    titleAr: "هوية علامة لوكس التجارية",
    clientEn: "Luxe Hotels",
    clientAr: "فنادق لوكس",
    categoryEn: "Branding",
    categoryAr: "تصميم الهوية",
    year: "2024",
    heroImage: "https://picsum.photos/seed/case3/1920/800",
    overviewEn:
      "A complete brand identity redesign for a luxury hotel chain, encompassing logo, typography, color system, packaging, environmental graphics, and a comprehensive digital style guide that elevated brand perception by 70%.",
    overviewAr:
      "إعادة تصميم كاملة للهوية التجارية لسلسلة فنادق فاخرة، شملت الشعار والطباعة ونظام الألوان والتغليف والرسومات البيئية ودليل أسلوب رقمي شامل رفع تصور العلامة التجارية بنسبة 70%.",
    challengeEn:
      "Luxe Hotels was expanding internationally but their dated branding didn't convey the premium, modern luxury experience their properties deliver.",
    challengeAr:
      "كانت فنادق لوكس تتوسع دوليًا لكن هويتها القديمة لم تنقل تجربة الفخامة العصرية المتميزة التي تقدمها ممتلكاتها.",
    solutionEn:
      "We crafted a refined, timeless brand identity that balances heritage with modernity — featuring a bespoke serif logotype, a sophisticated color palette, and tactile print materials that guests remember.",
    solutionAr:
      "صنعنا هوية علامة تجارية راقية وخالدة توازن بين التراث والحداثة — تتضمن شعارًا مخصصًا بخط سيريف ولوحة ألوان متطورة ومواد مطبوعة ملموسة يتذكرها الضيوف.",
    techStack: ["Figma", "Illustrator", "After Effects", "InDesign", "Photoshop", "Blender"],
    results: [
      {
        metricEn: "Brand Perception",
        metricAr: "تصور العلامة",
        value: "+70%",
        descEn: "Improvement in brand perception surveys",
        descAr: "تحسن في استطلاعات تصور العلامة التجارية",
      },
      {
        metricEn: "Social Growth",
        metricAr: "النمو الاجتماعي",
        value: "+120%",
        descEn: "Social media following increase",
        descAr: "زيادة في المتابعين على وسائل التواصل",
      },
      {
        metricEn: "Bookings",
        metricAr: "الحجوزات",
        value: "+35%",
        descEn: "Direct booking increase",
        descAr: "زيادة في الحجز المباشر",
      },
      {
        metricEn: "Brand Recall",
        metricAr: "تذكر العلامة",
        value: "92%",
        descEn: "Unaided brand recall rate",
        descAr: "معدل تذكر العلامة بدون مساعدة",
      },
    ],
    galleryImages: [
      "https://picsum.photos/seed/case3a/800/600",
      "https://picsum.photos/seed/case3b/800/600",
      "https://picsum.photos/seed/case3c/800/600",
    ],
    testimonialEn:
      "The rebrand transformed how the world sees us. Every touchpoint now reflects the luxury and attention to detail our guests experience in person.",
    testimonialAr:
      "أعادت الهوية الجديدة تشكيل نظرة العالم إلينا. كل نقطة اتصال الآن تعكس الفخامة والاهتمام بالتفاصيل التي يعيشها ضيوفنا شخصيًا.",
    testimonialAuthorEn: "Elena Marchetti, Brand Director",
    testimonialAuthorAr: "إيلينا ماركيتي، مديرة العلامة التجارية",
  },
];

/* ─────────────────────── ANIMATED COUNTER ─────────────────────── */

function AnimatedCounter({ value, inView }: { value: string; inView: boolean }) {
  const numericMatch = value.match(/([+-]?)(\d+\.?\d*)/);
  const prefix = value.match(/^[+-]/)?.[0] ?? "";
  const suffix = value.replace(/^[+-]?\d+\.?\d*/, "");
  const target = numericMatch ? parseFloat(numericMatch[2]) : 0;
  const isDecimal = value.includes(".");

  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 2000, bounce: 0 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) motionVal.set(target);
  }, [inView, target, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (v: number) => {
      setDisplay(isDecimal ? v.toFixed(1) : Math.round(v).toString());
    });
    return unsubscribe;
  }, [spring, isDecimal]);

  return (
    <span>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */

export function CaseStudyContent({ slug }: { slug: string }) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const project = projects.find((p) => p.slug === slug) ?? projects[0];
  const currentIndex = projects.findIndex((p) => p.slug === project.slug);
  const prevProject = projects[(currentIndex - 1 + projects.length) % projects.length];
  const nextProject = projects[(currentIndex + 1) % projects.length];

  /* ── refs ── */
  const heroRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const challengeRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const testimonialRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true });
  const overviewInView = useInView(overviewRef, { once: true, margin: "-80px" });
  const challengeInView = useInView(challengeRef, { once: true, margin: "-80px" });
  const solutionInView = useInView(solutionRef, { once: true, margin: "-80px" });
  const techInView = useInView(techRef, { once: true, margin: "-80px" });
  const resultsInView = useInView(resultsRef, { once: true, margin: "-80px" });
  const galleryInView = useInView(galleryRef, { once: true, margin: "-80px" });
  const testimonialInView = useInView(testimonialRef, { once: true, margin: "-80px" });
  const navInView = useInView(navRef, { once: true, margin: "-80px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  const t = (en: string, ar: string) => (isAr ? ar : en);

  /* ── approach cards ── */
  const approachCards = [
    {
      titleEn: "Modern Architecture",
      titleAr: "بنية حديثة",
      descEn: "Built with scalable, maintainable architecture using industry best practices and cutting-edge technologies.",
      descAr: "مبنية بهندسة قابلة للتوسع وسهلة الصيانة باستخدام أفضل ممارسات الصناعة وأحدث التقنيات.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      titleEn: "User-First Design",
      titleAr: "تصميم يركز على المستخدم",
      descEn: "Every interaction is carefully crafted to deliver an intuitive, delightful experience that users love.",
      descAr: "كل تفاعل مصمم بعناية لتقديم تجربة بديهية وممتعة يحبها المستخدمون.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      titleEn: "Performance Focus",
      titleAr: "التركيز على الأداء",
      descEn: "Optimized for speed, accessibility, and reliability to ensure the best possible user experience at scale.",
      descAr: "محسّن للسرعة وإمكانية الوصول والموثوقية لضمان أفضل تجربة مستخدم ممكنة على نطاق واسع.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
  ];

  /* ─────────────────────────── RENDER ─────────────────────────── */

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* ═══════ 1. PROJECT HERO ═══════ */}
      <section ref={heroRef} className="relative w-full overflow-hidden" style={{ height: "85vh", minHeight: 540 }}>
        {/* Background image */}
        <Image
          src={project.heroImage}
          alt={t(project.titleEn, project.titleAr)}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* Overlay layers */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)" }} />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.2) 0%, transparent 60%)" }}
        />

        {/* Content */}
        <Container className="relative z-10 h-full flex flex-col justify-end pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Category badge */}
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase mb-4"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.25)",
                color: "#fff",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.4)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-primary)" }} />
              {t(project.categoryEn, project.categoryAr)}
            </motion.span>

            {/* Year */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 0.7 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-sm font-medium mb-3"
              style={{ color: "#fff" }}
            >
              {project.year}
            </motion.p>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-3"
              style={{ color: "#fff" }}
            >
              {t(project.titleEn, project.titleAr)}
            </motion.h1>

            {/* Client */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg md:text-xl font-medium"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {t("Client: ", "العميل: ")}
              {t(project.clientEn, project.clientAr)}
            </motion.p>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>
              {t("Scroll", "مرر")}
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
              style={{ borderColor: "rgba(255,255,255,0.4)" }}
            >
              <div className="w-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.8)" }} />
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* ═══════ 2. PROJECT OVERVIEW ═══════ */}
      <section ref={overviewRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
            {/* Left — Overview text */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: isAr ? 40 : -40 }}
              animate={overviewInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <SectionHeading
                subtitle={t("Overview", "نظرة عامة")}
                title={t("About the Project", "عن المشروع")}
                align="start"
              />
              <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--color-foreground)", opacity: 0.85 }}>
                {t(project.overviewEn, project.overviewAr)}
              </p>
            </motion.div>

            {/* Right — Quick facts card */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: isAr ? -40 : 40 }}
              animate={overviewInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="rounded-2xl p-6 md:p-8 space-y-5"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                  boxShadow: "0 8px 32px rgba(var(--color-primary-rgb) / 0.06)",
                }}
              >
                <h3 className="text-sm font-semibold tracking-widest uppercase" style={{ color: "var(--color-primary)" }}>
                  {t("Quick Facts", "حقائق سريعة")}
                </h3>

                {[
                  { labelEn: "Client", labelAr: "العميل", val: t(project.clientEn, project.clientAr) },
                  { labelEn: "Category", labelAr: "الفئة", val: t(project.categoryEn, project.categoryAr) },
                  { labelEn: "Year", labelAr: "السنة", val: project.year },
                  { labelEn: "Duration", labelAr: "المدة", val: t("3 months", "3 أشهر") },
                  { labelEn: "Team Size", labelAr: "حجم الفريق", val: t("6 members", "6 أعضاء") },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "var(--color-foreground)", opacity: 0.6 }}>
                      {t(item.labelEn, item.labelAr)}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 3. THE CHALLENGE ═══════ */}
      <section ref={challengeRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <SectionHeading
            subtitle={t("The Challenge", "التحدي")}
            title={t("Problem Statement", "بيان المشكلة")}
          />

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={challengeInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative rounded-2xl p-8 md:p-12"
            style={{
              background: "var(--color-card)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
              boxShadow: "0 12px 40px rgba(var(--color-primary-rgb) / 0.06)",
            }}
          >
            {/* Decorative quote mark */}
            <div
              className="absolute top-4 start-6 text-7xl md:text-8xl font-serif leading-none pointer-events-none select-none"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.12)" }}
            >
              &ldquo;
            </div>

            {/* Accent bar */}
            <div
              className="absolute top-0 start-0 w-1 h-full rounded-s-2xl"
              style={{ background: "var(--color-primary)" }}
            />

            <p
              className="relative text-base md:text-lg leading-relaxed"
              style={{ color: "var(--color-foreground)", opacity: 0.9, paddingInlineStart: "1rem" }}
            >
              {t(project.challengeEn, project.challengeAr)}
            </p>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 4. OUR SOLUTION ═══════ */}
      <section ref={solutionRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={t("Our Solution", "حلنا")}
            title={t("How We Solved It", "كيف حللنا المشكلة")}
          />

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={solutionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-12 md:mb-16"
            style={{ color: "var(--color-foreground)", opacity: 0.85 }}
          >
            {t(project.solutionEn, project.solutionAr)}
          </motion.p>

          {/* Approach cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {approachCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                animate={solutionInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="group relative rounded-2xl p-6 md:p-8 text-center transition-all duration-300"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                  boxShadow: "0 4px 24px rgba(var(--color-primary-rgb) / 0.04)",
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(circle at center, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 70%)" }}
                />

                <div
                  className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.1)",
                    color: "var(--color-primary)",
                  }}
                >
                  {card.icon}
                </div>

                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-foreground)" }}>
                  {t(card.titleEn, card.titleAr)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)", opacity: 0.7 }}>
                  {t(card.descEn, card.descAr)}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 5. TECH STACK ═══════ */}
      <section
        ref={techRef}
        style={{
          paddingBlock: "var(--section-y)",
          background: "var(--color-card)",
        }}
      >
        <Container>
          <SectionHeading
            subtitle={t("Tech Stack", "التقنيات المستخدمة")}
            title={t("Technologies Used", "التقنيات المستخدمة")}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={techInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4"
          >
            {project.techStack.map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={techInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
                className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.08)",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                }}
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 6. RESULTS & IMPACT ═══════ */}
      <section ref={resultsRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={t("Results", "النتائج")}
            title={t("Impact & Outcomes", "الأثر والنتائج")}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {project.results.map((result, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                animate={resultsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl p-6 md:p-8 text-center overflow-hidden"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                  boxShadow: "0 8px 32px rgba(var(--color-primary-rgb) / 0.05)",
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 inset-x-0 h-[2px]"
                  style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }}
                />

                {/* Background glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(circle at 50% 0%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 60%)",
                  }}
                />

                <div
                  className="relative text-3xl md:text-4xl font-bold mb-2"
                  style={{ color: "var(--color-primary)" }}
                >
                  <AnimatedCounter value={result.value} inView={resultsInView} />
                </div>

                <h4 className="relative text-sm font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
                  {t(result.metricEn, result.metricAr)}
                </h4>

                <p className="relative text-xs leading-relaxed" style={{ color: "var(--color-foreground)", opacity: 0.6 }}>
                  {t(result.descEn, result.descAr)}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 7. PROJECT GALLERY ═══════ */}
      <section ref={galleryRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={t("Gallery", "معرض الصور")}
            title={t("Project Showcase", "عرض المشروع")}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {project.galleryImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  boxShadow: "0 8px 32px rgba(var(--color-primary-rgb) / 0.08)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                }}
              >
                <Image
                  src={img}
                  alt={`${t(project.titleEn, project.titleAr)} - ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(to top, rgba(var(--color-primary-rgb) / 0.3) 0%, transparent 60%)",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 8. CLIENT TESTIMONIAL ═══════ */}
      <section
        ref={testimonialRef}
        style={{
          paddingBlock: "var(--section-y)",
          background: "var(--color-card)",
        }}
      >
        <Container size="sm">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={testimonialInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl p-8 md:p-12 text-center"
            style={{
              background: "var(--color-background)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
              boxShadow: "0 16px 48px rgba(var(--color-primary-rgb) / 0.08)",
            }}
          >
            {/* Decorative quotes */}
            <div
              className="absolute top-4 left-8 text-8xl font-serif leading-none pointer-events-none select-none"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.1)" }}
            >
              &ldquo;
            </div>
            <div
              className="absolute bottom-4 right-8 text-8xl font-serif leading-none pointer-events-none select-none"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.1)" }}
            >
              &rdquo;
            </div>

            {/* Top accent */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[2px] rounded-full"
              style={{ background: "var(--color-primary)" }}
            />

            <div className="relative">
              {/* Star icon */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="var(--color-primary)"
                    stroke="none"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>

              <blockquote
                className="text-lg md:text-xl leading-relaxed font-medium mb-6"
                style={{ color: "var(--color-foreground)" }}
              >
                {t(project.testimonialEn, project.testimonialAr)}
              </blockquote>

              {/* Divider */}
              <div
                className="w-10 h-[1px] mx-auto mb-4"
                style={{ background: "rgba(var(--color-primary-rgb) / 0.3)" }}
              />

              <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                {t(project.testimonialAuthorEn, project.testimonialAuthorAr)}
              </p>
            </div>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 9. NEXT/PREV PROJECT NAVIGATION ═══════ */}
      <section ref={navRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={t("Explore More", "استكشف المزيد")}
            title={t("Other Projects", "مشاريع أخرى")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {[
              { project: prevProject, labelEn: "Previous Project", labelAr: "المشروع السابق" },
              { project: nextProject, labelEn: "Next Project", labelAr: "المشروع التالي" },
            ].map((item, i) => (
              <motion.div
                key={item.project.slug}
                initial={{ opacity: 0, y: 32 }}
                animate={navInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.12 }}
              >
                <Link
                  href={`/portfolio/${item.project.slug}`}
                  className="group block relative rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    boxShadow: "0 4px 24px rgba(var(--color-primary-rgb) / 0.04)",
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={item.project.heroImage}
                      alt={t(item.project.titleEn, item.project.titleAr)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }}
                    />

                    {/* Text overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-5 md:p-6">
                      <span
                        className="text-xs font-medium tracking-wider uppercase mb-1 block"
                        style={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        {t(item.labelEn, item.labelAr)}
                      </span>
                      <h3 className="text-lg md:text-xl font-bold" style={{ color: "#fff" }}>
                        {t(item.project.titleEn, item.project.titleAr)}
                      </h3>
                      <span
                        className="text-xs font-medium mt-1 block"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {t(item.project.categoryEn, item.project.categoryAr)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div
                    className="absolute top-4 rounded-full w-9 h-9 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      [i === 0 ? (isAr ? "left" : "right") : isAr ? "right" : "left"]: "1rem",
                      background: "rgba(var(--color-primary-rgb) / 0.2)",
                      backdropFilter: "blur(8px)",
                      color: "#fff",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ transform: i === 0 ? "rotate(180deg)" : "none" }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 10. CTA ═══════ */}
      <section
        ref={ctaRef}
        className="relative overflow-hidden"
        style={{ paddingBlock: "var(--section-y)" }}
      >
        {/* Layered background */}
        <div className="absolute inset-0" style={{ background: "var(--color-card)" }} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%)",
          }}
        />

        <Container size="sm" className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={ctaInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.1)",
                color: "var(--color-primary)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>

            <h2
              className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4"
              style={{ color: "var(--color-foreground)" }}
            >
              {t("Have a Similar Project?", "لديك مشروع مشابه؟")}
            </h2>

            <p
              className="text-base md:text-lg leading-relaxed max-w-lg mx-auto mb-8"
              style={{ color: "var(--color-foreground)", opacity: 0.7 }}
            >
              {t(
                "Let's discuss how we can bring your vision to life with the same level of craft and attention to detail.",
                "دعنا نناقش كيف يمكننا تحويل رؤيتك إلى واقع بنفس مستوى الحرفية والاهتمام بالتفاصيل."
              )}
            </p>

            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: "var(--color-primary)",
                color: "var(--color-background)",
                boxShadow: "0 4px 20px rgba(var(--color-primary-rgb) / 0.3)",
              }}
            >
              {t("Get in Touch", "تواصل معنا")}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-1"
                style={{ transform: isAr ? "rotate(180deg)" : "none" }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
