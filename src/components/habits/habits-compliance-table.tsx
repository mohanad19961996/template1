'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTotalCompletionUnits } from '@/lib/habit-completion';
import { useAppStore } from '@/stores/app-store';
import { Habit, todayString } from '@/types/app';
import { CheckCircle2, X, Target, Table2, ChevronLeft, ChevronRight } from 'lucide-react';
import { isHabitScheduledForDate } from '@/components/habits/habit-constants';

function HabitsComplianceTable({ habits, isAr, store, onClose }: { habits: Habit[]; isAr: boolean; store: ReturnType<typeof useAppStore>; onClose: () => void }) {
  const today = todayString();
  const now = new Date();
  const [viewMonth, setViewMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  // Calculate all dates in the current month
  const pageDates = useMemo(() => {
    const { year, month } = viewMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return dates;
  }, [viewMonth]);

  const monthLabel = isAr
    ? `${MONTH_NAMES_AR[viewMonth.month]} ${viewMonth.year}`
    : `${MONTH_NAMES_EN[viewMonth.month]} ${viewMonth.year}`;

  const prevMonth = () => setViewMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
  const nextMonth = () => setViewMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });
  const goCurrentMonth = () => { const n = new Date(); setViewMonth({ year: n.getFullYear(), month: n.getMonth() }); };
  const isCurrentMonth = viewMonth.year === now.getFullYear() && viewMonth.month === now.getMonth();

  // Overall stats
  const overallRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const applicableDates = pageDates.filter(d => d <= today);
    if (applicableDates.length === 0) return 0;
    let total = 0, done = 0;
    habits.forEach(h => {
      applicableDates.forEach(d => {
        if (h.createdAt.split('T')[0] <= d) {
          total++;
          if (store.habitLogs.some(l => l.habitId === h.id && l.date === d && l.completed)) done++;
        }
      });
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [habits, pageDates, today, store.habitLogs]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[var(--z-overlay)] bg-black/60"
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-4 sm:inset-6 lg:inset-8 z-[var(--z-modal)] rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.18] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--foreground)]/[0.1] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
              <Table2 className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{isAr ? 'جدول الالتزام الشهري' : 'Monthly Compliance'}</h2>
              <p className="text-xs text-[var(--foreground)]">{isAr ? `${habits.length} عادة • معدل الالتزام ${overallRate}%` : `${habits.length} habits • ${overallRate}% overall rate`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Month Navigation */}
            <button onClick={prevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--foreground)]/[0.08] transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center min-w-[160px]">
              <p className="text-sm font-bold">{monthLabel}</p>
            </div>
            <button onClick={nextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--foreground)]/[0.08] transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            {!isCurrentMonth && (
              <button onClick={goCurrentMonth}
                className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors">
                {isAr ? 'الشهر الحالي' : 'Current Month'}
              </button>
            )}
            {/* Close */}
            <button onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--foreground)]/[0.08] ms-2 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        {habits.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Target className="h-12 w-12 text-[var(--foreground)] mx-auto mb-3" />
              <p className="text-sm text-[var(--foreground)]">{isAr ? 'لا توجد عادات نشطة' : 'No active habits'}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-20 bg-[var(--color-background)]">
                <tr className="border-b border-[var(--foreground)]/[0.1]">
                  <th className="text-start px-3 py-2 text-[10px] font-bold text-[var(--foreground)]/60 uppercase tracking-wider sticky start-0 z-30 bg-[var(--color-background)] min-w-[140px] max-w-[160px] border-e border-[var(--foreground)]/[0.15]">
                    {isAr ? 'العادة' : 'Habit'}
                  </th>
                  {pageDates.map(d => {
                    const dt = new Date(d + 'T00:00:00');
                    const isToday = d === today;
                    const isFuture = d > today;
                    return (
                      <th key={d} className={cn(
                        'px-0 py-1.5 text-center border-e border-[var(--foreground)]/[0.06]',
                        isToday && 'bg-[var(--color-primary)]/[0.1]',
                        isFuture && 'opacity-40',
                      )} style={{ width: `${100 / (pageDates.length + 4)}%` }}>
                        <span className={cn(
                          'text-[10px] font-bold block',
                          isToday ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]/70'
                        )}>{dt.getDate()}</span>
                      </th>
                    );
                  })}
                  <th className="px-1.5 py-2 text-center min-w-[40px] border-s border-[var(--foreground)]/[0.15]">
                    <span className="text-[9px] font-bold text-[var(--foreground)]/60">{isAr ? 'العدد' : '#'}</span>
                  </th>
                  <th className="px-1.5 py-2 text-center min-w-[45px] border-s border-[var(--foreground)]/[0.15]">
                    <span className="text-[9px] font-bold text-[var(--foreground)]/60">{isAr ? 'المعدل' : '%'}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit, hi) => {
                  const applicableDates = pageDates.filter(d => d <= today && habit.createdAt.split('T')[0] <= d);
                  const completions = applicableDates.filter(d =>
                    store.habitLogs.some(l => l.habitId === habit.id && l.date === d && l.completed)
                  ).length;
                  const rate = applicableDates.length > 0 ? Math.round((completions / applicableDates.length) * 100) : 0;
                  const totalAllTime = getTotalCompletionUnits(habit, store.habitLogs);

                  return (
                    <tr key={habit.id} className={cn(
                      'border-b border-[var(--foreground)]/[0.15] hover:bg-[var(--foreground)]/[0.02] transition-colors',
                      hi % 2 === 1 && 'bg-[var(--foreground)]/[0.015]'
                    )}>
                      <td className="px-2 py-1.5 sticky start-0 z-10 bg-[var(--color-background)] border-e border-[var(--foreground)]/[0.15]">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold truncate block max-w-[120px]">{isAr ? habit.nameAr : habit.nameEn}</span>
                            <span className="text-[8px] font-semibold text-[var(--foreground)]/35">
                              {habit.frequency === 'daily' ? (isAr ? 'يومي' : 'Daily')
                                : habit.frequency === 'weekly' ? (isAr ? 'أسبوعي' : 'Weekly')
                                : habit.frequency === 'monthly' ? (isAr ? 'شهري' : 'Monthly')
                                : (isAr ? 'مخصص' : 'Custom')}
                            </span>
                          </div>
                        </div>
                      </td>
                      {pageDates.map(d => {
                        const isFuture = d > today;
                        const beforeCreated = habit.createdAt.split('T')[0] > d;
                        const isToday = d === today;
                        const scheduled = !beforeCreated && isHabitScheduledForDate(habit, d);
                        const log = !isFuture && !beforeCreated ? store.habitLogs.find(l => l.habitId === habit.id && l.date === d && l.completed) : null;
                        const done = !!log;
                        // Check if done late (outside strict window)
                        const doneLate = done && habit.strictWindow && habit.windowStart && habit.windowEnd && log?.time
                          ? (log.time < habit.windowStart || log.time > habit.windowEnd) : false;

                        return (
                          <td key={d} className={cn(
                            'px-0 py-1 text-center border-e border-[var(--foreground)]/[0.06]',
                            isToday && 'bg-[var(--color-primary)]/[0.1]',
                          )}>
                            {beforeCreated ? (
                              <span className="text-[8px] text-[var(--foreground)]/15">—</span>
                            ) : !scheduled ? (
                              <X className="h-2.5 w-2.5 text-red-300/40 mx-auto" />
                            ) : (isFuture || isToday) && !done ? (
                              <span className="inline-block h-2.5 w-2.5 rounded-full mx-auto" style={{ background: '#9ca3af' }} />
                            ) : done && doneLate ? (
                              <span className="inline-block h-3 w-3 rounded-full bg-amber-500/25 border border-amber-500/40 mx-auto" />
                            ) : done ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="inline-block h-3 w-3 rounded-full bg-red-500/20 border border-red-400/30 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-1 py-1 text-center border-s border-[var(--foreground)]/[0.15]">
                        <span className="text-[11px] font-bold text-[var(--color-primary)]">{totalAllTime}</span>
                      </td>
                      <td className="px-1 py-1 text-center border-s border-[var(--foreground)]/[0.15]">
                        <span className={cn(
                          'text-[11px] font-bold',
                          rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-red-400'
                        )}>{rate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer summary */}
              <tfoot className="sticky bottom-0 z-20 bg-[var(--color-background)]">
                <tr className="border-t-2 border-[var(--foreground)]/[0.1]">
                  <td className="px-2 py-1.5 sticky start-0 z-30 bg-[var(--color-background)] border-e border-[var(--foreground)]/[0.15]">
                    <span className="text-[10px] font-bold text-[var(--foreground)]/60 uppercase">{isAr ? 'الإجمالي' : 'Total'}</span>
                  </td>
                  {pageDates.map(d => {
                    const isFuture = d > today;
                    const dayHabits = habits.filter(h => h.createdAt.split('T')[0] <= d);
                    const dayDone = isFuture ? 0 : dayHabits.filter(h =>
                      store.habitLogs.some(l => l.habitId === h.id && l.date === d && l.completed)
                    ).length;
                    const dayTotal = dayHabits.length;
                    const dayRate = dayTotal > 0 && !isFuture ? Math.round((dayDone / dayTotal) * 100) : 0;
                    const isToday = d === today;
                    return (
                      <td key={d} className={cn('px-0 py-1 text-center border-e border-[var(--foreground)]/[0.06]', isToday && 'bg-[var(--color-primary)]/[0.1]')}>
                        {!isFuture && dayTotal > 0 ? (
                          <span className={cn(
                            'text-[10px] font-bold',
                            dayRate >= 80 ? 'text-emerald-500' :
                            dayRate >= 50 ? 'text-amber-500' :
                            'text-red-400/70'
                          )}>{dayDone}/{dayTotal}</span>
                        ) : (
                          <span className="text-[10px] text-[var(--foreground)]">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-1 py-1 text-center border-s border-[var(--foreground)]/[0.15]">
                    <span className="text-[10px] font-bold text-[var(--color-primary)]">
                      {habits.reduce((sum, h) => sum + getTotalCompletionUnits(h, store.habitLogs), 0)}
                    </span>
                  </td>
                  <td className="px-1 py-1 text-center border-s border-[var(--foreground)]/[0.15]">
                    <span className={cn(
                      'text-[10px] font-bold',
                      overallRate >= 80 ? 'text-emerald-500' : overallRate >= 50 ? 'text-amber-500' : 'text-red-400'
                    )}>{overallRate}%</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 px-5 py-2.5 border-t border-[var(--foreground)]/[0.1] shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] text-[var(--foreground)]/70 font-semibold">{isAr ? 'في الوقت' : 'On time'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <span className="text-[10px] text-[var(--foreground)]/70 font-semibold">{isAr ? 'متأخر' : 'Late'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500/20 border border-red-400/30" />
            <span className="text-[10px] text-[var(--foreground)]/70 font-semibold">{isAr ? 'فائت' : 'Missed'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#9ca3af' }} />
            <span className="text-[10px] text-[var(--foreground)]/70 font-semibold">{isAr ? 'قادم' : 'Upcoming'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <X className="h-2.5 w-2.5 text-red-300/40" />
            <span className="text-[10px] text-[var(--foreground)]/70 font-semibold">{isAr ? 'غير مجدول' : 'Not scheduled'}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default HabitsComplianceTable;
