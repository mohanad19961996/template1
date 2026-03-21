"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { SectionDivider } from "@/components/shared/section-divider";
import { Timeline } from "@/components/shared/timeline";
import {
  Code, Smartphone, Figma, Megaphone, PenTool, MessageSquare,
  Check, ArrowRight, ArrowLeft,
  Search, Lightbulb, Rocket, Settings,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import type { LucideIcon } from "lucide-react";

/* ── Service Data ── */
interface ServiceData {
  slug: string;
  icon: LucideIcon;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  featuresEn: string[];
  featuresAr: string[];
  processEn: { title: string; description: string }[];
  processAr: { title: string; description: string }[];
}

const services: ServiceData[] = [
  {
    slug: "web-dev",
    icon: Code,
    titleEn: "Web Development",
    titleAr: "تطوير المواقع",
    descEn:
      "We build fast, scalable, and beautifully crafted websites and web applications using modern technologies. From corporate sites to complex SaaS platforms, our team delivers pixel-perfect, performance-optimized solutions that drive business growth.",
    descAr:
      "نبني مواقع وتطبيقات ويب سريعة وقابلة للتوسع ومصممة بإتقان باستخدام أحدث التقنيات. من المواقع المؤسسية إلى منصات SaaS المعقدة، يقدم فريقنا حلولاً مثالية ومحسّنة الأداء تدفع نمو الأعمال.",
    featuresEn: [
      "Custom web applications built with React & Next.js",
      "E-commerce platforms with payment integration",
      "Progressive Web Apps (PWA) for offline support",
      "API development and third-party integrations",
      "Server-side rendering for optimal SEO",
      "Cloud deployment with CI/CD pipelines",
    ],
    featuresAr: [
      "تطبيقات ويب مخصصة مبنية بـ React و Next.js",
      "منصات تجارة إلكترونية مع تكامل الدفع",
      "تطبيقات ويب تقدمية (PWA) للدعم دون اتصال",
      "تطوير API وتكاملات الأطراف الثالثة",
      "عرض من جانب الخادم لتحسين SEO",
      "نشر سحابي مع خطوط CI/CD",
    ],
    processEn: [
      { title: "Discovery & Planning", description: "We analyze your requirements, define project scope, and create a detailed roadmap." },
      { title: "Architecture & Design", description: "We design the system architecture, database schema, and create UI mockups." },
      { title: "Development & Testing", description: "Agile development with iterative sprints, code reviews, and comprehensive testing." },
      { title: "Launch & Optimization", description: "Deployment, performance optimization, monitoring setup, and post-launch support." },
    ],
    processAr: [
      { title: "الاكتشاف والتخطيط", description: "نحلل متطلباتكم ونحدد نطاق المشروع ونضع خارطة طريق مفصلة." },
      { title: "البنية والتصميم", description: "نصمم بنية النظام ومخطط قاعدة البيانات ونُنشئ نماذج واجهة المستخدم." },
      { title: "التطوير والاختبار", description: "تطوير رشيق مع سباقات تكرارية ومراجعات الكود واختبار شامل." },
      { title: "الإطلاق والتحسين", description: "النشر وتحسين الأداء وإعداد المراقبة والدعم بعد الإطلاق." },
    ],
  },
  {
    slug: "mobile-dev",
    icon: Smartphone,
    titleEn: "Mobile Development",
    titleAr: "تطوير التطبيقات",
    descEn:
      "We create stunning mobile applications for iOS and Android that users love. Whether native or cross-platform, our mobile solutions are built for performance, security, and an exceptional user experience that keeps users engaged.",
    descAr:
      "نُنشئ تطبيقات جوال مذهلة لأنظمة iOS و Android يحبها المستخدمون. سواء كانت أصلية أو متعددة المنصات، حلول الجوال لدينا مبنية للأداء والأمان وتجربة مستخدم استثنائية تحافظ على تفاعل المستخدمين.",
    featuresEn: [
      "Native iOS development with Swift",
      "Native Android development with Kotlin",
      "Cross-platform apps with React Native & Flutter",
      "App store optimization (ASO)",
      "Push notifications and real-time features",
      "Offline-first architecture",
    ],
    featuresAr: [
      "تطوير iOS أصلي بلغة Swift",
      "تطوير Android أصلي بلغة Kotlin",
      "تطبيقات متعددة المنصات مع React Native و Flutter",
      "تحسين متاجر التطبيقات (ASO)",
      "إشعارات فورية وميزات الوقت الحقيقي",
      "بنية تعمل بدون اتصال أولاً",
    ],
    processEn: [
      { title: "Research & Strategy", description: "Market analysis, user research, and feature prioritization for your target audience." },
      { title: "UX/UI Design", description: "Wireframes, interactive prototypes, and polished visual designs following platform guidelines." },
      { title: "Development & QA", description: "Iterative development with continuous integration, device testing, and quality assurance." },
      { title: "Launch & Growth", description: "App store submission, launch strategy, analytics setup, and ongoing updates." },
    ],
    processAr: [
      { title: "البحث والاستراتيجية", description: "تحليل السوق وبحث المستخدمين وتحديد أولويات الميزات لجمهورك المستهدف." },
      { title: "تصميم UX/UI", description: "إطارات سلكية ونماذج أولية تفاعلية وتصميمات بصرية مصقولة وفق إرشادات المنصة." },
      { title: "التطوير وضمان الجودة", description: "تطوير تكراري مع تكامل مستمر واختبار الأجهزة وضمان الجودة." },
      { title: "الإطلاق والنمو", description: "إرسال لمتجر التطبيقات واستراتيجية الإطلاق وإعداد التحليلات والتحديثات المستمرة." },
    ],
  },
  {
    slug: "uiux",
    icon: Figma,
    titleEn: "UI/UX Design",
    titleAr: "تصميم واجهات المستخدم",
    descEn:
      "We design intuitive, accessible, and visually stunning digital experiences. Our human-centered design process ensures every interaction is purposeful, every layout is thoughtful, and every pixel serves the user's needs.",
    descAr:
      "نصمم تجارب رقمية بديهية وسهلة الوصول ومذهلة بصريًا. تضمن عملية التصميم المتمحورة حول الإنسان أن كل تفاعل هادف وكل تخطيط مدروس وكل بكسل يخدم احتياجات المستخدم.",
    featuresEn: [
      "User research and persona development",
      "Wireframing and interactive prototyping",
      "Visual design systems and component libraries",
      "Usability testing and A/B testing",
      "Accessibility compliance (WCAG 2.1)",
      "Design handoff and developer collaboration",
    ],
    featuresAr: [
      "بحث المستخدم وتطوير الشخصيات",
      "التخطيط والنماذج الأولية التفاعلية",
      "أنظمة التصميم البصري ومكتبات المكونات",
      "اختبار قابلية الاستخدام واختبار A/B",
      "الامتثال لمعايير إمكانية الوصول (WCAG 2.1)",
      "تسليم التصميم والتعاون مع المطورين",
    ],
    processEn: [
      { title: "Discover", description: "Stakeholder interviews, user research, competitive analysis, and requirement gathering." },
      { title: "Define", description: "User flows, information architecture, wireframes, and design specifications." },
      { title: "Design", description: "High-fidelity mockups, interactive prototypes, and a comprehensive design system." },
      { title: "Validate", description: "User testing, iteration based on feedback, and final design refinement." },
    ],
    processAr: [
      { title: "الاكتشاف", description: "مقابلات أصحاب المصلحة وبحث المستخدمين والتحليل التنافسي وجمع المتطلبات." },
      { title: "التحديد", description: "تدفقات المستخدم وهندسة المعلومات والإطارات السلكية ومواصفات التصميم." },
      { title: "التصميم", description: "نماذج عالية الدقة ونماذج أولية تفاعلية ونظام تصميم شامل." },
      { title: "التحقق", description: "اختبار المستخدمين والتكرار بناءً على الملاحظات وتحسين التصميم النهائي." },
    ],
  },
  {
    slug: "marketing",
    icon: Megaphone,
    titleEn: "Digital Marketing",
    titleAr: "التسويق الرقمي",
    descEn:
      "We create data-driven marketing strategies that amplify your brand's reach and drive measurable results. From SEO to social media, our team combines creativity with analytics to maximize your return on investment.",
    descAr:
      "نُنشئ استراتيجيات تسويقية مبنية على البيانات تعزز وصول علامتكم التجارية وتحقق نتائج قابلة للقياس. من تحسين محركات البحث إلى وسائل التواصل الاجتماعي، يجمع فريقنا بين الإبداع والتحليلات لتحقيق أقصى عائد على الاستثمار.",
    featuresEn: [
      "Search engine optimization (SEO)",
      "Social media management and advertising",
      "Content strategy and creation",
      "Email marketing automation",
      "Analytics, reporting, and insights",
      "Conversion rate optimization (CRO)",
    ],
    featuresAr: [
      "تحسين محركات البحث (SEO)",
      "إدارة وسائل التواصل الاجتماعي والإعلان",
      "استراتيجية وإنشاء المحتوى",
      "أتمتة التسويق عبر البريد الإلكتروني",
      "التحليلات والتقارير والرؤى",
      "تحسين معدل التحويل (CRO)",
    ],
    processEn: [
      { title: "Audit & Analysis", description: "Comprehensive audit of your current digital presence, competitors, and market opportunities." },
      { title: "Strategy Development", description: "Custom marketing strategy aligned with your business goals and target audience." },
      { title: "Implementation", description: "Campaign execution across selected channels with ongoing content creation." },
      { title: "Measure & Optimize", description: "Performance tracking, A/B testing, and continuous optimization for better results." },
    ],
    processAr: [
      { title: "التدقيق والتحليل", description: "تدقيق شامل لوجودكم الرقمي الحالي والمنافسين وفرص السوق." },
      { title: "تطوير الاستراتيجية", description: "استراتيجية تسويقية مخصصة متوافقة مع أهداف أعمالكم وجمهوركم المستهدف." },
      { title: "التنفيذ", description: "تنفيذ الحملات عبر القنوات المختارة مع إنشاء محتوى مستمر." },
      { title: "القياس والتحسين", description: "تتبع الأداء واختبار A/B والتحسين المستمر لنتائج أفضل." },
    ],
  },
  {
    slug: "branding",
    icon: PenTool,
    titleEn: "Brand Identity",
    titleAr: "الهوية البصرية",
    descEn:
      "We craft compelling brand identities that tell your story and resonate with your audience. From logo design to comprehensive brand guidelines, we create visual systems that set you apart and build lasting recognition.",
    descAr:
      "نصنع هويات بصرية مقنعة تروي قصتكم وتتواصل مع جمهوركم. من تصميم الشعار إلى دليل العلامة التجارية الشامل، نُنشئ أنظمة بصرية تميزكم وتبني تعرفًا دائمًا.",
    featuresEn: [
      "Logo design and visual mark creation",
      "Brand guidelines and style guides",
      "Color palette and typography selection",
      "Business card and stationery design",
      "Social media templates and assets",
      "Brand strategy and positioning",
    ],
    featuresAr: [
      "تصميم الشعار وإنشاء العلامة البصرية",
      "دليل العلامة التجارية ودليل الأسلوب",
      "اختيار لوحة الألوان والخطوط",
      "تصميم بطاقات العمل والقرطاسية",
      "قوالب وسائل التواصل الاجتماعي والأصول",
      "استراتيجية العلامة التجارية والتموضع",
    ],
    processEn: [
      { title: "Brand Discovery", description: "Understanding your vision, values, target audience, and competitive landscape." },
      { title: "Concept Development", description: "Creating multiple brand concepts, mood boards, and initial design directions." },
      { title: "Design Refinement", description: "Iterating on the chosen concept to perfect every detail of your brand identity." },
      { title: "Brand Delivery", description: "Complete brand package with guidelines, assets, and templates for all touchpoints." },
    ],
    processAr: [
      { title: "اكتشاف العلامة التجارية", description: "فهم رؤيتكم وقيمكم وجمهوركم المستهدف والمشهد التنافسي." },
      { title: "تطوير المفهوم", description: "إنشاء مفاهيم متعددة للعلامة التجارية ولوحات مزاجية واتجاهات تصميم أولية." },
      { title: "تحسين التصميم", description: "التكرار على المفهوم المختار لإتقان كل تفصيل من هويتكم البصرية." },
      { title: "تسليم العلامة التجارية", description: "حزمة علامة تجارية كاملة مع الإرشادات والأصول والقوالب لجميع نقاط الاتصال." },
    ],
  },
  {
    slug: "consulting",
    icon: MessageSquare,
    titleEn: "Technical Consulting",
    titleAr: "الاستشارات التقنية",
    descEn:
      "We provide expert technical consulting to help you make informed decisions about your digital infrastructure. From architecture reviews to technology selection, we guide your team toward solutions that scale with your business.",
    descAr:
      "نقدم استشارات تقنية متخصصة لمساعدتكم في اتخاذ قرارات مدروسة حول بنيتكم التحتية الرقمية. من مراجعات البنية إلى اختيار التقنيات، نوجه فريقكم نحو حلول تتوسع مع أعمالكم.",
    featuresEn: [
      "Technology stack evaluation and selection",
      "System architecture review and design",
      "Code audits and performance analysis",
      "Team mentoring and skill development",
      "Process optimization and DevOps practices",
      "Security assessment and best practices",
    ],
    featuresAr: [
      "تقييم واختيار حزمة التقنيات",
      "مراجعة وتصميم بنية النظام",
      "تدقيق الكود وتحليل الأداء",
      "تدريب الفريق وتطوير المهارات",
      "تحسين العمليات وممارسات DevOps",
      "تقييم الأمان وأفضل الممارسات",
    ],
    processEn: [
      { title: "Assessment", description: "Thorough evaluation of your current systems, processes, and team capabilities." },
      { title: "Recommendations", description: "Detailed report with prioritized recommendations and implementation roadmap." },
      { title: "Implementation Support", description: "Hands-on guidance during implementation with regular check-ins and reviews." },
      { title: "Knowledge Transfer", description: "Training sessions and documentation to ensure your team can maintain the solutions." },
    ],
    processAr: [
      { title: "التقييم", description: "تقييم شامل لأنظمتكم وعملياتكم وقدرات فريقكم الحالية." },
      { title: "التوصيات", description: "تقرير مفصل مع توصيات ذات أولوية وخارطة طريق للتنفيذ." },
      { title: "دعم التنفيذ", description: "إرشاد عملي أثناء التنفيذ مع متابعات ومراجعات منتظمة." },
      { title: "نقل المعرفة", description: "جلسات تدريبية ووثائق لضمان قدرة فريقكم على صيانة الحلول." },
    ],
  },
];

const processIcons = [Search, Lightbulb, Settings, Rocket];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function ServiceDetailContent({ slug }: { slug: string }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const service = services.find((s) => s.slug === slug) ?? services[0];
  const Icon = service.icon;

  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-60px" });

  const timelineItems = (isAr ? service.processAr : service.processEn).map(
    (step, i) => ({
      title: step.title,
      description: step.description,
      icon: processIcons[i],
      date: isAr ? `الخطوة ${i + 1}` : `Step ${i + 1}`,
    })
  );

  return (
    <>
      {/* Hero */}
      <section
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
        }}
      >
        <Container size="sm">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Icon */}
            <div
              className="mx-auto mb-5 h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(var(--color-primary-rgb) / 0.08)",
                border: "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                color: "var(--color-primary)",
              }}
            >
              <Icon className="h-8 w-8" />
            </div>

            <SectionHeading
              title={isAr ? service.titleAr : service.titleEn}
              subtitle={isAr ? "خدماتنا" : "Our Services"}
            />

            <p className="text-sm text-foreground leading-relaxed max-w-2xl mx-auto mt-[-1rem]">
              {isAr ? service.descAr : service.descEn}
            </p>
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* Features */}
      <section className="section-lazy" style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <SectionHeading
            title={isAr ? "ما نقدمه" : "What We Offer"}
            subtitle={isAr ? "الميزات" : "Features"}
          />

          <motion.div
            ref={featuresRef}
            className="grid gap-3 sm:grid-cols-2 max-w-3xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
          >
            {(isAr ? service.featuresAr : service.featuresEn).map(
              (feature, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                  }}
                >
                  <div
                    className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: "rgba(var(--color-primary-rgb) / 0.08)",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </motion.div>
              )
            )}
          </motion.div>
        </Container>
      </section>

      <SectionDivider />

      {/* Process Timeline */}
      <section
        className="section-lazy"
        style={{
          paddingBlock: "var(--section-y)",
          background: "rgba(var(--color-primary-rgb) / 0.02)",
        }}
      >
        <Container size="sm">
          <SectionHeading
            title={isAr ? "كيف نعمل" : "Our Process"}
            subtitle={isAr ? "المنهجية" : "Methodology"}
            description={
              isAr
                ? "نتبع منهجية مثبتة لضمان تقديم نتائج استثنائية في كل مشروع"
                : "We follow a proven methodology to ensure exceptional results on every project"
            }
          />

          <Timeline items={timelineItems} />
        </Container>
      </section>

      <SectionDivider />

      {/* CTA */}
      <section style={{ paddingBlock: "var(--section-y)" }}>
        <Container size="sm">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="font-bold tracking-tight mb-3"
              style={{ fontSize: "var(--text-h2)" }}
            >
              {isAr ? "هل أنت مستعد للبدء؟" : "Ready to Get Started?"}
            </h2>
            <p className="text-sm text-foreground mb-6 max-w-md mx-auto">
              {isAr
                ? "تواصل معنا اليوم لمناقشة مشروعك والحصول على عرض سعر مخصص"
                : "Contact us today to discuss your project and get a custom quote"}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white cursor-pointer"
                style={{
                  background: "var(--color-primary)",
                  boxShadow: "0 2px 12px rgba(var(--color-primary-rgb) / 0.25)",
                }}
              >
                {isAr ? "تواصل معنا" : "Contact Us"}
                <Arrow className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold cursor-pointer"
                style={{
                  border: "1px solid rgba(var(--color-primary-rgb) / 0.15)",
                  color: "var(--color-primary)",
                }}
              >
                {isAr ? "جميع الخدمات" : "All Services"}
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
