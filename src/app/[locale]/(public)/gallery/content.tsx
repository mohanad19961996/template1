"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import {
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Download,
  Share2,
  Heart,
  Grid3X3,
  LayoutGrid,
  Rows3,
  Sparkles,
  Aperture,
  Maximize2,
  Eye,
  ArrowRight,
  ArrowLeft,
  ImageIcon,
  Filter,
  SlidersHorizontal,
  Play,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";

/* ─────────────────────────── Animated Block ─────────────────────────── */

function AnimatedBlock({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── Gallery Data ─────────────────────────── */

interface GalleryImage {
  id: number;
  src: string;
  titleEn: string;
  titleAr: string;
  categoryEn: string;
  categoryAr: string;
  descriptionEn: string;
  descriptionAr: string;
  width: number;
  height: number;
  featured?: boolean;
  likes: number;
  views: number;
  tags: string[];
}

const categories = [
  { key: "all", labelEn: "All", labelAr: "الكل", icon: Grid3X3 },
  { key: "branding", labelEn: "Branding", labelAr: "العلامة التجارية", icon: Sparkles },
  { key: "web", labelEn: "Web Design", labelAr: "تصميم الويب", icon: LayoutGrid },
  { key: "photography", labelEn: "Photography", labelAr: "التصوير", icon: Camera },
  { key: "ui-ux", labelEn: "UI/UX", labelAr: "واجهة المستخدم", icon: Aperture },
  { key: "motion", labelEn: "Motion", labelAr: "الحركة", icon: Play },
];

const galleryImages: GalleryImage[] = [
  {
    id: 1,
    src: "https://picsum.photos/seed/gal-1/800/1000",
    titleEn: "Luxury Brand Identity",
    titleAr: "هوية العلامة الفاخرة",
    categoryEn: "Branding",
    categoryAr: "العلامة التجارية",
    descriptionEn: "A sophisticated brand identity for a premium fashion house, featuring custom typography and a refined color palette.",
    descriptionAr: "هوية علامة تجارية راقية لدار أزياء فاخرة، تتميز بخطوط مخصصة ولوحة ألوان مصقولة.",
    width: 800,
    height: 1000,
    featured: true,
    likes: 342,
    views: 5800,
    tags: ["branding", "luxury", "identity"],
  },
  {
    id: 2,
    src: "https://picsum.photos/seed/gal-2/800/600",
    titleEn: "E-Commerce Dashboard",
    titleAr: "لوحة تحكم التجارة الإلكترونية",
    categoryEn: "Web Design",
    categoryAr: "تصميم الويب",
    descriptionEn: "Modern e-commerce analytics dashboard with real-time metrics and intuitive data visualization.",
    descriptionAr: "لوحة تحكم تحليلات التجارة الإلكترونية الحديثة مع مقاييس فورية وتصور بيانات بديهي.",
    width: 800,
    height: 600,
    likes: 218,
    views: 3200,
    tags: ["web", "dashboard", "analytics"],
  },
  {
    id: 3,
    src: "https://picsum.photos/seed/gal-3/800/800",
    titleEn: "Urban Architecture",
    titleAr: "الهندسة المعمارية الحضرية",
    categoryEn: "Photography",
    categoryAr: "التصوير",
    descriptionEn: "Capturing the essence of modern urban landscapes through dramatic angles and natural lighting.",
    descriptionAr: "التقاط جوهر المناظر الطبيعية الحضرية الحديثة من خلال زوايا دراماتيكية وإضاءة طبيعية.",
    width: 800,
    height: 800,
    featured: true,
    likes: 567,
    views: 8900,
    tags: ["photography", "architecture", "urban"],
  },
  {
    id: 4,
    src: "https://picsum.photos/seed/gal-4/800/500",
    titleEn: "Banking App Redesign",
    titleAr: "إعادة تصميم تطبيق البنك",
    categoryEn: "UI/UX",
    categoryAr: "واجهة المستخدم",
    descriptionEn: "A complete redesign of a mobile banking application focusing on accessibility and user trust.",
    descriptionAr: "إعادة تصميم كاملة لتطبيق الخدمات المصرفية مع التركيز على إمكانية الوصول وثقة المستخدم.",
    width: 800,
    height: 500,
    likes: 189,
    views: 2700,
    tags: ["ui-ux", "mobile", "fintech"],
  },
  {
    id: 5,
    src: "https://picsum.photos/seed/gal-5/800/1100",
    titleEn: "Nature Portraits",
    titleAr: "صور الطبيعة",
    categoryEn: "Photography",
    categoryAr: "التصوير",
    descriptionEn: "Intimate portrait photography set against breathtaking natural backdrops, blending human emotion with natural beauty.",
    descriptionAr: "تصوير بورتريه حميم مع خلفيات طبيعية خلابة، يمزج بين المشاعر الإنسانية والجمال الطبيعي.",
    width: 800,
    height: 1100,
    likes: 423,
    views: 6400,
    tags: ["photography", "portrait", "nature"],
  },
  {
    id: 6,
    src: "https://picsum.photos/seed/gal-6/800/600",
    titleEn: "Motion Graphics Reel",
    titleAr: "عرض الرسوم المتحركة",
    categoryEn: "Motion",
    categoryAr: "الحركة",
    descriptionEn: "Dynamic motion graphics showcasing fluid transitions, kinetic typography, and 3D visual effects.",
    descriptionAr: "رسومات متحركة ديناميكية تعرض انتقالات سلسة وطباعة حركية وتأثيرات بصرية ثلاثية الأبعاد.",
    width: 800,
    height: 600,
    likes: 301,
    views: 4500,
    tags: ["motion", "animation", "3d"],
  },
  {
    id: 7,
    src: "https://picsum.photos/seed/gal-7/800/900",
    titleEn: "Organic Tea Packaging",
    titleAr: "تغليف الشاي العضوي",
    categoryEn: "Branding",
    categoryAr: "العلامة التجارية",
    descriptionEn: "Eco-friendly packaging design for an organic tea brand featuring handcrafted illustrations and earth tones.",
    descriptionAr: "تصميم تغليف صديق للبيئة لعلامة شاي عضوية تتميز برسوم مصنوعة يدوياً وألوان ترابية.",
    width: 800,
    height: 900,
    likes: 276,
    views: 3800,
    tags: ["branding", "packaging", "organic"],
  },
  {
    id: 8,
    src: "https://picsum.photos/seed/gal-8/800/600",
    titleEn: "SaaS Landing Page",
    titleAr: "صفحة هبوط SaaS",
    categoryEn: "Web Design",
    categoryAr: "تصميم الويب",
    descriptionEn: "High-conversion landing page for a B2B SaaS platform with micro-interactions and scroll animations.",
    descriptionAr: "صفحة هبوط عالية التحويل لمنصة SaaS مع تفاعلات دقيقة ورسوم متحركة عند التمرير.",
    width: 800,
    height: 600,
    likes: 198,
    views: 2900,
    tags: ["web", "saas", "landing"],
  },
  {
    id: 9,
    src: "https://picsum.photos/seed/gal-9/800/800",
    titleEn: "Minimal Product Shots",
    titleAr: "صور المنتجات البسيطة",
    categoryEn: "Photography",
    categoryAr: "التصوير",
    descriptionEn: "Clean, minimalist product photography highlighting form and texture with studio-quality lighting.",
    descriptionAr: "تصوير منتجات نظيف وبسيط يبرز الشكل والملمس مع إضاءة بجودة الاستوديو.",
    width: 800,
    height: 800,
    likes: 334,
    views: 5100,
    tags: ["photography", "product", "minimal"],
  },
  {
    id: 10,
    src: "https://picsum.photos/seed/gal-10/800/500",
    titleEn: "Health App Experience",
    titleAr: "تجربة تطبيق الصحة",
    categoryEn: "UI/UX",
    categoryAr: "واجهة المستخدم",
    descriptionEn: "Wellness and fitness app designed with empathy, featuring personalized dashboards and habit tracking.",
    descriptionAr: "تطبيق صحة ولياقة مصمم بتعاطف، يتميز بلوحات معلومات مخصصة وتتبع العادات.",
    width: 800,
    height: 500,
    likes: 245,
    views: 3600,
    tags: ["ui-ux", "health", "mobile"],
  },
  {
    id: 11,
    src: "https://picsum.photos/seed/gal-11/800/1000",
    titleEn: "Restaurant Brand System",
    titleAr: "نظام العلامة التجارية للمطعم",
    categoryEn: "Branding",
    categoryAr: "العلامة التجارية",
    descriptionEn: "Complete brand system for a fine dining restaurant including menus, signage, and digital presence.",
    descriptionAr: "نظام علامة تجارية كامل لمطعم فاخر يشمل القوائم واللافتات والحضور الرقمي.",
    width: 800,
    height: 1000,
    likes: 312,
    views: 4700,
    tags: ["branding", "restaurant", "system"],
  },
  {
    id: 12,
    src: "https://picsum.photos/seed/gal-12/800/600",
    titleEn: "Brand Motion Identity",
    titleAr: "هوية الحركة للعلامة",
    categoryEn: "Motion",
    categoryAr: "الحركة",
    descriptionEn: "Animated logo reveals and brand motion guidelines bringing static identities to life across digital platforms.",
    descriptionAr: "كشف شعارات متحركة وإرشادات حركة العلامة التجارية لإحياء الهويات الثابتة عبر المنصات الرقمية.",
    width: 800,
    height: 600,
    likes: 267,
    views: 3900,
    tags: ["motion", "branding", "logo"],
  },
  {
    id: 13,
    src: "https://picsum.photos/seed/gal-13/800/700",
    titleEn: "Portfolio Website",
    titleAr: "موقع المحفظة",
    categoryEn: "Web Design",
    categoryAr: "تصميم الويب",
    descriptionEn: "Award-winning portfolio website featuring immersive scroll experiences and WebGL transitions.",
    descriptionAr: "موقع محفظة حائز على جوائز يتميز بتجارب تمرير غامرة وانتقالات WebGL.",
    width: 800,
    height: 700,
    featured: true,
    likes: 489,
    views: 7200,
    tags: ["web", "portfolio", "webgl"],
  },
  {
    id: 14,
    src: "https://picsum.photos/seed/gal-14/800/1000",
    titleEn: "Street Photography",
    titleAr: "تصوير الشوارع",
    categoryEn: "Photography",
    categoryAr: "التصوير",
    descriptionEn: "Raw, unfiltered street photography documenting urban life with compelling narratives in every frame.",
    descriptionAr: "تصوير شوارع خام وغير مصفى يوثق الحياة الحضرية مع سرديات مقنعة في كل إطار.",
    width: 800,
    height: 1000,
    likes: 398,
    views: 5600,
    tags: ["photography", "street", "documentary"],
  },
  {
    id: 15,
    src: "https://picsum.photos/seed/gal-15/800/600",
    titleEn: "Travel App Interface",
    titleAr: "واجهة تطبيق السفر",
    categoryEn: "UI/UX",
    categoryAr: "واجهة المستخدم",
    descriptionEn: "Immersive travel booking experience with AR integration and intelligent itinerary suggestions.",
    descriptionAr: "تجربة حجز سفر غامرة مع تكامل الواقع المعزز واقتراحات رحلات ذكية.",
    width: 800,
    height: 600,
    likes: 356,
    views: 5300,
    tags: ["ui-ux", "travel", "ar"],
  },
  {
    id: 16,
    src: "https://picsum.photos/seed/gal-16/800/800",
    titleEn: "Cosmetics Line Launch",
    titleAr: "إطلاق خط مستحضرات التجميل",
    categoryEn: "Branding",
    categoryAr: "العلامة التجارية",
    descriptionEn: "Luxurious product launch campaign for a new cosmetics line, featuring editorial-style visuals.",
    descriptionAr: "حملة إطلاق منتج فاخرة لخط مستحضرات تجميل جديد، تتميز بصور بأسلوب تحريري.",
    width: 800,
    height: 800,
    likes: 445,
    views: 6800,
    tags: ["branding", "cosmetics", "campaign"],
  },
];

/* ─────────────────────────── Stats ─────────────────────────── */

const stats = [
  { valueEn: "500+", valueAr: "٥٠٠+", labelEn: "Photos", labelAr: "صورة" },
  { valueEn: "120+", valueAr: "١٢٠+", labelEn: "Projects", labelAr: "مشروع" },
  { valueEn: "50+", valueAr: "٥٠+", labelEn: "Clients", labelAr: "عميل" },
  { valueEn: "15+", valueAr: "١٥+", labelEn: "Awards", labelAr: "جائزة" },
];

type LayoutMode = "masonry" | "grid" | "list";

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */

export function GalleryContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const tx = (en: string, ar: string) => (isAr ? ar : en);
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [activeCategory, setActiveCategory] = useState("all");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("masonry");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [likedImages, setLikedImages] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(12);

  const filtered =
    activeCategory === "all"
      ? galleryImages
      : galleryImages.filter((img) => {
          const catMap: Record<string, string> = {
            branding: "Branding",
            web: "Web Design",
            photography: "Photography",
            "ui-ux": "UI/UX",
            motion: "Motion",
          };
          return img.categoryEn === catMap[activeCategory];
        });

  const displayed = filtered.slice(0, visibleCount);

  const toggleLike = useCallback((id: number) => {
    setLikedImages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    document.body.style.overflow = "";
  }, []);

  const navigateLightbox = useCallback(
    (dir: number) => {
      if (lightboxIndex === null) return;
      const newIndex = (lightboxIndex + dir + displayed.length) % displayed.length;
      setLightboxIndex(newIndex);
    },
    [lightboxIndex, displayed.length]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") navigateLightbox(1);
      if (e.key === "ArrowLeft") navigateLightbox(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, closeLightbox, navigateLightbox]);

  /* ─── Masonry column assignment ─── */
  const getMasonryColumns = () => {
    const cols: GalleryImage[][] = [[], [], []];
    displayed.forEach((img, i) => {
      cols[i % 3].push(img);
    });
    return cols;
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* ═══════ 1. HERO ═══════ */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{
          background: "var(--color-background)",
        }}
      >
        {/* Animated grid background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Grid pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(var(--color-primary-rgb) / 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.03) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
          {/* Radial glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)",
            }}
          />
          {/* Floating camera icons */}
          {[
            { top: "15%", left: "10%", size: 40, delay: 0 },
            { top: "25%", right: "15%", size: 32, delay: 1.5 },
            { bottom: "20%", left: "20%", size: 28, delay: 0.8 },
            { top: "60%", right: "10%", size: 36, delay: 2.2 },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                ...pos,
                color: "rgba(var(--color-primary-rgb) / 0.06)",
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                delay: pos.delay,
                ease: "easeInOut",
              }}
            >
              {i % 2 === 0 ? (
                <Camera className={`h-${pos.size / 4} w-${pos.size / 4}`} style={{ width: pos.size, height: pos.size }} />
              ) : (
                <Aperture style={{ width: pos.size, height: pos.size }} />
              )}
            </motion.div>
          ))}
        </div>

        <Container className="relative z-10 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8"
            style={{
              background: "rgba(var(--color-primary-rgb) / 0.08)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
            }}
          >
            <Camera className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
              {tx("Visual Portfolio", "المعرض البصري")}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6"
            style={{ color: "var(--color-foreground)" }}
          >
            {tx("Our Creative", "معرضنا")}{" "}
            <span
              className="relative inline-block"
              style={{ color: "var(--color-primary)" }}
            >
              {tx("Gallery", "الإبداعي")}
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
                style={{ background: "var(--color-primary)", opacity: 0.3 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--color-foreground)", opacity: 0.6 }}
          >
            {tx(
              "Explore our curated collection of creative work — from branding and web design to photography and motion graphics.",
              "استكشف مجموعتنا المنسقة من الأعمال الإبداعية — من العلامات التجارية وتصميم الويب إلى التصوير والرسوم المتحركة."
            )}
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex items-center justify-center gap-8 md:gap-14"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-2xl md:text-3xl font-black"
                  style={{ color: "var(--color-primary)" }}
                >
                  {tx(stat.valueEn, stat.valueAr)}
                </div>
                <div
                  className="text-xs font-medium mt-1 uppercase tracking-wider"
                  style={{ color: "var(--color-foreground)", opacity: 0.4 }}
                >
                  {tx(stat.labelEn, stat.labelAr)}
                </div>
              </div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 2. FILTER + LAYOUT CONTROLS ═══════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={tx("Browse Work", "تصفح الأعمال")}
            title={tx("Explore by Category", "استكشف حسب الفئة")}
            description={tx(
              "Filter through our diverse collection to find exactly what inspires you.",
              "تصفح مجموعتنا المتنوعة للعثور على ما يلهمك."
            )}
          />

          {/* Controls bar */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Category filters */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <motion.button
                    key={cat.key}
                    onClick={() => {
                      setActiveCategory(cat.key);
                      setVisibleCount(12);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                    style={{
                      background: isActive
                        ? "var(--color-primary)"
                        : "rgba(var(--color-primary-rgb) / 0.04)",
                      color: isActive ? "#ffffff" : "var(--color-foreground)",
                      border: `1px solid ${
                        isActive
                          ? "var(--color-primary)"
                          : "rgba(var(--color-primary-rgb) / 0.08)"
                      }`,
                      transition: "all 0.3s ease",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="h-4 w-4" />
                    {tx(cat.labelEn, cat.labelAr)}
                  </motion.button>
                );
              })}
            </div>

            {/* Layout toggle */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.04)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
              }}
            >
              {(
                [
                  { mode: "masonry" as LayoutMode, icon: LayoutGrid, label: "Masonry" },
                  { mode: "grid" as LayoutMode, icon: Grid3X3, label: "Grid" },
                  { mode: "list" as LayoutMode, icon: Rows3, label: "List" },
                ] as const
              ).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setLayoutMode(mode)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer"
                  style={{
                    background:
                      layoutMode === mode
                        ? "var(--color-primary)"
                        : "transparent",
                    color:
                      layoutMode === mode ? "#ffffff" : "var(--color-foreground)",
                    opacity: layoutMode === mode ? 1 : 0.5,
                    transition: "all 0.2s ease",
                  }}
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="mt-6 flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" style={{ color: "var(--color-primary)", opacity: 0.5 }} />
            <span className="text-xs font-medium" style={{ color: "var(--color-foreground)", opacity: 0.4 }}>
              {tx(`Showing ${displayed.length} of ${filtered.length} items`, `عرض ${displayed.length} من ${filtered.length} عنصر`)}
            </span>
          </div>

          {/* ═══════ 3. GALLERY GRID ═══════ */}
          <div className="mt-10">
            <AnimatePresence mode="wait">
              {/* MASONRY LAYOUT */}
              {layoutMode === "masonry" && (
                <motion.div
                  key="masonry"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  {getMasonryColumns().map((col, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-5">
                      {col.map((img) => {
                        const globalIndex = displayed.findIndex((d) => d.id === img.id);
                        return (
                          <GalleryCard
                            key={img.id}
                            image={img}
                            isAr={isAr}
                            tx={tx}
                            liked={likedImages.has(img.id)}
                            onLike={() => toggleLike(img.id)}
                            onOpen={() => openLightbox(globalIndex)}
                            layout="masonry"
                          />
                        );
                      })}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* GRID LAYOUT */}
              {layoutMode === "grid" && (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                  {displayed.map((img, i) => (
                    <GalleryCard
                      key={img.id}
                      image={img}
                      isAr={isAr}
                      tx={tx}
                      liked={likedImages.has(img.id)}
                      onLike={() => toggleLike(img.id)}
                      onOpen={() => openLightbox(i)}
                      layout="grid"
                    />
                  ))}
                </motion.div>
              )}

              {/* LIST LAYOUT */}
              {layoutMode === "list" && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-4"
                >
                  {displayed.map((img, i) => (
                    <GalleryCard
                      key={img.id}
                      image={img}
                      isAr={isAr}
                      tx={tx}
                      liked={likedImages.has(img.id)}
                      onLike={() => toggleLike(img.id)}
                      onOpen={() => openLightbox(i)}
                      layout="list"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Load more */}
            {visibleCount < filtered.length && (
              <AnimatedBlock>
                <div className="mt-14 text-center">
                  <motion.button
                    onClick={() => setVisibleCount((prev) => prev + 8)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.06)",
                      color: "var(--color-primary)",
                      border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                      transition: "all 0.3s ease",
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-primary)";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.06)";
                      e.currentTarget.style.color = "var(--color-primary)";
                    }}
                  >
                    <ImageIcon className="h-4 w-4" />
                    {tx("Load More", "عرض المزيد")}
                  </motion.button>
                </div>
              </AnimatedBlock>
            )}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 4. FEATURED SHOWCASE ═══════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={tx("Featured", "المميزة")}
            title={tx("Spotlight Projects", "مشاريع مميزة")}
            description={tx(
              "Hand-picked pieces that showcase our finest creative work.",
              "أعمال مختارة بعناية تعرض أفضل إبداعاتنا."
            )}
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {galleryImages
              .filter((img) => img.featured)
              .map((img, i) => (
                <AnimatedBlock key={img.id} delay={i * 0.1}>
                  <motion.div
                    className="group relative rounded-2xl overflow-hidden cursor-pointer"
                    style={{
                      aspectRatio: "16/10",
                      border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                      boxShadow: "0 8px 32px rgba(var(--color-primary-rgb) / 0.06)",
                    }}
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      const idx = displayed.findIndex((d) => d.id === img.id);
                      if (idx >= 0) openLightbox(idx);
                    }}
                  >
                    <Image
                      src={img.src}
                      alt={tx(img.titleEn, img.titleAr)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0 transition-opacity duration-500"
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)",
                        opacity: 0.8,
                      }}
                    />
                    {/* Hover spotlight */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.2) 0%, transparent 60%)`,
                      }}
                    />

                    {/* Featured badge */}
                    <div
                      className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.2)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.3)",
                      }}
                    >
                      <Sparkles className="h-3 w-3 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                        {tx("Featured", "مميز")}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            background: "rgba(255,255,255,0.15)",
                            color: "#ffffff",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {tx(img.categoryEn, img.categoryAr)}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                        {tx(img.titleEn, img.titleAr)}
                      </h3>
                      <p className="text-sm text-white/60 line-clamp-2 max-w-md">
                        {tx(img.descriptionEn, img.descriptionAr)}
                      </p>
                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-xs text-white/50">
                          <Heart className="h-3 w-3" /> {img.likes}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-white/50">
                          <Eye className="h-3 w-3" /> {img.views.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Hover zoom icon */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.15)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <Maximize2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </motion.div>
                </AnimatedBlock>
              ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════ 5. CTA ═══════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <AnimatedBlock>
            <div
              className="relative rounded-3xl overflow-hidden text-center py-16 md:py-20 px-6"
              style={{
                background: "var(--color-primary)",
              }}
            >
              {/* Pattern overlay */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 50%),
                    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)
                  `,
                }}
              />
              {/* Floating dots */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 4 + (i % 3) * 3,
                    height: 4 + (i % 3) * 3,
                    background: "rgba(255,255,255,0.15)",
                    top: `${15 + i * 12}%`,
                    left: `${10 + i * 14}%`,
                  }}
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  }}
                />
              ))}

              <div className="relative z-10">
                <Camera className="h-10 w-10 mx-auto mb-4 text-white/30" />
                <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                  {tx("Have a Project in Mind?", "لديك مشروع؟")}
                </h2>
                <p className="text-sm md:text-base text-white/70 max-w-md mx-auto mb-8 leading-relaxed">
                  {tx(
                    "Let's collaborate and create something extraordinary together. We'd love to hear about your vision.",
                    "دعنا نتعاون ونصنع شيئاً استثنائياً معاً. نحب أن نسمع عن رؤيتك."
                  )}
                </p>
                <motion.a
                  href={`/${locale}/contact`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold"
                  style={{
                    background: "#ffffff",
                    color: "var(--color-primary)",
                    transition: "all 0.3s ease",
                  }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {tx("Start a Project", "ابدأ مشروعك")}
                  <Arrow className="h-4 w-4" />
                </motion.a>
              </div>
            </div>
          </AnimatedBlock>
        </Container>
      </section>

      {/* ═══════ LIGHTBOX ═══════ */}
      <AnimatePresence>
        {lightboxIndex !== null && displayed[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.92)" }}
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#ffffff",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-5 left-5 text-white/50 text-sm font-medium">
              {lightboxIndex + 1} / {displayed.length}
            </div>

            {/* Navigation */}
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                backdropFilter: "blur(8px)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                backdropFilter: "blur(8px)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-5xl max-h-[80vh] w-full mx-4 md:mx-12"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={displayed[lightboxIndex].src}
                alt={tx(displayed[lightboxIndex].titleEn, displayed[lightboxIndex].titleAr)}
                width={displayed[lightboxIndex].width}
                height={displayed[lightboxIndex].height}
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                sizes="90vw"
                priority
              />

              {/* Info panel */}
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {tx(displayed[lightboxIndex].titleEn, displayed[lightboxIndex].titleAr)}
                  </h3>
                  <p className="text-sm text-white/50 mt-1">
                    {tx(displayed[lightboxIndex].categoryEn, displayed[lightboxIndex].categoryAr)}
                  </p>
                  <p className="text-sm text-white/40 mt-2 max-w-xl">
                    {tx(displayed[lightboxIndex].descriptionEn, displayed[lightboxIndex].descriptionAr)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(displayed[lightboxIndex].id); }}
                    className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer"
                    style={{
                      background: likedImages.has(displayed[lightboxIndex].id)
                        ? "var(--color-primary)"
                        : "rgba(255,255,255,0.1)",
                      color: "#ffffff",
                      transition: "all 0.2s",
                    }}
                  >
                    <Heart className="h-4 w-4" fill={likedImages.has(displayed[lightboxIndex].id) ? "#ffffff" : "none"} />
                  </button>
                  <button
                    className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff" }}
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff" }}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════ GALLERY CARD ═══════════════════════════ */

function GalleryCard({
  image,
  isAr,
  tx,
  liked,
  onLike,
  onOpen,
  layout,
}: {
  image: GalleryImage;
  isAr: boolean;
  tx: (en: string, ar: string) => string;
  liked: boolean;
  onLike: () => void;
  onOpen: () => void;
  layout: LayoutMode;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [hovered, setHovered] = useState(false);

  if (layout === "list") {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="group flex flex-col sm:flex-row gap-4 rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: "var(--color-card)",
          border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
          transition: "all 0.3s ease",
        }}
        onClick={onOpen}
        onMouseEnter={(e) => {
          setHovered(true);
          e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(var(--color-primary-rgb) / 0.08)";
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Image */}
        <div className="relative sm:w-48 md:w-64 shrink-0 aspect-[4/3] sm:aspect-auto overflow-hidden">
          <Image
            src={image.src}
            alt={tx(image.titleEn, image.titleAr)}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 256px"
          />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:py-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.08)",
                color: "var(--color-primary)",
              }}
            >
              {tx(image.categoryEn, image.categoryAr)}
            </span>
            {image.featured && (
              <Sparkles className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
            )}
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: "var(--color-foreground)" }}>
            {tx(image.titleEn, image.titleAr)}
          </h3>
          <p className="text-sm line-clamp-2" style={{ color: "var(--color-foreground)", opacity: 0.5 }}>
            {tx(image.descriptionEn, image.descriptionAr)}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-foreground)", opacity: 0.35 }}>
              <Heart className="h-3 w-3" fill={liked ? "currentColor" : "none"} /> {image.likes + (liked ? 1 : 0)}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-foreground)", opacity: 0.35 }}>
              <Eye className="h-3 w-3" /> {image.views.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-2 px-4 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer"
            style={{
              background: liked ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.06)",
              color: liked ? "#ffffff" : "var(--color-foreground)",
              transition: "all 0.2s",
            }}
          >
            <Heart className="h-3.5 w-3.5" fill={liked ? "#ffffff" : "none"} />
          </button>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full cursor-pointer"
            style={{
              background: "rgba(var(--color-primary-rgb) / 0.06)",
              color: "var(--color-foreground)",
              opacity: 0.5,
            }}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    );
  }

  /* MASONRY / GRID card */
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        aspectRatio: layout === "grid" ? "1" : undefined,
        border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
        boxShadow: "0 4px 16px rgba(var(--color-primary-rgb) / 0.04)",
        transition: "all 0.4s ease",
      }}
      onClick={onOpen}
      onMouseEnter={(e) => {
        setHovered(true);
        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(var(--color-primary-rgb) / 0.1)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(var(--color-primary-rgb) / 0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <Image
        src={image.src}
        alt={tx(image.titleEn, image.titleAr)}
        width={image.width}
        height={image.height}
        className={`w-full ${layout === "grid" ? "h-full object-cover" : "h-auto"} transition-transform duration-700 group-hover:scale-110`}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Overlay on hover */}
      <div
        className="absolute inset-0 transition-opacity duration-400"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 40%, transparent 100%)",
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Primary color spotlight on hover */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${isAr ? "70%" : "30%"} 30%, rgba(var(--color-primary-rgb) / 0.2) 0%, transparent 60%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Featured badge */}
      {image.featured && (
        <div
          className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full z-10"
          style={{
            background: "rgba(var(--color-primary-rgb) / 0.3)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(var(--color-primary-rgb) / 0.3)",
          }}
        >
          <Sparkles className="h-2.5 w-2.5 text-white" />
          <span className="text-[9px] font-bold text-white uppercase tracking-wider">
            {tx("Featured", "مميز")}
          </span>
        </div>
      )}

      {/* Hover content */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 z-10 transition-all duration-400"
        style={{
          transform: hovered ? "translateY(0)" : "translateY(10px)",
          opacity: hovered ? 1 : 0,
        }}
      >
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider mb-2"
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "#ffffff",
            backdropFilter: "blur(4px)",
          }}
        >
          {tx(image.categoryEn, image.categoryAr)}
        </span>
        <h3 className="text-sm font-bold text-white mb-0.5 line-clamp-1">
          {tx(image.titleEn, image.titleAr)}
        </h3>
        <p className="text-xs text-white/50 line-clamp-1">
          {tx(image.descriptionEn, image.descriptionAr)}
        </p>

        {/* Bottom row with likes & actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-white/40">
              <Heart className="h-2.5 w-2.5" /> {image.likes}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/40">
              <Eye className="h-2.5 w-2.5" /> {image.views.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer"
              style={{
                background: liked ? "var(--color-primary)" : "rgba(255,255,255,0.12)",
                color: "#ffffff",
                transition: "all 0.2s",
              }}
            >
              <Heart className="h-3 w-3" fill={liked ? "#ffffff" : "none"} />
            </button>
            <button
              className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#ffffff",
              }}
            >
              <ZoomIn className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
