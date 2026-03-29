export type HeroVariant = "default" | "centered" | "split" | "minimal";
export type FooterVariant = "default" | "standard" | "minimal" | "centered";
export type NavbarVariant = "glass" | "solid" | "minimal" | "floating" | "gradient" | "bordered";
export type NavbarHover = "pill" | "underline" | "glow" | "scale" | "fill" | "none";
export type NavbarAnimation = "spring" | "smooth" | "bounce" | "none";
export type CtaStyle = "filled" | "outlined" | "gradient" | "glow" | "none";
export type NavbarNavStyle = "pill-container" | "separate" | "underlined" | "plain";
export type NavbarLogoShape = "rounded" | "circle" | "square";
export type NavbarHeight = "sm" | "md" | "lg";
export type NavbarShadow = "none" | "sm" | "lg";
export type DarkModeStyle = "icon" | "icon-label" | "pill-switch" | "minimal";
export type LangSwitcherStyle = "text" | "icon-text" | "badge" | "minimal";
export type ThemePanelStyle = "dropdown" | "dots-inline" | "swatch-only" | "minimal";

/* ── Hero types ── */
export type HeroBgStyle = "dots" | "gradient" | "clean" | "grid";
export type HeroCtaStyle = "filled" | "outlined" | "gradient" | "glow" | "pill";
export type HeroImageStyle = "card" | "gradient-border" | "floating" | "masked" | "none";
export type HeroAnimation = "fade-up" | "slide-in" | "blur-in" | "scale" | "none";

export interface HeroContent {
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  highlightEn: string;
  highlightAr: string;
  descriptionEn: string;
  descriptionAr: string;
  ctaEn: string;
  ctaAr: string;
  secondaryCtaEn: string;
  secondaryCtaAr: string;
}

export interface HeroConfig {
  variant: HeroVariant;
  bgStyle: HeroBgStyle;
  ctaStyle: HeroCtaStyle;
  imageStyle: HeroImageStyle;
  animation: HeroAnimation;
  showBadge: boolean;
  showStats: boolean;
  showFeatures: boolean;
  showImage: boolean;
  showFloatingCards: boolean;
  showSecondaryCta: boolean;
  content: HeroContent;
}

export interface PageConfig {
  key: string;
  href: string;
  labelEn: string;
  labelAr: string;
  visible: boolean;
  inNavbar: boolean;
}

export interface NavbarConfig {
  variant: NavbarVariant;
  hover: NavbarHover;
  animation: NavbarAnimation;
  ctaStyle: CtaStyle;
  navStyle: NavbarNavStyle;
  logoShape: NavbarLogoShape;
  height: NavbarHeight;
  shadow: NavbarShadow;
  darkModeStyle: DarkModeStyle;
  langSwitcherStyle: LangSwitcherStyle;
  themePanelStyle: ThemePanelStyle;
  showTopGlow: boolean;
  showBottomBorder: boolean;
  showLogo: boolean;
  showLogoText: boolean;
  showThemeSwitcher: boolean;
  showLanguageSwitcher: boolean;
  showDashboardBtn: boolean;
  sticky: boolean;
}

/* ── Logo Cloud types ── */
export interface LogoCloudConfig {
  headingEn: string;
  headingAr: string;
  logos: string[];
  speed: number; // seconds for one loop
  showHeading: boolean;
}

/* ── Features types ── */
export interface FeaturesConfig {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  showRatings: boolean;
  showBadges: boolean;
  showQuotes: boolean;
  showModal: boolean;
  showImages: boolean;
}

/* ── Services types ── */
export interface ServicesConfig {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  showCategories: boolean;
  showFeatureList: boolean;
  showViewAll: boolean;
  showImages: boolean;
}

/* ── Stats types ── */
export interface StatsConfig {
  autoPlay: boolean;
  interval: number; // ms
}

/* ── Testimonials types ── */
export interface TestimonialsConfig {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  autoPlay: boolean;
  showReadMore: boolean;
  showSidePreviews: boolean;
}

/* ── CTA types ── */
export interface CtaConfig {
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  badgeEn: string;
  badgeAr: string;
  buttonEn: string;
  buttonAr: string;
  showCountdown: boolean;
  showBadge: boolean;
  showBottomInfo: boolean;
}

/* ── Process types ── */
export interface ProcessConfig {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  badgeEn: string;
  badgeAr: string;
  showDetails: boolean;
  showConnectors: boolean;
  showBottomCta: boolean;
}

/* ── Page Content types ── */
export interface SectionConfig {
  visible: boolean;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
}

export interface PageContentConfig {
  sections: Record<string, SectionConfig>;
}

export type PagesContent = Record<string, PageContentConfig>;

// ═══ EDITABLE CONTENT TYPES ═══

export interface TeamMember {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  image: string;
  bioEn: string;
  bioAr: string;
}

export interface TestimonialItem {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  company: string;
  quoteEn: string;
  quoteAr: string;
  rating: number;
  image: string;
}

export interface FaqItem {
  id: string;
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  category: string;
}

export interface PricingPlan {
  id: string;
  nameEn: string;
  nameAr: string;
  priceMonthly: string;
  priceYearly: string;
  descriptionEn: string;
  descriptionAr: string;
  featuresEn: string[];
  featuresAr: string[];
  popular: boolean;
  ctaEn: string;
  ctaAr: string;
}

export interface StatItem {
  id: string;
  value: string;
  labelEn: string;
  labelAr: string;
  icon: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  visible: boolean;
}

export interface FooterContent {
  descriptionEn: string;
  descriptionAr: string;
  copyrightEn: string;
  copyrightAr: string;
  socialLinks: SocialLink[];
}

export interface SiteConfig {
  pages: PageConfig[];
  hero: HeroConfig;
  footerVariant: FooterVariant;
  navbar: NavbarConfig;
  logoCloud: LogoCloudConfig;
  features: FeaturesConfig;
  services: ServicesConfig;
  stats: StatsConfig;
  testimonials: TestimonialsConfig;
  cta: CtaConfig;
  process: ProcessConfig;
  pagesContent: PagesContent;
  teamMembers: TeamMember[];
  testimonialItems: TestimonialItem[];
  faqItems: FaqItem[];
  pricingPlans: PricingPlan[];
  statItems: StatItem[];
  footerContent: FooterContent;
}

export const DEFAULT_HERO_CONTENT: HeroContent = {
  badgeEn: "Building the Digital Future",
  badgeAr: "نبني المستقبل الرقمي",
  titleEn: "We Create",
  titleAr: "نصنع تجارب",
  highlightEn: "Digital Experiences",
  highlightAr: "رقمية استثنائية",
  descriptionEn: "We deliver integrated digital solutions combining creative design and advanced technology to help you achieve your goals. From concept to launch, our expert team crafts tailored experiences that drive growth, engage audiences, and transform your vision into reality.",
  descriptionAr: "نقدم حلولاً رقمية متكاملة تجمع بين التصميم الإبداعي والتقنية المتقدمة لنساعدك في تحقيق أهدافك. من الفكرة إلى الإطلاق، يعمل فريقنا المتخصص على صياغة تجارب مخصصة تدفع النمو وتجذب الجمهور وتحول رؤيتك إلى واقع ملموس.",
  ctaEn: "Start Your Project",
  ctaAr: "ابدأ مشروعك",
  secondaryCtaEn: "View Our Work",
  secondaryCtaAr: "شاهد أعمالنا",
};

export const DEFAULT_HERO: HeroConfig = {
  variant: "default",
  bgStyle: "dots",
  ctaStyle: "filled",
  imageStyle: "card",
  animation: "fade-up",
  showBadge: true,
  showStats: true,
  showFeatures: true,
  showImage: true,
  showFloatingCards: true,
  showSecondaryCta: true,
  content: DEFAULT_HERO_CONTENT,
};

export const DEFAULT_NAVBAR: NavbarConfig = {
  variant: "glass",
  hover: "pill",
  animation: "spring",
  ctaStyle: "filled",
  navStyle: "pill-container",
  logoShape: "rounded",
  height: "md",
  shadow: "sm",
  darkModeStyle: "icon",
  langSwitcherStyle: "text",
  themePanelStyle: "dropdown",
  showTopGlow: true,
  showBottomBorder: true,
  showLogo: true,
  showLogoText: true,
  showThemeSwitcher: true,
  showLanguageSwitcher: true,
  showDashboardBtn: true,
  sticky: true,
};

export const DEFAULT_LOGO_CLOUD: LogoCloudConfig = {
  headingEn: "Trusted by leading companies",
  headingAr: "موثوق من قبل شركات رائدة",
  logos: ["ACME", "APEX", "NOVA", "FLUX", "SYNC", "BOLT", "CORE", "WAVE"],
  speed: 25,
  showHeading: true,
};

export const DEFAULT_FEATURES: FeaturesConfig = {
  titleEn: "Our Features",
  titleAr: "مميزاتنا",
  subtitleEn: "What We Offer",
  subtitleAr: "ما نقدمه",
  showRatings: true,
  showBadges: true,
  showQuotes: true,
  showModal: true,
  showImages: true,
};

export const DEFAULT_SERVICES: ServicesConfig = {
  titleEn: "Our Services",
  titleAr: "خدماتنا",
  subtitleEn: "What We Do",
  subtitleAr: "ما نقوم به",
  showCategories: true,
  showFeatureList: true,
  showViewAll: true,
  showImages: true,
};

export const DEFAULT_STATS: StatsConfig = {
  autoPlay: true,
  interval: 4000,
};

export const DEFAULT_TESTIMONIALS: TestimonialsConfig = {
  titleEn: "What Our Clients Say",
  titleAr: "ماذا يقول عملاؤنا",
  subtitleEn: "Testimonials",
  subtitleAr: "آراء العملاء",
  autoPlay: true,
  showReadMore: true,
  showSidePreviews: true,
};

export const DEFAULT_CTA: CtaConfig = {
  titleEn: "30% Off All Services",
  titleAr: "خصم 30% على جميع الخدمات",
  descEn: "Don't miss out! Get our premium services at a discounted price for a limited time",
  descAr: "لا تفوت الفرصة! احصل على خدماتنا المميزة بسعر مخفض لفترة محدودة",
  badgeEn: "Limited Time Offer",
  badgeAr: "عرض محدود",
  buttonEn: "Get Started Now",
  buttonAr: "ابدأ الآن",
  showCountdown: true,
  showBadge: true,
  showBottomInfo: true,
};

export const DEFAULT_PROCESS: ProcessConfig = {
  titleEn: "From Idea to Launch",
  titleAr: "من الفكرة إلى الإطلاق",
  subtitleEn: "We follow a proven methodology to transform your vision into exceptional digital reality",
  subtitleAr: "نتبع منهجية مجربة لتحويل رؤيتك إلى واقع رقمي متميز",
  badgeEn: "How We Work",
  badgeAr: "كيف نعمل",
  showDetails: true,
  showConnectors: true,
  showBottomCta: true,
};

export const ALL_PAGES: PageConfig[] = [
  { key: "home", href: "/", labelEn: "Home", labelAr: "الرئيسية", visible: true, inNavbar: true },
  { key: "about", href: "/about", labelEn: "About", labelAr: "من نحن", visible: true, inNavbar: true },
  { key: "services", href: "/services", labelEn: "Services", labelAr: "خدماتنا", visible: true, inNavbar: true },
  { key: "portfolio", href: "/portfolio", labelEn: "Portfolio", labelAr: "أعمالنا", visible: true, inNavbar: true },
  { key: "blog", href: "/blog", labelEn: "Blog", labelAr: "المدونة", visible: true, inNavbar: true },
  { key: "contact", href: "/contact", labelEn: "Contact", labelAr: "تواصل معنا", visible: true, inNavbar: true },
  { key: "team", href: "/team", labelEn: "Team", labelAr: "الفريق", visible: true, inNavbar: false },
  { key: "pricing", href: "/pricing", labelEn: "Pricing", labelAr: "الأسعار", visible: true, inNavbar: false },
  { key: "faq", href: "/faq", labelEn: "FAQ", labelAr: "الأسئلة الشائعة", visible: true, inNavbar: false },
  { key: "testimonials", href: "/testimonials", labelEn: "Testimonials", labelAr: "آراء العملاء", visible: true, inNavbar: false },
  { key: "careers", href: "/careers", labelEn: "Careers", labelAr: "الوظائف", visible: true, inNavbar: false },
  { key: "dashboard", href: "/dashboard", labelEn: "Dashboard", labelAr: "لوحة التحكم", visible: true, inNavbar: false },
  { key: "gallery", href: "/gallery", labelEn: "Gallery", labelAr: "المعرض", visible: true, inNavbar: true },
  { key: "designer", href: "/designer", labelEn: "Designer", labelAr: "المصمم", visible: true, inNavbar: true },
];

const s = (titleEn: string, titleAr: string, subtitleEn = "", subtitleAr = ""): SectionConfig => ({
  visible: true,
  titleEn,
  titleAr,
  subtitleEn,
  subtitleAr,
});

export const DEFAULT_PAGES_CONTENT: PagesContent = {
  about: {
    sections: {
      hero: s("About Us", "من نحن", "Learn more about our company", "تعرف على شركتنا"),
      story: s("Our Story", "قصتنا", "How we started", "كيف بدأنا"),
      mission: s("Mission & Vision", "الرسالة والرؤية", "What drives us forward", "ما يدفعنا للأمام"),
      stats: s("Our Numbers", "أرقامنا", "Achievements in numbers", "إنجازاتنا بالأرقام"),
      approach: s("Our Approach", "نهجنا", "How we work", "كيف نعمل"),
      team: s("Our Team", "فريقنا", "Meet the people behind our success", "تعرف على فريقنا"),
      awards: s("Awards & Recognition", "الجوائز والتقدير", "Our achievements", "إنجازاتنا"),
      partners: s("Our Partners", "شركاؤنا", "Companies we work with", "الشركات التي نعمل معها"),
      cta: s("Get Started", "ابدأ الآن", "Ready to work with us?", "هل أنت مستعد للعمل معنا؟"),
    },
  },
  services: {
    sections: {
      hero: s("Our Services", "خدماتنا", "What we offer", "ما نقدمه"),
      categories: s("Service Categories", "فئات الخدمات", "Browse by category", "تصفح حسب الفئة"),
      serviceGrid: s("All Services", "جميع الخدمات", "Explore our full range", "استكشف مجموعتنا الكاملة"),
      process: s("Our Process", "عمليتنا", "How we deliver results", "كيف نحقق النتائج"),
      techStack: s("Technology Stack", "التقنيات المستخدمة", "Tools we use", "الأدوات التي نستخدمها"),
      comparison: s("Service Comparison", "مقارنة الخدمات", "Find the right fit", "اعثر على الأنسب"),
      faq: s("Frequently Asked Questions", "الأسئلة الشائعة", "Common questions answered", "إجابات الأسئلة الشائعة"),
      cta: s("Start Your Project", "ابدأ مشروعك", "Let's build something great", "لنبني شيئاً رائعاً"),
    },
  },
  portfolio: {
    sections: {
      hero: s("Our Portfolio", "أعمالنا", "See what we've built", "شاهد ما بنيناه"),
      featured: s("Featured Projects", "المشاريع المميزة", "Our best work", "أفضل أعمالنا"),
      projectGrid: s("All Projects", "جميع المشاريع", "Browse our complete portfolio", "تصفح معرض أعمالنا الكامل"),
      industries: s("Industries We Serve", "القطاعات التي نخدمها", "Diverse expertise", "خبرات متنوعة"),
      testimonial: s("Client Feedback", "آراء العملاء", "What our clients say", "ماذا يقول عملاؤنا"),
      cta: s("Start Your Project", "ابدأ مشروعك", "Ready to create something amazing?", "هل أنت مستعد لإنشاء شيء مذهل؟"),
    },
  },
  contact: {
    sections: {
      hero: s("Contact Us", "تواصل معنا", "Get in touch", "ابقَ على تواصل"),
      info: s("Contact Information", "معلومات الاتصال", "Ways to reach us", "طرق التواصل معنا"),
      form: s("Send a Message", "أرسل رسالة", "We'd love to hear from you", "يسعدنا أن نسمع منك"),
      map: s("Our Location", "موقعنا", "Find us on the map", "اعثر علينا على الخريطة"),
      faq: s("Frequently Asked Questions", "الأسئلة الشائعة", "Quick answers", "إجابات سريعة"),
      cta: s("Let's Talk", "لنتحدث", "Ready to start a conversation?", "هل أنت مستعد لبدء محادثة؟"),
    },
  },
  team: {
    sections: {
      hero: s("Our Team", "فريقنا", "Meet the experts", "تعرف على الخبراء"),
      leadership: s("Leadership", "القيادة", "Our executive team", "فريقنا التنفيذي"),
      fullGrid: s("All Team Members", "جميع أعضاء الفريق", "The people behind our success", "الأشخاص وراء نجاحنا"),
      culture: s("Our Culture", "ثقافتنا", "What makes us unique", "ما يجعلنا مميزين"),
      stats: s("Team Stats", "إحصائيات الفريق", "Our team in numbers", "فريقنا بالأرقام"),
      cta: s("Join Our Team", "انضم لفريقنا", "We're always looking for talent", "نبحث دائماً عن المواهب"),
    },
  },
  pricing: {
    sections: {
      hero: s("Pricing Plans", "خطط الأسعار", "Choose the right plan", "اختر الخطة المناسبة"),
      plans: s("Our Plans", "خططنا", "Flexible pricing for every need", "أسعار مرنة لكل احتياج"),
      comparison: s("Plan Comparison", "مقارنة الخطط", "Compare features side by side", "قارن الميزات جنباً إلى جنب"),
      guarantee: s("Money-Back Guarantee", "ضمان استرداد الأموال", "Risk-free commitment", "التزام بدون مخاطر"),
      faq: s("Pricing FAQ", "أسئلة شائعة عن الأسعار", "Common pricing questions", "أسئلة شائعة عن التسعير"),
      enterprise: s("Enterprise Solutions", "حلول المؤسسات", "Custom plans for large teams", "خطط مخصصة للفرق الكبيرة"),
    },
  },
  faq: {
    sections: {
      hero: s("FAQ", "الأسئلة الشائعة", "Find answers quickly", "اعثر على الإجابات بسرعة"),
      categories: s("Browse by Category", "تصفح حسب الفئة", "Organized for easy access", "منظمة لسهولة الوصول"),
      stats: s("Help Center Stats", "إحصائيات مركز المساعدة", "Our support in numbers", "دعمنا بالأرقام"),
      cta: s("Still Have Questions?", "لا تزال لديك أسئلة؟", "We're here to help", "نحن هنا للمساعدة"),
    },
  },
  testimonials: {
    sections: {
      hero: s("Testimonials", "آراء العملاء", "What our clients say", "ماذا يقول عملاؤنا"),
      featured: s("Featured Reviews", "التقييمات المميزة", "Top client stories", "أبرز قصص العملاء"),
      stats: s("Satisfaction Stats", "إحصائيات الرضا", "Our track record", "سجل إنجازاتنا"),
      grid: s("All Testimonials", "جميع الآراء", "Read more reviews", "اقرأ المزيد من التقييمات"),
      video: s("Video Testimonials", "شهادات بالفيديو", "Hear directly from clients", "اسمع مباشرة من العملاء"),
      trust: s("Trust Indicators", "مؤشرات الثقة", "Why clients trust us", "لماذا يثق بنا العملاء"),
      cta: s("Share Your Experience", "شارك تجربتك", "We'd love your feedback", "يسعدنا سماع رأيك"),
    },
  },
  careers: {
    sections: {
      hero: s("Careers", "الوظائف", "Join our growing team", "انضم لفريقنا المتنامي"),
      benefits: s("Benefits & Perks", "المزايا والفوائد", "Why work with us", "لماذا تعمل معنا"),
      culture: s("Our Culture", "ثقافتنا", "Life at our company", "الحياة في شركتنا"),
      jobs: s("Open Positions", "الوظائف المتاحة", "Current opportunities", "الفرص الحالية"),
      perks: s("Employee Perks", "امتيازات الموظفين", "What we offer our team", "ما نقدمه لفريقنا"),
      process: s("Hiring Process", "عملية التوظيف", "How to join us", "كيف تنضم إلينا"),
      cta: s("Apply Now", "قدّم الآن", "Take the next step in your career", "اتخذ الخطوة التالية في مسيرتك"),
    },
  },
  blog: {
    sections: {
      hero: s("Our Blog", "مدونتنا", "Insights and updates", "رؤى وتحديثات"),
      featured: s("Featured Articles", "المقالات المميزة", "Our top picks", "اختياراتنا المميزة"),
      grid: s("All Articles", "جميع المقالات", "Browse all posts", "تصفح جميع المقالات"),
      newsletter: s("Newsletter", "النشرة البريدية", "Stay up to date", "ابقَ على اطلاع"),
      tags: s("Popular Tags", "الوسوم الشائعة", "Browse by topic", "تصفح حسب الموضوع"),
      cta: s("Subscribe", "اشترك", "Never miss an update", "لا تفوّت أي تحديث"),
    },
  },
  gallery: {
    sections: {
      hero: s("Gallery", "المعرض", "Visual showcase", "عرض مرئي"),
      filters: s("Filter Gallery", "تصفية المعرض", "Browse by category", "تصفح حسب الفئة"),
      grid: s("All Works", "جميع الأعمال", "Explore our visual portfolio", "استكشف معرض أعمالنا المرئي"),
      stats: s("Gallery Stats", "إحصائيات المعرض", "Our creative output", "إنتاجنا الإبداعي"),
      cta: s("Start a Project", "ابدأ مشروعاً", "Let's create something beautiful", "لنصنع شيئاً جميلاً"),
    },
  },
  designer: {
    sections: {
      hero: s("Designer", "المصمم", "Creative professional portfolio", "معرض أعمال إبداعي احترافي"),
      about: s("About Me", "عني", "Get to know me", "تعرف عليّ"),
      services: s("My Services", "خدماتي", "What I offer", "ما أقدمه"),
      skills: s("Skills & Expertise", "المهارات والخبرات", "What I'm good at", "ما أتقنه"),
      portfolio: s("My Portfolio", "أعمالي", "Selected works", "أعمال مختارة"),
      process: s("My Process", "طريقة عملي", "How I work", "كيف أعمل"),
      pricing: s("Pricing", "الأسعار", "Investment options", "خيارات الاستثمار"),
      testimonials: s("Client Reviews", "آراء العملاء", "What clients say", "ماذا يقول العملاء"),
      contact: s("Get in Touch", "تواصل معي", "Let's work together", "لنعمل معاً"),
      cta: s("Hire Me", "وظّفني", "Ready to start your project?", "هل أنت مستعد لبدء مشروعك؟"),
    },
  },
};

// ═══ DEFAULT EDITABLE CONTENT ═══

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    nameEn: "Mohammed Ahmed",
    nameAr: "محمد أحمد",
    roleEn: "CEO & Founder",
    roleAr: "الرئيس التنفيذي والمؤسس",
    image: "https://picsum.photos/seed/team1/400/400",
    bioEn: "With over 20 years of experience in digital innovation, Mohammed leads the company vision and strategy.",
    bioAr: "مع أكثر من 20 عامًا من الخبرة في الابتكار الرقمي، يقود محمد رؤية الشركة واستراتيجيتها.",
  },
  {
    id: "tm-2",
    nameEn: "Noura Al-Salem",
    nameAr: "نورة السالم",
    roleEn: "Design Director",
    roleAr: "مديرة التصميم",
    image: "https://picsum.photos/seed/team2/400/400",
    bioEn: "Noura brings creative excellence to every project, crafting stunning visual experiences that captivate audiences.",
    bioAr: "تضفي نورة التميز الإبداعي على كل مشروع، وتصمم تجارب بصرية مذهلة تأسر الجمهور.",
  },
  {
    id: "tm-3",
    nameEn: "Fahd Al-Omari",
    nameAr: "فهد العمري",
    roleEn: "Development Lead",
    roleAr: "رئيس قسم التطوير",
    image: "https://picsum.photos/seed/team3/400/400",
    bioEn: "Fahd architects scalable solutions using cutting-edge technologies, ensuring performance and reliability.",
    bioAr: "يصمم فهد حلولاً قابلة للتوسع باستخدام أحدث التقنيات، مع ضمان الأداء والموثوقية.",
  },
  {
    id: "tm-4",
    nameEn: "Reem Al-Harbi",
    nameAr: "ريم الحربي",
    roleEn: "Marketing Lead",
    roleAr: "رئيسة قسم التسويق",
    image: "https://picsum.photos/seed/team4/400/400",
    bioEn: "Reem drives brand growth through data-driven marketing strategies and compelling storytelling.",
    bioAr: "تقود ريم نمو العلامة التجارية من خلال استراتيجيات تسويق مبنية على البيانات وسرد قصصي مقنع.",
  },
];

export const DEFAULT_TESTIMONIALS_ITEMS: TestimonialItem[] = [
  {
    id: "tst-1",
    nameEn: "Khalid Al-Rashidi",
    nameAr: "خالد الرشيدي",
    roleEn: "CEO",
    roleAr: "الرئيس التنفيذي",
    company: "TechVision",
    quoteEn: "Working with this team transformed our digital presence entirely. Their attention to detail and innovative approach exceeded all our expectations.",
    quoteAr: "العمل مع هذا الفريق حوّل حضورنا الرقمي بالكامل. اهتمامهم بالتفاصيل ونهجهم المبتكر فاق كل توقعاتنا.",
    rating: 5,
    image: "https://picsum.photos/seed/review1/200/200",
  },
  {
    id: "tst-2",
    nameEn: "Sara Al-Dosari",
    nameAr: "سارة الدوسري",
    roleEn: "Marketing Director",
    roleAr: "مديرة التسويق",
    company: "GrowthHub",
    quoteEn: "The results speak for themselves — a 200% increase in engagement and a brand identity that truly represents who we are.",
    quoteAr: "النتائج تتحدث عن نفسها — زيادة بنسبة 200% في التفاعل وهوية علامة تجارية تمثل حقًا من نحن.",
    rating: 5,
    image: "https://picsum.photos/seed/review2/200/200",
  },
  {
    id: "tst-3",
    nameEn: "Omar Al-Faisal",
    nameAr: "عمر الفيصل",
    roleEn: "CTO",
    roleAr: "المدير التقني",
    company: "DataFlow",
    quoteEn: "Their technical expertise is outstanding. They delivered a complex platform on time and with exceptional quality.",
    quoteAr: "خبرتهم التقنية متميزة. قدموا منصة معقدة في الوقت المحدد وبجودة استثنائية.",
    rating: 4,
    image: "https://picsum.photos/seed/review3/200/200",
  },
  {
    id: "tst-4",
    nameEn: "Lina Al-Mutairi",
    nameAr: "لينا المطيري",
    roleEn: "Founder",
    roleAr: "المؤسسة",
    company: "CreativeSpace",
    quoteEn: "From concept to launch, they guided us every step of the way. Professional, creative, and truly dedicated to our success.",
    quoteAr: "من الفكرة إلى الإطلاق، أرشدونا في كل خطوة. محترفون ومبدعون وملتزمون حقًا بنجاحنا.",
    rating: 5,
    image: "https://picsum.photos/seed/review4/200/200",
  },
];

export const DEFAULT_FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    questionEn: "What services do you offer?",
    questionAr: "ما هي الخدمات التي تقدمونها؟",
    answerEn: "We offer a comprehensive range of digital services including web development, mobile app development, UI/UX design, branding, and digital marketing strategies.",
    answerAr: "نقدم مجموعة شاملة من الخدمات الرقمية تشمل تطوير المواقع، تطوير تطبيقات الجوال، تصميم واجهات المستخدم، الهوية البصرية، واستراتيجيات التسويق الرقمي.",
    category: "general",
  },
  {
    id: "faq-2",
    questionEn: "How long does a typical project take?",
    questionAr: "كم يستغرق المشروع النموذجي؟",
    answerEn: "Project timelines vary based on scope and complexity. A typical website takes 4-8 weeks, while larger platforms may take 3-6 months. We provide detailed timelines during the proposal phase.",
    answerAr: "تختلف الجداول الزمنية للمشاريع بناءً على النطاق والتعقيد. يستغرق الموقع النموذجي 4-8 أسابيع، بينما قد تستغرق المنصات الأكبر 3-6 أشهر. نقدم جداول زمنية مفصلة خلال مرحلة العرض.",
    category: "services",
  },
  {
    id: "faq-3",
    questionEn: "Do you offer ongoing support after launch?",
    questionAr: "هل تقدمون دعمًا مستمرًا بعد الإطلاق؟",
    answerEn: "Yes, we offer maintenance and support packages to ensure your project continues to perform optimally. This includes bug fixes, updates, and performance monitoring.",
    answerAr: "نعم، نقدم حزم صيانة ودعم لضمان استمرار مشروعك في الأداء بشكل مثالي. يشمل ذلك إصلاح الأخطاء والتحديثات ومراقبة الأداء.",
    category: "services",
  },
  {
    id: "faq-4",
    questionEn: "What is your pricing model?",
    questionAr: "ما هو نموذج التسعير لديكم؟",
    answerEn: "We offer flexible pricing including fixed-price projects, monthly retainers, and hourly rates. We tailor our pricing to match your budget and project requirements.",
    answerAr: "نقدم أسعارًا مرنة تشمل مشاريع بسعر ثابت، اشتراكات شهرية، وأسعار بالساعة. نخصص أسعارنا لتتناسب مع ميزانيتك ومتطلبات مشروعك.",
    category: "pricing",
  },
  {
    id: "faq-5",
    questionEn: "Can I upgrade my plan later?",
    questionAr: "هل يمكنني ترقية خطتي لاحقًا؟",
    answerEn: "Absolutely! You can upgrade or adjust your plan at any time. We make transitions seamless so you never experience downtime or disruption.",
    answerAr: "بالتأكيد! يمكنك ترقية أو تعديل خطتك في أي وقت. نجعل الانتقال سلسًا حتى لا تواجه أي توقف أو انقطاع.",
    category: "pricing",
  },
  {
    id: "faq-6",
    questionEn: "How do I get started?",
    questionAr: "كيف أبدأ؟",
    answerEn: "Simply reach out through our contact form or schedule a free consultation. We'll discuss your goals, provide a proposal, and begin bringing your vision to life.",
    answerAr: "ما عليك سوى التواصل من خلال نموذج الاتصال أو حجز استشارة مجانية. سنناقش أهدافك ونقدم عرضًا ونبدأ في تحويل رؤيتك إلى واقع.",
    category: "general",
  },
];

export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: "plan-1",
    nameEn: "Basic",
    nameAr: "أساسي",
    priceMonthly: "$29",
    priceYearly: "$290",
    descriptionEn: "Perfect for small businesses and startups getting started online.",
    descriptionAr: "مثالي للشركات الصغيرة والناشئة التي تبدأ حضورها الرقمي.",
    featuresEn: ["5 Pages Website", "Basic SEO Setup", "Mobile Responsive", "Contact Form"],
    featuresAr: ["موقع 5 صفحات", "إعداد SEO أساسي", "متجاوب مع الجوال", "نموذج تواصل"],
    popular: false,
    ctaEn: "Get Started",
    ctaAr: "ابدأ الآن",
  },
  {
    id: "plan-2",
    nameEn: "Pro",
    nameAr: "احترافي",
    priceMonthly: "$79",
    priceYearly: "$790",
    descriptionEn: "Ideal for growing businesses that need advanced features and support.",
    descriptionAr: "مثالي للشركات النامية التي تحتاج ميزات متقدمة ودعم.",
    featuresEn: ["15 Pages Website", "Advanced SEO", "CMS Integration", "Analytics Dashboard", "Priority Support"],
    featuresAr: ["موقع 15 صفحة", "SEO متقدم", "نظام إدارة محتوى", "لوحة تحليلات", "دعم ذو أولوية"],
    popular: true,
    ctaEn: "Go Pro",
    ctaAr: "انتقل للاحترافي",
  },
  {
    id: "plan-3",
    nameEn: "Enterprise",
    nameAr: "مؤسسات",
    priceMonthly: "$199",
    priceYearly: "$1,990",
    descriptionEn: "Full-scale solution for large organizations with custom requirements.",
    descriptionAr: "حل شامل للمؤسسات الكبيرة ذات المتطلبات المخصصة.",
    featuresEn: ["Unlimited Pages", "Custom Development", "Dedicated Account Manager", "24/7 Support", "Performance Optimization", "Security Audit"],
    featuresAr: ["صفحات غير محدودة", "تطوير مخصص", "مدير حساب مخصص", "دعم على مدار الساعة", "تحسين الأداء", "تدقيق أمني"],
    popular: false,
    ctaEn: "Contact Sales",
    ctaAr: "تواصل مع المبيعات",
  },
];

export const DEFAULT_STAT_ITEMS: StatItem[] = [
  { id: "stat-1", value: "500+", labelEn: "Clients Served", labelAr: "عميل تمت خدمتهم", icon: "users" },
  { id: "stat-2", value: "15+", labelEn: "Years Experience", labelAr: "سنوات خبرة", icon: "calendar" },
  { id: "stat-3", value: "50+", labelEn: "Awards Won", labelAr: "جائزة محققة", icon: "trophy" },
  { id: "stat-4", value: "12", labelEn: "Countries", labelAr: "دولة", icon: "globe" },
];

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: "twitter", url: "https://twitter.com", visible: true },
  { platform: "linkedin", url: "https://linkedin.com", visible: true },
  { platform: "github", url: "https://github.com", visible: true },
  { platform: "instagram", url: "https://instagram.com", visible: true },
];

export const DEFAULT_FOOTER_CONTENT: FooterContent = {
  descriptionEn: "We craft exceptional digital experiences that help businesses grow and thrive in the modern world.",
  descriptionAr: "نصنع تجارب رقمية استثنائية تساعد الشركات على النمو والازدهار في العالم الحديث.",
  copyrightEn: "All rights reserved.",
  copyrightAr: "جميع الحقوق محفوظة.",
  socialLinks: DEFAULT_SOCIAL_LINKS,
};

export const DEFAULT_CONFIG: SiteConfig = {
  pages: ALL_PAGES,
  hero: DEFAULT_HERO,
  footerVariant: "default",
  navbar: DEFAULT_NAVBAR,
  logoCloud: DEFAULT_LOGO_CLOUD,
  features: DEFAULT_FEATURES,
  services: DEFAULT_SERVICES,
  stats: DEFAULT_STATS,
  testimonials: DEFAULT_TESTIMONIALS,
  cta: DEFAULT_CTA,
  process: DEFAULT_PROCESS,
  pagesContent: DEFAULT_PAGES_CONTENT,
  teamMembers: DEFAULT_TEAM_MEMBERS,
  testimonialItems: DEFAULT_TESTIMONIALS_ITEMS,
  faqItems: DEFAULT_FAQ_ITEMS,
  pricingPlans: DEFAULT_PRICING_PLANS,
  statItems: DEFAULT_STAT_ITEMS,
  footerContent: DEFAULT_FOOTER_CONTENT,
};

export const STORAGE_KEY = "site-config-v12";
