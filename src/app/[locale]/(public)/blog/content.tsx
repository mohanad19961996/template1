"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSiteConfig } from "@/providers/site-config-provider";
import { DEFAULT_PAGES_CONTENT, type SectionConfig } from "@/lib/site-config";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Search,
  Mail,
  Monitor,
  Palette,
  Target,
  Megaphone,
  Layers,
  ChevronRight,
  ChevronLeft,
  Tag,
  Sparkles,
  PenTool,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

/* ─── Smooth easing ────────────────────────────────────────────── */
const smoothEase = [0.16, 1, 0.3, 1] as const;

/* ─── Article Data ─────────────────────────────────────────────── */

const articles = [
  {
    slug: "future-of-web-development-2025",
    titleEn: "The Future of Web Development in 2025",
    titleAr: "مستقبل تطوير الويب في 2025",
    excerptEn:
      "Explore the latest trends shaping the web development landscape, from AI-powered tools to edge computing and beyond.",
    excerptAr:
      "استكشف أحدث الاتجاهات التي تشكل مشهد تطوير الويب، من أدوات الذكاء الاصطناعي إلى الحوسبة الطرفية وما بعدها.",
    image: "https://picsum.photos/seed/blog1/800/500",
    category: "technology",
    categoryEn: "Technology",
    categoryAr: "تقنية",
    authorEn: "Mohammed Ahmed",
    authorAr: "محمد أحمد",
    authorImage: "https://picsum.photos/seed/team1/100/100",
    date: "2025-03-15",
    readTime: 8,
    featured: true,
  },
  {
    slug: "design-systems-at-scale",
    titleEn: "Building Design Systems at Scale",
    titleAr: "بناء أنظمة التصميم على نطاق واسع",
    excerptEn:
      "How to create and maintain design systems that scale across teams, products, and platforms while staying consistent.",
    excerptAr:
      "كيفية إنشاء وصيانة أنظمة تصميم قابلة للتوسع عبر الفرق والمنتجات والمنصات مع الحفاظ على الاتساق.",
    image: "https://picsum.photos/seed/blog2/800/500",
    category: "design",
    categoryEn: "Design",
    categoryAr: "تصميم",
    authorEn: "Noura Al-Salem",
    authorAr: "نورة السالم",
    authorImage: "https://picsum.photos/seed/team2/100/100",
    date: "2025-03-10",
    readTime: 6,
    featured: false,
  },
  {
    slug: "ai-transforming-business",
    titleEn: "How AI is Transforming Modern Business",
    titleAr: "كيف يغير الذكاء الاصطناعي الأعمال الحديثة",
    excerptEn:
      "From automation to predictive analytics, discover how AI is revolutionizing the way businesses operate and grow.",
    excerptAr:
      "من الأتمتة إلى التحليلات التنبؤية، اكتشف كيف يحدث الذكاء الاصطناعي ثورة في طريقة عمل الشركات ونموها.",
    image: "https://picsum.photos/seed/blog3/800/500",
    category: "technology",
    categoryEn: "Technology",
    categoryAr: "تقنية",
    authorEn: "Fahd Al-Omari",
    authorAr: "فهد العمري",
    authorImage: "https://picsum.photos/seed/team3/100/100",
    date: "2025-03-05",
    readTime: 10,
    featured: true,
  },
  {
    slug: "mobile-first-strategy",
    titleEn: "Why Mobile-First Strategy is Non-Negotiable",
    titleAr: "لماذا استراتيجية الجوال أولاً غير قابلة للتفاوض",
    excerptEn:
      "With over 60% of web traffic coming from mobile devices, a mobile-first approach is essential for business success.",
    excerptAr:
      "مع أكثر من 60% من حركة الويب قادمة من الأجهزة المحمولة، فإن نهج الجوال أولاً ضروري لنجاح الأعمال.",
    image: "https://picsum.photos/seed/blog4/800/500",
    category: "strategy",
    categoryEn: "Strategy",
    categoryAr: "استراتيجية",
    authorEn: "Reem Al-Harbi",
    authorAr: "ريم الحربي",
    authorImage: "https://picsum.photos/seed/team4/100/100",
    date: "2025-02-28",
    readTime: 5,
    featured: false,
  },
  {
    slug: "ux-research-methods",
    titleEn: "Essential UX Research Methods for 2025",
    titleAr: "أساليب بحث تجربة المستخدم الأساسية لعام 2025",
    excerptEn:
      "A comprehensive guide to the most effective UX research methods that will help you build products users love.",
    excerptAr:
      "دليل شامل لأكثر أساليب بحث تجربة المستخدم فعالية التي ستساعدك في بناء منتجات يحبها المستخدمون.",
    image: "https://picsum.photos/seed/blog5/800/500",
    category: "design",
    categoryEn: "Design",
    categoryAr: "تصميم",
    authorEn: "Noura Al-Salem",
    authorAr: "نورة السالم",
    authorImage: "https://picsum.photos/seed/team2/100/100",
    date: "2025-02-20",
    readTime: 7,
    featured: false,
  },
  {
    slug: "seo-best-practices",
    titleEn: "SEO Best Practices for Maximum Visibility",
    titleAr: "أفضل ممارسات تحسين محركات البحث لأقصى ظهور",
    excerptEn:
      "Master the art of SEO with proven strategies that will boost your website's ranking and drive organic traffic.",
    excerptAr:
      "أتقن فن تحسين محركات البحث باستراتيجيات مثبتة ترفع ترتيب موقعك وتجذب حركة مرور عضوية.",
    image: "https://picsum.photos/seed/blog6/800/500",
    category: "marketing",
    categoryEn: "Marketing",
    categoryAr: "تسويق",
    authorEn: "Reem Al-Harbi",
    authorAr: "ريم الحربي",
    authorImage: "https://picsum.photos/seed/team4/100/100",
    date: "2025-02-15",
    readTime: 9,
    featured: false,
  },
  {
    slug: "react-performance-optimization",
    titleEn: "React Performance Optimization Techniques",
    titleAr: "تقنيات تحسين أداء React",
    excerptEn:
      "Learn advanced techniques to optimize your React applications for blazing-fast performance and better user experience.",
    excerptAr:
      "تعلم تقنيات متقدمة لتحسين تطبيقات React الخاصة بك لأداء فائق السرعة وتجربة مستخدم أفضل.",
    image: "https://picsum.photos/seed/blog7/800/500",
    category: "technology",
    categoryEn: "Technology",
    categoryAr: "تقنية",
    authorEn: "Fahd Al-Omari",
    authorAr: "فهد العمري",
    authorImage: "https://picsum.photos/seed/team3/100/100",
    date: "2025-02-10",
    readTime: 12,
    featured: false,
  },
  {
    slug: "brand-storytelling",
    titleEn: "The Power of Brand Storytelling",
    titleAr: "قوة سرد قصة العلامة التجارية",
    excerptEn:
      "How to craft compelling brand narratives that resonate with your audience and build lasting emotional connections.",
    excerptAr:
      "كيفية صياغة روايات مقنعة للعلامة التجارية تتواصل مع جمهورك وتبني روابط عاطفية دائمة.",
    image: "https://picsum.photos/seed/blog8/800/500",
    category: "marketing",
    categoryEn: "Marketing",
    categoryAr: "تسويق",
    authorEn: "Reem Al-Harbi",
    authorAr: "ريم الحربي",
    authorImage: "https://picsum.photos/seed/team4/100/100",
    date: "2025-02-05",
    readTime: 6,
    featured: false,
  },
  {
    slug: "cybersecurity-essentials",
    titleEn: "Cybersecurity Essentials for Every Business",
    titleAr: "أساسيات الأمن السيبراني لكل شركة",
    excerptEn:
      "Protect your business from cyber threats with these essential security measures and best practices.",
    excerptAr:
      "احمِ عملك من التهديدات السيبرانية بهذه الإجراءات الأمنية الأساسية وأفضل الممارسات.",
    image: "https://picsum.photos/seed/blog9/800/500",
    category: "technology",
    categoryEn: "Technology",
    categoryAr: "تقنية",
    authorEn: "Mohammed Ahmed",
    authorAr: "محمد أحمد",
    authorImage: "https://picsum.photos/seed/team1/100/100",
    date: "2025-01-28",
    readTime: 8,
    featured: false,
  },
];

/* ─── Categories ───────────────────────────────────────────────── */

type Category = "all" | "technology" | "design" | "strategy" | "marketing";

const categories: {
  key: Category;
  labelEn: string;
  labelAr: string;
  icon: typeof Monitor;
}[] = [
  { key: "all", labelEn: "All", labelAr: "الكل", icon: Layers },
  { key: "technology", labelEn: "Technology", labelAr: "تقنية", icon: Monitor },
  { key: "design", labelEn: "Design", labelAr: "تصميم", icon: Palette },
  { key: "strategy", labelEn: "Strategy", labelAr: "استراتيجية", icon: Target },
  { key: "marketing", labelEn: "Marketing", labelAr: "تسويق", icon: Megaphone },
];

/* ─── Tags ─────────────────────────────────────────────────────── */

const tags = [
  "React",
  "Next.js",
  "UI/UX",
  "SEO",
  "AI",
  "Mobile",
  "Branding",
  "Performance",
  "Security",
  "TypeScript",
];

/* ─── Helpers ──────────────────────────────────────────────────── */

function formatDate(dateStr: string, isAr: boolean) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ─── Hero Section ─────────────────────────────────────────────── */

function HeroSection({
  t,
  isAr,
}: {
  t: ReturnType<typeof useTranslations>;
  isAr: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section
      ref={ref}
      style={{
        paddingBlock: "var(--section-y)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Layered gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--color-primary-rgb) / 0.15) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 60%),
            var(--color-background)
          `,
          zIndex: 0,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(var(--color-primary-rgb) / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{
          y: [0, 15, 0],
          x: [0, -12, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        style={{
          position: "absolute",
          top: "40%",
          right: "8%",
          width: 160,
          height: 160,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.1) 0%, transparent 70%)",
          filter: "blur(50px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{
          y: [0, -10, 0],
          x: [0, 8, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        style={{
          position: "absolute",
          bottom: "10%",
          left: "30%",
          width: 100,
          height: 100,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)",
          filter: "blur(35px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <Container>
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: smoothEase }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: 999,
              background: "rgba(var(--color-primary-rgb) / 0.1)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
              marginBottom: 24,
            }}
          >
            <BookOpen size={16} style={{ color: "var(--color-primary)" }} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-primary)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {t("subtitle")}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: smoothEase }}
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "var(--color-foreground)",
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            {t("title")}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: smoothEase }}
            style={{
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              lineHeight: 1.7,
              color: "var(--color-foreground)",
              opacity: 0.7,
              maxWidth: 560,
            }}
          >
            {t("description")}
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.45, ease: smoothEase }}
            style={{
              width: 60,
              height: 3,
              borderRadius: 999,
              background: "var(--color-primary)",
              marginTop: 28,
            }}
          />
        </div>
      </Container>
    </section>
  );
}

/* ─── Featured Articles ────────────────────────────────────────── */

function FeaturedArticles({
  t,
  isAr,
  sectionConfig,
}: {
  t: ReturnType<typeof useTranslations>;
  isAr: boolean;
  sectionConfig?: SectionConfig;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const featured = articles.filter((a) => a.featured);
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section ref={ref} style={{ paddingBlock: "var(--section-y)" }}>
      <Container>
        <SectionHeading
          subtitle={isAr ? (sectionConfig?.subtitleAr || "مقالات مميزة") : (sectionConfig?.subtitleEn || "Featured")}
          title={isAr ? (sectionConfig?.titleAr || "المقالات المختارة") : (sectionConfig?.titleEn || "Editor's Picks")}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 24,
          }}
          className="md:!grid-cols-[1.4fr_1fr]"
        >
          {featured.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: i * 0.15,
                ease: smoothEase,
              }}
            >
              <Link
                href={`/blog/${article.slug}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: "relative",
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "var(--color-card)",
                    border: `1px solid rgba(var(--color-primary-rgb) / ${hovered === i ? "0.3" : "0.08"})`,
                    boxShadow:
                      hovered === i
                        ? "0 20px 60px rgba(var(--color-primary-rgb) / 0.12), 0 8px 24px rgba(var(--color-foreground-rgb, 0 0 0) / 0.08)"
                        : "0 4px 20px rgba(var(--color-foreground-rgb, 0 0 0) / 0.04)",
                    transform: hovered === i ? "translateY(-6px)" : "translateY(0)",
                    transition:
                      "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: i === 0 ? "16 / 9" : "16 / 10",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={article.image}
                      alt={isAr ? article.titleAr : article.titleEn}
                      fill
                      style={{
                        objectFit: "cover",
                        transform: hovered === i ? "scale(1.05)" : "scale(1)",
                        transition:
                          "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                    {/* Overlay gradient */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                      }}
                    />
                    {/* Category badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 16,
                        left: isAr ? "auto" : 16,
                        right: isAr ? 16 : "auto",
                        padding: "6px 14px",
                        borderRadius: 999,
                        background: "rgba(var(--color-primary-rgb) / 0.85)",
                        backdropFilter: "blur(8px)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#ffffff",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {isAr ? article.categoryAr : article.categoryEn}
                    </div>
                    {/* Featured badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 16,
                        right: isAr ? "auto" : 16,
                        left: isAr ? 16 : "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(8px)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#ffffff",
                      }}
                    >
                      <Sparkles size={12} />
                      {isAr ? "مميز" : "Featured"}
                    </div>
                    {/* Bottom info overlay */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "20px 20px 16px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "var(--text-h3)",
                          fontWeight: 700,
                          color: "#ffffff",
                          lineHeight: 1.3,
                          marginBottom: 8,
                        }}
                      >
                        {isAr ? article.titleAr : article.titleEn}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      padding: 20,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "var(--color-foreground)",
                        opacity: 0.65,
                        marginBottom: 16,
                        flex: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {isAr ? article.excerptAr : article.excerptEn}
                    </p>

                    {/* Author row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "2px solid rgba(var(--color-primary-rgb) / 0.2)",
                            position: "relative",
                          }}
                        >
                          <Image
                            src={article.authorImage}
                            alt={isAr ? article.authorAr : article.authorEn}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--color-foreground)",
                            }}
                          >
                            {isAr ? article.authorAr : article.authorEn}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: "var(--color-foreground)",
                              opacity: 0.5,
                            }}
                          >
                            {formatDate(article.date, isAr)}
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          color: "var(--color-primary)",
                          fontWeight: 500,
                        }}
                      >
                        <Clock size={14} />
                        {article.readTime} {t("readTime")}
                      </div>
                    </div>
                  </div>

                  {/* Glass hover overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "rgba(var(--color-primary-rgb) / 0.03)",
                      opacity: hovered === i ? 1 : 0,
                      transition: "opacity 0.4s ease",
                      pointerEvents: "none",
                      borderRadius: 16,
                    }}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ─── Category Filter ──────────────────────────────────────────── */

function CategoryFilter({
  active,
  onChange,
  isAr,
}: {
  active: Category;
  onChange: (c: Category) => void;
  isAr: boolean;
}) {
  const [hovered, setHovered] = useState<Category | null>(null);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        marginBottom: 32,
      }}
    >
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = active === cat.key;
        return (
          <motion.button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            onMouseEnter={() => setHovered(cat.key)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 999,
              border: `1px solid ${
                isActive
                  ? "var(--color-primary)"
                  : "rgba(var(--color-primary-rgb) / 0.12)"
              }`,
              background: isActive
                ? "var(--color-primary)"
                : hovered === cat.key
                  ? "rgba(var(--color-primary-rgb) / 0.08)"
                  : "var(--color-card)",
              color: isActive ? "#ffffff" : "var(--color-foreground)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition:
                "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              outline: "none",
              boxShadow: isActive
                ? "0 4px 20px rgba(var(--color-primary-rgb) / 0.3)"
                : "none",
            }}
            whileTap={{ scale: 0.96 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeCategoryPill"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  background: "var(--color-primary)",
                  zIndex: 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: isActive ? "#ffffff" : "inherit",
              }}
            >
              <Icon size={16} />
              {isAr ? cat.labelAr : cat.labelEn}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Search Bar ───────────────────────────────────────────────── */

function SearchBar({
  value,
  onChange,
  isAr,
}: {
  value: string;
  onChange: (v: string) => void;
  isAr: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto 40px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            left: isAr ? "auto" : 16,
            right: isAr ? 16 : "auto",
            color: focused
              ? "var(--color-primary)"
              : "var(--color-foreground)",
            opacity: focused ? 1 : 0.4,
            transition: "all 0.3s ease",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isAr ? "ابحث في المقالات..." : "Search articles..."}
          dir={isAr ? "rtl" : "ltr"}
          style={{
            width: "100%",
            padding: isAr ? "14px 48px 14px 16px" : "14px 16px 14px 48px",
            borderRadius: 14,
            border: `1.5px solid ${
              focused
                ? "var(--color-primary)"
                : "rgba(var(--color-primary-rgb) / 0.12)"
            }`,
            background: "var(--color-card)",
            color: "var(--color-foreground)",
            fontSize: 15,
            outline: "none",
            transition:
              "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: focused
              ? "0 0 0 4px rgba(var(--color-primary-rgb) / 0.1), 0 4px 20px rgba(var(--color-primary-rgb) / 0.08)"
              : "0 2px 8px rgba(var(--color-foreground-rgb, 0 0 0) / 0.02)",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Article Card ─────────────────────────────────────────────── */

function ArticleCard({
  article,
  index,
  isAr,
  t,
}: {
  article: (typeof articles)[0];
  index: number;
  isAr: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [hovered, setHovered] = useState(false);
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: (index % 3) * 0.1,
        ease: smoothEase,
      }}
    >
      <Link
        href={`/blog/${article.slug}`}
        style={{ textDecoration: "none", display: "block", height: "100%" }}
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--color-card)",
            border: `1px solid rgba(var(--color-primary-rgb) / ${hovered ? "0.25" : "0.06"})`,
            boxShadow: hovered
              ? "0 16px 50px rgba(var(--color-primary-rgb) / 0.1), 0 6px 20px rgba(var(--color-foreground-rgb, 0 0 0) / 0.06)"
              : "0 2px 12px rgba(var(--color-foreground-rgb, 0 0 0) / 0.03)",
            transform: hovered ? "translateY(-8px)" : "translateY(0)",
            transition:
              "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Image */}
          <div
            style={{
              position: "relative",
              aspectRatio: "16 / 10",
              overflow: "hidden",
            }}
          >
            <Image
              src={article.image}
              alt={isAr ? article.titleAr : article.titleEn}
              fill
              style={{
                objectFit: "cover",
                transform: hovered ? "scale(1.08)" : "scale(1)",
                transition:
                  "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
            {/* Image overlay on hover */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)`,
                opacity: hovered ? 1 : 0.5,
                transition: "opacity 0.4s ease",
              }}
            />
            {/* Category badge */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: isAr ? "auto" : 12,
                right: isAr ? 12 : "auto",
                padding: "5px 12px",
                borderRadius: 999,
                background: "rgba(var(--color-primary-rgb) / 0.85)",
                backdropFilter: "blur(8px)",
                fontSize: 11,
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "0.03em",
              }}
            >
              {isAr ? article.categoryAr : article.categoryEn}
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              padding: "18px 20px 20px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                fontSize: "var(--text-h3)",
                fontWeight: 700,
                color: "var(--color-foreground)",
                lineHeight: 1.35,
                marginBottom: 10,
                transition: "color 0.3s ease",
              }}
            >
              {isAr ? article.titleAr : article.titleEn}
            </h3>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--color-foreground)",
                opacity: 0.6,
                marginBottom: 16,
                flex: 1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {isAr ? article.excerptAr : article.excerptEn}
            </p>

            {/* Author row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                paddingTop: 14,
                borderTop:
                  "1px solid rgba(var(--color-primary-rgb) / 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border:
                      "2px solid rgba(var(--color-primary-rgb) / 0.15)",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={article.authorImage}
                    alt={isAr ? article.authorAr : article.authorEn}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--color-foreground)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t("by")} {isAr ? article.authorAr : article.authorEn}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--color-foreground)",
                      opacity: 0.45,
                    }}
                  >
                    {formatDate(article.date, isAr)}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "var(--color-primary)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                <Clock size={13} />
                {article.readTime} {t("readTime")}
              </div>
            </div>
          </div>

          {/* Spotlight hover glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "80%",
              height: 1,
              background: hovered
                ? "linear-gradient(90deg, transparent, var(--color-primary), transparent)"
                : "transparent",
              transition: "background 0.4s ease",
              pointerEvents: "none",
            }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Articles Grid Section ────────────────────────────────────── */

function ArticlesGrid({
  t,
  isAr,
  sectionConfig,
}: {
  t: ReturnType<typeof useTranslations>;
  isAr: boolean;
  sectionConfig?: SectionConfig;
}) {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [loadMoreHovered, setLoadMoreHovered] = useState(false);

  const nonFeatured = articles.filter((a) => !a.featured);

  const filtered = useMemo(() => {
    let result = nonFeatured;
    if (activeCategory !== "all") {
      result = result.filter((a) => a.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.titleEn.toLowerCase().includes(q) ||
          a.titleAr.includes(q) ||
          a.excerptEn.toLowerCase().includes(q) ||
          a.excerptAr.includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery, nonFeatured]);

  const displayed = showAll ? filtered : filtered.slice(0, 6);
  const hasMore = filtered.length > 6 && !showAll;

  return (
    <section style={{ paddingBlock: "var(--section-y)" }}>
      <Container>
        <SectionHeading
          subtitle={isAr ? (sectionConfig?.subtitleAr || "جميع المقالات") : (sectionConfig?.subtitleEn || "All Articles")}
          title={isAr ? (sectionConfig?.titleAr || "استكشف مقالاتنا") : (sectionConfig?.titleEn || "Explore Our Articles")}
          description={
            isAr
              ? "تصفح مجموعتنا من المقالات والرؤى المتنوعة"
              : "Browse our collection of diverse articles and insights"
          }
        />

        <CategoryFilter
          active={activeCategory}
          onChange={(c) => {
            setActiveCategory(c);
            setShowAll(false);
          }}
          isAr={isAr}
        />

        <SearchBar value={searchQuery} onChange={setSearchQuery} isAr={isAr} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + searchQuery}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: smoothEase }}
          >
            {displayed.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(1, 1fr)",
                  gap: 24,
                }}
                className="sm:!grid-cols-2 lg:!grid-cols-3"
              >
                {displayed.map((article, i) => (
                  <ArticleCard
                    key={article.slug}
                    article={article}
                    index={i}
                    isAr={isAr}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "var(--color-foreground)",
                  opacity: 0.5,
                  fontSize: 15,
                }}
              >
                {isAr
                  ? "لم يتم العثور على مقالات"
                  : "No articles found"}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Load More */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 48,
            }}
          >
            <motion.button
              onClick={() => setShowAll(true)}
              onMouseEnter={() => setLoadMoreHovered(true)}
              onMouseLeave={() => setLoadMoreHovered(false)}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 32px",
                borderRadius: 14,
                border: `1.5px solid ${
                  loadMoreHovered
                    ? "var(--color-primary)"
                    : "rgba(var(--color-primary-rgb) / 0.2)"
                }`,
                background: loadMoreHovered
                  ? "rgba(var(--color-primary-rgb) / 0.08)"
                  : "var(--color-card)",
                color: loadMoreHovered
                  ? "var(--color-primary)"
                  : "var(--color-foreground)",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                transition:
                  "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: loadMoreHovered
                  ? "0 8px 30px rgba(var(--color-primary-rgb) / 0.15)"
                  : "none",
              }}
            >
              {isAr ? "عرض المزيد من المقالات" : "Load More Articles"}
              <motion.span
                animate={{ y: loadMoreHovered ? 3 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight
                  size={18}
                  style={{
                    transform: "rotate(90deg)",
                  }}
                />
              </motion.span>
            </motion.button>
          </motion.div>
        )}
      </Container>
    </section>
  );
}

/* ─── Newsletter Section ───────────────────────────────────────── */

function NewsletterSection({ isAr }: { isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section ref={ref} style={{ paddingBlock: "var(--section-y)" }}>
      <Container size="sm">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: smoothEase }}
          style={{
            position: "relative",
            borderRadius: 24,
            padding: "48px 32px",
            background: "var(--color-card)",
            border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          {/* Gradient border accent - top edge */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: 2,
              background:
                "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
              borderRadius: 999,
            }}
          />

          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: "-30%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2,
              }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(var(--color-primary-rgb) / 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <Mail size={28} style={{ color: "var(--color-primary)" }} />
            </motion.div>

            <h2
              style={{
                fontSize: "var(--text-h2)",
                fontWeight: 700,
                color: "var(--color-foreground)",
                marginBottom: 12,
              }}
            >
              {isAr
                ? "اشترك في نشرتنا الإخبارية"
                : "Subscribe to Our Newsletter"}
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "var(--color-foreground)",
                opacity: 0.6,
                marginBottom: 28,
                maxWidth: 420,
                margin: "0 auto 28px",
                lineHeight: 1.7,
              }}
            >
              {isAr
                ? "احصل على أحدث المقالات والرؤى مباشرة في بريدك الإلكتروني. لا رسائل مزعجة، نعدك بذلك."
                : "Get the latest articles and insights delivered straight to your inbox. No spam, we promise."}
            </p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: "14px 24px",
                  borderRadius: 14,
                  background: "rgba(var(--color-primary-rgb) / 0.1)",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                {isAr
                  ? "شكرا لك! تم الاشتراك بنجاح"
                  : "Thank you! Successfully subscribed"}
              </motion.div>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  maxWidth: 440,
                  margin: "0 auto",
                  flexDirection: "row",
                }}
                className="max-sm:!flex-col"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={
                    isAr ? "أدخل بريدك الإلكتروني" : "Enter your email"
                  }
                  dir={isAr ? "rtl" : "ltr"}
                  style={{
                    flex: 1,
                    padding: "14px 18px",
                    borderRadius: 12,
                    border: `1.5px solid ${
                      focused
                        ? "var(--color-primary)"
                        : "rgba(var(--color-primary-rgb) / 0.12)"
                    }`,
                    background: "var(--color-background)",
                    color: "var(--color-foreground)",
                    fontSize: 14,
                    outline: "none",
                    transition:
                      "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: focused
                      ? "0 0 0 3px rgba(var(--color-primary-rgb) / 0.1)"
                      : "none",
                  }}
                />
                <motion.button
                  onClick={() => {
                    if (email.includes("@")) {
                      setSubscribed(true);
                    }
                  }}
                  onMouseEnter={() => setBtnHovered(true)}
                  onMouseLeave={() => setBtnHovered(false)}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    padding: "14px 28px",
                    borderRadius: 12,
                    border: "none",
                    background: btnHovered
                      ? "var(--color-primary)"
                      : "var(--color-primary)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: "none",
                    transition:
                      "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: btnHovered
                      ? "0 8px 30px rgba(var(--color-primary-rgb) / 0.4)"
                      : "0 4px 16px rgba(var(--color-primary-rgb) / 0.2)",
                    transform: btnHovered ? "translateY(-2px)" : "translateY(0)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isAr ? "اشترك" : "Subscribe"}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

/* ─── Popular Tags ─────────────────────────────────────────────── */

function PopularTags({ isAr }: { isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  return (
    <section ref={ref} style={{ paddingBlock: "var(--section-y)" }}>
      <Container size="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: smoothEase }}
          style={{ textAlign: "center" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              color: "var(--color-primary)",
            }}
          >
            <Tag size={18} />
            <h2
              style={{
                fontSize: "var(--text-h2)",
                fontWeight: 700,
                color: "var(--color-foreground)",
              }}
            >
              {isAr ? "الوسوم الشائعة" : "Popular Tags"}
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            {tags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  duration: 0.4,
                  delay: i * 0.05,
                  ease: smoothEase,
                }}
                onMouseEnter={() => setHoveredTag(tag)}
                onMouseLeave={() => setHoveredTag(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: `1px solid ${
                    hoveredTag === tag
                      ? "var(--color-primary)"
                      : "rgba(var(--color-primary-rgb) / 0.12)"
                  }`,
                  background:
                    hoveredTag === tag
                      ? "rgba(var(--color-primary-rgb) / 0.1)"
                      : "var(--color-card)",
                  color:
                    hoveredTag === tag
                      ? "var(--color-primary)"
                      : "var(--color-foreground)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition:
                    "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow:
                    hoveredTag === tag
                      ? "0 4px 20px rgba(var(--color-primary-rgb) / 0.15)"
                      : "none",
                  transform:
                    hoveredTag === tag
                      ? "translateY(-2px)"
                      : "translateY(0)",
                }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

/* ─── Bottom CTA ───────────────────────────────────────────────── */

function BottomCTA({ isAr }: { isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [hovered, setHovered] = useState(false);
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section ref={ref} style={{ paddingBlock: "var(--section-y)" }}>
      <Container size="sm">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: smoothEase }}
          style={{
            position: "relative",
            borderRadius: 24,
            padding: "56px 32px",
            textAlign: "center",
            overflow: "hidden",
            background: `
              radial-gradient(ellipse 80% 60% at 50% 30%, rgba(var(--color-primary-rgb) / 0.12) 0%, transparent 70%),
              var(--color-card)
            `,
            border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
          }}
        >
          {/* Grid pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(var(--color-primary-rgb) / 0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.04) 1px, transparent 1px)
              `,
              backgroundSize: "32px 32px",
              pointerEvents: "none",
              borderRadius: 24,
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2,
              }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(var(--color-primary-rgb) / 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <PenTool size={24} style={{ color: "var(--color-primary)" }} />
            </motion.div>

            <h2
              style={{
                fontSize: "var(--text-h2)",
                fontWeight: 700,
                color: "var(--color-foreground)",
                marginBottom: 12,
              }}
            >
              {isAr ? "لديك قصة لمشاركتها؟" : "Have a Story to Share?"}
            </h2>

            <p
              style={{
                fontSize: 15,
                color: "var(--color-foreground)",
                opacity: 0.6,
                maxWidth: 440,
                margin: "0 auto 28px",
                lineHeight: 1.7,
              }}
            >
              {isAr
                ? "نرحب دائما بالمساهمات من الكتاب والخبراء. شاركنا معرفتك وألهم الآخرين."
                : "We always welcome contributions from writers and experts. Share your knowledge and inspire others."}
            </p>

            <Link
              href="/contact"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              <motion.div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 32px",
                  borderRadius: 14,
                  background: hovered
                    ? "var(--color-primary)"
                    : "var(--color-primary)",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition:
                    "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: hovered
                    ? "0 12px 40px rgba(var(--color-primary-rgb) / 0.4)"
                    : "0 4px 20px rgba(var(--color-primary-rgb) / 0.2)",
                  transform: hovered ? "translateY(-3px)" : "translateY(0)",
                }}
              >
                {isAr ? "تواصل معنا" : "Get in Touch"}
                <motion.span
                  animate={{
                    x: hovered ? (isAr ? -4 : 4) : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Arrow size={18} />
                </motion.span>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

/* ─── Main Export ───────────────────────────────────────────────── */

export function BlogContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("blog");
  const { config } = useSiteConfig();
  const sections = config.pagesContent?.blog?.sections ?? DEFAULT_PAGES_CONTENT.blog.sections;

  return (
    <main dir={isAr ? "rtl" : "ltr"}>
      {sections.hero?.visible !== false && (<>
      {/* 1. Premium Hero */}
      <HeroSection t={t} isAr={isAr} />

      <SectionDivider />
      </>)}

      {sections.featured?.visible !== false && (<>
      {/* 2. Featured Articles */}
      <FeaturedArticles t={t} isAr={isAr} sectionConfig={sections.featured} />

      <SectionDivider />
      </>)}

      {sections.grid?.visible !== false && (<>
      {/* 3-6. Category Filter + Search + Articles Grid + Load More */}
      <ArticlesGrid t={t} isAr={isAr} sectionConfig={sections.grid} />

      <SectionDivider />
      </>)}

      {sections.newsletter?.visible !== false && (<>
      {/* 7. Newsletter Signup */}
      <NewsletterSection isAr={isAr} />

      <SectionDivider />
      </>)}

      {sections.tags?.visible !== false && (<>
      {/* 8. Popular Tags Cloud */}
      <PopularTags isAr={isAr} />

      <SectionDivider />
      </>)}

      {sections.cta?.visible !== false && (
      /* 9. Bottom CTA */
      <BottomCTA isAr={isAr} />
      )}
    </main>
  );
}
