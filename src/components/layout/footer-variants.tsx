"use client";

import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  MapPin, Phone, Mail, ArrowRight, ArrowLeft,
  Send, Heart, Code, Smartphone, Figma, Megaphone, Clock,
} from "lucide-react";
import { motion, useInView } from "framer-motion";

const socialLinks = [
  { label: "Twitter", href: "#", icon: "\u{1D54F}" },
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
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/* ── FooterStandard ── 4-column layout ── */
export function FooterStandard() {
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
    { label: isRTL ? "\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0645\u0648\u0627\u0642\u0639" : "Web Development", icon: Code },
    { label: isRTL ? "\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A" : "Mobile Apps", icon: Smartphone },
    { label: isRTL ? "\u062A\u0635\u0645\u064A\u0645 UI/UX" : "UI/UX Design", icon: Figma },
    { label: isRTL ? "\u0627\u0644\u062A\u0633\u0648\u064A\u0642 \u0627\u0644\u0631\u0642\u0645\u064A" : "Digital Marketing", icon: Megaphone },
  ];

  const contactInfo = [
    { icon: MapPin, text: t("address") },
    { icon: Phone, text: "+966 50 000 1234" },
    { icon: Mail, text: "hello@template.sa" },
    { icon: Clock, text: t("workingHours") },
  ];

  return (
    <footer
      ref={footerRef}
      className="relative pt-16 pb-0 overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: "rgba(var(--color-primary-rgb) / 0.02)" }}
    >
      <div className="absolute top-0 inset-x-0 h-px section-separator" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-12 pb-6"
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Brand */}
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
            <p className="text-sm text-foreground leading-relaxed max-w-xs">{t("description")}</p>
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
                    className="text-sm text-foreground cursor-pointer hover-line inline-block link-primary-hover"
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
                    className="flex items-center gap-2 text-sm text-foreground cursor-pointer link-primary-hover"
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
                  className="flex-1 h-7 px-2.5 rounded-lg text-xs bg-background outline-none"
                  style={{
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                    transitionProperty: "border-color, box-shadow",
                    transitionDuration: "var(--dur-base)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.3)";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(var(--color-primary-rgb) / 0.06)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-white cursor-pointer"
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
                  <span
                    className="cursor-pointer"
                    style={{ transitionProperty: "color", transitionDuration: "var(--dur-fast)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = ""; }}
                  >
                    {label}
                  </span>
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
  );
}

/* ── FooterMinimal ── Simple 1-2 row footer ── */
export function FooterMinimal() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const links = [
    { label: tc("home"), href: "/" },
    { label: tc("about"), href: "/about" },
    { label: tc("services"), href: "/services" },
    { label: tc("portfolio"), href: "/portfolio" },
    { label: tc("contact"), href: "/contact" },
  ];

  return (
    <footer
      dir={isRTL ? "rtl" : "ltr"}
      className="relative py-6"
      style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo + name */}
          <Link href="/" className="inline-flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "var(--color-primary)" }}
            >
              T
            </div>
            <span className="text-sm font-bold tracking-tight">{tc("siteName")}</span>
          </Link>

          {/* Inline links */}
          <nav className="flex items-center gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-foreground cursor-pointer link-primary-hover"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-foreground">
            &copy; 2026 {tc("siteName")}. {tc("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ── FooterCentered ── Logo on top, centered nav, social, copyright ── */
export function FooterCentered() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const footerRef = useRef<HTMLElement>(null);
  const inView = useInView(footerRef, { once: true, margin: "-40px" });

  const navLinks = [
    { label: tc("home"), href: "/" },
    { label: tc("about"), href: "/about" },
    { label: tc("services"), href: "/services" },
    { label: tc("portfolio"), href: "/portfolio" },
    { label: tc("contact"), href: "/contact" },
  ];

  return (
    <footer
      ref={footerRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative pt-12 pb-6 overflow-hidden"
      style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.06)" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center space-y-5"
        >
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "var(--color-primary)" }}
            >
              T
            </div>
            <span className="text-base font-bold tracking-tight">{tc("siteName")}</span>
          </Link>

          <p className="text-sm text-foreground max-w-sm leading-relaxed">
            {t("description")}
          </p>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-foreground cursor-pointer link-primary-hover"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-2">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="icon-btn h-8 w-8 text-[10px] font-semibold"
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* Divider */}
          <div
            className="w-full max-w-xs h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.12), transparent)" }}
          />

          {/* Bottom */}
          <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-foreground">
            <p>
              &copy; 2026 {tc("siteName")}. {tc("copyright")}
            </p>
            <span className="hidden sm:inline">|</span>
            <p className="flex items-center gap-1">
              {t("madeWith")}
              <Heart className="h-3 w-3" style={{ color: "var(--color-primary)", fill: "var(--color-primary)" }} />
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
