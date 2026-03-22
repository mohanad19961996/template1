"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import { Link } from "@/i18n/navigation";
import {
  Globe,
  Banknote,
  TrendingUp,
  Heart,
  Lightbulb,
  Users,
  Award,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Clock,
  Wifi,
  Gift,
  Shield,
  BookOpen,
  PartyPopper,
  ChevronDown,
  Briefcase,
  Send,
  Sparkles,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

/* ───────────────── Job Data ───────────────── */

const jobs = [
  {
    titleEn: "Senior Frontend Developer",
    titleAr: "مطور واجهات أمامية أول",
    departmentEn: "Engineering",
    departmentAr: "الهندسة",
    locationEn: "Riyadh / Remote",
    locationAr: "الرياض / عن بُعد",
    typeEn: "Full-time",
    typeAr: "دوام كامل",
    descEn:
      "Build premium web experiences with React, Next.js, and modern CSS.",
    descAr:
      "بناء تجارب ويب متميزة باستخدام React و Next.js و CSS الحديث.",
  },
  {
    titleEn: "UI/UX Designer",
    titleAr: "مصمم UI/UX",
    departmentEn: "Design",
    departmentAr: "التصميم",
    locationEn: "Riyadh",
    locationAr: "الرياض",
    typeEn: "Full-time",
    typeAr: "دوام كامل",
    descEn:
      "Create beautiful, user-centered designs for web and mobile.",
    descAr:
      "إنشاء تصميمات جميلة تركز على المستخدم للويب والجوال.",
  },
  {
    titleEn: "Mobile Developer",
    titleAr: "مطور تطبيقات جوال",
    departmentEn: "Engineering",
    departmentAr: "الهندسة",
    locationEn: "Remote",
    locationAr: "عن بُعد",
    typeEn: "Full-time",
    typeAr: "دوام كامل",
    descEn:
      "Develop cross-platform mobile apps with React Native and Flutter.",
    descAr:
      "تطوير تطبيقات جوال متعددة المنصات باستخدام React Native و Flutter.",
  },
  {
    titleEn: "Digital Marketing Specialist",
    titleAr: "أخصائي تسويق رقمي",
    departmentEn: "Marketing",
    departmentAr: "التسويق",
    locationEn: "Riyadh",
    locationAr: "الرياض",
    typeEn: "Full-time",
    typeAr: "دوام كامل",
    descEn:
      "Drive growth through SEO, social media, and content marketing.",
    descAr:
      "دفع النمو من خلال تحسين محركات البحث ووسائل التواصل الاجتماعي وتسويق المحتوى.",
  },
  {
    titleEn: "Project Manager",
    titleAr: "مدير مشاريع",
    departmentEn: "Operations",
    departmentAr: "العمليات",
    locationEn: "Riyadh",
    locationAr: "الرياض",
    typeEn: "Full-time",
    typeAr: "دوام كامل",
    descEn:
      "Lead cross-functional teams to deliver projects on time and budget.",
    descAr:
      "قيادة فرق متعددة التخصصات لتسليم المشاريع في الوقت والميزانية المحددين.",
  },
  {
    titleEn: "DevOps Engineer",
    titleAr: "مهندس DevOps",
    departmentEn: "Engineering",
    departmentAr: "الهندسة",
    locationEn: "Remote",
    locationAr: "عن بُعد",
    typeEn: "Contract",
    typeAr: "عقد",
    descEn:
      "Build and maintain CI/CD pipelines, cloud infrastructure, and monitoring.",
    descAr:
      "بناء وصيانة خطوط CI/CD والبنية التحتية السحابية والمراقبة.",
  },
];

const departments = ["All", "Engineering", "Design", "Marketing", "Operations"];
const departmentsAr: Record<string, string> = {
  All: "الكل",
  Engineering: "الهندسة",
  Design: "التصميم",
  Marketing: "التسويق",
  Operations: "العمليات",
};

/* ───────────────── Why Join Us ───────────────── */

const benefits = [
  {
    icon: Globe,
    titleEn: "Remote-Friendly",
    titleAr: "صديق للعمل عن بُعد",
    descEn: "Work from anywhere in the world with flexible arrangements.",
    descAr: "اعمل من أي مكان في العالم مع ترتيبات مرنة.",
  },
  {
    icon: Banknote,
    titleEn: "Competitive Salary",
    titleAr: "راتب تنافسي",
    descEn: "We offer market-leading compensation packages.",
    descAr: "نقدم حزم تعويضات رائدة في السوق.",
  },
  {
    icon: TrendingUp,
    titleEn: "Growth & Learning",
    titleAr: "النمو والتعلم",
    descEn: "Continuous learning with conferences, courses, and mentorship.",
    descAr: "تعلم مستمر مع مؤتمرات ودورات وإرشاد.",
  },
  {
    icon: Heart,
    titleEn: "Health & Wellness",
    titleAr: "الصحة والعافية",
    descEn: "Comprehensive health coverage and wellness programs.",
    descAr: "تغطية صحية شاملة وبرامج عافية.",
  },
];

/* ───────────────── Culture Values ───────────────── */

const cultureValues = [
  {
    num: "01",
    icon: Lightbulb,
    titleEn: "Innovation",
    titleAr: "الابتكار",
    descEn:
      "We push boundaries and embrace new technologies to create solutions that redefine what's possible. Every team member is encouraged to think boldly and experiment fearlessly.",
    descAr:
      "ندفع الحدود ونتبنى تقنيات جديدة لإنشاء حلول تعيد تعريف ما هو ممكن. نشجع كل عضو في الفريق على التفكير بجرأة والتجربة بلا خوف.",
  },
  {
    num: "02",
    icon: Users,
    titleEn: "Collaboration",
    titleAr: "التعاون",
    descEn:
      "Great work happens when diverse minds come together. We foster an inclusive environment where every voice matters and teamwork drives extraordinary results.",
    descAr:
      "يحدث العمل الرائع عندما تجتمع العقول المتنوعة. نعزز بيئة شاملة حيث يهم كل صوت ويقود العمل الجماعي نتائج استثنائية.",
  },
  {
    num: "03",
    icon: Award,
    titleEn: "Excellence",
    titleAr: "التميز",
    descEn:
      "We hold ourselves to the highest standards in everything we do. From code quality to client communication, excellence is not a goal — it's our baseline.",
    descAr:
      "نلتزم بأعلى المعايير في كل ما نقوم به. من جودة الكود إلى التواصل مع العملاء، التميز ليس هدفًا — إنه خط أساسنا.",
  },
];

/* ───────────────── Perks ───────────────── */

const perks = [
  { icon: Clock, titleEn: "Flexible Hours", titleAr: "ساعات مرنة" },
  { icon: Wifi, titleEn: "Remote Work", titleAr: "عمل عن بُعد" },
  { icon: Gift, titleEn: "Annual Bonus", titleAr: "مكافأة سنوية" },
  { icon: Shield, titleEn: "Health Insurance", titleAr: "تأمين صحي" },
  { icon: BookOpen, titleEn: "Learning Budget", titleAr: "ميزانية تعلم" },
  { icon: PartyPopper, titleEn: "Team Events", titleAr: "فعاليات الفريق" },
];

/* ───────────────── Process Steps ───────────────── */

const processSteps = [
  { titleEn: "Apply Online", titleAr: "قدّم عبر الإنترنت" },
  { titleEn: "Phone Screen", titleAr: "مقابلة هاتفية" },
  { titleEn: "Technical Interview", titleAr: "مقابلة تقنية" },
  { titleEn: "Offer", titleAr: "العرض" },
];

/* ───────────────── Component ───────────────── */

export function CareersContent() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [activeDept, setActiveDept] = useState("All");

  const filteredJobs =
    activeDept === "All"
      ? jobs
      : jobs.filter((j) => j.departmentEn === activeDept);

  /* Refs for scroll-into-view */
  const positionsRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ background: "var(--color-background)" }}>
      {/* ═══════════════ 1 · HERO ═══════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingBlock: "var(--section-y)",
          background:
            "linear-gradient(135deg, var(--color-background) 0%, rgba(var(--color-primary-rgb) / 0.08) 50%, var(--color-background) 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.3), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.25), transparent 70%)",
          }}
        />

        <Container>
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto relative z-10">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-6"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.12)",
                color: "var(--color-primary)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? "نحن نوظف" : "We're Hiring"}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
              style={{ color: "var(--color-foreground)" }}
            >
              {isAr ? "انضم إلى فريقنا" : "Join Our Team"}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-5 text-base sm:text-lg leading-relaxed max-w-xl"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.7)" }}
            >
              {isAr
                ? "نبني فريقًا من المبدعين الشغوفين. اكتشف ثقافتنا وفرص العمل المتاحة."
                : "We're building a team of passionate creators. Discover our culture and explore open opportunities."}
            </motion.p>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              onClick={() =>
                positionsRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer"
              style={{
                background: "var(--color-primary)",
                color: "var(--color-background)",
                boxShadow:
                  "0 4px 20px rgba(var(--color-primary-rgb) / 0.3)",
              }}
            >
              {isAr ? "عرض الوظائف المتاحة" : "View Open Positions"}
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════ 2 · WHY JOIN US ═══════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={isAr ? "لماذا تنضم إلينا" : "Why Join Us"}
            title={
              isAr
                ? "مزايا العمل معنا"
                : "Benefits of Working With Us"
            }
            description={
              isAr
                ? "نؤمن بأن فريقًا سعيدًا ينتج عملًا استثنائيًا."
                : "We believe a happy team produces exceptional work."
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {benefits.map((b, i) => (
              <BenefitCard key={i} benefit={b} index={i} isAr={isAr} />
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════ 3 · CULTURE VALUES ═══════════════ */}
      <section
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.03)",
        }}
      >
        <Container>
          <SectionHeading
            subtitle={isAr ? "ثقافتنا" : "Our Culture"}
            title={isAr ? "القيم التي تقودنا" : "Values That Drive Us"}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {cultureValues.map((v, i) => (
              <CultureCard key={i} value={v} index={i} isAr={isAr} />
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════ 4 + 5 · DEPARTMENT FILTER + OPEN POSITIONS ═══════════════ */}
      <section ref={positionsRef} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={isAr ? "الوظائف المتاحة" : "Open Positions"}
            title={
              isAr
                ? "ابحث عن دورك القادم"
                : "Find Your Next Role"
            }
          />

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 mb-10">
            {departments.map((dept) => (
              <motion.button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className="relative px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer"
                style={{
                  color:
                    activeDept === dept
                      ? "var(--color-background)"
                      : "var(--color-foreground)",
                }}
              >
                {activeDept === dept && (
                  <motion.div
                    layoutId="activeDeptPill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--color-primary)" }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                {activeDept !== dept && (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.08)",
                      border:
                        "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                    }}
                  />
                )}
                <span className="relative z-10">
                  {isAr ? departmentsAr[dept] : dept}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Job Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredJobs.map((job, i) => (
                <JobCard
                  key={job.titleEn}
                  job={job}
                  index={i}
                  isAr={isAr}
                />
              ))}
            </AnimatePresence>
          </div>

          {filteredJobs.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-sm"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.5)" }}
            >
              {isAr
                ? "لا توجد وظائف متاحة في هذا القسم حاليًا."
                : "No positions available in this department right now."}
            </motion.p>
          )}
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════ 6 · BENEFITS & PERKS ═══════════════ */}
      <section
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.03)",
        }}
      >
        <Container>
          <SectionHeading
            subtitle={isAr ? "المزايا والامتيازات" : "Benefits & Perks"}
            title={
              isAr ? "ما نقدمه لفريقنا" : "What We Offer Our Team"
            }
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 mt-10">
            {perks.map((perk, i) => (
              <PerkItem key={i} perk={perk} index={i} isAr={isAr} />
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════ 7 · APPLICATION PROCESS ═══════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <SectionHeading
            subtitle={isAr ? "كيفية التقديم" : "How to Apply"}
            title={
              isAr ? "عملية التقديم" : "Application Process"
            }
          />

          <div className="relative mt-12">
            {/* Connecting line */}
            <div
              className="absolute top-0 bottom-0 hidden md:block"
              style={{
                [isAr ? "right" : "left"]: "23px",
                width: "2px",
                background:
                  "linear-gradient(to bottom, rgba(var(--color-primary-rgb) / 0.3), rgba(var(--color-primary-rgb) / 0.1))",
              }}
            />

            <div className="flex flex-col gap-8">
              {processSteps.map((step, i) => (
                <ProcessStep
                  key={i}
                  step={step}
                  index={i}
                  isAr={isAr}
                  total={processSteps.length}
                />
              ))}
            </div>
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════ 8 · CTA ═══════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <CtaSection isAr={isAr} />
        </Container>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

/* ── Benefit Card ── */
function BenefitCard({
  benefit,
  index,
  isAr,
}: {
  benefit: (typeof benefits)[number];
  index: number;
  isAr: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = benefit.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative group rounded-2xl p-6 text-center transition-all duration-300"
      style={{
        background: "var(--color-card)",
        border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(var(--color-primary-rgb) / 0.08), transparent 70%)",
        }}
      />

      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 relative z-10"
        style={{
          background: "rgba(var(--color-primary-rgb) / 0.1)",
          color: "var(--color-primary)",
        }}
      >
        <Icon className="w-5 h-5" />
      </div>

      <h3
        className="font-semibold text-sm mb-2 relative z-10"
        style={{ color: "var(--color-foreground)" }}
      >
        {isAr ? benefit.titleAr : benefit.titleEn}
      </h3>

      <p
        className="text-xs leading-relaxed relative z-10"
        style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
      >
        {isAr ? benefit.descAr : benefit.descEn}
      </p>
    </motion.div>
  );
}

/* ── Culture Card ── */
function CultureCard({
  value,
  index,
  isAr,
}: {
  value: (typeof cultureValues)[number];
  index: number;
  isAr: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = value.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative rounded-2xl p-8 overflow-hidden group"
      style={{
        background: "var(--color-card)",
        border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
      }}
    >
      {/* Decorative number */}
      <span
        className="absolute top-4 font-bold text-7xl leading-none pointer-events-none select-none"
        style={{
          [isAr ? "left" : "right"]: "16px",
          color: "rgba(var(--color-primary-rgb) / 0.06)",
        }}
      >
        {value.num}
      </span>

      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style={{
          background: "rgba(var(--color-primary-rgb) / 0.1)",
          color: "var(--color-primary)",
        }}
      >
        <Icon className="w-5 h-5" />
      </div>

      <h3
        className="text-lg font-bold mb-3"
        style={{ color: "var(--color-foreground)" }}
      >
        {isAr ? value.titleAr : value.titleEn}
      </h3>

      <p
        className="text-sm leading-relaxed"
        style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
      >
        {isAr ? value.descAr : value.descEn}
      </p>
    </motion.div>
  );
}

/* ── Job Card ── */
function JobCard({
  job,
  index,
  isAr,
}: {
  job: (typeof jobs)[number];
  index: number;
  isAr: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="relative rounded-2xl p-6 group transition-all duration-300"
      style={{
        background: "var(--color-card)",
        border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
        [isAr ? "borderRight" : "borderLeft"]:
          "3px solid var(--color-primary)",
      }}
    >
      {/* Hover shadow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow:
            "0 8px 30px rgba(var(--color-primary-rgb) / 0.12)",
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3 relative z-10">
        <h3
          className="text-base font-bold"
          style={{ color: "var(--color-foreground)" }}
        >
          {isAr ? job.titleAr : job.titleEn}
        </h3>

        <span
          className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold"
          style={{
            background: "rgba(var(--color-primary-rgb) / 0.1)",
            color: "var(--color-primary)",
          }}
        >
          {isAr ? job.departmentAr : job.departmentEn}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mb-4 relative z-10">
        <span
          className="inline-flex items-center gap-1.5 text-xs"
          style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
        >
          <MapPin className="w-3.5 h-3.5" />
          {isAr ? job.locationAr : job.locationEn}
        </span>

        <span
          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
          style={{
            background:
              job.typeEn === "Full-time"
                ? "rgba(var(--color-primary-rgb) / 0.08)"
                : "rgba(var(--color-primary-rgb) / 0.15)",
            color: "var(--color-primary)",
          }}
        >
          {isAr ? job.typeAr : job.typeEn}
        </span>
      </div>

      {/* Description */}
      <p
        className="text-sm leading-relaxed mb-5 relative z-10"
        style={{ color: "rgba(var(--color-primary-rgb) / 0.55)" }}
      >
        {isAr ? job.descAr : job.descEn}
      </p>

      {/* Apply button */}
      <Link
        href="/contact"
        className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 relative z-10 group/btn"
        style={{ color: "var(--color-primary)" }}
      >
        {isAr ? "قدّم الآن" : "Apply Now"}
        <Arrow className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" />
      </Link>
    </motion.div>
  );
}

/* ── Perk Item ── */
function PerkItem({
  perk,
  index,
  isAr,
}: {
  perk: (typeof perks)[number];
  index: number;
  isAr: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const Icon = perk.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex flex-col items-center text-center p-5 rounded-2xl transition-all duration-300"
      style={{
        background: "var(--color-card)",
        border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: "rgba(var(--color-primary-rgb) / 0.1)",
          color: "var(--color-primary)",
        }}
      >
        <Icon className="w-4.5 h-4.5" />
      </div>

      <span
        className="text-xs font-semibold"
        style={{ color: "var(--color-foreground)" }}
      >
        {isAr ? perk.titleAr : perk.titleEn}
      </span>
    </motion.div>
  );
}

/* ── Process Step ── */
function ProcessStep({
  step,
  index,
  isAr,
  total,
}: {
  step: (typeof processSteps)[number];
  index: number;
  isAr: boolean;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isAr ? 20 : -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="flex items-center gap-5"
    >
      {/* Step number circle */}
      <div
        className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold relative z-10"
        style={{
          background: "var(--color-primary)",
          color: "var(--color-background)",
          boxShadow:
            "0 0 0 4px var(--color-background), 0 0 0 6px rgba(var(--color-primary-rgb) / 0.2)",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Content */}
      <div
        className="flex-1 rounded-xl p-4"
        style={{
          background: "var(--color-card)",
          border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
        }}
      >
        <h4
          className="text-sm font-semibold"
          style={{ color: "var(--color-foreground)" }}
        >
          {isAr ? step.titleAr : step.titleEn}
        </h4>
      </div>

      {/* Arrow between steps (desktop only, not on last) */}
      {index < total - 1 && (
        <div className="hidden" />
      )}
    </motion.div>
  );
}

/* ── CTA Section ── */
function CtaSection({ isAr }: { isAr: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center rounded-3xl p-10 sm:p-14 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.08), rgba(var(--color-primary-rgb) / 0.03))",
        border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
      }}
    >
      {/* Decorative glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl pointer-events-none"
        style={{
          background: "rgba(var(--color-primary-rgb) / 0.1)",
        }}
      />

      <div className="relative z-10">
        <Briefcase
          className="w-10 h-10 mx-auto mb-4"
          style={{ color: "var(--color-primary)" }}
        />

        <h3
          className="text-2xl sm:text-3xl font-bold mb-3"
          style={{ color: "var(--color-foreground)" }}
        >
          {isAr
            ? "لا ترى الدور المناسب؟"
            : "Don't see a role that fits?"}
        </h3>

        <p
          className="text-sm leading-relaxed max-w-md mx-auto mb-8"
          style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
        >
          {isAr
            ? "نحن دائمًا نبحث عن مواهب استثنائية. أرسل لنا سيرتك الذاتية وسنتواصل معك عندما يتوفر دور مناسب."
            : "We're always looking for exceptional talent. Send us your CV and we'll reach out when the right role opens up."}
        </p>

        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all duration-300"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-background)",
            boxShadow:
              "0 4px 20px rgba(var(--color-primary-rgb) / 0.3)",
          }}
        >
          <Send className="w-4 h-4" />
          {isAr ? "أرسل سيرتك الذاتية" : "Send Us Your CV"}
          <Arrow className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
