"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import { useSiteConfig } from "@/providers/site-config-provider";
import { DEFAULT_PAGES_CONTENT } from "@/lib/site-config";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  Star,
  Quote,
  Play,
  ShieldCheck,
  Award,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Users,
  ThumbsUp,
  TrendingUp,
  Sparkles,
} from "lucide-react";

/* ───────────────── Testimonial Data ───────────────── */

const testimonials = [
  {
    nameEn: "Ahmed Al-Rashid",
    nameAr: "أحمد الراشد",
    roleEn: "CEO, TechVision",
    roleAr: "المدير التنفيذي، تك فيجن",
    image: "https://picsum.photos/seed/client1/200/200",
    ratingStars: 5,
    quoteEn:
      "Working with this team transformed our digital presence completely. Their attention to detail and innovative approach exceeded all expectations.",
    quoteAr:
      "العمل مع هذا الفريق غيّر حضورنا الرقمي بالكامل. اهتمامهم بالتفاصيل ونهجهم المبتكر تجاوز كل التوقعات.",
    categoryEn: "Web Development",
    categoryAr: "تطوير الويب",
  },
  {
    nameEn: "Sara Al-Mansoori",
    nameAr: "سارة المنصوري",
    roleEn: "Marketing Director, Bloom Agency",
    roleAr: "مديرة التسويق، وكالة بلوم",
    image: "https://picsum.photos/seed/client2/200/200",
    ratingStars: 5,
    quoteEn:
      "Their digital marketing strategy doubled our online engagement within three months. A truly data-driven team that delivers real results.",
    quoteAr:
      "استراتيجيتهم في التسويق الرقمي ضاعفت تفاعلنا عبر الإنترنت خلال ثلاثة أشهر. فريق يعتمد على البيانات ويحقق نتائج حقيقية.",
    categoryEn: "Digital Marketing",
    categoryAr: "التسويق الرقمي",
  },
  {
    nameEn: "Khalid Al-Fahad",
    nameAr: "خالد الفهد",
    roleEn: "Founder, AppNova",
    roleAr: "المؤسس، آب نوفا",
    image: "https://picsum.photos/seed/client3/200/200",
    ratingStars: 5,
    quoteEn:
      "They built our mobile app from scratch and the user experience is flawless. Downloads exceeded our projections by 300% in the first quarter.",
    quoteAr:
      "بنوا تطبيقنا من الصفر وتجربة المستخدم مثالية. التحميلات تجاوزت توقعاتنا بنسبة 300% في الربع الأول.",
    categoryEn: "Mobile Apps",
    categoryAr: "تطبيقات الجوال",
  },
  {
    nameEn: "Fatima Al-Zahrani",
    nameAr: "فاطمة الزهراني",
    roleEn: "Product Manager, DesignLab",
    roleAr: "مديرة المنتجات، ديزاين لاب",
    image: "https://picsum.photos/seed/client4/200/200",
    ratingStars: 5,
    quoteEn:
      "The UI/UX redesign they delivered increased our conversion rate by 45%. Every pixel was crafted with purpose and precision.",
    quoteAr:
      "إعادة تصميم واجهة المستخدم رفعت معدل التحويل بنسبة 45%. كل بكسل صُمّم بهدف ودقة.",
    categoryEn: "UI/UX Design",
    categoryAr: "تصميم واجهة المستخدم",
  },
  {
    nameEn: "Omar Al-Harbi",
    nameAr: "عمر الحربي",
    roleEn: "CTO, CloudFirst",
    roleAr: "المدير التقني، كلاود فيرست",
    image: "https://picsum.photos/seed/client5/200/200",
    ratingStars: 5,
    quoteEn:
      "Their consulting services helped us modernize our entire tech stack. The migration was seamless and our performance improved tenfold.",
    quoteAr:
      "خدماتهم الاستشارية ساعدتنا على تحديث بنيتنا التقنية بالكامل. كان الانتقال سلسًا وتحسّن أداؤنا عشرة أضعاف.",
    categoryEn: "Consulting",
    categoryAr: "الاستشارات",
  },
  {
    nameEn: "Layla Al-Otaibi",
    nameAr: "ليلى العتيبي",
    roleEn: "Brand Manager, LuxeStyle",
    roleAr: "مديرة العلامة التجارية، لوكس ستايل",
    image: "https://picsum.photos/seed/client6/200/200",
    ratingStars: 5,
    quoteEn:
      "They completely reimagined our brand identity. The new visual language resonates perfectly with our audience and elevated our market position.",
    quoteAr:
      "أعادوا تصور هوية علامتنا التجارية بالكامل. اللغة البصرية الجديدة تتوافق تمامًا مع جمهورنا ورفعت مكانتنا في السوق.",
    categoryEn: "Branding",
    categoryAr: "العلامة التجارية",
  },
  {
    nameEn: "Youssef Al-Qahtani",
    nameAr: "يوسف القحطاني",
    roleEn: "Operations Lead, SwiftLogistics",
    roleAr: "رئيس العمليات، سويفت لوجستيكس",
    image: "https://picsum.photos/seed/client7/200/200",
    ratingStars: 5,
    quoteEn:
      "The web platform they developed streamlined our operations and cut processing time by 60%. Outstanding technical expertise and delivery.",
    quoteAr:
      "المنصة التي طوروها بسّطت عملياتنا وقلّصت وقت المعالجة بنسبة 60%. خبرة تقنية وتنفيذ استثنائيان.",
    categoryEn: "Web Development",
    categoryAr: "تطوير الويب",
  },
  {
    nameEn: "Nadia Al-Ghamdi",
    nameAr: "نادية الغامدي",
    roleEn: "CEO, PixelWave Studios",
    roleAr: "المديرة التنفيذية، بيكسل ويف ستوديوز",
    image: "https://picsum.photos/seed/client8/200/200",
    ratingStars: 5,
    quoteEn:
      "From concept to launch, they guided us through every step. Our mobile app won a regional design award thanks to their brilliant UX work.",
    quoteAr:
      "من الفكرة إلى الإطلاق، رافقونا في كل خطوة. تطبيقنا فاز بجائزة تصميم إقليمية بفضل عملهم المتميز في تجربة المستخدم.",
    categoryEn: "Mobile Apps",
    categoryAr: "تطبيقات الجوال",
  },
];

const categories = [
  { en: "All", ar: "الكل" },
  { en: "Web Development", ar: "تطوير الويب" },
  { en: "Mobile Apps", ar: "تطبيقات الجوال" },
  { en: "UI/UX Design", ar: "تصميم واجهة المستخدم" },
  { en: "Digital Marketing", ar: "التسويق الرقمي" },
  { en: "Branding", ar: "العلامة التجارية" },
  { en: "Consulting", ar: "الاستشارات" },
];

const stats = [
  {
    value: "500+",
    labelEn: "Happy Clients",
    labelAr: "عميل سعيد",
    icon: Users,
  },
  {
    value: "4.9/5",
    labelEn: "Average Rating",
    labelAr: "متوسط التقييم",
    icon: Star,
  },
  {
    value: "98%",
    labelEn: "Would Recommend",
    labelAr: "يوصون بنا",
    icon: ThumbsUp,
  },
  {
    value: "200+",
    labelEn: "5-Star Reviews",
    labelAr: "تقييم 5 نجوم",
    icon: TrendingUp,
  },
];

const trustBadges = [
  { labelEn: "Verified Reviews", labelAr: "تقييمات موثّقة", icon: ShieldCheck },
  { labelEn: "Google 4.9★", labelAr: "جوجل 4.9★", icon: Star },
  { labelEn: "Clutch Top Agency", labelAr: "وكالة رائدة على Clutch", icon: Award },
  { labelEn: "ISO Certified", labelAr: "حاصلون على شهادة ISO", icon: CheckCircle },
];

/* ───────────────── Star Rating Component ───────────────── */

function StarRating({ count = 5, size = 16 }: { count?: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill="var(--color-primary)"
          style={{ color: "var(--color-primary)" }}
        />
      ))}
    </div>
  );
}

/* ───────────────── Animated Counter ───────────────── */

function AnimatedValue({ value, inView }: { value: string; inView: boolean }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="text-3xl md:text-4xl font-bold"
      style={{ color: "var(--color-primary)" }}
    >
      {value}
    </motion.span>
  );
}

/* ───────────────── Section 1: Premium Hero ───────────────── */

function HeroSection({ isAr }: { isAr: boolean }) {
  const t = useTranslations("testimonials");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{
        paddingBlock: "var(--section-y)",
        background:
          "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.08) 0%, var(--color-background) 50%, rgba(var(--color-primary-rgb) / 0.05) 100%)",
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.1) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)",
        }}
      />

      <Container>
        <div className="text-center max-w-3xl mx-auto">
          {/* Star rating display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <StarRating count={5} size={24} />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              {isAr ? "4.9/5 من 500+ عميل" : "4.9/5 from 500+ clients"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ color: "var(--color-foreground)" }}
          >
            {t("title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: "rgba(var(--color-primary-rgb) / 0.7)" }}
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </Container>
    </section>
  );
}

/* ───────────────── Section 2: Featured Testimonial ───────────────── */

function FeaturedTestimonial({ isAr }: { isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const featured = testimonials[0];

  return (
    <section ref={ref} style={{ paddingBlock: "var(--section-y)" }}>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative rounded-2xl p-8 md:p-12 overflow-hidden"
          style={{
            background: "var(--color-card)",
            border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
            boxShadow:
              "0 0 60px rgba(var(--color-primary-rgb) / 0.08), 0 8px 32px rgba(var(--color-primary-rgb) / 0.06)",
          }}
        >
          {/* Glow effect */}
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.15) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.1) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col md:flex-row items-center gap-8">
            {/* Large quote icon */}
            <div className="shrink-0">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.1)",
                  border: "2px solid rgba(var(--color-primary-rgb) / 0.2)",
                }}
              >
                <Quote
                  size={32}
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
            </div>

            <div className="flex-1 text-center md:text-start">
              <p
                className="text-lg md:text-xl lg:text-2xl leading-relaxed font-medium mb-6 italic"
                style={{ color: "var(--color-foreground)" }}
              >
                &ldquo;{isAr ? featured.quoteAr : featured.quoteEn}&rdquo;
              </p>

              <StarRating count={featured.ratingStars} size={20} />

              <div className="flex items-center gap-4 mt-5 justify-center md:justify-start">
                <div
                  className="relative w-14 h-14 rounded-full overflow-hidden"
                  style={{
                    border: "3px solid rgba(var(--color-primary-rgb) / 0.3)",
                    boxShadow: "0 0 20px rgba(var(--color-primary-rgb) / 0.15)",
                  }}
                >
                  <Image
                    src={featured.image}
                    alt={isAr ? featured.nameAr : featured.nameEn}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3
                    className="font-bold text-base"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {isAr ? featured.nameAr : featured.nameEn}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
                  >
                    {isAr ? featured.roleAr : featured.roleEn}
                  </p>
                </div>
                <span
                  className="hidden sm:inline-block text-xs font-medium px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.1)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
                  }}
                >
                  {isAr ? featured.categoryAr : featured.categoryEn}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

/* ───────────────── Section 3: Stats Row ───────────────── */

function StatsRow({ isAr }: { isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      style={{
        paddingBlock: "calc(var(--section-y) / 1.5)",
        background: "rgba(var(--color-primary-rgb) / 0.03)",
      }}
    >
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center p-6 rounded-xl"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.1)",
                  }}
                >
                  <Icon size={20} style={{ color: "var(--color-primary)" }} />
                </div>
                <AnimatedValue value={stat.value} inView={inView} />
                <p
                  className="text-sm mt-1 font-medium"
                  style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
                >
                  {isAr ? stat.labelAr : stat.labelEn}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ───────────────── Section 4 & 5: Category Filter + Testimonials Grid ───────────────── */

function TestimonialsGrid({ isAr }: { isAr: boolean }) {
  const t = useTranslations("testimonials");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? testimonials
      : testimonials.filter((item) => item.categoryEn === activeCategory);

  // Masonry column assignment
  const columns: (typeof testimonials)[] = [[], [], []];
  filtered.forEach((item, i) => {
    columns[i % 3].push(item);
  });

  return (
    <section ref={ref} style={{ paddingBlock: "var(--section-y)" }}>
      <Container>
        <SectionHeading
          title={t("title")}
          subtitle={t("subtitle")}
        />

        {/* Category Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.en;
            return (
              <button
                key={cat.en}
                onClick={() => setActiveCategory(cat.en)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer"
                style={{
                  background: isActive
                    ? "var(--color-primary)"
                    : "rgba(var(--color-primary-rgb) / 0.08)",
                  color: isActive
                    ? "var(--color-background)"
                    : "var(--color-foreground)",
                  border: `1px solid ${
                    isActive
                      ? "var(--color-primary)"
                      : "rgba(var(--color-primary-rgb) / 0.15)"
                  }`,
                }}
              >
                {isAr ? cat.ar : cat.en}
              </button>
            );
          })}
        </motion.div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-6">
              {col.map((item, itemIdx) => {
                const globalIdx = colIdx + itemIdx * 3;
                // Vary card heights for masonry effect
                const isLarge = globalIdx % 3 === 0;
                return (
                  <motion.div
                    key={`${item.nameEn}-${activeCategory}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      duration: 0.5,
                      delay: 0.1 * globalIdx,
                      ease: "easeOut",
                    }}
                    className="group relative rounded-xl p-6 transition-all duration-300"
                    style={{
                      background: "var(--color-card)",
                      border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    }}
                    whileHover={{
                      y: -4,
                      boxShadow:
                        "0 0 30px rgba(var(--color-primary-rgb) / 0.12), 0 8px 24px rgba(var(--color-primary-rgb) / 0.08)",
                      borderColor: "rgba(var(--color-primary-rgb) / 0.3)",
                    }}
                  >
                    {/* Glass overlay */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.04) 0%, transparent 60%)",
                      }}
                    />

                    <div className="relative">
                      {/* Quote */}
                      <Quote
                        size={20}
                        className="mb-3"
                        style={{
                          color: "rgba(var(--color-primary-rgb) / 0.3)",
                        }}
                      />
                      <p
                        className={`leading-relaxed mb-4 ${
                          isLarge ? "text-base" : "text-sm"
                        }`}
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {isAr ? item.quoteAr : item.quoteEn}
                      </p>

                      {/* Star Rating */}
                      <div className="mb-4">
                        <StarRating count={item.ratingStars} size={14} />
                      </div>

                      {/* Client Info */}
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-10 h-10 rounded-full overflow-hidden shrink-0"
                          style={{
                            border:
                              "2px solid rgba(var(--color-primary-rgb) / 0.2)",
                          }}
                        >
                          <Image
                            src={item.image}
                            alt={isAr ? item.nameAr : item.nameEn}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="font-semibold text-sm truncate"
                            style={{ color: "var(--color-foreground)" }}
                          >
                            {isAr ? item.nameAr : item.nameEn}
                          </h4>
                          <p
                            className="text-xs truncate"
                            style={{
                              color: "rgba(var(--color-primary-rgb) / 0.5)",
                            }}
                          >
                            {isAr ? item.roleAr : item.roleEn}
                          </p>
                        </div>
                        <span
                          className="hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background:
                              "rgba(var(--color-primary-rgb) / 0.08)",
                            color: "var(--color-primary)",
                            border:
                              "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                          }}
                        >
                          {isAr ? item.categoryAr : item.categoryEn}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ───────────────── Section 6: Video Testimonials Placeholder ───────────────── */

function VideoTestimonials({ isAr }: { isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const videoPlaceholders = [
    {
      image: "https://picsum.photos/seed/vid1/600/400",
      nameEn: "Ahmed Al-Rashid",
      nameAr: "أحمد الراشد",
      companyEn: "TechVision",
      companyAr: "تك فيجن",
    },
    {
      image: "https://picsum.photos/seed/vid2/600/400",
      nameEn: "Sara Al-Mansoori",
      nameAr: "سارة المنصوري",
      companyEn: "Bloom Agency",
      companyAr: "وكالة بلوم",
    },
    {
      image: "https://picsum.photos/seed/vid3/600/400",
      nameEn: "Khalid Al-Fahad",
      nameAr: "خالد الفهد",
      companyEn: "AppNova",
      companyAr: "آب نوفا",
    },
  ];

  return (
    <section
      ref={ref}
      style={{
        paddingBlock: "var(--section-y)",
        background: "rgba(var(--color-primary-rgb) / 0.03)",
      }}
    >
      <Container>
        <SectionHeading
          title={isAr ? "شهادات مرئية" : "Video Testimonials"}
          subtitle={isAr ? "اسمع من عملائنا" : "Hear From Our Clients"}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {videoPlaceholders.map((video, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative rounded-xl overflow-hidden cursor-pointer"
              style={{
                border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
              }}
            >
              <div className="relative aspect-video">
                <Image
                  src={video.image}
                  alt={isAr ? video.nameAr : video.nameEn}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                  style={{
                    background:
                      "rgba(var(--color-primary-rgb) / 0.25)",
                  }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.3)",
                      border: "2px solid rgba(var(--color-primary-rgb) / 0.5)",
                    }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Play
                      size={24}
                      fill="var(--color-primary)"
                      style={{ color: "var(--color-primary)" }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Name overlay */}
              <div
                className="absolute bottom-0 inset-x-0 p-4"
                style={{
                  background:
                    "linear-gradient(to top, var(--color-background), transparent)",
                }}
              >
                <h4
                  className="font-semibold text-sm"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {isAr ? video.nameAr : video.nameEn}
                </h4>
                <p
                  className="text-xs"
                  style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
                >
                  {isAr ? video.companyAr : video.companyEn}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ───────────────── Section 7: Trust Badges ───────────────── */

function TrustBadges({ isAr }: { isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} style={{ paddingBlock: "calc(var(--section-y) / 1.5)" }}>
      <Container>
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {trustBadges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-2 px-5 py-3 rounded-full"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                }}
              >
                <Icon
                  size={18}
                  style={{ color: "var(--color-primary)" }}
                />
                <span
                  className="text-sm font-medium whitespace-nowrap"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {isAr ? badge.labelAr : badge.labelEn}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}

/* ───────────────── Section 8: CTA Section ───────────────── */

function CTASection({ isAr }: { isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      style={{
        paddingBlock: "var(--section-y)",
        background:
          "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.06) 0%, var(--color-background) 50%, rgba(var(--color-primary-rgb) / 0.04) 100%)",
      }}
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "rgba(var(--color-primary-rgb) / 0.1)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
            }}
          >
            <Sparkles size={28} style={{ color: "var(--color-primary)" }} />
          </motion.div>

          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4"
            style={{ color: "var(--color-foreground)" }}
          >
            {isAr
              ? "انضم إلى قائمة عملائنا السعداء"
              : "Join Our Growing List of Happy Clients"}
          </h2>

          <p
            className="text-base leading-relaxed mb-8 max-w-lg mx-auto"
            style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
          >
            {isAr
              ? "ابدأ رحلتك الرقمية معنا اليوم واكتشف لماذا يثق بنا أكثر من 500 عميل."
              : "Start your digital journey with us today and discover why 500+ clients trust us with their success."}
          </p>

          <Link href="/contact">
            <motion.span
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 cursor-pointer"
              style={{
                background: "var(--color-primary)",
                color: "var(--color-background)",
                boxShadow:
                  "0 4px 20px rgba(var(--color-primary-rgb) / 0.3)",
              }}
              whileHover={{
                scale: 1.03,
                boxShadow:
                  "0 8px 32px rgba(var(--color-primary-rgb) / 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
            >
              {isAr ? "تواصل معنا" : "Get In Touch"}
              {isAr ? (
                <ArrowLeft size={18} />
              ) : (
                <ArrowRight size={18} />
              )}
            </motion.span>
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}

/* ───────────────── Main Export ───────────────── */

export function TestimonialsContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config } = useSiteConfig();
  const sections = config.pagesContent?.testimonials?.sections ?? DEFAULT_PAGES_CONTENT.testimonials.sections;

  return (
    <main style={{ background: "var(--color-background)" }}>
      {sections.hero?.visible !== false && (<>
      {/* Section 1: Premium Hero */}
      <HeroSection isAr={isAr} />

      <SectionDivider />
      </>)}

      {sections.featured?.visible !== false && (<>
      {/* Section 2: Featured Testimonial */}
      <FeaturedTestimonial isAr={isAr} />

      <SectionDivider />
      </>)}

      {sections.stats?.visible !== false && (<>
      {/* Section 3: Stats Row */}
      <StatsRow isAr={isAr} />

      <SectionDivider />
      </>)}

      {sections.grid?.visible !== false && (<>
      {/* Section 4 & 5: Category Filter + Testimonials Grid */}
      <TestimonialsGrid isAr={isAr} />

      <SectionDivider />
      </>)}

      {sections.video?.visible !== false && (<>
      {/* Section 6: Video Testimonials */}
      <VideoTestimonials isAr={isAr} />

      <SectionDivider />
      </>)}

      {sections.trust?.visible !== false && (<>
      {/* Section 7: Trust Badges */}
      <TrustBadges isAr={isAr} />

      <SectionDivider />
      </>)}

      {sections.cta?.visible !== false && (
      /* Section 8: CTA */
      <CTASection isAr={isAr} />
      )}
    </main>
  );
}
