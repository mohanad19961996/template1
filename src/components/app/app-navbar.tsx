'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Menu, Moon, Sun, Globe, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface AppNavbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
}

export function AppNavbar({ sidebarCollapsed, onToggleSidebar, onOpenMobile }: AppNavbarProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';
  const toggleDark = () => setTheme(isDark ? 'light' : 'dark');

  const switchLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: newLocale });
  };

  const langLabel = locale === 'ar' ? 'EN' : 'عربي';

  // Get page title from pathname
  const segment = pathname.split('/').pop() || 'app';
  const titles: Record<string, { en: string; ar: string }> = {
    app: { en: 'Dashboard', ar: 'لوحة التحكم' },
    habits: { en: 'Habits', ar: 'العادات' },
    skills: { en: 'Skills', ar: 'المهارات' },
    timers: { en: 'Timers', ar: 'المؤقتات' },
    analytics: { en: 'Analytics', ar: 'التحليلات' },
    calendar: { en: 'Calendar', ar: 'التقويم' },
    goals: { en: 'Goals', ar: 'الأهداف' },
    reminders: { en: 'Reminders', ar: 'التذكيرات' },
    hormones: { en: 'Hormones', ar: 'الهرمونات' },
    nutrition: { en: 'Nutrition', ar: 'التغذية' },
    settings: { en: 'Settings', ar: 'الإعدادات' },
  };
  const pageTitle = titles[segment] || titles.app;

  return (
    <header
      className="sticky top-0 z-[var(--z-sticky)] h-16 flex items-center justify-between gap-4 px-4 sm:px-6 border-b border-[var(--foreground)]/[0.1]"
      style={{
        background: 'rgba(var(--color-background-rgb, 255 255 255) / 0.85)',
        backdropFilter: 'blur(20px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.03)',
      }}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobile}
          className="flex h-9 w-9 icon-btn lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex h-9 w-9 icon-btn"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        {/* Page title */}
        <div className="flex items-center gap-2.5">
          <motion.h1
            key={segment}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-base font-semibold tracking-tight"
          >
            {isAr ? pageTitle.ar : pageTitle.en}
          </motion.h1>
        </div>
      </div>

      {/* Right side — controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme color switcher */}
        <ThemeSwitcher />

        {/* Language switcher */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={switchLocale}
          className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-wider cursor-pointer icon-btn !w-auto"
          aria-label="Switch language"
        >
          <Globe className="h-3.5 w-3.5 opacity-70" />
          <motion.span
            key={locale}
            initial={{ y: 6, opacity: 0, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {langLabel}
          </motion.span>
        </motion.button>

        {/* Dark mode toggle */}
        {mounted && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleDark}
            className="h-9 w-9 icon-btn cursor-pointer"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.div>
          </motion.button>
        )}
      </div>
    </header>
  );
}
