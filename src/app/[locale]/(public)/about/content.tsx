"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import { Modal } from "@/components/shared/modal";
import {
  Target,
  Eye,
  Heart,
  Users,
  Award,
  Globe,
  Clock,
  Mail,
  Linkedin,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Quote,
  Sparkles,
  Layers,
  Zap,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { motion, useInView, useSpring, useMotionValue } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

/* ───────────────── Data ───────────────── */

const values = [
  { key: "mission", icon: Target },
  { key: "vision", icon: Eye },
  { key: "values", icon: Heart },
];

const team = [
  {
    name: "\u0645\u062d\u0645\u062f \u0623\u062d\u0645\u062f",
    nameEn: "Mohammed Ahmed",
    role: "\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u062a\u0646\u0641\u064a\u0630\u064a",
    roleEn: "CEO",
    image: "https://picsum.photos/seed/team1/400/400",
    bioAr: "\u062e\u0628\u0631\u0629 +15 \u0633\u0646\u0629 \u0641\u064a \u0642\u064a\u0627\u062f\u0629 \u0627\u0644\u0641\u0631\u0642 \u0627\u0644\u062a\u0642\u0646\u064a\u0629 \u0648\u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u0631\u0642\u0645\u064a\u0629 \u0627\u0644\u0645\u0628\u062a\u0643\u0631\u0629",
    bioEn:
      "15+ years leading tech teams and building innovative digital products",
  },
  {
    name: "\u0646\u0648\u0631\u0629 \u0627\u0644\u0633\u0627\u0644\u0645",
    nameEn: "Noura Al-Salem",
    role: "\u0645\u062f\u064a\u0631\u0629 \u0627\u0644\u062a\u0635\u0645\u064a\u0645",
    roleEn: "Design Director",
    image: "https://picsum.photos/seed/team2/400/400",
    bioAr: "\u0645\u0635\u0645\u0645\u0629 \u062d\u0627\u0626\u0632\u0629 \u0639\u0644\u0649 \u062c\u0648\u0627\u0626\u0632 \u0645\u062a\u0639\u062f\u062f\u0629 \u0645\u0639 \u0634\u063a\u0641 \u0628\u062a\u062c\u0631\u0628\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0648\u0627\u0644\u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0628\u0635\u0631\u064a",
    bioEn: "Award-winning designer with a passion for UX and visual design",
  },
  {
    name: "\u0641\u0647\u062f \u0627\u0644\u0639\u0645\u0631\u064a",
    nameEn: "Fahd Al-Omari",
    role: "\u0645\u062f\u064a\u0631 \u0627\u0644\u062a\u0637\u0648\u064a\u0631",
    roleEn: "Dev Lead",
    image: "https://picsum.photos/seed/team3/400/400",
    bioAr: "\u0645\u0637\u0648\u0631 \u0645\u062a\u0645\u0631\u0633 \u0641\u064a \u0628\u0646\u0627\u0621 \u0623\u0646\u0638\u0645\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u0648\u0633\u0639 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0623\u062d\u062f\u062b \u0627\u0644\u062a\u0642\u0646\u064a\u0627\u062a",
    bioEn:
      "Experienced developer building scalable systems with cutting-edge tech",
  },
  {
    name: "\u0631\u064a\u0645 \u0627\u0644\u062d\u0631\u0628\u064a",
    nameEn: "Reem Al-Harbi",
    role: "\u0645\u062f\u064a\u0631\u0629 \u0627\u0644\u062a\u0633\u0648\u064a\u0642",
    roleEn: "Marketing Lead",
    image: "https://picsum.photos/seed/team4/400/400",
    bioAr: "\u062e\u0628\u064a\u0631\u0629 \u0641\u064a \u0627\u0644\u062a\u0633\u0648\u064a\u0642 \u0627\u0644\u0631\u0642\u0645\u064a \u0648\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0627\u062a \u0627\u0644\u0646\u0645\u0648 \u0645\u0639 \u0646\u062a\u0627\u0626\u062c \u0645\u062b\u0628\u062a\u0629",
    bioEn: "Digital marketing expert with proven growth strategies and results",
  },
];

const awards = [
  { year: "2024", titleEn: "Best Digital Agency", titleAr: "\u0623\u0641\u0636\u0644 \u0648\u0643\u0627\u0644\u0629 \u0631\u0642\u0645\u064a\u0629" },
  { year: "2023", titleEn: "Design Excellence Award", titleAr: "\u062c\u0627\u0626\u0632\u0629 \u0627\u0644\u062a\u0645\u064a\u0632 \u0641\u064a \u0627\u0644\u062a\u0635\u0645\u064a\u0645" },
  { year: "2023", titleEn: "Innovation Leader", titleAr: "\u0631\u0627\u0626\u062f \u0627\u0644\u0627\u0628\u062a\u0643\u0627\u0631" },
  { year: "2022", titleEn: "Top Tech Startup", titleAr: "\u0623\u0641\u0636\u0644 \u0634\u0631\u0643\u0629 \u0646\u0627\u0634\u0626\u0629" },
  { year: "2022", titleEn: "UX Design Award", titleAr: "\u062c\u0627\u0626\u0632\u0629 \u062a\u0635\u0645\u064a\u0645 UX" },
  { year: "2021", titleEn: "Best Web Platform", titleAr: "\u0623\u0641\u0636\u0644 \u0645\u0646\u0635\u0629 \u0648\u064a\u0628" },
];

const partners = [
  "TechVision", "NovaSoft", "CloudPeak", "DataFlow",
  "PixelCraft", "SyncWave", "CoreLogic", "BlueShift",
];

const approach = [
  {
    num: "01",
    titleEn: "User-Centered Design",
    titleAr: "\u062a\u0635\u0645\u064a\u0645 \u0645\u0631\u0643\u0632\u0647 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645",
    descEn:
      "Every pixel is intentional. We start with deep user research, build interactive prototypes, and iterate relentlessly until the experience feels effortless.",
    descAr:
      "\u0643\u0644 \u0628\u0643\u0633\u0644 \u0645\u062f\u0631\u0648\u0633. \u0646\u0628\u062f\u0623 \u0628\u0628\u062d\u062b \u0645\u0639\u0645\u0642 \u0639\u0646 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u060c \u0646\u0628\u0646\u064a \u0646\u0645\u0627\u0630\u062c \u062a\u0641\u0627\u0639\u0644\u064a\u0629\u060c \u0648\u0646\u0643\u0631\u0631 \u0628\u0644\u0627 \u0647\u0648\u0627\u062f\u0629 \u062d\u062a\u0649 \u062a\u0628\u062f\u0648 \u0627\u0644\u062a\u062c\u0631\u0628\u0629 \u0633\u0644\u0633\u0629.",
    icon: Layers,
  },
  {
    num: "02",
    titleEn: "Agile Development",
    titleAr: "\u062a\u0637\u0648\u064a\u0631 \u0645\u0631\u0646",
    descEn:
      "Short sprints, continuous delivery, and transparent communication. We ship fast, gather feedback, and adapt — keeping your project on trajectory.",
    descAr:
      "\u0633\u0628\u0631\u0646\u062a\u0627\u062a \u0642\u0635\u064a\u0631\u0629\u060c \u062a\u0633\u0644\u064a\u0645 \u0645\u0633\u062a\u0645\u0631\u060c \u0648\u062a\u0648\u0627\u0635\u0644 \u0634\u0641\u0627\u0641. \u0646\u0637\u0644\u0642 \u0628\u0633\u0631\u0639\u0629\u060c \u0646\u062c\u0645\u0639 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a\u060c \u0648\u0646\u062a\u0643\u064a\u0641 \u0644\u0625\u0628\u0642\u0627\u0621 \u0645\u0634\u0631\u0648\u0639\u0643 \u0639\u0644\u0649 \u0627\u0644\u0645\u0633\u0627\u0631.",
    icon: Zap,
  },
  {
    num: "03",
    titleEn: "Continuous Innovation",
    titleAr: "\u0627\u0628\u062a\u0643\u0627\u0631 \u0645\u0633\u062a\u0645\u0631",
    descEn:
      "Technology never sleeps, and neither do we. We invest in R&D, adopt emerging tools early, and infuse every project with forward-thinking solutions.",
    descAr:
      "\u0627\u0644\u062a\u0643\u0646\u0648\u0644\u0648\u062c\u064a\u0627 \u0644\u0627 \u062a\u0646\u0627\u0645\u060c \u0648\u0646\u062d\u0646 \u0643\u0630\u0644\u0643. \u0646\u0633\u062a\u062b\u0645\u0631 \u0641\u064a \u0627\u0644\u0628\u062d\u062b \u0648\u0627\u0644\u062a\u0637\u0648\u064a\u0631\u060c \u0646\u062a\u0628\u0646\u0649 \u0627\u0644\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0646\u0627\u0634\u0626\u0629 \u0645\u0628\u0643\u0631\u064b\u0627\u060c \u0648\u0646\u0636\u062e \u0643\u0644 \u0645\u0634\u0631\u0648\u0639 \u0628\u062d\u0644\u0648\u0644 \u0627\u0633\u062a\u0634\u0631\u0627\u0641\u064a\u0629.",
    icon: Lightbulb,
  },
];

/* ───────────────── Helpers ───────────────── */

const EASE = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

function AnimatedNumber({
  value,
  inView,
}: {
  value: string;
  inView: boolean;
}) {
  const numericPart = parseInt(value.replace(/[^0-9]/g, ""), 10);
  const suffix = value.replace(/[0-9]/g, "");
  const [display, setDisplay] = useState(0);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (inView) motionVal.set(numericPart);
  }, [inView, numericPart, motionVal]);

  useEffect(() => {
    const unsub = spring.on("change", (v: number) =>
      setDisplay(Math.round(v)),
    );
    return unsub;
  }, [spring]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

/* ───────────────── Component ───────────────── */

export function AboutContent() {
  const t = useTranslations("about");
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [modalMember, setModalMember] = useState<(typeof team)[0] | null>(
    null,
  );

  /* InView refs */
  const storyRef = useRef(null);
  const valuesRef = useRef(null);
  const statsRef = useRef(null);
  const approachRef = useRef(null);
  const teamRef = useRef(null);
  const awardsRef = useRef(null);
  const partnersRef = useRef(null);
  const ctaRef = useRef(null);

  const storyInView = useInView(storyRef, { once: true, margin: "-80px" });
  const valuesInView = useInView(valuesRef, { once: true, margin: "-80px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });
  const approachInView = useInView(approachRef, { once: true, margin: "-80px" });
  const teamInView = useInView(teamRef, { once: true, margin: "-80px" });
  const awardsInView = useInView(awardsRef, { once: true, margin: "-80px" });
  const partnersInView = useInView(partnersRef, { once: true, margin: "-80px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  const stats = [
    { value: "500+", icon: Users, label: isAr ? "\u0639\u0645\u064a\u0644 \u0633\u0639\u064a\u062f" : "Happy Clients" },
    { value: "15+", icon: Clock, label: isAr ? "\u0633\u0646\u0629 \u062e\u0628\u0631\u0629" : "Years Experience" },
    { value: "50+", icon: Award, label: isAr ? "\u062c\u0627\u0626\u0632\u0629" : "Awards" },
    { value: "12", icon: Globe, label: isAr ? "\u062f\u0648\u0644\u0629" : "Countries" },
  ];

  return (
    <>
      {/* ━━━━━━━━━━━━━━ 1. PREMIUM HERO BANNER ━━━━━━━━━━━━━━ */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "520px" }}
      >
        {/* Layered gradient background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(var(--color-primary-rgb) / 0.18), transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 80%, rgba(var(--color-primary-rgb) / 0.1), transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 85% 20%, rgba(var(--color-primary-rgb) / 0.08), transparent 40%)",
            }}
          />
          {/* Dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, var(--color-foreground) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Geometric line accent */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: "600px",
              height: "600px",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
              borderRadius: "50%",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: "400px",
              height: "400px",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.04)",
              borderRadius: "50%",
            }}
          />
        </div>

        <Container size="sm">
          <div
            className="relative z-10 flex flex-col items-center justify-center text-center"
            style={{ minHeight: "520px", paddingBlock: "var(--section-y)" }}
          >
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider uppercase"
                style={{
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
                  background: "rgba(var(--color-primary-rgb) / 0.06)",
                  color: "var(--color-primary)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isAr ? "\u0645\u0646\u0630 2018" : "Since 2018"}
              </span>
            </motion.div>

            <motion.h1
              className="font-bold tracking-tight mt-6 mb-5"
              style={{
                fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
                lineHeight: 1.1,
                color: "var(--color-foreground)",
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            >
              {isAr ? (
                <>
                  \u0646\u0635\u0646\u0639{" "}
                  <span style={{ color: "var(--color-primary)" }}>
                    \u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644
                  </span>{" "}
                  \u0627\u0644\u0631\u0642\u0645\u064a
                </>
              ) : (
                <>
                  We Craft the{" "}
                  <span style={{ color: "var(--color-primary)" }}>Digital</span>{" "}
                  Future
                </>
              )}
            </motion.h1>

            <motion.p
              className="max-w-xl mx-auto text-sm md:text-base leading-relaxed"
              style={{ color: "var(--color-foreground)", opacity: 0.7 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
            >
              {t("description")}
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
              className="mt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.4,
                  ease: "easeInOut",
                }}
              >
                <ChevronDown
                  className="h-5 w-5"
                  style={{ color: "var(--color-foreground)" }}
                />
              </motion.div>
            </motion.div>
          </div>
        </Container>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{
            background:
              "linear-gradient(to top, var(--color-background), transparent)",
          }}
        />
      </section>

      <SectionDivider />

      {/* ━━━━━━━━━━━━━━ 2. STORY / JOURNEY ━━━━━━━━━━━━━━ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            ref={storyRef}
            initial={{ opacity: 0, y: 40 }}
            animate={storyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE }}
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "rgba(var(--color-primary-rgb) / 0.03)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute -top-20 -end-20 h-40 w-40 rounded-full blur-3xl pointer-events-none"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.08)",
              }}
            />

            <div className="relative z-10 p-8 md:p-14">
              {/* Large quote icon */}
              <Quote
                className="h-12 w-12 mb-6"
                style={{
                  color: "rgba(var(--color-primary-rgb) / 0.15)",
                }}
              />

              <blockquote
                className="font-bold leading-snug mb-6"
                style={{
                  fontSize: "var(--text-h2)",
                  color: "var(--color-foreground)",
                }}
              >
                {isAr
                  ? "\u0646\u0624\u0645\u0646 \u0628\u0623\u0646 \u0627\u0644\u062a\u0643\u0646\u0648\u0644\u0648\u062c\u064a\u0627 \u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u062c\u0645\u064a\u0644\u0629 \u0648\u0639\u0645\u0644\u064a\u0629 \u0641\u064a \u0622\u0646 \u0648\u0627\u062d\u062f."
                  : "We believe technology should be beautiful and functional at the same time."}
              </blockquote>

              <div
                className="h-px w-16 mb-6"
                style={{
                  background:
                    "linear-gradient(90deg, var(--color-primary), transparent)",
                }}
              />

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <p
                  className="text-sm leading-relaxed max-w-lg"
                  style={{ color: "var(--color-foreground)", opacity: 0.65 }}
                >
                  {isAr
                    ? "\u062a\u0623\u0633\u0633\u0646\u0627 \u0639\u0627\u0645 2018 \u0628\u0631\u0624\u064a\u0629 \u0628\u0633\u064a\u0637\u0629: \u0628\u0646\u0627\u0621 \u0645\u0646\u062a\u062c\u0627\u062a \u0631\u0642\u0645\u064a\u0629 \u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a\u0629 \u062a\u062c\u0645\u0639 \u0628\u064a\u0646 \u0627\u0644\u062c\u0645\u0627\u0644 \u0648\u0627\u0644\u0623\u062f\u0627\u0621. \u0645\u0646 \u0641\u0631\u064a\u0642 \u0635\u063a\u064a\u0631 \u0641\u064a \u063a\u0631\u0641\u0629 \u0648\u0627\u062d\u062f\u0629 \u0625\u0644\u0649 \u0634\u0631\u0643\u0629 \u0631\u0627\u0626\u062f\u0629 \u062a\u062e\u062f\u0645 \u0639\u0645\u0644\u0627\u0621 \u0641\u064a 12 \u062f\u0648\u0644\u0629\u060c \u0631\u062d\u0644\u062a\u0646\u0627 \u0645\u0628\u0646\u064a\u0629 \u0639\u0644\u0649 \u0627\u0644\u0634\u063a\u0641 \u0648\u0627\u0644\u062a\u0641\u0627\u0646\u064a."
                    : "Founded in 2018 with a simple vision: build exceptional digital products that marry beauty with performance. From a small team in one room to a leading agency serving clients in 12 countries, our journey is built on passion and dedication."}
                </p>

                <div
                  className="flex-shrink-0 text-6xl md:text-7xl font-black tracking-tighter"
                  style={{
                    color: "rgba(var(--color-primary-rgb) / 0.08)",
                    lineHeight: 1,
                  }}
                >
                  2018
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ━━━━━━━━━━━━━━ 3. MISSION / VISION / VALUES ━━━━━━━━━━━━━━ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={isAr ? "\u0645\u0627 \u064a\u0642\u0648\u062f\u0646\u0627" : "What Drives Us"}
            subtitle={t("subtitle")}
          />

          <motion.div
            ref={valuesRef}
            className="grid gap-6 md:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
          >
            {values.map((v, i) => {
              const IconComp = v.icon;
              return (
                <motion.div
                  key={v.key}
                  variants={itemVariants}
                  className="group cursor-default rounded-2xl overflow-hidden relative"
                  style={{
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    background:
                      "rgba(var(--color-primary-rgb) / 0.02)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
                    transition:
                      "border-color 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 16px 48px rgba(var(--color-primary-rgb) / 0.1)";
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 24px rgba(0,0,0,0.03)";
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.1)";
                  }}
                >
                  {/* Icon area */}
                  <div
                    className="h-28 flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, rgba(var(--color-primary-rgb) / ${0.06 + i * 0.03}), rgba(var(--color-primary-rgb) / ${0.02 + i * 0.01}))`,
                    }}
                  >
                    {/* Dot pattern */}
                    <div
                      className="absolute inset-0 opacity-[0.04]"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)",
                        backgroundSize: "16px 16px",
                      }}
                    />
                    {/* Spotlight glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 50%, rgba(var(--color-primary-rgb) / 0.12), transparent 60%)",
                        transition: "opacity 0.5s ease",
                      }}
                    />
                    <div className="relative">
                      <div
                        className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100"
                        style={{
                          background: "rgba(var(--color-primary-rgb) / 0.3)",
                          transform: "scale(3)",
                          transition: "opacity 0.6s ease",
                        }}
                      />
                      <div
                        className="relative h-14 w-14 rounded-xl flex items-center justify-center"
                        style={{
                          background:
                            "rgba(var(--color-primary-rgb) / 0.12)",
                          color: "var(--color-primary)",
                          border:
                            "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                          transition:
                            "transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s ease",
                        }}
                      >
                        <IconComp className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 text-center">
                    <h3
                      className="font-semibold mb-2"
                      style={{
                        fontSize: "var(--text-h3)",
                        color: "var(--color-foreground)",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {t(v.key)}
                    </h3>
                    <p
                      className="text-xs leading-relaxed"
                      style={{
                        color: "var(--color-foreground)",
                        opacity: 0.6,
                      }}
                    >
                      {t(`${v.key}Desc`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ━━━━━━━━━━━━━━ 4. STATS COUNTER ROW ━━━━━━━━━━━━━━ */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.025)",
        }}
      >
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -start-32 h-64 w-64 rounded-full blur-3xl opacity-[0.05]"
            style={{ background: "var(--color-primary)" }}
          />
          <div
            className="absolute -bottom-32 -end-32 h-64 w-64 rounded-full blur-3xl opacity-[0.05]"
            style={{ background: "var(--color-primary)" }}
          />
        </div>

        <Container>
          <motion.div
            ref={statsRef}
            className="grid grid-cols-2 gap-5 md:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
          >
            {stats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  className="group cursor-default rounded-2xl p-6 text-center relative overflow-hidden"
                  style={{
                    background: "var(--color-card)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border:
                      "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.02)",
                    transition:
                      "border-color 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 40px rgba(var(--color-primary-rgb) / 0.1)";
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 16px rgba(0,0,0,0.02)";
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.1)";
                  }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle at center, rgba(var(--color-primary-rgb) / 0.06), transparent 70%)",
                      transition: "opacity 0.5s ease",
                    }}
                  />

                  <div className="relative z-10">
                    <div
                      className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                      style={{
                        background:
                          "rgba(var(--color-primary-rgb) / 0.08)",
                        border:
                          "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                        color: "var(--color-primary)",
                      }}
                    >
                      <StatIcon className="h-5 w-5" />
                    </div>
                    <div
                      className="text-3xl md:text-4xl font-bold tracking-tight"
                      style={{ color: "var(--color-primary)" }}
                    >
                      <AnimatedNumber
                        value={stat.value}
                        inView={statsInView}
                      />
                    </div>
                    <div
                      className="text-xs mt-1.5 font-medium"
                      style={{
                        color: "var(--color-foreground)",
                        opacity: 0.6,
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ━━━━━━━━━━━━━━ 5. OUR APPROACH / PHILOSOPHY ━━━━━━━━━━━━━━ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={isAr ? "\u0646\u0647\u062c\u0646\u0627" : "Our Approach"}
            subtitle={isAr ? "\u0627\u0644\u0641\u0644\u0633\u0641\u0629" : "Philosophy"}
          />

          <motion.div
            ref={approachRef}
            className="relative max-w-3xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate={approachInView ? "visible" : "hidden"}
          >
            {/* Vertical timeline line */}
            <div
              className="absolute top-0 bottom-0 hidden md:block"
              style={{
                [isAr ? "right" : "left"]: "28px",
                width: "2px",
                background:
                  "linear-gradient(to bottom, transparent, rgba(var(--color-primary-rgb) / 0.15) 10%, rgba(var(--color-primary-rgb) / 0.15) 90%, transparent)",
              }}
            />

            {approach.map((item, idx) => {
              const ApproachIcon = item.icon;
              return (
                <motion.div
                  key={item.num}
                  variants={itemVariants}
                  className="relative mb-12 last:mb-0 group"
                  style={{
                    [isAr ? "paddingRight" : "paddingLeft"]: "80px",
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute top-1 hidden md:flex items-center justify-center"
                    style={{
                      [isAr ? "right" : "left"]: "12px",
                      width: "34px",
                      height: "34px",
                    }}
                  >
                    <div
                      className="h-full w-full rounded-full flex items-center justify-center"
                      style={{
                        background:
                          "rgba(var(--color-primary-rgb) / 0.1)",
                        border:
                          "2px solid rgba(var(--color-primary-rgb) / 0.2)",
                        color: "var(--color-primary)",
                        transition:
                          "background 0.4s ease, border-color 0.4s ease",
                      }}
                    >
                      <ApproachIcon className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Content card */}
                  <div
                    className="rounded-2xl p-6 relative overflow-hidden"
                    style={{
                      background: "var(--color-card)",
                      border:
                        "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                      transition:
                        "border-color 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(var(--color-primary-rgb) / 0.2)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 32px rgba(var(--color-primary-rgb) / 0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(var(--color-primary-rgb) / 0.08)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Large faint number */}
                    <span
                      className="absolute top-3 font-black text-5xl pointer-events-none select-none"
                      style={{
                        [isAr ? "left" : "right"]: "16px",
                        color: "rgba(var(--color-primary-rgb) / 0.05)",
                        lineHeight: 1,
                      }}
                    >
                      {item.num}
                    </span>

                    <h3
                      className="font-semibold mb-2 relative z-10"
                      style={{
                        fontSize: "var(--text-h3)",
                        color: "var(--color-foreground)",
                      }}
                    >
                      {isAr ? item.titleAr : item.titleEn}
                    </h3>
                    <p
                      className="text-sm leading-relaxed relative z-10"
                      style={{
                        color: "var(--color-foreground)",
                        opacity: 0.6,
                      }}
                    >
                      {isAr ? item.descAr : item.descEn}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ━━━━━━━━━━━━━━ 6. TEAM SECTION ━━━━━━━━━━━━━━ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={t("teamTitle")}
            subtitle={t("teamSubtitle")}
          />

          <motion.div
            ref={teamRef}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate={teamInView ? "visible" : "hidden"}
          >
            {team.map((member) => (
              <motion.div
                key={member.nameEn}
                variants={itemVariants}
                className="group cursor-pointer rounded-2xl overflow-hidden"
                style={{
                  border:
                    "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  background: "var(--color-card)",
                  transition:
                    "border-color 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow =
                    "0 20px 56px rgba(var(--color-primary-rgb) / 0.12)";
                  e.currentTarget.style.borderColor =
                    "rgba(var(--color-primary-rgb) / 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor =
                    "rgba(var(--color-primary-rgb) / 0.08)";
                }}
                onClick={() => setModalMember(member)}
              >
                {/* Avatar area */}
                <div
                  className="relative h-44 flex items-center justify-center overflow-hidden"
                  style={{
                    background:
                      "rgba(var(--color-primary-rgb) / 0.04)",
                  }}
                >
                  {/* Dot pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)",
                      backgroundSize: "14px 14px",
                    }}
                  />

                  {/* Avatar with ring */}
                  <div
                    className="relative z-10 h-24 w-24 rounded-full overflow-hidden"
                    style={{
                      border:
                        "3px solid rgba(var(--color-primary-rgb) / 0.15)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      transition:
                        "border-color 0.4s ease, box-shadow 0.4s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 z-20"
                      style={{
                        boxShadow:
                          "inset 0 0 0 3px var(--color-primary)",
                        transition: "opacity 0.4s ease",
                      }}
                    />
                    <Image
                      src={member.image}
                      alt={isAr ? member.name : member.nameEn}
                      width={400}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  </div>

                  {/* Ring glow */}
                  <div
                    className="absolute z-10 h-24 w-24 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{
                      boxShadow:
                        "0 0 30px rgba(var(--color-primary-rgb) / 0.25)",
                      transition: "opacity 0.5s ease",
                    }}
                  />
                </div>

                {/* Info */}
                <div className="p-5 text-center">
                  <h3
                    className="font-semibold"
                    style={{
                      fontSize: "var(--text-h3)",
                      color: "var(--color-foreground)",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {isAr ? member.name : member.nameEn}
                  </h3>
                  <p
                    className="text-[11px] mt-0.5 mb-4"
                    style={{
                      color: "var(--color-primary)",
                      opacity: 0.8,
                    }}
                  >
                    {isAr ? member.role : member.roleEn}
                  </p>

                  {/* Social icons — appear on hover */}
                  <div
                    className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                    style={{
                      transition:
                        "opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  >
                    {[Mail, Linkedin, Globe].map((Icon, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer"
                        style={{
                          background:
                            "rgba(var(--color-primary-rgb) / 0.06)",
                          border:
                            "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                          color: "var(--color-foreground)",
                          transition:
                            "border-color 0.25s ease, background 0.25s ease, color 0.25s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(var(--color-primary-rgb) / 0.3)";
                          e.currentTarget.style.background =
                            "rgba(var(--color-primary-rgb) / 0.14)";
                          e.currentTarget.style.color =
                            "var(--color-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(var(--color-primary-rgb) / 0.1)";
                          e.currentTarget.style.background =
                            "rgba(var(--color-primary-rgb) / 0.06)";
                          e.currentTarget.style.color =
                            "var(--color-foreground)";
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* Team Member Modal */}
      <Modal
        open={!!modalMember}
        onClose={() => setModalMember(null)}
        title={
          modalMember
            ? isAr
              ? modalMember.name
              : modalMember.nameEn
            : ""
        }
      >
        {modalMember && (
          <div className="space-y-5">
            <div
              className="flex items-center gap-4 pb-4"
              style={{
                borderBottom:
                  "1px solid rgba(var(--color-primary-rgb) / 0.08)",
              }}
            >
              <div
                className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0"
                style={{
                  border:
                    "2px solid rgba(var(--color-primary-rgb) / 0.2)",
                  boxShadow:
                    "0 4px 16px rgba(var(--color-primary-rgb) / 0.1)",
                }}
              >
                <Image
                  src={modalMember.image}
                  alt={
                    isAr ? modalMember.name : modalMember.nameEn
                  }
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-base font-semibold">
                  {isAr ? modalMember.name : modalMember.nameEn}
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-primary)" }}
                >
                  {isAr ? modalMember.role : modalMember.roleEn}
                </p>
              </div>
            </div>

            <p
              className="text-sm leading-relaxed"
              style={{
                color: "var(--color-foreground)",
                opacity: 0.7,
              }}
            >
              {isAr ? modalMember.bioAr : modalMember.bioEn}
            </p>

            <div className="flex justify-center gap-2">
              {[
                {
                  icon: Mail,
                  label: isAr ? "\u0627\u0644\u0628\u0631\u064a\u062f" : "Email",
                },
                { icon: Linkedin, label: "LinkedIn" },
                {
                  icon: Globe,
                  label: isAr ? "\u0627\u0644\u0645\u0648\u0642\u0639" : "Website",
                },
              ].map((s) => (
                <button
                  key={s.label}
                  className="h-9 px-4 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  style={{
                    background:
                      "rgba(var(--color-primary-rgb) / 0.06)",
                    border:
                      "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    color: "var(--color-foreground)",
                    transition:
                      "border-color 0.25s ease, background 0.25s ease, color 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.25)";
                    e.currentTarget.style.background =
                      "rgba(var(--color-primary-rgb) / 0.1)";
                    e.currentTarget.style.color =
                      "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.1)";
                    e.currentTarget.style.background =
                      "rgba(var(--color-primary-rgb) / 0.06)";
                    e.currentTarget.style.color = "";
                  }}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <SectionDivider />

      {/* ━━━━━━━━━━━━━━ 7. AWARDS & RECOGNITION ━━━━━━━━━━━━━━ */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
        }}
      >
        <Container>
          <SectionHeading
            title={isAr ? "\u0627\u0644\u062c\u0648\u0627\u0626\u0632 \u0648\u0627\u0644\u062a\u0642\u062f\u064a\u0631" : "Awards & Recognition"}
            subtitle={isAr ? "\u0625\u0646\u062c\u0627\u0632\u0627\u062a\u0646\u0627" : "Achievements"}
          />

          <motion.div
            ref={awardsRef}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            variants={containerVariants}
            initial="hidden"
            animate={awardsInView ? "visible" : "hidden"}
          >
            {awards.map((award, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="flex-shrink-0 group"
                style={{ minWidth: "220px" }}
              >
                <div
                  className="rounded-2xl p-6 text-center relative overflow-hidden h-full"
                  style={{
                    background: "var(--color-card)",
                    border:
                      "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                    transition:
                      "border-color 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 36px rgba(var(--color-primary-rgb) / 0.08)";
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.08)";
                  }}
                >
                  {/* Number badge */}
                  <div
                    className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background:
                        "rgba(var(--color-primary-rgb) / 0.08)",
                      border:
                        "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Trophy className="h-5 w-5" />
                  </div>

                  <h4
                    className="font-semibold text-sm mb-1"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {isAr ? award.titleAr : award.titleEn}
                  </h4>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: "var(--color-primary)",
                      opacity: 0.7,
                    }}
                  >
                    {award.year}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ━━━━━━━━━━━━━━ 8. PARTNERS / CLIENTS STRIP ━━━━━━━━━━━━━━ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <motion.div
            ref={partnersRef}
            initial={{ opacity: 0, y: 30 }}
            animate={partnersInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <p
              className="text-center text-xs font-semibold uppercase tracking-widest mb-8"
              style={{
                color: "var(--color-foreground)",
                opacity: 0.35,
              }}
            >
              {isAr
                ? "\u0645\u0648\u062b\u0648\u0642 \u0645\u0646 \u0642\u0628\u0644 \u0634\u0631\u0643\u0627\u062a \u0631\u0627\u0626\u062f\u0629"
                : "Trusted by Leading Companies"}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {partners.map((name, idx) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={
                    partnersInView
                      ? { opacity: 1, y: 0 }
                      : {}
                  }
                  transition={{
                    duration: 0.6,
                    ease: EASE,
                    delay: idx * 0.06,
                  }}
                  className="rounded-xl flex items-center justify-center h-16 group"
                  style={{
                    border:
                      "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                    background:
                      "rgba(var(--color-primary-rgb) / 0.015)",
                    transition:
                      "border-color 0.4s ease, background 0.4s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.15)";
                    e.currentTarget.style.background =
                      "rgba(var(--color-primary-rgb) / 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(var(--color-primary-rgb) / 0.06)";
                    e.currentTarget.style.background =
                      "rgba(var(--color-primary-rgb) / 0.015)";
                  }}
                >
                  <span
                    className="text-sm font-bold tracking-wider uppercase"
                    style={{
                      color: "var(--color-foreground)",
                      opacity: 0.2,
                      transition: "opacity 0.4s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.45";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0.2";
                    }}
                  >
                    {name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ━━━━━━━━━━━━━━ 9. BOTTOM CTA ━━━━━━━━━━━━━━ */}
      <section
        className="relative overflow-hidden"
        style={{ paddingBlock: "var(--section-y)" }}
      >
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full blur-3xl opacity-[0.04]"
            style={{ background: "var(--color-primary)" }}
          />
        </div>

        <Container size="sm">
          <motion.div
            ref={ctaRef}
            className="text-center relative z-10"
            initial={{ opacity: 0, y: 40 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <h2
              className="font-bold tracking-tight mb-4"
              style={{
                fontSize: "var(--text-h2)",
                color: "var(--color-foreground)",
              }}
            >
              {isAr ? "\u0645\u0633\u062a\u0639\u062f \u0644\u0644\u0639\u0645\u0644 \u0645\u0639\u0646\u0627\u061f" : "Ready to Work With Us?"}
            </h2>
            <p
              className="text-sm leading-relaxed max-w-md mx-auto mb-8"
              style={{
                color: "var(--color-foreground)",
                opacity: 0.6,
              }}
            >
              {isAr
                ? "\u062f\u0639\u0646\u0627 \u0646\u062d\u0648\u0644 \u0641\u0643\u0631\u062a\u0643 \u0625\u0644\u0649 \u0648\u0627\u0642\u0639 \u0631\u0642\u0645\u064a \u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a. \u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0627\u0644\u064a\u0648\u0645."
                : "Let us turn your idea into an exceptional digital reality. Get in touch today."}
            </p>

            <Link href="/contact">
              <button
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold cursor-pointer"
                style={{
                  background: "var(--color-primary)",
                  color: "#ffffff",
                  border: "none",
                  boxShadow:
                    "0 4px 20px rgba(var(--color-primary-rgb) / 0.25)",
                  transition:
                    "transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 32px rgba(var(--color-primary-rgb) / 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(var(--color-primary-rgb) / 0.25)";
                }}
              >
                {isAr ? "\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627" : "Contact Us"}
                <Arrow className="h-4 w-4" />
              </button>
            </Link>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
