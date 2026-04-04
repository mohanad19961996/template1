'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Menu, Moon, Sun, Globe, PanelLeftClose, PanelLeftOpen, CheckCircle2, Timer, Pause, Play, ListChecks, ArrowRight, ChevronDown } from 'lucide-react';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';
import { Link } from '@/i18n/navigation';
import { useTimerDisplay } from '@/lib/use-timer-display';

import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Habit, WeekDay, todayString, parseLocalDate, resolveHabitColor, formatTimerDuration } from '@/types/app';

const NAV_DROPDOWN_EASE = [0.16, 1, 0.3, 1] as const;

const navDropdownMotion = {
  initial: { opacity: 0, y: 12, scale: 0.94 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.97 },
  transition: { duration: 0.28, ease: NAV_DROPDOWN_EASE },
};

const NAV_DROPDOWN_LEAVE_MS = 100;

function useNavbarDropdownHover() {
  const [open, setOpen] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  }, []);

  const onEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setOpen(true);
  };

  const onLeave = () => {
    leaveTimerRef.current = setTimeout(() => setOpen(false), NAV_DROPDOWN_LEAVE_MS);
  };

  return { open, onEnter, onLeave };
}

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

  // Scroll progress + sticky depth
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      setHeaderScrolled(scrollTop > 6);
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight <= 0) { setScrollProgress(0); return; }
      setScrollProgress(Math.min(100, Math.round((scrollTop / scrollHeight) * 100)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Get page title from pathname
  const segment = pathname.split('/').pop() || 'app';
  const titles: Record<string, { en: string; ar: string }> = {
    app: { en: 'Dashboard', ar: 'لوحة التحكم' },
    habits: { en: '', ar: '' },
    timers: { en: 'Timers', ar: 'المؤقتات' },
    settings: { en: 'Settings', ar: 'الإعدادات' },
  };
  const pageTitle = titles[segment] || titles.app;

  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--z-sticky)] flex flex-col transition-[box-shadow,background-color] duration-300 ease-out',
        headerScrolled &&
          'shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12),0_4px_24px_-4px_rgba(var(--color-primary-rgb),0.07)] dark:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.45)]',
      )}
      style={{
        background: 'color-mix(in srgb, var(--color-background) 88%, transparent)',
        backdropFilter: 'saturate(1.15) blur(14px)',
        WebkitBackdropFilter: 'saturate(1.15) blur(14px)',
      }}
    >
      {/* Scroll progress — slim accent track */}
      <div
        className="relative h-[3px] w-full overflow-hidden"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.12), transparent)' }}
      >
        <div
          className="h-full rounded-e-full"
          style={{
            width: `${scrollProgress}%`,
            maxWidth: '100%',
            background: 'linear-gradient(90deg, rgb(var(--color-primary-rgb) / 0.65), var(--color-primary))',
            boxShadow: '0 0 14px rgb(var(--color-primary-rgb) / 0.45)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* Main navbar */}
      <div className="flex min-h-[3.5rem] sm:min-h-[4.5rem] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button — hidden on lg+ (sidebar visible) */}
          <div className="lg:hidden">
            <motion.button
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.92 }}
              onClick={onOpenMobile}
              className="h-10 w-10 sm:h-11 sm:w-11 icon-btn"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Desktop sidebar toggle */}
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleSidebar}
            className={cn(
              'hidden lg:flex items-center gap-2 h-10 rounded-xl cursor-pointer',
              'border transition-all duration-200',
              'px-3.5',
              'border-[rgba(var(--color-primary-rgb)/0.18)] text-[var(--foreground)]/60',
              'hover:border-[rgba(var(--color-primary-rgb)/0.35)] hover:text-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb)/0.07)]',
              'hover:shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.12)]',
            )}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <>
                <PanelLeftOpen className="h-4 w-4" />
                <span className="text-[13px] font-semibold tracking-tight">{isAr ? 'القائمة' : 'Menu'}</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-[13px] font-semibold tracking-tight">{isAr ? 'إخفاء' : 'Hide'}</span>
              </>
            )}
          </motion.button>

          {/* Page title */}
          {(isAr ? pageTitle.ar : pageTitle.en) && (
            <div className="flex min-w-0 items-center gap-2.5">
              <motion.h1
                key={segment}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="truncate border-s-[3px] border-[var(--color-primary)] ps-3 text-xl font-bold tracking-tight text-[var(--foreground)]"
              >
                {isAr ? pageTitle.ar : pageTitle.en}
              </motion.h1>
            </div>
          )}
        </div>

        {/* Right side — grouped status strip + actions */}
        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
          <div
            className="hidden min-w-0 items-center gap-2 rounded-[14px] border border-[rgba(var(--color-primary-rgb)/0.1)] bg-[rgba(var(--color-primary-rgb)/0.035)] px-2 py-1 sm:flex sm:gap-2.5 md:gap-3 md:px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            <NavTimerStatus isAr={isAr} />
            <span
              className="hidden md:block h-7 w-px shrink-0 bg-[rgba(var(--color-primary-rgb)/0.12)] dark:bg-white/10"
              aria-hidden
            />
            <HabitProgress isAr={isAr} />
            <span
              className="hidden md:block h-7 w-px shrink-0 bg-[rgba(var(--color-primary-rgb)/0.12)] dark:bg-white/10"
              aria-hidden
            />
            <LiveClock isAr={isAr} />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeSwitcher />
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.94 }}
              onClick={switchLocale}
              className="icon-btn !h-10 sm:!h-11 !w-auto cursor-pointer gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.08em]"
              aria-label="Switch language"
            >
              <Globe className="h-4 w-4 opacity-60" strokeWidth={2.25} />
              <motion.span
                key={locale}
                initial={{ y: 6, opacity: 0, filter: 'blur(4px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {langLabel}
              </motion.span>
            </motion.button>

            {mounted && (
              <motion.button
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={toggleDark}
                className="group icon-btn relative h-10 w-10 sm:h-11 sm:w-11 cursor-pointer overflow-hidden"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 20%, rgba(var(--color-primary-rgb) / 0.2), transparent 55%)',
                  }}
                />
                <motion.div
                  key={theme}
                  className="relative"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                >
                  {isDark ? <Sun className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.25} /> : <Moon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.25} />}
                </motion.div>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(var(--color-primary-rgb) / 0.16), transparent)',
        }}
        aria-hidden
      />
    </header>
  );
}

/* ── Live Clock ── */
function LiveClock({ isAr }: { isAr: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const hours = now.getHours();
  const h12 = hours % 12 || 12;
  const period = hours >= 12 ? 'PM' : 'AM';
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const dayName = now.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'long' });
  const dd = String(now.getDate()).padStart(2, '0');
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'hidden md:flex flex-col items-center justify-center gap-0.5 px-3.5 py-1.5 rounded-xl select-none cursor-default',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        hovered && 'z-50 scale-[1.08] rounded-2xl shadow-2xl sm:scale-[1.12]',
      )}
      style={{
        background: hovered ? 'var(--color-background)' : 'rgba(var(--color-primary-rgb) / 0.04)',
        border: `1px solid rgba(var(--color-primary-rgb) / ${hovered ? '0.25' : '0.18'})`,
        boxShadow: hovered
          ? '0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)'
          : '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.08)',
        transformOrigin: 'center top',
      }}
    >
      {/* Time row — force LTR so digits never reverse in RTL */}
      <div className="flex items-center gap-0.5 font-mono tabular-nums" dir="ltr">
        <span className="text-sm font-extrabold tracking-tight text-[var(--foreground)]">{String(h12).padStart(2, '0')}</span>
        <span className="text-sm font-extrabold text-[var(--color-primary)] animate-pulse">:</span>
        <span className="text-sm font-extrabold tracking-tight text-[var(--foreground)]">{mm}</span>
        <span className="text-sm font-extrabold text-[var(--color-primary)] animate-pulse">:</span>
        <span className="text-sm font-extrabold tracking-tight text-[var(--foreground)]/40">{ss}</span>
        <span className="text-[10px] font-bold text-[var(--color-primary)] ms-1 bg-[rgba(var(--color-primary-rgb)/0.10)] px-1.5 py-0.5 rounded-md">{period}</span>
      </div>
      {/* Date row */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="font-bold text-[var(--color-primary)]">{dayName}</span>
        <span className="font-semibold text-[var(--foreground)]/60 font-mono tabular-nums">{dd}/{mo}/{year}</span>
      </div>
    </div>
  );
}

/* ── Habit Schedule Helper ── */
function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
  if (habit.frequency === 'daily') return true;
  const d = parseLocalDate(dateStr);
  if (habit.frequency === 'weekly') {
    const dayOfWeek = d.getDay() as WeekDay;
    if (habit.customDays?.length) return habit.customDays.includes(dayOfWeek);
    return dayOfWeek === 0;
  }
  if (habit.frequency === 'monthly') {
    if (habit.customMonthDays?.length) return habit.customMonthDays.includes(d.getDate());
    return d.getDate() === 1;
  }
  if (habit.frequency === 'custom' && habit.customScheduleType) {
    if (habit.customScheduleType === 'weekdays' && habit.customDays?.length) return habit.customDays.includes(d.getDay() as WeekDay);
    if (habit.customScheduleType === 'monthdays' && habit.customMonthDays?.length) return habit.customMonthDays.includes(d.getDate());
    if (habit.customScheduleType === 'yeardays' && habit.customYearDays?.length) return habit.customYearDays.some(yd => yd.month === d.getMonth() && yd.day === d.getDate());
  }
  const scheduleDays = habit.scheduleDays ?? habit.customDays ?? [];
  const scheduleType = habit.scheduleType ?? 'daily';
  if (scheduleType === 'daily') return true;
  if ((scheduleType === 'custom' || scheduleType === 'weekly') && scheduleDays.length > 0) return scheduleDays.includes(d.getDay() as WeekDay);
  return true;
}

/* ── Habit Progress ── */
function HabitProgress({ isAr }: { isAr: boolean }) {
  const store = useAppStore();
  const today = todayString();
  const { open, onEnter, onLeave } = useNavbarDropdownHover();

  const { done, total, scheduled, completedIds } = useMemo(() => {
    const sched = store.habits.filter(h => !h.archived && isHabitScheduledForDate(h, today));
    const cIds = new Set(sched.filter(h => store.habitLogs.some(l => l.habitId === h.id && l.date === today && l.completed)).map(h => h.id));
    return { done: cIds.size, total: sched.length, scheduled: sched, completedIds: cIds };
  }, [store.habits, store.habitLogs, today]);

  const remaining = total - done;
  const allDone = total > 0 && done === total;
  const doneHabits = scheduled.filter(h => completedIds.has(h.id));
  const pendingHabits = scheduled.filter(h => !completedIds.has(h.id));

  return (
    <div className="relative hidden md:block" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {/* Trigger */}
      <motion.div
        whileHover={{ scale: 1.04, y: -1 }}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 px-3.5 py-1.5 rounded-xl select-none cursor-pointer',
          'backdrop-blur-md transition-all duration-300',
          'hover:shadow-[0_6px_20px_rgba(var(--color-primary-rgb)/0.12)]',
          'hover:border-[rgba(var(--color-primary-rgb)/0.3)]',
        )}
        style={{
          background: 'rgba(var(--color-primary-rgb) / 0.04)',
          border: '1px solid rgba(var(--color-primary-rgb) / 0.18)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className={cn('h-3.5 w-3.5', allDone ? 'text-emerald-500' : 'text-[var(--color-primary)]')} />
          <span className={cn('text-sm font-extrabold tabular-nums', allDone ? 'text-emerald-500' : 'text-[var(--foreground)]')}>
            {done}<span className="text-[var(--foreground)]/40">/{total}</span>
          </span>
          <ChevronDown className={cn('h-3 w-3 text-[var(--foreground)]/40 transition-transform duration-300 ease-out', open && 'rotate-180')} />
        </div>
        <div className="text-[11px] font-semibold text-[var(--foreground)]/50">
          {allDone
            ? (isAr ? 'أنجزت الكل ✓' : 'All done ✓')
            : (isAr ? `متبقي ${remaining}` : `${remaining} left`)}
        </div>
      </motion.div>

      {/* Dropdown — pt-1 creates hover bridge; AnimatePresence runs exit before unmount */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="habit-progress-dropdown"
            className={cn('absolute top-full z-50 pt-1', isAr ? 'right-0' : 'left-0')}
            style={{ transformOrigin: isAr ? 'top right' : 'top left' }}
            initial={navDropdownMotion.initial}
            animate={navDropdownMotion.animate}
            exit={navDropdownMotion.exit}
            transition={navDropdownMotion.transition}
          >
            <div
              className="min-w-[280px] overflow-hidden rounded-2xl backdrop-blur-xl"
              style={{
                background: 'var(--color-background)',
                border: '1.5px solid rgba(var(--color-primary-rgb) / 0.15)',
                boxShadow:
                  '0 20px 50px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
            {/* Header — progress */}
            <div className="px-4 pt-3 pb-2.5 border-b border-[var(--foreground)]/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--foreground)]/70">
                  {isAr ? 'تقدم اليوم' : "Today's Progress"}
                </span>
                <span className={cn('text-xs font-extrabold tabular-nums', allDone ? 'text-emerald-500' : 'text-[var(--color-primary)]')}>
                  {total > 0 ? Math.round((done / total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(var(--color-primary-rgb) / 0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${total > 0 ? (done / total) * 100 : 0}%`,
                    background: allDone ? '#22c55e' : 'var(--color-primary)',
                  }}
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto max-h-[300px] p-3">
              {pendingHabits.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 mb-1.5 px-1">
                    {isAr ? `متبقي (${pendingHabits.length})` : `Remaining (${pendingHabits.length})`}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {pendingHabits.map(h => {
                      const hc = resolveHabitColor(h.color);
                      return (
                        <div key={h.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.04] transition-colors">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: hc }} />
                          <span className="text-xs font-semibold text-[var(--foreground)]/80 truncate">
                            {isAr ? h.nameAr : h.nameEn}
                          </span>
                          <div className="ms-auto h-4 w-4 rounded-full border-2 shrink-0" style={{ borderColor: hc, opacity: 0.4 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {doneHabits.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/60 mb-1.5 px-1">
                    {isAr ? `مكتمل (${doneHabits.length})` : `Done (${doneHabits.length})`}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {doneHabits.map(h => (
                      <div key={h.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg opacity-60">
                        <div className="h-2 w-2 rounded-full shrink-0 bg-emerald-500" />
                        <span className="text-xs font-semibold text-[var(--foreground)]/60 truncate line-through">
                          {isAr ? h.nameAr : h.nameEn}
                        </span>
                        <CheckCircle2 className="ms-auto h-4 w-4 text-emerald-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {total === 0 && (
                <p className="text-xs text-[var(--foreground)]/40 text-center py-2">
                  {isAr ? 'لا عادات مجدولة اليوم' : 'No habits scheduled today'}
                </p>
              )}
            </div>

            {/* Footer — navigate to habits page */}
            <div className="px-3 py-2.5 border-t border-[var(--foreground)]/[0.06]">
              <Link
                href="/app/habits"
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold transition-all duration-200',
                  'bg-[var(--color-primary)] text-white',
                  'hover:opacity-90 hover:shadow-md',
                  'active:scale-[0.98]',
                )}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {isAr ? 'عرض كل العادات' : 'View All Habits'}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Timer Status Indicator ── */
function NavTimerStatus({ isAr }: { isAr: boolean }) {
  const store = useAppStore();
  const active = store.activeTimer;
  const { elapsed } = useTimerDisplay(active && active.state !== 'completed' ? active : null);
  const { open, onEnter, onLeave } = useNavbarDropdownHover();

  if (!active || active.state === 'completed') {
    return (
      <div className="relative hidden sm:block" onMouseEnter={onEnter} onMouseLeave={onLeave}>
        <motion.div whileHover={{ scale: 1.04, y: -1 }}>
          <div
            className={cn(
              'flex items-center gap-2 h-10 px-3.5 rounded-xl cursor-pointer',
              'backdrop-blur-md transition-all duration-200',
              'text-[var(--foreground)]/40',
              'hover:text-[var(--color-primary)]',
              'hover:shadow-[0_6px_20px_rgba(var(--color-primary-rgb)/0.12)]',
            )}
            style={{
              background: 'rgba(var(--color-primary-rgb) / 0.04)',
              border: '1px solid rgba(var(--color-primary-rgb) / 0.18)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <Timer className="h-4 w-4" />
            <span className="text-xs font-semibold">{isAr ? 'لا يوجد مؤقت' : 'No timer'}</span>
          </div>
        </motion.div>

        <AnimatePresence>
          {open && (
            <motion.div
              key="timer-empty-dropdown"
              className={cn('absolute top-full z-50 pt-1', isAr ? 'right-0' : 'left-0')}
              style={{ transformOrigin: isAr ? 'top right' : 'top left' }}
              initial={navDropdownMotion.initial}
              animate={navDropdownMotion.animate}
              exit={navDropdownMotion.exit}
              transition={navDropdownMotion.transition}
            >
              <div
                className="min-w-[240px] overflow-hidden rounded-2xl backdrop-blur-xl"
                style={{
                  background: 'var(--color-background)',
                  border: '1.5px solid rgba(var(--color-primary-rgb) / 0.15)',
                  boxShadow:
                    '0 20px 50px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <div className="px-4 py-4 text-center">
                  <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(var(--color-primary-rgb) / 0.08)' }}>
                    <Timer className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <p className="mb-1 text-sm font-bold text-[var(--foreground)]/70">
                    {isAr ? 'لا يوجد مؤقت نشط' : 'No Active Timer'}
                  </p>
                  <p className="text-[11px] text-[var(--foreground)]/40">
                    {isAr ? 'ابدأ مؤقتاً من صفحة المؤقتات' : 'Start a timer from the timers page'}
                  </p>
                </div>
                <div className="border-t border-[var(--foreground)]/[0.06] px-3 py-2.5">
                  <Link
                    href="/app/timers"
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all duration-200',
                      'bg-[var(--color-primary)] text-white',
                      'hover:opacity-90 hover:shadow-md',
                      'active:scale-[0.98]',
                    )}
                  >
                    {isAr ? 'فتح صفحة المؤقتات' : 'Open Timers Page'}
                    <ArrowRight className={cn('h-3 w-3', isAr && 'rotate-180')} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const habitId = active.habitId;
  const habit = habitId ? store.habits.find(h => h.id === habitId) : null;
  const habitName = habit ? (isAr ? habit.nameAr : habit.nameEn) : (isAr ? active.labelAr : active.labelEn) || (isAr ? 'مؤقت' : 'Timer');
  const hc = habit ? resolveHabitColor(habit.color) : 'var(--color-primary)';
  const isPaused = active.state === 'paused';
  const isRunning = active.state === 'running';
  const hasDuration = !!active.targetDuration;
  const targetSecs = active.targetDuration ?? 0;
  const remainingSecs = hasDuration ? Math.max(0, targetSecs - elapsed) : 0;
  const progress = hasDuration && targetSecs > 0 ? Math.min(1, elapsed / targetSecs) : 0;
  const displayTime = hasDuration ? formatTimerDuration(remainingSecs) : formatTimerDuration(elapsed);
  const elapsedDisplay = formatTimerDuration(elapsed);
  const targetDisplay = hasDuration ? formatTimerDuration(targetSecs) : null;
  const modeLabel = active.mode === 'pomodoro'
    ? (isAr ? 'بومودورو' : 'Pomodoro')
    : active.mode === 'countdown'
      ? (isAr ? 'عد تنازلي' : 'Countdown')
      : (isAr ? 'ساعة إيقاف' : 'Stopwatch');

  return (
    <div className="relative hidden sm:block" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {/* Trigger */}
      <motion.div whileHover={{ scale: 1.05, y: -1 }}>
        <div
          className={cn(
            'flex items-center gap-2.5 h-10 px-3.5 rounded-xl cursor-pointer',
            'backdrop-blur-md transition-all duration-200',
            'hover:shadow-[0_6px_20px_rgba(var(--color-primary-rgb)/0.12)]',
          )}
          style={{
            background: 'rgba(var(--color-primary-rgb) / 0.04)',
            border: '1px solid rgba(var(--color-primary-rgb) / 0.18)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div className="relative">
            <Timer className={cn('h-4 w-4', isRunning && 'animate-pulse')} style={{ color: hc }} />
            <div
              className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full border border-[var(--color-background)]"
              style={{ background: isRunning ? '#22c55e' : '#f59e0b' }}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold truncate max-w-[100px] leading-tight" style={{ color: hc }}>
              {habitName}
            </span>
            <div className="flex items-center gap-1">
              {isPaused && <Pause className="h-2.5 w-2.5" style={{ color: '#f59e0b' }} />}
              {isRunning && <Play className="h-2.5 w-2.5" style={{ color: '#22c55e' }} />}
              <span className="text-xs font-bold font-mono tabular-nums" dir="ltr" style={{ color: hc }}>
                {displayTime}
              </span>
            </div>
          </div>
          {hasDuration && (
            <div className="w-8 h-1.5 rounded-full overflow-hidden" style={{ background: `${hc}15` }}>
              <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progress * 100}%`, background: hc }} />
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="timer-active-dropdown"
            className={cn('absolute top-full z-50 pt-1', isAr ? 'right-0' : 'left-0')}
            style={{ transformOrigin: isAr ? 'top right' : 'top left' }}
            initial={navDropdownMotion.initial}
            animate={navDropdownMotion.animate}
            exit={navDropdownMotion.exit}
            transition={navDropdownMotion.transition}
          >
            <div
              className="min-w-[280px] overflow-hidden rounded-2xl backdrop-blur-xl"
              style={{
                background: 'var(--color-background)',
                border: `1.5px solid ${hc}20`,
                boxShadow: `0 20px 50px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08), 0 4px 20px ${hc}12, inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            >
            {/* Header */}
            <div className="px-4 pt-3 pb-2.5 border-b border-[var(--foreground)]/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${hc}15` }}>
                  <Timer className="h-4 w-4" style={{ color: hc }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--foreground)] truncate">{habitName}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: isRunning ? '#22c55e' : '#f59e0b' }} />
                    <span className="text-[11px] font-semibold" style={{ color: isRunning ? '#22c55e' : '#f59e0b' }}>
                      {isRunning ? (isAr ? 'يعمل' : 'Running') : (isAr ? 'متوقف مؤقتاً' : 'Paused')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer display */}
            <div className="px-4 py-3">
              <div className="text-center py-3 rounded-xl" style={{ background: `${hc}08` }}>
                <p className="text-3xl font-extrabold font-mono tabular-nums tracking-tight" dir="ltr" style={{ color: hc }}>
                  {displayTime}
                </p>
                {hasDuration && (
                  <p className="text-[11px] font-semibold text-[var(--foreground)]/50 mt-1">
                    {isAr ? 'من' : 'of'} {targetDisplay}
                  </p>
                )}
              </div>

              {/* Progress bar */}
              {hasDuration && (
                <div className="mt-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: `${hc}12` }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${progress * 100}%`, background: hc }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] font-semibold text-[var(--foreground)]/40">{Math.round(progress * 100)}%</span>
                    <span className="text-[10px] font-semibold text-[var(--foreground)]/40" dir="ltr">
                      {formatTimerDuration(remainingSecs)} {isAr ? 'متبقي' : 'left'}
                    </span>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="flex flex-col gap-1.5 mt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--foreground)]/50 font-medium">{isAr ? 'الوقت المنقضي' : 'Elapsed'}</span>
                  <span className="font-bold font-mono tabular-nums text-[var(--foreground)]" dir="ltr">{elapsedDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--foreground)]/50 font-medium">{isAr ? 'النوع' : 'Mode'}</span>
                  <span className="font-bold text-[var(--foreground)]">{modeLabel}</span>
                </div>
                {active.mode === 'pomodoro' && active.pomodoroPhase && (
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground)]/50 font-medium">{isAr ? 'المرحلة' : 'Phase'}</span>
                    <span className="font-bold text-[var(--foreground)]">
                      {active.pomodoroPhase === 'work' ? (isAr ? 'عمل' : 'Work') : active.pomodoroPhase === 'short-break' ? (isAr ? 'استراحة قصيرة' : 'Short Break') : (isAr ? 'استراحة طويلة' : 'Long Break')}
                      {active.pomodoroRound ? ` (${active.pomodoroRound})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 mt-3">
                {isRunning ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); store.pauseTimer(); }}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                    style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30' }}
                  >
                    <Pause className="h-3.5 w-3.5" />
                    {isAr ? 'إيقاف مؤقت' : 'Pause'}
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); store.resumeTimer(); }}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                    style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isAr ? 'استئناف' : 'Resume'}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); store.completeTimer(active.sessionId); }}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                  style={{ background: `${hc}12`, color: hc, border: `1px solid ${hc}25` }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isAr ? 'إنهاء' : 'Complete'}
                </button>
              </div>
            </div>

            {/* Footer — navigate */}
            <div className="px-3 py-2.5 border-t border-[var(--foreground)]/[0.06]">
              <Link
                href="/app/timers"
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold transition-all duration-200',
                  'text-[var(--foreground)]/60 hover:text-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb)/0.05)]',
                )}
              >
                {isAr ? 'فتح صفحة المؤقتات' : 'Open Timers Page'}
                <ArrowRight className={cn('h-3 w-3', isAr && 'rotate-180')} />
              </Link>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
