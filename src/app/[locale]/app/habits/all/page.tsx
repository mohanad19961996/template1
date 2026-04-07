'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  Habit, HabitLog, HabitFrequency, WeekDay, todayString, formatLocalDate, resolveHabitColor,
} from '@/types/app';
import {
  Search, X, ChevronLeft, ChevronRight, Eye,
  CalendarDays, Repeat, Filter, Calendar as CalendarIcon, ListChecks, Archive,
} from 'lucide-react';
import { HabitDetail } from '@/components/habits/habit-detail';

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

  const dailyData = useMemo(() => {
    const data: Record<string, { total: number; completed: number }> = {};
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = formatLocalDate(d);
      data[key] = { total: 0, completed: 0 };
    }
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

  const weeks = useMemo(() => {
    const result: { date: string; rate: number; total: number; completed: number; inYear: boolean; isFuture: boolean }[][] = [];
    const jan1 = new Date(year, 0, 1);
    const startDow = jan1.getDay();
    const start = new Date(jan1);
    start.setDate(start.getDate() - startDow);
    let currentWeek: typeof result[0] = [];
    const endLimit = new Date(year + 1, 0, 7);
    for (let d = new Date(start); d < endLimit; d.setDate(d.getDate() + 1)) {
      const key = formatLocalDate(d);
      const inYear = d.getFullYear() === year;
      const isFuture = key > today;
      const dd = dailyData[key];
      const rate = dd && dd.total > 0 ? dd.completed / dd.total : -1;
      currentWeek.push({ date: key, rate, total: dd?.total ?? 0, completed: dd?.completed ?? 0, inYear, isFuture });
      if (currentWeek.length === 7) {
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

  const monthPositions = useMemo(() => {
    const positions: { month: number; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      for (const cell of week) {
        if (!cell.inYear || !cell.date) continue;
        const m = parseInt(cell.date.split('-')[1], 10) - 1;
        if (m !== lastMonth) { positions.push({ month: m, weekIndex: wi }); lastMonth = m; }
        break;
      }
    });
    return positions;
  }, [weeks]);

  const getCellColor = (rate: number, inYear: boolean, isFuture: boolean) => {
    if (!inYear || isFuture) return 'bg-[var(--foreground)]/[0.03]';
    if (rate < 0) return 'bg-[var(--foreground)]/[0.05]';
    if (rate === 0) return 'bg-red-500/20';
    if (rate < 0.5) return 'bg-orange-500/40';
    if (rate < 1) return 'bg-emerald-500/50';
    return 'bg-emerald-500/80';
  };

  const stats = useMemo(() => {
    let totalScheduled = 0, totalCompleted = 0, perfectDays = 0, zeroDays = 0;
    Object.entries(dailyData).forEach(([key, d]) => {
      if (key > today || d.total === 0) return;
      totalScheduled += d.total; totalCompleted += d.completed;
      if (d.completed === d.total) perfectDays++;
      if (d.completed === 0) zeroDays++;
    });
    return { rate: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0, totalCompleted, totalScheduled, perfectDays, zeroDays };
  }, [dailyData, today]);

  const [hoveredCell, setHoveredCell] = useState<{ date: string; rate: number; total: number; completed: number } | null>(null);

  return (
    <div className="space-y-4">
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
      <div className="overflow-x-auto rounded-xl border border-[var(--foreground)]/[0.15] p-4 bg-[var(--foreground)]/[0.02]">
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
        <div className="flex gap-0">
          <div className="flex flex-col gap-[2px] me-1 pt-0">
            {[0, 1, 2, 3, 4, 5, 6].map(d => (
              <div key={d} className="h-[13px] flex items-center text-[9px] font-medium text-[var(--foreground)]/40" style={{ width: 20 }}>
                {d % 2 === 1 ? DAY_LABELS[lang][d] : ''}
              </div>
            ))}
          </div>
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((cell, di) => (
                  <div key={di}
                    className={cn('h-[13px] w-[13px] rounded-[3px] transition-all duration-150', getCellColor(cell.rate, cell.inYear, cell.isFuture), cell.inYear && !cell.isFuture && 'hover:ring-2 hover:ring-[var(--color-primary)]/40 cursor-pointer')}
                    onMouseEnter={() => cell.inYear && !cell.isFuture ? setHoveredCell(cell) : setHoveredCell(null)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
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
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

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

  // All non-archived habits for the detail modal navigation strip
  const detailAllHabits = useMemo(() => store.habits.filter(h => !h.archived).sort((a, b) => a.order - b.order), [store.habits]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'كل العادات' : 'All Habits'}</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            {isAr
              ? `${totalActive} عادة نشطة${totalArchived > 0 ? ` · ${totalArchived} مؤرشفة` : ''}`
              : `${totalActive} active habit${totalActive !== 1 ? 's' : ''}${totalArchived > 0 ? ` · ${totalArchived} archived` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/40" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search...'}
              className="h-9 w-44 rounded-xl bg-[var(--foreground)]/[0.05] ps-9 pe-3 text-sm border border-[var(--foreground)]/[0.18] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute end-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
              </button>
            )}
          </div>
          <button onClick={() => setShowArchived(!showArchived)}
            className={cn('h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5',
              showArchived ? 'text-white border-transparent shadow-md' : 'text-[var(--foreground)]/70 border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05]')}
            style={showArchived ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
            <Archive className="h-3.5 w-3.5" />
            {isAr ? 'المؤرشفة' : 'Archived'}
          </button>
          <button onClick={() => setYearView(!yearView)}
            className={cn('h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5',
              yearView ? 'text-white border-transparent shadow-md' : 'text-[var(--foreground)]/70 border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05]')}
            style={yearView ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
            <CalendarDays className="h-3.5 w-3.5" />
            {isAr ? 'عرض السنة' : 'Year View'}
          </button>
        </div>
      </div>

      {yearView && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setSelectedYear(y => y - 1)} className="h-8 w-8 rounded-lg bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.1] flex items-center justify-center transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-lg font-bold min-w-[60px] text-center">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} disabled={selectedYear >= new Date().getFullYear()}
              className={cn('h-8 w-8 rounded-lg bg-[var(--foreground)]/[0.05] flex items-center justify-center transition-colors',
                selectedYear >= new Date().getFullYear() ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--foreground)]/[0.1]')}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <YearlyHeatmap habits={store.habits} logs={store.habitLogs} year={selectedYear} isAr={isAr} />
        </motion.div>
      )}

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
                <span className="text-xs text-[var(--foreground)]/50 font-medium">({habits.length})</span>
              </div>
              <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {habits.map((habit, i) => (
                  <HabitCard key={habit.id} habit={habit} index={i} isAr={isAr} onDetail={setDetailHabit} />
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
                : (isAr ? 'لا توجد عادات بعد' : 'No habits yet')}
          </p>
        </div>
      )}

      {/* ── Detail Modal — exact same wrapper + component as habits page ── */}
      <AnimatePresence>
        {detailHabit && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailHabit(null)}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 sm:inset-x-2 md:inset-x-4 top-0 sm:top-[2%] md:top-[3%] z-[var(--z-modal)] md:w-[min(960px,calc(100vw-2rem))] lg:w-[1100px] md:inset-x-0 md:mx-auto max-h-[100vh] sm:max-h-[96vh] md:max-h-[95vh] overflow-y-auto rounded-none sm:rounded-2xl md:rounded-3xl bg-[var(--color-background)] border-0 sm:border border-[var(--foreground)]/[0.18] shadow-2xl"
            >
              <HabitDetail
                habit={detailHabit}
                onClose={() => setDetailHabit(null)}
                onEdit={() => {}}
                onViewFull={() => {}}
                allHabits={detailAllHabits}
                onNavigate={(h) => setDetailHabit(h)}
                onArchive={() => { store.toggleHabitArchive(detailHabit.id); setDetailHabit(null); }}
                onDelete={() => { store.deleteHabit(detailHabit.id); setDetailHabit(null); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Habit Card (compact) ──
function HabitCard({ habit, index, isAr, onDetail }: { habit: Habit; index: number; isAr: boolean; onDetail: (h: Habit) => void }) {
  const color = resolveHabitColor(habit.color);
  const freqLabel = isAr ? FREQ_LABELS[habit.frequency].ar : FREQ_LABELS[habit.frequency].en;
  const name = isAr ? habit.nameAr : habit.nameEn;

  return (
    <motion.div variants={fadeUp} custom={index}>
      <div
        className={cn(
          'rounded-xl border p-2.5 transition-all duration-150 bg-[var(--color-background)]',
          'hover:shadow-md hover:-translate-y-0.5',
          habit.archived && 'opacity-60',
        )}
        style={{ borderColor: `${color}30`, borderInlineStartWidth: 3, borderInlineStartColor: color }}
      >
        <p className="text-[12px] font-bold leading-tight truncate" title={name}>{name}</p>
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold rounded px-1.5 py-px" style={{ background: `${color}12`, color }}>
            {freqLabel}
          </span>
          <button
            type="button"
            onClick={() => onDetail(habit)}
            className="shrink-0 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold transition-all"
            style={{ background: `${color}10`, color, border: `1px solid ${color}18` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.color = color; }}
          >
            <Eye className="h-2.5 w-2.5" />
            {isAr ? 'التفاصيل' : 'Details'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
