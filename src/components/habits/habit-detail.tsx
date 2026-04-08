'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import {
  Plus, CheckCircle2, Circle, Flame, X, Archive, Trash2, Edit3, Eye,
  ChevronLeft, ChevronRight, ChevronDown, Target, Clock, BarChart3, ListChecks, Hash,
  Trophy, Activity, ArrowRight, Play, Pause, Square, Timer,
  MapPin, Repeat, Gift, Lightbulb, Maximize2, Hourglass, AlertCircle, Bell,
  CalendarDays, Check, Calendar as CalendarIcon, Award, Minus,
} from 'lucide-react';
import {
  getCompletionColor, getCategoryLabel, FREQ_LABELS, CUSTOM_SCHEDULE_LABELS, CATEGORY_LABELS, DAY_LABELS,
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
  const hc = resolveHabitColor(habit.color);

  // Habit details — collapsible, click only (default closed)
  const [habitDetailsOpen, setHabitDetailsOpen] = useState(false);
  useEffect(() => {
    setHabitDetailsOpen(false);
  }, [habit.id]);

  const [timerDetailsOpen, setTimerDetailsOpen] = useState(false);
  useEffect(() => {
    setTimerDetailsOpen(false);
  }, [habit.id]);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const habitNameAr = habit.nameAr || '';
  const habitNameEn = habit.nameEn || '';
  const deleteConfirmDisplay = habitNameAr && habitNameEn ? `${habitNameAr} / ${habitNameEn}` : (habitNameAr || habitNameEn);
  // Accept either Arabic OR English name (case-insensitive for English)
  const isDeleteConfirmed = (() => {
    const typed = deleteConfirmText.trim();
    if (!typed) return false;
    if (habitNameAr && typed === habitNameAr.trim()) return true;
    if (habitNameEn && typed.toLowerCase() === habitNameEn.trim().toLowerCase()) return true;
    if (typed === deleteConfirmDisplay.trim()) return true;
    return false;
  })();

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
    const hasLoop = (isAr ? habit.cueAr : habit.cueEn) || (isAr ? habit.routineAr : habit.routineEn) || (isAr ? habit.rewardAr : habit.rewardEn);
    const hasContext = (isAr ? habit.placeAr : habit.placeEn) || habit.preferredTime || habit.expectedDuration || (habit.windowStart && habit.windowEnd);
    const detailChip =
      'group rounded-xl border px-2.5 py-1.5 min-w-0 transition-all duration-200 ease-out sm:hover:-translate-y-0.5 sm:hover:shadow-md sm:hover:brightness-[1.03] dark:sm:hover:brightness-[1.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]';
    const catLabel = getCategoryLabel(habit.category, isAr, store.deletedCategories, habit.archived);
    const freqBase = isAr ? FREQ_LABELS[habit.frequency]?.ar : FREQ_LABELS[habit.frequency]?.en;
    const freqLabel = freqBase ?? habit.frequency;
    const typeLabel = habit.type === 'positive' ? (isAr ? 'بناء' : 'Build') : (isAr ? 'تجنب' : 'Break');
    const priLabel = isAr ? (habit.priority === 'high' ? 'عالية' : habit.priority === 'medium' ? 'متوسطة' : 'منخفضة') : habit.priority;
    const diffLabel = isAr ? (habit.difficulty === 'hard' ? 'صعبة' : habit.difficulty === 'medium' ? 'متوسطة' : 'سهلة') : habit.difficulty;
    const tt = habit.trackingType ?? 'boolean';
    const trackingTypeLabel = (isAr
      ? { boolean: 'نعم / لا', count: 'عداد', timer: 'مؤقت', checklist: 'قائمة', duration: 'مدة يدوية' }
      : { boolean: 'Yes / No', count: 'Counter', timer: 'Timer', checklist: 'Checklist', duration: 'Duration log' })[tt] ?? tt;
    const trackingDetail = (() => {
      if (tt === 'count' && habit.targetValue != null)
        return `${habit.targetValue} ${habit.targetUnit ?? (isAr ? 'مرة' : 'times')}`;
      if (tt === 'checklist' && (habit.checklistItems?.length ?? 0) > 0)
        return `${habit.checklistItems!.length} ${isAr ? 'عناصر' : 'items'}`;
      if ((tt === 'timer' || tt === 'duration' || tt === 'boolean') && habit.expectedDuration)
        return formatDurationSecs(habit.expectedDuration);
      return isAr ? 'بدون هدف رقمي إضافي' : 'No extra numeric target';
    })();
    const scheduleHint = (() => {
      const parts: string[] = [];
      if (habit.frequency === 'weekly' && habit.weeklyTarget != null && habit.weeklyTarget > 0)
        parts.push(isAr ? `${habit.weeklyTarget} مرات بالأسبوع` : `${habit.weeklyTarget}× per week`);
      if (habit.frequency === 'custom') {
        if (habit.customScheduleType) {
          const cs = isAr ? CUSTOM_SCHEDULE_LABELS[habit.customScheduleType]?.ar : CUSTOM_SCHEDULE_LABELS[habit.customScheduleType]?.en;
          if (cs) parts.push(cs);
        }
        if (habit.customDays?.length) {
          const labels = isAr ? DAY_LABELS.ar : DAY_LABELS.en;
          parts.push(habit.customDays.map(d => labels[d]).join(isAr ? '، ' : ', '));
        }
        if (habit.customMonthDays?.length)
          parts.push(isAr ? `أيام الشهر: ${habit.customMonthDays.join('، ')}` : `Month days: ${habit.customMonthDays.join(', ')}`);
      }
      return parts.length ? parts.join(' · ') : '';
    })();
    const reminderDaysLine = (() => {
      if (!habit.reminderEnabled) return '';
      if (!habit.reminderDays?.length) return isAr ? 'كل الأيام' : 'All days';
      return habit.reminderDays.map(d => (isAr ? DAY_LABELS.ar : DAY_LABELS.en)[d]).join(isAr ? '، ' : ', ');
    })();
    const reminderTitle = (() => {
      if (!habit.reminderEnabled) return '';
      const time = habit.reminderTime ? to12h(habit.reminderTime) : '';
      return [time || (isAr ? 'بدون وقت محدد' : 'No set time'), reminderDaysLine].join(' · ');
    })();

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
          {/* Actions + week strip — one row on sm+, stacked on narrow screens */}
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:items-stretch sm:gap-2.5">
            <div
              className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-stretch sm:justify-center sm:gap-1.5 sm:shrink-0 sm:w-[8.75rem] md:w-[9.25rem] rounded-xl p-1 sm:p-1.5"
              style={{ border: `1px solid ${hc}45`, background: `${hc}06` }}>
              <button onClick={() => {
                const inW = isWithinWindow(habit);
                const wExp = isWindowPassed(habit);
                if (habit.archived) {
                  toast.notifyWarning(isAr ? 'مؤرشفة' : 'Archived', isAr ? 'لا يمكن إكمال عادة مؤرشفة' : 'Cannot complete an archived habit');
                  return;
                }
                if (done) {
                  toast.notifyInfo(isAr ? 'لا يمكن التراجع' : 'Cannot undo', isAr ? 'العادة مكتملة اليوم — الالتزام يعني عدم التراجع!' : 'Habit is done today — commitment means no going back!');
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
                className={cn('group flex items-center justify-center gap-1.5 px-2 py-1.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all duration-200 active:scale-[0.95] w-full sm:w-auto',
                  done ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)] border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.08]')}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
                {done ? (isAr ? 'مكتمل' : 'Done') : (isAr ? 'لم يُنجز' : 'Not Done')}
              </button>
              <button onClick={onEdit}
                className="group flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 border text-[11px] sm:text-xs font-bold active:scale-[0.97] hover:shadow-sm w-full sm:w-auto"
                style={{ borderColor: `${hc}30`, color: hc, background: `${hc}08` }}
                title={isAr ? 'تعديل' : 'Edit'}>
                <Edit3 className="h-3.5 w-3.5 shrink-0" />
                {isAr ? 'تعديل' : 'Edit'}
              </button>
              {onArchive && (() => {
                const archivedCount = store.habits.filter(h => h.archived).length;
                return (
                  <button onClick={() => { onArchive(); onClose(); toast.notifySuccess(isAr ? (habit.archived ? 'تم استعادة العادة' : 'تم أرشفة العادة') : (habit.archived ? 'Habit restored' : 'Habit archived')); }}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 border text-[11px] sm:text-xs font-bold active:scale-[0.97] hover:shadow-sm border-amber-500/25 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 w-full sm:w-auto"
                    title={isAr ? (habit.archived ? 'استعادة' : 'أرشفة') : (habit.archived ? 'Restore' : 'Archive')}>
                    <Archive className="h-3.5 w-3.5 shrink-0" />
                    {habit.archived ? (isAr ? 'استعادة' : 'Restore') : (isAr ? 'أرشفة' : 'Archive')}
                    {archivedCount > 0 && (
                      <span className="rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-black tabular-nums text-amber-600">{archivedCount}</span>
                    )}
                  </button>
                );
              })()}
              {onDelete && (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 border text-[11px] sm:text-xs font-bold active:scale-[0.97] hover:shadow-sm border-red-500/25 text-red-500 bg-red-500/5 hover:bg-red-500/10 w-full sm:w-auto"
                  title={isAr ? 'حذف نهائي' : 'Delete permanently'}>
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  {isAr ? 'حذف' : 'Delete'}
                </button>
              )}
            </div>

            {/* Week strip — shares row with actions on sm+ */}
            <div className="rounded-xl p-1.5 sm:p-2 flex-1 min-w-0 flex flex-col justify-center" style={{ border: `1px solid ${hc}45`, background: `${hc}0a` }}>
              <div className="flex items-center gap-0">
                {weekDays.map((d, i) => {
                  const dayLabel = parseLocalDate(d.date).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'narrow' });
                  const isToday = d.date === today;
                  const isPast = d.date < today;
                  const isNotScheduled = d.color === 'not-scheduled';
                  const dayRepCount = getDoneRepCountForDate(habit, store.habitLogs, d.date);
                  return (
                    <div key={d.date} className={cn('flex-1 flex flex-col items-center gap-0.5 rounded-md py-0.5 transition-all relative min-w-0',
                      isToday && 'bg-[var(--color-primary)]/[0.08]')}
                      style={isToday ? { border: '1px solid var(--color-primary)' } : { border: '1px solid transparent' }}>
                      <span className={cn('text-[9px] sm:text-[11px] font-bold leading-none', isNotScheduled ? 'text-[var(--foreground)]/30' : isToday ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]')}>{dayLabel}</span>
                      <div className={cn('h-[22px] w-[22px] sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black',
                        isNotScheduled ? 'bg-red-500/8 text-red-400/50' :
                        d.done && d.color === 'green' ? 'bg-emerald-500 text-white' :
                        d.done && d.color === 'orange' ? 'bg-amber-500 text-white' :
                        d.done ? 'bg-emerald-500 text-white' :
                        isPast ? 'bg-red-500 text-white' :
                        isToday ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' :
                        'bg-gray-300 dark:bg-gray-600 text-[var(--foreground)]/70',
                        isToday && !isNotScheduled && 'ring-1 ring-offset-1 shadow-sm sm:ring-2')}
                        style={isToday && !isNotScheduled ? { ['--tw-ring-color' as string]: hc } : undefined}>
                        {d.done ? <Check className="h-2.5 w-2.5" /> : isNotScheduled ? '✕' : parseLocalDate(d.date).getDate()}
                      </div>
                      {dayRepCount > 1 && (
                        <span className="absolute -top-0.5 end-0 h-3.5 min-w-[14px] px-0.5 rounded-full bg-blue-500 text-white text-[8px] font-black flex items-center justify-center shadow-sm">{dayRepCount}x</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-x-2 gap-y-0.5 mt-1 pt-1 flex-wrap border-t" style={{ borderColor: `${hc}30` }}>
                {[
                  { dot: 'bg-emerald-500', label: isAr ? 'مكتمل' : 'Done' },
                  { dot: 'bg-amber-500', label: isAr ? 'متأخر' : 'Late' },
                  { dot: 'bg-red-500', label: isAr ? 'فائت' : 'Missed' },
                  { dot: 'bg-gray-300 dark:bg-gray-600', label: isAr ? 'قادم' : 'Upcoming' },
                  ...(habit.frequency !== 'daily' ? [{ dot: '', label: isAr ? 'غير مجدول' : 'N/A', naMarker: true as const }] : []),
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-0.5">
                    {'naMarker' in item && item.naMarker ? (
                      <div className="h-2 w-2 rounded-full bg-red-500/8 text-red-400/50 text-[6px] font-black flex items-center justify-center">✕</div>
                    ) : (
                      <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', item.dot)} />
                    )}
                    <span className="text-[8px] sm:text-[10px] text-[var(--foreground)] font-semibold leading-none">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

            {/* Delete confirmation — full width below actions + week */}
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
                        {isAr ? 'اكتب اسم العادة للتأكيد (عربي أو إنجليزي):' : 'Type the habit name to confirm (Arabic or English):'}
                      </label>
                      {habitNameAr && <p className="text-[10px] font-black text-red-500 mb-0.5">{habitNameAr}</p>}
                      {habitNameEn && <p className="text-[10px] font-black text-red-500 mb-1">{habitNameEn}</p>}
                      <input
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value)}
                        placeholder={isAr ? habitNameAr || habitNameEn : habitNameEn || habitNameAr}
                        className={cn('w-full rounded-lg border-2 bg-transparent px-3 py-2 text-sm font-medium focus:outline-none', isDeleteConfirmed ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-red-500/20 focus:border-red-500/50')}
                        dir="auto"
                      />
                      {deleteConfirmText.trim() && !isDeleteConfirmed && (
                        <p className="text-[10px] text-red-400 mt-1">{isAr ? 'الاسم غير مطابق — اكتب الاسم بالضبط' : 'Name does not match — type the exact name'}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]">
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => {
                          if (isDeleteConfirmed) { onDelete(); onClose(); toast.notifySuccess(isAr ? 'تم حذف العادة نهائياً' : 'Habit permanently deleted'); }
                          else { toast.notifyWarning(isAr ? 'اكتب اسم العادة أولاً' : 'Type the habit name first', isAr ? 'يجب كتابة الاسم بالعربي أو الإنجليزي للتأكيد' : 'Type the Arabic or English name to confirm deletion'); }
                        }}
                        className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all', isDeleteConfirmed ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm' : 'bg-red-500/20 text-red-500/50 hover:bg-red-500/30 cursor-pointer')}>
                        {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* ── BODY: 3-column grid ── */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-4 pt-2">
          {/* Action zone — compact */}
          <div className="rounded-xl p-3 mb-3" style={{ background: `${hc}05`, border: `1px solid ${hc}12` }} onClick={e => e.stopPropagation()}>
            {hasDuration && !habit.archived && (() => {
              const todayTimerSecs = store.habitLogs
                .filter(l => l.habitId === habit.id && l.date === today)
                .reduce((s, l) => s + (l.duration ?? 0), 0);
              const exp = habit.expectedDuration || 0;
              return (
              <div
                className="flex flex-col gap-2 rounded-xl border p-2 sm:p-2.5 transition-shadow duration-200 motion-safe:hover:shadow-md"
                style={{ borderColor: `${hc}35`, background: `linear-gradient(180deg, ${hc}0c, ${hc}04)` }}>
                <div className="flex items-center justify-between gap-2 border-b pb-1.5" style={{ borderColor: `${hc}22` }}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${hc}18`, border: `1px solid ${hc}30` }}>
                      <Timer className="h-3.5 w-3.5" style={{ color: hc }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[var(--foreground)] leading-tight">{isAr ? 'مؤقت الجلسة' : 'Session timer'}</p>
                      <p className="text-[11px] font-semibold text-[var(--foreground)]/50 truncate">
                        {isAr ? 'الهدف' : 'Target'}: {formatDurationSecs(exp)}
                        {habit.maxDailyReps != null && habit.maxDailyReps > 0 && (
                          <span className="text-[var(--foreground)]/35"> · {isAr ? 'الحد' : 'Cap'} {habit.maxDailyReps}/{isAr ? 'يوم' : 'day'}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="sm" dense customDurationSecs={customTimerSecs !== exp ? customTimerSecs : undefined} />

                <div className="rounded-lg border overflow-hidden" style={{ borderColor: `${hc}28`, background: `${hc}06` }}>
                  <button
                    type="button"
                    onClick={() => setTimerDetailsOpen(o => !o)}
                    aria-expanded={timerDetailsOpen}
                    className={cn(
                      'group flex w-full items-center justify-between gap-2 px-2.5 py-2 text-start transition-all duration-200',
                      'hover:bg-[var(--foreground)]/[0.05] motion-safe:active:scale-[0.998]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]/35',
                      timerDetailsOpen && 'bg-[var(--foreground)]/[0.04]',
                    )}>
                    <span className="text-[11px] font-bold text-[var(--foreground)]">
                      {isAr ? 'مدة مخصصة وتفاصيل إضافية' : 'Custom duration & details'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold text-[var(--foreground)]/40 group-hover:text-[var(--foreground)]/60">
                        {timerDetailsOpen ? (isAr ? 'طي' : 'Hide') : (isAr ? 'عرض' : 'Show')}
                      </span>
                      <ChevronDown className={cn('h-4 w-4 text-[var(--foreground)]/40 transition-transform duration-200', timerDetailsOpen && 'rotate-180')} style={{ color: timerDetailsOpen ? hc : undefined }} />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {timerDetailsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t"
                        style={{ borderColor: `${hc}22` }}>
                        <div className="max-h-[min(280px,48svh)] overflow-y-auto overscroll-contain space-y-2 p-2 sm:p-2.5">
                          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            <div className="rounded-md px-2 py-1.5 transition-colors duration-200 hover:bg-[var(--foreground)]/[0.04]" style={{ border: `1px solid ${hc}18` }} title={isAr ? 'يُحتسب مكتملًا عند بلوغ هذه المدة في الجلسة.' : 'A session counts complete when this much time is logged.'}>
                              <p className="text-[8px] font-bold uppercase tracking-wide text-[var(--foreground)]/45">{isAr ? 'هدف الإكمال' : 'Completion target'}</p>
                              <p className="text-xs font-black tabular-nums mt-0.5" style={{ color: hc }}>{formatDurationSecs(exp)}</p>
                              <p className="text-[9px] text-[var(--foreground)]/50 mt-0.5 line-clamp-2 leading-snug">{isAr ? 'مكتمل عند بلوغ المدة في الجلسة.' : 'Complete when this duration is logged in a session.'}</p>
                            </div>
                            <div className="rounded-md px-2 py-1.5 transition-colors duration-200 hover:bg-[var(--foreground)]/[0.04]" style={{ border: `1px solid ${hc}18` }} title={isAr ? 'مجموع الجلسات المسجّلة لهذا اليوم.' : 'Total time logged for this habit today.'}>
                              <p className="text-[8px] font-bold uppercase tracking-wide text-[var(--foreground)]/45">{isAr ? 'مدة اليوم' : 'Logged today'}</p>
                              <p className="text-xs font-black tabular-nums mt-0.5 text-[var(--foreground)]">{formatDurationSecs(todayTimerSecs)}</p>
                              <p className="text-[9px] text-[var(--foreground)]/50 mt-0.5 line-clamp-2 leading-snug">{isAr ? 'إجمالي الوقت المسجّل اليوم.' : 'Total logged today.'}</p>
                            </div>
                            {habit.windowStart && habit.windowEnd && (
                              <div className="rounded-md px-2 py-1.5 sm:col-span-2 transition-colors duration-200 hover:bg-[var(--foreground)]/[0.04]" style={{ border: `1px solid ${hc}18` }}>
                                <p className="text-[8px] font-bold uppercase tracking-wide text-[var(--foreground)]/45">{isAr ? 'نافذة المؤقت' : 'Timer window'}</p>
                                <p className="text-[11px] font-bold mt-0.5">{to12h(habit.windowStart)} – {to12h(habit.windowEnd)}{habit.strictWindow ? (isAr ? ' (إجباري)' : ' (strict)') : ''}</p>
                              </div>
                            )}
                          </div>

                          {!isTimerActive && (
                            <div className="rounded-lg p-2 transition-shadow duration-200 hover:shadow-sm" style={{ background: `${hc}0a`, border: `1px solid ${hc}20` }}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50">
                                  {isAr ? 'مدة العد التنازلي' : 'Countdown duration'}
                                </span>
                                {customTimerSecs !== exp && (
                                  <button
                                    type="button"
                                    onClick={() => setCustomTimerSecs(exp)}
                                    className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all duration-200 hover:brightness-110 motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]"
                                    style={{ color: hc, background: `${hc}18`, border: `1px solid ${hc}30` }}>
                                    {isAr ? 'إعادة تعيين' : 'Reset'}
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                <div className="text-center">
                                  <label className="text-[8px] font-semibold text-[var(--foreground)]/45 block mb-0.5">{isAr ? 'ساعات' : 'Hours'}</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={23}
                                    value={customTimerH}
                                    onChange={e => setCustomHMS(Math.max(0, Math.min(23, Number(e.target.value) || 0)), customTimerM, customTimerS)}
                                    className="w-full rounded-md app-input px-1 py-1.5 text-xs text-center font-mono font-bold transition-all duration-200 hover:border-[var(--foreground)]/25 focus:border-[var(--color-primary)]/50" />
                                </div>
                                <div className="text-center">
                                  <label className="text-[8px] font-semibold text-[var(--foreground)]/45 block mb-0.5">{isAr ? 'دقائق' : 'Minutes'}</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={customTimerM}
                                    onChange={e => setCustomHMS(customTimerH, Math.max(0, Math.min(59, Number(e.target.value) || 0)), customTimerS)}
                                    className="w-full rounded-md app-input px-1 py-1.5 text-xs text-center font-mono font-bold transition-all duration-200 hover:border-[var(--foreground)]/25 focus:border-[var(--color-primary)]/50" />
                                </div>
                                <div className="text-center">
                                  <label className="text-[8px] font-semibold text-[var(--foreground)]/45 block mb-0.5">{isAr ? 'ثواني' : 'Seconds'}</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={customTimerS}
                                    onChange={e => setCustomHMS(customTimerH, customTimerM, Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                                    className="w-full rounded-md app-input px-1 py-1.5 text-xs text-center font-mono font-bold transition-all duration-200 hover:border-[var(--foreground)]/25 focus:border-[var(--color-primary)]/50" />
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5 text-[9px] font-semibold">
                                <span className="text-[var(--foreground)]/45">
                                  {isAr ? 'الهدف الأصلي:' : 'Original:'}{' '}
                                  <span className="text-[var(--foreground)]">{formatDurationSecs(exp)}</span>
                                </span>
                                {customTimerSecs !== exp && (
                                  <span style={{ color: hc }}>{isAr ? 'العد التنازلي:' : 'Countdown:'} {formatDurationSecs(customTimerSecs)}</span>
                                )}
                              </div>
                              {customTimerSecs > exp && (
                                <p className="text-[9px] mt-1.5 text-emerald-600 font-semibold leading-snug">
                                  {isAr ? `✓ إنجاز عند ${formatDurationSecs(exp)} — يمكن إطالة العدّ.` : `✓ Completes at ${formatDurationSecs(exp)} — can run longer.`}
                                </p>
                              )}
                              {customTimerSecs > 0 && customTimerSecs < exp && (
                                <p className="text-[9px] mt-1.5 text-amber-600 font-semibold leading-snug">
                                  {isAr ? '⚠ أقل من هدف الإكمال.' : '⚠ Below completion target.'}
                                </p>
                              )}
                            </div>
                          )}

                          {isTimerActive && (
                            <p className="text-[10px] font-medium text-[var(--foreground)]/50 px-0.5">
                              {isAr ? 'أوقف المؤقت لضبط مدة العد التنازلي.' : 'Stop the timer to adjust countdown duration.'}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              );
            })()}
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
                // If all items are already done (habit completed), block unchecking
                if (clAllDone) {
                  toast.notifyInfo(isAr ? 'لا يمكن التراجع' : 'Cannot undo', isAr ? 'القائمة مكتملة — الالتزام يعني عدم التراجع!' : 'Checklist complete — commitment means no going back!');
                  return;
                }
                const wasChecked = typeof clState[itemId] === 'object' ? (clState[itemId] as { done: boolean }).done : !!clState[itemId];
                // Block unchecking individual items that are already checked
                if (wasChecked) {
                  toast.notifyInfo(isAr ? 'لا يمكن التراجع' : 'Cannot undo', isAr ? 'لا يمكن إلغاء تحديد عنصر مكتمل' : 'Cannot uncheck a completed item');
                  return;
                }
                const newState: Record<string, boolean> = {};
                clItems.forEach(item => { newState[item.id] = item.id === itemId ? true : (typeof clState[item.id] === 'object' ? (clState[item.id] as { done: boolean }).done : !!clState[item.id]); });
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
                  toast.notifyInfo(isAr ? 'لا يمكن التراجع' : 'Cannot undo', isAr ? 'العادة مكتملة اليوم — الالتزام يعني عدم التراجع!' : 'Habit is done today — commitment means no going back!');
                  return;
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
                  {done ? (isAr ? '✓ مكتملة اليوم' : '✓ Done Today')
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

          {/* Stats + milestone dates — side by side md+, compact type, hover polish */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 items-stretch">
            <div
              className="rounded-xl p-1.5 h-full"
              style={{ border: `1px solid ${hc}40`, background: `${hc}08` }}>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: isAr ? 'سلسلة' : 'Streak', value: streak.current, suffix: isAr ? 'ي' : 'd', color: '#f97316' },
                  { label: isAr ? 'أفضل' : 'Best', value: streak.best, suffix: isAr ? 'ي' : 'd', color: '#eab308' },
                  { label: isAr ? 'مجمل' : 'Total', value: stats.totalCompletions, suffix: '', color: '#22c55e' },
                  { label: isAr ? 'نسبة' : 'Rate', value: stats.completionRate, suffix: '%', color: '#3b82f6' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="text-center rounded-lg py-1 px-0.5 min-w-0 transition-all duration-200 ease-out cursor-default hover:-translate-y-px hover:shadow-sm hover:brightness-[1.02] dark:hover:brightness-[1.06]"
                    style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
                    <p className="text-[9px] font-semibold text-[var(--foreground)]/65 uppercase tracking-wide leading-none">{s.label}</p>
                    <p className="text-sm font-black tabular-nums leading-tight mt-0.5" style={{ color: s.color }}>
                      {s.value}<span className="text-[9px] font-bold opacity-60">{s.suffix}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={cn(
                'rounded-xl p-1.5 h-full grid gap-1 min-w-0',
                habit.endDate ? 'grid-cols-3' : 'grid-cols-2',
              )}
              style={{ border: `1px solid ${hc}40`, background: `${hc}08` }}>
              <div
                className="flex flex-col items-center justify-center text-center rounded-lg py-1 px-1 min-w-0 transition-all duration-200 ease-out cursor-default hover:-translate-y-px hover:shadow-sm hover:brightness-[1.02] dark:hover:brightness-[1.06]"
                style={{ background: '#8b5cf60c', border: '1px solid #8b5cf624' }}>
                <CalendarDays className="h-2.5 w-2.5 text-violet-500 shrink-0 mb-0.5 opacity-90" />
                <p className="text-[8px] font-semibold text-[var(--foreground)]/60 uppercase tracking-wide leading-none">{isAr ? 'أول إنجاز' : 'First'}</p>
                {firstDone
                  ? <p className="text-xs font-bold text-violet-600 tabular-nums leading-tight mt-0.5 truncate max-w-full">{parseLocalDate(firstDone).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' })}</p>
                  : <p className="text-[10px] text-[var(--foreground)]/40 mt-0.5 tabular-nums">—</p>}
              </div>
              <div
                className="flex flex-col items-center justify-center text-center rounded-lg py-1 px-1 min-w-0 transition-all duration-200 ease-out cursor-default hover:-translate-y-px hover:shadow-sm hover:brightness-[1.02] dark:hover:brightness-[1.06]"
                style={{ background: '#06b6d40c', border: '1px solid #06b6d424' }}>
                <CalendarDays className="h-2.5 w-2.5 text-cyan-500 shrink-0 mb-0.5 opacity-90" />
                <p className="text-[8px] font-semibold text-[var(--foreground)]/60 uppercase tracking-wide leading-none">{isAr ? 'آخر إنجاز' : 'Last'}</p>
                {lastDone
                  ? <p className="text-xs font-bold text-cyan-600 tabular-nums leading-tight mt-0.5 truncate max-w-full">{parseLocalDate(lastDone).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' })}</p>
                  : <p className="text-[10px] text-[var(--foreground)]/40 mt-0.5 tabular-nums">—</p>}
              </div>
              {habit.endDate && (() => {
                const diff = Math.ceil((new Date(habit.endDate).getTime() - Date.now()) / 86400000);
                return (
                  <div
                    className="flex flex-col items-center justify-center text-center rounded-lg py-1 px-1 min-w-0 transition-all duration-200 ease-out cursor-default hover:-translate-y-px hover:shadow-sm hover:brightness-[1.02] dark:hover:brightness-[1.06]"
                    style={{ background: diff > 0 ? '#10b9810c' : '#ef44440c', border: `1px solid ${diff > 0 ? '#10b98124' : '#ef444424'}` }}>
                    <Target className={cn('h-2.5 w-2.5 shrink-0 mb-0.5 opacity-90', diff > 0 ? 'text-emerald-500' : 'text-red-500')} />
                    <p className="text-[8px] font-semibold text-[var(--foreground)]/60 uppercase tracking-wide leading-none">{isAr ? 'النهاية' : 'Ends'}</p>
                    <p className={cn('text-xs font-bold tabular-nums leading-tight mt-0.5 truncate max-w-full', diff > 0 ? 'text-emerald-600' : 'text-red-500')}>
                      {parseLocalDate(habit.endDate).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[8px] font-semibold text-[var(--foreground)]/50 leading-none mt-px">
                      {diff > 0
                        ? `${diff}${isAr ? 'ي' : 'd'}`
                        : diff === 0
                          ? (isAr ? 'اليوم' : 'Today')
                          : `${Math.abs(diff)}${isAr ? 'ي' : 'd'} ${isAr ? 'فات' : 'ago'}`}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Habit details — compact centered control */}
          <div className="mb-3">
            <div className="flex justify-center">
              <button
                type="button"
                id="habit-details-trigger"
                aria-expanded={habitDetailsOpen}
                aria-controls="habit-details-panel"
                aria-label={habitDetailsOpen
                  ? (isAr ? 'طي تفاصيل العادة' : 'Collapse habit details')
                  : (isAr ? 'عرض تفاصيل العادة' : 'Expand habit details')}
                onClick={() => setHabitDetailsOpen(o => !o)}
                className={cn(
                  'group relative isolate inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 overflow-hidden rounded-xl border px-3.5 py-2 sm:gap-x-2.5 sm:px-4 sm:py-2.5',
                  'transition-[border-color,box-shadow,transform] duration-200 ease-out',
                  'motion-safe:hover:shadow-md motion-safe:active:scale-[0.98]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]',
                  habitDetailsOpen && 'shadow-sm',
                )}
                style={{
                  borderColor: habitDetailsOpen ? `${hc}55` : `${hc}40`,
                  backgroundColor: habitDetailsOpen ? `${hc}12` : `${hc}08`,
                  boxShadow: habitDetailsOpen ? `0 2px 12px -4px ${hc}35` : undefined,
                }}>
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ background: `linear-gradient(135deg, ${hc}28, ${hc}0c)` }}
                  aria-hidden
                />
                <ListChecks className="relative z-[1] h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ color: hc }} strokeWidth={2.25} />
                <span className="relative z-[1] text-sm font-bold tracking-tight text-[var(--foreground)]">
                  {isAr ? 'تفاصيل العادة' : 'Habit details'}
                </span>
                <span
                  className="relative z-[1] max-w-[10rem] truncate text-[10px] font-medium text-[var(--foreground)]/45 sm:max-w-[14rem] sm:text-[11px]"
                  title={`${catLabel} · ${freqLabel} · ${typeLabel}`}>
                  {catLabel}
                </span>
                <span className="relative z-[1] shrink-0 text-[10px] font-semibold text-[var(--foreground)]/38 sm:text-[11px]">
                  {habitDetailsOpen
                    ? (isAr ? 'انقر للطي' : 'Click to hide')
                    : (isAr ? 'انقر للتفاصيل' : 'Click for details')}
                </span>
                <ChevronDown
                  className={cn(
                    'relative z-[1] h-4 w-4 shrink-0 transition-transform duration-200 ease-out',
                    !habitDetailsOpen && 'text-[var(--foreground)]/40 group-hover:text-[var(--foreground)]/70',
                    habitDetailsOpen && 'rotate-180',
                  )}
                  style={habitDetailsOpen ? { color: hc } : undefined}
                  aria-hidden
                />
              </button>
            </div>
            <AnimatePresence initial={false}>
              {habitDetailsOpen && (
                <motion.div
                  id="habit-details-panel"
                  role="region"
                  aria-labelledby="habit-details-trigger"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-2 overflow-hidden rounded-xl border"
                  style={{ borderColor: `${hc}38`, background: `${hc}06` }}>
                  <div className="px-2 py-2 sm:px-2.5 sm:py-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[min(58vh,520px)] overflow-y-auto overscroll-contain [scrollbar-gutter:stable] pe-1">
              <div
                className={cn(detailChip, 'bg-[var(--foreground)]/[0.03] border-[var(--foreground)]/[0.12]')}
                title={catLabel}>
                <div className="flex items-start gap-1.5">
                  <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--foreground)]/50 transition-transform duration-200 group-hover:scale-110" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'التصنيف' : 'Category'}</p>
                    <p className="text-xs font-bold text-[var(--foreground)] leading-snug mt-0.5 break-words">{catLabel}</p>
                  </div>
                </div>
              </div>
              <div
                className={cn(detailChip, 'bg-slate-500/6 border-slate-500/15')}
                title={scheduleHint ? `${freqLabel} — ${scheduleHint}` : freqLabel}>
                <div className="flex items-start gap-1.5">
                  <CalendarIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 group-hover:scale-110" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'التكرار' : 'Frequency'}</p>
                    <p className="text-xs font-bold text-[var(--foreground)] leading-snug mt-0.5">{freqLabel}</p>
                    {scheduleHint ? <p className="text-[10px] text-[var(--foreground)]/55 leading-tight mt-0.5 line-clamp-2">{scheduleHint}</p> : null}
                  </div>
                </div>
              </div>
              <div className={cn(detailChip, 'bg-violet-500/8 border-violet-500/18')} title={typeLabel}>
                <div className="flex items-start gap-1.5">
                  <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500 transition-transform duration-200 group-hover:scale-110" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'النوع' : 'Type'}</p>
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-300 leading-snug mt-0.5">{typeLabel}</p>
                  </div>
                </div>
              </div>
              <div className={cn(detailChip, 'bg-amber-500/8 border-amber-500/18')} title={priLabel}>
                <div className="flex items-start gap-1.5">
                  <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'الأولوية' : 'Priority'}</p>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-200 leading-snug mt-0.5">{priLabel}</p>
                  </div>
                </div>
              </div>
              <div className={cn(detailChip, 'bg-teal-500/8 border-teal-500/18')} title={diffLabel}>
                <div className="flex items-start gap-1.5">
                  <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500 transition-transform duration-200 group-hover:scale-110" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'الصعوبة' : 'Difficulty'}</p>
                    <p className="text-xs font-bold text-teal-800 dark:text-teal-200 leading-snug mt-0.5">{diffLabel}</p>
                  </div>
                </div>
              </div>
              <div
                className={cn(detailChip, 'bg-blue-500/8 border-blue-500/18')}
                title={`${trackingTypeLabel} — ${trackingDetail}`}>
                <div className="flex items-start gap-1.5">
                  <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500 transition-transform duration-200 group-hover:scale-110" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'طريقة التتبع' : 'Tracking'}</p>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-snug mt-0.5">{trackingTypeLabel}</p>
                    <p className="text-[10px] text-[var(--foreground)]/55 leading-tight mt-0.5 line-clamp-2">{trackingDetail}</p>
                  </div>
                </div>
              </div>
              {habit.maxDailyReps != null && habit.maxDailyReps > 0 && (
                <div
                  className={cn(detailChip, 'bg-orange-500/8 border-orange-500/18')}
                  title={isAr ? `حتى ${habit.maxDailyReps} جلسة في اليوم` : `Up to ${habit.maxDailyReps} sessions per day`}>
                  <div className="flex items-start gap-1.5">
                    <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'جلسات / يوم' : 'Sessions / day'}</p>
                      <p className="text-xs font-bold text-orange-700 dark:text-orange-300 leading-snug mt-0.5">{habit.maxDailyReps}</p>
                    </div>
                  </div>
                </div>
              )}
              {habit.reminderEnabled && (
                <div
                  className={cn(detailChip, 'bg-cyan-500/8 border-cyan-500/18')}
                  title={reminderTitle}>
                  <div className="flex items-start gap-1.5">
                    <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'التذكير' : 'Reminder'}</p>
                      <p className="text-xs font-bold text-cyan-800 dark:text-cyan-200 leading-snug mt-0.5">
                        {habit.reminderTime ? to12h(habit.reminderTime) : (isAr ? 'مفعّل' : 'On')}
                      </p>
                      <p className="text-[10px] text-[var(--foreground)]/55 leading-tight mt-0.5 line-clamp-2">{reminderDaysLine}</p>
                    </div>
                  </div>
                </div>
              )}
              {(habit.goalReps != null && habit.goalReps > 0) && (
                <div className={cn(detailChip, 'bg-emerald-500/8 border-emerald-500/18')} title={isAr ? `هدف ${habit.goalReps} تكرار` : `Goal: ${habit.goalReps} reps`}>
                  <div className="flex items-start gap-1.5">
                    <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'هدف التكرارات' : 'Reps goal'}</p>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 leading-snug mt-0.5">{habit.goalReps}</p>
                    </div>
                  </div>
                </div>
              )}
              {(habit.goalHours != null && habit.goalHours > 0) && (
                <div className={cn(detailChip, 'bg-purple-500/8 border-purple-500/18')} title={isAr ? `هدف ${habit.goalHours} ساعة` : `Goal: ${habit.goalHours} hrs`}>
                  <div className="flex items-start gap-1.5">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'هدف الساعات' : 'Hours goal'}</p>
                      <p className="text-xs font-bold text-purple-700 dark:text-purple-300 leading-snug mt-0.5">{habit.goalHours}{isAr ? ' س' : ' h'}</p>
                    </div>
                  </div>
                </div>
              )}
              {(habit.allowPartial || habit.allowSkip) && (
                <div
                  className={cn(detailChip, 'bg-[var(--foreground)]/[0.04] border-[var(--foreground)]/[0.12]')}
                  title={[
                    habit.allowPartial && (isAr ? 'يسمح بإنجاز جزئي' : 'Partial completion allowed'),
                    habit.allowSkip && (isAr ? 'يسمح بالتخطي مع عذر' : 'Skip with excuse allowed'),
                  ].filter(Boolean).join(' · ')}>
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--foreground)]/45 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'سلوك التسجيل' : 'Logging rules'}</p>
                      <p className="text-xs font-bold leading-snug mt-0.5 text-[var(--foreground)]">
                        {[habit.allowPartial && (isAr ? 'جزئي' : 'Partial'), habit.allowSkip && (isAr ? 'تخطٍ' : 'Skip')].filter(Boolean).join(isAr ? ' · ' : ' · ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {(isAr ? habit.placeAr : habit.placeEn) && (
                <div
                  className={cn(detailChip, 'bg-violet-500/8 border-violet-500/18')}
                  title={isAr ? (habit.placeAr ?? '') : (habit.placeEn ?? '')}>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'المكان' : 'Place'}</p>
                      <p className="text-xs font-bold text-violet-700 dark:text-violet-300 leading-snug mt-0.5 break-words">{isAr ? habit.placeAr : habit.placeEn}</p>
                    </div>
                  </div>
                </div>
              )}
              {habit.preferredTime && (
                <div className={cn(detailChip, 'bg-sky-500/8 border-sky-500/18')} title={to12h(habit.preferredTime)}>
                  <div className="flex items-start gap-1.5">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'الوقت المفضل' : 'Preferred time'}</p>
                      <p className="text-xs font-bold text-sky-700 dark:text-sky-300 leading-snug mt-0.5">{to12h(habit.preferredTime)}</p>
                    </div>
                  </div>
                </div>
              )}
              {habit.expectedDuration != null && habit.expectedDuration > 0 && (
                <div className={cn(detailChip, 'bg-emerald-500/8 border-emerald-500/18')} title={formatDurationSecs(habit.expectedDuration)}>
                  <div className="flex items-start gap-1.5">
                    <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'المدة المتوقعة' : 'Expected duration'}</p>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 leading-snug mt-0.5">{formatDurationSecs(habit.expectedDuration)}</p>
                    </div>
                  </div>
                </div>
              )}
              {habit.windowStart && habit.windowEnd && (
                <div
                  className={cn(
                    detailChip,
                    habit.strictWindow ? 'bg-red-500/8 border-red-500/20' : 'bg-indigo-500/8 border-indigo-500/18',
                  )}
                  title={`${to12h(habit.windowStart)}–${to12h(habit.windowEnd)}${habit.strictWindow ? (isAr ? ' (إجباري)' : ' (strict)') : ''}`}>
                  <div className="flex items-start gap-1.5">
                    <Target className={cn('mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110', habit.strictWindow ? 'text-red-500' : 'text-indigo-500')} />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">
                        {habit.strictWindow ? (isAr ? 'نافذة إجبارية' : 'Strict window') : (isAr ? 'نافذة النشاط' : 'Activity window')}
                      </p>
                      <p className={cn('text-xs font-bold leading-snug mt-0.5', habit.strictWindow ? 'text-red-700 dark:text-red-300' : 'text-indigo-700 dark:text-indigo-300')}>
                        {to12h(habit.windowStart)}–{to12h(habit.windowEnd)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {habit.completionWindowStart && habit.completionWindowEnd && (
                <div
                  className={cn(detailChip, 'bg-fuchsia-500/8 border-fuchsia-500/18')}
                  title={isAr ? `يمكنك تسجيل الإنجاز بين ${to12h(habit.completionWindowStart)} و ${to12h(habit.completionWindowEnd)}` : `Mark done between ${to12h(habit.completionWindowStart)} and ${to12h(habit.completionWindowEnd)}`}>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fuchsia-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'نافذة التسجيل' : 'Mark-done window'}</p>
                      <p className="text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300 leading-snug mt-0.5">
                        {to12h(habit.completionWindowStart)}–{to12h(habit.completionWindowEnd)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {habit.strictWindow && habit.windowStart && habit.windowEnd && (
                <div
                  className={cn(detailChip, 'sm:col-span-2 lg:col-span-3 bg-red-500/8 border-red-500/20')}
                  title={isAr ? 'خارج النافذة يُحسب فائتًا' : 'Outside window counts as missed'}>
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-red-600/80 leading-none">{isAr ? 'تنبيه' : 'Notice'}</p>
                      <p className="text-xs font-bold text-red-700 dark:text-red-300 leading-snug mt-0.5">
                        {isAr ? 'يجب إنجاز العادة داخل النافذة — وإلا تُحسب فائتة تلقائيًا.' : 'Must complete inside the window — otherwise it counts as missed automatically.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {habit.notes && habit.notes.trim() && (
                <div
                  className={cn(detailChip, 'sm:col-span-2 lg:col-span-3 bg-[var(--foreground)]/[0.03] border-[var(--foreground)]/[0.12]')}
                  title={habit.notes.trim()}>
                  <div className="flex items-start gap-1.5">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 transition-transform duration-200 group-hover:scale-110" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--foreground)]/50 leading-none">{isAr ? 'ملاحظات' : 'Notes'}</p>
                      <p className="text-xs font-semibold text-[var(--foreground)] leading-snug mt-0.5 line-clamp-3 whitespace-pre-wrap break-words">{habit.notes.trim()}</p>
                    </div>
                  </div>
                </div>
              )}
              {!hasContext && !habit.reminderEnabled && !(habit.goalReps && habit.goalReps > 0) && !(habit.goalHours && habit.goalHours > 0) && !habit.allowPartial && !habit.allowSkip && !habit.notes?.trim() && (
                <div className="sm:col-span-2 lg:col-span-3 text-[10px] text-[var(--foreground)]/45 flex items-center gap-1.5 py-1">
                  <MapPin className="h-3 w-3 shrink-0 opacity-50" />
                  {isAr ? 'أضف مكانًا أو وقتًا مفضلًا أو مدة من تعديل العادة لظهورها هنا.' : 'Add place, preferred time, or duration from Edit to show context chips here.'}
                </div>
              )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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

            {/* Right: Analytics — dense stack */}
            <div className="space-y-1.5">
              {/* Repetitions */}
              <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${hc}45`, background: `${hc}0a` }}>
                <div className="px-2 py-0.5 flex items-center gap-1" style={{ borderBottom: `1px solid ${hc}35` }}>
                  <Hash className="h-2.5 w-2.5 shrink-0" style={{ color: hc }} />
                  <span className="text-[10px] font-bold text-[var(--foreground)] leading-tight">{isAr ? 'التكرارات' : 'Reps'}</span>
                </div>
                <div className="px-1 py-1 grid grid-cols-4 gap-0.5">
                  {[
                    { l: isAr ? 'أسبوع' : 'Week', v: timeStats.reps.week },
                    { l: isAr ? 'شهر' : 'Month', v: timeStats.reps.month },
                    { l: isAr ? 'سنة' : 'Year', v: timeStats.reps.year },
                    { l: isAr ? 'مجمل' : 'Total', v: timeStats.reps.total },
                  ].map((r, i) => (
                    <div key={i} className="text-center rounded-md py-1 px-0.5 cursor-default min-w-0" style={{ background: `${hc}08`, border: `1px solid ${hc}18` }}>
                      <p className="text-sm font-black tabular-nums leading-none" style={{ color: hc }}>{r.v}</p>
                      <p className="text-[9px] text-[var(--foreground)] font-bold leading-tight mt-0.5 truncate">{r.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time spent */}
              <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${hc}45`, background: `${hc}0a` }}>
                <div className="px-2 py-0.5 flex items-center gap-1" style={{ borderBottom: `1px solid ${hc}35` }}>
                  <Clock className="h-2.5 w-2.5 shrink-0" style={{ color: hc }} />
                  <span className="text-[10px] font-bold text-[var(--foreground)] leading-tight">{isAr ? 'الوقت' : 'Time'}</span>
                </div>
                {!habit.expectedDuration && habit.trackingType !== 'duration' ? (
                  <div className="px-2 py-1.5 text-center">
                    <p className="text-[10px] font-semibold opacity-50 leading-tight">{isAr ? 'هذه العادة لا تتضمن وقتاً' : 'This habit does not track time'}</p>
                  </div>
                ) : (
                <div className="px-1 py-1 grid grid-cols-4 gap-0.5">
                  {[
                    { l: isAr ? 'اليوم' : 'Today', v: formatSecs(timeStats.secs.today) },
                    { l: isAr ? 'أسبوع' : 'Week', v: formatSecs(timeStats.secs.week) },
                    { l: isAr ? 'شهر' : 'Month', v: formatSecs(timeStats.secs.month) },
                    { l: isAr ? 'سنة' : 'Year', v: formatSecs(timeStats.secs.year) },
                  ].map((r, i) => (
                    <div key={i} className="text-center rounded-md py-1 px-0.5 cursor-default min-w-0" style={{ background: `${hc}08`, border: `1px solid ${hc}18` }}>
                      <p className="text-[10px] sm:text-[11px] font-black leading-tight break-words hyphens-auto" style={{ color: hc }}>{r.v}</p>
                      <p className="text-[9px] text-[var(--foreground)] font-bold leading-tight mt-0.5 truncate">{r.l}</p>
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
                  <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${hc}45`, background: `${hc}0a` }}>
                    <div className="px-2 py-0.5 flex items-center gap-1" style={{ borderBottom: `1px solid ${hc}35` }}>
                      <Target className="h-2.5 w-2.5 shrink-0" style={{ color: hc }} />
                      <span className="text-[10px] font-bold text-[var(--foreground)] leading-tight">{isAr ? 'الهدف الكلي' : 'Overall Goal'}</span>
                    </div>
                    <div className="px-2 py-2 flex flex-col items-center justify-center gap-0.5">
                      <Target className="h-3 w-3 text-[var(--foreground)] opacity-60" />
                      <p className="text-[9px] italic text-[var(--foreground)] text-center leading-tight">{isAr ? 'لم يتم تحديد هدف كلي' : 'No overall goal set'}</p>
                      <p className="text-[8px] text-[var(--foreground)]/70 text-center leading-tight">{isAr ? 'حدد هدف تكرارات أو ساعات من التعديل' : 'Set a reps or hours goal from Edit'}</p>
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
                  <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${hc}45`, background: `${hc}0a` }}>
                    <div className="px-2 py-0.5 flex items-center gap-1" style={{ borderBottom: `1px solid ${hc}35` }}>
                      <Target className="h-2.5 w-2.5 shrink-0" style={{ color: hc }} />
                      <span className="text-[10px] font-bold text-[var(--foreground)] leading-tight">{isAr ? 'الهدف الكلي' : 'Overall Goal'}</span>
                    </div>
                    <div className="p-2 space-y-2">
                      {/* Reps goal */}
                      {hasRepsGoal && (
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <div className="h-4 w-4 rounded flex items-center justify-center shrink-0" style={{ background: `${repsDone ? '#22c55e' : hc}15` }}>
                                <Hash className="h-2.5 w-2.5" style={{ color: repsDone ? '#22c55e' : hc }} />
                              </div>
                              <span className="text-[10px] font-bold text-[var(--foreground)] truncate">{isAr ? 'التكرارات' : 'Repetitions'}</span>
                            </div>
                            {repsDone && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-px rounded shrink-0" title={isAr ? 'تحقق' : 'Done'}>✓</span>}
                          </div>
                          <div className="flex items-baseline flex-wrap gap-x-1 gap-y-0 mb-1">
                            <span className="text-sm font-black tabular-nums" style={{ color: repsDone ? '#22c55e' : hc }}>{repsCurrentVal}</span>
                            <span className="text-[10px] font-bold text-[var(--foreground)]">/ {repsTarget}</span>
                            <span className="text-[10px] text-[var(--foreground)]">{isAr ? 'تكرار' : 'reps'}</span>
                            <span className="text-[10px] font-black tabular-nums ms-auto" style={{ color: repsDone ? '#22c55e' : hc }}>{repsPct}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: `${repsDone ? '#22c55e' : hc}12` }}>
                            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${repsPct}%`, background: repsDone ? 'linear-gradient(90deg, #22c55e, #16a34a)' : `linear-gradient(90deg, ${hc}, ${hc}cc)` }} />
                          </div>
                        </div>
                      )}
                      {/* Hours goal */}
                      {hasHoursGoal && (
                        <div>
                          {hasRepsGoal && <div className="border-t border-[var(--foreground)]/[0.12] pt-2 mt-0.5" />}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <div className="h-4 w-4 rounded flex items-center justify-center shrink-0" style={{ background: `${hoursDone ? '#22c55e' : '#8b5cf6'}15` }}>
                                <Clock className="h-2.5 w-2.5" style={{ color: hoursDone ? '#22c55e' : '#8b5cf6' }} />
                              </div>
                              <span className="text-[10px] font-bold text-[var(--foreground)] truncate">{isAr ? 'الساعات' : 'Hours'}</span>
                            </div>
                            {hoursDone && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-px rounded shrink-0" title={isAr ? 'تحقق' : 'Done'}>✓</span>}
                          </div>
                          <div className="flex items-baseline flex-wrap gap-x-1 gap-y-0 mb-1">
                            <span className="text-sm font-black tabular-nums" style={{ color: hoursDone ? '#22c55e' : '#8b5cf6' }}>{hoursCurrentVal}</span>
                            <span className="text-[10px] font-bold text-[var(--foreground)]">/ {hoursTarget}</span>
                            <span className="text-[10px] text-[var(--foreground)]">{isAr ? 'ساعة' : 'hrs'}</span>
                            <span className="text-[10px] font-black tabular-nums ms-auto" style={{ color: hoursDone ? '#22c55e' : '#8b5cf6' }}>{hoursPct}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: `${hoursDone ? '#22c55e' : '#8b5cf6'}12` }}>
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
