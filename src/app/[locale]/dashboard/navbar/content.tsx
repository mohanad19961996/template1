"use client";

import { useLocale } from "next-intl";
import { useSiteConfig } from "@/providers/site-config-provider";
import {
  Eye,
  EyeOff,
  Paintbrush,
  MousePointer,
  Sparkles,
  RectangleHorizontal,
  ToggleLeft,
  ToggleRight,
  Layers,
  Circle,
  Ruler,
  CloudFog,
  Palette,
  SunMoon,
  Languages,
} from "lucide-react";
import type {
  NavbarVariant,
  NavbarHover,
  NavbarAnimation,
  CtaStyle,
  NavbarNavStyle,
  NavbarLogoShape,
  NavbarHeight,
  NavbarShadow,
  DarkModeStyle,
  LangSwitcherStyle,
  ThemePanelStyle,
} from "@/lib/site-config";

/* ═══════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

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

function OptionGroup<T extends string>({ label, icon: Icon, options, value, onChange, columns = 2 }: {
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  options: { value: T; labelEn: string; labelAr: string; descEn?: string; descAr?: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: number;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5" style={{ color: "var(--color-primary)" }} />
        <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ opacity: 0.5 }}>{label}</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="relative py-2 px-3 rounded-lg text-start cursor-pointer"
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
              {opt.descEn && <div className="text-[9px] mt-0.5" style={{ opacity: 0.4 }}>{isAr ? opt.descAr : opt.descEn}</div>}
              {active && <div className="absolute top-1 right-1.5 rtl:right-auto rtl:left-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-primary)" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ border: "2px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}>
      <h3 className="text-[13px] font-bold tracking-tight pb-3" style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>{title}</h3>
      {children}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export function NavbarDashboard() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { config, updateNavbar, updatePage } = useSiteConfig();
  const nav = config.navbar;

  const variantOptions: { value: NavbarVariant; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "glass", labelEn: "Glass", labelAr: "زجاجي", descEn: "Blur + transparency", descAr: "ضبابي + شفاف" },
    { value: "solid", labelEn: "Solid", labelAr: "صلب", descEn: "Opaque background", descAr: "خلفية صلبة" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "Clean & subtle", descAr: "نظيف ومتواضع" },
    { value: "floating", labelEn: "Floating", labelAr: "عائم", descEn: "Detached with border", descAr: "منفصل مع حدود" },
    { value: "gradient", labelEn: "Gradient", labelAr: "تدرج", descEn: "Color gradient flow", descAr: "تدفق لوني متدرج" },
    { value: "bordered", labelEn: "Bordered", labelAr: "محدد", descEn: "Strong bottom line", descAr: "خط سفلي قوي" },
  ];

  const hoverOptions: { value: NavbarHover; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "pill", labelEn: "Pill", labelAr: "كبسولة", descEn: "Filled pill indicator", descAr: "مؤشر كبسولة ممتلئ" },
    { value: "underline", labelEn: "Underline", labelAr: "خط سفلي", descEn: "Bottom line accent", descAr: "خط سفلي مميز" },
    { value: "glow", labelEn: "Glow", labelAr: "توهج", descEn: "Soft glow effect", descAr: "تأثير توهج ناعم" },
    { value: "scale", labelEn: "Scale", labelAr: "تكبير", descEn: "Border + scale up", descAr: "حدود + تكبير" },
    { value: "fill", labelEn: "Fill", labelAr: "تعبئة", descEn: "Solid color fill", descAr: "تعبئة لون صلب" },
    { value: "none", labelEn: "None", labelAr: "بدون", descEn: "No hover effect", descAr: "بدون تأثير" },
  ];

  const animationOptions: { value: NavbarAnimation; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "spring", labelEn: "Spring", labelAr: "نابض", descEn: "Bouncy spring physics", descAr: "فيزياء نابضية" },
    { value: "smooth", labelEn: "Smooth", labelAr: "سلس", descEn: "Eased transition", descAr: "انتقال سلس" },
    { value: "bounce", labelEn: "Bounce", labelAr: "ارتداد", descEn: "Elastic bounce", descAr: "ارتداد مرن" },
    { value: "none", labelEn: "None", labelAr: "بدون", descEn: "Instant, no animation", descAr: "فوري بدون حركة" },
  ];

  const ctaOptions: { value: CtaStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "filled", labelEn: "Filled", labelAr: "ممتلئ", descEn: "Solid gradient button", descAr: "زر متدرج صلب" },
    { value: "outlined", labelEn: "Outlined", labelAr: "محدد", descEn: "Border only button", descAr: "زر بحدود فقط" },
    { value: "gradient", labelEn: "Gradient", labelAr: "متدرج", descEn: "Animated gradient", descAr: "تدرج متحرك" },
    { value: "glow", labelEn: "Glow", labelAr: "توهج", descEn: "Neon glow button", descAr: "زر بتوهج نيون" },
    { value: "none", labelEn: "Hidden", labelAr: "مخفي", descEn: "No CTA button", descAr: "بدون زر" },
  ];

  const navStyleOptions: { value: NavbarNavStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "pill-container", labelEn: "Pill Container", labelAr: "حاوية كبسولة", descEn: "Links inside pill bg", descAr: "روابط داخل خلفية" },
    { value: "separate", labelEn: "Separate", labelAr: "منفصل", descEn: "Individual link items", descAr: "عناصر منفصلة" },
    { value: "underlined", labelEn: "Underlined", labelAr: "مسطر", descEn: "Bottom line container", descAr: "حاوية بخط سفلي" },
    { value: "plain", labelEn: "Plain", labelAr: "عادي", descEn: "No container style", descAr: "بدون حاوية" },
  ];

  const logoShapeOptions: { value: NavbarLogoShape; labelEn: string; labelAr: string }[] = [
    { value: "rounded", labelEn: "Rounded", labelAr: "مستدير" },
    { value: "circle", labelEn: "Circle", labelAr: "دائري" },
    { value: "square", labelEn: "Square", labelAr: "مربع" },
  ];

  const heightOptions: { value: NavbarHeight; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "sm", labelEn: "Small", labelAr: "صغير", descEn: "48px compact", descAr: "مضغوط 48px" },
    { value: "md", labelEn: "Medium", labelAr: "متوسط", descEn: "64px default", descAr: "افتراضي 64px" },
    { value: "lg", labelEn: "Large", labelAr: "كبير", descEn: "80px spacious", descAr: "واسع 80px" },
  ];

  const shadowOptions: { value: NavbarShadow; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "none", labelEn: "None", labelAr: "بدون", descEn: "No shadow", descAr: "بدون ظل" },
    { value: "sm", labelEn: "Subtle", labelAr: "خفيف", descEn: "Light drop shadow", descAr: "ظل خفيف" },
    { value: "lg", labelEn: "Strong", labelAr: "قوي", descEn: "Heavy drop shadow", descAr: "ظل كثيف" },
  ];

  const darkModeOptions: { value: DarkModeStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "icon", labelEn: "Icon", labelAr: "أيقونة", descEn: "Bordered icon button", descAr: "زر أيقونة بحدود" },
    { value: "icon-label", labelEn: "Icon + Label", labelAr: "أيقونة + نص", descEn: "Icon with text label", descAr: "أيقونة مع نص" },
    { value: "pill-switch", labelEn: "Pill Switch", labelAr: "مفتاح كبسولة", descEn: "Sliding toggle pill", descAr: "مفتاح منزلق" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "No border, icon only", descAr: "بدون حدود" },
  ];

  const langSwitcherOptions: { value: LangSwitcherStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "text", labelEn: "Text", labelAr: "نص", descEn: "Bordered text button", descAr: "زر نص بحدود" },
    { value: "icon-text", labelEn: "Icon + Text", labelAr: "أيقونة + نص", descEn: "Globe icon with text", descAr: "أيقونة كرة مع نص" },
    { value: "badge", labelEn: "Badge", labelAr: "شارة", descEn: "Pill badge style", descAr: "نمط شارة" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "No border, text only", descAr: "بدون حدود" },
  ];

  const themePanelOptions: { value: ThemePanelStyle; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    { value: "dropdown", labelEn: "Dropdown", labelAr: "قائمة منسدلة", descEn: "Swatch + label + menu", descAr: "لون + نص + قائمة" },
    { value: "dots-inline", labelEn: "Dots Inline", labelAr: "نقاط مدمجة", descEn: "Color dots in navbar", descAr: "نقاط ألوان في الشريط" },
    { value: "swatch-only", labelEn: "Swatch Only", labelAr: "لون فقط", descEn: "Dot button + dropdown", descAr: "زر لون + قائمة" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط", descEn: "Small dot, no border", descAr: "نقطة صغيرة بدون حدود" },
  ];

  const navPages = config.pages.filter((p) => p.key !== "dashboard");

  return (
    <div className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title={isAr ? "نمط شريط التنقل" : "Navbar Variant"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={Paintbrush} options={variantOptions} value={nav.variant} onChange={(v) => updateNavbar({ variant: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "حاوية الروابط" : "Links Container"}>
            <OptionGroup label={isAr ? "نمط الحاوية" : "Nav Style"} icon={Layers} options={navStyleOptions} value={nav.navStyle} onChange={(v) => updateNavbar({ navStyle: v })} columns={2} />
          </SectionCard>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title={isAr ? "تأثير التحويم" : "Hover Effect"}>
            <OptionGroup label={isAr ? "التأثير" : "Effect"} icon={MousePointer} options={hoverOptions} value={nav.hover} onChange={(v) => updateNavbar({ hover: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "الحركة والانتقال" : "Animation"}>
            <OptionGroup label={isAr ? "نوع الحركة" : "Type"} icon={Sparkles} options={animationOptions} value={nav.animation} onChange={(v) => updateNavbar({ animation: v })} columns={2} />
          </SectionCard>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SectionCard title={isAr ? "زر الإجراء (CTA)" : "CTA Button"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={RectangleHorizontal} options={ctaOptions} value={nav.ctaStyle} onChange={(v) => updateNavbar({ ctaStyle: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "الأبعاد والشكل" : "Size & Shape"}>
            <OptionGroup label={isAr ? "ارتفاع الشريط" : "Navbar Height"} icon={Ruler} options={heightOptions} value={nav.height} onChange={(v) => updateNavbar({ height: v })} columns={3} />
            <OptionGroup label={isAr ? "شكل الشعار" : "Logo Shape"} icon={Circle} options={logoShapeOptions} value={nav.logoShape} onChange={(v) => updateNavbar({ logoShape: v })} columns={3} />
            <OptionGroup label={isAr ? "الظل عند التمرير" : "Scroll Shadow"} icon={CloudFog} options={shadowOptions} value={nav.shadow} onChange={(v) => updateNavbar({ shadow: v })} columns={3} />
          </SectionCard>
        </div>

        {/* Row 4: Button Styles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SectionCard title={isAr ? "زر الوضع الداكن" : "Dark Mode Button"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={SunMoon} options={darkModeOptions} value={nav.darkModeStyle} onChange={(v) => updateNavbar({ darkModeStyle: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "محوّل اللغة" : "Language Switcher"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={Languages} options={langSwitcherOptions} value={nav.langSwitcherStyle} onChange={(v) => updateNavbar({ langSwitcherStyle: v })} columns={2} />
          </SectionCard>
          <SectionCard title={isAr ? "لوحة السمات" : "Theme Panel"}>
            <OptionGroup label={isAr ? "النمط" : "Style"} icon={Palette} options={themePanelOptions} value={nav.themePanelStyle} onChange={(v) => updateNavbar({ themePanelStyle: v })} columns={2} />
          </SectionCard>
        </div>

        {/* Toggles */}
        <SectionCard title={isAr ? "عناصر الواجهة" : "UI Elements"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <Toggle checked={nav.showTopGlow} onChange={(v) => updateNavbar({ showTopGlow: v })} label={isAr ? "خط التوهج العلوي" : "Top Glow Line"} />
            <Toggle checked={nav.showBottomBorder} onChange={(v) => updateNavbar({ showBottomBorder: v })} label={isAr ? "الحد السفلي" : "Bottom Border"} />
            <Toggle checked={nav.sticky} onChange={(v) => updateNavbar({ sticky: v })} label={isAr ? "ثابت عند التمرير" : "Sticky on Scroll"} />
            <Toggle checked={nav.showLogo} onChange={(v) => updateNavbar({ showLogo: v })} label={isAr ? "إظهار الشعار" : "Show Logo"} />
            <Toggle checked={nav.showLogoText} onChange={(v) => updateNavbar({ showLogoText: v })} label={isAr ? "نص الشعار" : "Logo Text"} />
            <Toggle checked={nav.showThemeSwitcher} onChange={(v) => updateNavbar({ showThemeSwitcher: v })} label={isAr ? "محوّل السمة" : "Theme Switcher"} />
            <Toggle checked={nav.showLanguageSwitcher} onChange={(v) => updateNavbar({ showLanguageSwitcher: v })} label={isAr ? "محوّل اللغة" : "Language Switcher"} />
            <Toggle checked={nav.showDashboardBtn} onChange={(v) => updateNavbar({ showDashboardBtn: v })} label={isAr ? "زر لوحة التحكم" : "Dashboard Button"} />
          </div>
        </SectionCard>

        {/* Pages */}
        <SectionCard title={isAr ? "صفحات التنقل" : "Navigation Pages"}>
          <div className="space-y-1.5">
            {navPages.map((page) => (
              <div key={page.key} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: page.inNavbar ? "rgba(var(--color-primary-rgb) / 0.08)" : "rgba(var(--color-primary-rgb) / 0.02)", border: "1px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
                    {page.inNavbar ? <Eye className="h-3 w-3" style={{ color: "var(--color-primary)" }} /> : <EyeOff className="h-3 w-3" style={{ opacity: 0.25 }} />}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold">{isAr ? page.labelAr : page.labelEn}</div>
                    <div className="text-[10px]" style={{ opacity: 0.35 }}>{page.href}</div>
                  </div>
                </div>
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
                  {page.inNavbar ? (isAr ? "في التنقل" : "In Navbar") : (isAr ? "مخفي" : "Hidden")}
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

    </div>
  );
}
