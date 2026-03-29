"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useSiteConfig } from "@/providers/site-config-provider";
import {
  LayoutDashboard,
  Navigation,
  PanelTop,
  Cloud,
  Layers,
  Briefcase,
  BarChart3,
  MessageCircle,
  Megaphone,
  GitBranch,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Menu,
  X,
  Info,
  FolderOpen,
  Phone,
  Users,
  DollarSign,
  HelpCircle,
  Star,
  GraduationCap,
  BookOpen,
  Image as ImageIcon,
  Palette,
  Footprints,
  Download,
  Upload,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface NavGroup {
  labelEn: string;
  labelAr: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  labelEn: string;
  labelAr: string;
}

const navGroups: NavGroup[] = [
  {
    labelEn: "Global",
    labelAr: "عام",
    items: [
      { href: "/dashboard/navbar", icon: Navigation, labelEn: "Navbar", labelAr: "شريط التنقل" },
      { href: "/dashboard/footer-editor", icon: Footprints, labelEn: "Footer", labelAr: "التذييل" },
    ],
  },
  {
    labelEn: "Homepage",
    labelAr: "الصفحة الرئيسية",
    items: [
      { href: "/dashboard/hero", icon: PanelTop, labelEn: "Hero Section", labelAr: "قسم الهيرو" },
      { href: "/dashboard/logo-cloud", icon: Cloud, labelEn: "Logo Cloud", labelAr: "شعارات الشركاء" },
      { href: "/dashboard/features", icon: Layers, labelEn: "Features", labelAr: "المميزات" },
      { href: "/dashboard/services", icon: Briefcase, labelEn: "Services", labelAr: "الخدمات" },
      { href: "/dashboard/stats", icon: BarChart3, labelEn: "Stats", labelAr: "الإحصائيات" },
      { href: "/dashboard/stats-editor", icon: BarChart3, labelEn: "Edit Stats Data", labelAr: "تعديل بيانات الإحصائيات" },
      { href: "/dashboard/testimonials", icon: MessageCircle, labelEn: "Testimonials", labelAr: "آراء العملاء" },
      { href: "/dashboard/cta", icon: Megaphone, labelEn: "Call to Action", labelAr: "دعوة للعمل" },
      { href: "/dashboard/process", icon: GitBranch, labelEn: "Process", labelAr: "مراحل العمل" },
    ],
  },
  {
    labelEn: "About",
    labelAr: "عن الشركة",
    items: [
      { href: "/dashboard/pages/about", icon: Info, labelEn: "Sections", labelAr: "الأقسام" },
    ],
  },
  {
    labelEn: "Services",
    labelAr: "الخدمات",
    items: [
      { href: "/dashboard/pages/services", icon: Briefcase, labelEn: "Sections", labelAr: "الأقسام" },
    ],
  },
  {
    labelEn: "Portfolio",
    labelAr: "الأعمال",
    items: [
      { href: "/dashboard/pages/portfolio", icon: FolderOpen, labelEn: "Sections", labelAr: "الأقسام" },
    ],
  },
  {
    labelEn: "Team",
    labelAr: "الفريق",
    items: [
      { href: "/dashboard/pages/team", icon: Users, labelEn: "Sections", labelAr: "الأقسام" },
      { href: "/dashboard/team-editor", icon: Users, labelEn: "Edit Members", labelAr: "تعديل الأعضاء" },
    ],
  },
  {
    labelEn: "Pricing",
    labelAr: "الأسعار",
    items: [
      { href: "/dashboard/pages/pricing", icon: DollarSign, labelEn: "Sections", labelAr: "الأقسام" },
      { href: "/dashboard/pricing-editor", icon: DollarSign, labelEn: "Edit Plans", labelAr: "تعديل الخطط" },
    ],
  },
  {
    labelEn: "FAQ",
    labelAr: "الأسئلة الشائعة",
    items: [
      { href: "/dashboard/pages/faq", icon: HelpCircle, labelEn: "Sections", labelAr: "الأقسام" },
      { href: "/dashboard/faq-editor", icon: HelpCircle, labelEn: "Edit Items", labelAr: "تعديل الأسئلة" },
    ],
  },
  {
    labelEn: "Testimonials",
    labelAr: "آراء العملاء",
    items: [
      { href: "/dashboard/pages/testimonials", icon: Star, labelEn: "Sections", labelAr: "الأقسام" },
      { href: "/dashboard/testimonials-editor", icon: Star, labelEn: "Edit Reviews", labelAr: "تعديل الآراء" },
    ],
  },
  {
    labelEn: "Careers",
    labelAr: "الوظائف",
    items: [
      { href: "/dashboard/pages/careers", icon: GraduationCap, labelEn: "Sections", labelAr: "الأقسام" },
    ],
  },
  {
    labelEn: "Blog",
    labelAr: "المدونة",
    items: [
      { href: "/dashboard/pages/blog", icon: BookOpen, labelEn: "Sections", labelAr: "الأقسام" },
    ],
  },
  {
    labelEn: "Contact",
    labelAr: "اتصل بنا",
    items: [
      { href: "/dashboard/pages/contact", icon: Phone, labelEn: "Sections", labelAr: "الأقسام" },
    ],
  },
  {
    labelEn: "Gallery",
    labelAr: "المعرض",
    items: [
      { href: "/dashboard/pages/gallery", icon: ImageIcon, labelEn: "Sections", labelAr: "الأقسام" },
    ],
  },
  {
    labelEn: "Designer",
    labelAr: "المصمم",
    items: [
      { href: "/dashboard/pages/designer", icon: Palette, labelEn: "Sections", labelAr: "الأقسام" },
    ],
  },
];

/* ═══ Preview page mapping ═══ */
const previewPageMap: Record<string, string> = {
  "/dashboard": "/",
  "/dashboard/navbar": "/",
  "/dashboard/hero": "/",
  "/dashboard/logo-cloud": "/",
  "/dashboard/features": "/",
  "/dashboard/services": "/",
  "/dashboard/stats": "/",
  "/dashboard/testimonials": "/",
  "/dashboard/cta": "/",
  "/dashboard/process": "/",
  "/dashboard/pages/about": "/about",
  "/dashboard/pages/services": "/services",
  "/dashboard/pages/portfolio": "/portfolio",
  "/dashboard/pages/contact": "/contact",
  "/dashboard/pages/team": "/team",
  "/dashboard/pages/pricing": "/pricing",
  "/dashboard/pages/faq": "/faq",
  "/dashboard/pages/testimonials": "/testimonials",
  "/dashboard/pages/careers": "/careers",
  "/dashboard/pages/blog": "/blog",
  "/dashboard/pages/gallery": "/gallery",
  "/dashboard/pages/designer": "/designer",
  "/dashboard/team-editor": "/team",
  "/dashboard/testimonials-editor": "/testimonials",
  "/dashboard/faq-editor": "/faq",
  "/dashboard/pricing-editor": "/pricing",
  "/dashboard/stats-editor": "/",
  "/dashboard/footer-editor": "/",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const pathname = usePathname();
  const { config, resetConfig, exportConfig, importConfig } = useSiteConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => { initial[g.labelEn] = true; });
    return initial;
  });
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartH = useRef(0);

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Resize handlers
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartH.current = previewHeight;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientY - resizeStartY.current;
      setPreviewHeight(Math.max(200, Math.min(resizeStartH.current + delta, window.innerHeight - 150)));
    };
    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [previewHeight]);

  // Determine which page the preview iframe should show
  const previewPage = previewPageMap[pathname] ?? "/";
  const previewUrl = `/${locale}${previewPage === "/" ? "" : previewPage}`;

  // Reload iframe when config changes
  const configRef = useRef(config);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip the first render
    if (configRef.current === config) return;
    configRef.current = config;

    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    }, 600);

    return () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, [config]);

  const refreshPreview = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const deviceWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const BackArrow = isAr ? ChevronRight : ChevronLeft;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Back to website + header */}
      <div className="shrink-0" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
        {/* Back to website button */}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium cursor-pointer transition-all duration-200"
          style={{ background: "rgba(var(--color-primary-rgb) / 0.03)", color: "var(--color-primary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)"; }}
        >
          <BackArrow className="h-3 w-3" />
          {isAr ? "العودة للموقع" : "Back to Website"}
        </Link>

        {/* Dashboard title */}
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))" }}>
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold tracking-tight">{isAr ? "لوحة التحكم" : "Dashboard"}</div>
            <div className="text-[9px] font-medium" style={{ opacity: 0.35 }}>CMS</div>
          </div>
          {/* Mobile close */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)" }}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Overview link */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-all duration-200"
          style={{
            background: pathname === "/dashboard" ? "rgba(var(--color-primary-rgb) / 0.08)" : "transparent",
            color: pathname === "/dashboard" ? "var(--color-primary)" : "inherit",
          }}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          {isAr ? "نظرة عامة" : "Overview"}
        </Link>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navGroups.map((group) => {
          const groupKey = group.labelEn;
          const isCollapsed = collapsed[groupKey];
          const hasActive = group.items.some((item) => isActive(item.href));

          return (
            <div key={groupKey}>
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors duration-200"
                style={{ opacity: 0.4, color: hasActive ? "var(--color-primary)" : "inherit" }}
              >
                {isAr ? group.labelAr : group.labelEn}
                <ChevronDown
                  className="h-3 w-3 transition-transform duration-200"
                  style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0)" }}
                />
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="py-0.5 space-y-0.5">
                      {group.items.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className="group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-all duration-200"
                            style={{
                              background: active ? "rgba(var(--color-primary-rgb) / 0.08)" : "transparent",
                              color: active ? "var(--color-primary)" : "inherit",
                            }}
                            onMouseEnter={(e) => {
                              if (!active) {
                                e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)";
                                e.currentTarget.style.color = "var(--color-primary)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!active) {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "inherit";
                              }
                            }}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" style={{ opacity: active ? 1 : 0.5 }} />
                            <span className="flex-1 truncate">{isAr ? item.labelAr : item.labelEn}</span>
                            {active && (
                              <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--color-primary)" }} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Sidebar footer */}
      <div className="px-3 pb-3 pt-2 space-y-2 shrink-0" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
        <button
          onClick={resetConfig}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200"
          style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)"; }}
        >
          <RotateCcw className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
          {isAr ? "إعادة تعيين الكل" : "Reset All"}
        </button>

        <div className="flex gap-2">
          <button
            onClick={exportConfig}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200"
            style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)"; }}
          >
            <Download className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
            {isAr ? "تصدير" : "Export"}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200"
            style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.08)"; }}
          >
            <Upload className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
            {isAr ? "استيراد" : "Import"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  await importConfig(file);
                } catch {
                  alert(isAr ? "ملف غير صالح" : "Invalid config file");
                }
                e.target.value = "";
              }
            }}
          />
        </div>

      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-background)" }}>

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside
        className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden"
        style={{
          width: "260px",
          background: "var(--color-card)",
          borderInlineEnd: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: isAr ? 280 : -280 }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? 280 : -280 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 bottom-0 z-50 w-[260px] flex flex-col lg:hidden"
              style={{
                [isAr ? "right" : "left"]: 0,
                background: "var(--color-card)",
              }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT + PREVIEW ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0"
          style={{
            background: "rgba(var(--color-background-rgb, 255 255 255) / 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
          }}
        >
          {/* Left: mobile menu + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.1)" }}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="text-[12px] font-medium" style={{ opacity: 0.4 }}>
              {getBreadcrumb(pathname, isAr)}
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1.5">
            {/* Preview toggle */}
            <button
              onClick={() => setPreviewOpen(!previewOpen)}
              className="hidden md:flex h-8 items-center gap-1.5 px-3 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200"
              style={{
                border: previewOpen ? "1.5px solid var(--color-primary)" : "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
                background: previewOpen ? "rgba(var(--color-primary-rgb) / 0.06)" : "transparent",
                color: previewOpen ? "var(--color-primary)" : "inherit",
              }}
            >
              <Monitor className="h-3.5 w-3.5" />
              {isAr ? "معاينة" : "Preview"}
            </button>

            <div className="h-5 w-px mx-1 hidden md:block" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }} />

            <ThemeSwitcher />
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        {/* ═══ LIVE PREVIEW PANEL (TOP, FULL WIDTH) ═══ */}
        <AnimatePresence>
          {previewOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: previewHeight, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={isResizing ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:flex flex-col shrink-0 overflow-hidden relative z-10"
              style={{
                borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)",
              }}
            >
              {/* Preview toolbar */}
              <div
                className="h-10 flex items-center justify-between px-4 shrink-0"
                style={{
                  background: "var(--color-card)",
                  borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                }}
              >
                {/* Left: label + device selector */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Monitor className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                    <span className="text-[11px] font-bold" style={{ color: "var(--color-primary)" }}>
                      {isAr ? "معاينة مباشرة" : "Live Preview"}
                    </span>
                  </div>

                  <div className="h-4 w-px" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />

                  <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: "rgba(var(--color-primary-rgb) / 0.04)" }}>
                    {([
                      { key: "desktop" as const, icon: Monitor, label: isAr ? "سطح المكتب" : "Desktop" },
                      { key: "tablet" as const, icon: Tablet, label: isAr ? "جهاز لوحي" : "Tablet" },
                      { key: "mobile" as const, icon: Smartphone, label: isAr ? "هاتف" : "Mobile" },
                    ]).map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        onClick={() => setPreviewDevice(key)}
                        className="h-6 px-2.5 rounded-md flex items-center gap-1.5 cursor-pointer transition-all duration-200 text-[10px] font-medium"
                        style={{
                          background: previewDevice === key ? "var(--color-primary)" : "transparent",
                          color: previewDevice === key ? "white" : "inherit",
                          opacity: previewDevice === key ? 1 : 0.5,
                        }}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="hidden lg:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Center: URL bar */}
                <div
                  className="flex items-center gap-2 px-3 py-1 rounded-lg mx-4 max-w-[300px] flex-1"
                  style={{ background: "rgba(var(--color-primary-rgb) / 0.03)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}
                >
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: "#22c55e" }} />
                  <span className="text-[10px] font-mono truncate" style={{ opacity: 0.5 }}>{previewUrl}</span>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={refreshPreview}
                    className="h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200"
                    style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <RefreshCw className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                  </button>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200"
                    style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <ExternalLink className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                  </a>
                </div>
              </div>

              {/* iframe container */}
              <div
                className="flex-1 flex items-start justify-center overflow-hidden p-2"
                style={{ background: "rgba(var(--color-primary-rgb) / 0.02)" }}
              >
                <div
                  className="h-full rounded-xl overflow-hidden transition-all duration-500 ease-out mx-auto"
                  style={{
                    width: deviceWidths[previewDevice],
                    maxWidth: "100%",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    boxShadow: "0 4px 24px rgba(var(--color-foreground-rgb, 0 0 0) / 0.06)",
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    key={iframeKey}
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="Live Preview"
                    style={{ background: "var(--color-background)" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resize handle */}
        {previewOpen && (
          <div
            className="hidden md:flex items-center justify-center shrink-0 cursor-ns-resize group"
            style={{ height: "10px", background: "transparent", userSelect: "none" }}
            onMouseDown={onResizeStart}
          >
            <div
              className="w-12 h-1 rounded-full transition-all duration-200 group-hover:w-20 group-hover:h-1.5"
              style={{
                background: isResizing ? "var(--color-primary)" : "rgba(var(--color-primary-rgb) / 0.15)",
              }}
            />
          </div>
        )}

        {/* Pointer overlay while resizing to prevent iframe stealing mouse events */}
        {isResizing && (
          <div className="fixed inset-0 z-[9998] cursor-ns-resize" style={{ background: "transparent" }} />
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function getBreadcrumb(pathname: string, isAr: boolean): string {
  if (pathname === "/dashboard") return isAr ? "نظرة عامة" : "Overview";
  const segments = pathname.replace("/dashboard/", "").split("/");
  const labels: Record<string, { en: string; ar: string }> = {
    navbar: { en: "Navbar", ar: "شريط التنقل" },
    hero: { en: "Hero", ar: "الهيرو" },
    "logo-cloud": { en: "Logo Cloud", ar: "الشعارات" },
    features: { en: "Features", ar: "المميزات" },
    services: { en: "Services", ar: "الخدمات" },
    stats: { en: "Stats", ar: "الإحصائيات" },
    testimonials: { en: "Testimonials", ar: "الآراء" },
    cta: { en: "CTA", ar: "الدعوة" },
    process: { en: "Process", ar: "المراحل" },
    pages: { en: "Pages", ar: "الصفحات" },
    about: { en: "About", ar: "عن الشركة" },
    portfolio: { en: "Portfolio", ar: "الأعمال" },
    contact: { en: "Contact", ar: "اتصل بنا" },
    team: { en: "Team", ar: "الفريق" },
    pricing: { en: "Pricing", ar: "الأسعار" },
    faq: { en: "FAQ", ar: "الأسئلة" },
    careers: { en: "Careers", ar: "الوظائف" },
    blog: { en: "Blog", ar: "المدونة" },
    gallery: { en: "Gallery", ar: "المعرض" },
    designer: { en: "Designer", ar: "المصمم" },
    "team-editor": { en: "Team Members", ar: "أعضاء الفريق" },
    "testimonials-editor": { en: "Testimonials", ar: "آراء العملاء" },
    "faq-editor": { en: "FAQ Items", ar: "الأسئلة الشائعة" },
    "pricing-editor": { en: "Pricing Plans", ar: "خطط الأسعار" },
    "stats-editor": { en: "Statistics", ar: "الإحصائيات" },
    "footer-editor": { en: "Footer Content", ar: "محتوى التذييل" },
  };
  return segments
    .map((s) => labels[s] ? (isAr ? labels[s].ar : labels[s].en) : s)
    .join(isAr ? " ← " : " → ");
}
