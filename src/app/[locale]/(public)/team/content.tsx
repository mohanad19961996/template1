"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import { Modal } from "@/components/shared/modal";
import {
  Lightbulb,
  Users,
  TrendingUp,
  Linkedin,
  Twitter,
  Mail,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─────────────────────────── TEAM DATA ─────────────────────────── */

interface TeamMember {
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  image: string;
  bioAr: string;
  bioEn: string;
  skillsAr: string[];
  skillsEn: string[];
}

const teamMembers: TeamMember[] = [
  {
    name: "محمد أحمد",
    nameEn: "Mohammed Ahmed",
    role: "المدير التنفيذي",
    roleEn: "CEO & Founder",
    image: "https://picsum.photos/seed/team1/400/400",
    bioAr:
      "قائد ذو رؤية مع أكثر من 15 عامًا من الخبرة في بناء الشركات التقنية الناشئة وقيادة الفرق الإبداعية. حاصل على ماجستير إدارة الأعمال ومتخصص في التحول الرقمي.",
    bioEn:
      "Visionary leader with 15+ years of experience building tech startups and leading creative teams. MBA graduate specializing in digital transformation and innovation strategy.",
    skillsAr: ["القيادة الاستراتيجية", "التحول الرقمي", "إدارة الفرق", "تطوير الأعمال"],
    skillsEn: ["Strategic Leadership", "Digital Transformation", "Team Management", "Business Development"],
  },
  {
    name: "نورة السالم",
    nameEn: "Noura Al-Salem",
    role: "مديرة التصميم",
    roleEn: "Design Director",
    image: "https://picsum.photos/seed/team2/400/400",
    bioAr:
      "مصممة حائزة على جوائز متعددة مع شغف كبير بتجربة المستخدم والتصميم البصري. قادت مشاريع تصميم لعلامات تجارية عالمية.",
    bioEn:
      "Award-winning designer with a deep passion for user experience and visual design. Has led design projects for global brands across multiple industries.",
    skillsAr: ["تصميم UX/UI", "الهوية البصرية", "التفكير التصميمي", "النماذج الأولية"],
    skillsEn: ["UX/UI Design", "Brand Identity", "Design Thinking", "Prototyping"],
  },
  {
    name: "فهد العمري",
    nameEn: "Fahd Al-Omari",
    role: "مدير التطوير",
    roleEn: "Engineering Lead",
    image: "https://picsum.photos/seed/team3/400/400",
    bioAr:
      "مطور متمرس في بناء أنظمة قابلة للتوسع باستخدام أحدث التقنيات. خبرة واسعة في البنية التحتية السحابية.",
    bioEn:
      "Experienced developer building scalable systems with cutting-edge technology. Extensive expertise in cloud infrastructure and microservices architecture.",
    skillsAr: ["هندسة البرمجيات", "البنية السحابية", "قيادة الفرق التقنية", "DevOps"],
    skillsEn: ["Software Engineering", "Cloud Architecture", "Tech Team Leadership", "DevOps"],
  },
  {
    name: "ريم الحربي",
    nameEn: "Reem Al-Harbi",
    role: "مديرة التسويق",
    roleEn: "Marketing Director",
    image: "https://picsum.photos/seed/team4/400/400",
    bioAr:
      "خبيرة في التسويق الرقمي واستراتيجيات النمو مع نتائج مثبتة في زيادة الوعي بالعلامة التجارية والمبيعات.",
    bioEn:
      "Digital marketing expert with proven growth strategies and measurable results in brand awareness and revenue generation.",
    skillsAr: ["التسويق الرقمي", "استراتيجية المحتوى", "تحليل البيانات", "إدارة الحملات"],
    skillsEn: ["Digital Marketing", "Content Strategy", "Data Analytics", "Campaign Management"],
  },
  {
    name: "عمر الشهري",
    nameEn: "Omar Al-Shahri",
    role: "مطور أول",
    roleEn: "Senior Developer",
    image: "https://picsum.photos/seed/team5/400/400",
    bioAr:
      "مطور متكامل يتقن تقنيات الواجهة الأمامية والخلفية مع خبرة 8 سنوات في تطوير تطبيقات الويب.",
    bioEn:
      "Full-stack developer proficient in frontend and backend technologies with 8 years of experience building web applications.",
    skillsAr: ["React/Next.js", "Node.js", "قواعد البيانات", "API تطوير"],
    skillsEn: ["React/Next.js", "Node.js", "Databases", "API Development"],
  },
  {
    name: "سارة القحطاني",
    nameEn: "Sarah Al-Qahtani",
    role: "مصممة UI/UX",
    roleEn: "UI/UX Designer",
    image: "https://picsum.photos/seed/team6/400/400",
    bioAr:
      "مصممة مبدعة تركز على إنشاء تجارب مستخدم بديهية وجذابة بصريًا مع اهتمام كبير بالتفاصيل.",
    bioEn:
      "Creative designer focused on crafting intuitive and visually compelling user experiences with meticulous attention to detail.",
    skillsAr: ["تصميم الواجهات", "بحث المستخدم", "Figma", "التصميم التفاعلي"],
    skillsEn: ["Interface Design", "User Research", "Figma", "Interaction Design"],
  },
  {
    name: "خالد المالكي",
    nameEn: "Khalid Al-Malki",
    role: "مدير المشاريع",
    roleEn: "Project Manager",
    image: "https://picsum.photos/seed/team7/400/400",
    bioAr:
      "مدير مشاريع معتمد PMP مع سجل حافل في تسليم المشاريع في الوقت المحدد وضمن الميزانية.",
    bioEn:
      "PMP-certified project manager with a proven track record of delivering projects on time and within budget.",
    skillsAr: ["إدارة المشاريع", "Agile/Scrum", "إدارة المخاطر", "تخطيط الموارد"],
    skillsEn: ["Project Management", "Agile/Scrum", "Risk Management", "Resource Planning"],
  },
  {
    name: "لينا الدوسري",
    nameEn: "Lina Al-Dosari",
    role: "محللة بيانات",
    roleEn: "Data Analyst",
    image: "https://picsum.photos/seed/team8/400/400",
    bioAr:
      "محللة بيانات متميزة تحول البيانات الخام إلى رؤى قابلة للتنفيذ لدعم القرارات الاستراتيجية.",
    bioEn:
      "Distinguished data analyst transforming raw data into actionable insights to support strategic decision-making.",
    skillsAr: ["تحليل البيانات", "Python", "التعلم الآلي", "تصور البيانات"],
    skillsEn: ["Data Analysis", "Python", "Machine Learning", "Data Visualization"],
  },
];

const leadershipMembers = teamMembers.slice(0, 4);

/* ─────────────────────────── CULTURE DATA ─────────────────────────── */

const cultureValues = [
  {
    icon: Lightbulb,
    titleAr: "الابتكار أولاً",
    titleEn: "Innovation First",
    descAr: "نتحدى الحدود باستمرار ونبحث عن حلول إبداعية ومبتكرة لأصعب المشكلات التقنية.",
    descEn:
      "We constantly push boundaries and seek creative, innovative solutions to the toughest technical challenges.",
  },
  {
    icon: Users,
    titleAr: "روح التعاون",
    titleEn: "Collaborative Spirit",
    descAr: "نؤمن بقوة العمل الجماعي والتواصل المفتوح لتحقيق نتائج استثنائية تتجاوز التوقعات.",
    descEn:
      "We believe in the power of teamwork and open communication to achieve exceptional results that exceed expectations.",
  },
  {
    icon: TrendingUp,
    titleAr: "عقلية النمو",
    titleEn: "Growth Mindset",
    descAr: "نستثمر في تطوير أفرادنا ونوفر بيئة تعلم مستمرة تدعم النمو المهني والشخصي.",
    descEn:
      "We invest in developing our people and provide a continuous learning environment that supports professional and personal growth.",
  },
];

/* ─────────────────────────── STATS DATA ─────────────────────────── */

const stats = [
  { valueAr: "+35", valueEn: "35+", labelAr: "عضو فريق", labelEn: "Team Members" },
  { valueAr: "8", valueEn: "8", labelAr: "أقسام", labelEn: "Departments" },
  { valueAr: "12", valueEn: "12", labelAr: "جنسية", labelEn: "Nationalities" },
  { valueAr: "95%", valueEn: "95%", labelAr: "معدل الاحتفاظ", labelEn: "Retention Rate" },
];

/* ─────────────────────────── ANIMATED COUNTER ─────────────────────────── */

function AnimatedStat({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="text-center"
    >
      <div
        className="text-3xl md:text-4xl font-bold mb-1"
        style={{ color: "var(--color-primary)" }}
      >
        {value}
      </div>
      <div
        className="text-sm font-medium"
        style={{ color: "rgba(var(--color-primary-rgb) / 0.7)" }}
      >
        {label}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */

export function TeamContent() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-40px" });

  const leadershipRef = useRef<HTMLDivElement>(null);
  const leadershipInView = useInView(leadershipRef, { once: true, margin: "-60px" });

  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: "-60px" });

  const cultureRef = useRef<HTMLDivElement>(null);
  const cultureInView = useInView(cultureRef, { once: true, margin: "-60px" });

  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-40px" });

  const openMemberModal = (member: TeamMember) => {
    setSelectedMember(member);
    setModalOpen(true);
  };

  return (
    <div style={{ background: "var(--color-background)" }}>
      {/* ═══════════════════ SECTION 1: PREMIUM HERO ═══════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingBlock: "var(--section-y)",
          background:
            "linear-gradient(160deg, var(--color-background) 0%, rgba(var(--color-primary-rgb) / 0.06) 40%, rgba(var(--color-primary-rgb) / 0.12) 70%, var(--color-background) 100%)",
        }}
      >
        {/* Background decorative elements */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 50%)",
          }}
        />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 start-[10%] w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)",
          }}
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 end-[15%] w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.06) 0%, transparent 70%)",
          }}
          animate={{ y: [0, 15, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <Container>
          <div ref={heroRef} className="relative text-center max-w-3xl mx-auto">
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={heroInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-6"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.1)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.2)",
                color: "var(--color-primary)",
              }}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </motion.span>
              {isAr ? "تعرّف على فريقنا" : "Meet Our Team"}
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5"
              style={{ color: "var(--color-foreground)" }}
            >
              {isAr ? (
                <>
                  فريقنا{" "}
                  <span style={{ color: "var(--color-primary)" }}>المتميز</span>
                </>
              ) : (
                <>
                  Our{" "}
                  <span style={{ color: "var(--color-primary)" }}>
                    Exceptional
                  </span>{" "}
                  Team
                </>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ color: "rgba(var(--color-primary-rgb) / 0.7)" }}
            >
              {isAr
                ? "مجموعة من المبدعين والمبتكرين يعملون معًا بشغف لتقديم حلول رقمية استثنائية تتجاوز التوقعات"
                : "A group of creatives and innovators working together passionately to deliver exceptional digital solutions that exceed expectations"}
            </motion.p>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={heroInView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-8 h-[2px] w-24 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
              }}
            />
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════════ SECTION 2: LEADERSHIP TEAM ═══════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={isAr ? "القيادة" : "Leadership"}
            title={isAr ? "فريق القيادة" : "Leadership Team"}
            description={
              isAr
                ? "القادة الذين يوجهون رؤيتنا ويلهمون فريقنا لتحقيق التميز"
                : "The leaders who guide our vision and inspire our team to achieve excellence"
            }
          />

          <div
            ref={leadershipRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10"
          >
            {leadershipMembers.map((member, i) => (
              <motion.div
                key={member.nameEn}
                initial={{ opacity: 0, y: 30 }}
                animate={leadershipInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                }}
                onClick={() => openMemberModal(member)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border =
                    "1px solid rgba(var(--color-primary-rgb) / 0.25)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 40px rgba(var(--color-primary-rgb) / 0.12), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border =
                    "1px solid rgba(var(--color-primary-rgb) / 0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Image container */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={member.image}
                    alt={isAr ? member.name : member.nameEn}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Image overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(var(--color-primary-rgb) / 0.6) 0%, transparent 60%)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {[Linkedin, Twitter, Mail].map((Icon, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110"
                          style={{
                            background: "rgba(var(--color-primary-rgb) / 0.3)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.2)",
                          }}
                        >
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Border ring */}
                  <div
                    className="absolute inset-0 rounded-none pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      boxShadow:
                        "inset 0 0 0 3px rgba(var(--color-primary-rgb) / 0.4)",
                    }}
                  />
                </div>

                {/* Info */}
                <div className="p-4 text-center">
                  <h3
                    className="text-base font-bold mb-1"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {isAr ? member.name : member.nameEn}
                  </h3>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {isAr ? member.role : member.roleEn}
                  </p>
                  <p
                    className="text-xs mt-2 line-clamp-2 leading-relaxed"
                    style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
                  >
                    {isAr ? member.bioAr : member.bioEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════════ SECTION 3: FULL TEAM GRID ═══════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={isAr ? "الفريق" : "The Team"}
            title={isAr ? "تعرّف على فريقنا" : "Meet Our Team"}
            description={
              isAr
                ? "نخبة من المواهب المتنوعة تعمل معًا لتحقيق رؤيتنا المشتركة"
                : "A diverse group of talents working together to achieve our shared vision"
            }
          />

          <div
            ref={gridRef}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-10"
          >
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.nameEn}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={gridInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{
                  duration: 0.45,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative rounded-xl overflow-hidden cursor-pointer"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                }}
                onClick={() => openMemberModal(member)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border =
                    "1px solid rgba(var(--color-primary-rgb) / 0.2)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 24px rgba(var(--color-primary-rgb) / 0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border =
                    "1px solid rgba(var(--color-primary-rgb) / 0.06)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={member.image}
                    alt={isAr ? member.name : member.nameEn}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(var(--color-primary-rgb) / 0.5) 0%, transparent 50%)",
                    }}
                  />
                  {/* View profile hint */}
                  <div className="absolute bottom-2 inset-x-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.3)",
                        backdropFilter: "blur(8px)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      {isAr ? "عرض" : "View"}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 text-center">
                  <h4
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {isAr ? member.name : member.nameEn}
                  </h4>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
                  >
                    {isAr ? member.role : member.roleEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════════ SECTION 4: TEAM CULTURE ═══════════════════ */}
      <section
        style={{
          paddingBlock: "var(--section-y)",
          background:
            "linear-gradient(180deg, var(--color-background) 0%, rgba(var(--color-primary-rgb) / 0.03) 50%, var(--color-background) 100%)",
        }}
      >
        <Container>
          <SectionHeading
            subtitle={isAr ? "ثقافتنا" : "Our Culture"}
            title={isAr ? "ما يجمعنا" : "What Unites Us"}
            description={
              isAr
                ? "القيم الأساسية التي تشكل ثقافة فريقنا وتدفعنا نحو التميز"
                : "The core values that shape our team culture and drive us toward excellence"
            }
          />

          <div
            ref={cultureRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10"
          >
            {cultureValues.map((cv, i) => {
              const Icon = cv.icon;
              return (
                <motion.div
                  key={cv.titleEn}
                  initial={{ opacity: 0, y: 28 }}
                  animate={cultureInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="group relative rounded-2xl p-6 text-center transition-all duration-300"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.03)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(var(--color-primary-rgb) / 0.06)";
                    e.currentTarget.style.border =
                      "1px solid rgba(var(--color-primary-rgb) / 0.2)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 32px rgba(var(--color-primary-rgb) / 0.1), 0 0 60px rgba(var(--color-primary-rgb) / 0.05)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(var(--color-primary-rgb) / 0.03)";
                    e.currentTarget.style.border =
                      "1px solid rgba(var(--color-primary-rgb) / 0.08)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Glow effect behind icon */}
                  <div
                    className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(var(--color-primary-rgb) / 0.15) 0%, transparent 70%)",
                    }}
                  />

                  <div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.1)",
                      border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: "var(--color-primary)" }}
                    />
                  </div>

                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {isAr ? cv.titleAr : cv.titleEn}
                  </h3>

                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
                  >
                    {isAr ? cv.descAr : cv.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════════ SECTION 5: BY THE NUMBERS ═══════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            subtitle={isAr ? "إنجازاتنا" : "By The Numbers"}
            title={isAr ? "فريقنا بالأرقام" : "Our Team in Numbers"}
          />

          <div
            className="relative rounded-2xl p-8 md:p-12 mt-10 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.05) 0%, rgba(var(--color-primary-rgb) / 0.1) 50%, rgba(var(--color-primary-rgb) / 0.05) 100%)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
            }}
          >
            {/* Decorative corner accents */}
            <div
              className="absolute top-0 start-0 w-24 h-24 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 0% 0%, rgba(var(--color-primary-rgb) / 0.15) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute bottom-0 end-0 w-24 h-24 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 100% 100%, rgba(var(--color-primary-rgb) / 0.15) 0%, transparent 70%)",
              }}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <AnimatedStat
                  key={stat.labelEn}
                  value={isAr ? stat.valueAr : stat.valueEn}
                  label={isAr ? stat.labelAr : stat.labelEn}
                  index={i}
                />
              ))}
            </div>
          </div>
        </Container>
      </section>

      <SectionDivider />

      {/* ═══════════════════ SECTION 6: JOIN OUR TEAM CTA ═══════════════════ */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl p-8 md:p-12 text-center overflow-hidden"
            style={{
              background: "var(--color-card)",
              border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
              boxShadow:
                "0 0 0 1px rgba(var(--color-primary-rgb) / 0.05), 0 16px 48px rgba(var(--color-primary-rgb) / 0.08)",
            }}
          >
            {/* Gradient border glow top */}
            <div
              className="absolute top-0 inset-x-0 h-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
              }}
            />

            {/* Background radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center top, rgba(var(--color-primary-rgb) / 0.08) 0%, transparent 60%)",
              }}
            />

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={ctaInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                style={{
                  background: "rgba(var(--color-primary-rgb) / 0.1)",
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                }}
              >
                <Users
                  className="w-7 h-7"
                  style={{ color: "var(--color-primary)" }}
                />
              </motion.div>

              <h3
                className="text-2xl md:text-3xl font-bold mb-3"
                style={{ color: "var(--color-foreground)" }}
              >
                {isAr ? "انضم إلى فريقنا" : "Join Our Team"}
              </h3>

              <p
                className="text-sm md:text-base leading-relaxed max-w-md mx-auto mb-8"
                style={{ color: "rgba(var(--color-primary-rgb) / 0.6)" }}
              >
                {isAr
                  ? "نحن نبحث دائمًا عن أشخاص موهوبين ومبدعين للانضمام إلى رحلتنا. اكتشف الفرص المتاحة وكن جزءًا من قصتنا."
                  : "We're always looking for talented and creative people to join our journey. Discover available opportunities and become part of our story."}
              </p>

              <Link
                href="/careers"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-background)",
                  boxShadow:
                    "0 4px 16px rgba(var(--color-primary-rgb) / 0.3), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 32px rgba(var(--color-primary-rgb) / 0.4), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.2)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(var(--color-primary-rgb) / 0.3), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {isAr ? "استكشف الفرص" : "Explore Opportunities"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ═══════════════════ MEMBER MODAL ═══════════════════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          selectedMember
            ? isAr
              ? selectedMember.name
              : selectedMember.nameEn
            : ""
        }
      >
        {selectedMember && (
          <div className="space-y-5">
            {/* Member photo and role */}
            <div className="flex items-center gap-4">
              <div
                className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                style={{
                  border: "2px solid rgba(var(--color-primary-rgb) / 0.2)",
                }}
              >
                <Image
                  src={selectedMember.image}
                  alt={isAr ? selectedMember.name : selectedMember.nameEn}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div>
                <h4
                  className="text-lg font-bold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {isAr ? selectedMember.name : selectedMember.nameEn}
                </h4>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-primary)" }}
                >
                  {isAr ? selectedMember.role : selectedMember.roleEn}
                </p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h5
                className="text-sm font-semibold mb-2"
                style={{ color: "var(--color-foreground)" }}
              >
                {isAr ? "نبذة" : "About"}
              </h5>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(var(--color-primary-rgb) / 0.7)" }}
              >
                {isAr ? selectedMember.bioAr : selectedMember.bioEn}
              </p>
            </div>

            {/* Skills */}
            <div>
              <h5
                className="text-sm font-semibold mb-2"
                style={{ color: "var(--color-foreground)" }}
              >
                {isAr ? "المهارات" : "Skills"}
              </h5>
              <div className="flex flex-wrap gap-2">
                {(isAr ? selectedMember.skillsAr : selectedMember.skillsEn).map(
                  (skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.08)",
                        color: "var(--color-primary)",
                        border:
                          "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                      }}
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Social links */}
            <div>
              <h5
                className="text-sm font-semibold mb-2"
                style={{ color: "var(--color-foreground)" }}
              >
                {isAr ? "التواصل" : "Connect"}
              </h5>
              <div className="flex items-center gap-3">
                {[
                  { icon: Linkedin, label: "LinkedIn" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Mail, label: "Email" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.06)",
                      border:
                        "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                      color: "var(--color-primary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(var(--color-primary-rgb) / 0.15)";
                      e.currentTarget.style.borderColor =
                        "rgba(var(--color-primary-rgb) / 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(var(--color-primary-rgb) / 0.06)";
                      e.currentTarget.style.borderColor =
                        "rgba(var(--color-primary-rgb) / 0.1)";
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
