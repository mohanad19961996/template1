"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useSiteConfig } from "@/providers/site-config-provider";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { config } = useSiteConfig();
  const style = config.navbar.langSwitcherStyle;

  function switchLocale() {
    const newLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: newLocale });
  }

  const label = locale === "ar" ? "EN" : "عربي";

  // ── icon-text ──
  if (style === "icon-text") {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={switchLocale}
        className="header-btn !w-auto px-3 gap-1.5"
        aria-label="Switch language"
      >
        <Globe className="h-3.5 w-3.5" style={{ opacity: 0.6 }} />
        <motion.span
          key={locale}
          initial={{ y: 6, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-[12px] font-bold uppercase tracking-wider"
        >
          {label}
        </motion.span>
      </motion.button>
    );
  }

  // ── badge ──
  if (style === "badge") {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={switchLocale}
        className="h-[38px] px-3.5 rounded-full flex items-center justify-center text-[12px] font-bold uppercase tracking-wider cursor-pointer"
        style={{
          background: "rgba(var(--color-primary-rgb) / 0.06)",
          border: "1.5px solid rgba(var(--color-primary-rgb) / 0.1)",
          color: "var(--color-primary)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--color-primary)";
          e.currentTarget.style.color = "white";
          e.currentTarget.style.borderColor = "var(--color-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(var(--color-primary-rgb) / 0.06)";
          e.currentTarget.style.color = "var(--color-primary)";
          e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.1)";
        }}
        aria-label="Switch language"
      >
        <motion.span
          key={locale}
          initial={{ y: 6, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {label}
        </motion.span>
      </motion.button>
    );
  }

  // ── minimal ──
  if (style === "minimal") {
    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={switchLocale}
        className="h-[38px] px-2 flex items-center justify-center text-[12px] font-bold uppercase tracking-wider cursor-pointer"
        style={{ transition: "color 0.3s ease" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = ""; }}
        aria-label="Switch language"
      >
        <motion.span
          key={locale}
          initial={{ y: 6, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {label}
        </motion.span>
      </motion.button>
    );
  }

  // ── text (default) ──
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={switchLocale}
      className="header-btn !w-auto px-3.5 text-[12px] font-bold uppercase tracking-wider"
      aria-label="Switch language"
    >
      <motion.span
        key={locale}
        initial={{ y: 6, opacity: 0, filter: "blur(4px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
