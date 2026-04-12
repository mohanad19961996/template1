'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getDoneRepCountForDate, getTotalCompletionUnits } from '@/lib/habit-completion';
import { useAppStore } from '@/stores/app-store';
import { Habit, todayString, resolveHabitColor } from '@/types/app';
import { X, ChevronLeft, ArrowRight } from 'lucide-react';
import { DAY_LABELS, MONTH_LABELS, getCompletionColor, isHabitScheduledForDate, CompletionColor } from '@/components/habits/habit-constants';
import DayDetailsTooltip from '@/components/habits/day-details-tooltip';

function HabitFullCalendar({ habit, isAr, store, onClose, onBack }: { habit: Habit; isAr: boolean; store: ReturnType<typeof useAppStore>; onClose: () => void; onBack?: () => void }) {
  const today = todayString();
  const createdDate = new Date(habit.createdAt);
  const todayDate = new Date();
  const currentYear = todayDate.getFullYear();
  const currentMonthIdx = todayDate.getMonth();
  const [monthRange, setMonthRange] = useState<1 | 3 | 6 | 12>(12);
  const hc = resolveHabitColor(habit.color);

  // Build months: Jan–Dec for 12M, or subset centered on current month
  const allMonths = useMemo(() => {
    const months: { year: number; month: number }[] = [];
    if (monthRange === 12) {
      for (let m = 0; m < 12; m++) months.push({ year: currentYear, month: m });
    } else if (monthRange === 1) {
      months.push({ year: currentYear, month: currentMonthIdx });
    } else {
      const half = Math.floor(monthRange / 2);
      for (let i = -half; i < monthRange - half; i++) {
        const d = new Date(currentYear, currentMonthIdx + i);
        months.push({ year: d.getFullYear(), month: d.getMonth() });
      }
    }
    return months;
  }, [currentYear, currentMonthIdx, monthRange]);

  const buildMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days: { date: string; day: number; inMonth: boolean; completed: boolean; sessionCount: number; isFuture: boolean; beforeCreated: boolean; color: CompletionColor }[] = [];
    for (let i = 0; i < startPad; i++) {
      days.push({ date: '', day: 0, inMonth: false, completed: false, sessionCount: 0, isFuture: false, beforeCreated: false, color: 'none' });
    }
    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(year, month, d);
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const isFuture = dateStr > today;
      const beforeCreated = dt < new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      const dayLogs = !isFuture && !beforeCreated ? store.habitLogs.filter(l => l.habitId === habit.id && l.date === dateStr) : [];
      const repCount = !isFuture && !beforeCreated ? getDoneRepCountForDate(habit, store.habitLogs, dateStr) : 0;
      const log = dayLogs.find(l => l.completed) ?? dayLogs[0];
      days.push({
        date: dateStr, day: d, inMonth: true, isFuture, beforeCreated,
        completed: repCount > 0 || !!log?.completed,
        sessionCount: repCount,
        color: !beforeCreated ? getCompletionColor(habit, log, dateStr) : 'none',
      });
    }
    return days;
  };

  // Stats (boolean habits: unique completed days — avoids 2× duplicate rows inflating totals / rate)
  const totalDone = getTotalCompletionUnits(habit, store.habitLogs);
  const daysSince = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / 86400000));
  const rate = Math.round((totalDone / daysSince) * 100);
  const handleDismiss = onBack || onClose;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleDismiss}
        className="fixed inset-0 z-[var(--z-overlay)] bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-4 sm:inset-6 lg:inset-8 z-[var(--z-modal)] rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.18] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Accent bar */}
        <div className="h-1 shrink-0" style={{ background: `linear-gradient(90deg, ${hc}, ${hc}cc, ${hc}44)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--foreground)]/[0.15] shrink-0">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-200 border"
                style={{ color: hc, background: `${hc}08`, borderColor: `${hc}15` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${hc}18`; e.currentTarget.style.borderColor = `${hc}30`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}08`; e.currentTarget.style.borderColor = `${hc}15`; }}>
                {isAr ? <ArrowRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {isAr ? 'رجوع' : 'Back'}
              </button>
            )}
            <div className="h-5 w-5 rounded-lg flex items-center justify-center" style={{ background: `${hc}20` }}>
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hc }} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{isAr ? habit.nameAr : habit.nameEn}</h2>
              <p className="text-[11px] text-[var(--foreground)] font-medium">
                {isAr ? `${totalDone} مرة • ${rate}% التزام • ${daysSince} يوم` : `${totalDone} times • ${rate}% rate • ${daysSince} days`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Month range selector */}
            <div className="flex items-center rounded-xl border border-[var(--foreground)]/[0.18] p-1 gap-0.5" style={{ background: 'var(--color-background)' }}>
              {([1, 3, 6, 12] as const).map(r => {
                const active = monthRange === r;
                return (
                  <button key={r} onClick={() => setMonthRange(r)}
                    className={cn('px-3 py-1.5 rounded-lg text-[11px] font-black transition-all duration-200',
                      active
                        ? 'text-white shadow-md'
                        : 'text-[var(--foreground)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05]')}
                    style={active ? { background: `linear-gradient(135deg, ${hc}, ${hc}cc)`, boxShadow: `0 2px 8px ${hc}30` } : undefined}>
                    {r === 1 ? (isAr ? 'شهر' : '1M') : r === 3 ? (isAr ? '٣ أشهر' : '3M') : r === 6 ? (isAr ? '٦ أشهر' : '6M') : (isAr ? 'سنة' : '12M')}
                  </button>
                );
              })}
            </div>
            {/* Legend */}
            <div className="hidden lg:flex items-center gap-3">
              {[
                { color: 'bg-emerald-500', label: isAr ? 'في الوقت' : 'On time' },
                { color: 'bg-amber-500', label: isAr ? 'متأخر' : 'Late' },
                { color: 'bg-red-500', label: isAr ? 'فائت' : 'Missed' },
                { color: 'bg-gray-200 dark:bg-gray-700', label: isAr ? 'قادم' : 'Upcoming' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={cn('h-2.5 w-2.5 rounded-sm', l.color)} />
                  <span className="text-[9px] text-[var(--foreground)] font-semibold">{l.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-sm bg-red-500/8 text-red-400/50 text-[7px] font-black flex items-center justify-center">✕</div>
                <span className="text-[9px] text-[var(--foreground)] font-semibold">{isAr ? 'غير مجدول' : 'N/A'}</span>
              </div>
            </div>
            <button onClick={handleDismiss}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 text-[var(--foreground)]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Year label */}
        <div className="text-center py-3">
          <span className="text-[32px] font-black tabular-nums tracking-tight" style={{ color: hc }}>{currentYear}</span>
        </div>

        {/* Months grid — 4 per row */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 pt-0">
          <div className={cn('grid gap-4 mx-auto',
            monthRange === 1 ? 'grid-cols-1 max-w-[360px]' :
            monthRange === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-[900px]' :
            'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-[1200px]')}>
            {allMonths.map(({ year, month }) => {
              const days = buildMonthDays(year, month);
              const label = new Date(year, month).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'long' });
              const monthNum = month + 1;
              const monthDone = days.filter(d => d.inMonth && d.completed).length;
              const monthApplicable = days.filter(d => d.inMonth && !d.isFuture && !d.beforeCreated).length;
              const monthRate = monthApplicable > 0 ? Math.round((monthDone / monthApplicable) * 100) : 0;
              const isCurrent = year === currentYear && month === currentMonthIdx;
              const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonthIdx);
              return (
                <div key={`${year}-${month}`}
                  className={cn(
                    'rounded-2xl p-3 transition-all duration-300 cursor-default hover:scale-[1.07] hover:z-10 overflow-visible',
                    isCurrent
                      ? 'shadow-lg'
                      : isFutureMonth
                        ? 'opacity-60 hover:opacity-100 hover:shadow-xl'
                        : 'hover:shadow-xl',
                  )}
                  style={{
                    border: isCurrent ? `3px solid ${hc}70` : isFutureMonth ? `2px dashed ${hc}35` : `2.5px solid ${hc}45`,
                    background: isCurrent ? `${hc}0a` : undefined,
                    boxShadow: isCurrent ? `0 4px 24px ${hc}20` : undefined,
                  }}>
                  {/* Month header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black rounded-md px-1.5 py-0.5 text-white tabular-nums" style={{ background: hc }}>
                        {monthNum}/{year}
                      </span>
                      <h3 className="text-[13px] font-black" style={{ color: hc }}>
                        {label}
                      </h3>
                      {isCurrent && (
                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full text-white tracking-wider" style={{ background: hc }}>
                          {isAr ? 'الحالي' : 'NOW'}
                        </span>
                      )}
                    </div>
                    {monthApplicable > 0 ? (
                      <span className={cn(
                        'text-[10px] font-black px-2 py-0.5 rounded-lg tabular-nums',
                        monthRate >= 80 ? 'text-emerald-600 bg-emerald-500/15' :
                        monthRate >= 50 ? 'text-amber-600 bg-amber-500/15' :
                        monthRate > 0 ? 'text-red-500 bg-red-500/15' :
                        'text-[var(--foreground)] bg-[var(--foreground)]/[0.05]'
                      )}>
                        {monthDone}/{monthApplicable}
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-[var(--foreground)]">—</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  {monthApplicable > 0 && (
                    <div className="h-1 rounded-full bg-[var(--foreground)]/[0.05] mb-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${monthRate}%`,
                          background: monthRate >= 80 ? '#22c55e' : monthRate >= 50 ? '#f59e0b' : '#ef4444',
                        }} />
                    </div>
                  )}
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                    {(isAr ? DAY_LABELS.ar : DAY_LABELS.en).map(d => (
                      <div key={d} className="text-center text-[7px] font-black text-[var(--foreground)] uppercase">{d[0]}</div>
                    ))}
                  </div>
                  {/* Days */}
                  <div className="grid grid-cols-7 gap-0.5 overflow-visible">
                    {days.map((day, di) => {
                      const isApplicable = day.inMonth && !day.isFuture && !day.beforeCreated;
                      const isOff = day.inMonth && (day.beforeCreated || day.color === 'not-scheduled');
                      const isToday = day.date === today;
                      return (
                        <DayDetailsTooltip key={di} habit={habit} dateStr={day.date} logs={store.habitLogs} isAr={isAr}>
                        <div
                          className={cn(
                            'h-6 rounded-md flex items-center justify-center text-[9px] font-extrabold transition-colors duration-100 relative overflow-visible',
                            !day.inMonth && 'invisible',
                            isOff && 'bg-red-500/8 text-red-400/50',
                            !isOff && day.isFuture && day.inMonth && 'bg-gray-200 dark:bg-gray-700 text-[var(--foreground)]/50',
                            isApplicable && day.color === 'green' && 'bg-emerald-500 text-white',
                            isApplicable && day.color === 'orange' && 'bg-amber-500 text-white',
                            isApplicable && day.color === 'red' && 'bg-red-500 text-white',
                            isApplicable && day.color === 'none' && !day.completed && 'bg-gray-200 dark:bg-gray-700 text-[var(--foreground)]',
                            isToday && 'ring-2 ring-offset-1 font-black shadow-sm',
                          )}
                          style={isToday ? { ['--tw-ring-color' as string]: hc } : undefined}>
                          {day.inMonth ? (isOff ? '✕' : day.day) : ''}
                          {day.sessionCount > 1 && (
                            <span className="absolute -top-1.5 -end-1.5 z-10 h-3.5 min-w-[14px] px-0.5 rounded-full bg-blue-500 text-white text-[7px] font-black flex items-center justify-center shadow-sm ring-1 ring-white dark:ring-gray-900">{day.sessionCount}x</span>
                          )}
                        </div>
                        </DayDetailsTooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default HabitFullCalendar;
