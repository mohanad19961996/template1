'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ListChecks, GraduationCap, Timer, BarChart3,
  Calendar, Bell, Brain, Apple, Target, Settings, ChevronLeft,
  ChevronRight, Sparkles, Menu, X, Heart, Zap, Sun, Smile,
  Dumbbell,
} from 'lucide-react';

interface NavItem {
  href: string;
  labelEn: string;
  labelAr: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  titleEn: string;
  titleAr: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    titleEn: 'Main',
    titleAr: 'الرئيسية',
    items: [
      { href: '/app', labelEn: 'Dashboard', labelAr: 'لوحة التحكم', icon: LayoutDashboard },
      { href: '/app/habits', labelEn: 'Habits', labelAr: 'العادات', icon: ListChecks },
      { href: '/app/skills', labelEn: 'Skills', labelAr: 'المهارات', icon: GraduationCap },
      { href: '/app/timers', labelEn: 'Timers', labelAr: 'المؤقتات', icon: Timer },
    ],
  },
  {
    titleEn: 'Insights',
    titleAr: 'التحليلات',
    items: [
      { href: '/app/analytics', labelEn: 'Analytics', labelAr: 'التحليلات', icon: BarChart3 },
      { href: '/app/calendar', labelEn: 'Calendar', labelAr: 'التقويم', icon: Calendar },
      { href: '/app/goals', labelEn: 'Goals', labelAr: 'الأهداف', icon: Target },
      { href: '/app/reminders', labelEn: 'Reminders', labelAr: 'التذكيرات', icon: Bell },
    ],
  },
  {
    titleEn: 'Wellness',
    titleAr: 'العافية',
    items: [
      { href: '/app/hormones', labelEn: 'Hormones', labelAr: 'الهرمونات', icon: Brain },
      { href: '/app/nutrition', labelEn: 'Nutrition', labelAr: 'التغذية', icon: Apple },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/app/settings', labelEn: 'Settings', labelAr: 'الإعدادات', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    const localePath = `/${locale}${href}`;
    if (href === '/app') return pathname === localePath;
    return pathname.startsWith(localePath);
  };

  const NavLink = ({ item, showLabel }: { item: NavItem; showLabel: boolean }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          active
            ? 'bg-[rgb(var(--color-primary-rgb))/0.12] text-[var(--color-primary)]'
            : 'text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/[0.04] hover:text-[var(--foreground)]',
          !showLabel && 'justify-center px-2.5',
        )}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-xl bg-[rgb(var(--color-primary-rgb))/0.1]"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
        <Icon className={cn('relative z-10 h-[18px] w-[18px] shrink-0', active && 'text-[var(--color-primary)]')} />
        {showLabel && (
          <span className="relative z-10 truncate">{isAr ? item.labelAr : item.labelEn}</span>
        )}
        {item.badge && showLabel && (
          <span className="relative z-10 ms-auto rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (showLabel: boolean) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 border-b border-[var(--foreground)]/[0.06] px-4 py-5', !showLabel && 'justify-center px-2')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        {showLabel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h1 className="text-base font-bold tracking-tight">{isAr ? 'عاداتي' : 'Habits'}</h1>
            <p className="text-[10px] text-[var(--foreground)]/40 font-medium">{isAr ? 'منصة التطوير الذاتي' : 'Self-improvement OS'}</p>
          </motion.div>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {showLabel && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--foreground)]/30">
                {isAr ? group.titleAr : group.titleEn}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} showLabel={showLabel} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[var(--foreground)]/[0.06] px-3 py-3 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} showLabel={showLabel} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 start-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background)] shadow-lg border border-[var(--foreground)]/[0.08] lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: isAr ? 280 : -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isAr ? 280 : -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 start-0 z-[var(--z-modal)] w-[280px] bg-[var(--background)] shadow-2xl lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 end-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--foreground)]/[0.05]"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 start-0 z-[var(--z-sticky)]',
          'bg-[var(--background)] border-e border-[var(--foreground)]/[0.06]',
        )}
      >
        {sidebarContent(!collapsed)}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -end-3 z-10',
            'flex h-6 w-6 items-center justify-center rounded-full',
            'bg-[var(--background)] border border-[var(--foreground)]/[0.1]',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'text-[var(--foreground)]/50 hover:text-[var(--foreground)]',
          )}
        >
          {collapsed
            ? (isAr ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)
            : (isAr ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />)
          }
        </button>
      </motion.aside>
    </>
  );
}
