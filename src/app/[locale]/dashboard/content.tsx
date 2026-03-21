"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Navigation,
  PanelTop,
  Cloud,
  Layers,
  Briefcase,
  BarChart3,
  MessageCircle,
  Megaphone,
  GitBranch,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Footprints,
  LayoutDashboard,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Home,
} from "lucide-react";
import type { FooterVariant, HeroVariant } from "@/lib/site-config";

/* ═══════════════════════════════════════════════════════════════
   SHARED
   ═══════════════════════════════════════════════════════════════ */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}>
      <h3 className="text-[13px] font-bold tracking-tight pb-3" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>{title}</h3>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl cursor-pointer"
      style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)", transition: "all 0.3s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.25)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.02)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; e.currentTarget.style.background = "transparent"; }}
    >
      <span className="text-[12px] font-medium">{label}</span>
      {checked ? <ToggleRight className="h-5 w-5" style={{ color: "var(--color-primary)" }} /> : <ToggleLeft className="h-5 w-5" style={{ opacity: 0.3 }} />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION LINK CARD
   ═══════════════════════════════════════════════════════════════ */

function SectionLink({ href, icon: Icon, title, subtitle, preview, delay }: {
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
  preview?: React.ReactNode;
  delay?: number;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay ?? 0, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className="group block rounded-2xl overflow-hidden cursor-pointer"
        style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)", transition: "all 0.35s ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(var(--color-primary-rgb) / 0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        {/* Preview area */}
        {preview && (
          <div className="px-5 pt-5 pb-3">
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.06)", background: "rgba(var(--color-primary-rgb) / 0.02)" }}>
              {preview}
            </div>
          </div>
        )}

        {/* Info bar */}
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
            <Icon className="h-4.5 w-4.5" style={{ color: "var(--color-primary)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold tracking-tight">{title}</div>
            <div className="text-[11px] font-medium mt-0.5" style={{ opacity: 0.4 }}>{subtitle}</div>
          </div>
          <Chevron className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" style={{ color: "var(--color-primary)", opacity: 0.4 }} />
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MINI PREVIEWS
   ═══════════════════════════════════════════════════════════════ */

function NavbarMiniPreview() {
  const { config } = useSiteConfig();
  const nav = config.navbar;
  return (
    <div className="h-[44px] flex items-center justify-between px-4" style={{ background: "rgba(var(--color-primary-rgb) / 0.02)" }}>
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-[8px] font-bold" style={{ background: "var(--color-primary)" }}>T</div>
        <span className="text-[10px] font-bold">Template</span>
      </div>
      <div className="flex items-center gap-1">
        {["Home", "About", "Services"].map((p, i) => (
          <div key={p} className="px-2 py-1 rounded-full text-[8px] font-semibold" style={{ background: i === 0 ? "var(--color-primary)" : "transparent", color: i === 0 ? "white" : undefined }}>
            {p}
          </div>
        ))}
      </div>
      <div className="h-5 px-2.5 rounded-md flex items-center text-[8px] font-semibold text-white" style={{ background: "var(--color-primary)" }}>
        CTA
      </div>
    </div>
  );
}

function HeroMiniPreview() {
  const { config } = useSiteConfig();
  const hero = config.hero;
  const locale = useLocale();
  const isAr = locale === "ar";
  const c = hero.content;
  return (
    <div className="p-4 flex gap-4 items-center" style={{ minHeight: "90px" }}>
      <div className="flex-1 min-w-0">
        <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[7px] font-semibold mb-1.5" style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", color: "var(--color-primary)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)" }}>
          <Sparkles className="h-1.5 w-1.5" />
          {isAr ? c.badgeAr.slice(0, 20) : c.badgeEn.slice(0, 20)}
        </div>
        <div className="text-[11px] font-bold leading-tight mb-1">
          {isAr ? c.titleAr : c.titleEn}{" "}
          <span style={{ color: "var(--color-primary)" }}>{isAr ? c.highlightAr : c.highlightEn}</span>
        </div>
        <div className="h-1.5 w-16 rounded-full mb-2" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
        <div className="flex gap-1.5">
          <div className="h-4 px-2 rounded-md flex items-center text-[7px] font-semibold text-white" style={{ background: "var(--color-primary)" }}>
            {isAr ? c.ctaAr.slice(0, 12) : c.ctaEn.slice(0, 12)}
          </div>
          {hero.showSecondaryCta && (
            <div className="h-4 px-2 rounded-md flex items-center text-[7px] font-semibold" style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.15)", color: "var(--color-primary)" }}>
              {isAr ? c.secondaryCtaAr.slice(0, 12) : c.secondaryCtaEn.slice(0, 12)}
            </div>
          )}
        </div>
      </div>
      {hero.showImage && hero.variant !== "minimal" && (
        <div className="w-[80px] h-[60px] rounded-lg shrink-0 relative overflow-hidden" style={{ background: "rgba(var(--color-primary-rgb) / 0.04)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
          <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(var(--color-primary-rgb)/0.06), transparent)" }} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD HUB
   ═══════════════════════════════════════════════════════════════ */

export function DashboardContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowRight : ArrowLeft;

  const { config, updateConfig, updatePage, resetConfig } = useSiteConfig();

  const footerOptions: { value: FooterVariant; labelEn: string; labelAr: string }[] = [
    { value: "default", labelEn: "Default", labelAr: "افتراضي" },
    { value: "standard", labelEn: "Standard", labelAr: "قياسي" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط" },
    { value: "centered", labelEn: "Centered", labelAr: "مركزي" },
  ];

  const navPages = config.pages.filter((p) => p.key !== "dashboard");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 px-4 sm:px-6" style={{ background: "var(--color-background)", borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
        <div className="max-w-6xl mx-auto h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-1.5 rounded-lg cursor-pointer"
            style={{ color: "var(--color-primary)", border: "1px solid rgba(var(--color-primary-rgb) / 0.15)", transition: "all 0.3s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-primary)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--color-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)"; }}
          >
            <Arrow className="h-3 w-3" />
            {isAr ? "الرئيسية" : "Home"}
          </Link>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <h1 className="text-[15px] font-bold tracking-tight">{isAr ? "لوحة التحكم" : "Dashboard"}</h1>
          </div>
          <button
            onClick={resetConfig}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg cursor-pointer"
            style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.12)", transition: "all 0.3s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.3)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.12)"; e.currentTarget.style.background = "transparent"; }}
          >
            <RotateCcw className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
            {isAr ? "إعادة تعيين الكل" : "Reset All"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ═══ WELCOME HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.06), rgba(var(--color-primary-rgb) / 0.02))", border: "2px solid rgba(var(--color-primary-rgb) / 0.08)" }}
        >
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                {isAr ? "مركز التحكم" : "Control Center"}
              </span>
            </div>
            <h2 className="text-[20px] font-bold tracking-tight mb-1">
              {isAr ? "تخصيص موقعك بالكامل" : "Customize Your Entire Site"}
            </h2>
            <p className="text-[13px] leading-relaxed max-w-lg" style={{ opacity: 0.5 }}>
              {isAr
                ? "تحكم في كل جزء من موقعك — شريط التنقل، قسم الهيرو، التذييل، الصفحات والمزيد. جميع التغييرات تُطبق مباشرة."
                : "Control every part of your site — navbar, hero section, footer, pages & more. All changes apply instantly."}
            </p>
          </div>
        </motion.div>

        {/* ═══ SECTION CARDS ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionLink
            href="/dashboard/navbar"
            icon={Navigation}
            title={isAr ? "شريط التنقل" : "Navbar"}
            subtitle={isAr ? "6 أنماط • تأثيرات • أزرار • لون السمة" : "6 variants • hover effects • buttons • theme panel"}
            preview={<NavbarMiniPreview />}
            delay={0.05}
          />
          <SectionLink
            href="/dashboard/hero"
            icon={PanelTop}
            title={isAr ? "قسم الهيرو" : "Hero Section"}
            subtitle={isAr ? "4 تصاميم • حركات • محتوى • صورة" : "4 layouts • animations • content • image styles"}
            preview={<HeroMiniPreview />}
            delay={0.1}
          />
          <SectionLink
            href="/dashboard/logo-cloud"
            icon={Cloud}
            title={isAr ? "شعارات الشركاء" : "Logo Cloud"}
            subtitle={isAr ? "شعارات • سرعة • عنوان" : "Logos • speed • heading"}
            delay={0.15}
          />
          <SectionLink
            href="/dashboard/features"
            icon={Layers}
            title={isAr ? "المميزات" : "Features"}
            subtitle={isAr ? "عناوين • تقييمات • شارات • اقتباسات" : "Titles • ratings • badges • quotes"}
            delay={0.2}
          />
          <SectionLink
            href="/dashboard/services"
            icon={Briefcase}
            title={isAr ? "الخدمات" : "Services"}
            subtitle={isAr ? "عناوين • فئات • مميزات • صور" : "Titles • categories • features • images"}
            delay={0.25}
          />
          <SectionLink
            href="/dashboard/stats"
            icon={BarChart3}
            title={isAr ? "الإحصائيات" : "Stats"}
            subtitle={isAr ? "تشغيل تلقائي • سرعة" : "Auto-play • interval"}
            delay={0.3}
          />
          <SectionLink
            href="/dashboard/testimonials"
            icon={MessageCircle}
            title={isAr ? "آراء العملاء" : "Testimonials"}
            subtitle={isAr ? "عناوين • تشغيل تلقائي • معاينة جانبية" : "Titles • auto-play • side previews"}
            delay={0.35}
          />
          <SectionLink
            href="/dashboard/cta"
            icon={Megaphone}
            title={isAr ? "دعوة للعمل" : "Call to Action"}
            subtitle={isAr ? "محتوى • عداد تنازلي • شارة" : "Content • countdown • badge"}
            delay={0.4}
          />
          <SectionLink
            href="/dashboard/process"
            icon={GitBranch}
            title={isAr ? "مراحل العمل" : "Process"}
            subtitle={isAr ? "عناوين • تفاصيل • روابط" : "Titles • details • connectors"}
            delay={0.45}
          />
        </div>

        {/* ═══ FOOTER VARIANT ═══ */}
        <SectionCard title={isAr ? "نمط التذييل" : "Footer Variant"}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {footerOptions.map((opt) => {
              const active = config.footerVariant === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateConfig({ footerVariant: opt.value })}
                  className="relative py-2.5 px-3 rounded-lg text-start cursor-pointer"
                  style={{
                    border: active ? "1.5px solid var(--color-primary)" : "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
                    background: active ? "rgba(var(--color-primary-rgb) / 0.06)" : "transparent",
                    color: active ? "var(--color-primary)" : "inherit",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.3)"; e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.03)"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)"; e.currentTarget.style.background = "transparent"; } }}
                >
                  <div className="text-[12px] font-medium">{isAr ? opt.labelAr : opt.labelEn}</div>
                  {active && <div className="absolute top-1 right-1.5 rtl:right-auto rtl:left-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-primary)" }} />}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ═══ PAGE MANAGEMENT ═══ */}
        <SectionCard title={isAr ? "إدارة الصفحات" : "Page Management"}>
          <div className="space-y-1.5">
            {navPages.map((page) => (
              <div key={page.key} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: page.visible ? "rgba(var(--color-primary-rgb) / 0.08)" : "rgba(var(--color-primary-rgb) / 0.02)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
                    {page.visible ? <Eye className="h-3 w-3" style={{ color: "var(--color-primary)" }} /> : <EyeOff className="h-3 w-3" style={{ opacity: 0.25 }} />}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold">{isAr ? page.labelAr : page.labelEn}</div>
                    <div className="text-[10px]" style={{ opacity: 0.35 }}>{page.href}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updatePage(page.key, { inNavbar: !page.inNavbar })}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-md cursor-pointer"
                    style={{
                      border: page.inNavbar ? "1px solid var(--color-primary)" : "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                      color: page.inNavbar ? "var(--color-primary)" : "inherit",
                      background: page.inNavbar ? "rgba(var(--color-primary-rgb) / 0.06)" : "transparent",
                      opacity: page.inNavbar ? 1 : 0.5,
                      transition: "all 0.25s ease",
                    }}
                  >
                    {page.inNavbar ? (isAr ? "في التنقل" : "In Navbar") : (isAr ? "مخفي من التنقل" : "Hidden from Nav")}
                  </button>
                  <button
                    onClick={() => updatePage(page.key, { visible: !page.visible })}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-md cursor-pointer"
                    style={{
                      border: page.visible ? "1px solid rgba(var(--color-primary-rgb) / 0.15)" : "1px solid rgba(var(--color-primary-rgb) / 0.12)",
                      color: page.visible ? "inherit" : "inherit",
                      background: page.visible ? "transparent" : "rgba(255,0,0,0.04)",
                      opacity: page.visible ? 0.6 : 0.5,
                      transition: "all 0.25s ease",
                    }}
                  >
                    {page.visible ? (isAr ? "مرئي" : "Visible") : (isAr ? "مخفي" : "Hidden")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Info */}
        <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.08)", background: "rgba(var(--color-primary-rgb) / 0.02)" }}>
          <Home className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
          <p className="text-[11px] leading-relaxed" style={{ opacity: 0.5 }}>
            {isAr
              ? "جميع التغييرات تُحفظ تلقائياً وتُطبق مباشرة. عد للصفحة الرئيسية لرؤية النتيجة الكاملة. استخدم \"إعادة تعيين الكل\" للعودة للإعدادات الافتراضية."
              : "All changes save automatically and apply instantly. Go back to homepage to see the full result. Use \"Reset All\" to restore defaults."}
          </p>
        </div>
      </div>
    </div>
  );
}
