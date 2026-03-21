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
};

export const STORAGE_KEY = "site-config-v10";
