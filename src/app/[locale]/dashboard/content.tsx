"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteConfig } from "@/providers/site-config-provider";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Navigation,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Footprints,
  FileText,
  Layers,
  Settings,
  PanelTop,
} from "lucide-react";
import type { FooterVariant } from "@/lib/site-config";

export function DashboardContent() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const Chevron = isAr ? ChevronLeft : ChevronRight;
  const { config, updateConfig, updatePage } = useSiteConfig();

  const footerOptions: { value: FooterVariant; labelEn: string; labelAr: string }[] = [
    { value: "default", labelEn: "Default", labelAr: "افتراضي" },
    { value: "standard", labelEn: "Standard", labelAr: "قياسي" },
    { value: "minimal", labelEn: "Minimal", labelAr: "بسيط" },
    { value: "centered", labelEn: "Centered", labelAr: "مركزي" },
  ];

  const navPages = config.pages.filter((p) => p.key !== "dashboard");
  const visiblePages = navPages.filter((p) => p.visible).length;
  const navbarPages = navPages.filter((p) => p.inNavbar).length;

  const quickLinks = [
    { href: "/dashboard/navbar", icon: Navigation, labelEn: "Navbar", labelAr: "شريط التنقل", descEn: "6 variants, effects & buttons", descAr: "6 أنماط وتأثيرات" },
    { href: "/dashboard/hero", icon: PanelTop, labelEn: "Hero Section", labelAr: "قسم الهيرو", descEn: "4 layouts & animations", descAr: "4 تصاميم وحركات" },
    { href: "/dashboard/features", icon: Layers, labelEn: "Features", labelAr: "المميزات", descEn: "Titles, ratings & badges", descAr: "العناوين والتقييمات" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ═══ WELCOME ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.06), rgba(var(--color-primary-rgb) / 0.02))", border: "1.5px solid rgba(var(--color-primary-rgb) / 0.08)" }}
      >
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }} />
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
          <div>
            <h1 className="text-[20px] font-bold tracking-tight mb-1">
              {isAr ? "مرحباً بك في لوحة التحكم" : "Welcome to Dashboard"}
            </h1>
            <p className="text-[13px]" style={{ opacity: 0.5 }}>
              {isAr ? "تحكم في كل جزء من موقعك. جميع التغييرات تُحفظ تلقائياً." : "Control every part of your site. All changes auto-save."}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { valueStr: `${visiblePages}/${navPages.length}`, labelEn: "Visible Pages", labelAr: "صفحات مرئية" },
            { valueStr: `${navbarPages}`, labelEn: "In Navbar", labelAr: "في شريط التنقل" },
            { valueStr: config.footerVariant, labelEn: "Footer Style", labelAr: "نمط التذييل" },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.04)", border: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}
            >
              <div className="text-[16px] font-bold" style={{ color: "var(--color-primary)" }}>{stat.valueStr}</div>
              <div className="text-[10px] font-medium mt-0.5" style={{ opacity: 0.4 }}>{isAr ? stat.labelAr : stat.labelEn}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ QUICK ACCESS ═══ */}
      <div>
        <h2 className="text-[13px] font-bold uppercase tracking-wider mb-3" style={{ opacity: 0.35 }}>
          {isAr ? "وصول سريع" : "Quick Access"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map(({ href, icon: Icon, labelEn, labelAr, descEn, descAr }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                href={href}
                className="group flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md"
                style={{ background: "var(--color-card)", border: "1.5px solid rgba(var(--color-primary-rgb) / 0.08)" }}
              >
                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(var(--color-primary-rgb) / 0.08)" }}>
                  <Icon className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold">{isAr ? labelAr : labelEn}</div>
                  <div className="text-[10px] mt-0.5" style={{ opacity: 0.35 }}>{isAr ? descAr : descEn}</div>
                </div>
                <Chevron className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" style={{ color: "var(--color-primary)", opacity: 0.3 }} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ PAGE MANAGEMENT ═══ */}
        <div className="rounded-2xl p-5" style={{ background: "var(--color-card)", border: "1.5px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <h2 className="text-[14px] font-bold">{isAr ? "إدارة الصفحات" : "Page Management"}</h2>
          </div>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {navPages.map((page) => (
              <div
                key={page.key}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.05)" }}
              >
                <div className="flex items-center gap-2.5">
                  {page.visible ? (
                    <Eye className="h-3 w-3" style={{ color: "var(--color-primary)" }} />
                  ) : (
                    <EyeOff className="h-3 w-3" style={{ opacity: 0.25 }} />
                  )}
                  <span className="text-[12px] font-medium">{isAr ? page.labelAr : page.labelEn}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updatePage(page.key, { inNavbar: !page.inNavbar })}
                    className="text-[10px] font-medium px-2 py-1 rounded-md cursor-pointer transition-all duration-200"
                    style={{
                      background: page.inNavbar ? "rgba(var(--color-primary-rgb) / 0.08)" : "transparent",
                      color: page.inNavbar ? "var(--color-primary)" : "inherit",
                      opacity: page.inNavbar ? 1 : 0.4,
                      border: page.inNavbar ? "1px solid rgba(var(--color-primary-rgb) / 0.15)" : "1px solid rgba(var(--color-primary-rgb) / 0.06)",
                    }}
                  >
                    <Navigation className="h-2.5 w-2.5 inline" />
                  </button>
                  <button
                    onClick={() => updatePage(page.key, { visible: !page.visible })}
                    className="text-[10px] font-medium px-2 py-1 rounded-md cursor-pointer transition-all duration-200"
                    style={{
                      background: page.visible ? "transparent" : "rgba(255,80,80,0.06)",
                      color: page.visible ? "inherit" : "rgb(255,80,80)",
                      opacity: page.visible ? 0.5 : 0.7,
                      border: page.visible ? "1px solid rgba(var(--color-primary-rgb) / 0.06)" : "1px solid rgba(255,80,80,0.15)",
                    }}
                  >
                    {page.visible ? (isAr ? "مرئي" : "Visible") : (isAr ? "مخفي" : "Hidden")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={{ background: "var(--color-card)", border: "1.5px solid rgba(var(--color-primary-rgb) / 0.08)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Footprints className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
              <h2 className="text-[14px] font-bold">{isAr ? "نمط التذييل" : "Footer Style"}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {footerOptions.map((opt) => {
                const active = config.footerVariant === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateConfig({ footerVariant: opt.value })}
                    className="py-3 px-4 rounded-xl text-center cursor-pointer transition-all duration-200"
                    style={{
                      border: active ? "2px solid var(--color-primary)" : "2px solid rgba(var(--color-primary-rgb) / 0.06)",
                      background: active ? "rgba(var(--color-primary-rgb) / 0.06)" : "transparent",
                      color: active ? "var(--color-primary)" : "inherit",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    <div className="text-[12px]">{isAr ? opt.labelAr : opt.labelEn}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tip card */}
          <div className="rounded-xl p-4" style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.06)", background: "rgba(var(--color-primary-rgb) / 0.02)" }}>
            <div className="flex items-start gap-2.5">
              <Settings className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
              <div>
                <div className="text-[11px] font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
                  {isAr ? "نصيحة" : "Tip"}
                </div>
                <p className="text-[11px] leading-relaxed" style={{ opacity: 0.45 }}>
                  {isAr
                    ? "استخدم القائمة الجانبية للتنقل بين أقسام التحكم. يمكنك تعديل عناوين ومحتوى كل صفحة من قسم \"محتوى الصفحات\"."
                    : "Use the sidebar to navigate between control sections. You can edit titles and content of each page from the \"Page Content\" section."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
