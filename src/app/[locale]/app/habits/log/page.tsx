'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import { Habit, HabitLog, todayString, resolveHabitColor, formatLocalDate, parseLocalDate, formatDurationSecs } from '@/types/app';
import { isHabitScheduledForDate, isHabitDoneToday, CATEGORY_LABELS, FREQ_LABELS } from '@/components/habits/habit-constants';
import { getDoneRepCountForDate, sumLoggedDurationSecsOnDate } from '@/lib/habit-completion';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock, ArrowRight,
  Timer, Calendar as CalendarIcon, Target, Filter, ChevronDown,
} from 'lucide-react';

const DAY_NAMES = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};
const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

export default function HabitsLogPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();
  const lang = isAr ? 'ar' : 'en';

  // Selected date — defaults to today
  const [selectedDate, setSelectedDate] = useState(today);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });

  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;
  const pad = (n: number) => String(n).padStart(2, '0');

  // Calendar grid
  const calDays = useMemo(() => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { day: number; date: string; inMonth: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: 0, date: '', inMonth: false });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, date: `${year}-${pad(month + 1)}-${pad(d)}`, inMonth: true });
    }
    return cells;
  }, [calMonth]);

  const prevMonth = () => setCalMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
  const nextMonth = () => setCalMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });
  const goToday = () => { const d = new Date(); setCalMonth({ year: d.getFullYear(), month: d.getMonth() }); setSelectedDate(today); };

  // Count completions per day for calendar dots
  const completionCountForDay = (dateStr: string) => {
    if (!dateStr || dateStr > today) return { done: 0, total: 0 };
    const scheduled = store.habits.filter(h => !h.archived && isHabitScheduledForDate(h, dateStr) && h.createdAt.split('T')[0] <= dateStr);
    const done = scheduled.filter(h => isHabitDoneToday(h, store.habitLogs, dateStr)).length;
    return { done, total: scheduled.length };
  };

  // All habits scheduled for the selected date
  const scheduledHabits = useMemo(() => {
    return store.habits
      .filter(h => !h.archived && isHabitScheduledForDate(h, selectedDate) && h.createdAt.split('T')[0] <= selectedDate)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [store.habits, selectedDate]);

  const doneHabits = useMemo(() => scheduledHabits.filter(h => isHabitDoneToday(h, store.habitLogs, selectedDate)), [scheduledHabits, store.habitLogs, selectedDate]);
  const notDoneHabits = useMemo(() => scheduledHabits.filter(h => !isHabitDoneToday(h, store.habitLogs, selectedDate)), [scheduledHabits, store.habitLogs, selectedDate]);
  const completionRate = scheduledHabits.length > 0 ? Math.round((doneHabits.length / scheduledHabits.length) * 100) : 0;

  // Format selected date label
  const selectedDateLabel = (() => {
    if (selectedDate === today) return isAr ? 'اليوم' : 'Today';
    const d = parseLocalDate(selectedDate);
    return d.toLocaleDateString(isAr ? 'ar-u-nu-latn' : 'en', { weekday: 'long', day: 'numeric', month: 'long' });
  })();

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/app/habits" className="inline-flex items-center gap-1.5 text-sm font-bold mb-3 transition-all duration-300 hover:gap-2.5 group" style={{ color: 'var(--color-primary)' }}>
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5', isAr && 'rotate-180 group-hover:translate-x-0.5')} />
          {isAr ? 'العادات' : 'Habits'}
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.6))' }}>
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{isAr ? 'سجل العادات' : 'Habits Log'}</h1>
            <p className="text-xs font-medium text-[var(--foreground)]/50">{isAr ? 'اختر يوماً لعرض تفاصيل عاداتك' : 'Select a day to view your habit details'}</p>
          </div>
        </div>
      </div>

      {/* Main layout: calendar + day details */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">

        {/* ═══ CALENDAR ═══ */}
        <div className="rounded-2xl border border-[var(--color-primary)]/20 overflow-hidden">
          {/* Month header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(var(--color-primary-rgb) / 0.04)' }}>
            <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-[var(--color-primary)]/10 transition-colors">
              <ChevronLeft className={cn('h-4 w-4 text-[var(--foreground)]/60', isAr && 'rotate-180')} />
            </button>
            <div className="text-center">
              <span className="text-sm font-bold">{MONTH_NAMES[lang][calMonth.month]} {calMonth.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={goToday} className="rounded-lg px-2 py-1 text-[10px] font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors">
                {isAr ? 'اليوم' : 'Today'}
              </button>
              <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-[var(--color-primary)]/10 transition-colors">
                <ChevronRight className={cn('h-4 w-4 text-[var(--foreground)]/60', isAr && 'rotate-180')} />
              </button>
            </div>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-t border-[var(--color-primary)]/10">
            {DAY_NAMES[lang].map(d => (
              <div key={d} className="py-1.5 text-center text-[10px] font-bold text-[var(--foreground)]/40">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 pb-2 px-1">
            {calDays.map((cell, i) => {
              if (!cell.inMonth) return <div key={i} className="h-10" />;
              const isSelected = cell.date === selectedDate;
              const isTodayCell = cell.date === today;
              const isFutureCell = cell.date > today;
              const { done, total } = completionCountForDay(cell.date);
              const allDone = total > 0 && done === total;
              const someDone = done > 0 && done < total;
              const noneDone = total > 0 && done === 0 && !isFutureCell;

              return (
                <button key={i} onClick={() => setSelectedDate(cell.date)}
                  className={cn(
                    'relative h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all text-[12px] font-semibold mx-0.5',
                    isSelected ? 'text-white font-black' : isTodayCell ? 'text-[var(--color-primary)] font-bold' : isFutureCell ? 'text-[var(--foreground)]/25' : 'text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.04]',
                  )}
                  style={isSelected ? { background: 'var(--color-primary)', borderRadius: 8 } : undefined}>
                  {cell.day}
                  {/* Completion dots */}
                  {!isSelected && total > 0 && !isFutureCell && (
                    <div className="flex gap-px absolute bottom-0.5">
                      <span className={cn('h-1 w-1 rounded-full', allDone ? 'bg-emerald-500' : someDone ? 'bg-amber-500' : noneDone ? 'bg-red-400' : 'bg-[var(--foreground)]/15')} />
                    </div>
                  )}
                  {isSelected && total > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 h-3.5 min-w-[14px] rounded-full bg-white text-[8px] font-black flex items-center justify-center" style={{ color: 'var(--color-primary)' }}>{done}/{total}</span>
                  )}
                  {isTodayCell && !isSelected && (
                    <span className="absolute bottom-0.5 h-0.5 w-3 rounded-full bg-[var(--color-primary)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ DAY DETAILS ═══ */}
        <div className="rounded-2xl border border-[var(--color-primary)]/20 overflow-hidden">
          {/* Day header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(var(--color-primary-rgb) / 0.04)' }}>
            <div>
              <p className="text-sm font-bold">{selectedDateLabel}</p>
              <p className="text-[10px] text-[var(--foreground)]/40">{selectedDate}</p>
            </div>
            <div className="flex items-center gap-2">
              {scheduledHabits.length > 0 && (
                <span className={cn('text-xs font-black px-2.5 py-1 rounded-lg', completionRate === 100 ? 'bg-emerald-500/10 text-emerald-600' : completionRate > 0 ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]/40')}
                  style={completionRate > 0 && completionRate < 100 ? { background: 'rgba(var(--color-primary-rgb) / 0.08)' } : undefined}>
                  {doneHabits.length}/{scheduledHabits.length} — {completionRate}%
                </span>
              )}
            </div>
          </div>

          {/* Habits list */}
          <div className="divide-y divide-[var(--color-primary)]/[0.06]">
            {scheduledHabits.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-[var(--foreground)]/15" />
                <p className="text-sm font-medium text-[var(--foreground)]/40">
                  {isFuture
                    ? (isAr ? 'لا توجد عادات مجدولة لهذا اليوم بعد' : 'No habits scheduled for this day yet')
                    : (isAr ? 'لا توجد عادات مجدولة لهذا اليوم' : 'No habits scheduled for this day')}
                </p>
              </div>
            ) : (
              <>
                {/* Done section */}
                {doneHabits.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 px-4 pt-3 pb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {isAr ? 'مكتمل' : 'Completed'} ({doneHabits.length})
                    </p>
                    {doneHabits.map(habit => (
                      <HabitDayRow key={habit.id} habit={habit} date={selectedDate} store={store} isAr={isAr} done />
                    ))}
                  </div>
                )}

                {/* Not done section */}
                {notDoneHabits.length > 0 && !isFuture && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/40 px-4 pt-3 pb-1 flex items-center gap-1">
                      <Circle className="h-3 w-3" />
                      {isToday ? (isAr ? 'متبقي' : 'Remaining') : (isAr ? 'لم يُنجز' : 'Not completed')} ({notDoneHabits.length})
                    </p>
                    {notDoneHabits.map(habit => (
                      <HabitDayRow key={habit.id} habit={habit} date={selectedDate} store={store} isAr={isAr} done={false} />
                    ))}
                  </div>
                )}

                {/* Future — just show scheduled */}
                {isFuture && notDoneHabits.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/35 px-4 pt-3 pb-1 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {isAr ? 'مجدول' : 'Scheduled'} ({notDoneHabits.length})
                    </p>
                    {notDoneHabits.map(habit => (
                      <HabitDayRow key={habit.id} habit={habit} date={selectedDate} store={store} isAr={isAr} done={false} future />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Single Habit Row for a Day ──
function HabitDayRow({ habit, date, store, isAr, done, future }: {
  habit: Habit; date: string; store: ReturnType<typeof useAppStore>; isAr: boolean; done: boolean; future?: boolean;
}) {
  const hc = resolveHabitColor(habit.color);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const catLabel = isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category);
  const freqLabel = isAr ? (FREQ_LABELS[habit.frequency]?.ar ?? habit.frequency) : (FREQ_LABELS[habit.frequency]?.en ?? habit.frequency);
  const hasDuration = !!habit.expectedDuration;
  const logs = store.habitLogs.filter(l => l.habitId === habit.id && l.date === date);
  const totalDuration = logs.reduce((s, l) => s + (l.duration ?? 0), 0);
  const repCount = getDoneRepCountForDate(habit, store.habitLogs, date);
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  return (
    <Link href={`/app/habits/${habit.id}?viewDate=${date}`}
      className="flex items-center gap-3 px-4 py-2.5 transition-all duration-200 group hover:bg-[var(--color-primary)]/[0.04]">
      {/* Status icon */}
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          background: done ? `${hc}15` : future ? 'rgba(var(--color-primary-rgb) / 0.03)' : 'rgba(var(--color-primary-rgb) / 0.04)',
          border: `1.5px solid ${done ? `${hc}30` : 'rgba(var(--color-primary-rgb) / 0.1)'}`,
        }}>
        {done
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          : future
            ? <Target className="h-4 w-4 text-[var(--foreground)]/20" />
            : <Circle className="h-4 w-4 text-[var(--foreground)]/20" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[13px] font-bold truncate transition-colors duration-200 group-hover:text-[var(--color-primary)]', done && 'line-through text-[var(--foreground)]/50', !done && !future && 'text-[var(--foreground)]/70', future && 'text-[var(--foreground)]/35')}>
            {name}
          </span>
          {done && <span className="shrink-0 rounded px-1.5 py-px text-[9px] font-black bg-emerald-500 text-white">{isAr ? 'تم' : 'Done'}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[9px] font-semibold rounded px-1 py-px" style={{ background: `${hc}10`, color: hc }}>{catLabel}</span>
          <span className="text-[9px] font-semibold text-[var(--foreground)]/30">{freqLabel}</span>
          {lastLog?.time && <span className="text-[9px] text-[var(--foreground)]/30 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{lastLog.time}</span>}
          {totalDuration > 0 && <span className="text-[9px] font-bold" style={{ color: hc }}>{formatDurationSecs(totalDuration)}</span>}
          {repCount > 1 && <span className="text-[9px] font-bold" style={{ color: hc }}>{repCount}x</span>}
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className={cn('h-3.5 w-3.5 shrink-0 text-[var(--foreground)]/15 group-hover:text-[var(--color-primary)] transition-all duration-200 group-hover:translate-x-0.5', isAr && 'rotate-180 group-hover:-translate-x-0.5')} />
    </Link>
  );
}
