'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import {
  Plus, CheckCircle2, Circle, Flame, X, Archive, Trash2, Edit3, Eye,
  ChevronLeft, ChevronRight, Target, Clock, BarChart3, ListChecks, Hash,
  Trophy, Activity, Sparkles, ArrowRight, Play, Pause, Square, Timer,
  MapPin, Repeat, Gift, Lightbulb, Maximize2, Hourglass, AlertCircle,
  CalendarDays, Check, Calendar as CalendarIcon, Award, Minus,
} from 'lucide-react';
import {
  getCategoryLabel, getCompletionColor, FREQ_LABELS, CATEGORY_LABELS, DAY_LABELS,
  isWithinWindow, isWindowPassed, isBooleanOutsideWindow, formatCompletionWindow,
  isHabitScheduledForDate, isHabitDoneToday, normalizeDurationToSecs, getHabitTimeStats,
  formatSecs, to12h, CompletionColor, isItemDone, getItemTime, ChecklistStateValue,
  MONTH_LABELS, fadeUp,
} from '@/components/habits/habit-constants';
import { getDoneRepCountForDate, getTotalCompletionUnits, sumLoggedDurationSecsOnDate } from '@/lib/habit-completion';
import {
  Habit, HabitLog, todayString, resolveHabitColor, formatDurationSecs, formatTimerDuration,
  ITEM_COLORS, generateId, parseLocalDate,
} from '@/types/app';
import { useAppStore } from '@/stores/app-store';
import { HabitTimerControls } from '@/components/app/habit-timer-controls';
import { useToast } from '@/components/app/toast-notifications';

export function HabitDetail({ habit, onClose, onEdit, onViewFull, allHabits, onNavigate, onArchive, onDelete }: { habit: Habit; onClose: () => void; onEdit: () => void; onViewFull: () => void; allHabits: Habit[]; onNavigate: (h: Habit) => void; onArchive?: () => void; onDelete?: () => void }) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const toast = useToast();
  const today = todayString();
  const stats = store.getHabitStats(habit.id);
  const streak = store.getHabitStreak(habit.id);
  const timeStats = useMemo(() => getHabitTimeStats(habit, store.habitLogs), [habit, store.habitLogs]);
  const done = isHabitDoneToday(habit, store.habitLogs, today);
  const hasDuration = !!habit.expectedDuration;
  const isCountHabit = habit.trackingType === 'count';
  const dCountTarget = isCountHabit ? (habit.targetValue ?? 1) : 1;
  const dCountUnit = isCountHabit ? (habit.targetUnit ?? 'times') : 'times';
  const dCountValue = isCountHabit
    ? store.habitLogs.filter(l => l.habitId === habit.id && l.date === today).reduce((s, l) => s + (l.value ?? (l.completed ? 1 : 0)), 0)
    : 0;
  const dCountProgress = isCountHabit && dCountTarget > 0 ? Math.min(1, dCountValue / dCountTarget) : 0;
  const habitAge = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / 86400000));
  const hc = resolveHabitColor(habit.color);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const habitNameAr = habit.nameAr || '';
  const habitNameEn = habit.nameEn || '';
  const deleteConfirmTarget = habitNameAr && habitNameEn ? `${habitNameAr} / ${habitNameEn}` : (habitNameAr || habitNameEn);
  const isDeleteConfirmed = deleteConfirmText.trim() === deleteConfirmTarget.trim();

  // Custom timer duration (H:M:S) — defaults to habit's original target
  const [customTimerSecs, setCustomTimerSecs] = useState<number>(habit.expectedDuration || 0);
  const customTimerH = Math.floor(customTimerSecs / 3600);
  const customTimerM = Math.floor((customTimerSecs % 3600) / 60);
  const customTimerS = Math.floor(customTimerSecs % 60);
  const setCustomHMS = (h: number, m: number, s: number) => setCustomTimerSecs(h * 3600 + m * 60 + s);
  // Check if timer is currently active for this habit
  const activeTimer = store.activeTimer;
  const isTimerActive = !!activeTimer && activeTimer.habitId === habit.id && activeTimer.state !== 'completed';

  // First and last completion dates (only dates on or after habit creation)
  const { firstDone, lastDone } = useMemo(() => {
    const createdDateStr = (() => {
      const d = new Date(habit.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const completedDates = store.habitLogs
      .filter(l => l.habitId === habit.id && l.completed && l.date >= createdDateStr)
      .map(l => l.date)
      .sort();
    return {
      firstDone: completedDates.length > 0 ? completedDates[0] : null,
      lastDone: completedDates.length > 0 ? completedDates[completedDates.length - 1] : null,
    };
  }, [habit.id, habit.createdAt, store.habitLogs]);

  // Last 7 days completion for mini heatmap
  // This week (Mon–Sun)
  const weekDays = useMemo(() => {
    const days: { date: string; done: boolean; color: CompletionColor }[] = [];
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const createdDateStr = habit.createdAt.split('T')[0];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (ds < createdDateStr) {
        days.push({ date: ds, done: false, color: 'not-scheduled' });
        continue;
      }
      const rep = getDoneRepCountForDate(habit, store.habitLogs, ds);
      const log = store.habitLogs.find(l => l.habitId === habit.id && l.date === ds && l.completed)
        ?? store.habitLogs.find(l => l.habitId === habit.id && l.date === ds);
      days.push({ date: ds, done: rep > 0 || !!log?.completed, color: getCompletionColor(habit, log, ds) });
    }
    return days;
  }, [habit, store.habitLogs, habit.windowStart, habit.windowEnd]);

  // Today's activity for footer (any logged time or completed); rep badge uses getDoneRepCountForDate
  const todayActivityLogs = useMemo(
    () => store.habitLogs.filter(
      l => l.habitId === habit.id && l.date === today && (normalizeDurationToSecs(l.duration) > 0 || l.completed),
    ),
    [habit.id, today, store.habitLogs],
  );
  const todayLog = todayActivityLogs.length > 0 ? todayActivityLogs[todayActivityLogs.length - 1] : undefined;
  const todayRepCount = useMemo(() => getDoneRepCountForDate(habit, store.habitLogs, today), [habit, today, store.habitLogs]);
  const todayTotalDurationSecs = useMemo(
    () => store.habitLogs
      .filter(l => l.habitId === habit.id && l.date === today)
      .reduce((sum, l) => sum + normalizeDurationToSecs(l.duration), 0),
    [habit.id, today, store.habitLogs],
  );

  // Streak milestones
  const streakGoals = useMemo(() => {
    const goals: { target: number; rewardEn?: string; rewardAr?: string }[] = [];
    if (habit.streakGoal) goals.push({ target: habit.streakGoal, rewardEn: habit.streakRewardEn, rewardAr: habit.streakRewardAr });
    if (habit.streakGoal2) goals.push({ target: habit.streakGoal2, rewardEn: habit.streakRewardEn2, rewardAr: habit.streakRewardAr2 });
    if (habit.streakGoal3) goals.push({ target: habit.streakGoal3, rewardEn: habit.streakRewardEn3, rewardAr: habit.streakRewardAr3 });
    return goals;
  }, [habit]);

  // Month-by-month calendar navigation
  const [calMonth, setCalMonth] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });

  const createdDate = useMemo(() => new Date(habit.createdAt), [habit.createdAt]);

  // Build calendar grid for selected month
  const calendarDays = useMemo(() => {
    const year = calMonth.year;
    const month = calMonth.month;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const today = todayString();

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
        date: dateStr, day: d, inMonth: true, completed: repCount > 0 || !!log?.completed, sessionCount: repCount, isFuture, beforeCreated,
        color: !beforeCreated ? getCompletionColor(habit, log, dateStr) : 'none',
      });
    }
    return days;
  }, [calMonth, habit, habit.windowStart, habit.windowEnd, store.habitLogs, createdDate]);

  const canGoNext = (() => {
    const now = new Date();
    return calMonth.year < now.getFullYear() || (calMonth.year === now.getFullYear() && calMonth.month < now.getMonth());
  })();

  const canGoPrev = (() => {
    return calMonth.year > createdDate.getFullYear() || (calMonth.year === createdDate.getFullYear() && calMonth.month > createdDate.getMonth());
  })();

  const monthLabel = new Date(calMonth.year, calMonth.month).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'long', year: 'numeric' });

  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef<number>(-1);
  const currentIdx = allHabits.findIndex(h => h.id === habit.id);
  const slideDirection = useRef<number>(1);
  if (prevIndexRef.current !== -1 && prevIndexRef.current !== currentIdx) {
    slideDirection.current = currentIdx > prevIndexRef.current ? 1 : -1;
    if (isAr) slideDirection.current *= -1;
  }
  prevIndexRef.current = currentIdx;

  useEffect(() => {
    if (!navRef.current) return;
    const el = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [habit.id]);

  // ── Design 1: Compact Dashboard ──
  const renderCompact = () => {
    const name = isAr ? habit.nameAr : habit.nameEn;
    const description = isAr ? habit.descriptionAr : habit.descriptionEn;
    const catLabel = getCategoryLabel(habit.category, isAr, store.deletedCategories, habit.archived);
    const freqLabel = isAr ? FREQ_LABELS[habit.frequency]?.ar : FREQ_LABELS[habit.frequency]?.en;
    const typeLabel = habit.type === 'positive' ? (isAr ? 'بناء' : 'Build') : (isAr ? 'تجنب' : 'Break');
    const priLabel = isAr ? (habit.priority === 'high' ? 'عالية' : habit.priority === 'medium' ? 'متوسطة' : 'منخفضة') : habit.priority;
    const diffLabel = isAr ? (habit.difficulty === 'hard' ? 'صعبة' : habit.difficulty === 'medium' ? 'متوسطة' : 'سهلة') : habit.difficulty;
    const hasLoop = (isAr ? habit.cueAr : habit.cueEn) || (isAr ? habit.routineAr : habit.routineEn) || (isAr ? habit.rewardAr : habit.rewardEn);
    const hasContext = (isAr ? habit.placeAr : habit.placeEn) || habit.preferredTime || habit.expectedDuration || (habit.windowStart && habit.windowEnd);

    const ai = allHabits.findIndex(h => h.id === habit.id);
    const goPrev = () => ai > 0 && onNavigate(allHabits[ai - 1]);
    const goNext = () => ai < allHabits.length - 1 && onNavigate(allHabits[ai + 1]);
    const canPrev = ai > 0;
    const canNext = ai < allHabits.length - 1;

    return (
      <div className="relative">
        {/* ── Habit Navigation Strip ── */}
        {allHabits.length > 1 && (
          <div className="sticky top-0 z-10" style={{ background: 'var(--color-background)' }}>
            <div className="flex items-stretch border-b border-[var(--foreground)]/[0.18]">
              <button onClick={isAr ? goNext : goPrev} disabled={isAr ? !canNext : !canPrev}
                className={cn('shrink-0 flex items-center justify-center w-8 transition-all duration-150 border-e border-[var(--foreground)]/[0.15]',
                  (isAr ? canNext : canPrev)
                    ? 'text-[var(--foreground)] hover:text-[var(--foreground)]0 hover:bg-[var(--foreground)]/[0.05]'
                    : 'text-[var(--foreground)] cursor-default')}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div ref={navRef} className="flex-1 flex items-stretch overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {allHabits.map((h, idx) => {
                  const isActive = h.id === habit.id;
                  const hc2 = resolveHabitColor(h.color);
                  const nm = isAr ? h.nameAr : h.nameEn;
                  const catLbl = isAr ? (CATEGORY_LABELS[h.category]?.ar ?? h.category) : (CATEGORY_LABELS[h.category]?.en ?? h.category);
                  return (
                    <button key={h.id} data-active={isActive} onClick={() => onNavigate(h)}
                      className={cn(
                        'shrink-0 relative flex flex-col items-center justify-center px-2.5 sm:px-4 py-1.5 sm:py-2 transition-all duration-150 whitespace-nowrap border-b-[2.5px]',
                        idx < allHabits.length - 1 && 'border-e border-e-[var(--foreground)]/[0.15]',
                        isActive ? '' : 'border-b-transparent text-[var(--foreground)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05]'
                      )}
                      style={isActive ? { borderBottomColor: hc2, backgroundColor: `${hc2}15` } : undefined}>
                      <span className={cn('text-[10px] sm:text-sm font-semibold leading-none mb-0.5', !isActive && 'opacity-25')}
                        style={isActive ? { color: hc2 } : undefined}>{catLbl}</span>
                      <span className="flex items-center gap-1 sm:gap-1.5">
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0" style={{ backgroundColor: hc2, opacity: isActive ? 1 : 0.4 }} />
                        <span className="text-xs sm:text-sm font-bold" style={isActive ? { color: 'var(--foreground)' } : undefined}>{nm}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button onClick={isAr ? goPrev : goNext} disabled={isAr ? !canPrev : !canNext}
                className={cn('shrink-0 flex items-center justify-center w-8 transition-all duration-150 border-s border-[var(--foreground)]/[0.15]',
                  (isAr ? canPrev : canNext)
                    ? 'text-[var(--foreground)] hover:text-[var(--foreground)]0 hover:bg-[var(--foreground)]/[0.05]'
                    : 'text-[var(--foreground)] cursor-default')}>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Accent bar */}
        <div className="h-1 rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${hc}, ${hc}cc, ${hc}44)` }} />

        {/* ── TOP: Header + Week Strip + Close ── */}
        <div className="px-3 md:px-5 pt-3 md:pt-4 pb-2 md:pb-3" style={{ background: `linear-gradient(135deg, ${hc}08, ${hc}03, transparent)` }}>
          {/* Header: name + close on top row, action buttons below */}
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${hc}20`, border: `1.5px solid ${hc}30` }}>
              <div className="h-3 w-3 md:h-4 md:w-4 rounded-full" style={{ backgroundColor: hc }} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base md:text-lg font-black tracking-tight truncate">{name}</h2>
              {description && <p className="text-xs md:text-sm text-[var(--foreground)] truncate">{description}</p>}
            </div>
            {/* Close X — always visible */}
            <button onClick={onClose}
              className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center border border-[var(--foreground)]/[0.1] bg-[var(--foreground)]/[0.03] text-[var(--foreground)] hover:text-red-500 hover:bg-red-500/8 active:scale-[0.95]"
              title={isAr ? 'إغلاق' : 'Close'}>
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Action buttons row */}
          <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => {
                const inW = isWithinWindow(habit);
                const wExp = isWindowPassed(habit);
                if (habit.archived) {
                  toast.notifyWarning(isAr ? 'مؤرشفة' : 'Archived', isAr ? 'لا يمكن إكمال عادة مؤرشفة' : 'Cannot complete an archived habit');
                  return;
                }
                if (done) {
                  if (habit.strictWindow && habit.windowStart && habit.windowEnd && wExp) {
                    toast.notifySuccess(isAr ? 'مكتمل بالفعل' : 'Already done', isAr ? 'هذه العادة مكتملة اليوم ولا يمكن التراجع بعد انتهاء النافذة' : 'This habit is done today. Cannot undo after the time window has passed');
                    return;
                  }
                  if (hasDuration) {
                    toast.notifySuccess(isAr ? 'مكتمل بالفعل' : 'Already done', isAr ? 'تم إكمال هذه العادة عبر المؤقت' : 'This habit was completed via the timer');
                    return;
                  }
                  if (isCountHabit) {
                    toast.notifySuccess(isAr ? 'مكتمل بالفعل' : 'Already done', isAr ? 'تم إكمال هذه العادة عبر العداد' : 'This habit was completed via the counter');
                    return;
                  }
                  if (todayLog) { store.deleteHabitLog(todayLog.id); return; }
                  return;
                }
                const sLocked = habit.strictWindow && habit.windowStart && habit.windowEnd && wExp;
                const sNotYet = habit.strictWindow && habit.windowStart && habit.windowEnd && !inW && !wExp;
                if (sLocked) {
                  toast.notifyWarning(isAr ? 'فات الوقت' : 'Window passed', isAr ? `انتهى وقت النافذة (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)})` : `Time window (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)}) has passed`);
                  return;
                }
                if (sNotYet) {
                  toast.notifyInfo(isAr ? 'لم يحن الوقت بعد' : 'Not yet', isAr ? `النافذة تبدأ الساعة ${to12h(habit.windowStart!)}` : `Window starts at ${to12h(habit.windowStart!)}`);
                  return;
                }
                if (hasDuration) {
                  toast.notifyInfo(isAr ? 'استخدم المؤقت' : 'Use timer', isAr ? 'هذه العادة تحتاج مؤقت لإكمالها' : 'This habit requires the timer to complete');
                  return;
                }
                if (isCountHabit) {
                  toast.notifyInfo(isAr ? 'استخدم العداد' : 'Use counter', isAr ? 'هذه العادة تحتاج العداد لإكمالها' : 'This habit requires the counter to complete');
                  return;
                }
                if (isBooleanOutsideWindow(habit)) {
                  const wLabel = formatCompletionWindow(habit, isAr);
                  toast.notifyInfo(isAr ? 'غير متاح بعد' : 'Not available yet', isAr ? `يمكنك الإكمال خلال ${wLabel}` : `You can mark as done during ${wLabel}`);
                  return;
                }
                store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: true });
              }}
                className={cn('group flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 active:scale-[0.95]',
                  done ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)] border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.08]')}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {done ? (isAr ? 'مكتمل' : 'Done') : (isAr ? 'لم يُنجز' : 'Not Done')}
              </button>
              <button onClick={onEdit}
                className="group shrink-0 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-200 border text-xs sm:text-sm font-bold active:scale-[0.97] hover:shadow-sm"
                style={{ borderColor: `${hc}30`, color: hc, background: `${hc}08` }}
                title={isAr ? 'تعديل' : 'Edit'}>
                <Edit3 className="h-3.5 w-3.5" />
                {isAr ? 'تعديل' : 'Edit'}
              </button>
              {onArchive && (() => {
                const archivedCount = store.habits.filter(h => h.archived).length;
                return (
                  <button onClick={() => { onArchive(); onClose(); toast.notifySuccess(isAr ? (habit.archived ? 'تم استعادة العادة' : 'تم أرشفة العادة') : (habit.archived ? 'Habit restored' : 'Habit archived')); }}
                    className="shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-200 border text-xs sm:text-sm font-bold active:scale-[0.97] hover:shadow-sm border-amber-500/25 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10"
                    title={isAr ? (habit.archived ? 'استعادة' : 'أرشفة') : (habit.archived ? 'Restore' : 'Archive')}>
                    <Archive className="h-3.5 w-3.5" />
                    {habit.archived ? (isAr ? 'استعادة' : 'Restore') : (isAr ? 'أرشفة' : 'Archive')}
                    {archivedCount > 0 && (
                      <span className="rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-black tabular-nums text-amber-600">{archivedCount}</span>
                    )}
                  </button>
                );
              })()}
              {onDelete && (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-200 border text-xs sm:text-sm font-bold active:scale-[0.97] hover:shadow-sm border-red-500/25 text-red-500 bg-red-500/5 hover:bg-red-500/10"
                  title={isAr ? 'حذف نهائي' : 'Delete permanently'}>
                  <Trash2 className="h-3.5 w-3.5" />
                  {isAr ? 'حذف' : 'Delete'}
                </button>
              )}
            </div>

            {/* Delete confirmation modal */}
            <AnimatePresence>
              {showDeleteConfirm && onDelete && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="rounded-xl border-2 border-red-500/20 bg-red-500/[0.03] p-3 sm:p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-600">{isAr ? 'حذف نهائي — لا يمكن التراجع' : 'Permanent delete — cannot be undone'}</p>
                        <p className="text-[11px] text-[var(--foreground)]/50 mt-1">
                          {isAr
                            ? 'سيتم حذف العادة وجميع سجلاتها وبياناتها من قاعدة البيانات نهائياً.'
                            : 'This will permanently delete the habit and all its logs, history, and data from the database.'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[var(--foreground)]/50 mb-1 block">
                        {isAr ? 'اكتب اسم العادة للتأكيد:' : 'Type the habit name to confirm:'}
                        <span className="font-black text-red-500 ms-1">{deleteConfirmTarget}</span>
                      </label>
                      <input
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value)}
                        placeholder={deleteConfirmTarget}
                        className="w-full rounded-lg border-2 border-red-500/20 bg-transparent px-3 py-2 text-sm font-medium focus:border-red-500/50 focus:outline-none"
                        dir="auto"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]">
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => { if (isDeleteConfirmed) { onDelete(); onClose(); toast.notifySuccess(isAr ? 'تم حذف العادة نهائياً' : 'Habit permanently deleted'); } }}
                        disabled={!isDeleteConfirmed}
                        className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all', isDeleteConfirmed ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm' : 'bg-red-500/20 text-red-500/40 cursor-not-allowed')}>
                        {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          {/* Week strip — compact */}
          <div className="rounded-xl p-1.5 sm:p-2.5 mt-2" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
          <div className="flex items-center gap-0">
            {weekDays.map((d, i) => {
              const dayLabel = parseLocalDate(d.date).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'narrow' });
              const isToday = d.date === today;
              const isPast = d.date < today;
              const isNotScheduled = d.color === 'not-scheduled';
              const dayRepCount = getDoneRepCountForDate(habit, store.habitLogs, d.date);
              return (
                <div key={d.date} className={cn('flex-1 flex flex-col items-center gap-0.5 rounded-lg py-1 transition-all relative',
                  isToday && 'bg-[var(--color-primary)]/[0.08]')}
                  style={isToday ? { border: '1px solid var(--color-primary)' } : { border: '1px solid transparent' }}>
                  <span className={cn('text-[10px] sm:text-sm font-bold', isNotScheduled ? 'text-[var(--foreground)]/30' : isToday ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]')}>{dayLabel}</span>
                  <div className={cn('h-5 w-5 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[10px] sm:text-sm font-black',
                    isNotScheduled ? 'bg-red-500/8 text-red-400/50' :
                    d.done && d.color === 'green' ? 'bg-emerald-500 text-white' :
                    d.done && d.color === 'orange' ? 'bg-amber-500 text-white' :
                    d.done ? 'bg-emerald-500 text-white' :
                    isPast ? 'bg-red-500 text-white' :
                    isToday ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' :
                    'bg-gray-300 dark:bg-gray-600 text-[var(--foreground)]/70',
                    isToday && !isNotScheduled && 'ring-2 ring-offset-1 shadow-sm')}
                    style={isToday && !isNotScheduled ? { ['--tw-ring-color' as string]: hc } : undefined}>
                    {d.done ? <Check className="h-2.5 w-2.5" /> : isNotScheduled ? '✕' : parseLocalDate(d.date).getDate()}
                  </div>
                  {dayRepCount > 1 && (
                    <span className="absolute -top-1 end-0 h-4 min-w-[16px] px-1 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">{dayRepCount}x</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Week strip legend */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] sm:text-sm text-[var(--foreground)] font-medium">{isAr ? 'مكتمل' : 'Done'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-500" />
              <span className="text-[10px] sm:text-sm text-[var(--foreground)] font-medium">{isAr ? 'متأخر' : 'Late'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-500" />
              <span className="text-[10px] sm:text-sm text-[var(--foreground)] font-medium">{isAr ? 'فائت' : 'Missed'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="text-[10px] sm:text-sm text-[var(--foreground)] font-medium">{isAr ? 'قادم' : 'Upcoming'}</span>
            </div>
            {habit.frequency !== 'daily' && (
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/8 text-red-400/50 text-[7px] font-black flex items-center justify-center">✕</div>
                <span className="text-sm text-[var(--foreground)] font-medium">{isAr ? 'غير مجدول' : 'N/A'}</span>
              </div>
            )}
          </div>
          </div>

          {/* Badges row — compact inline */}
          <div className="flex items-center gap-1 mt-2 sm:mt-2.5 flex-wrap">
            {[catLabel, freqLabel, typeLabel, `${priLabel}`, `${diffLabel}`, ...(habit.expectedDuration ? [formatDurationSecs(habit.expectedDuration)] : []), habit.maxDailyReps ? `${isAr ? 'أقصى عدد جلسات: ' : 'Max sessions: '}${habit.maxDailyReps}${isAr ? '/يوم' : '/day'}` : (isAr ? 'أقصى عدد جلسات: غير محدود' : 'Max sessions: Unlimited'), `${habitAge}${isAr ? 'يوم' : 'd'}`].map((b, i) => (
              <span key={i} className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md cursor-default" style={{ background: `${hc}10`, color: hc, border: `1px solid ${hc}15` }}>{b}</span>
            ))}
          </div>
        </div>

        {/* ── BODY: 3-column grid ── */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-4 pt-2">
          {/* Action zone — compact */}
          <div className="rounded-xl p-3 mb-3" style={{ background: `${hc}05`, border: `1px solid ${hc}12` }} onClick={e => e.stopPropagation()}>
            {hasDuration && !habit.archived && (
              <div className="flex flex-col gap-2">
                {/* Custom timer H:M:S input — only when timer not active */}
                {!isTimerActive && (
                  <div className="rounded-lg p-2" style={{ background: `${hc}08`, border: `1px solid ${hc}15` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50">
                        {isAr ? 'مدة المؤقت' : 'Timer Duration'}
                      </span>
                      {customTimerSecs !== (habit.expectedDuration || 0) && (
                        <button onClick={() => setCustomTimerSecs(habit.expectedDuration || 0)}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all"
                          style={{ color: hc, background: `${hc}15` }}>
                          {isAr ? 'إعادة تعيين' : 'Reset'}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="text-center">
                        <label className="text-[8px] font-medium text-[var(--foreground)]/40 block">{isAr ? 'ساعات' : 'H'}</label>
                        <input type="number" min={0} max={23} value={customTimerH}
                          onChange={e => setCustomHMS(Math.max(0, Math.min(23, Number(e.target.value) || 0)), customTimerM, customTimerS)}
                          className="w-full rounded-lg app-input px-1 py-1.5 text-sm text-center font-mono font-bold" />
                      </div>
                      <div className="text-center">
                        <label className="text-[8px] font-medium text-[var(--foreground)]/40 block">{isAr ? 'دقائق' : 'M'}</label>
                        <input type="number" min={0} max={59} value={customTimerM}
                          onChange={e => setCustomHMS(customTimerH, Math.max(0, Math.min(59, Number(e.target.value) || 0)), customTimerS)}
                          className="w-full rounded-lg app-input px-1 py-1.5 text-sm text-center font-mono font-bold" />
                      </div>
                      <div className="text-center">
                        <label className="text-[8px] font-medium text-[var(--foreground)]/40 block">{isAr ? 'ثواني' : 'S'}</label>
                        <input type="number" min={0} max={59} value={customTimerS}
                          onChange={e => setCustomHMS(customTimerH, customTimerM, Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                          className="w-full rounded-lg app-input px-1 py-1.5 text-sm text-center font-mono font-bold" />
                      </div>
                    </div>
                    {/* Info: original target vs custom */}
                    <div className="flex items-center justify-between mt-1.5 text-[9px] font-semibold">
                      <span className="text-[var(--foreground)]/40">
                        {isAr ? 'الهدف الأصلي:' : 'Original target:'} {formatDurationSecs(habit.expectedDuration!)}
                      </span>
                      {customTimerSecs !== (habit.expectedDuration || 0) && (
                        <span style={{ color: hc }}>
                          {isAr ? 'المؤقت:' : 'Timer:'} {formatDurationSecs(customTimerSecs)}
                        </span>
                      )}
                    </div>
                    {customTimerSecs > (habit.expectedDuration || 0) && (
                      <p className="text-[8px] mt-1 text-emerald-600 font-medium">
                        {isAr ? `✓ سيتم تسجيل الإنجاز عند ${formatDurationSecs(habit.expectedDuration!)} — المؤقت يستمر` : `✓ Done at ${formatDurationSecs(habit.expectedDuration!)} — timer continues`}
                      </p>
                    )}
                    {customTimerSecs > 0 && customTimerSecs < (habit.expectedDuration || 0) && (
                      <p className="text-[8px] mt-1 text-amber-600 font-medium">
                        {isAr ? `⚠ المؤقت أقل من الهدف — لن يُسجل كمكتمل` : `⚠ Timer shorter than target — won't mark as done`}
                      </p>
                    )}
                  </div>
                )}
                <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="sm" customDurationSecs={customTimerSecs !== (habit.expectedDuration || 0) ? customTimerSecs : undefined} />
              </div>
            )}
            {isCountHabit && !habit.archived && (
              <div className="flex items-center gap-3">
                <button onClick={() => { if (dCountValue <= 0) return; store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: Math.max(0, dCountValue - 1) >= dCountTarget, value: Math.max(0, dCountValue - 1), source: 'manual' }); }}
                  className={cn('h-10 w-10 rounded-xl flex items-center justify-center font-bold border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/5', dCountValue <= 0 && 'opacity-20')}>
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-black tabular-nums" style={{ color: dCountProgress >= 1 ? '#22c55e' : hc }}>{dCountValue}</span>
                  <span className="text-sm text-[var(--foreground)] font-semibold"> / {dCountTarget}</span>
                  <p className="text-xs text-[var(--foreground)]">{dCountUnit}</p>
                </div>
                <button onClick={() => { store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: (dCountValue + 1) >= dCountTarget, value: dCountValue + 1, source: 'manual' }); }}
                  className="h-10 w-10 rounded-xl flex items-center justify-center font-bold border transition-all"
                  style={{ background: `${dCountProgress < 1 ? hc : '#22c55e'}12`, color: dCountProgress < 1 ? hc : '#22c55e', borderColor: `${dCountProgress < 1 ? hc : '#22c55e'}25` }}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
            {/* Checklist tasks — replaces Mark Done for habits with checklist items */}
            {!isCountHabit && !hasDuration && !habit.archived && (habit.checklistItems ?? []).length > 0 && (() => {
              const clItems = habit.checklistItems!;
              const clLog = store.habitLogs.find(l => l.habitId === habit.id && l.date === today);
              const clState = clLog?.checklistState ?? {} as Record<string, boolean | { done: boolean; time: string | null }>;
              const clCount = clItems.filter(item => clState[item.id]).length;
              const clAllDone = clItems.length > 0 && clItems.every(item => clState[item.id]);

              const handleClToggle = (itemId: string) => {
                const wasChecked = typeof clState[itemId] === 'object' ? (clState[itemId] as { done: boolean }).done : !!clState[itemId];
                const newState: Record<string, boolean> = {};
                clItems.forEach(item => { newState[item.id] = item.id === itemId ? !wasChecked : (typeof clState[item.id] === 'object' ? (clState[item.id] as { done: boolean }).done : !!clState[item.id]); });
                const allDone = clItems.every(item => newState[item.id]);
                if (clLog) store.deleteHabitLog(clLog.id);
                store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: allDone, checklistState: newState, source: 'manual' });
              };

              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-[var(--foreground)]/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(clCount / clItems.length) * 100}%`, background: clAllDone ? '#10b981' : hc }} />
                    </div>
                    <span className="text-xs font-black tabular-nums" style={{ color: clAllDone ? '#10b981' : hc }}>
                      {clCount}/{clItems.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {clItems.map(item => (
                      <button key={item.id} onClick={() => handleClToggle(item.id)}
                        className="flex items-center gap-2.5 w-full text-start py-2 px-3 rounded-xl hover:bg-[var(--foreground)]/[0.03] transition-colors">
                        <div className={cn('w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          clState[item.id] ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--foreground)]/20')}>
                          {clState[item.id] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn('text-sm font-semibold', clState[item.id] && 'line-through text-[var(--foreground)]/50')}>
                          {isAr ? (item.titleAr || item.titleEn) : (item.titleEn || item.titleAr)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {clAllDone && (
                    <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-black">{isAr ? 'مكتملة ✓' : 'All tasks done ✓'}</span>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* Mark Done button — only for habits WITHOUT checklist items */}
            {!isCountHabit && !hasDuration && !habit.archived && (habit.checklistItems ?? []).length === 0 && (() => {
              const now = new Date();
              const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              const inWindow = !habit.windowStart || !habit.windowEnd || (currentTime >= habit.windowStart && currentTime <= habit.windowEnd);
              const windowExpired = habit.windowStart && habit.windowEnd && currentTime > habit.windowEnd;
              const strictLocked = habit.strictWindow && habit.windowStart && habit.windowEnd && windowExpired && !done;
              const strictNotYet = habit.strictWindow && habit.windowStart && habit.windowEnd && !inWindow && !windowExpired && !done;
              const isBooleanWindowBlocked = !done && isBooleanOutsideWindow(habit);
              const cwLabel = formatCompletionWindow(habit, isAr);
              const notScheduled = !isHabitScheduledForDate(habit, today);
              const isDisabled = !!strictLocked || !!strictNotYet || isBooleanWindowBlocked || notScheduled;

              const handleClick = () => {
                if (done) {
                  const log = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);
                  if (log) store.deleteHabitLog(log.id);
                } else if (notScheduled) {
                  toast.notifyInfo(isAr ? 'غير مجدولة اليوم' : 'Not scheduled today', isAr ? 'هذه العادة غير مجدولة لهذا اليوم' : 'This habit is not scheduled for today');
                } else if (isBooleanWindowBlocked) {
                  toast.notifyInfo(isAr ? `متاح ${cwLabel}` : `Available ${cwLabel}`, isAr ? `يمكنك تسجيل هذه العادة خلال الفترة ${cwLabel}` : `You can check in during ${cwLabel}`);
                } else if (strictLocked) {
                  toast.notifyWarning(isAr ? 'فات الوقت' : 'Window passed', isAr ? `انتهى وقت النافذة (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)})` : `Time window (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)}) has passed`);
                } else if (strictNotYet) {
                  toast.notifyInfo(isAr ? 'لم يحن الوقت بعد' : 'Not yet', isAr ? `النافذة تبدأ الساعة ${to12h(habit.windowStart!)}` : `Window starts at ${to12h(habit.windowStart!)}`);
                } else {
                  store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true });
                }
              };

              return (
                <button onClick={handleClick}
                  className={cn('w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all',
                    done ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : isDisabled ? 'opacity-40 border border-[var(--foreground)]/[0.18] text-[var(--foreground)]'
                      : 'text-white')}
                  style={!done && !isDisabled ? { background: `linear-gradient(135deg, ${hc}, ${hc}dd)`, boxShadow: `0 4px 16px ${hc}25` } : undefined}>
                  <CheckCircle2 className="h-4 w-4" />
                  {done ? (isAr ? 'مكتملة — تراجع' : 'Done — Undo')
                    : isBooleanWindowBlocked ? (isAr ? `متاح ${cwLabel}` : `${cwLabel}`)
                    : strictNotYet ? (isAr ? `متاح من ${to12h(habit.windowStart!)}` : `From ${to12h(habit.windowStart!)}`)
                    : strictLocked ? (isAr ? 'فات الوقت' : 'Window Passed')
                    : (isAr ? 'أنجز الآن' : 'Mark Done')}
                </button>
              );
            })()}
            {todayActivityLogs.length > 0 && (
              <div className="mt-2 flex flex-col items-center gap-1">
                {todayRepCount > 1 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                    {todayRepCount} {isAr ? 'تكرار اليوم' : 'reps today'} — {formatSecs(todayTotalDurationSecs)} {isAr ? 'إجمالي' : 'total'}
                  </span>
                )}
                <div className="flex items-center justify-center gap-4 text-sm text-[var(--foreground)]">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {to12h(todayLog!.time)}</span>
                  {todayLog!.duration && <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {formatSecs(normalizeDurationToSecs(todayLog!.duration))}{todayRepCount > 1 ? (isAr ? ' (آخر جلسة)' : ' (last)') : ''}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Stats + Context row */}
          <div className="rounded-xl p-2 mb-3" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5">
            {[
              { label: isAr ? 'سلسلة' : 'Streak', value: streak.current, suffix: isAr ? 'ي' : 'd', color: '#f97316' },
              { label: isAr ? 'أفضل' : 'Best', value: streak.best, suffix: isAr ? 'ي' : 'd', color: '#eab308' },
              { label: isAr ? 'مجمل' : 'Total', value: stats.totalCompletions, suffix: '', color: '#22c55e' },
              { label: isAr ? 'نسبة' : 'Rate', value: stats.completionRate, suffix: '%', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="text-center rounded-xl py-1.5 sm:py-2 px-1 cursor-default" style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                <p className="text-base sm:text-lg font-black tabular-nums leading-none" style={{ color: s.color }}>{s.value}<span className="text-[10px] sm:text-xs opacity-50">{s.suffix}</span></p>
                <p className="text-[10px] sm:text-sm font-bold text-[var(--foreground)] mt-0.5 sm:mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          </div>

          {/* First Done + Last Done + End Date */}
          <div className={cn('grid gap-1.5 sm:gap-2 mb-3 rounded-xl p-1.5 sm:p-2', habit.endDate ? 'grid-cols-3' : 'grid-cols-2')} style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
            <div className="flex items-center gap-1.5 rounded-xl py-1.5 sm:py-2 px-2 sm:px-3 cursor-default" style={{ background: '#8b5cf608', border: '1px solid #8b5cf615' }}>
              <CalendarDays className="h-3 w-3 text-violet-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold text-[var(--foreground)]">{isAr ? 'أول إنجاز' : 'First Done'}</p>
                {firstDone
                  ? <p className="text-[10px] sm:text-[11px] font-black text-violet-600 tabular-nums truncate">{parseLocalDate(firstDone).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' })}</p>
                  : <p className="text-[10px] italic text-[var(--foreground)]/40">{isAr ? 'لم يُنجز' : 'Not yet'}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl py-1.5 sm:py-2 px-2 sm:px-3 cursor-default" style={{ background: '#06b6d408', border: '1px solid #06b6d415' }}>
              <CalendarDays className="h-3 w-3 text-cyan-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold text-[var(--foreground)]">{isAr ? 'آخر إنجاز' : 'Last Done'}</p>
                {lastDone
                  ? <p className="text-[10px] sm:text-[11px] font-black text-cyan-600 tabular-nums truncate">{parseLocalDate(lastDone).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' })}</p>
                  : <p className="text-[10px] italic text-[var(--foreground)]/40">{isAr ? 'لم يُنجز' : 'Not yet'}</p>}
              </div>
            </div>
            {habit.endDate && (() => {
              const diff = Math.ceil((new Date(habit.endDate).getTime() - Date.now()) / 86400000);
              return (
                <div className="flex items-center gap-1.5 rounded-xl py-1.5 sm:py-2 px-2 sm:px-3 cursor-default" style={{ background: diff > 0 ? '#10b98108' : '#ef444408', border: `1px solid ${diff > 0 ? '#10b98115' : '#ef444415'}` }}>
                  <Target className={cn('h-3 w-3 shrink-0', diff > 0 ? 'text-emerald-500' : 'text-red-500')} />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-[var(--foreground)]">{isAr ? 'ينتهي في' : 'Ends on'}</p>
                    <p className={cn('text-[10px] sm:text-[11px] font-black tabular-nums truncate', diff > 0 ? 'text-emerald-600' : 'text-red-500')}>
                      {parseLocalDate(habit.endDate).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' })}
                      <span className="text-[8px] font-bold opacity-60 ms-1">({diff > 0 ? `${diff}${isAr ? 'ي' : 'd'}` : diff === 0 ? (isAr ? 'اليوم!' : 'today!') : `${Math.abs(diff)}${isAr ? 'ي' : 'd'} ${isAr ? 'فات' : 'ago'}`})</span>
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Context tags */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3 rounded-xl p-2.5" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
            {hasContext ? (
              <>
                {(isAr ? habit.placeAr : habit.placeEn) && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-violet-500/8 text-violet-600 border border-violet-500/12"><MapPin className="h-3.5 w-3.5" /> {isAr ? 'المكان:' : 'Place:'} {isAr ? habit.placeAr : habit.placeEn}</span>
                )}
                {habit.preferredTime && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-sky-500/8 text-sky-600 border border-sky-500/12"><Clock className="h-3.5 w-3.5" /> {isAr ? 'الوقت المفضل:' : 'Preferred:'} {to12h(habit.preferredTime!)}</span>
                )}
                {habit.expectedDuration && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/8 text-emerald-600 border border-emerald-500/12"><Hourglass className="h-3.5 w-3.5" /> {isAr ? 'المدة المتوقعة:' : 'Duration:'} {formatDurationSecs(habit.expectedDuration!)}</span>
                )}
                {habit.windowStart && habit.windowEnd && (
                  <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border', habit.strictWindow ? 'bg-red-500/8 text-red-600 border-red-500/15' : 'bg-indigo-500/8 text-indigo-600 border-indigo-500/12')}>
                    <Target className="h-3.5 w-3.5" /> {habit.strictWindow ? (isAr ? 'الوقت المحدد (إجباري):' : 'Required time:') : (isAr ? 'الوقت المحدد:' : 'Scheduled time:')} {to12h(habit.windowStart!)}–{to12h(habit.windowEnd!)}
                  </span>
                )}
                {habit.strictWindow && habit.windowStart && habit.windowEnd && (
                  <span className="inline-flex items-center gap-1.5 w-full text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-500/8 text-red-500 border border-red-500/12">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {isAr ? 'يجب إنجاز هذه العادة خلال الوقت المحدد، وإلا تُحسب فائتة تلقائيًا' : 'This habit must be completed within the scheduled time, otherwise it automatically counts as missed'}
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] italic text-[var(--foreground)] px-1 py-0.5">
                <MapPin className="h-2.5 w-2.5" /> {isAr ? 'لم يتم تحديد السياق — المكان، الوقت، المدة' : 'No context set — place, time, duration'}
              </span>
            )}
          </div>

          {/* Habit Loop + Streak — side by side, always shown */}
          <div className="grid gap-2 sm:gap-2.5 mb-3 grid-cols-1 sm:grid-cols-2">
            {/* Habit Loop */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
              <div className="px-2.5 py-1.5 border-b border-[var(--foreground)]/[0.15] flex items-center gap-1">
                <Repeat className="h-3 w-3" style={{ color: hc }} />
                <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'حلقة العادة' : 'Habit Loop'}</span>
              </div>
              {hasLoop ? (
                <div className="p-2 flex items-stretch gap-1.5">
                  {(isAr ? habit.cueAr : habit.cueEn) && (
                    <div className="flex-1 text-center rounded-lg px-1.5 py-2 cursor-default" style={{ background: '#f59e0b0a', border: '1px solid #f59e0b15' }}>
                      <Lightbulb className="h-3 w-3 text-amber-500 mx-auto mb-0.5" />
                      <p className="text-xs font-black text-amber-600 uppercase">{isAr ? 'الإشارة' : 'Cue'}</p>
                      <p className="text-xs text-[var(--foreground)] leading-tight mt-0.5">{isAr ? habit.cueAr : habit.cueEn}</p>
                    </div>
                  )}
                  {(isAr ? habit.routineAr : habit.routineEn) && (
                    <>
                      <div className="flex items-center"><ArrowRight className={cn('h-2.5 w-2.5 text-[var(--foreground)]', isAr && 'rotate-180')} /></div>
                      <div className="flex-1 text-center rounded-lg px-1.5 py-2 cursor-default" style={{ background: '#3b82f60a', border: '1px solid #3b82f615' }}>
                        <Repeat className="h-3 w-3 text-blue-500 mx-auto mb-0.5" />
                        <p className="text-xs font-black text-blue-600 uppercase">{isAr ? 'الروتين' : 'Routine'}</p>
                        <p className="text-xs text-[var(--foreground)] leading-tight mt-0.5">{isAr ? habit.routineAr : habit.routineEn}</p>
                      </div>
                    </>
                  )}
                  {(isAr ? habit.rewardAr : habit.rewardEn) && (
                    <>
                      <div className="flex items-center"><ArrowRight className={cn('h-2.5 w-2.5 text-[var(--foreground)]', isAr && 'rotate-180')} /></div>
                      <div className="flex-1 text-center rounded-lg px-1.5 py-2 cursor-default" style={{ background: '#22c55e0a', border: '1px solid #22c55e15' }}>
                        <Gift className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
                        <p className="text-xs font-black text-emerald-600 uppercase">{isAr ? 'المكافأة' : 'Reward'}</p>
                        <p className="text-xs text-[var(--foreground)] leading-tight mt-0.5">{isAr ? habit.rewardAr : habit.rewardEn}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-4 flex flex-col items-center justify-center gap-1">
                  <Lightbulb className="h-4 w-4 text-[var(--foreground)]" />
                  <p className="text-[10px] italic text-[var(--foreground)] text-center">{isAr ? 'لم يتم تحديد حلقة العادة' : 'No habit loop set'}</p>
                  <p className="text-[9px] text-[var(--foreground)] text-center">{isAr ? 'الإشارة → الروتين → المكافأة' : 'Cue → Routine → Reward'}</p>
                </div>
              )}
            </div>
            {/* Challenges */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
              <div className="px-2.5 py-1.5 flex items-center gap-1" style={{ borderBottom: `1px solid ${hc}40` }}>
                <Award className="h-3 w-3" style={{ color: hc }} />
                <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'تحديات' : 'Challenges'}</span>
              </div>
              {streakGoals.length > 0 ? (
                <div className="p-2 space-y-1.5">
                  {streakGoals.map((g, i) => {
                    const achieved = streak.current >= g.target;
                    const filled = Math.min(streak.current, g.target);
                    const pct = Math.round((filled / g.target) * 100);
                    return (
                      <div key={i} className={cn('rounded-lg px-2.5 py-2', achieved ? 'bg-amber-500/8 border border-amber-500/15' : 'bg-[var(--foreground)]/[0.02] border border-[var(--foreground)]/[0.15]')}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-black tabular-nums" style={{ color: achieved ? '#eab308' : hc }}>{filled}/{g.target}</span>
                          <div className="flex items-center gap-1.5">
                            {(isAr ? g.rewardAr : g.rewardEn) && (
                              <span className="text-sm font-bold px-1.5 py-0.5 rounded" style={{ background: achieved ? '#eab30812' : `${hc}08`, color: achieved ? '#eab308' : hc }}>
                                {isAr ? g.rewardAr : g.rewardEn}
                              </span>
                            )}
                            <span className="text-sm font-black tabular-nums" style={{ color: achieved ? '#eab308' : hc }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="flex gap-[2px]">
                          {Array.from({ length: Math.min(g.target, 60) }).map((_, di) => (
                            <div key={di} className="flex-1 h-1.5 rounded-sm" style={{ background: di < filled ? (achieved ? '#eab308' : hc) : '#d1d5db20' }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 flex flex-col items-center justify-center gap-1">
                  <Award className="h-4 w-4 text-[var(--foreground)]" />
                  <p className="text-[10px] italic text-[var(--foreground)] text-center">{isAr ? 'لم يتم تحديد تحديات' : 'No streak challenges set'}</p>
                  <p className="text-[9px] text-[var(--foreground)] text-center">{isAr ? 'حدد أهداف سلسلة للتحفيز' : 'Set streak goals to stay motivated'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Calendar + Analytics — side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
            {/* Calendar — compact */}
            <div className="rounded-xl overflow-visible" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
              <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${hc}40` }}>
                <button onClick={() => setCalMonth(m => { const prev = new Date(m.year, m.month - 1); return { year: prev.getFullYear(), month: prev.getMonth() }; })} disabled={!canGoPrev}
                  className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-[var(--foreground)]/[0.05] disabled:opacity-20"><ChevronLeft className="h-3 w-3" /></button>
                <h3 className="text-sm font-black">{monthLabel}</h3>
                <button onClick={() => setCalMonth(m => { const next = new Date(m.year, m.month + 1); return { year: next.getFullYear(), month: next.getMonth() }; })} disabled={!canGoNext}
                  className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-[var(--foreground)]/[0.05] disabled:opacity-20"><ChevronRight className="h-3 w-3" /></button>
              </div>
              <div className="px-2.5 py-2">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {(isAr ? DAY_LABELS.ar : DAY_LABELS.en).map(d => (
                    <div key={d} className="text-center text-[10px] sm:text-sm font-black text-[var(--foreground)] uppercase">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 overflow-visible">
                  {calendarDays.map((day, i) => {
                    const isApplicable = day.inMonth && !day.isFuture && !day.beforeCreated;
                    const isOff = day.inMonth && (day.beforeCreated || day.color === 'not-scheduled');
                    const isTodayCal = day.date === todayString();
                    return (
                      <div key={i} title={day.sessionCount > 1 ? `${day.date} (${day.sessionCount}x)` : day.date}
                        className={cn('h-6 sm:h-8 rounded-md flex items-center justify-center text-[10px] sm:text-sm font-bold cursor-default relative overflow-visible',
                          !day.inMonth && 'invisible',
                          isOff && 'bg-red-500/8 text-red-400/50',
                          !isOff && day.isFuture && day.inMonth && 'bg-gray-200 dark:bg-gray-700 text-[var(--foreground)]/50',
                          isApplicable && day.color === 'green' && 'bg-emerald-500 text-white',
                          isApplicable && day.color === 'orange' && 'bg-amber-500 text-white',
                          isApplicable && day.color === 'red' && 'bg-red-500 text-white',
                          isApplicable && day.color === 'none' && !day.completed && 'bg-gray-200 dark:bg-gray-700 text-[var(--foreground)]/70',
                          isTodayCal && 'ring-2 ring-offset-1 font-black shadow-sm')}
                        style={isTodayCal ? { ['--tw-ring-color' as string]: hc } : undefined}>
                        {day.inMonth ? (isOff ? '✕' : day.day) : ''}
                        {day.sessionCount > 1 && (
                          <span className="absolute -top-1.5 -end-1.5 z-10 h-4.5 min-w-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm ring-1 ring-white dark:ring-gray-900">{day.sessionCount}x</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 mt-2 flex-wrap">
                  {[
                    { color: 'bg-emerald-500', label: isAr ? 'في الوقت' : 'On time' },
                    { color: 'bg-amber-500', label: isAr ? 'متأخر' : 'Late' },
                    { color: 'bg-red-500', label: isAr ? 'فائت' : 'Missed' },
                    { color: 'bg-gray-200 dark:bg-gray-700', label: isAr ? 'قادم' : 'Upcoming' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1">
                      <div className={cn('h-2 w-2 rounded-sm', l.color)} />
                      <span className="text-[9px] sm:text-sm text-[var(--foreground)] font-semibold">{l.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-sm bg-red-500/8 text-red-400/50 text-[6px] font-black flex items-center justify-center">✕</div>
                    <span className="text-[9px] sm:text-sm text-[var(--foreground)] font-semibold">{isAr ? 'غير مجدول' : 'N/A'}</span>
                  </div>
                </div>
                {/* First done + buttons */}
                <div className="flex gap-1.5 mt-2">
                  <button onClick={onViewFull}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all duration-200"
                    style={{ background: `${hc}08`, color: hc, border: `1px solid ${hc}12` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${hc}18`; e.currentTarget.style.borderColor = `${hc}25`; e.currentTarget.style.boxShadow = `0 2px 8px ${hc}12`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}08`; e.currentTarget.style.borderColor = `${hc}12`; e.currentTarget.style.boxShadow = 'none'; }}>
                    <CalendarIcon className="h-3 w-3" /> {isAr ? 'كل الأيام' : 'All Days'}
                  </button>
                  <Link href={`/app/habits/${habit.id}`}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: `linear-gradient(135deg, ${hc}, ${hc}cc)` }}>
                    <Maximize2 className="h-3 w-3" /> {isAr ? 'الصفحة' : 'Full Page'}
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Analytics — stacked compact */}
            <div className="space-y-2.5">
              {/* Repetitions */}
              <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
                <div className="px-2.5 py-1.5 flex items-center gap-1" style={{ borderBottom: `1px solid ${hc}40` }}>
                  <Hash className="h-3 w-3" style={{ color: hc }} />
                  <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'التكرارات' : 'Reps'}</span>
                </div>
                <div className="p-2 grid grid-cols-4 gap-1">
                  {[
                    { l: isAr ? 'أسبوع' : 'Week', v: timeStats.reps.week },
                    { l: isAr ? 'شهر' : 'Month', v: timeStats.reps.month },
                    { l: isAr ? 'سنة' : 'Year', v: timeStats.reps.year },
                    { l: isAr ? 'مجمل' : 'Total', v: timeStats.reps.total },
                  ].map((r, i) => (
                    <div key={i} className="text-center rounded-lg py-2 cursor-default" style={{ background: `${hc}08`, border: `1px solid ${hc}20` }}>
                      <p className="text-base font-black tabular-nums" style={{ color: hc }}>{r.v}</p>
                      <p className="text-sm text-[var(--foreground)] font-bold">{r.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time spent */}
              <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
                <div className="px-2.5 py-1.5 flex items-center gap-1" style={{ borderBottom: `1px solid ${hc}40` }}>
                  <Clock className="h-3 w-3" style={{ color: hc }} />
                  <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'الوقت' : 'Time'}</span>
                </div>
                {!habit.expectedDuration && habit.trackingType !== 'duration' ? (
                  <div className="p-3 text-center">
                    <p className="text-xs font-semibold opacity-50">{isAr ? 'هذه العادة لا تتضمن وقتاً' : 'This habit does not track time'}</p>
                  </div>
                ) : (
                <div className="p-2 grid grid-cols-4 gap-1">
                  {[
                    { l: isAr ? 'اليوم' : 'Today', v: formatSecs(timeStats.secs.today) },
                    { l: isAr ? 'أسبوع' : 'Week', v: formatSecs(timeStats.secs.week) },
                    { l: isAr ? 'شهر' : 'Month', v: formatSecs(timeStats.secs.month) },
                    { l: isAr ? 'سنة' : 'Year', v: formatSecs(timeStats.secs.year) },
                  ].map((r, i) => (
                    <div key={i} className="text-center rounded-lg py-2 cursor-default" style={{ background: `${hc}08`, border: `1px solid ${hc}20` }}>
                      <p className="text-sm font-black" style={{ color: hc }}>{r.v}</p>
                      <p className="text-sm text-[var(--foreground)] font-bold">{r.l}</p>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Overall Goal Progress */}
              {(() => {
                const hasRepsGoal = habit.goalReps && habit.goalReps > 0;
                const tracksTime = !!habit.expectedDuration || habit.trackingType === 'duration';
                const hasHoursGoal = tracksTime && habit.goalHours && habit.goalHours > 0;
                const hasAnyGoal = hasRepsGoal || hasHoursGoal;

                if (!hasAnyGoal) return (
                  <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
                    <div className="px-2.5 py-1.5 flex items-center gap-1" style={{ borderBottom: `1px solid ${hc}40` }}>
                      <Target className="h-3 w-3" style={{ color: hc }} />
                      <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'الهدف الكلي' : 'Overall Goal'}</span>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center gap-1">
                      <Target className="h-4 w-4 text-[var(--foreground)]" />
                      <p className="text-[10px] italic text-[var(--foreground)] text-center">{isAr ? 'لم يتم تحديد هدف كلي' : 'No overall goal set'}</p>
                      <p className="text-[9px] text-[var(--foreground)] text-center">{isAr ? 'حدد هدف تكرارات أو ساعات من التعديل' : 'Set a reps or hours goal from Edit'}</p>
                    </div>
                  </div>
                );

                const repsCurrentVal = stats.totalCompletions;
                const repsTarget = habit.goalReps ?? 0;
                const repsPct = repsTarget > 0 ? Math.min(100, Math.round((repsCurrentVal / repsTarget) * 100)) : 0;
                const repsDone = repsTarget > 0 && repsCurrentVal >= repsTarget;

                const totalSecs = timeStats.secs.total;
                const hoursCurrentVal = Math.round(totalSecs / 3600 * 10) / 10;
                const hoursTarget = habit.goalHours ?? 0;
                const hoursPct = hoursTarget > 0 ? Math.min(100, Math.round((hoursCurrentVal / hoursTarget) * 100)) : 0;
                const hoursDone = hoursTarget > 0 && hoursCurrentVal >= hoursTarget;

                return (
                  <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
                    <div className="px-2.5 py-1.5 flex items-center gap-1" style={{ borderBottom: `1px solid ${hc}40` }}>
                      <Target className="h-3 w-3" style={{ color: hc }} />
                      <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'الهدف الكلي' : 'Overall Goal'}</span>
                    </div>
                    <div className="p-3 space-y-3">
                      {/* Reps goal */}
                      {hasRepsGoal && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: `${repsDone ? '#22c55e' : hc}15` }}>
                                <Hash className="h-3 w-3" style={{ color: repsDone ? '#22c55e' : hc }} />
                              </div>
                              <span className="text-[11px] font-bold text-[var(--foreground)]">{isAr ? 'التكرارات' : 'Repetitions'}</span>
                            </div>
                            {repsDone && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">{isAr ? 'تحقق ✓' : 'Done ✓'}</span>}
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-1.5">
                            <span className="text-xl font-black tabular-nums" style={{ color: repsDone ? '#22c55e' : hc }}>{repsCurrentVal}</span>
                            <span className="text-xs font-bold text-[var(--foreground)]">/ {repsTarget}</span>
                            <span className="text-xs text-[var(--foreground)]">{isAr ? 'تكرار' : 'reps'}</span>
                            <span className="text-xs font-black tabular-nums ml-auto" style={{ color: repsDone ? '#22c55e' : hc }}>{repsPct}%</span>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden" style={{ background: `${repsDone ? '#22c55e' : hc}12` }}>
                            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${repsPct}%`, background: repsDone ? 'linear-gradient(90deg, #22c55e, #16a34a)' : `linear-gradient(90deg, ${hc}, ${hc}cc)` }} />
                          </div>
                        </div>
                      )}
                      {/* Hours goal */}
                      {hasHoursGoal && (
                        <div>
                          {hasRepsGoal && <div className="border-t border-[var(--foreground)]/[0.15] my-1" />}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: `${hoursDone ? '#22c55e' : '#8b5cf6'}15` }}>
                                <Clock className="h-3 w-3" style={{ color: hoursDone ? '#22c55e' : '#8b5cf6' }} />
                              </div>
                              <span className="text-[11px] font-bold text-[var(--foreground)]">{isAr ? 'الساعات' : 'Hours'}</span>
                            </div>
                            {hoursDone && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">{isAr ? 'تحقق ✓' : 'Done ✓'}</span>}
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-1.5">
                            <span className="text-xl font-black tabular-nums" style={{ color: hoursDone ? '#22c55e' : '#8b5cf6' }}>{hoursCurrentVal}</span>
                            <span className="text-xs font-bold text-[var(--foreground)]">/ {hoursTarget}</span>
                            <span className="text-xs text-[var(--foreground)]">{isAr ? 'ساعة' : 'hrs'}</span>
                            <span className="text-xs font-black tabular-nums ml-auto" style={{ color: hoursDone ? '#22c55e' : '#8b5cf6' }}>{hoursPct}%</span>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden" style={{ background: `${hoursDone ? '#22c55e' : '#8b5cf6'}12` }}>
                            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${hoursPct}%`, background: hoursDone ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #8b5cf6, #7c3aed)' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Best day insight — compact */}
          <div className="rounded-xl p-3 flex items-center gap-2.5"
            style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${hc}12` }}>
              <Sparkles className="h-4 w-4" style={{ color: hc }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--foreground)]">
                {isAr ? `أفضل يوم: ${stats.bestDay} — أضعف: ${stats.worstDay}` : `Best: ${stats.bestDay} — Weakest: ${stats.worstDay}`}
              </p>
              {habit.notes && <p className="text-xs text-[var(--foreground)] truncate">{habit.notes}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Main return with habit navigation ──
  return (
    <div className="relative">
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, x: slideDirection.current * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection.current * -60 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {renderCompact()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
