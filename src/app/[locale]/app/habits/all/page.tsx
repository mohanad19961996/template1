'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import {
  Habit, HabitLog, HabitFrequency, WeekDay, todayString, parseLocalDate, formatLocalDate, resolveHabitColor,
} from '@/types/app';
import {
  Search, X, ChevronLeft, ChevronRight, Flame, Target, Clock, Eye,
  CalendarDays, Repeat, Filter, Calendar as CalendarIcon, ListChecks, Archive,
  Activity, Heart, Brain, BookOpen, Dumbbell, Moon, Sun, Coffee, Droplets,
  Star, Zap, PenTool, Music, Camera, Code, Headphones, Smile, TreePine, Wind, Shield,
} from 'lucide-react';

// ── Icon map ──
const ICON_MAP: Record<string, React.ElementType> = {
  Activity, Heart, Brain, BookOpen, Dumbbell, Moon, Sun, Coffee, Droplets,
  Flame, Target, Zap, Star, Clock, PenTool, Music, Camera, Code,
  Headphones, Smile, TreePine, Wind, Eye, Shield,
};

const FREQ_LABELS: Record<string, { en: string; ar: string }> = {
  daily: { en: 'Daily', ar: 'يومي' },
  weekly: { en: 'Weekly', ar: 'أسبوعي' },
  monthly: { en: 'Monthly', ar: 'شهري' },
  custom: { en: 'Custom', ar: 'مخصص' },
};

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  health: { en: 'Health', ar: 'الصحة' },
  fitness: { en: 'Fitness', ar: 'اللياقة' },
  learning: { en: 'Learning', ar: 'التعلم' },
  productivity: { en: 'Productivity', ar: 'الإنتاجية' },
  mindfulness: { en: 'Mindfulness', ar: 'الوعي' },
  social: { en: 'Social', ar: 'اجتماعي' },
  creativity: { en: 'Creativity', ar: 'الإبداع' },
  finance: { en: 'Finance', ar: 'المالية' },
  nutrition: { en: 'Nutrition', ar: 'التغذية' },
  sleep: { en: 'Sleep', ar: 'النوم' },
  other: { en: 'Other', ar: 'أخرى' },
};

const DAY_LABELS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};

const MONTH_LABELS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const FULL_MONTH_LABELS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

function getScheduleDescription(habit: Habit, isAr: boolean): string {
  const lang = isAr ? 'ar' : 'en';
  if (habit.frequency === 'daily') return isAr ? 'كل يوم' : 'Every day';
  if (habit.frequency === 'weekly' && habit.customDays?.length) {
    return habit.customDays.map(d => DAY_LABELS[lang][d]).join(', ');
  }
  if (habit.frequency === 'monthly') {
    if (habit.customMonthDays?.length) {
      return (isAr ? 'يوم ' : 'Day ') + habit.customMonthDays.join(', ');
    }
    return isAr ? 'شهري' : 'Monthly';
  }
  if (habit.frequency === 'custom') {
    if (habit.customScheduleType === 'weekdays' && habit.customDays?.length) {
      return habit.customDays.map(d => DAY_LABELS[lang][d]).join(', ');
    }
    if (habit.customScheduleType === 'monthdays' && habit.customMonthDays?.length) {
      return (isAr ? 'يوم ' : 'Day ') + habit.customMonthDays.join(', ');
    }
    if (habit.customScheduleType === 'yeardays' && habit.customYearDays?.length) {
      return habit.customYearDays.map(yd => `${MONTH_LABELS[lang][yd.month]} ${yd.day}`).join(', ');
    }
    return isAr ? 'مخصص' : 'Custom';
  }
  return FREQ_LABELS[habit.frequency]?.[lang] ?? '';
}

// ── Yearly Heatmap Component ──
function YearlyHeatmap({ habits, logs, year, isAr }: { habits: Habit[]; logs: HabitLog[]; year: number; isAr: boolean }) {
  const lang = isAr ? 'ar' : 'en';
  const today = todayString();

  // Build daily completion data for the year
  const dailyData = useMemo(() => {
    const data: Record<string, { total: number; completed: number }> = {};
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Initialize all days
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = formatLocalDate(d);
      data[key] = { total: 0, completed: 0 };
    }

    // For each habit, figure out which days it was scheduled and whether completed
    for (const habit of habits) {
      if (habit.archived) continue;
      const createdDate = habit.createdAt ? habit.createdAt.slice(0, 10) : '';

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = formatLocalDate(d);
        if (key > today) continue;
        if (createdDate && key < createdDate) continue;

        const dow = d.getDay() as WeekDay;
        const dayOfMonth = d.getDate();
        const month = d.getMonth();
        let scheduled = false;

        if (habit.frequency === 'daily') scheduled = true;
        else if (habit.frequency === 'weekly') scheduled = habit.customDays?.includes(dow) ?? false;
        else if (habit.frequency === 'monthly') scheduled = habit.customMonthDays?.includes(dayOfMonth) ?? false;
        else if (habit.frequency === 'custom') {
          if (habit.customScheduleType === 'weekdays') scheduled = habit.customDays?.includes(dow) ?? false;
          else if (habit.customScheduleType === 'monthdays') scheduled = habit.customMonthDays?.includes(dayOfMonth) ?? false;
          else if (habit.customScheduleType === 'yeardays') scheduled = habit.customYearDays?.some(yd => yd.month === month && yd.day === dayOfMonth) ?? false;
        }

        if (scheduled) {
          data[key].total++;
          const hasLog = logs.some(l => l.habitId === habit.id && l.date === key && l.completed);
          if (hasLog) data[key].completed++;
        }
      }
    }
    return data;
  }, [habits, logs, year, today]);

  // Build week grid (columns = weeks, rows = days)
  const weeks = useMemo(() => {
    const result: { date: string; rate: number; total: number; completed: number; inYear: boolean; isFuture: boolean }[][] = [];
    const jan1 = new Date(year, 0, 1);
    const startDow = jan1.getDay(); // 0=Sun
    // Start from the Sunday of the week containing Jan 1
    const start = new Date(jan1);
    start.setDate(start.getDate() - startDow);

    let currentWeek: typeof result[0] = [];
    const endLimit = new Date(year + 1, 0, 7); // go a bit past Dec 31

    for (let d = new Date(start); d < endLimit; d.setDate(d.getDate() + 1)) {
      const key = formatLocalDate(d);
      const inYear = d.getFullYear() === year;
      const isFuture = key > today;
      const dd = dailyData[key];
      const rate = dd && dd.total > 0 ? dd.completed / dd.total : -1; // -1 = no habits scheduled
      currentWeek.push({ date: key, rate, total: dd?.total ?? 0, completed: dd?.completed ?? 0, inYear, isFuture });
      if (currentWeek.length === 7) {
        // Only include weeks that have at least one day in the year
        if (currentWeek.some(c => c.inYear)) result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0 && currentWeek.some(c => c.inYear)) {
      while (currentWeek.length < 7) currentWeek.push({ date: '', rate: -1, total: 0, completed: 0, inYear: false, isFuture: true });
      result.push(currentWeek);
    }
    return result;
  }, [year, dailyData, today]);

  // Month label positions
  const monthPositions = useMemo(() => {
    const positions: { month: number; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      for (const cell of week) {
        if (!cell.inYear || !cell.date) continue;
        const m = parseInt(cell.date.split('-')[1], 10) - 1;
        if (m !== lastMonth) {
          positions.push({ month: m, weekIndex: wi });
          lastMonth = m;
        }
        break;
      }
    });
    return positions;
  }, [weeks]);

  const getCellColor = (rate: number, inYear: boolean, isFuture: boolean) => {
    if (!inYear || isFuture) return 'bg-[var(--foreground)]/[0.03]';
    if (rate < 0) return 'bg-[var(--foreground)]/[0.05]'; // no habits scheduled
    if (rate === 0) return 'bg-red-500/20';
    if (rate < 0.5) return 'bg-orange-500/40';
    if (rate < 1) return 'bg-emerald-500/50';
    return 'bg-emerald-500/80';
  };

  // Stats
  const stats = useMemo(() => {
    let totalScheduled = 0, totalCompleted = 0, perfectDays = 0, zeroDays = 0;
    Object.entries(dailyData).forEach(([key, d]) => {
      if (key > today || d.total === 0) return;
      totalScheduled += d.total;
      totalCompleted += d.completed;
      if (d.completed === d.total) perfectDays++;
      if (d.completed === 0) zeroDays++;
    });
    return {
      rate: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
      totalCompleted,
      totalScheduled,
      perfectDays,
      zeroDays,
    };
  }, [dailyData, today]);

  const [hoveredCell, setHoveredCell] = useState<{ date: string; rate: number; total: number; completed: number } | null>(null);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: isAr ? 'معدل الإنجاز' : 'Completion Rate', value: `${stats.rate}%`, color: 'text-emerald-500' },
          { label: isAr ? 'المهام المنجزة' : 'Completed', value: `${stats.totalCompleted}/${stats.totalScheduled}`, color: 'text-blue-500' },
          { label: isAr ? 'أيام مثالية' : 'Perfect Days', value: `${stats.perfectDays}`, color: 'text-amber-500' },
          { label: isAr ? 'أيام فارغة' : 'Zero Days', value: `${stats.zeroDays}`, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3 bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.15]">
            <div className={cn('text-lg font-bold', s.color)}>{s.value}</div>
            <div className="text-[11px] text-[var(--foreground)]/60 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto rounded-xl border border-[var(--foreground)]/[0.15] p-4 bg-[var(--foreground)]/[0.02]">
        {/* Month labels */}
        <div className="flex gap-[2px] mb-1 ms-6">
          {monthPositions.map((mp, i) => {
            const nextPos = monthPositions[i + 1]?.weekIndex ?? weeks.length;
            const span = nextPos - mp.weekIndex;
            return (
              <div key={mp.month} className="text-[10px] font-medium text-[var(--foreground)]/50" style={{ width: span * 13 + (span - 1) * 2 }}>
                {MONTH_LABELS[lang][mp.month]}
              </div>
            );
          })}
        </div>

        {/* Day labels + grid */}
        <div className="flex gap-0">
          {/* Day of week labels */}
          <div className="flex flex-col gap-[2px] me-1 pt-0">
            {[0, 1, 2, 3, 4, 5, 6].map(d => (
              <div key={d} className="h-[13px] flex items-center text-[9px] font-medium text-[var(--foreground)]/40" style={{ width: 20 }}>
                {d % 2 === 1 ? DAY_LABELS[lang][d] : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={cn(
                      'h-[13px] w-[13px] rounded-[3px] transition-all duration-150',
                      getCellColor(cell.rate, cell.inYear, cell.isFuture),
                      cell.inYear && !cell.isFuture && 'hover:ring-2 hover:ring-[var(--color-primary)]/40 cursor-pointer',
                    )}
                    onMouseEnter={() => cell.inYear && !cell.isFuture ? setHoveredCell(cell) : setHoveredCell(null)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend + tooltip */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--foreground)]/50">
            <span>{isAr ? 'أقل' : 'Less'}</span>
            <div className="h-[11px] w-[11px] rounded-[2px] bg-red-500/20" />
            <div className="h-[11px] w-[11px] rounded-[2px] bg-orange-500/40" />
            <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-500/50" />
            <div className="h-[11px] w-[11px] rounded-[2px] bg-emerald-500/80" />
            <span>{isAr ? 'أكثر' : 'More'}</span>
            <span className="ms-2 text-[var(--foreground)]/30">|</span>
            <div className="h-[11px] w-[11px] rounded-[2px] bg-[var(--foreground)]/[0.05]" />
            <span>{isAr ? 'لا عادات' : 'No habits'}</span>
          </div>
          {hoveredCell && (
            <div className="text-[11px] font-medium text-[var(--foreground)]/70">
              {hoveredCell.date}: {hoveredCell.completed}/{hoveredCell.total} ({hoveredCell.total > 0 ? Math.round(hoveredCell.completed / hoveredCell.total * 100) : 0}%)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AllHabitsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();

  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [yearView, setYearView] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const allHabits = useMemo(() => {
    return store.habits.filter(h => {
      if (h.archived !== showArchived) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return h.nameEn.toLowerCase().includes(q) || h.nameAr.includes(q);
      }
      return true;
    });
  }, [store.habits, showArchived, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<HabitFrequency, Habit[]> = { daily: [], weekly: [], monthly: [], custom: [] };
    for (const h of allHabits) groups[h.frequency].push(h);
    return groups;
  }, [allHabits]);

  const frequencyOrder: HabitFrequency[] = ['daily', 'weekly', 'monthly', 'custom'];

  const totalActive = store.habits.filter(h => !h.archived).length;
  const totalArchived = store.habits.filter(h => h.archived).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'كل العادات' : 'All Habits'}</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            {isAr
              ? `${totalActive} عادة نشطة${totalArchived > 0 ? ` · ${totalArchived} مؤرشفة` : ''}`
              : `${totalActive} active habit${totalActive !== 1 ? 's' : ''}${totalArchived > 0 ? ` · ${totalArchived} archived` : ''}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search...'}
              className="h-9 w-44 rounded-xl bg-[var(--foreground)]/[0.05] ps-9 pe-3 text-sm border border-[var(--foreground)]/[0.18] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute end-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
              </button>
            )}
          </div>

          {/* Archived toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              'h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5',
              showArchived
                ? 'text-white border-transparent shadow-md'
                : 'text-[var(--foreground)]/70 border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05]',
            )}
            style={showArchived ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}
          >
            <Archive className="h-3.5 w-3.5" />
            {isAr ? 'المؤرشفة' : 'Archived'}
          </button>

          {/* Year view toggle */}
          <button
            onClick={() => setYearView(!yearView)}
            className={cn(
              'h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5',
              yearView
                ? 'text-white border-transparent shadow-md'
                : 'text-[var(--foreground)]/70 border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05]',
            )}
            style={yearView ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {isAr ? 'عرض السنة' : 'Year View'}
          </button>
        </div>
      </div>

      {/* Year heatmap section */}
      {yearView && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Year selector */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setSelectedYear(y => y - 1)} className="h-8 w-8 rounded-lg bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.1] flex items-center justify-center transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-lg font-bold min-w-[60px] text-center">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              disabled={selectedYear >= new Date().getFullYear()}
              className={cn('h-8 w-8 rounded-lg bg-[var(--foreground)]/[0.05] flex items-center justify-center transition-colors',
                selectedYear >= new Date().getFullYear() ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--foreground)]/[0.1]')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <YearlyHeatmap habits={store.habits} logs={store.habitLogs} year={selectedYear} isAr={isAr} />
        </motion.div>
      )}

      {/* Grouped habits */}
      <div className="space-y-6">
        {frequencyOrder.map((freq) => {
          const habits = grouped[freq];
          if (habits.length === 0) return null;
          const freqLabel = isAr ? FREQ_LABELS[freq].ar : FREQ_LABELS[freq].en;
          return (
            <motion.div key={freq} initial="hidden" animate="visible" variants={fadeUp} custom={frequencyOrder.indexOf(freq)}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center h-7 w-7 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.7))' }}>
                  {freq === 'daily' && <Repeat className="h-3.5 w-3.5 text-white" />}
                  {freq === 'weekly' && <CalendarDays className="h-3.5 w-3.5 text-white" />}
                  {freq === 'monthly' && <CalendarIcon className="h-3.5 w-3.5 text-white" />}
                  {freq === 'custom' && <Filter className="h-3.5 w-3.5 text-white" />}
                </div>
                <h2 className="text-base font-bold">{freqLabel}</h2>
                <span className="text-xs text-[var(--foreground)]/50 font-medium">
                  ({habits.length})
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {habits.map((habit, i) => (
                  <HabitCard key={habit.id} habit={habit} index={i} isAr={isAr} store={store} today={today} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {allHabits.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--foreground)]/[0.05]">
            <ListChecks className="h-6 w-6 text-[var(--foreground)]/40" />
          </div>
          <p className="text-sm text-[var(--foreground)]/60 font-medium">
            {showArchived
              ? (isAr ? 'لا توجد عادات مؤرشفة' : 'No archived habits')
              : searchQuery
                ? (isAr ? 'لا توجد نتائج' : 'No results found')
                : (isAr ? 'لا توجد عادات بعد' : 'No habits yet')
            }
          </p>
        </div>
      )}
    </div>
  );
}

// ── Habit Card ──
function HabitCard({ habit, index, isAr, store, today }: { habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string }) {
  const color = resolveHabitColor(habit.color);
  const IconComp = ICON_MAP[habit.icon] || Activity;
  const streak = store.getHabitStreak(habit.id);
  const stats = store.getHabitStats(habit.id);
  const schedule = getScheduleDescription(habit, isAr);
  const catLabel = isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category);
  const isDoneToday = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);

  return (
    <motion.div variants={fadeUp} custom={index}>
      <Link href={`/app/habits?openHabit=${habit.id}`} className="block group">
        <div
          className={cn(
            'rounded-2xl border border-[var(--foreground)]/[0.15] p-4 transition-all duration-200',
            'hover:shadow-lg hover:border-[var(--foreground)]/[0.18] hover:-translate-y-0.5',
            'bg-[var(--color-background)]',
            habit.archived && 'opacity-60',
          )}
        >
          {/* Top row: icon + name + today status */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ background: `${color}15`, color }}>
              <IconComp className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold truncate">{isAr ? habit.nameAr : habit.nameEn}</h3>
                {isDoneToday && (
                  <div className="shrink-0 h-5 w-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[var(--foreground)]/50 font-medium mt-0.5">{catLabel}</p>
            </div>
          </div>

          {/* Schedule */}
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--foreground)]/60">
            <Clock className="h-3 w-3" />
            <span className="font-medium">{schedule}</span>
            {habit.windowStart && habit.windowEnd && (
              <span className="text-[var(--foreground)]/40 ms-1">
                {habit.windowStart} - {habit.windowEnd}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-3 flex items-center gap-3 text-[11px]">
            {streak.current > 0 && (
              <div className="flex items-center gap-1 text-orange-500 font-bold">
                <Flame className="h-3 w-3" />
                {streak.current}
              </div>
            )}
            <div className="flex items-center gap-1 text-[var(--foreground)]/50 font-medium">
              <Target className="h-3 w-3" />
              {stats.completionRate}%
            </div>
            <div className="flex items-center gap-1 text-[var(--foreground)]/50 font-medium">
              <ListChecks className="h-3 w-3" />
              {stats.totalCompletions}
            </div>
          </div>

          {/* Mini frequency badge */}
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold"
              style={{ background: `${color}12`, color }}
            >
              {isAr ? FREQ_LABELS[habit.frequency].ar : FREQ_LABELS[habit.frequency].en}
            </span>
            {habit.priority === 'high' && (
              <span className="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-red-500 bg-red-500/10">
                {isAr ? 'عالي' : 'High'}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
