"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { ThemeSwitcher } from "./theme-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { Menu, ArrowRight, ArrowLeft, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/providers/site-config-provider";

export function Header() {
  const { config } = useSiteConfig();
  const nav = config.navbar;
  const navItems = config.pages
    .filter((p) => p.inNavbar)
    .map((p) => ({ key: p.key, href: p.href }));
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // --- Height ---
  const heightClass = nav.height === "sm" ? "h-12" : nav.height === "lg" ? "h-20" : "h-16";

  // --- Logo shape ---
  const logoShapeClass =
    nav.logoShape === "circle" ? "rounded-full" : nav.logoShape === "square" ? "rounded-md" : "rounded-xl";

  // --- Shadow ---
  const shadowStyle = () => {
    if (nav.shadow === "none") return {};
    if (nav.shadow === "lg")
      return { boxShadow: "0 12px 40px rgba(var(--color-primary-rgb) / 0.12), 0 4px 12px rgba(var(--color-foreground-rgb, 0 0 0) / 0.06)" };
    return { boxShadow: "0 8px 32px rgba(var(--color-primary-rgb) / 0.08), 0 2px 8px rgba(var(--color-foreground-rgb, 0 0 0) / 0.04)" };
  };

  // --- Variant-based backgrounds ---
  const variantBg = () => {
    switch (nav.variant) {
      case "solid":
        return <div className="absolute inset-0 -z-20 bg-background" />;
      case "minimal":
        return (
          <div
            className="absolute inset-0 -z-20"
            style={{ background: "var(--color-background)", opacity: 0.95 }}
          />
        );
      case "floating":
        return null;
      case "gradient":
        return (
          <>
            <div
              className="absolute inset-0 -z-20"
              style={{
                background: `linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.08) 0%, rgba(var(--color-primary-rgb) / 0.15) 50%, rgba(var(--color-primary-rgb) / 0.08) 100%)`,
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
            />
            <div
              className="absolute inset-0 -z-20 hidden dark:block"
              style={{
                background: `linear-gradient(90deg, rgba(var(--color-primary-rgb) / 0.12) 0%, rgba(var(--color-primary-rgb) / 0.2) 50%, rgba(var(--color-primary-rgb) / 0.12) 100%)`,
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
              }}
            />
          </>
        );
      case "bordered":
        return (
          <div
            className="absolute inset-0 -z-20"
            style={{
              background: "var(--color-background)",
              borderBottom: "2px solid rgba(var(--color-primary-rgb) / 0.15)",
            }}
          />
        );
      case "glass":
      default:
        return (
          <>
            <div
              className="absolute inset-0 -z-20"
              style={{
                background: `linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.12) 0%, rgba(var(--color-primary-rgb) / 0.06) 20%, rgba(var(--color-background-rgb, 255 255 255) / 0.78) 50%, rgba(var(--color-primary-rgb) / 0.06) 80%, rgba(var(--color-primary-rgb) / 0.12) 100%)`,
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
              }}
            />
            <div
              className="absolute inset-0 -z-20 hidden dark:block"
              style={{
                background: `linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.15) 0%, rgba(var(--color-primary-rgb) / 0.08) 20%, rgba(9, 9, 11, 0.82) 50%, rgba(var(--color-primary-rgb) / 0.08) 80%, rgba(var(--color-primary-rgb) / 0.15) 100%)`,
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
              }}
            />
          </>
        );
    }
  };

  // --- Hover effects for nav links ---
  const renderNavLink = (item: { key: string; href: string }) => {
    const active = isActive(item.href);
    const hoverEffect = nav.hover;

    const animationConfig =
      nav.animation === "spring"
        ? { type: "spring" as const, stiffness: 380, damping: 30 }
        : nav.animation === "bounce"
          ? { type: "spring" as const, stiffness: 500, damping: 15 }
          : nav.animation === "smooth"
            ? { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
            : { duration: 0 };

    return (
      <motion.div key={item.key} whileTap={{ scale: 0.95 }}>
        <Link
          href={item.href}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="relative block px-4 py-[6px] text-[13px] font-medium rounded-full cursor-pointer group"
          style={{ transition: "color 0.3s ease" }}
          onMouseEnter={(e) => {
            if (!active) e.currentTarget.style.color = "var(--color-primary)";
          }}
          onMouseLeave={(e) => {
            if (!active) e.currentTarget.style.color = "";
          }}
        >
          {/* Active — pill */}
          {active && hoverEffect === "pill" && (
            <motion.div
              layoutId="activeNav"
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.85))`,
                boxShadow: `0 2px 12px rgba(var(--color-primary-rgb) / 0.4), 0 0 20px rgba(var(--color-primary-rgb) / 0.15)`,
              }}
              transition={animationConfig}
            />
          )}

          {/* Active — underline */}
          {active && hoverEffect === "underline" && (
            <motion.div
              layoutId="activeNav"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-2/3 rounded-full"
              style={{ background: "var(--color-primary)" }}
              transition={animationConfig}
            />
          )}

          {/* Active — glow */}
          {active && hoverEffect === "glow" && (
            <motion.div
              layoutId="activeNav"
              className="absolute inset-0 rounded-full"
              style={{
                background: `rgba(var(--color-primary-rgb) / 0.12)`,
                boxShadow: `0 0 20px rgba(var(--color-primary-rgb) / 0.3), inset 0 0 10px rgba(var(--color-primary-rgb) / 0.1)`,
              }}
              transition={animationConfig}
            />
          )}

          {/* Active — scale */}
          {active && hoverEffect === "scale" && (
            <motion.div
              layoutId="activeNav"
              className="absolute inset-0 rounded-full"
              style={{
                background: `rgba(var(--color-primary-rgb) / 0.1)`,
                border: "1.5px solid rgba(var(--color-primary-rgb) / 0.25)",
              }}
              transition={animationConfig}
            />
          )}

          {/* Active — fill */}
          {active && hoverEffect === "fill" && (
            <motion.div
              layoutId="activeNav"
              className="absolute inset-0 rounded-full"
              style={{
                background: "var(--color-primary)",
              }}
              transition={animationConfig}
            />
          )}

          {/* Hover effects (non-active) */}
          {!active && hoverEffect === "pill" && (
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.08)", transition: "opacity 0.3s ease" }}
            />
          )}
          {!active && (hoverEffect === "underline" || hoverEffect === "pill") && (
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-1/2 rounded-full"
              style={{ background: "var(--color-primary)", transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
          )}
          {!active && hoverEffect === "glow" && (
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", boxShadow: "0 0 12px rgba(var(--color-primary-rgb) / 0.15)", transition: "opacity 0.3s ease" }}
            />
          )}
          {!active && hoverEffect === "scale" && (
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-105"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.06)", border: "1px solid rgba(var(--color-primary-rgb) / 0.1)", transition: "all 0.3s ease", transformOrigin: "center" }}
            />
          )}
          {!active && hoverEffect === "fill" && (
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
              style={{ background: "rgba(var(--color-primary-rgb) / 0.1)", transition: "opacity 0.3s ease" }}
            />
          )}

          <span
            className={cn(
              "relative z-10",
              active && (hoverEffect === "pill" || hoverEffect === "fill")
                ? "text-white"
                : active
                  ? "text-[var(--color-primary)]"
                  : "text-foreground"
            )}
          >
            {t(item.key)}
          </span>
        </Link>
      </motion.div>
    );
  };

  // --- Nav container style ---
  const navContainerStyle = () => {
    switch (nav.navStyle) {
      case "separate":
        return { background: "transparent", border: "none", gap: "4px" };
      case "underlined":
        return {
          background: "transparent",
          border: "none",
          borderBottom: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
          borderRadius: "0",
          padding: "0 4px 4px 4px",
        };
      case "plain":
        return { background: "transparent", border: "none" };
      case "pill-container":
      default:
        return {
          background: "rgba(var(--color-primary-rgb) / 0.06)",
          border: "1px solid rgba(var(--color-primary-rgb) / 0.1)",
        };
    }
  };

  // --- CTA button ---
  const renderCta = () => {
    if (nav.ctaStyle === "none") return null;

    if (nav.ctaStyle === "outlined") {
      return (
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 h-[38px] px-5 rounded-xl text-[13px] font-semibold cursor-pointer"
          style={{
            color: "var(--color-primary)",
            border: "1.5px solid rgba(var(--color-primary-rgb) / 0.2)",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-primary)";
            e.currentTarget.style.color = "white";
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-primary)";
            e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.2)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {tc("getStarted")}
          <Arrow className="h-3.5 w-3.5" />
        </Link>
      );
    }

    if (nav.ctaStyle === "gradient") {
      return (
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 h-[38px] px-5 rounded-xl text-[13px] font-semibold text-white cursor-pointer"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, rgba(var(--color-primary-rgb) / 0.7) 50%, var(--color-primary) 100%)`,
            backgroundSize: "200% 200%",
            animation: "gradientShift 3s ease infinite",
            boxShadow: "0 4px 15px rgba(var(--color-primary-rgb) / 0.3)",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(var(--color-primary-rgb) / 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(var(--color-primary-rgb) / 0.3)";
          }}
        >
          {tc("getStarted")}
          <Arrow className="h-3.5 w-3.5" />
        </Link>
      );
    }

    if (nav.ctaStyle === "glow") {
      return (
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 h-[38px] px-5 rounded-xl text-[13px] font-semibold text-white cursor-pointer"
          style={{
            background: "var(--color-primary)",
            boxShadow: "0 0 20px rgba(var(--color-primary-rgb) / 0.4), 0 0 40px rgba(var(--color-primary-rgb) / 0.15)",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(var(--color-primary-rgb) / 0.5), 0 0 60px rgba(var(--color-primary-rgb) / 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(var(--color-primary-rgb) / 0.4), 0 0 40px rgba(var(--color-primary-rgb) / 0.15)";
          }}
        >
          {tc("getStarted")}
          <Arrow className="h-3.5 w-3.5" />
        </Link>
      );
    }

    // filled (default)
    return (
      <Link
        href="/contact"
        className="inline-flex items-center gap-2 h-[38px] px-5 rounded-xl text-[13px] font-semibold text-white cursor-pointer"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.85))",
          boxShadow: "0 2px 10px rgba(var(--color-primary-rgb) / 0.25)",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(var(--color-primary-rgb) / 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 10px rgba(var(--color-primary-rgb) / 0.25)";
        }}
      >
        {tc("getStarted")}
        <Arrow className="h-3.5 w-3.5" />
      </Link>
    );
  };

  const floatingWrapper = nav.variant === "floating";

  return (
    <>
      <header className={cn(nav.sticky ? "sticky top-0" : "relative", "z-50 w-full")}>
        <div className={cn("relative", floatingWrapper && "mx-4 mt-3 rounded-2xl overflow-hidden")}>
          {variantBg()}

          {/* Floating variant glass bg */}
          {floatingWrapper && (
            <>
              <div
                className="absolute inset-0 -z-20"
                style={{
                  background: `linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.1), rgba(var(--color-background-rgb, 255 255 255) / 0.8), rgba(var(--color-primary-rgb) / 0.1))`,
                  backdropFilter: "blur(24px) saturate(200%)",
                  WebkitBackdropFilter: "blur(24px) saturate(200%)",
                  borderRadius: "inherit",
                }}
              />
              <div
                className="absolute inset-0 -z-20 hidden dark:block"
                style={{
                  background: `linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.12), rgba(9,9,11,0.85), rgba(var(--color-primary-rgb) / 0.12))`,
                  backdropFilter: "blur(24px) saturate(200%)",
                  WebkitBackdropFilter: "blur(24px) saturate(200%)",
                  borderRadius: "inherit",
                }}
              />
              <div
                className="absolute inset-0 -z-10 rounded-[inherit]"
                style={{ border: "1.5px solid rgba(var(--color-primary-rgb) / 0.12)" }}
              />
            </>
          )}

          {/* TOP GLOW LINE */}
          {nav.showTopGlow && (
            <div
              className="absolute top-0 inset-x-0 h-[1.5px]"
              style={{
                background: `linear-gradient(90deg, transparent 5%, rgba(var(--color-primary-rgb) / 0.5) 30%, rgba(var(--color-primary-rgb) / 0.8) 50%, rgba(var(--color-primary-rgb) / 0.5) 70%, transparent 95%)`,
              }}
            />
          )}

          {/* BOTTOM BORDER */}
          {nav.showBottomBorder && (
            <div
              className={cn(
                "absolute bottom-0 inset-x-0 h-px transition-opacity duration-300",
                scrolled ? "opacity-100" : "opacity-60"
              )}
              style={{
                background: `linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.2), rgba(var(--color-primary-rgb) / 0.1), rgba(var(--color-primary-rgb) / 0.2), transparent)`,
              }}
            />
          )}

          {/* Shadow on scroll */}
          <div
            className={cn(
              "absolute inset-0 -z-10 transition-opacity duration-400 pointer-events-none",
              scrolled ? "opacity-100" : "opacity-0"
            )}
            style={shadowStyle()}
          />

          {/* ========= CONTENT ========= */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={cn("grid grid-cols-[1fr_auto_1fr] items-center", heightClass)}>

              {/* ===== LOGO + THEME ===== */}
              <div className="flex items-center gap-5 justify-self-start">
                {nav.showLogo && (
                  <Link
                    href="/"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="flex items-center gap-3 shrink-0 group cursor-pointer"
                  >
                    <motion.div
                      className={cn(
                        "relative z-10 h-9 w-9 flex items-center justify-center text-white font-bold text-sm overflow-hidden cursor-pointer",
                        logoShapeClass
                      )}
                      style={{
                        background: "linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))",
                        animation: "logoFloat 6s ease-in-out infinite",
                      }}
                      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                      whileHover={{
                        scale: 1.12,
                        rotate: 3,
                        boxShadow: "0 8px 28px rgba(var(--color-primary-rgb) / 0.4)",
                      }}
                      whileTap={{ scale: 0.92, rotate: -2 }}
                    >
                      T
                      <div className="absolute inset-0 rounded-[inherit] border border-white/20" />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100"
                        style={{
                          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
                          animation: "logoShine 1.5s ease-in-out infinite",
                          animationPlayState: "paused",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.animationPlayState = "running";
                        }}
                      />
                    </motion.div>

                    {nav.showLogoText && (
                      <motion.span
                        className="hidden sm:flex items-center text-[15px] font-bold tracking-tight logo-text-animated"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {tc("siteName")}
                      </motion.span>
                    )}
                  </Link>
                )}

                {nav.showThemeSwitcher && (
                  <div className="hidden md:block">
                    <ThemeSwitcher />
                  </div>
                )}
              </div>

              {/* ===== DESKTOP NAV — CENTER ===== */}
              <nav className="hidden lg:flex">
                <motion.div
                  className={cn(
                    "flex items-center px-1.5 py-1 gap-0.5",
                    nav.navStyle !== "underlined" && "rounded-full"
                  )}
                  style={navContainerStyle()}
                  whileHover={
                    nav.navStyle === "pill-container"
                      ? {
                          boxShadow: "0 4px 20px rgba(var(--color-primary-rgb) / 0.1)",
                          borderColor: "rgba(var(--color-primary-rgb) / 0.2)",
                        }
                      : undefined
                  }
                  transition={{ duration: 0.3 }}
                >
                  {navItems.map((item) => renderNavLink(item))}
                </motion.div>
              </nav>

              {/* ===== RIGHT ACTIONS ===== */}
              <div className="flex items-center gap-2 justify-self-end">
                <div className="hidden md:flex items-center gap-2">
                  <ThemeToggle />
                  {nav.showLanguageSwitcher && <LanguageSwitcher />}
                </div>

                <div className="flex md:hidden items-center gap-1.5">
                  {nav.showThemeSwitcher && <ThemeSwitcher />}
                  <ThemeToggle />
                  {nav.showLanguageSwitcher && <LanguageSwitcher />}
                </div>

                {nav.showDashboardBtn && (
                  <Link
                    href="/dashboard"
                    className="hidden md:flex items-center justify-center h-[38px] w-[38px] rounded-xl cursor-pointer"
                    style={{
                      border: "1.5px solid rgba(var(--color-primary-rgb) / 0.15)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-primary)";
                      e.currentTarget.style.borderColor = "var(--color-primary)";
                      const svg = e.currentTarget.querySelector("svg");
                      if (svg) (svg as unknown as HTMLElement).style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "rgba(var(--color-primary-rgb) / 0.15)";
                      const svg = e.currentTarget.querySelector("svg");
                      if (svg) (svg as unknown as HTMLElement).style.color = "var(--color-primary)";
                    }}
                  >
                    <LayoutDashboard className="h-4 w-4" style={{ color: "var(--color-primary)", transition: "color 0.3s ease" }} />
                  </Link>
                )}

                <div className="hidden md:block">
                  {renderCta()}
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileOpen(true)}
                  className="header-btn lg:!hidden"
                >
                  <Menu className="h-[18px] w-[18px]" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
