"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import {
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Shield,
  Lock,
  CreditCard,
  CalendarOff,
  ChevronDown,
  Zap,
  Crown,
  Building2,
  Sparkles,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

/* ───────────────── Types & Data ───────────────── */

interface PricingTier {
  key: string;
  icon: typeof Zap;
  nameEn: string;
  nameAr: string;
  monthlyPrice: number;
  yearlyPrice: number;
  descEn: string;
  descAr: string;
  featuresEn: string[];
  featuresAr: string[];
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    key: "starter",
    icon: Zap,
    nameEn: "Starter",
    nameAr: "\u0627\u0644\u0628\u062f\u0627\u064a\u0629",
    monthlyPrice: 499,
    yearlyPrice: 4790,
    descEn: "Perfect for small businesses just getting started.",
    descAr: "\u0645\u062b\u0627\u0644\u064a \u0644\u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0635\u063a\u064a\u0631\u0629 \u0627\u0644\u062a\u064a \u0628\u062f\u0623\u062a \u0644\u0644\u062a\u0648.",
    featuresEn: [
      "1 project",
      "Basic support",
      "5 pages",
      "SEO basics",
      "Mobile responsive",
      "1 revision round",
    ],
    featuresAr: [
      "\u0645\u0634\u0631\u0648\u0639 \u0648\u0627\u062d\u062f",
      "\u062f\u0639\u0645 \u0623\u0633\u0627\u0633\u064a",
      "5 \u0635\u0641\u062d\u0627\u062a",
      "\u0623\u0633\u0627\u0633\u064a\u0627\u062a SEO",
      "\u0645\u062a\u062c\u0627\u0648\u0628 \u0645\u0639 \u0627\u0644\u062c\u0648\u0627\u0644",
      "\u062c\u0648\u0644\u0629 \u0645\u0631\u0627\u062c\u0639\u0629 \u0648\u0627\u062d\u062f\u0629",
    ],
  },
  {
    key: "professional",
    icon: Crown,
    nameEn: "Professional",
    nameAr: "\u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a",
    monthlyPrice: 999,
    yearlyPrice: 9590,
    descEn: "Ideal for growing businesses that need more.",
    descAr: "\u0645\u062b\u0627\u0644\u064a \u0644\u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0646\u0627\u0645\u064a\u0629 \u0627\u0644\u062a\u064a \u062a\u062d\u062a\u0627\u062c \u0625\u0644\u0649 \u0627\u0644\u0645\u0632\u064a\u062f.",
    featuresEn: [
      "3 projects",
      "Priority support",
      "15 pages",
      "Advanced SEO",
      "Mobile responsive",
      "3 revision rounds",
      "Analytics dashboard",
      "Custom domain",
    ],
    featuresAr: [
      "3 \u0645\u0634\u0627\u0631\u064a\u0639",
      "\u062f\u0639\u0645 \u0623\u0648\u0644\u0648\u064a",
      "15 \u0635\u0641\u062d\u0629",
      "SEO \u0645\u062a\u0642\u062f\u0645",
      "\u0645\u062a\u062c\u0627\u0648\u0628 \u0645\u0639 \u0627\u0644\u062c\u0648\u0627\u0644",
      "3 \u062c\u0648\u0644\u0627\u062a \u0645\u0631\u0627\u062c\u0639\u0629",
      "\u0644\u0648\u062d\u0629 \u062a\u062d\u0644\u064a\u0644\u0627\u062a",
      "\u0646\u0637\u0627\u0642 \u0645\u062e\u0635\u0635",
    ],
    popular: true,
  },
  {
    key: "enterprise",
    icon: Building2,
    nameEn: "Enterprise",
    nameAr: "\u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a",
    monthlyPrice: 2499,
    yearlyPrice: 23990,
    descEn: "For large organizations with complex needs.",
    descAr: "\u0644\u0644\u0645\u0624\u0633\u0633\u0627\u062a \u0627\u0644\u0643\u0628\u064a\u0631\u0629 \u0630\u0627\u062a \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u062c\u0627\u062a \u0627\u0644\u0645\u0639\u0642\u062f\u0629.",
    featuresEn: [
      "Unlimited projects",
      "24/7 dedicated support",
      "Unlimited pages",
      "Full SEO suite",
      "Mobile responsive",
      "Unlimited revisions",
      "Advanced analytics",
      "Custom domain",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
    ],
    featuresAr: [
      "\u0645\u0634\u0627\u0631\u064a\u0639 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u0629",
      "\u062f\u0639\u0645 \u0645\u062e\u0635\u0635 24/7",
      "\u0635\u0641\u062d\u0627\u062a \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u0629",
      "\u062d\u0632\u0645\u0629 SEO \u0643\u0627\u0645\u0644\u0629",
      "\u0645\u062a\u062c\u0627\u0648\u0628 \u0645\u0639 \u0627\u0644\u062c\u0648\u0627\u0644",
      "\u0645\u0631\u0627\u062c\u0639\u0627\u062a \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f\u0629",
      "\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0645\u062a\u0642\u062f\u0645\u0629",
      "\u0646\u0637\u0627\u0642 \u0645\u062e\u0635\u0635",
      "\u0648\u0635\u0648\u0644 API",
      "\u062a\u0643\u0627\u0645\u0644\u0627\u062a \u0645\u062e\u0635\u0635\u0629",
      "\u0645\u062f\u064a\u0631 \u062d\u0633\u0627\u0628 \u0645\u062e\u0635\u0635",
    ],
  },
];

/* Comparison table features */
interface ComparisonFeature {
  nameEn: string;
  nameAr: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const comparisonFeatures: ComparisonFeature[] = [
  { nameEn: "Projects", nameAr: "\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639", starter: "1", professional: "3", enterprise: "\u221e" },
  { nameEn: "Pages", nameAr: "\u0627\u0644\u0635\u0641\u062d\u0627\u062a", starter: "5", professional: "15", enterprise: "\u221e" },
  { nameEn: "Revision Rounds", nameAr: "\u062c\u0648\u0644\u0627\u062a \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629", starter: "1", professional: "3", enterprise: "\u221e" },
  { nameEn: "SEO", nameAr: "SEO", starter: "Basic", professional: "Advanced", enterprise: "Full Suite" },
  { nameEn: "Mobile Responsive", nameAr: "\u0645\u062a\u062c\u0627\u0648\u0628 \u0645\u0639 \u0627\u0644\u062c\u0648\u0627\u0644", starter: true, professional: true, enterprise: true },
  { nameEn: "Priority Support", nameAr: "\u062f\u0639\u0645 \u0623\u0648\u0644\u0648\u064a", starter: false, professional: true, enterprise: true },
  { nameEn: "24/7 Dedicated Support", nameAr: "\u062f\u0639\u0645 \u0645\u062e\u0635\u0635 24/7", starter: false, professional: false, enterprise: true },
  { nameEn: "Analytics Dashboard", nameAr: "\u0644\u0648\u062d\u0629 \u062a\u062d\u0644\u064a\u0644\u0627\u062a", starter: false, professional: true, enterprise: true },
  { nameEn: "Advanced Analytics", nameAr: "\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0645\u062a\u0642\u062f\u0645\u0629", starter: false, professional: false, enterprise: true },
  { nameEn: "Custom Domain", nameAr: "\u0646\u0637\u0627\u0642 \u0645\u062e\u0635\u0635", starter: false, professional: true, enterprise: true },
  { nameEn: "API Access", nameAr: "\u0648\u0635\u0648\u0644 API", starter: false, professional: false, enterprise: true },
  { nameEn: "Custom Integrations", nameAr: "\u062a\u0643\u0627\u0645\u0644\u0627\u062a \u0645\u062e\u0635\u0635\u0629", starter: false, professional: false, enterprise: true },
  { nameEn: "Dedicated Account Manager", nameAr: "\u0645\u062f\u064a\u0631 \u062d\u0633\u0627\u0628 \u0645\u062e\u0635\u0635", starter: false, professional: false, enterprise: true },
];

/* FAQ data */
const faqs = [
  {
    qEn: "Can I switch plans later?",
    qAr: "\u0647\u0644 \u064a\u0645\u0643\u0646\u0646\u064a \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u062e\u0637\u0629 \u0644\u0627\u062d\u0642\u064b\u0627\u061f",
    aEn: "Absolutely! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle, and we will prorate any differences.",
    aAr: "\u0628\u0627\u0644\u062a\u0623\u0643\u064a\u062f! \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u062a\u0631\u0642\u064a\u0629 \u0623\u0648 \u0627\u0644\u062a\u062e\u0641\u064a\u0636 \u0641\u064a \u0623\u064a \u0648\u0642\u062a. \u0633\u062a\u0646\u0639\u0643\u0633 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a \u0641\u064a \u062f\u0648\u0631\u0629 \u0627\u0644\u0641\u0648\u062a\u0631\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629.",
  },
  {
    qEn: "What payment methods do you accept?",
    qAr: "\u0645\u0627 \u0637\u0631\u0642 \u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0645\u0642\u0628\u0648\u0644\u0629\u061f",
    aEn: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. Enterprise clients can also pay via invoice.",
    aAr: "\u0646\u0642\u0628\u0644 \u062c\u0645\u064a\u0639 \u0628\u0637\u0627\u0642\u0627\u062a \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629 \u0648PayPal \u0648\u0627\u0644\u062a\u062d\u0648\u064a\u0644\u0627\u062a \u0627\u0644\u0628\u0646\u0643\u064a\u0629 \u0644\u0644\u062e\u0637\u0637 \u0627\u0644\u0633\u0646\u0648\u064a\u0629.",
  },
  {
    qEn: "Is there a setup fee?",
    qAr: "\u0647\u0644 \u062a\u0648\u062c\u062f \u0631\u0633\u0648\u0645 \u0625\u0639\u062f\u0627\u062f\u061f",
    aEn: "No, there are no setup fees for any of our plans. You only pay the advertised monthly or yearly price, with no hidden charges.",
    aAr: "\u0644\u0627\u060c \u0644\u0627 \u062a\u0648\u062c\u062f \u0631\u0633\u0648\u0645 \u0625\u0639\u062f\u0627\u062f \u0644\u0623\u064a \u0645\u0646 \u062e\u0637\u0637\u0646\u0627. \u0623\u0646\u062a \u062a\u062f\u0641\u0639 \u0641\u0642\u0637 \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u0639\u0644\u0646 \u0628\u062f\u0648\u0646 \u0631\u0633\u0648\u0645 \u0645\u062e\u0641\u064a\u0629.",
  },
  {
    qEn: "Do you offer custom plans?",
    qAr: "\u0647\u0644 \u062a\u0642\u062f\u0645\u0648\u0646 \u062e\u0637\u0637 \u0645\u062e\u0635\u0635\u0629\u061f",
    aEn: "Yes! For businesses with unique requirements, we offer fully customized plans. Contact our sales team to discuss your specific needs and get a tailored quote.",
    aAr: "\u0646\u0639\u0645! \u0644\u0644\u0634\u0631\u0643\u0627\u062a \u0630\u0627\u062a \u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0641\u0631\u064a\u062f\u0629\u060c \u0646\u0642\u062f\u0645 \u062e\u0637\u0637 \u0645\u062e\u0635\u0635\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644. \u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0641\u0631\u064a\u0642 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a \u0644\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u0639\u0631\u0636 \u0633\u0639\u0631 \u0645\u062e\u0635\u0635.",
  },
  {
    qEn: "What happens after my subscription ends?",
    qAr: "\u0645\u0627\u0630\u0627 \u064a\u062d\u062f\u062b \u0628\u0639\u062f \u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0634\u062a\u0631\u0627\u0643\u064a\u061f",
    aEn: "Your website and data remain intact for 30 days after your subscription ends. You can renew anytime within that period. After 30 days, data is archived but can be restored upon request.",
    aAr: "\u064a\u0638\u0644 \u0645\u0648\u0642\u0639\u0643 \u0648\u0628\u064a\u0627\u0646\u0627\u062a\u0643 \u0633\u0644\u064a\u0645\u0629 \u0644\u0645\u062f\u0629 30 \u064a\u0648\u0645\u064b\u0627 \u0628\u0639\u062f \u0627\u0646\u062a\u0647\u0627\u0621 \u0627\u0634\u062a\u0631\u0627\u0643\u0643. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u062a\u062c\u062f\u064a\u062f \u0641\u064a \u0623\u064a \u0648\u0642\u062a \u062e\u0644\u0627\u0644 \u062a\u0644\u0643 \u0627\u0644\u0641\u062a\u0631\u0629.",
  },
];

/* Client logos */
const clientLogos = [
  "Acme Corp",
  "Globex",
  "Initech",
  "Umbrella",
  "Stark Industries",
  "Wayne Enterprises",
  "Oscorp",
  "Cyberdyne",
];

/* ───────────────── Component ───────────────── */

export function PricingContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("pricing");
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* Hover states for cards */
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredCta, setHoveredCta] = useState<string | null>(null);

  /* Section refs */
  const heroRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const guaranteeRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const enterpriseRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef, { once: true, margin: "-60px" });
  const toggleInView = useInView(toggleRef, { once: true, margin: "-60px" });
  const cardsInView = useInView(cardsRef, { once: true, margin: "-60px" });
  const tableInView = useInView(tableRef, { once: true, margin: "-60px" });
  const guaranteeInView = useInView(guaranteeRef, { once: true, margin: "-60px" });
  const faqInView = useInView(faqRef, { once: true, margin: "-60px" });
  const enterpriseInView = useInView(enterpriseRef, { once: true, margin: "-60px" });
  const logosInView = useInView(logosRef, { once: true, margin: "-60px" });

  return (
    <div style={{ direction: isAr ? "rtl" : "ltr" }}>
      {/* ════════════════ 1. Premium Hero ════════════════ */}
      <section
        ref={heroRef}
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
              radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--color-primary-rgb) / 0.15) 0%, transparent 70%),
              radial-gradient(ellipse 60% 80% at 80% 20%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 20% 80%, rgba(var(--color-primary-rgb) / 0.05) 0%, transparent 60%)
            `,
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(var(--color-primary-rgb) / 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.1)",
                color: "var(--color-primary)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
              }}
            >
              <Sparkles size={14} />
              {t("subtitle")}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-bold tracking-tight mb-4"
              style={{
                fontSize: "var(--text-h2)",
                color: "var(--color-foreground)",
              }}
            >
              {t("title")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-base leading-relaxed max-w-xl mx-auto"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.7)" }}
            >
              {t("description")}
            </motion.p>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ════════════════ 2. Billing Toggle ════════════════ */}
      <section
        ref={toggleRef}
        style={{ paddingBlock: "2rem" }}
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={toggleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <span
              className="text-sm font-medium"
              style={{
                color: !isYearly ? "var(--color-primary)" : "var(--color-foreground)",
              }}
            >
              {t("monthly")}
            </span>

            {/* Toggle switch */}
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none"
              style={{
                background: isYearly
                  ? "var(--color-primary)"
                  : "rgba(var(--color-primary-rgb) / 0.2)",
              }}
              aria-label="Toggle billing period"
            >
              <motion.div
                className="absolute top-0.5 w-6 h-6 rounded-full"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 2px 4px rgba(var(--color-foreground-rgb, 0 0 0) / 0.2)",
                }}
                animate={{ x: isYearly ? (isAr ? 2 : 30) : (isAr ? 30 : 2) }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>

            <span
              className="text-sm font-medium"
              style={{
                color: isYearly ? "var(--color-primary)" : "var(--color-foreground)",
              }}
            >
              {t("yearly")}
            </span>

            {/* Save 20% badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isYearly ? 1 : 0.4,
                scale: isYearly ? 1 : 0.9,
              }}
              transition={{ duration: 0.3 }}
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.1)",
                color: "var(--color-primary)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
              }}
            >
              {isAr ? "\u0648\u0641\u0631 20%" : "Save 20%"}
            </motion.span>
          </motion.div>
        </Container>
      </section>

      {/* ════════════════ 3. Pricing Cards ════════════════ */}
      <section
        ref={cardsRef}
        style={{ paddingBlock: "var(--section-y)" }}
      >
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {tiers.map((tier, i) => {
              const IconComp = tier.icon;
              const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
              const period = isYearly ? t("perYear") : t("perMonth");
              const features = isAr ? tier.featuresAr : tier.featuresEn;
              const isHovered = hoveredCard === tier.key;

              return (
                <motion.div
                  key={tier.key}
                  initial={{ opacity: 0, y: 40 }}
                  animate={cardsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative rounded-2xl flex flex-col"
                  style={{
                    background: "var(--color-card)",
                    border: tier.popular
                      ? "2px solid var(--color-primary)"
                      : "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    boxShadow: tier.popular
                      ? "0 0 40px rgba(var(--color-primary-rgb) / 0.15), 0 8px 32px rgba(var(--color-foreground-rgb, 0 0 0) / 0.1)"
                      : isHovered
                        ? "0 8px 32px rgba(var(--color-foreground-rgb, 0 0 0) / 0.1)"
                        : "0 2px 8px rgba(var(--color-foreground-rgb, 0 0 0) / 0.05)",
                    transform: tier.popular ? "scale(1.03)" : undefined,
                    transition: "box-shadow 0.3s ease, transform 0.3s ease",
                    padding: "2rem",
                  }}
                  onMouseEnter={() => setHoveredCard(tier.key)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Popular badge */}
                  {tier.popular && (
                    <div
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: "var(--color-primary)",
                        color: "#ffffff",
                      }}
                    >
                      {t("popular")}
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.1)",
                    }}
                  >
                    <IconComp
                      size={24}
                      style={{ color: "var(--color-primary)" }}
                    />
                  </div>

                  {/* Plan name */}
                  <h3
                    className="font-bold mb-2"
                    style={{
                      fontSize: "var(--text-h3)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    {isAr ? tier.nameAr : tier.nameEn}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <motion.span
                      key={`${tier.key}-${isYearly}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="font-bold"
                      style={{
                        fontSize: "2.5rem",
                        color: "var(--color-foreground)",
                        lineHeight: 1.1,
                      }}
                    >
                      ${price.toLocaleString()}
                    </motion.span>
                    <span
                      className="text-sm"
                      style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
                    >
                      {period}
                    </span>
                  </div>

                  {/* Description */}
                  <p
                    className="text-sm mb-6 leading-relaxed"
                    style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
                  >
                    {isAr ? tier.descAr : tier.descEn}
                  </p>

                  {/* Features */}
                  <ul className="flex-1 space-y-3 mb-8">
                    {features.map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-2.5 text-sm">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "rgba(var(--color-primary-rgb) / 0.1)",
                          }}
                        >
                          <Check
                            size={12}
                            style={{ color: "var(--color-primary)" }}
                          />
                        </div>
                        <span style={{ color: "var(--color-foreground)" }}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {tier.key === "enterprise" ? (
                    <Link
                      href="/contact"
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300"
                      style={{
                        background: hoveredCta === tier.key
                          ? "rgba(var(--color-primary-rgb) / 0.15)"
                          : "rgba(var(--color-primary-rgb) / 0.08)",
                        color: "var(--color-primary)",
                        border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
                      }}
                      onMouseEnter={() => setHoveredCta(tier.key)}
                      onMouseLeave={() => setHoveredCta(null)}
                    >
                      {t("contactSales")}
                      <Arrow size={16} />
                    </Link>
                  ) : (
                    <Link
                      href="/contact"
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300"
                      style={{
                        background: tier.popular
                          ? hoveredCta === tier.key
                            ? "rgba(var(--color-primary-rgb) / 0.9)"
                            : "var(--color-primary)"
                          : hoveredCta === tier.key
                            ? "rgba(var(--color-primary-rgb) / 0.15)"
                            : "rgba(var(--color-primary-rgb) / 0.08)",
                        color: tier.popular ? "#ffffff" : "var(--color-primary)",
                        border: tier.popular
                          ? "none"
                          : "1px solid rgba(var(--color-primary-rgb) / 0.2)",
                      }}
                      onMouseEnter={() => setHoveredCta(tier.key)}
                      onMouseLeave={() => setHoveredCta(null)}
                    >
                      {t("getStarted")}
                      <Arrow size={16} />
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ════════════════ 4. Feature Comparison Table ════════════════ */}
      <section
        ref={tableRef}
        style={{ paddingBlock: "var(--section-y)" }}
      >
        <Container>
          <SectionHeading
            subtitle={isAr ? "\u0645\u0642\u0627\u0631\u0646\u0629" : "Compare"}
            title={isAr ? "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u0645\u064a\u0632\u0627\u062a" : "Feature Comparison"}
            description={
              isAr
                ? "\u0627\u0637\u0644\u0639 \u0639\u0644\u0649 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0645\u064a\u0632\u0627\u062a \u0627\u0644\u0645\u062a\u0627\u062d\u0629 \u0641\u064a \u0643\u0644 \u062e\u0637\u0629"
                : "See all features available in each plan"
            }
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={tableInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="overflow-x-auto rounded-2xl"
            style={{
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
            }}
          >
            <table className="w-full text-sm" style={{ minWidth: "600px" }}>
              {/* Sticky header */}
              <thead>
                <tr
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.05)",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <th
                    className="text-start py-4 px-6 font-semibold"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {isAr ? "\u0627\u0644\u0645\u0645\u064a\u0632\u0629" : "Feature"}
                  </th>
                  {tiers.map((tier) => (
                    <th
                      key={tier.key}
                      className="py-4 px-6 font-semibold text-center"
                      style={{
                        color: tier.popular
                          ? "var(--color-primary)"
                          : "var(--color-foreground)",
                      }}
                    >
                      {isAr ? tier.nameAr : tier.nameEn}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feat, i) => (
                  <tr
                    key={i}
                    style={{
                      background:
                        i % 2 === 0
                          ? "var(--color-card)"
                          : "rgba(var(--color-primary-rgb) / 0.02)",
                      borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                    }}
                  >
                    <td
                      className="py-3.5 px-6 font-medium"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {isAr ? feat.nameAr : feat.nameEn}
                    </td>
                    {(["starter", "professional", "enterprise"] as const).map(
                      (tierKey) => {
                        const val = feat[tierKey];
                        return (
                          <td key={tierKey} className="py-3.5 px-6 text-center">
                            {typeof val === "boolean" ? (
                              val ? (
                                <Check
                                  size={18}
                                  className="mx-auto"
                                  style={{ color: "var(--color-primary)" }}
                                />
                              ) : (
                                <X
                                  size={18}
                                  className="mx-auto"
                                  style={{
                                    color: "rgba(var(--color-primary-rgb) / 0.2)",
                                  }}
                                />
                              )
                            ) : (
                              <span
                                className="font-medium"
                                style={{ color: "var(--color-foreground)" }}
                              >
                                {val}
                              </span>
                            )}
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ════════════════ 5. Money-Back Guarantee ════════════════ */}
      <section
        ref={guaranteeRef}
        style={{ paddingBlock: "var(--section-y)" }}
      >
        <Container size="sm">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={guaranteeInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center rounded-2xl relative overflow-hidden"
            style={{
              padding: "3rem 2rem",
              background: "rgba(var(--color-primary-rgb) / 0.03)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
            }}
          >
            {/* Glow effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%)",
              }}
            />

            <div className="relative z-10">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.1)",
                }}
              >
                <Shield
                  size={32}
                  style={{ color: "var(--color-primary)" }}
                />
              </div>

              <h2
                className="font-bold mb-3"
                style={{
                  fontSize: "var(--text-h3)",
                  color: "var(--color-foreground)",
                }}
              >
                {isAr
                  ? "\u0636\u0645\u0627\u0646 \u0627\u0633\u062a\u0631\u062f\u0627\u062f \u0627\u0644\u0623\u0645\u0648\u0627\u0644 \u062e\u0644\u0627\u0644 30 \u064a\u0648\u0645\u064b\u0627"
                  : "30-Day Money-Back Guarantee"}
              </h2>

              <p
                className="text-sm leading-relaxed max-w-md mx-auto mb-8"
                style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
              >
                {isAr
                  ? "\u0625\u0630\u0627 \u0644\u0645 \u062a\u0643\u0646 \u0631\u0627\u0636\u064a\u064b\u0627 \u0639\u0646 \u062e\u062f\u0645\u0627\u062a\u0646\u0627\u060c \u0633\u0646\u0639\u064a\u062f \u0625\u0644\u064a\u0643 \u0643\u0627\u0645\u0644 \u0627\u0644\u0645\u0628\u0644\u063a \u062e\u0644\u0627\u0644 30 \u064a\u0648\u0645\u064b\u0627. \u0628\u062f\u0648\u0646 \u0623\u0633\u0626\u0644\u0629."
                  : "If you are not satisfied with our services, we will refund your full payment within 30 days. No questions asked."}
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6">
                {[
                  {
                    icon: Lock,
                    labelEn: "SSL Secure",
                    labelAr: "\u0622\u0645\u0646 SSL",
                  },
                  {
                    icon: CreditCard,
                    labelEn: "No Hidden Fees",
                    labelAr: "\u0628\u062f\u0648\u0646 \u0631\u0633\u0648\u0645 \u0645\u062e\u0641\u064a\u0629",
                  },
                  {
                    icon: CalendarOff,
                    labelEn: "Cancel Anytime",
                    labelAr: "\u0625\u0644\u063a\u0627\u0621 \u0641\u064a \u0623\u064a \u0648\u0642\u062a",
                  },
                ].map((badge, i) => {
                  const BadgeIcon = badge.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={guaranteeInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <BadgeIcon
                        size={16}
                        style={{ color: "var(--color-primary)" }}
                      />
                      <span style={{ color: "var(--color-foreground)" }}>
                        {isAr ? badge.labelAr : badge.labelEn}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ════════════════ 6. FAQ Section ════════════════ */}
      <section
        ref={faqRef}
        style={{ paddingBlock: "var(--section-y)" }}
      >
        <Container size="sm">
          <SectionHeading
            subtitle={isAr ? "\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629" : "FAQ"}
            title={
              isAr
                ? "\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629 \u062d\u0648\u0644 \u0627\u0644\u062a\u0633\u0639\u064a\u0631"
                : "Frequently Asked Questions"
            }
            description={
              isAr
                ? "\u0625\u062c\u0627\u0628\u0627\u062a \u0639\u0644\u0649 \u0623\u0643\u062b\u0631 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0634\u064a\u0648\u0639\u064b\u0627 \u062d\u0648\u0644 \u062e\u0637\u0637 \u0627\u0644\u062a\u0633\u0639\u064a\u0631 \u0644\u062f\u064a\u0646\u0627"
                : "Answers to the most common questions about our pricing plans"
            }
          />

          <div className="space-y-3 mt-8">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={faqInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    background: isOpen
                      ? "rgba(var(--color-primary-rgb) / 0.03)"
                      : "var(--color-card)",
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between py-4 px-5 text-start"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    <span className="text-sm font-semibold">
                      {isAr ? faq.qAr : faq.qEn}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown
                        size={18}
                        style={{ color: "var(--color-primary)" }}
                      />
                    </motion.div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: isOpen ? "auto" : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p
                      className="px-5 pb-4 text-sm leading-relaxed"
                      style={{
                        color: "rgba(var(--color-primary-rgb) / 0.6)",
                      }}
                    >
                      {isAr ? faq.aAr : faq.aEn}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ════════════════ 7. Enterprise CTA ════════════════ */}
      <section
        ref={enterpriseRef}
        style={{ paddingBlock: "var(--section-y)" }}
      >
        <Container size="sm">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={enterpriseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center rounded-2xl relative overflow-hidden"
            style={{
              padding: "3.5rem 2rem",
              background: "var(--color-card)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
            }}
          >
            {/* Background gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse 70% 50% at 50% 100%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)
                `,
              }}
            />

            <div className="relative z-10">
              <Building2
                size={40}
                className="mx-auto mb-4"
                style={{ color: "var(--color-primary)" }}
              />

              <h2
                className="font-bold mb-3"
                style={{
                  fontSize: "var(--text-h2)",
                  color: "var(--color-foreground)",
                }}
              >
                {isAr
                  ? "\u0647\u0644 \u062a\u062d\u062a\u0627\u062c \u0625\u0644\u0649 \u062d\u0644 \u0645\u062e\u0635\u0635\u061f"
                  : "Need a custom solution?"}
              </h2>

              <p
                className="text-sm leading-relaxed max-w-lg mx-auto mb-8"
                style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
              >
                {isAr
                  ? "\u0641\u0631\u064a\u0642\u0646\u0627 \u0645\u0633\u062a\u0639\u062f \u0644\u0645\u0633\u0627\u0639\u062f\u062a\u0643 \u0641\u064a \u0628\u0646\u0627\u0621 \u062d\u0644 \u064a\u0646\u0627\u0633\u0628 \u0627\u062d\u062a\u064a\u0627\u062c\u0627\u062a\u0643 \u0627\u0644\u0641\u0631\u064a\u062f\u0629. \u062a\u062d\u062f\u062b \u0645\u0639 \u0641\u0631\u064a\u0642 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a \u0627\u0644\u064a\u0648\u0645."
                  : "Our team is ready to help you build a solution that fits your unique needs. Talk to our sales team today."}
              </p>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300"
                style={{
                  background: hoveredCta === "enterprise-cta"
                    ? "rgba(var(--color-primary-rgb) / 0.9)"
                    : "var(--color-primary)",
                  color: "#ffffff",
                  boxShadow: "0 4px 16px rgba(var(--color-primary-rgb) / 0.3)",
                }}
                onMouseEnter={() => setHoveredCta("enterprise-cta")}
                onMouseLeave={() => setHoveredCta(null)}
              >
                {t("contactSales")}
                <Arrow size={16} />
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* ════════════════ 8. Client Logos Strip ════════════════ */}
      <section
        ref={logosRef}
        style={{ paddingBlock: "var(--section-y)" }}
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={logosInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-8"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}
            >
              {isAr
                ? "\u0645\u0648\u062b\u0648\u0642 \u0645\u0646 \u0642\u0628\u0644 \u0623\u0643\u062b\u0631 \u0645\u0646 500+ \u0634\u0631\u0643\u0629"
                : "Trusted by 500+ businesses"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {clientLogos.map((name, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={logosInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="px-5 py-3 rounded-lg"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.03)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  }}
                >
                  <span
                    className="text-sm font-bold tracking-wide"
                    style={{ color: "rgba(var(--color-primary-rgb) / 0.4)" }}
                  >
                    {name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
