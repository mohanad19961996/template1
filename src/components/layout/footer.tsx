"use client";

import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  MapPin, Phone, Mail, ArrowRight, ArrowLeft,
  Send, Heart, Code, Smartphone, Figma, Megaphone,
  Clock,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useSiteConfig } from "@/providers/site-config-provider";
import { FooterStandard, FooterMinimal, FooterCentered } from "./footer-variants";

export function Footer() {
  const { config } = useSiteConfig();
  switch (config.footerVariant) {
    case "standard": return <><CtaBanner /><FooterStandard /></>;
    case "minimal": return <FooterMinimal />;
    case "centered": return <FooterCentered />;
    default: return <DefaultFooter />;
  }
}

const socialLinks = [
  { label: "Twitter", href: "#", icon: "𝕏" },
  { label: "GitHub", href: "#", icon: "GH" },
  { label: "LinkedIn", href: "#", icon: "in" },
  { label: "Dribbble", href: "#", icon: "Dr" },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

/* ── PRE-FOOTER CTA BANNER ── */
function CtaBanner() {
  const t = useTranslations("cta");
  const locale = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mb-8 relative z-10">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="relative overflow-hidden rounded-xl"
        style={{ border: "1px solid rgba(var(--color-primary-rgb) / 0.1)", background: "var(--color-card)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 md:p-6">
          <div className="max-w-md">
            <h2 className="text-base md:text-lg font-bold tracking-tight">{t("title")}</h2>
            <p className="mt-1 text-[13px] text-foreground leading-relaxed">{t("description")}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="cta-link-primary inline-flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white cursor-pointer"
              style={{ background: "var(--color-primary)" }}
            >
              {t("button")}
              <Arrow className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/portfolio"
              className="link-primary-hover inline-flex items-center gap-1.5 text-[13px] text-foreground cursor-pointer group"
            >
              {locale === "ar" ? "أعمالنا" : "Our Work"}
              <Arrow className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </div>
        </div>
        {/* Accent line */}
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.15), transparent)" }} />
      </motion.div>
    </div>
  );
}

/* ── FOOTER ── */
function DefaultFooter() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const footerRef = useRef<HTMLElement>(null);
  const inView = useInView(footerRef, { once: true, margin: "-40px" });

  const quickLinks = [
    { label: tc("home"), href: "/" },
    { label: tc("about"), href: "/about" },
    { label: tc("services"), href: "/services" },
    { label: tc("portfolio"), href: "/portfolio" },
    { label: tc("contact"), href: "/contact" },
  ];

  const serviceLinks = [
    { label: isRTL ? "تطوير المواقع" : "Web Development", icon: Code },
    { label: isRTL ? "تطوير التطبيقات" : "Mobile Apps", icon: Smartphone },
    { label: isRTL ? "تصميم UI/UX" : "UI/UX Design", icon: Figma },
    { label: isRTL ? "التسويق الرقمي" : "Digital Marketing", icon: Megaphone },
  ];

  const contactInfo = [
    { icon: MapPin, text: t("address") },
    { icon: Phone, text: "+966 50 000 1234" },
    { icon: Mail, text: "hello@template.sa" },
    { icon: Clock, text: t("workingHours") },
  ];

  return (
    <>
      <CtaBanner />

      <footer
        ref={footerRef}
        className="relative pt-16 pb-0 overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
        style={{ background: "rgba(var(--color-primary-rgb) / 0.02)" }}
      >
        {/* Top separator */}
        <div className="absolute top-0 inset-x-0 h-px section-separator" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-12 pb-6"
            variants={stagger}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {/* Brand column */}
            <motion.div variants={fadeUp} className="lg:col-span-4 space-y-3">
              <Link href="/" className="inline-flex items-center gap-2 group">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: "var(--color-primary)" }}
                >
                  T
                </div>
                <span className="text-sm font-bold tracking-tight">{tc("siteName")}</span>
              </Link>

              <p className="text-sm text-foreground leading-relaxed max-w-xs">
                {t("description")}
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-1.5">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="icon-btn h-7 w-7 text-[10px] font-semibold"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="h-px w-3" style={{ background: "var(--color-primary)" }} />
                {t("quickLinks")}
              </h3>
              <ul className="space-y-1.5">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-primary-hover text-sm text-foreground cursor-pointer hover-line inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Services */}
            <motion.div variants={fadeUp} className="lg:col-span-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="h-px w-3" style={{ background: "var(--color-primary)" }} />
                {t("services")}
              </h3>
              <ul className="space-y-1.5">
                {serviceLinks.map((s) => (
                  <li key={s.label}>
                    <Link
                      href="/services"
                      className="link-primary-hover flex items-center gap-2 text-sm text-foreground cursor-pointer"
                    >
                      <div
                        className="h-5 w-5 shrink-0 rounded flex items-center justify-center"
                        style={{
                          background: "rgba(var(--color-primary-rgb) / 0.05)",
                          color: "var(--color-primary)",
                        }}
                      >
                        <s.icon className="h-2.5 w-2.5" />
                      </div>
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact */}
            <motion.div variants={fadeUp} className="lg:col-span-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="h-px w-3" style={{ background: "var(--color-primary)" }} />
                {t("contactUs")}
              </h3>
              <ul className="space-y-1.5">
                {contactInfo.map((item) => (
                  <li key={item.text} className="flex items-center gap-2 text-[13px] text-foreground">
                    <div
                      className="h-5 w-5 shrink-0 rounded flex items-center justify-center"
                      style={{
                        background: "rgba(var(--color-primary-rgb) / 0.05)",
                        color: "var(--color-primary)",
                      }}
                    >
                      <item.icon className="h-2.5 w-2.5" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>

              {/* Newsletter */}
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
                <p className="text-xs font-semibold mb-1">{t("newsletter")}</p>
                <p className="text-[11px] text-foreground mb-1.5">{t("newsletterDesc")}</p>
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className="form-input flex-1 h-7 px-2.5 rounded-lg text-xs"
                  />
                  <button
                    className="cta-link-primary h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-white cursor-pointer"
                    style={{ background: "var(--color-primary)" }}
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom bar */}
          <div className="py-3" style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}>
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="text-xs text-foreground">
                &copy; 2026 {tc("siteName")}. {tc("copyright")}
              </p>
              <div className="flex items-center gap-3 text-xs text-foreground">
                {[t("privacy"), t("terms"), t("cookies")].map((label, i, arr) => (
                  <span key={label} className="flex items-center gap-3">
                    <span className="cursor-pointer link-primary-hover">{label}</span>
                    {i < arr.length - 1 && (
                      <span className="h-3 w-px" style={{ background: "rgba(var(--color-primary-rgb) / 0.1)" }} />
                    )}
                  </span>
                ))}
              </div>
              <p className="text-xs text-foreground flex items-center gap-1">
                {t("madeWith")}
                <Heart className="h-3 w-3" style={{ color: "var(--color-primary)", fill: "var(--color-primary)" }} />
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
