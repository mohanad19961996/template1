"use client";

import { useEffect } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { ThemeSwitcher } from "./theme-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { useSiteConfig } from "@/providers/site-config-provider";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { config } = useSiteConfig();
  const navItems = config.pages
    .filter((p) => p.inNavbar)
    .map((p) => ({ key: p.key, href: p.href }));
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md lg:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: locale === "ar" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: locale === "ar" ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={cn(
              "fixed inset-y-0 z-50 w-[300px] max-w-[85vw] lg:hidden overflow-hidden",
              "bg-background/95 backdrop-blur-2xl",
              locale === "ar" ? "start-0" : "end-0"
            )}
          >
            {/* Side accent glow */}
            <div
              className={cn(
                "absolute top-0 bottom-0 w-[2px]",
                locale === "ar" ? "end-0" : "start-0"
              )}
              style={{
                background: `linear-gradient(180deg, transparent, rgba(var(--color-primary-rgb) / 0.6), var(--color-primary), rgba(var(--color-primary-rgb) / 0.6), transparent)`,
                boxShadow: `0 0 15px rgba(var(--color-primary-rgb) / 0.3)`,
              }}
            />

            <div className="flex h-full flex-col">
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 h-16"
                style={{ borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.1)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                    style={{
                      background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.7))`,
                      boxShadow: `0 3px 10px rgba(var(--color-primary-rgb) / 0.3)`,
                    }}
                  >
                    T
                  </div>
                  <span className="text-sm font-bold">{tc("siteName")}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={onClose}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground hover:text-destructive transition-colors cursor-pointer"
                  style={{
                    background: "rgba(var(--color-primary-rgb) / 0.06)",
                    border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
                  }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1">
                  {navItems.map((item, i) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: locale === "ar" ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.08 + i * 0.04 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => { onClose(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer link-primary-hover",
                          isActive(item.href)
                            ? "text-white"
                            : "text-foreground hover:text-foreground"
                        )}
                        style={
                          isActive(item.href)
                            ? {
                                background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))`,
                                boxShadow: `0 3px 12px rgba(var(--color-primary-rgb) / 0.3)`,
                              }
                            : undefined
                        }
                      >
                        <span>{t(item.key)}</span>
                        {isActive(item.href) && (
                          <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </nav>

              {/* Bottom */}
              <div
                className="px-5 py-4 space-y-3"
                style={{ borderTop: "1px solid rgba(var(--color-primary-rgb) / 0.1)" }}
              >
                <div className="flex items-center gap-1">
                  <ThemeSwitcher />
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/contact"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-[13px] font-semibold text-white transition-all duration-300 cursor-pointer relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))`,
                      boxShadow: `0 4px 15px rgba(var(--color-primary-rgb) / 0.35)`,
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    {tc("getStarted")}
                    <Arrow className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
