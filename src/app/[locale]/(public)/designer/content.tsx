"use client";

import { useLocale } from "next-intl";
import { useSiteConfig } from "@/providers/site-config-provider";
import { DEFAULT_PAGES_CONTENT } from "@/lib/site-config";
import { Container } from "@/components/shared/container";
import { SectionDivider } from "@/components/shared/section-divider";
import {
  Palette,
  PenTool,
  Layers,
  Wand2,
  Sparkles,
  Star,
  ArrowRight,
  ArrowLeft,
  Download,
  Eye,
  Heart,
  ExternalLink,
  Check,
  X,
  Crown,
  Zap,
  Clock,
  Users,
  Award,
  Target,
  Lightbulb,
  Paintbrush,
  Monitor,
  Smartphone,
  Image as ImageIcon,
  Camera,
  Scissors,
  Type,
  Droplets,
  MousePointer2,
  Quote,
  Mail,
  Phone,
  MapPin,
  Send,
  ChevronDown,
  Play,
  Infinity as InfinityIcon,
  GalleryHorizontalEnd,
} from "lucide-react";
import { motion, useInView, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
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

/* ─────────────────── Counter Animation ─────────────────── */

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = value;
    const duration = 2000;
    const stepTime = duration / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ─────────────────────────── SERVICES DATA ─────────────────────────── */

const services = [
  {
    icon: Paintbrush,
    titleEn: "Photo Retouching",
    titleAr: "تعديل الصور",
    descEn: "Professional-grade photo retouching with skin smoothing, color correction, and flawless finishing touches.",
    descAr: "تعديل صور احترافي مع تنعيم البشرة وتصحيح الألوان ولمسات نهائية مثالية.",
    backEn: "From $50/photo • 24hr turnaround • Unlimited revisions",
    backAr: "من ٥٠$/صورة • تسليم ٢٤ ساعة • تعديلات غير محدودة",
    color: "#FF6B6B",
  },
  {
    icon: Layers,
    titleEn: "Photo Manipulation",
    titleAr: "دمج الصور",
    descEn: "Surreal composites and creative photo manipulations that push the boundaries of reality.",
    descAr: "تركيبات سريالية وتلاعب إبداعي بالصور تتجاوز حدود الواقع.",
    backEn: "From $120/project • Complex composites • Concept art",
    backAr: "من ١٢٠$/مشروع • تركيبات معقدة • فن مفاهيمي",
    color: "#4ECDC4",
  },
  {
    icon: Type,
    titleEn: "Typography Design",
    titleAr: "تصميم الخطوط",
    descEn: "Custom lettering, kinetic typography, and text effects that make words come alive.",
    descAr: "خطوط مخصصة وتصميم حروف متحركة وتأثيرات نصية تجعل الكلمات تنبض بالحياة.",
    backEn: "From $80/design • Custom lettering • 3D text effects",
    backAr: "من ٨٠$/تصميم • خطوط مخصصة • تأثيرات نصية ثلاثية الأبعاد",
    color: "#45B7D1",
  },
  {
    icon: Wand2,
    titleEn: "Digital Art & Illustration",
    titleAr: "الفن الرقمي والرسم",
    descEn: "Hand-crafted digital illustrations, character design, and concept art for any project.",
    descAr: "رسومات رقمية مصنوعة يدوياً وتصميم شخصيات وفن مفاهيمي لأي مشروع.",
    backEn: "From $200/piece • Characters • Environments • Props",
    backAr: "من ٢٠٠$/قطعة • شخصيات • بيئات • عناصر",
    color: "#96CEB4",
  },
  {
    icon: ImageIcon,
    titleEn: "Social Media Graphics",
    titleAr: "تصاميم وسائل التواصل",
    descEn: "Scroll-stopping social media content — posts, stories, covers, and ad creatives.",
    descAr: "محتوى وسائل تواصل اجتماعي لافت — منشورات وقصص وأغلفة وإعلانات إبداعية.",
    backEn: "From $30/design • Bulk pricing • Brand consistency",
    backAr: "من ٣٠$/تصميم • أسعار الجملة • اتساق العلامة",
    color: "#DDA0DD",
  },
  {
    icon: Monitor,
    titleEn: "Brand Identity Design",
    titleAr: "تصميم الهوية البصرية",
    descEn: "Complete visual identity systems — logos, color palettes, brand guidelines, and collateral.",
    descAr: "أنظمة هوية بصرية كاملة — شعارات ولوحات ألوان وإرشادات العلامة التجارية.",
    backEn: "From $500/package • Full brand book • All file formats",
    backAr: "من ٥٠٠$/حزمة • كتاب علامة كامل • جميع صيغ الملفات",
    color: "#FFD93D",
  },
];

/* ─────────────────────────── TOOLS DATA ─────────────────────────── */

const tools = [
  { name: "Adobe Photoshop", level: 98, icon: "Ps" },
  { name: "Adobe Illustrator", level: 92, icon: "Ai" },
  { name: "Adobe Lightroom", level: 90, icon: "Lr" },
  { name: "Figma", level: 88, icon: "Fg" },
  { name: "After Effects", level: 85, icon: "Ae" },
  { name: "Procreate", level: 82, icon: "Pr" },
];

/* ─────────────────────────── PORTFOLIO DATA ─────────────────────────── */

const portfolioCategories = [
  { key: "all", labelEn: "All Work", labelAr: "كل الأعمال" },
  { key: "retouch", labelEn: "Retouching", labelAr: "التعديل" },
  { key: "manipulation", labelEn: "Manipulation", labelAr: "الدمج" },
  { key: "branding", labelEn: "Branding", labelAr: "العلامة" },
  { key: "social", labelEn: "Social Media", labelAr: "السوشيال" },
];

const portfolioItems = [
  { id: 1, src: "https://picsum.photos/seed/des-1/600/750", titleEn: "Fashion Editorial", titleAr: "أزياء تحريرية", cat: "retouch" },
  { id: 2, src: "https://picsum.photos/seed/des-2/600/400", titleEn: "Surreal Landscape", titleAr: "مناظر سريالية", cat: "manipulation" },
  { id: 3, src: "https://picsum.photos/seed/des-3/600/600", titleEn: "Luxury Logo Suite", titleAr: "مجموعة شعارات فاخرة", cat: "branding" },
  { id: 4, src: "https://picsum.photos/seed/des-4/600/400", titleEn: "Instagram Campaign", titleAr: "حملة إنستغرام", cat: "social" },
  { id: 5, src: "https://picsum.photos/seed/des-5/600/800", titleEn: "Beauty Retouch", titleAr: "تعديل تجميلي", cat: "retouch" },
  { id: 6, src: "https://picsum.photos/seed/des-6/600/600", titleEn: "Double Exposure", titleAr: "التعرض المزدوج", cat: "manipulation" },
  { id: 7, src: "https://picsum.photos/seed/des-7/600/450", titleEn: "Startup Branding", titleAr: "علامة شركة ناشئة", cat: "branding" },
  { id: 8, src: "https://picsum.photos/seed/des-8/600/600", titleEn: "Product Campaign", titleAr: "حملة منتج", cat: "social" },
  { id: 9, src: "https://picsum.photos/seed/des-9/600/700", titleEn: "Conceptual Portrait", titleAr: "بورتريه مفاهيمي", cat: "retouch" },
  { id: 10, src: "https://picsum.photos/seed/des-10/600/400", titleEn: "Fantasy World", titleAr: "عالم خيالي", cat: "manipulation" },
  { id: 11, src: "https://picsum.photos/seed/des-11/600/500", titleEn: "Restaurant Identity", titleAr: "هوية مطعم", cat: "branding" },
  { id: 12, src: "https://picsum.photos/seed/des-12/600/600", titleEn: "Story Highlights", titleAr: "أيقونات القصص", cat: "social" },
];

/* ─────────────────────────── PRICING DATA ─────────────────────────── */

const pricingPlans = [
  {
    nameEn: "Starter",
    nameAr: "المبتدئ",
    priceEn: "$49",
    priceAr: "٤٩$",
    periodEn: "/project",
    periodAr: "/مشروع",
    descEn: "Perfect for small projects and quick edits.",
    descAr: "مثالي للمشاريع الصغيرة والتعديلات السريعة.",
    features: [
      { en: "Basic photo retouching", ar: "تعديل صور أساسي" },
      { en: "2 revision rounds", ar: "جولتان من التعديلات" },
      { en: "48-hour delivery", ar: "تسليم خلال ٤٨ ساعة" },
      { en: "Web-ready files", ar: "ملفات جاهزة للويب" },
      { en: "Email support", ar: "دعم عبر البريد" },
    ],
    excluded: [
      { en: "Source files (PSD)", ar: "ملفات المصدر (PSD)" },
      { en: "Commercial license", ar: "ترخيص تجاري" },
    ],
    popular: false,
    icon: Zap,
  },
  {
    nameEn: "Professional",
    nameAr: "المحترف",
    priceEn: "$149",
    priceAr: "١٤٩$",
    periodEn: "/project",
    periodAr: "/مشروع",
    descEn: "The most popular choice for serious projects.",
    descAr: "الخيار الأكثر شيوعاً للمشاريع الجادة.",
    features: [
      { en: "Advanced retouching & compositing", ar: "تعديل ودمج متقدم" },
      { en: "Unlimited revisions", ar: "تعديلات غير محدودة" },
      { en: "24-hour delivery", ar: "تسليم خلال ٢٤ ساعة" },
      { en: "Print & web files", ar: "ملفات طباعة وويب" },
      { en: "Source files (PSD)", ar: "ملفات المصدر (PSD)" },
      { en: "Priority support", ar: "دعم ذو أولوية" },
      { en: "Commercial license", ar: "ترخيص تجاري" },
    ],
    excluded: [],
    popular: true,
    icon: Crown,
  },
  {
    nameEn: "Enterprise",
    nameAr: "المؤسسات",
    priceEn: "$499",
    priceAr: "٤٩٩$",
    periodEn: "/month",
    periodAr: "/شهرياً",
    descEn: "Dedicated designer for your ongoing creative needs.",
    descAr: "مصمم مخصص لاحتياجاتك الإبداعية المستمرة.",
    features: [
      { en: "Everything in Professional", ar: "كل ما في المحترف" },
      { en: "Dedicated designer", ar: "مصمم مخصص" },
      { en: "Same-day delivery", ar: "تسليم في نفس اليوم" },
      { en: "Brand guidelines included", ar: "إرشادات العلامة مضمنة" },
      { en: "Slack/WhatsApp support", ar: "دعم سلاك/واتساب" },
      { en: "Monthly strategy call", ar: "مكالمة استراتيجية شهرية" },
      { en: "Up to 20 designs/month", ar: "حتى ٢٠ تصميم/شهر" },
    ],
    excluded: [],
    popular: false,
    icon: InfinityIcon,
  },
];

/* ─────────────────────────── PROCESS DATA ─────────────────────────── */

const processSteps = [
  { icon: Lightbulb, titleEn: "Discovery", titleAr: "الاكتشاف", descEn: "We discuss your vision, goals, and target audience to understand the project scope.", descAr: "نناقش رؤيتك وأهدافك وجمهورك المستهدف لفهم نطاق المشروع." },
  { icon: PenTool, titleEn: "Concept", titleAr: "المفهوم", descEn: "I create mood boards and initial concepts to establish the creative direction.", descAr: "أنشئ لوحات مزاجية ومفاهيم أولية لتحديد الاتجاه الإبداعي." },
  { icon: Wand2, titleEn: "Creation", titleAr: "الإبداع", descEn: "The magic happens — pixel-perfect execution using industry-leading tools.", descAr: "يحدث السحر — تنفيذ دقيق باستخدام أدوات رائدة في المجال." },
  { icon: Sparkles, titleEn: "Delivery", titleAr: "التسليم", descEn: "Final files delivered in all formats needed, ready for print and digital.", descAr: "تسليم الملفات النهائية بجميع الصيغ المطلوبة، جاهزة للطباعة والرقمية." },
];

/* ─────────────────────────── TESTIMONIALS DATA ─────────────────────────── */

const testimonials = [
  {
    nameEn: "Sarah Mitchell",
    nameAr: "سارة ميتشل",
    roleEn: "Marketing Director, Luxe Fashion",
    roleAr: "مديرة تسويق، لوكس فاشن",
    quoteEn: "The photo retouching work was absolutely stunning. Every detail was handled with such precision and artistry. Our campaign visuals exceeded all expectations.",
    quoteAr: "كان عمل تعديل الصور مذهلاً للغاية. تم التعامل مع كل تفصيل بدقة وفنية. تجاوزت المرئيات حملتنا جميع التوقعات.",
    rating: 5,
  },
  {
    nameEn: "James Anderson",
    nameAr: "جيمس أندرسون",
    roleEn: "CEO, TechVision Startup",
    roleAr: "الرئيس التنفيذي، تيك فيجن",
    quoteEn: "Our complete brand identity was crafted with incredible attention to detail. The logo, color palette, and brand guidelines are world-class.",
    quoteAr: "تم تصميم هويتنا التجارية الكاملة باهتمام لا يصدق بالتفاصيل. الشعار ولوحة الألوان وإرشادات العلامة التجارية على مستوى عالمي.",
    rating: 5,
  },
  {
    nameEn: "Aisha Rahman",
    nameAr: "عائشة رحمن",
    roleEn: "Content Creator, 2M+ Followers",
    roleAr: "صانعة محتوى، +٢ مليون متابع",
    quoteEn: "The social media designs completely transformed my brand. My engagement went up by 300% after the redesign. Truly exceptional work!",
    quoteAr: "تصاميم وسائل التواصل الاجتماعي حولت علامتي التجارية بالكامل. ارتفع تفاعلي بنسبة ٣٠٠% بعد إعادة التصميم. عمل استثنائي حقاً!",
    rating: 5,
  },
];

/* ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════  MAIN COMPONENT  ═══════════════════════ */
/* ═══════════════════════════════════════════════════════════════════ */

export function DesignerContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const tx = (en: string, ar: string) => (isAr ? ar : en);
  const { config } = useSiteConfig();
  const sections = config.pagesContent?.designer?.sections ?? DEFAULT_PAGES_CONTENT.designer.sections;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [activePortfolioCat, setActivePortfolioCat] = useState("all");
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [hoveredPricing, setHoveredPricing] = useState<number | null>(null);

  const filteredPortfolio =
    activePortfolioCat === "all"
      ? portfolioItems
      : portfolioItems.filter((item) => item.cat === activePortfolioCat);

  const toggleFlip = useCallback((index: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {sections.hero?.visible !== false && (<>
      {/* ═══════════════════ 1. HERO SECTION ═══════════════════ */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: "var(--color-background)" }}
      >
        {/* Layered background effects */}
        <div className="absolute inset-0">
          {/* Gradient mesh */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 20% 50%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(var(--color-primary-rgb) / 0.05) 0%, transparent 40%),
                radial-gradient(ellipse at 50% 80%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 45%)
              `,
            }}
          />

          {/* Animated brush strokes */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`stroke-${i}`}
              className="absolute rounded-full"
              style={{
                width: 200 + i * 80,
                height: 3,
                background: `linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / ${0.05 + i * 0.02}), transparent)`,
                top: `${15 + i * 18}%`,
                left: `${-10 + i * 5}%`,
                transform: `rotate(${-15 + i * 8}deg)`,
              }}
              animate={{
                x: [0, 60, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8,
              }}
            />
          ))}

          {/* Floating design tools */}
          {[
            { Icon: PenTool, top: "12%", left: "8%", size: 32, rot: -15 },
            { Icon: Droplets, top: "22%", right: "12%", size: 28, rot: 20 },
            { Icon: Scissors, bottom: "25%", left: "15%", size: 26, rot: -10 },
            { Icon: MousePointer2, top: "65%", right: "8%", size: 30, rot: 15 },
            { Icon: Palette, top: "40%", left: "5%", size: 34, rot: -20 },
            { Icon: Layers, bottom: "15%", right: "18%", size: 24, rot: 5 },
          ].map((item, i) => (
            <motion.div
              key={`tool-${i}`}
              className="absolute hidden md:block"
              style={{
                ...item,
                color: "rgba(var(--color-primary-rgb) / 0.07)",
              }}
              animate={{
                y: [0, -25, 0],
                rotate: [item.rot, item.rot + 10, item.rot],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 5 + i * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.6,
              }}
            >
              <item.Icon style={{ width: item.size, height: item.size }} />
            </motion.div>
          ))}

          {/* Color palette dots */}
          {["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#DDA0DD", "#FFD93D"].map((color, i) => (
            <motion.div
              key={`dot-${i}`}
              className="absolute hidden lg:block rounded-full"
              style={{
                width: 8 + (i % 3) * 4,
                height: 8 + (i % 3) * 4,
                background: color,
                opacity: 0.15,
                top: `${20 + Math.sin(i) * 30}%`,
                left: `${15 + i * 13}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.25, 0.1],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        <Container className="relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.06)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                boxShadow: "0 0 30px rgba(var(--color-primary-rgb) / 0.05)",
              }}
            >
              <Palette className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
                {tx("Creative Graphic Designer", "مصمم جرافيك إبداعي")}
              </span>
            </motion.div>

            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, type: "spring" }}
              className="relative mb-8"
            >
              <div
                className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden relative"
                style={{
                  border: "3px solid rgba(var(--color-primary-rgb) / 0.2)",
                  boxShadow: "0 0 40px rgba(var(--color-primary-rgb) / 0.15)",
                }}
              >
                <Image
                  src="https://picsum.photos/seed/designer-avatar/256/256"
                  alt="Designer"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Status dot */}
              <motion.div
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{
                  background: "#22C55E",
                  borderColor: "var(--color-background)",
                }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {/* Orbiting ring */}
              <motion.div
                className="absolute inset-[-8px] rounded-full"
                style={{
                  border: "1px dashed rgba(var(--color-primary-rgb) / 0.15)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            {/* Name */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4"
              style={{ color: "var(--color-foreground)" }}
            >
              {tx("Alex", "أليكس")}{" "}
              <span style={{ color: "var(--color-primary)" }}>
                {tx("Rivera", "ريفيرا")}
              </span>
            </motion.h1>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-2 mb-6"
            >
              {[
                tx("Photoshop Artist", "فنان فوتوشوب"),
                tx("Brand Designer", "مصمم علامات"),
                tx("Visual Storyteller", "راوي قصص بصري"),
              ].map((tag, i) => (
                <span
                  key={i}
                  className="px-4 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.06)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base md:text-lg max-w-2xl leading-relaxed mb-10"
              style={{ color: "var(--color-foreground)", opacity: 0.6 }}
            >
              {tx(
                "I transform ideas into visual masterpieces. With 8+ years of Photoshop expertise, I create stunning designs that captivate audiences and elevate brands to new heights.",
                "أحول الأفكار إلى تحف بصرية. مع أكثر من ٨ سنوات من خبرة الفوتوشوب، أصنع تصاميم مذهلة تأسر الجماهير وترتقي بالعلامات التجارية إلى آفاق جديدة."
              )}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <motion.a
                href="#portfolio"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold"
                style={{
                  background: "var(--color-primary)",
                  color: "#ffffff",
                  boxShadow: "0 8px 24px rgba(var(--color-primary-rgb) / 0.3)",
                  transition: "all 0.3s ease",
                }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                {tx("View My Work", "شاهد أعمالي")}
                <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.a>
              <motion.a
                href="#contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                  transition: "all 0.3s ease",
                }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-primary)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.06)";
                  e.currentTarget.style.color = "var(--color-primary)";
                }}
              >
                <Download className="h-4 w-4" />
                {tx("Download CV", "تحميل السيرة")}
              </motion.a>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ color: "var(--color-foreground)", opacity: 0.2 }}
              >
                <ChevronDown className="h-6 w-6" />
              </motion.div>
            </motion.div>
          </div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.about?.visible !== false && (<>
      {/* ═══════════════════ 2. STATS BAR ═══════════════════ */}
      <section
        className="relative py-16 overflow-hidden"
        style={{
          background: "rgba(var(--color-primary-rgb) / 0.03)",
          borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.05)",
          borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.05)",
        }}
      >
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { icon: Clock, value: 8, suffix: "+", labelEn: "Years Experience", labelAr: "سنوات خبرة" },
              { icon: Users, value: 200, suffix: "+", labelEn: "Happy Clients", labelAr: "عميل سعيد" },
              { icon: ImageIcon, value: 1500, suffix: "+", labelEn: "Projects Done", labelAr: "مشروع منجز" },
              { icon: Award, value: 25, suffix: "+", labelEn: "Awards Won", labelAr: "جائزة" },
            ].map((stat, i) => (
              <AnimatedBlock key={i} delay={i * 0.1}>
                <div className="text-center">
                  <stat.icon
                    className="h-6 w-6 mx-auto mb-3"
                    style={{ color: "var(--color-primary)", opacity: 0.6 }}
                  />
                  <div
                    className="text-3xl md:text-4xl font-black mb-1"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--color-foreground)", opacity: 0.4 }}
                  >
                    {tx(stat.labelEn, stat.labelAr)}
                  </div>
                </div>
              </AnimatedBlock>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.services?.visible !== false && (<>
      {/* ═══════════════════ 3. SERVICES — FLIP CARDS ═══════════════════ */}
      <section id="services" style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <AnimatedBlock>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                }}
              >
                <Wand2 className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                  {tx("What I Do", "ماذا أقدم")}
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-black mb-4"
                style={{ color: "var(--color-foreground)" }}
              >
                {tx("Services & ", "خدماتي ")}{" "}
                <span style={{ color: "var(--color-primary)" }}>{tx("Expertise", "وخبراتي")}</span>
              </h2>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: "var(--color-foreground)", opacity: 0.5 }}>
                {tx(
                  "Click any card to flip it and see pricing details — every service crafted with pixel-perfect precision.",
                  "انقر على أي بطاقة لقلبها ورؤية تفاصيل الأسعار — كل خدمة مصممة بدقة متناهية."
                )}
              </p>
            </div>
          </AnimatedBlock>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => {
              const isFlipped = flippedCards.has(i);
              return (
                <AnimatedBlock key={i} delay={i * 0.08}>
                  <div
                    className="relative h-[280px] cursor-pointer"
                    style={{ perspective: "1000px" }}
                    onClick={() => toggleFlip(i)}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{ transformStyle: "preserve-3d" }}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {/* FRONT */}
                      <div
                        className="absolute inset-0 rounded-2xl p-6 flex flex-col"
                        style={{
                          backfaceVisibility: "hidden",
                          background: "var(--color-card)",
                          border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                          boxShadow: "0 4px 20px rgba(var(--color-primary-rgb) / 0.04)",
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                          style={{
                            background: `${service.color}15`,
                            color: service.color,
                          }}
                        >
                          <service.icon className="h-6 w-6" />
                        </div>
                        <h3
                          className="text-lg font-bold mb-2"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {tx(service.titleEn, service.titleAr)}
                        </h3>
                        <p
                          className="text-sm leading-relaxed flex-1"
                          style={{ color: "var(--color-foreground)", opacity: 0.5 }}
                        >
                          {tx(service.descEn, service.descAr)}
                        </p>
                        <div className="flex items-center gap-2 mt-4 text-xs font-medium" style={{ color: "var(--color-primary)" }}>
                          <span>{tx("Click to flip", "انقر للقلب")}</span>
                          <Arrow className="h-3 w-3" />
                        </div>
                      </div>

                      {/* BACK */}
                      <div
                        className="absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center text-center"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                          background: "var(--color-primary)",
                        }}
                      >
                        <service.icon className="h-8 w-8 text-white/30 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-3">
                          {tx(service.titleEn, service.titleAr)}
                        </h3>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {tx(service.backEn, service.backAr)}
                        </p>
                        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-white/50">
                          <span>{tx("Click to flip back", "انقر للعودة")}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </AnimatedBlock>
              );
            })}
          </div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.skills?.visible !== false && (<>
      {/* ═══════════════════ 4. TOOLS & SKILLS ═══════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Info */}
            <AnimatedBlock>
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.06)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  }}
                >
                  <Target className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                    {tx("Tools & Skills", "الأدوات والمهارات")}
                  </span>
                </div>
                <h2
                  className="text-3xl md:text-4xl font-black mb-4"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {tx("Mastery of ", "إتقان ")}{" "}
                  <span style={{ color: "var(--color-primary)" }}>{tx("Industry Tools", "أدوات المجال")}</span>
                </h2>
                <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: "var(--color-foreground)", opacity: 0.5 }}>
                  {tx(
                    "Proficient in the entire Adobe Creative Suite with deep expertise in Photoshop. Every tool is a brush — and I know exactly how to use each one.",
                    "متمكن من مجموعة Adobe Creative Suite بأكملها مع خبرة عميقة في الفوتوشوب. كل أداة هي فرشاة — وأعرف تماماً كيف أستخدم كل واحدة."
                  )}
                </p>
              </div>
            </AnimatedBlock>

            {/* Right — Skill bars */}
            <div className="space-y-5">
              {tools.map((tool, i) => (
                <AnimatedBlock key={i} delay={i * 0.08}>
                  <SkillBar tool={tool} index={i} />
                </AnimatedBlock>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.portfolio?.visible !== false && (<>
      {/* ═══════════════════ 5. PORTFOLIO ═══════════════════ */}
      <section id="portfolio" style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <AnimatedBlock>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                }}
              >
                <GalleryHorizontalEnd className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                  {tx("Portfolio", "المعرض")}
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-black mb-4"
                style={{ color: "var(--color-foreground)" }}
              >
                {tx("Selected ", "أعمال ")}{" "}
                <span style={{ color: "var(--color-primary)" }}>{tx("Works", "مختارة")}</span>
              </h2>
            </div>
          </AnimatedBlock>

          {/* Category filter */}
          <AnimatedBlock delay={0.1}>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {portfolioCategories.map((cat) => {
                const isActive = activePortfolioCat === cat.key;
                return (
                  <motion.button
                    key={cat.key}
                    onClick={() => setActivePortfolioCat(cat.key)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                    style={{
                      background: isActive ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.04)",
                      color: isActive ? "#ffffff" : "var(--color-foreground)",
                      border: `1px solid ${isActive ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.08)"}`,
                      transition: "all 0.3s ease",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tx(cat.labelEn, cat.labelAr)}
                  </motion.button>
                );
              })}
            </div>
          </AnimatedBlock>

          {/* Masonry gallery */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePortfolioCat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5"
            >
              {filteredPortfolio.map((item) => (
                <PortfolioCard key={item.id} item={item} isAr={isAr} tx={tx} />
              ))}
            </motion.div>
          </AnimatePresence>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.process?.visible !== false && (<>
      {/* ═══════════════════ 6. PROCESS ═══════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <AnimatedBlock>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                }}
              >
                <Target className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                  {tx("My Process", "منهجيتي")}
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-black mb-4"
                style={{ color: "var(--color-foreground)" }}
              >
                {tx("How I ", "كيف ")}{" "}
                <span style={{ color: "var(--color-primary)" }}>{tx("Work", "أعمل")}</span>
              </h2>
            </div>
          </AnimatedBlock>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute top-0 bottom-0 w-px hidden md:block"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.1)",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />

            {processSteps.map((step, i) => (
              <AnimatedBlock key={i} delay={i * 0.12}>
                <div className={`relative flex items-center gap-6 mb-12 last:mb-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  {/* Content */}
                  <div className={`flex-1 ${i % 2 === 0 ? "md:text-end" : "md:text-start"}`}>
                    <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-foreground)" }}>
                      {tx(step.titleEn, step.titleAr)}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)", opacity: 0.5 }}>
                      {tx(step.descEn, step.descAr)}
                    </p>
                  </div>

                  {/* Center icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
                    style={{
                      background: "var(--color-primary)",
                      boxShadow: "0 8px 24px rgba(var(--color-primary-rgb) / 0.3)",
                    }}
                  >
                    <step.icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 hidden md:block" />
                </div>
              </AnimatedBlock>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.pricing?.visible !== false && (<>
      {/* ═══════════════════ 7. PRICING ═══════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <AnimatedBlock>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                }}
              >
                <Crown className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                  {tx("Pricing", "الأسعار")}
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-black mb-4"
                style={{ color: "var(--color-foreground)" }}
              >
                {tx("Simple, Transparent ", "أسعار بسيطة ")}{" "}
                <span style={{ color: "var(--color-primary)" }}>{tx("Pricing", "وشفافة")}</span>
              </h2>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: "var(--color-foreground)", opacity: 0.5 }}>
                {tx(
                  "No hidden fees. No surprise charges. Just honest pricing for exceptional design work.",
                  "لا رسوم مخفية. لا مفاجآت. مجرد أسعار صادقة لعمل تصميم استثنائي."
                )}
              </p>
            </div>
          </AnimatedBlock>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <AnimatedBlock key={i} delay={i * 0.1}>
                <motion.div
                  className="relative rounded-2xl p-6 md:p-8 flex flex-col h-full"
                  style={{
                    background: plan.popular ? "var(--color-primary)" : "var(--color-card)",
                    border: `1px solid ${plan.popular ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.08)"}`,
                    boxShadow: plan.popular
                      ? "0 20px 60px rgba(var(--color-primary-rgb) / 0.3)"
                      : "0 4px 20px rgba(var(--color-primary-rgb) / 0.04)",
                    transform: hoveredPricing === i ? "translateY(-8px)" : plan.popular ? "translateY(-8px)" : "translateY(0)",
                    transition: "all 0.4s ease",
                  }}
                  onMouseEnter={() => setHoveredPricing(i)}
                  onMouseLeave={() => setHoveredPricing(null)}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: "var(--color-card)",
                        color: "var(--color-primary)",
                        boxShadow: "0 4px 12px rgba(var(--color-foreground-rgb, 0 0 0) / 0.1)",
                      }}
                    >
                      {tx("Most Popular", "الأكثر شيوعاً")}
                    </div>
                  )}

                  <plan.icon
                    className="h-8 w-8 mb-4"
                    style={{ color: plan.popular ? "rgba(255,255,255,0.4)" : "var(--color-primary)" }}
                  />

                  <h3
                    className="text-xl font-bold mb-1"
                    style={{ color: plan.popular ? "#ffffff" : "var(--color-foreground)" }}
                  >
                    {tx(plan.nameEn, plan.nameAr)}
                  </h3>
                  <p
                    className="text-xs mb-5"
                    style={{ color: plan.popular ? "rgba(255,255,255,0.6)" : "var(--color-foreground)", opacity: plan.popular ? 1 : 0.4 }}
                  >
                    {tx(plan.descEn, plan.descAr)}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-6">
                    <span
                      className="text-4xl font-black"
                      style={{ color: plan.popular ? "#ffffff" : "var(--color-foreground)" }}
                    >
                      {tx(plan.priceEn, plan.priceAr)}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: plan.popular ? "rgba(255,255,255,0.5)" : "var(--color-foreground)", opacity: plan.popular ? 1 : 0.4 }}
                    >
                      {tx(plan.periodEn, plan.periodAr)}
                    </span>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    {plan.features.map((f, fi) => (
                      <div key={fi} className="flex items-start gap-2.5">
                        <Check
                          className="h-4 w-4 mt-0.5 shrink-0"
                          style={{ color: plan.popular ? "rgba(255,255,255,0.8)" : "var(--color-primary)" }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: plan.popular ? "rgba(255,255,255,0.8)" : "var(--color-foreground)", opacity: plan.popular ? 1 : 0.6 }}
                        >
                          {tx(f.en, f.ar)}
                        </span>
                      </div>
                    ))}
                    {plan.excluded.map((f, fi) => (
                      <div key={`ex-${fi}`} className="flex items-start gap-2.5">
                        <X
                          className="h-4 w-4 mt-0.5 shrink-0"
                          style={{ color: plan.popular ? "rgba(255,255,255,0.3)" : "var(--color-foreground)", opacity: 0.25 }}
                        />
                        <span
                          className="text-sm line-through"
                          style={{ color: plan.popular ? "rgba(255,255,255,0.3)" : "var(--color-foreground)", opacity: 0.25 }}
                        >
                          {tx(f.en, f.ar)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <motion.button
                    className="mt-6 w-full py-3 rounded-xl text-sm font-bold cursor-pointer"
                    style={{
                      background: plan.popular ? "#ffffff" : "var(--color-primary)",
                      color: plan.popular ? "var(--color-primary)" : "#ffffff",
                      transition: "all 0.3s ease",
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={(e) => {
                      if (!plan.popular) {
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(var(--color-primary-rgb) / 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {tx("Get Started", "ابدأ الآن")}
                  </motion.button>
                </motion.div>
              </AnimatedBlock>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.testimonials?.visible !== false && (<>
      {/* ═══════════════════ 8. TESTIMONIALS ═══════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <AnimatedBlock>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                }}
              >
                <Star className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                  {tx("Testimonials", "آراء العملاء")}
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-black mb-4"
                style={{ color: "var(--color-foreground)" }}
              >
                {tx("What Clients ", "ماذا يقول ")}{" "}
                <span style={{ color: "var(--color-primary)" }}>{tx("Say", "العملاء")}</span>
              </h2>
            </div>
          </AnimatedBlock>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedBlock key={i} delay={i * 0.1}>
                <div
                  className="rounded-2xl p-6 h-full flex flex-col"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                    boxShadow: "0 4px 20px rgba(var(--color-primary-rgb) / 0.04)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(var(--color-primary-rgb) / 0.08)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(var(--color-primary-rgb) / 0.04)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, si) => (
                      <Star key={si} className="h-4 w-4 fill-current" style={{ color: "#FFD93D" }} />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative flex-1 mb-5">
                    <Quote
                      className="absolute -top-1 -left-1 h-8 w-8"
                      style={{ color: "rgba(var(--color-primary-rgb) / 0.08)" }}
                    />
                    <p
                      className="text-sm leading-relaxed relative z-10 pt-4"
                      style={{ color: "var(--color-foreground)", opacity: 0.65 }}
                    >
                      &ldquo;{tx(t.quoteEn, t.quoteAr)}&rdquo;
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden relative"
                      style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)" }}
                    >
                      <Image
                        src={`https://picsum.photos/seed/testimonial-${i}/80/80`}
                        alt={tx(t.nameEn, t.nameAr)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>
                        {tx(t.nameEn, t.nameAr)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-foreground)", opacity: 0.4 }}>
                        {tx(t.roleEn, t.roleAr)}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedBlock>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />
      </>)}

      {sections.contact?.visible !== false && (<>
      {/* ═══════════════════ 9. CONTACT / CTA ═══════════════════ */}
      <section id="contact" style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left — Info */}
            <AnimatedBlock>
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.06)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  }}
                >
                  <Send className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                    {tx("Get in Touch", "تواصل معي")}
                  </span>
                </div>
                <h2
                  className="text-3xl md:text-4xl font-black mb-4"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {tx("Let's Create ", "لنصنع ")}{" "}
                  <span style={{ color: "var(--color-primary)" }}>{tx("Together", "معاً")}</span>
                </h2>
                <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: "var(--color-foreground)", opacity: 0.5 }}>
                  {tx(
                    "Whether you need a single design or a complete brand overhaul, I'm here to bring your vision to life. Let's chat about your next project!",
                    "سواء كنت بحاجة لتصميم واحد أو تجديد كامل للعلامة التجارية، أنا هنا لإحياء رؤيتك. دعنا نتحدث عن مشروعك القادم!"
                  )}
                </p>

                {/* Contact methods */}
                <div className="space-y-4">
                  {[
                    { icon: Mail, labelEn: "alex@designer.com", labelAr: "alex@designer.com" },
                    { icon: Phone, labelEn: "+1 (555) 123-4567", labelAr: "+1 (555) 123-4567" },
                    { icon: MapPin, labelEn: "San Francisco, CA", labelAr: "سان فرانسيسكو، كاليفورنيا" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.03)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
                        e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
                        e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)";
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: "rgba(var(--color-primary-rgb) / 0.08)",
                          color: "var(--color-primary)",
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium" style={{ color: "var(--color-foreground)", opacity: 0.7 }}>
                        {tx(item.labelEn, item.labelAr)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedBlock>

            {/* Right — Form */}
            <AnimatedBlock delay={0.15}>
              <div
                className="rounded-2xl p-6 md:p-8"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  boxShadow: "0 8px 32px rgba(var(--color-primary-rgb) / 0.04)",
                }}
              >
                <div className="space-y-5">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { labelEn: "Your Name", labelAr: "اسمك", placeholder: tx("John Doe", "محمد أحمد") },
                      { labelEn: "Email", labelAr: "البريد", placeholder: "hello@example.com" },
                    ].map((field, fi) => (
                      <div key={fi}>
                        <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--color-foreground)", opacity: 0.4 }}>
                          {tx(field.labelEn, field.labelAr)}
                        </label>
                        <input
                          type={fi === 1 ? "email" : "text"}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                          style={{
                            background: "rgba(var(--color-primary-rgb) / 0.03)",
                            border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                            color: "var(--color-foreground)",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)")}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Service select */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--color-foreground)", opacity: 0.4 }}>
                      {tx("Service Needed", "الخدمة المطلوبة")}
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.03)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                        color: "var(--color-foreground)",
                      }}
                    >
                      <option>{tx("Select a service...", "اختر خدمة...")}</option>
                      {services.map((s, si) => (
                        <option key={si}>{tx(s.titleEn, s.titleAr)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Budget select */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--color-foreground)", opacity: 0.4 }}>
                      {tx("Budget Range", "الميزانية")}
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.03)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                        color: "var(--color-foreground)",
                      }}
                    >
                      <option>{tx("Select budget...", "اختر الميزانية...")}</option>
                      <option>$50 - $200</option>
                      <option>$200 - $500</option>
                      <option>$500 - $1,000</option>
                      <option>$1,000+</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--color-foreground)", opacity: 0.4 }}>
                      {tx("Project Details", "تفاصيل المشروع")}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={tx("Tell me about your project...", "أخبرني عن مشروعك...")}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.03)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                        color: "var(--color-foreground)",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)")}
                    />
                  </div>

                  {/* Submit */}
                  <motion.button
                    className="w-full py-3.5 rounded-xl text-sm font-bold cursor-pointer flex items-center justify-center gap-2"
                    style={{
                      background: "var(--color-primary)",
                      color: "#ffffff",
                      boxShadow: "0 8px 24px rgba(var(--color-primary-rgb) / 0.3)",
                      transition: "all 0.3s ease",
                    }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="h-4 w-4" />
                    {tx("Send Message", "أرسل رسالة")}
                  </motion.button>
                </div>
              </div>
            </AnimatedBlock>
          </div>
        </Container>
      </section>
      </>)}
    </div>
  );
}

/* ═══════════════════════════ SKILL BAR ═══════════════════════════ */

function SkillBar({ tool, index }: { tool: (typeof tools)[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div
      ref={ref}
      className="group rounded-xl p-4"
      style={{
        background: "rgba(var(--color-primary-rgb) / 0.02)",
        border: "1px solid rgba(var(--color-primary-rgb) / 0.05)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.12)";
        e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.05)";
        e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.02)";
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black"
            style={{
              background: "rgba(var(--color-primary-rgb) / 0.1)",
              color: "var(--color-primary)",
            }}
          >
            {tool.icon}
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            {tool.name}
          </span>
        </div>
        <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
          {tool.level}%
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(var(--color-primary-rgb) / 0.06)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "var(--color-primary)",
            boxShadow: "0 0 12px rgba(var(--color-primary-rgb) / 0.4)",
          }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${tool.level}%` } : {}}
          transition={{ duration: 1.2, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════ PORTFOLIO CARD ═══════════════════════════ */

function PortfolioCard({
  item,
  isAr,
  tx,
}: {
  item: (typeof portfolioItems)[0];
  isAr: boolean;
  tx: (en: string, ar: string) => string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="group relative break-inside-avoid rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
        transition: "all 0.4s ease",
      }}
      onMouseEnter={(e) => {
        setHovered(true);
        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
        e.currentTarget.style.boxShadow = "0 16px 48px rgba(var(--color-primary-rgb) / 0.12)";
        e.currentTarget.style.transform = "translateY(-6px)";
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.06)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <Image
        src={item.src}
        alt={tx(item.titleEn, item.titleAr)}
        width={600}
        height={600}
        className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-400"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(var(--color-primary-rgb) / 0.15) 0%, transparent 60%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Content */}
      <div
        className="absolute bottom-0 left-0 right-0 p-5 z-10 transition-all duration-400"
        style={{
          transform: hovered ? "translateY(0)" : "translateY(10px)",
          opacity: hovered ? 1 : 0,
        }}
      >
        <h3 className="text-base font-bold text-white mb-1">
          {tx(item.titleEn, item.titleAr)}
        </h3>
        <span className="text-xs text-white/50 uppercase tracking-wider">
          {item.cat}
        </span>
      </div>

      {/* Zoom icon */}
      <div
        className="absolute top-4 right-4 transition-all duration-300 z-10"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.8)",
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Eye className="h-4 w-4 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
