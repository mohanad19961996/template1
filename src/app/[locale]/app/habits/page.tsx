'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import { useHabitTimer, useStoreHabitTimer, HabitTimerControls } from '@/components/app/habit-timer-controls';
import { useTimerDisplay } from '@/lib/use-timer-display';
import { useToast } from '@/components/app/toast-notifications';
import {
  Habit, HabitLog, DEFAULT_HABIT_CATEGORIES, HabitCategory, HabitFrequency,
  HabitType, HabitTrackingType, Priority, Difficulty, todayString, generateId, ITEM_COLORS,
  WeekDay, CustomScheduleType, formatDuration, formatTimerDuration, resolveHabitColor, parseLocalDate, formatLocalDate,
} from '@/types/app';
import {
  Plus, CheckCircle2, Circle, Flame, Filter, Search, X, Archive,
  MoreHorizontal, Trash2, Edit3, Eye, ChevronDown, Calendar as CalendarIcon,
  TrendingUp, Target, Clock, BarChart3, Table2, ListChecks, PieChart,
  ChevronLeft, ChevronRight, RotateCcw, Zap, Award, Hash, Trophy, Activity,
  Sparkles, ArrowRight, Play, Pause, Square, Timer, MapPin, Repeat, Gift,
  Lightbulb, Maximize2, Hourglass, LayoutGrid, List, Columns3, Grid3x3,
  CreditCard, Palette, ArrowUpDown, SlidersHorizontal, Minus, GripVertical, Tag, Rows3, ChevronsUpDown, Check, CalendarDays, AlertCircle, Folder,
  Settings2,
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


// Helper: read checklistState entries (backward compat with old boolean format)
type ChecklistStateValue = boolean | { done: boolean; time: string | null };
const isItemDone = (state: Record<string, ChecklistStateValue> | undefined, id: string): boolean => {
  if (!state) return false;
  const v = (state as Record<string, ChecklistStateValue>)[id];
  return typeof v === 'boolean' ? v : !!(v && v.done);
};
const getItemTime = (state: Record<string, ChecklistStateValue> | undefined, id: string): string | null => {
  if (!state) return null;
  const v = (state as Record<string, ChecklistStateValue>)[id];
  return (v && typeof v === 'object') ? v.time : null;
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

const habitsHeroEase = [0.16, 1, 0.3, 1] as const;

const habitsHeroTitle = {
  container: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.13, delayChildren: 0.06 } },
  },
  icon: {
    hidden: { opacity: 0, scale: 0.6, y: 16, rotate: -12 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: 0,
      transition: { type: 'spring' as const, stiffness: 280, damping: 20 },
    },
  },
  heading: {
    hidden: { opacity: 0, y: 36, scale: 0.92 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.62, ease: habitsHeroEase },
    },
  },
  rule: {
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: { duration: 0.55, ease: habitsHeroEase },
    },
  },
  subtitle: {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.48, ease: habitsHeroEase },
    },
  },
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

const FREQ_LABELS: Record<string, { en: string; ar: string }> = {
  daily: { en: 'Daily', ar: 'يومي' },
  weekly: { en: 'Weekly', ar: 'أسبوعي' },
  monthly: { en: 'Monthly', ar: 'شهري' },
  custom: { en: 'Custom', ar: 'مخصص' },
};

const DAY_LABELS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};

const MONTH_LABELS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const CUSTOM_SCHEDULE_LABELS: Record<string, { en: string; ar: string }> = {
  weekdays: { en: 'Specific Weekdays', ar: 'أيام محددة من الأسبوع' },
  monthdays: { en: 'Specific Days of Month', ar: 'أيام محددة من الشهر' },
  yeardays: { en: 'Specific Days of Year', ar: 'أيام محددة من السنة' },
};

// Normalize duration: old logs stored minutes (small values like 30, 45),
// new logs store seconds (values like 1800, 2700). Threshold: 300 (5 min).
// If value <= 300 it's likely old minutes format, convert to seconds.
function normalizeDurationToSecs(dur: number | undefined): number {
  if (!dur) return 0;
  return dur <= 300 ? dur * 60 : dur;
}

function getHabitTimeStats(habitId: string, logs: HabitLog[], expectedDuration?: number) {
  const habitLogs = logs.filter(l => l.habitId === habitId);
  const completed = habitLogs.filter(l => l.completed);
  const now = new Date();
  const todayStr = todayString();

  // Week start (Monday)
  const ws = new Date(now); const day = ws.getDay(); ws.setDate(ws.getDate() - (day === 0 ? 6 : day - 1));
  const weekStart = `${ws.getFullYear()}-${String(ws.getMonth() + 1).padStart(2, '0')}-${String(ws.getDate()).padStart(2, '0')}`;
  // Month start
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  // Year start
  const yearStart = `${now.getFullYear()}-01-01`;

  // Count every completed session (not unique dates) — each timer session is a rep
  const thisWeekCompleted = completed.filter(l => l.date >= weekStart && l.date <= todayStr);
  const thisMonthCompleted = completed.filter(l => l.date >= monthStart && l.date <= todayStr);
  const thisYearCompleted = completed.filter(l => l.date >= yearStart && l.date <= todayStr);

  // Sum ALL logged time in SECONDS (completed or not) — every timer second counts
  const sumAllSecs = (arr: HabitLog[]) => {
    let total = 0;
    for (const l of arr) {
      const secs = normalizeDurationToSecs(l.duration);
      if (secs > 0) total += secs;
      else if (l.completed) total += (expectedDuration ?? 0) * 60; // expectedDuration is in minutes
    }
    return total;
  };

  const thisWeekAll = habitLogs.filter(l => l.date >= weekStart && l.date <= todayStr);
  const thisMonthAll = habitLogs.filter(l => l.date >= monthStart && l.date <= todayStr);
  const thisYearAll = habitLogs.filter(l => l.date >= yearStart && l.date <= todayStr);

  return {
    reps: { week: thisWeekCompleted.length, month: thisMonthCompleted.length, year: thisYearCompleted.length, total: completed.length },
    secs: { today: sumAllSecs(habitLogs.filter(l => l.date === todayStr)), week: sumAllSecs(thisWeekAll), month: sumAllSecs(thisMonthAll), year: sumAllSecs(thisYearAll), total: sumAllSecs(habitLogs) },
  };
}

// Format seconds into a human-readable string (e.g. "1h 23m 45s", "45m 30s", "30s")
function formatSecs(totalSecs: number): string {
  if (totalSecs <= 0) return '0s';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.floor(totalSecs % 60);
  if (h > 0) return s > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

// Convert 24h time "HH:mm" to 12h "h:mm AM/PM"
function to12h(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

/** Check if a boolean habit is outside its completion window. Returns false (not blocked) if no window is set. */
function isBooleanOutsideWindow(habit: Habit): boolean {
  const start = habit.completionWindowStart;
  const end = habit.completionWindowEnd;
  if (!start && !end) return false; // no window configured → always allowed
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (start && end) {
    if (start <= end) return currentTime < start || currentTime > end;
    // overnight window (e.g. 21:00 → 02:00): blocked only if between end and start
    return currentTime > end && currentTime < start;
  }
  if (start) return currentTime < start;
  if (end) return currentTime > end;
  return false;
}

/** Format a habit's completion window for display */
function formatCompletionWindow(habit: Habit, isAr: boolean): string {
  const start = habit.completionWindowStart;
  const end = habit.completionWindowEnd;
  if (start && end) return `${to12h(start)} – ${to12h(end)}`;
  if (start) return isAr ? `بعد ${to12h(start)}` : `After ${to12h(start)}`;
  if (end) return isAr ? `قبل ${to12h(end)}` : `Before ${to12h(end)}`;
  return '';
}

// Check if a habit is scheduled for a specific date
function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
  if (habit.frequency === 'daily') return true;
  const d = parseLocalDate(dateStr);
  if (habit.frequency === 'weekly') {
    const dayOfWeek = d.getDay() as WeekDay;
    if (habit.customDays?.length) return habit.customDays.includes(dayOfWeek);
    // Weekly with no specific days: default to Sunday
    return dayOfWeek === 0;
  }
  if (habit.frequency === 'monthly') {
    if (habit.customMonthDays?.length) return habit.customMonthDays.includes(d.getDate());
    // Monthly with no specific days: default to 1st of month
    return d.getDate() === 1;
  }
  if (habit.frequency === 'custom' && habit.customScheduleType) {
    if (habit.customScheduleType === 'weekdays' && habit.customDays?.length) {
      return habit.customDays.includes(d.getDay() as WeekDay);
    }
    if (habit.customScheduleType === 'monthdays' && habit.customMonthDays?.length) {
      return habit.customMonthDays.includes(d.getDate());
    }
    if (habit.customScheduleType === 'yeardays' && habit.customYearDays?.length) {
      return habit.customYearDays.some(yd => yd.month === d.getMonth() && yd.day === d.getDate());
    }
  }
  // scheduleType-based fallback
  const scheduleDays = habit.scheduleDays ?? habit.customDays ?? [];
  const scheduleType = habit.scheduleType ?? 'daily';
  if (scheduleType === 'daily') return true;
  if (scheduleType === 'custom' && scheduleDays.length > 0) {
    return scheduleDays.includes(d.getDay() as WeekDay);
  }
  if (scheduleType === 'weekly' && scheduleDays.length > 0) {
    return scheduleDays.includes(d.getDay() as WeekDay);
  }
  return true;
}

// Returns 'green' | 'orange' | 'red' | 'none' | 'not-scheduled' based on time window
// green = done in window, orange = done outside window, red = not done, none = no window set, not-scheduled = habit not active on this day
type CompletionColor = 'green' | 'orange' | 'red' | 'none' | 'not-scheduled';

function getCompletionColor(habit: Habit, log: HabitLog | undefined, dateStr?: string): CompletionColor {
  if (!log || !log.completed) {
    const today = todayString();
    const checkDate = dateStr || '';
    // Check if habit is scheduled for this day
    if (checkDate && !isHabitScheduledForDate(habit, checkDate)) return 'not-scheduled';
    // Future days = gray (upcoming)
    if (checkDate > today) return 'none';
    // Today: only red if strict window has passed, otherwise gray (pending)
    if (checkDate === today) {
      if (habit.strictWindow && habit.windowEnd) {
        const now = new Date();
        const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (ct > habit.windowEnd) return 'red'; // strict window passed → missed
      }
      return 'none'; // still pending today
    }
    // Past days without completion = missed
    return 'red';
  }
  // Timer habits (with expectedDuration) are always green — timer enforces the window
  if (habit.expectedDuration) return 'green';
  // Orange only if strict window AND manually done outside it
  if (habit.strictWindow && habit.windowStart && habit.windowEnd && log.time) {
    const logTime = log.time; // "HH:MM" format
    if (logTime < habit.windowStart || logTime > habit.windowEnd) {
      return 'orange'; // done outside strict time window
    }
  }
  return 'green'; // done on time
}

// Check if current time is within habit's time window
function isWithinWindow(habit: Habit): boolean {
  if (!habit.windowStart || !habit.windowEnd) return true;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= habit.windowStart && currentTime <= habit.windowEnd;
}

function isWindowPassed(habit: Habit): boolean {
  if (!habit.windowStart || !habit.windowEnd) return false;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime > habit.windowEnd;
}

// ── Helper: get category label with deleted marker for archived habits ──
function getCategoryLabel(category: string, isAr: boolean, deletedCategories?: string[], isArchived?: boolean): string {
  const label = isAr ? (CATEGORY_LABELS[category]?.ar ?? category) : (CATEGORY_LABELS[category]?.en ?? category);
  if (isArchived && deletedCategories?.includes(category)) {
    return `${label} (${isAr ? 'محذوفة' : 'deleted'})`;
  }
  return label;
}

// ── Sortable Category Item for filter dropdown ──
function SortableCategoryItem({ id, label, isSelected, isEditMode, canDelete, onSelect, onDelete, isAr }: {
  id: string; label: string; isSelected: boolean; isEditMode: boolean; canDelete: boolean | 'has_active';
  onSelect: () => void; onDelete: () => void; isAr: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditMode });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.7 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="relative group/item">
      <button onClick={isEditMode ? undefined : onSelect}
        className={cn('w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-150 text-center border',
          isSelected && !isEditMode
            ? 'text-white shadow-md border-transparent'
            : 'text-[var(--foreground)] border-transparent hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06] hover:border-[var(--color-primary)]/20 active:bg-[var(--color-primary)]/[0.12]')}
        style={isSelected && !isEditMode ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
        {isEditMode && (
          <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-[var(--foreground)] hover:text-[var(--foreground)]">
            <GripVertical className="h-3 w-3" />
          </span>
        )}
        <span className="truncate">{label}</span>
      </button>
      {isEditMode && (
        <button onClick={onDelete}
          className={cn('absolute -top-1.5 -end-1.5 h-5 w-5 rounded-full flex items-center justify-center transition-all shadow-sm',
            canDelete === true
              ? 'bg-red-500 text-white hover:bg-red-600 hover:scale-110'
              : 'bg-gray-400 text-white cursor-not-allowed opacity-60')}
          title={canDelete === 'has_active'
            ? (isAr ? 'لا يمكن الحذف — عادات نشطة تستخدم هذه الفئة' : 'Cannot delete — active habits use this category')
            : canDelete === true ? (isAr ? 'حذف الفئة' : 'Delete category') : ''}>
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function NewCategoryInput({ isAr, store, allCategories }: { isAr: boolean; store: ReturnType<typeof useAppStore>; allCategories: string[] }) {
  const [value, setValue] = useState('');
  const exists = allCategories.some(c => c.toLowerCase() === value.trim().toLowerCase() || (CATEGORY_LABELS[c]?.en ?? '').toLowerCase() === value.trim().toLowerCase() || (CATEGORY_LABELS[c]?.ar ?? '') === value.trim());
  const canCreate = value.trim().length > 0 && !exists;

  const handleCreate = () => {
    if (!canCreate) return;
    store.addCustomCategory(value.trim());
    setValue('');
  };

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
        placeholder={isAr ? 'فئة جديدة...' : 'New category...'}
        className="min-h-[34px] flex-1 rounded-lg border border-[var(--foreground)]/[0.12] bg-[var(--color-background)] px-2.5 py-1.5 text-[11px] font-semibold outline-none transition-all placeholder:text-[var(--foreground)]/40 focus:border-[var(--color-primary)]/45 focus:ring-2 focus:ring-[var(--color-primary)]/12"
      />
      <button
        type="button"
        onClick={handleCreate}
        disabled={!canCreate}
        className={cn(
          'flex min-h-[34px] shrink-0 items-center justify-center gap-1 rounded-lg border-2 px-3 text-[11px] font-black transition-all duration-200',
          canCreate
            ? 'border-transparent text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0'
            : 'cursor-default border-[var(--foreground)]/[0.08] bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/35',
        )}
        style={canCreate ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.82))' } : undefined}
      >
        <Plus className="h-3 w-3" />
        {isAr ? 'إضافة' : 'Add'}
      </button>
    </div>
  );
}

function useOrderedCategories(allCategories: string[], categoryOrder: string[] | undefined) {
  return useMemo(() => {
    const order = categoryOrder ?? [];
    if (order.length === 0) return allCategories;
    const ordered = order.filter(c => allCategories.includes(c));
    const remaining = allCategories.filter(c => !order.includes(c));
    return [...ordered, ...remaining];
  }, [allCategories, categoryOrder]);
}

const categoryTileBase =
  'group relative flex min-h-[2.35rem] flex-col justify-center gap-0.5 rounded-lg border-2 px-2 py-1.5 text-start transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]';

/** Multi-row category grid + add category — sits above habit cards */
function CategoryChipsRail({ isAr, allCategories, filterCategory, setFilterCategory, showArchived, store }: {
  isAr: boolean;
  allCategories: string[];
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  showArchived: boolean;
  store: ReturnType<typeof useAppStore>;
}) {
  const orderedCategories = useOrderedCategories(allCategories, store.categoryOrder);
  const habitPool = useMemo(
    () => (showArchived ? store.habits.filter(h => h.archived) : store.habits.filter(h => !h.archived)),
    [store.habits, showArchived],
  );
  const totalAll = habitPool.length;
  const countFor = useCallback((cat: string) => habitPool.filter(h => h.category === cat).length, [habitPool]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="min-w-0 flex-1"
    >
      <div
        className="overflow-hidden rounded-xl border-2 shadow-sm"
        style={{
          borderColor: 'rgba(var(--color-primary-rgb) / 0.14)',
          background: 'linear-gradient(180deg, rgba(var(--color-primary-rgb) / 0.04) 0%, var(--color-background) 40%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 4px 18px -6px rgba(0,0,0,0.07)',
        }}
      >
        <div
          className="flex items-center gap-2 border-b-2 px-2.5 py-2 sm:px-3 sm:py-2"
          style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.1)', background: 'rgba(var(--color-primary-rgb) / 0.04)' }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border sm:h-8 sm:w-8"
            style={{
              borderColor: 'rgba(var(--color-primary-rgb) / 0.2)',
              background: 'rgba(var(--color-primary-rgb) / 0.08)',
            }}
          >
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-primary)' }} strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black tracking-tight text-[var(--foreground)] sm:text-[13px]">
              {isAr ? 'تصفية حسب الفئة' : 'Filter by category'}
            </p>
            <p className="text-[9px] font-semibold leading-tight text-[var(--foreground)]/40 sm:text-[10px]">
              {isAr ? 'اختر فئة أو اعرض الكل' : 'Pick one category or show all'}
            </p>
          </div>
        </div>

        <div className="p-2 sm:p-2.5">
          <div
            className="grid gap-1.5 sm:gap-2"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))' }}
          >
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={cn(
                categoryTileBase,
                filterCategory === 'all'
                  ? 'border-[var(--color-primary)] text-white shadow-[0_10px_28px_-4px_rgba(var(--color-primary-rgb),0.35)] ring-2 ring-[var(--color-primary)]/25'
                  : 'border-[var(--foreground)]/[0.12] bg-[var(--foreground)]/[0.02] text-[var(--foreground)] hover:-translate-y-[1px] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/[0.07] hover:shadow-[0_8px_20px_-8px_rgba(var(--color-primary-rgb),0.16)] active:translate-y-0',
              )}
              style={
                filterCategory === 'all'
                  ? { background: 'linear-gradient(145deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.75))' }
                  : undefined
              }
            >
              <span className="text-[9px] font-black uppercase tracking-wide opacity-80 sm:text-[10px]">
                {isAr ? 'الكل' : 'All'}
              </span>
              <div className="flex items-baseline justify-between gap-1.5">
                <span className="text-xs font-black tabular-nums sm:text-sm">{totalAll}</span>
                <span className="text-[8px] font-bold opacity-70 sm:text-[9px]">{isAr ? 'إجمالي' : 'total'}</span>
              </div>
            </button>

            {orderedCategories.map(c => {
              const label = isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c);
              const n = countFor(c);
              const isSelected = filterCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterCategory(c)}
                  className={cn(
                    categoryTileBase,
                    isSelected
                      ? 'border-[var(--color-primary)] text-white shadow-[0_10px_28px_-4px_rgba(var(--color-primary-rgb),0.35)] ring-2 ring-[var(--color-primary)]/25'
                      : 'border-[var(--foreground)]/[0.12] bg-[var(--foreground)]/[0.02] text-[var(--foreground)] hover:-translate-y-[1px] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/[0.07] hover:shadow-[0_8px_20px_-8px_rgba(var(--color-primary-rgb),0.16)] active:translate-y-0',
                  )}
                  style={
                    isSelected
                      ? { background: 'linear-gradient(145deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.75))' }
                      : undefined
                  }
                >
                  <span className="line-clamp-2 text-[10px] font-bold leading-tight sm:text-[11px]">{label}</span>
                  <div
                    className={cn(
                      'mt-0 flex items-center justify-between gap-1 border-t pt-1',
                      isSelected ? 'border-white/20 opacity-95' : 'border-[var(--foreground)]/[0.1] opacity-90',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[8px] font-bold uppercase tracking-wider sm:text-[9px]',
                        isSelected ? 'opacity-80' : 'text-[var(--foreground)]/50',
                      )}
                    >
                      {isAr ? 'العدد' : 'Count'}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-px text-[10px] font-black tabular-nums sm:text-xs',
                        isSelected ? 'bg-white/20 text-white' : 'bg-[var(--foreground)]/[0.08] text-[var(--foreground)]',
                      )}
                    >
                      {n}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="border-t-2 px-2.5 py-2 sm:px-3 sm:py-2.5"
          style={{
            borderColor: 'rgba(var(--color-primary-rgb) / 0.1)',
            background: 'rgba(var(--color-primary-rgb) / 0.03)',
          }}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <Plus className="h-3 w-3 shrink-0" style={{ color: 'var(--color-primary)' }} />
            <span className="text-[9px] font-black uppercase tracking-[0.08em] text-[var(--foreground)]/50 sm:text-[10px]">
              {isAr ? 'إضافة فئة جديدة' : 'Add new category'}
            </span>
          </div>
          <NewCategoryInput isAr={isAr} store={store} allCategories={allCategories} />
        </div>
      </div>
    </motion.div>
  );
}

/** Reorder, delete, add categories — compact popover (opens on click) */
function CategoryManageMenu({ isAr, allCategories, filterCategory, setFilterCategory, store, toast }: {
  isAr: boolean; allCategories: string[]; filterCategory: string;
  setFilterCategory: (cat: string) => void; store: ReturnType<typeof useAppStore>;
  toast: ReturnType<typeof useToast>;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditMode(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const orderedCategories = useOrderedCategories(allCategories, store.categoryOrder);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedCategories.indexOf(active.id as string);
    const newIndex = orderedCategories.indexOf(over.id as string);
    const newOrder = arrayMove(orderedCategories, oldIndex, newIndex);
    store.reorderCategories(newOrder);
  }, [orderedCategories, store]);

  const handleDelete = useCallback((category: string) => {
    const activeHabits = store.habits.filter(h => h.category === category && !h.archived);
    if (activeHabits.length > 0) {
      toast.notifyWarning(
        isAr ? 'لا يمكن حذف الفئة' : 'Cannot delete category',
        isAr
          ? `${activeHabits.length} عادة نشطة تستخدم هذه الفئة. غيّر فئتها أولاً`
          : `${activeHabits.length} active habit${activeHabits.length > 1 ? 's' : ''} use this category. Change their category first`
      );
      return;
    }
    store.deleteCustomCategory(category);
    if (filterCategory === category) setFilterCategory('all');
    toast.notifySuccess(
      isAr ? 'تم حذف الفئة' : 'Category deleted',
      isAr ? (CATEGORY_LABELS[category]?.ar ?? category) : (CATEGORY_LABELS[category]?.en ?? category)
    );
  }, [store, isAr, filterCategory, setFilterCategory, toast]);

  const getDeleteStatus = useCallback((category: string): boolean | 'has_active' => {
    const activeHabits = store.habits.filter(h => h.category === category && !h.archived);
    if (activeHabits.length > 0) return 'has_active';
    return true;
  }, [store.habits]);

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        title={isAr ? 'إدارة الفئات — ترتيب وحذف' : 'Manage categories — reorder & delete'}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 sm:h-11 sm:w-11',
          isOpen
            ? 'border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.12)]'
            : 'border-[var(--foreground)]/[0.12] text-[var(--foreground)] hover:border-[var(--color-primary)]/25 hover:bg-[var(--color-primary)]/[0.05]',
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Settings2 className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={2.25} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              'absolute top-full z-[120] mt-2 w-[min(420px,calc(100vw-1.5rem))]',
              isAr ? 'end-0' : 'start-0',
            )}
          >
            <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-[var(--foreground)]/[0.18]" style={{ background: 'var(--color-background)' }}>
              <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />
              <div className="p-2">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setFilterCategory('all'); }}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] font-bold transition-all duration-150',
                      filterCategory === 'all'
                        ? 'border-transparent text-white shadow-md'
                        : 'border-transparent text-[var(--foreground)] hover:border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/[0.06] hover:text-[var(--color-primary)] active:bg-[var(--color-primary)]/[0.12]',
                    )}
                    style={filterCategory === 'all' ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}
                  >
                    {isAr ? 'كل الفئات' : 'All Categories'}
                    {filterCategory === 'all' && <CheckCircle2 className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition-all duration-150',
                      isEditMode
                        ? 'border-transparent text-white shadow-md'
                        : 'border-[var(--foreground)]/[0.18] text-[var(--foreground)] hover:border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/[0.04] hover:text-[var(--color-primary)]',
                    )}
                    style={isEditMode ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}
                  >
                    <Edit3 className="h-3 w-3" />
                    {isAr ? 'تعديل' : 'Edit'}
                  </button>
                </div>
                <div className="mx-2 mb-2 h-px bg-[var(--foreground)]/[0.05]" />
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={orderedCategories} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-3 gap-1">
                      {orderedCategories.map(c => {
                        const label = isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c);
                        const isSelected = filterCategory === c;
                        return (
                          <SortableCategoryItem
                            key={c}
                            id={c}
                            label={label}
                            isSelected={isSelected}
                            isEditMode={isEditMode}
                            canDelete={getDeleteStatus(c)}
                            onSelect={() => { setFilterCategory(c); }}
                            onDelete={() => handleDelete(c)}
                            isAr={isAr}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
                {isEditMode && (
                  <p className="mt-2 text-center text-[9px] font-medium text-[var(--foreground)]">
                    {isAr ? 'اسحب لإعادة الترتيب • اضغط ✕ للحذف' : 'Drag to reorder • Press ✕ to delete'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// useHabitTimer, useStoreHabitTimer, HabitTimerControls imported from @/components/app/habit-timer-controls

function CategoryPicker({ isAr, allCategories, value, onChange, store }: { isAr: boolean; allCategories: string[]; value: string; onChange: (cat: string) => void; store: ReturnType<typeof useAppStore> }) {
  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const catRef = useRef<HTMLDivElement>(null);
  const catInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLabel = CATEGORY_LABELS[value]
    ? (isAr ? CATEGORY_LABELS[value].ar : CATEGORY_LABELS[value].en)
    : value;

  const filtered = allCategories.filter(c => {
    if (!catSearch) return true;
    const label = isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c);
    return label.toLowerCase().includes(catSearch.toLowerCase()) || c.toLowerCase().includes(catSearch.toLowerCase());
  });

  const isNewCategory = catSearch.trim() && !allCategories.includes(catSearch.trim().toLowerCase()) && !allCategories.some(c => {
    const label = isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c);
    return label.toLowerCase() === catSearch.trim().toLowerCase() || c === catSearch.trim();
  });

  return (
    <div ref={catRef} className="relative">
      <button type="button" onClick={() => { setCatOpen(!catOpen); setCatSearch(''); setTimeout(() => catInputRef.current?.focus(), 50); }}
        className={cn('app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm flex items-center justify-between gap-2 transition-all',
          catOpen && 'ring-2 ring-[var(--color-primary)]/30')}>
        <span className="truncate">{currentLabel}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-[var(--foreground)] transition-transform duration-200', catOpen && 'rotate-180')} />
      </button>
      {catOpen && (
        <div className="absolute top-full mt-1.5 z-50 w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[var(--foreground)]/[0.18]" style={{ background: 'var(--color-background)' }}>
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />
          <div className="p-2 border-b border-[var(--foreground)]/[0.15]">
            <input ref={catInputRef} type="text" value={catSearch} onChange={e => setCatSearch(e.target.value)}
              placeholder={isAr ? 'ابحث أو اكتب فئة جديدة...' : 'Search or type new...'}
              className="w-full bg-[var(--foreground)]/[0.05] rounded-lg px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30 placeholder:text-[var(--foreground)]"
              onKeyDown={e => {
                if (e.key === 'Enter' && catSearch.trim()) {
                  const match = allCategories.find(c => c === catSearch.trim() || (CATEGORY_LABELS[c]?.en ?? c).toLowerCase() === catSearch.trim().toLowerCase());
                  onChange(match || catSearch.trim());
                  if (!match && isNewCategory) {
                    store.addCustomCategory(catSearch.trim());
                  }
                  setCatOpen(false);
                  setCatSearch('');
                }
              }}
            />
          </div>
          <div className="p-2 grid grid-cols-2 gap-1 max-h-[240px] overflow-y-auto">
            {filtered.map(c => {
              const label = isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c);
              const isActive = value === c;
              return (
                <button key={c} type="button"
                  onClick={() => { onChange(c); setCatOpen(false); setCatSearch(''); }}
                  className={cn('flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[12px] font-bold transition-all duration-150 border',
                    isActive
                      ? 'text-white shadow-md border-transparent'
                      : 'text-[var(--foreground)] border-transparent hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06] hover:border-[var(--color-primary)]/20')}
                  style={isActive ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                  {label}
                  {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
          {isNewCategory && (
            <div className="p-2 border-t border-[var(--foreground)]/[0.15]">
              <button type="button"
                onClick={() => {
                  store.addCustomCategory(catSearch.trim());
                  onChange(catSearch.trim());
                  setCatOpen(false);
                  setCatSearch('');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all duration-150"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' }}>
                <Plus className="h-3.5 w-3.5" />
                {isAr ? `إنشاء "${catSearch.trim()}"` : `Create "${catSearch.trim()}"`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sticky Active Timer Banner ──
function ActiveTimerBanner({ store, isAr, today, onDetail }: {
  store: ReturnType<typeof useAppStore>; isAr: boolean; today: string; onDetail: (h: Habit) => void;
}) {
  const active = store.activeTimer;
  const { elapsed } = useTimerDisplay(active && active.state !== 'completed' ? active : null);
  if (!active || active.state === 'completed') return null;

  const habitId = active.habitId;
  const habit = habitId ? store.habits.find(h => h.id === habitId) : null;
  const habitName = habit ? (isAr ? habit.nameAr : habit.nameEn) : (isAr ? active.labelAr : active.labelEn) || '';
  const hc = habit ? resolveHabitColor(habit.color) : 'var(--color-primary)';
  const isPaused = active.state === 'paused';
  const isRunning = active.state === 'running';
  const hasDuration = !!active.targetDuration;
  const targetSecs = active.targetDuration ?? 0;
  const remaining = hasDuration ? Math.max(0, targetSecs - elapsed) : 0;
  const progress = hasDuration && targetSecs > 0 ? Math.min(1, elapsed / targetSecs) : 0;
  const displayTime = hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(elapsed);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      className="sticky top-[85px] z-[190] mb-4 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl"
      style={{ background: `linear-gradient(135deg, ${hc}15, rgba(var(--color-background-rgb, 255 255 255) / 0.85))`, border: `1.5px solid ${hc}30` }}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Pulsing indicator */}
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${hc}20` }}>
            <Timer className={cn('h-5 w-5', isRunning && 'animate-pulse')} style={{ color: hc }} />
          </div>
          <div className="absolute -top-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900"
            style={{ background: isRunning ? '#22c55e' : '#f59e0b' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => habit && onDetail(habit)}>
          <p className="text-sm font-bold truncate">{habitName}</p>
          <p className="text-[10px] font-semibold" style={{ color: hc }}>
            {isPaused ? (isAr ? 'متوقف مؤقتًا' : 'Paused') : (isAr ? 'قيد التشغيل' : 'Running')}
            {hasDuration && ` · ${Math.round(progress * 100)}%`}
          </p>
        </div>

        {/* Live time */}
        <div className={cn('text-xl font-mono font-black tracking-tight', isRunning && 'animate-pulse')} style={{ color: hc }}>
          {displayTime}
        </div>

        {/* Controls */}
        {habit && (
          <div className="shrink-0" onClick={e => e.stopPropagation()}>
            <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={false} size="xs" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {hasDuration && (
        <div className="h-1 w-full" style={{ background: `${hc}10` }}>
          <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${progress * 100}%`, background: hc }} />
        </div>
      )}
    </motion.div>
  );
}

export default function HabitsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();
  const toast = useToast();

  const ht = useStoreHabitTimer(store);

  // Theme change detector — forces re-render when theme color or dark/light changes
  const [, setThemeTick] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick(t => t + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);

  // Normalize order numbers: ensure all active habits have sequential 1-based order
  useEffect(() => {
    const active = store.habits.filter(h => !h.archived);
    const hasZero = active.some(h => h.order === 0 || h.order === undefined);
    const hasDupes = new Set(active.map(h => h.order)).size !== active.length;
    const maxOrder = Math.max(0, ...active.map(h => h.order ?? 0));
    const hasGaps = maxOrder > active.length;
    if (hasZero || hasDupes || hasGaps) {
      const sorted = [...active].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      store.reorderHabits(sorted.map(h => h.id));
    }
  }, [store.habits.length]);

  // Merge default categories + store custom categories + categories from existing habits
  const allCategories = useMemo(() => {
    const defaults = [...DEFAULT_HABIT_CATEGORIES];
    const fromHabits = store.habits.map(h => h.category).filter(c => c);
    const fromStore = store.customCategories ?? [];
    const all = new Set([...defaults, ...fromStore, ...fromHabits]);
    return Array.from(all);
  }, [store.habits, store.customCategories]);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [conflictNewOrder, setConflictNewOrder] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const searchParams = useSearchParams();
  // Auto-open habit detail modal from query param (e.g. ?openHabit=abc123)
  const openHabitHandled = useRef(false);
  useEffect(() => {
    if (openHabitHandled.current) return;
    const openId = searchParams.get('openHabit');
    if (openId) {
      const habit = store.habits.find(h => h.id === openId);
      if (habit) {
        setDetailHabit(habit);
        openHabitHandled.current = true;
      }
    }
  }, [searchParams, store.habits]);
  const [showFullTable, setShowFullTable] = useState(false);
  const [fullCalendarHabit, setFullCalendarHabit] = useState<Habit | null>(null);

  const [viewMode, setViewMode] = useState<'cards' | 'grid' | 'list' | 'board' | 'minimal'>('cards');
  const [gridCols, setGridCols] = useState<2 | 3>(3);
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [expandMode, setExpandMode] = useState<'auto' | 'expandAll' | 'foldAll'>('auto');
  const [showExpandMenu, setShowExpandMenu] = useState(false);
  const expandMenuRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'priority' | 'newest' | 'streak' | 'completion' | 'order' | 'custom'>('order');
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'avoidance'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterTracking, setFilterTracking] = useState<'all' | 'boolean' | 'count' | 'timer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'done' | 'pending' | 'missed'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Live clock state
  const [clockNow, setClockNow] = useState<Date | null>(null);
  useEffect(() => {
    setClockNow(new Date());
    const id = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-complete: when timed habit timer reaches expectedDuration, auto-log
  // Auto-complete habit when timer-linked countdown reaches target.
  // Uses an interval to check endsAt since elapsed is no longer in store state.
  const autoCompleteRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ht.activeHabitId || !ht.running) return;
    const check = () => {
      const active = store.activeTimer;
      if (!active || active.state !== 'running' || !active.endsAt) return;
      if (new Date(active.endsAt).getTime() > Date.now()) return;
      const habit = store.habits.find(h => h.id === ht.activeHabitId);
      if (!habit?.expectedDuration) return;
      if (autoCompleteRef.current === active.sessionId) return;
      // Check maxDailyReps before auto-completing
      const maxReps = habit.maxDailyReps || Infinity;
      const todayCompletedCount = store.habitLogs.filter(l => l.habitId === habit.id && l.date === today && l.completed).length;
      if (maxReps !== Infinity && todayCompletedCount >= maxReps) {
        autoCompleteRef.current = active.sessionId;
        if (ht.currentSession) store.completeTimer(ht.currentSession.id);
        return;
      }
      autoCompleteRef.current = active.sessionId;
      const durationSecs = habit.expectedDuration * 60; // convert minutes target to seconds
      store.logHabit({
        habitId: habit.id, date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: durationSecs,
        note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true,
        source: 'timer',
      });
      if (ht.currentSession) {
        store.completeTimer(ht.currentSession.id);
      }
    };
    check(); // check immediately
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [ht.activeHabitId, ht.running, store, today]);

  // Form state
  const [formData, setFormData] = useState({
    nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
    category: 'health' as HabitCategory,
    frequency: 'daily' as HabitFrequency,
    customDays: [] as WeekDay[],
    customScheduleType: 'weekdays' as CustomScheduleType,
    customMonthDays: [] as number[],
    customYearDays: [] as { month: number; day: number }[],
    priority: 'medium' as Priority,
    difficulty: 'medium' as Difficulty,
    color: ITEM_COLORS[0],
    icon: 'Activity',
    type: 'positive' as HabitType,
    trackingType: 'boolean' as HabitTrackingType,
    targetValue: 1,
    targetUnit: 'times',
    checklistItems: [] as { id: string; titleEn: string; titleAr: string }[],
    newChecklistItem: '',
    scheduleType: 'daily' as 'daily' | 'weekly' | 'custom',
    weeklyTarget: 3,
    allowPartial: false,
    allowSkip: false,
    reminderEnabled: false,
    reminderTime: '08:00',
    image: '' as string,
    cueEn: '', cueAr: '', routineEn: '', routineAr: '', rewardEn: '', rewardAr: '',
    placeEn: '', placeAr: '', preferredTime: '', expectedDuration: '' as string | number,
    windowStart: '', windowEnd: '', strictWindow: false, maxDailyReps: '' as string | number,
    completionWindowStart: '', completionWindowEnd: '',
    orderNumber: '' as string | number, colSpan: 1, rowSpan: 1,
    streakGoal: '' as string | number, streakRewardEn: '', streakRewardAr: '',
    streakGoal2: '' as string | number, streakRewardEn2: '', streakRewardAr2: '',
    streakGoal3: '' as string | number, streakRewardEn3: '', streakRewardAr3: '',
    notes: '',
    goalReps: '' as string | number,
    goalHours: '' as string | number,
  });

  const resetForm = () => {
    setFormData({
      nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
      category: 'health', frequency: 'daily', customDays: [],
      customScheduleType: 'weekdays' as CustomScheduleType, customMonthDays: [], customYearDays: [],
      priority: 'medium', difficulty: 'medium', color: ITEM_COLORS[0],
      icon: 'Activity', type: 'positive',
      trackingType: 'boolean', targetValue: 1, targetUnit: 'times',
      checklistItems: [] as { id: string; titleEn: string; titleAr: string }[], newChecklistItem: '',
      scheduleType: 'daily', weeklyTarget: 3, allowPartial: false, allowSkip: false,
      reminderEnabled: false, reminderTime: '08:00',
      image: '',
      cueEn: '', cueAr: '', routineEn: '', routineAr: '', rewardEn: '', rewardAr: '',
      placeEn: '', placeAr: '', preferredTime: '', expectedDuration: '',
      windowStart: '', windowEnd: '', strictWindow: false, maxDailyReps: '',
      completionWindowStart: '', completionWindowEnd: '',
      orderNumber: '', colSpan: 1, rowSpan: 1,
      streakGoal: '', streakRewardEn: '', streakRewardAr: '',
      streakGoal2: '', streakRewardEn2: '', streakRewardAr2: '',
      streakGoal3: '', streakRewardEn3: '', streakRewardAr3: '',
      notes: '',
      goalReps: '',
      goalHours: '',
    });
    setEditingHabit(null);
  };

  const handleArchiveToggle = useCallback((habit: Habit) => {
    store.toggleHabitArchive(habit.id);
    const name = isAr ? habit.nameAr : habit.nameEn;
    if (habit.archived) {
      toast.notifySuccess(isAr ? 'تمت الاستعادة' : 'Restored', name);
    } else {
      toast.notifyHabitArchived(isAr ? `تم أرشفة: ${name}` : `Archived: ${name}`);
    }
  }, [store, isAr, toast]);

  const handleLogHabit = useCallback((habit: Habit) => {
    // Timer habits can only be completed by the timer, not manually
    if (habit.expectedDuration) {
      toast.notifyInfo(isAr ? 'يتطلب مؤقت' : 'Timer required', isAr ? 'هذه العادة تحتاج تشغيل المؤقت أولاً لإكمالها' : 'Start the timer first to complete this habit');
      return;
    }
    store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true });
    toast.notifyHabitComplete(isAr ? habit.nameAr : habit.nameEn);
  }, [store, today, isAr, toast]);

  const openEdit = (habit: Habit) => {
    setFormData({
      nameEn: habit.nameEn, nameAr: habit.nameAr,
      descriptionEn: habit.descriptionEn, descriptionAr: habit.descriptionAr,
      category: habit.category, frequency: habit.frequency,
      customDays: habit.customDays ?? [],
      customScheduleType: habit.customScheduleType ?? 'weekdays',
      customMonthDays: habit.customMonthDays ?? [],
      customYearDays: habit.customYearDays ?? [],
      priority: habit.priority, difficulty: habit.difficulty,
      color: habit.color, icon: habit.icon, type: habit.type,
      trackingType: habit.trackingType ?? 'boolean',
      targetValue: habit.targetValue ?? 1,
      targetUnit: habit.targetUnit ?? 'times',
      checklistItems: habit.checklistItems ?? [],
      newChecklistItem: '',
      scheduleType: habit.scheduleType ?? 'daily',
      weeklyTarget: habit.weeklyTarget ?? 3,
      allowPartial: habit.allowPartial ?? false,
      allowSkip: habit.allowSkip ?? false,
      reminderEnabled: habit.reminderEnabled,
      reminderTime: habit.reminderTime ?? '08:00',
      image: habit.image ?? '',
      cueEn: habit.cueEn ?? '', cueAr: habit.cueAr ?? '',
      routineEn: habit.routineEn ?? '', routineAr: habit.routineAr ?? '',
      rewardEn: habit.rewardEn ?? '', rewardAr: habit.rewardAr ?? '',
      placeEn: habit.placeEn ?? '', placeAr: habit.placeAr ?? '',
      preferredTime: habit.preferredTime ?? '',
      expectedDuration: habit.expectedDuration ?? '',
      windowStart: habit.windowStart ?? '',
      windowEnd: habit.windowEnd ?? '',
      strictWindow: habit.strictWindow ?? false, maxDailyReps: habit.maxDailyReps ?? '',
      completionWindowStart: habit.completionWindowStart ?? '', completionWindowEnd: habit.completionWindowEnd ?? '',
      orderNumber: habit.order ?? '', colSpan: habit.colSpan ?? 1, rowSpan: habit.rowSpan ?? 1,
      streakGoal: habit.streakGoal ?? '', streakRewardEn: habit.streakRewardEn ?? '', streakRewardAr: habit.streakRewardAr ?? '',
      streakGoal2: habit.streakGoal2 ?? '', streakRewardEn2: habit.streakRewardEn2 ?? '', streakRewardAr2: habit.streakRewardAr2 ?? '',
      streakGoal3: habit.streakGoal3 ?? '', streakRewardEn3: habit.streakRewardEn3 ?? '', streakRewardAr3: habit.streakRewardAr3 ?? '',
      notes: habit.notes ?? '',
      goalReps: habit.goalReps ?? '',
      goalHours: habit.goalHours ?? '',
    });
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleSave = () => {
    try {
    if (!formData.nameEn && !formData.nameAr) {
      toast.notifyError(isAr ? 'الاسم مطلوب' : 'Name required', isAr ? 'أدخل اسم العادة بالعربية أو الإنجليزية' : 'Enter a habit name in English or Arabic');
      return;
    }
    // Auto-resolve order number: assign next available if empty, bump conflicts if taken
    if (formData.orderNumber === '' || formData.orderNumber === undefined) {
      const usedOrders = store.habits.filter(h => !editingHabit || h.id !== editingHabit.id).map(h => h.order).filter(Boolean);
      formData.orderNumber = usedOrders.length > 0 ? Math.max(...usedOrders) + 1 : 1;
    } else {
      const num = Number(formData.orderNumber);
      if (isNaN(num) || num < 1) {
        toast.notifyError(isAr ? 'رقم الترتيب غير صالح' : 'Invalid order number', isAr ? 'يجب أن يكون رقم الترتيب 1 أو أكثر' : 'Order number must be 1 or greater');
        return;
      }
      // Auto-bump conflicting habits
      const conflict = store.habits.find(h => h.order === num && (!editingHabit || h.id !== editingHabit.id));
      if (conflict) {
        const usedOrders = store.habits.map(h => h.order).filter(Boolean);
        const nextFree = Math.max(...usedOrders) + 1;
        store.updateHabit(conflict.id, { order: nextFree });
      }
    }
    const { orderNumber, streakGoal, streakGoal2, streakGoal3, maxDailyReps, newChecklistItem, goalReps, goalHours, ...rest } = formData;
    const isCustom = formData.frequency === 'custom';
    const data = {
      ...rest,
      customScheduleType: isCustom ? formData.customScheduleType : undefined,
      customDays: isCustom && formData.customScheduleType === 'weekdays' ? formData.customDays : (formData.frequency === 'weekly' ? formData.customDays : undefined),
      customMonthDays: isCustom && formData.customScheduleType === 'monthdays' ? formData.customMonthDays : undefined,
      customYearDays: isCustom && formData.customScheduleType === 'yeardays' ? formData.customYearDays : undefined,
      checklistItems: formData.checklistItems.length > 0 ? formData.checklistItems : undefined,
      targetValue: formData.trackingType === 'count' ? formData.targetValue : formData.trackingType === 'duration' ? formData.targetValue : undefined,
      targetUnit: formData.trackingType === 'count' ? formData.targetUnit : formData.trackingType === 'duration' ? 'minutes' : undefined,
      expectedDuration: formData.trackingType === 'timer' && formData.expectedDuration ? Number(formData.expectedDuration) : (formData.expectedDuration ? Number(formData.expectedDuration) : undefined),
      windowStart: formData.windowStart || undefined,
      windowEnd: formData.windowEnd || undefined,
      strictWindow: formData.strictWindow || undefined,
      completionWindowStart: formData.trackingType === 'boolean' && formData.completionWindowStart ? formData.completionWindowStart : undefined,
      completionWindowEnd: formData.trackingType === 'boolean' && formData.completionWindowEnd ? formData.completionWindowEnd : undefined,
      maxDailyReps: maxDailyReps !== '' ? Number(maxDailyReps) : undefined,
      order: orderNumber !== '' ? Number(orderNumber) : undefined,
      colSpan: formData.colSpan && formData.colSpan > 1 ? formData.colSpan : undefined,
      rowSpan: formData.rowSpan && formData.rowSpan > 1 ? formData.rowSpan : undefined,
      streakGoal: streakGoal !== '' ? Number(streakGoal) : undefined,
      streakRewardEn: formData.streakRewardEn || undefined,
      streakRewardAr: formData.streakRewardAr || undefined,
      streakGoal2: streakGoal2 !== '' ? Number(streakGoal2) : undefined,
      streakRewardEn2: formData.streakRewardEn2 || undefined,
      streakRewardAr2: formData.streakRewardAr2 || undefined,
      streakGoal3: streakGoal3 !== '' ? Number(streakGoal3) : undefined,
      streakRewardEn3: formData.streakRewardEn3 || undefined,
      streakRewardAr3: formData.streakRewardAr3 || undefined,
      notes: formData.notes || undefined,
      goalReps: goalReps !== '' ? Number(goalReps) : undefined,
      goalHours: goalHours !== '' ? Number(goalHours) : undefined,
    };
    if (editingHabit) {
      store.updateHabit(editingHabit.id, data);
      toast.notifySuccess(isAr ? 'تم تحديث العادة' : 'Habit Updated', isAr ? editingHabit.nameAr : editingHabit.nameEn);
    } else {
      store.addHabit(data);
      toast.notifySuccess(isAr ? 'تم إنشاء عادة جديدة' : 'New Habit Created', data.nameEn || data.nameAr);
    }
    setShowForm(false);
    resetForm();
    } catch (err) {
      console.error('handleSave error:', err);
      toast.notifyError(isAr ? 'خطأ في الحفظ' : 'Save error', String(err));
    }
  };

  const filteredHabits = useMemo(() => {
    let result = store.habits.filter(h => {
      if (h.archived !== showArchived) return false;
      // Only show habits scheduled for today on the "Today's Habits" page
      if (!showArchived && !isHabitScheduledForDate(h, today)) return false;
      if (filterCategory !== 'all' && h.category !== filterCategory) return false;
      if (filterType !== 'all' && h.type !== filterType) return false;
      if (filterPriority !== 'all' && h.priority !== filterPriority) return false;
      if (filterTracking !== 'all') {
        const ht = h.trackingType ?? (h.expectedDuration ? 'timer' : 'boolean');
        if (ht !== filterTracking) return false;
      }
      if (filterStatus !== 'all') {
        const isDone = store.habitLogs.some(l => l.habitId === h.id && l.date === today && l.completed);
        if (filterStatus === 'done' && !isDone) return false;
        if (filterStatus === 'pending' && isDone) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return h.nameEn.toLowerCase().includes(q) || h.nameAr.includes(q);
      }
      return true;
    });
    // Sorting
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => (isAr ? a.nameAr : a.nameEn).localeCompare(isAr ? b.nameAr : b.nameEn));
    } else if (sortBy === 'priority') {
      const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      result = [...result].sort((a, b) => (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1));
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    } else if (sortBy === 'streak') {
      result = [...result].sort((a, b) => store.getHabitStreak(b.id).current - store.getHabitStreak(a.id).current);
    } else if (sortBy === 'completion') {
      result = [...result].sort((a, b) => store.getHabitStats(b.id).completionRate - store.getHabitStats(a.id).completionRate);
    } else if (sortBy === 'order' || sortBy === 'custom') {
      result = [...result].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }
    return result;
  }, [store.habits, store.habitLogs, showArchived, filterCategory, filterType, filterPriority, filterTracking, filterStatus, searchQuery, sortBy, today, isAr, store]);

  const activeHabitsCount = store.habits.filter(h => !h.archived).length;
  const completedTodayCount = store.habits.filter(h =>
    !h.archived && store.habitLogs.some(l => l.habitId === h.id && l.date === today && l.completed)
  ).length;

  // DnD sensors for drag-and-drop sorting
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredHabits.findIndex(h => h.id === active.id);
    const newIndex = filteredHabits.findIndex(h => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(filteredHabits, oldIndex, newIndex);
    store.reorderHabits(reordered.map(h => h.id));
  }, [filteredHabits, store]);
  const isDragMode = sortBy === 'custom';

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 max-w-[1400px] mx-auto">
      {/* ═══ Sticky Active Timer Banner ═══ */}
      <ActiveTimerBanner store={store} isAr={isAr} today={today} onDetail={(h) => setDetailHabit(h)} />

      {/* ═══ Hero + Quote — compact combined banner ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl mb-5 group/hero cursor-default"
        style={{
          background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.65))`,
          boxShadow: '0 8px 32px rgba(var(--color-primary-rgb) / 0.2), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        {/* Shimmer on hover */}
        <div className="absolute inset-0 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-700"
          style={{ background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'shimmer 2s ease infinite' }} />
        {/* Glow blob */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute start-0 top-0 h-full w-1/2 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.25), transparent 70%)' }}
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 px-5 py-5 sm:px-7 sm:py-6">
          {/* Left: Title block */}
          <div className="flex items-center gap-4 md:shrink-0">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center rounded-2xl shrink-0"
              style={{
                background: 'rgba(255,255,255,0.18)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -6, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-white" strokeWidth={2.25} />
              </motion.div>
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white"
                style={{ textShadow: '0 2px 16px rgba(0,0,0,0.15)' }}
              >
                {isAr ? 'العادات' : 'Habits'}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="text-sm sm:text-base font-semibold text-white/75 mt-0.5"
              >
                {isAr ? 'ابنِ عاداتك، اصنع حياتك' : 'Build your habits, shape your life'}
              </motion.p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px self-stretch bg-white/20 mx-2" />
          <div className="md:hidden h-px w-full bg-white/20" />

          {/* Right: Quote */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="flex-1 min-w-0"
          >
            <p className="text-[13px] sm:text-sm font-bold leading-relaxed text-white/90 mb-2" dir="rtl"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.1)' }}>
              أغمض عينيك، وسافر بخيالك إلى مستقبلٍ بعيد، حيث تقف أمام عمرٍ أثقلته الحسرة وأحلامٍ أرهقها التأجيل. هناك تمنّيت فرصة واحدة فقط: أن تعود إلى هذه اللحظة لتبدأ كما ينبغي.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/12 backdrop-blur-sm border border-white/15">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-sm"
              >✨</motion.span>
              <span className="text-xs sm:text-sm font-black text-white" dir="rtl"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.15)' }}>
                افتح عينيك... أنت هنا فعلًا. انهض وابدأ!
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

          {/* Stats — compact row (icon + value + label) */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mb-3 grid grid-cols-3 gap-1.5 sm:mb-4 sm:gap-2">
            <motion.div
              whileHover={{ y: -1 }}
              className="relative flex min-h-0 items-center gap-2 overflow-hidden rounded-xl border border-[var(--color-primary)]/12 px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-2.5"
              style={{ background: 'linear-gradient(160deg, rgba(var(--color-primary-rgb) / 0.05), rgba(var(--color-primary-rgb) / 0.02))', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'var(--color-primary)' }} />
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9" style={{ background: 'rgba(var(--color-primary-rgb) / 0.12)' }}>
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <p className="text-base font-black tabular-nums leading-none tracking-tight sm:text-lg">{activeHabitsCount}</p>
                <p className="mt-0.5 line-clamp-2 text-[8px] font-semibold leading-tight text-[var(--foreground)]/45 sm:text-[9px]">{isAr ? 'عادات نشطة' : 'Active habits'}</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ y: -1 }}
              className="relative flex min-h-0 items-center gap-2 overflow-hidden rounded-xl border border-emerald-500/12 px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-2.5"
              style={{ background: 'linear-gradient(160deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-emerald-500" />
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 sm:h-9 sm:w-9">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <p className="text-base font-black tabular-nums leading-none tracking-tight sm:text-lg">
                  {completedTodayCount}
                  <span className="text-[10px] font-bold text-[var(--foreground)]/35 sm:text-xs">/{activeHabitsCount}</span>
                </p>
                <p className="mt-0.5 line-clamp-2 text-[8px] font-semibold leading-tight text-[var(--foreground)]/45 sm:text-[9px]">{isAr ? 'مكتملة اليوم' : 'Done today'}</p>
                {activeHabitsCount > 0 && (
                  <div className="mt-1 h-1 max-w-full overflow-hidden rounded-full bg-[var(--foreground)]/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((completedTodayCount / activeHabitsCount) * 100)}%` }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                )}
              </div>
            </motion.div>
            <motion.div
              whileHover={{ y: -1 }}
              className="relative flex min-h-0 items-center gap-2 overflow-hidden rounded-xl border border-amber-500/12 px-2 py-2 sm:gap-2.5 sm:px-3 sm:py-2.5"
              style={{ background: 'linear-gradient(160deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-amber-500" />
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 sm:h-9 sm:w-9">
                <Archive className="h-3.5 w-3.5 text-amber-500 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <p className="text-base font-black tabular-nums leading-none tracking-tight sm:text-lg">{store.habits.filter(h => h.archived).length}</p>
                <p className="mt-0.5 line-clamp-2 text-[8px] font-semibold leading-tight text-[var(--foreground)]/45 sm:text-[9px]">{isAr ? 'مؤرشفة' : 'Archived'}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Toolbar */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 mb-4 sm:mb-6 relative z-[100]">
            {/* View Mode Dropdown */}
            {(() => {
              const views = [
                { key: 'cards' as const, icon: CreditCard, en: 'Cards', ar: 'بطاقات' },
                { key: 'grid' as const, icon: LayoutGrid, en: 'Grid', ar: 'شبكة' },
                { key: 'list' as const, icon: List, en: 'List', ar: 'قائمة' },
                { key: 'board' as const, icon: Columns3, en: 'Board', ar: 'لوحة' },
                { key: 'minimal' as const, icon: Grid3x3, en: 'Minimal', ar: 'مختصر' },
              ] as const;
              const current = views.find(v => v.key === viewMode) || views[0];
              return (
                <div className="relative group/view">
                  <button className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold text-[var(--foreground)] transition-all duration-300 group-hover/view:shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.1)]" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.15)', background: 'rgba(var(--color-primary-rgb) / 0.04)' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.35)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.15)'; }}>
                    <current.icon className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                    {isAr ? current.ar : current.en}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover/view:rotate-180" style={{ color: 'rgba(var(--color-primary-rgb) / 0.5)' }} />
                  </button>
                  <div className="absolute top-full pt-1.5 start-0 z-50 w-52 opacity-0 invisible group-hover/view:opacity-100 group-hover/view:visible transition-all duration-200 translate-y-1 group-hover/view:translate-y-0">
                    <div className="rounded-xl overflow-hidden shadow-xl" style={{ background: 'var(--color-background)', border: '1px solid rgba(var(--color-primary-rgb) / 0.12)' }}>
                      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />
                      <div className="py-1.5">
                        {views.map(v => (
                          <button key={v.key} onClick={() => setViewMode(v.key)}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition-all duration-200',
                              viewMode === v.key
                                ? 'text-white'
                                : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]'
                            )}
                            style={viewMode === v.key ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                            <v.icon className="h-4 w-4" />
                            {isAr ? v.ar : v.en}
                            {viewMode === v.key && <CheckCircle2 className="h-3.5 w-3.5 ms-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Archive */}
            <button onClick={() => setShowArchived(!showArchived)}
              className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-300 cursor-pointer',
                showArchived
                  ? 'text-white shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.2)]'
                  : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.08)]')}
              style={showArchived ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))', borderColor: 'var(--color-primary)' } : { borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}
              onMouseEnter={(e) => { if (!showArchived) e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.3)'; }}
              onMouseLeave={(e) => { if (!showArchived) e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.12)'; }}>
              <Archive className="h-4 w-4" />
              {showArchived ? (isAr ? 'المؤرشفة' : 'Archived') : (isAr ? 'الأرشيف' : 'Archive')}
            </button>

            {/* Compliance */}
            <button onClick={() => setShowFullTable(true)}
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold text-[var(--foreground)] transition-all duration-300 cursor-pointer hover:text-[var(--color-primary)] hover:shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.08)]"
              style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.3)'; e.currentTarget.style.background = 'rgba(var(--color-primary-rgb) / 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.12)'; e.currentTarget.style.background = 'transparent'; }}>
              <Table2 className="h-4 w-4" />
              {isAr ? 'جدول الالتزام' : 'Compliance Table'}
            </button>
            <Link href="/app/habits/log"
              className="habits-toolbar-btn flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold text-[var(--foreground)] transition-all duration-300 hover:text-[var(--color-primary)] hover:shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.08)]"
              style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.3)'; e.currentTarget.style.background = 'rgba(var(--color-primary-rgb) / 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.12)'; e.currentTarget.style.background = 'transparent'; }}>
              <CalendarIcon className="h-4 w-4" />
              {isAr ? 'السجل' : 'History'}
            </Link>


            {/* Sort */}
            {(() => {
              const sortOptions = [
                { value: 'default' as const, en: 'Default Order', ar: 'ترتيب افتراضي' },
                { value: 'name' as const, en: 'Name', ar: 'الاسم' },
                { value: 'priority' as const, en: 'Priority', ar: 'الأولوية' },
                { value: 'newest' as const, en: 'Newest', ar: 'الأحدث' },
                { value: 'streak' as const, en: 'Streak', ar: 'السلسلة' },
                { value: 'completion' as const, en: 'Completion %', ar: 'نسبة الإنجاز' },
                { value: 'order' as const, en: 'Order Number', ar: 'رقم الترتيب' },
                { value: 'custom' as const, en: 'Custom (Drag)', ar: 'ترتيب يدوي (سحب)' },
              ];
              const currentSort = sortOptions.find(s => s.value === sortBy) || sortOptions[0];
              return (
                <div className="relative group/sort">
                  <button className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-300 cursor-pointer group-hover/sort:shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.1)]" style={{ borderColor: sortBy !== 'default' && sortBy !== 'order' ? 'rgba(var(--color-primary-rgb) / 0.3)' : 'rgba(var(--color-primary-rgb) / 0.12)', background: sortBy !== 'default' && sortBy !== 'order' ? 'rgba(var(--color-primary-rgb) / 0.06)' : 'transparent', color: sortBy !== 'default' && sortBy !== 'order' ? 'var(--color-primary)' : 'var(--foreground)' }}>
                    <ArrowUpDown className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                    {isAr ? currentSort.ar : currentSort.en}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover/sort:rotate-180" style={{ color: 'rgba(var(--color-primary-rgb) / 0.5)' }} />
                  </button>
                  <div className="absolute top-full pt-2 start-0 z-50 w-[min(360px,calc(100vw-2rem))] opacity-0 invisible group-hover/sort:opacity-100 group-hover/sort:visible transition-all duration-200 translate-y-1 group-hover/sort:translate-y-0">
                    <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[var(--foreground)]/[0.18]" style={{ background: 'var(--color-background)' }}>
                      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />
                      <div className="p-2">
                        <div className="grid grid-cols-2 gap-1">
                        {sortOptions.map((opt) => (
                            <button key={opt.value} onClick={() => setSortBy(opt.value)}
                              className={cn('flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-150 text-center border',
                                sortBy === opt.value
                                  ? 'text-white shadow-md border-transparent'
                                  : 'text-[var(--foreground)] border-transparent hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06] hover:border-[var(--color-primary)]/20 active:bg-[var(--color-primary)]/[0.12]')}
                              style={sortBy === opt.value ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                              {isAr ? opt.ar : opt.en}
                              {sortBy === opt.value && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                        ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* Advanced Filters */}
            {(() => {
              const activeFilterCount = [filterType !== 'all', filterPriority !== 'all', filterTracking !== 'all', filterStatus !== 'all'].filter(Boolean).length;
              return (
                <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-300 cursor-pointer',
                    showAdvancedFilters || activeFilterCount > 0
                      ? 'text-white shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.2)]'
                      : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.08)]')}
                  style={(showAdvancedFilters || activeFilterCount > 0) ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))', borderColor: 'var(--color-primary)' } : { borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}
                  onMouseEnter={(e) => { if (!showAdvancedFilters && activeFilterCount === 0) e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.3)'; }}
                  onMouseLeave={(e) => { if (!showAdvancedFilters && activeFilterCount === 0) e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.12)'; }}>
                  <SlidersHorizontal className="h-4 w-4" />
                  {isAr ? 'فلاتر' : 'Filters'}
                  {activeFilterCount > 0 && <span className="text-[11px] font-black bg-[var(--color-primary)] text-white h-5 min-w-[20px] rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                </button>
              );
            })()}

            {/* Search */}
            {/* Column toggle + Expand/Collapse */}
            {viewMode === 'cards' && (
              <div className="flex items-center gap-1.5 overflow-visible">
                <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}>
                  {([2, 3] as const).map(n => (
                    <button key={n} onClick={() => setGridCols(n)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-300 cursor-pointer',
                        gridCols === n ? 'text-white shadow-sm' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]')}
                      style={gridCols === n ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                      {n}
                    </button>
                  ))}
                </div>
                <div ref={expandMenuRef} className="relative"
                  onMouseEnter={() => setShowExpandMenu(true)}
                  onMouseLeave={() => setShowExpandMenu(false)}>
                  <button
                    className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all',
                      expandMode === 'expandAll'
                        ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : expandMode === 'foldAll'
                        ? 'border-orange-400/30 bg-orange-400/10 text-orange-500'
                        : 'border-[var(--foreground)]/[0.18] text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05]')}>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', expandMode === 'expandAll' && 'rotate-180')} />
                    {expandMode === 'expandAll' ? (isAr ? 'توسيع الكل' : 'Expand All')
                      : expandMode === 'foldAll' ? (isAr ? 'طي الكل' : 'Fold All')
                      : (isAr ? 'تلقائي' : 'Auto')}
                  </button>
                  <AnimatePresence>
                    {showExpandMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className={cn('absolute top-full pt-2 z-50 w-56', isAr ? 'right-0' : 'left-0')}>
                        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[var(--foreground)]/[0.18]" style={{ background: 'var(--color-background)' }}>
                          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />
                          <div className="p-1.5">
                            <button onClick={() => { setExpandMode('expandAll'); setCardsExpanded(true); const totalRows = Math.ceil(filteredHabits.length / gridCols); setExpandedRows(new Set(Array.from({ length: totalRows }, (_, i) => i))); setShowExpandMenu(false); }}
                              className={cn('w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-150',
                                expandMode === 'expandAll' ? 'text-white shadow-md' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06] hover:shadow-sm active:bg-[var(--color-primary)]/[0.12]')}
                              style={expandMode === 'expandAll' ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                              <ChevronDown className="h-4 w-4 rotate-180" />
                              {isAr ? 'توسيع الكل' : 'Expand All'}
                              {expandMode === 'expandAll' && <CheckCircle2 className="h-4 w-4 ms-auto" />}
                            </button>
                            <div className="mx-3 my-1 h-px bg-[var(--foreground)]/[0.05]" />
                            <button onClick={() => { setExpandMode('foldAll'); setCardsExpanded(false); setExpandedRows(new Set()); setShowExpandMenu(false); }}
                              className={cn('w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-150',
                                expandMode === 'foldAll' ? 'text-white shadow-md' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06] hover:shadow-sm active:bg-[var(--color-primary)]/[0.12]')}
                              style={expandMode === 'foldAll' ? { background: 'linear-gradient(135deg, #f97316, #ea580c)' } : undefined}>
                              <ChevronDown className="h-4 w-4" />
                              {isAr ? 'طي الكل' : 'Fold All'}
                              {expandMode === 'foldAll' && <CheckCircle2 className="h-4 w-4 ms-auto" />}
                            </button>
                            <div className="mx-3 my-1 h-px bg-[var(--foreground)]/[0.05]" />
                            <button onClick={() => { setExpandMode('auto'); setCardsExpanded(false); setShowExpandMenu(false); }}
                              className={cn('w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-150',
                                expandMode === 'auto' ? 'text-white shadow-md' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06] hover:shadow-sm active:bg-[var(--color-primary)]/[0.12]')}
                              style={expandMode === 'auto' ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                              <ChevronsUpDown className="h-4 w-4" />
                              {isAr ? 'تلقائي' : 'Auto'}
                              {expandMode === 'auto' && <CheckCircle2 className="h-4 w-4 ms-auto" />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            <div className="relative w-full sm:w-auto sm:ms-auto group/search">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 group-focus-within/search:text-[var(--color-primary)]" style={{ color: 'rgba(var(--color-primary-rgb) / 0.4)' }} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث...' : 'Search...'}
                className="rounded-xl border ps-9 pe-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium w-full sm:w-[220px] placeholder:text-[var(--foreground)] focus:outline-none transition-all duration-300 bg-transparent"
                style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--color-primary-rgb) / 0.08), 0 4px 16px rgba(var(--color-primary-rgb) / 0.06)'; e.currentTarget.style.background = 'rgba(var(--color-primary-rgb) / 0.02)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.12)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'transparent'; }} />
            </div>
          </motion.div>

          {/* Add New Habit — prominent CTA */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2.5} className="mb-6">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { resetForm(); setShowForm(true); }}
              className="w-full sm:w-auto sm:mx-auto sm:flex app-btn-primary inline-flex items-center justify-center gap-2 sm:gap-2.5 rounded-2xl px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-black text-white transition-all"
              style={{ boxShadow: '0 8px 24px rgba(var(--color-primary-rgb) / 0.3), 0 2px 6px rgba(var(--color-primary-rgb) / 0.15)' }}
            >
              <Plus className="h-5 w-5" /> {isAr ? 'إضافة عادة جديدة' : 'Add New Habit'}
            </motion.button>
          </motion.div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="rounded-2xl border border-[var(--foreground)]/[0.1] bg-[var(--foreground)]/[0.02] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold">{isAr ? 'فلاتر متقدمة' : 'Advanced Filters'}</span>
                    {(filterType !== 'all' || filterPriority !== 'all' || filterTracking !== 'all' || filterStatus !== 'all') && (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setFilterType('all'); setFilterPriority('all'); setFilterTracking('all'); setFilterStatus('all'); }}
                        className="text-xs text-[var(--color-primary)] font-bold hover:underline px-2 py-1 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors">
                        {isAr ? 'مسح الكل' : 'Clear All'}
                      </motion.button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Type filter */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider mb-2 block">{isAr ? 'النوع' : 'Type'}</label>
                      <div className="flex flex-wrap gap-1">
                        {([
                          { v: 'all' as const, en: 'All', ar: 'الكل' },
                          { v: 'positive' as const, en: 'Build', ar: 'إيجابية' },
                          { v: 'avoidance' as const, en: 'Break', ar: 'تجنب' },
                        ]).map(o => (
                          <button key={o.v} onClick={() => setFilterType(o.v)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer',
                              filterType === o.v ? 'text-white shadow-sm' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]')}
                            style={filterType === o.v ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                            {isAr ? o.ar : o.en}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Priority filter */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider mb-2 block">{isAr ? 'الأولوية' : 'Priority'}</label>
                      <div className="flex flex-wrap gap-1">
                        {([
                          { v: 'all' as const, en: 'All', ar: 'الكل' },
                          { v: 'high' as const, en: 'High', ar: 'عالية' },
                          { v: 'medium' as const, en: 'Med', ar: 'متوسطة' },
                          { v: 'low' as const, en: 'Low', ar: 'منخفضة' },
                        ]).map(o => (
                          <button key={o.v} onClick={() => setFilterPriority(o.v)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                              filterPriority === o.v ? 'text-white shadow-sm' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]')}
                            style={filterPriority === o.v ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                            {isAr ? o.ar : o.en}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Tracking type filter */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider mb-2 block">{isAr ? 'التتبع' : 'Tracking'}</label>
                      <div className="flex flex-wrap gap-1">
                        {([
                          { v: 'all' as const, en: 'All', ar: 'الكل' },
                          { v: 'boolean' as const, en: 'Yes/No', ar: 'نعم/لا' },
                          { v: 'count' as const, en: 'Count', ar: 'عدّ' },
                          { v: 'timer' as const, en: 'Timer', ar: 'مؤقت' },
                        ]).map(o => (
                          <button key={o.v} onClick={() => setFilterTracking(o.v)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                              filterTracking === o.v ? 'text-white shadow-sm' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]')}
                            style={filterTracking === o.v ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                            {isAr ? o.ar : o.en}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Status filter */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider mb-2 block">{isAr ? 'الحالة اليوم' : "Today's Status"}</label>
                      <div className="flex flex-wrap gap-1">
                        {([
                          { v: 'all' as const, en: 'All', ar: 'الكل' },
                          { v: 'done' as const, en: 'Done', ar: 'مكتمل' },
                          { v: 'pending' as const, en: 'Pending', ar: 'متبقي' },
                        ]).map(o => (
                          <button key={o.v} onClick={() => setFilterStatus(o.v)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                              filterStatus === o.v ? 'text-white shadow-sm' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]')}
                            style={filterStatus === o.v ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                            {isAr ? o.ar : o.en}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories — directly above habit cards so filter changes are visible right away */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2.15}
            className="relative z-[90] mb-3 flex items-stretch gap-2 sm:mb-4 sm:gap-2.5"
          >
            <CategoryChipsRail
              isAr={isAr}
              allCategories={allCategories}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              showArchived={showArchived}
              store={store}
            />
            <div className="flex shrink-0 items-center">
              <CategoryManageMenu
                isAr={isAr}
                allCategories={allCategories}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                store={store}
                toast={toast}
              />
            </div>
          </motion.div>

          {/* Habits — view modes (wrapped in DndContext when drag mode) */}
          {(() => {
            const dndStrategy = viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy;
            const viewContent = (
              <>
              {viewMode === 'cards' && (
                <>
                <style>{`.habits-cards-grid { display: grid; gap: 0.75rem; grid-template-columns: 1fr; } @media (min-width: 640px) { .habits-cards-grid { gap: 1rem; grid-template-columns: repeat(${gridCols}, minmax(0, 1fr)); } }`}</style>
                <div className="habits-cards-grid">
                  {filteredHabits.map((habit, i) => (
                    <SortableItem key={habit.id} id={habit.id} disabled={!isDragMode}>
                      <HabitFlipCard habit={habit} index={i} isAr={isAr} store={store} today={today}
                        expanded={expandMode === 'expandAll' ? true : expandMode === 'foldAll' ? false : expandedRows.has(Math.floor(i / gridCols))}
                        onEdit={() => openEdit(habit)} onArchive={() => store.toggleHabitArchive(habit.id)} onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} onViewFull={() => setFullCalendarHabit(habit)} onViewPage={`/app/habits/${habit.id}`}
                        rowExpanded={expandedRows.has(Math.floor(i / gridCols))}
                        onToggleRow={expandMode === 'auto' ? (() => { const row = Math.floor(i / gridCols); setExpandedRows(prev => { const next = new Set(prev); if (next.has(row)) next.delete(row); else next.add(row); return next; }); }) : undefined} />
                    </SortableItem>
                  ))}
                </div>
                </>
              )}

              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                  {filteredHabits.map((habit, i) => (
                    <SortableItem key={habit.id} id={habit.id} disabled={!isDragMode}>
                      <HabitGridCard habit={habit} index={i} isAr={isAr} store={store} today={today}
                        onEdit={() => openEdit(habit)} onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} onViewPage={`/app/habits/${habit.id}`} />
                    </SortableItem>
                  ))}
                </div>
              )}

              {viewMode === 'list' && (
                <div className="space-y-2">
                  {filteredHabits.map((habit, i) => (
                    <SortableItem key={habit.id} id={habit.id} disabled={!isDragMode}>
                      <HabitListRow habit={habit} index={i} isAr={isAr} store={store} today={today}
                        onEdit={() => openEdit(habit)} onArchive={() => store.toggleHabitArchive(habit.id)} onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} onViewPage={`/app/habits/${habit.id}`} />
                    </SortableItem>
                  ))}
                </div>
              )}

              {viewMode === 'board' && (
                <HabitBoardView habits={filteredHabits} isAr={isAr} store={store} today={today}
                  onEdit={(h) => openEdit(h)} onDelete={(h) => store.deleteHabit(h.id)} onDetail={(h) => setDetailHabit(h)} locale={locale} />
              )}

              {viewMode === 'minimal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredHabits.map((habit, i) => (
                    <SortableItem key={habit.id} id={habit.id} disabled={!isDragMode}>
                      <HabitMinimalCard habit={habit} index={i} isAr={isAr} store={store} today={today}
                        onToggle={() => {
                          if (habit.expectedDuration) return;
                          const existingLog = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);
                          if (existingLog) { store.deleteHabitLog(existingLog.id); }
                          else { store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true }); }
                        }}
                        onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} onViewPage={`/app/habits/${habit.id}`} />
                    </SortableItem>
                  ))}
                </div>
              )}
              </>
            );

            return isDragMode ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="h-4 w-4 text-[var(--foreground)]" />
                  <span className="text-xs font-medium text-[var(--foreground)]">
                    {isAr ? 'اسحب العادات لإعادة ترتيبها' : 'Drag habits to reorder them'}
                  </span>
                </div>
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredHabits.map(h => h.id)} strategy={dndStrategy}>
                    {viewContent}
                  </SortableContext>
                </DndContext>
              </>
            ) : viewContent;
          })()}

          {filteredHabits.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--foreground)]/[0.05]">
                <Target className="h-6 w-6 text-[var(--foreground)]" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)] mb-1">
                {showArchived
                  ? (isAr ? 'لا توجد عادات مؤرشفة' : 'No archived habits')
                  : searchQuery
                    ? (isAr ? 'لا توجد عادات تطابق البحث' : 'No habits match your search')
                    : filterCategory !== 'all'
                      ? (isAr ? 'لا توجد عادات في هذه الفئة' : 'No habits in this category')
                      : (isAr ? 'لا توجد عادات بعد' : 'No habits yet')}
              </p>
              <p className="text-xs text-[var(--foreground)] mb-4">
                {showArchived
                  ? (isAr ? 'العادات المؤرشفة ستظهر هنا' : 'Archived habits will appear here')
                  : searchQuery
                    ? (isAr ? 'جرّب كلمة بحث مختلفة' : 'Try a different search term')
                    : filterCategory !== 'all'
                      ? (isAr ? 'أضف عادة جديدة في هذه الفئة' : 'Add a new habit in this category')
                      : (isAr ? 'ابدأ بإنشاء عادتك الأولى' : 'Start by creating your first habit')}
              </p>
              <div className="flex items-center justify-center gap-2">
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--foreground)] border border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05]">
                    <X className="h-3 w-3" /> {isAr ? 'مسح البحث' : 'Clear Search'}
                  </button>
                )}
                {filterCategory !== 'all' && (
                  <button onClick={() => setFilterCategory('all')}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--foreground)] border border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05]">
                    <Filter className="h-3 w-3" /> {isAr ? 'كل الفئات' : 'All Categories'}
                  </button>
                )}
                {!showArchived && (
                  <button onClick={() => { resetForm(); setShowForm(true); }}
                    className="app-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white">
                    <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة عادة' : 'Add Habit'}
                  </button>
                )}
              </div>
            </motion.div>
          )}

      {/* Full-screen Compliance Table Modal */}
      <AnimatePresence>
        {showFullTable && (
          <HabitsComplianceTable
            habits={store.habits.filter(h => !h.archived)}
            isAr={isAr}
            store={store}
            onClose={() => setShowFullTable(false)}
          />
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); resetForm(); }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-2 sm:inset-x-4 top-[2%] sm:top-[10%] z-[var(--z-modal)] sm:w-[540px] sm:inset-x-0 sm:mx-auto max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.18] shadow-2xl"
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-[var(--color-background)] flex items-center justify-between p-5 border-b border-[var(--foreground)]/[0.1]">
                <h2 className="text-lg font-semibold">
                  {editingHabit
                    ? (isAr ? 'تعديل العادة' : 'Edit Habit')
                    : (isAr ? 'عادة جديدة' : 'New Habit')}
                </h2>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* ── Section: Basic Info ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-blue-500/10 flex items-center justify-center"><Edit3 className="h-3 w-3 text-blue-500" /></div>
                    <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'المعلومات الأساسية' : 'Basic Info'}</span>
                  </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                      {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
                    </label>
                    <input
                      dir="rtl"
                      value={formData.nameAr}
                      onChange={e => setFormData(f => ({ ...f, nameAr: e.target.value }))}
                      className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                      placeholder="مثال: شرب الماء"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                      {isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}
                    </label>
                    <input
                      dir="ltr"
                      value={formData.nameEn}
                      onChange={e => setFormData(f => ({ ...f, nameEn: e.target.value }))}
                      className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                      placeholder="e.g., Drink Water"
                    />
                  </div>
                </div>

                {/* Category & Frequency */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                      {isAr ? 'الفئة' : 'Category'}
                    </label>
                    <CategoryPicker isAr={isAr} allCategories={allCategories} value={formData.category} onChange={(cat) => setFormData(f => ({ ...f, category: cat }))} store={store} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                      {isAr ? 'التكرار' : 'Frequency'}
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={e => setFormData(f => ({ ...f, frequency: e.target.value as HabitFrequency }))}
                      className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                    >
                      {Object.entries(FREQ_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{isAr ? v.ar : v.en}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Weekly repeat days */}
                {formData.frequency === 'weekly' && (
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                      {isAr ? 'أيام التكرار' : 'Repeat Days'}
                    </label>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6].map(d => (
                        <button
                          key={d}
                          onClick={() => setFormData(f => ({
                            ...f,
                            customDays: f.customDays.includes(d as WeekDay)
                              ? f.customDays.filter(x => x !== d)
                              : [...f.customDays, d as WeekDay]
                          }))}
                          className={cn(
                            'app-toggle flex-1 py-2 rounded-lg text-xs font-medium',
                            formData.customDays.includes(d as WeekDay)
                              ? 'app-toggle-active'
                              : 'text-[var(--foreground)]'
                          )}
                        >
                          {isAr ? DAY_LABELS.ar[d] : DAY_LABELS.en[d]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom frequency options */}
                {formData.frequency === 'custom' && (
                  <div className="space-y-3">
                    {/* Custom schedule type selector */}
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                        {isAr ? 'نوع الجدول المخصص' : 'Custom Schedule Type'}
                      </label>
                      <div className="flex gap-1.5">
                        {(['weekdays', 'monthdays', 'yeardays'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setFormData(f => ({ ...f, customScheduleType: t }))}
                            className={cn(
                              'app-toggle flex-1 py-2 rounded-lg text-xs font-medium',
                              formData.customScheduleType === t
                                ? 'app-toggle-active'
                                : 'text-[var(--foreground)]'
                            )}
                          >
                            {isAr ? CUSTOM_SCHEDULE_LABELS[t].ar : CUSTOM_SCHEDULE_LABELS[t].en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Weekdays picker */}
                    {formData.customScheduleType === 'weekdays' && (
                      <div>
                        <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                          {isAr ? 'أيام التكرار' : 'Repeat Days'}
                        </label>
                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3, 4, 5, 6].map(d => (
                            <button
                              key={d}
                              onClick={() => setFormData(f => ({
                                ...f,
                                customDays: f.customDays.includes(d as WeekDay)
                                  ? f.customDays.filter(x => x !== d)
                                  : [...f.customDays, d as WeekDay]
                              }))}
                              className={cn(
                                'app-toggle flex-1 py-2 rounded-lg text-xs font-medium',
                                formData.customDays.includes(d as WeekDay)
                                  ? 'app-toggle-active'
                                  : 'text-[var(--foreground)]'
                              )}
                            >
                              {isAr ? DAY_LABELS.ar[d] : DAY_LABELS.en[d]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Month days picker (1-31 grid) */}
                    {formData.customScheduleType === 'monthdays' && (
                      <div>
                        <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                          {isAr ? 'أيام الشهر' : 'Days of Month'}
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                            <button
                              key={d}
                              onClick={() => setFormData(f => ({
                                ...f,
                                customMonthDays: f.customMonthDays.includes(d)
                                  ? f.customMonthDays.filter(x => x !== d)
                                  : [...f.customMonthDays, d].sort((a, b) => a - b)
                              }))}
                              className={cn(
                                'app-toggle py-1.5 rounded-lg text-xs font-medium',
                                formData.customMonthDays.includes(d)
                                  ? 'app-toggle-active'
                                  : 'text-[var(--foreground)]'
                              )}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                        {formData.customMonthDays.length > 0 && (
                          <p className="text-[10px] text-[var(--foreground)] mt-1.5">
                            {isAr ? 'المحدد: ' : 'Selected: '}{formData.customMonthDays.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Year days picker (month + day combos) */}
                    {formData.customScheduleType === 'yeardays' && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                          {isAr ? 'أيام محددة من السنة' : 'Specific Days of Year'}
                        </label>
                        {/* Month selector grid */}
                        <div className="grid grid-cols-4 gap-1">
                          {MONTH_LABELS[isAr ? 'ar' : 'en'].map((label, mi) => {
                            const hasEntries = formData.customYearDays.some(yd => yd.month === mi);
                            return (
                              <button
                                key={mi}
                                onClick={() => {
                                  // Toggle showing days for this month by adding/removing placeholder
                                  setFormData(f => {
                                    const existing = f.customYearDays.filter(yd => yd.month === mi);
                                    if (existing.length > 0) {
                                      return { ...f, customYearDays: f.customYearDays.filter(yd => yd.month !== mi) };
                                    }
                                    // When clicking a month with no entries, expand it (add day 1 as default)
                                    return { ...f, customYearDays: [...f.customYearDays, { month: mi, day: 1 }].sort((a, b) => a.month - b.month || a.day - b.day) };
                                  });
                                }}
                                className={cn(
                                  'app-toggle py-1.5 rounded-lg text-xs font-medium',
                                  hasEntries ? 'app-toggle-active' : 'text-[var(--foreground)]'
                                )}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        {/* Show day grid for each selected month */}
                        {(() => {
                          const selectedMonths = [...new Set(formData.customYearDays.map(yd => yd.month))].sort((a, b) => a - b);
                          if (selectedMonths.length === 0) return null;
                          return selectedMonths.map(mi => {
                            const daysInMonth = new Date(2024, mi + 1, 0).getDate(); // Use leap year to get max days
                            const selectedDays = formData.customYearDays.filter(yd => yd.month === mi).map(yd => yd.day);
                            return (
                              <div key={mi} className="mt-2">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] font-semibold text-[var(--foreground)]">
                                    {isAr ? MONTH_LABELS.ar[mi] : MONTH_LABELS.en[mi]}
                                  </span>
                                  <button
                                    onClick={() => setFormData(f => ({
                                      ...f,
                                      customYearDays: f.customYearDays.filter(yd => yd.month !== mi)
                                    }))}
                                    className="text-[10px] text-red-400 hover:text-red-500"
                                  >
                                    {isAr ? 'إزالة' : 'Remove'}
                                  </button>
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                                    <button
                                      key={d}
                                      onClick={() => setFormData(f => {
                                        const has = f.customYearDays.some(yd => yd.month === mi && yd.day === d);
                                        const updated = has
                                          ? f.customYearDays.filter(yd => !(yd.month === mi && yd.day === d))
                                          : [...f.customYearDays, { month: mi, day: d }];
                                        // If removing the last day from a month, keep at least the month header
                                        const monthStillHasDays = updated.some(yd => yd.month === mi);
                                        const final = monthStillHasDays ? updated : updated;
                                        return { ...f, customYearDays: final.sort((a, b) => a.month - b.month || a.day - b.day) };
                                      })}
                                      className={cn(
                                        'app-toggle py-1.5 rounded-lg text-[11px] font-medium',
                                        selectedDays.includes(d)
                                          ? 'app-toggle-active'
                                          : 'text-[var(--foreground)]'
                                      )}
                                    >
                                      {d}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                        {/* Summary */}
                        {formData.customYearDays.length > 0 && (
                          <p className="text-[10px] text-[var(--foreground)] mt-1">
                            {isAr ? 'المحدد: ' : 'Selected: '}
                            {formData.customYearDays.map(yd =>
                              `${(isAr ? MONTH_LABELS.ar : MONTH_LABELS.en)[yd.month]} ${yd.day}`
                            ).join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Completion Method ── */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                    {isAr ? 'طريقة الإنجاز' : 'Completion Method'}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([
                      { type: 'boolean' as const, en: 'Yes/No', ar: 'نعم/لا', desc: isAr ? 'تم أو لم يتم' : 'Done or not' },
                      { type: 'count' as const, en: 'Count', ar: 'عداد', desc: isAr ? 'عدد محدد' : 'Reach a number' },
                      { type: 'timer' as const, en: 'Timer', ar: 'مؤقت', desc: isAr ? 'تتبع بالوقت' : 'Track by time' },
                      { type: 'checklist' as const, en: 'Checklist', ar: 'قائمة', desc: isAr ? 'خطوات متعددة' : 'Multi-step' },
                      { type: 'duration' as const, en: 'Duration', ar: 'مدة', desc: isAr ? 'سجل الدقائق' : 'Log minutes' },
                    ]).map(t => (
                      <button
                        key={t.type}
                        onClick={() => setFormData(f => ({ ...f, trackingType: t.type }))}
                        className={cn(
                          'app-toggle py-2.5 px-1 rounded-xl text-center transition-all',
                          formData.trackingType === t.type
                            ? 'app-toggle-active ring-1 ring-[var(--color-primary)]/30'
                            : 'text-[var(--foreground)]'
                        )}
                      >
                        <span className="text-[11px] font-semibold block">{isAr ? t.ar : t.en}</span>
                        <span className="text-[9px] opacity-50 block mt-0.5">{t.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Completion Window for boolean habits */}
                  {formData.trackingType === 'boolean' && (
                    <div className="p-3 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.15]">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3.5 w-3.5 text-[var(--color-primary)]/60" />
                        <span className="text-[10px] font-semibold text-[var(--foreground)]">
                          {isAr ? 'نافذة التسجيل (متى يمكنك تسجيل الإنجاز؟)' : 'Completion Window (when can you mark it done?)'}
                        </span>
                      </div>
                      <p className="text-[9px] text-[var(--foreground)] mb-2">
                        {isAr ? 'حدد الفترة الزمنية التي يمكنك فيها تسجيل هذه العادة كمنجزة. اتركها فارغة للسماح في أي وقت.' : 'Set the time range during which you can mark this habit as done. Leave empty to allow anytime.'}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-medium text-[var(--foreground)] mb-1 block">{isAr ? 'من' : 'From'}</label>
                          <input type="time" value={formData.completionWindowStart}
                            onChange={e => setFormData(f => ({ ...f, completionWindowStart: e.target.value }))}
                            className="app-input w-full rounded-lg bg-transparent px-2.5 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-[var(--foreground)] mb-1 block">{isAr ? 'إلى' : 'To'}</label>
                          <input type="time" value={formData.completionWindowEnd}
                            onChange={e => setFormData(f => ({ ...f, completionWindowEnd: e.target.value }))}
                            className="app-input w-full rounded-lg bg-transparent px-2.5 py-2 text-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Count settings */}
                  {formData.trackingType === 'count' && (
                    <div className="flex gap-3 items-end p-3 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.15]">
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1 block">
                          {isAr ? 'الهدف' : 'Target'}
                        </label>
                        <input type="number" min={1} value={formData.targetValue}
                          onChange={e => setFormData(f => ({ ...f, targetValue: Number(e.target.value) || 1 }))}
                          className="w-full rounded-lg app-input px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1 block">
                          {isAr ? 'الوحدة' : 'Unit'}
                        </label>
                        <select value={formData.targetUnit}
                          onChange={e => setFormData(f => ({ ...f, targetUnit: e.target.value }))}
                          className="w-full rounded-lg app-input px-3 py-2 text-sm">
                          {['times', 'cups', 'glasses', 'pages', 'steps', 'reps', 'sets', 'laps', 'items'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Timer settings */}
                  {formData.trackingType === 'timer' && (
                    <div className="p-3 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.15]">
                      <label className="text-[10px] font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1 block">
                        {isAr ? 'المدة المطلوبة (دقائق)' : 'Target Duration (minutes)'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[5, 10, 15, 20, 25, 30, 45, 60, 90].map(m => (
                          <button key={m}
                            onClick={() => setFormData(f => ({ ...f, expectedDuration: m }))}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                              Number(formData.expectedDuration) === m
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]')}>
                            {m}m
                          </button>
                        ))}
                      </div>
                      <input type="number" min={1} value={formData.expectedDuration}
                        onChange={e => setFormData(f => ({ ...f, expectedDuration: e.target.value }))}
                        className="w-full rounded-lg app-input px-3 py-2 text-sm mt-2"
                        placeholder={isAr ? 'أو أدخل عدد الدقائق' : 'Or enter custom minutes'}
                      />
                    </div>
                  )}

                  {/* Duration settings */}
                  {formData.trackingType === 'duration' && (
                    <div className="p-3 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.15]">
                      <label className="text-[10px] font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1 block">
                        {isAr ? 'الهدف اليومي (دقائق)' : 'Daily Target (minutes)'}
                      </label>
                      <input type="number" min={1} value={formData.targetValue}
                        onChange={e => setFormData(f => ({ ...f, targetValue: Number(e.target.value) || 1 }))}
                        className="w-full rounded-lg app-input px-3 py-2 text-sm"
                        placeholder={isAr ? 'مثال: 30 دقيقة' : 'e.g., 30 minutes'}
                      />
                    </div>
                  )}

                  {/* Checklist items — available for any tracking type */}
                  {(
                    <div className="p-3 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.15] space-y-2">
                      <label className="text-[10px] font-semibold text-[var(--foreground)] uppercase tracking-wider block">
                        {isAr ? 'عناصر القائمة' : 'Checklist Items'}
                      </label>
                      {formData.checklistItems.length > 0 && (
                        <div className="space-y-1">
                          {formData.checklistItems.map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--color-background)]">
                              <span className="text-[10px] font-bold text-[var(--foreground)] w-4">{idx + 1}</span>
                              <span className="text-xs flex-1">{isAr ? (item.titleAr || item.titleEn) : (item.titleEn || item.titleAr)}</span>
                              <button onClick={() => setFormData(f => ({
                                ...f,
                                checklistItems: f.checklistItems.filter(i => i.id !== item.id)
                              }))} className="text-[var(--foreground)] hover:text-red-400">
                                <span className="text-xs">×</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          value={formData.newChecklistItem}
                          onChange={e => setFormData(f => ({ ...f, newChecklistItem: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && formData.newChecklistItem.trim()) {
                              e.preventDefault();
                              setFormData(f => ({
                                ...f,
                                checklistItems: [...f.checklistItems, {
                                  id: generateId(),
                                  titleEn: isAr ? '' : f.newChecklistItem.trim(),
                                  titleAr: isAr ? f.newChecklistItem.trim() : '',
                                }],
                                newChecklistItem: '',
                              }));
                            }
                          }}
                          dir={isAr ? 'rtl' : 'ltr'}
                          className="flex-1 rounded-lg app-input px-3 py-2 text-xs"
                          placeholder={isAr ? 'أضف خطوة...' : 'Add step...'}
                        />
                        <button
                          onClick={() => {
                            if (!formData.newChecklistItem.trim()) return;
                            setFormData(f => ({
                              ...f,
                              checklistItems: [...f.checklistItems, {
                                id: generateId(),
                                titleEn: isAr ? '' : f.newChecklistItem.trim(),
                                titleAr: isAr ? f.newChecklistItem.trim() : '',
                              }],
                              newChecklistItem: '',
                            }));
                          }}
                          className="px-3 py-2 rounded-lg bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.1] text-[var(--foreground)] text-xs">
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block">
                    {isAr ? 'ملاحظات العادة' : 'Habit Notes'}
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                    dir={isAr ? 'rtl' : 'ltr'}
                    rows={2}
                    className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm resize-none"
                    placeholder={isAr ? 'مثال: هذه العادة لبناء هوية رياضي محترف...' : 'e.g., This habit builds my identity as an athlete...'}
                  />
                </div>
                </div>

                {/* ── Section: Behavior ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-violet-500/10 flex items-center justify-center"><Activity className="h-3 w-3 text-violet-500" /></div>
                    <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'السلوك والتصنيف' : 'Behavior & Settings'}</span>
                  </div>
                {/* Priority & Difficulty */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                      {isAr ? 'الأولوية' : 'Priority'}
                    </label>
                    <div className="flex gap-1.5">
                      {(['low', 'medium', 'high'] as Priority[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setFormData(f => ({ ...f, priority: p }))}
                          className={cn(
                            'app-toggle flex-1 py-2 rounded-lg text-xs font-medium',
                            formData.priority === p
                              ? (p === 'high' ? 'bg-red-500! border-red-500! text-white!' : p === 'medium' ? 'bg-amber-500! border-amber-500! text-white!' : 'bg-blue-500! border-blue-500! text-white!')
                              : 'text-[var(--foreground)]'
                          )}
                        >
                          {isAr ? (p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة') : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                      {isAr ? 'الصعوبة' : 'Difficulty'}
                    </label>
                    <div className="flex gap-1.5">
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                        <button
                          key={d}
                          onClick={() => setFormData(f => ({ ...f, difficulty: d }))}
                          className={cn(
                            'app-toggle flex-1 py-2 rounded-lg text-xs font-medium',
                            formData.difficulty === d
                              ? 'app-toggle-active'
                              : 'text-[var(--foreground)]'
                          )}
                        >
                          {isAr ? (d === 'hard' ? 'صعبة' : d === 'medium' ? 'متوسطة' : 'سهلة') : d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                    {isAr ? 'النوع' : 'Type'}
                  </label>
                  <div className="flex gap-2">
                    {(['positive', 'avoidance'] as HabitType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setFormData(f => ({ ...f, type: t }))}
                        className={cn(
                          'app-toggle flex-1 py-2.5 rounded-xl text-xs font-medium',
                          formData.type === t
                            ? 'app-toggle-active'
                            : 'text-[var(--foreground)]'
                        )}
                      >
                        {isAr ? (t === 'positive' ? '✓ عادة إيجابية' : '✗ عادة للتجنب') : (t === 'positive' ? '✓ Build' : '✗ Break')}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Order Number */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                    {isAr ? 'رقم الترتيب (اختياري)' : 'Order Number (optional)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.orderNumber}
                    onChange={e => { const v = e.target.value; if (v !== '' && Number(v) < 1) return; setFormData(f => ({ ...f, orderNumber: v })); }}
                    className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                    placeholder={isAr ? 'تلقائي — أو اختر رقمًا' : 'Auto — or choose a number'}
                  />
                  <p className="text-[9px] text-[var(--foreground)] mt-1">
                    {isAr ? 'يُعيَّن تلقائيًا إذا تُرك فارغًا، ويُحل التعارض تلقائيًا' : 'Auto-assigned if empty, conflicts resolved automatically'}
                  </p>
                </div>
                </div>

                {/* ── Section: Customization ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-pink-500/10 flex items-center justify-center"><Palette className="h-3 w-3 text-pink-500" /></div>
                    <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'التخصيص' : 'Customization'}</span>
                  </div>
                {/* Color */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                    {isAr ? 'اللون' : 'Color'}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {ITEM_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setFormData(f => ({ ...f, color: c }))}
                        className={cn(
                          'h-8 w-8 rounded-full transition-all relative',
                          formData.color === c ? 'ring-2 ring-offset-2 ring-[var(--foreground)]/30 scale-110' : 'hover:scale-110',
                          c === 'theme' && 'bg-[var(--color-primary)]'
                        )}
                        style={c !== 'theme' ? { backgroundColor: c } : undefined}
                        title={c === 'theme' ? (isAr ? 'لون الثيم (تلقائي)' : 'Theme Color (auto)') : c}
                      >
                        {c === 'theme' && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-black">A</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                    {isAr ? 'صورة (اختياري)' : 'Image (optional)'}
                  </label>
                  {formData.image ? (
                    <div className="relative rounded-xl overflow-hidden bg-black/10 dark:bg-black/40 flex items-center justify-center">
                      <img src={formData.image} alt="" className="max-h-48 w-auto max-w-full rounded-xl" />
                      <button onClick={() => setFormData(f => ({ ...f, image: '' }))}
                        className="absolute top-2 end-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-[var(--foreground)]/[0.18] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.03] cursor-pointer transition-colors">
                      <Plus className="h-5 w-5 text-[var(--foreground)] mb-1" />
                      <span className="text-[10px] text-[var(--foreground)]">{isAr ? 'اضغط لإضافة صورة' : 'Click to add image'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setFormData(f => ({ ...f, image: ev.target?.result as string }));
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  )}
                </div>
                </div>

                {/* ── Section: Place & Time ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-teal-500/10 flex items-center justify-center"><MapPin className="h-3 w-3 text-teal-500" /></div>
                    <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'المكان والزمان' : 'Place & Time'}</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                        {isAr ? 'المكان' : 'Place'}
                      </label>
                      <input
                        value={isAr ? formData.placeAr : formData.placeEn}
                        onChange={e => setFormData(f => isAr ? ({ ...f, placeAr: e.target.value }) : ({ ...f, placeEn: e.target.value }))}
                        className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                        placeholder={isAr ? 'مثال: في النادي الرياضي' : 'e.g., At the gym'}
                        dir={isAr ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                        {isAr ? 'الوقت المفضل' : 'Preferred Time'}
                      </label>
                      <input
                        type="time"
                        value={formData.preferredTime}
                        onChange={e => setFormData(f => ({ ...f, preferredTime: e.target.value }))}
                        className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                        {isAr ? 'المدة المتوقعة (دقيقة)' : 'Expected Duration (min)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.expectedDuration}
                        onChange={e => setFormData(f => ({ ...f, expectedDuration: e.target.value }))}
                        className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                        placeholder={isAr ? 'مثال: 30' : 'e.g., 30'}
                      />
                    </div>
                  </div>

                  {/* Time Window (optional) */}
                  <div className="mt-3 rounded-xl border border-dashed border-[var(--foreground)]/[0.1] bg-[var(--foreground)]/[0.015] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-3.5 w-3.5 text-[var(--color-primary)]/60" />
                      <span className="text-[10px] font-semibold text-[var(--foreground)]">{isAr ? 'نافذة الوقت المثالي (اختياري)' : 'Ideal Time Window (optional)'}</span>
                    </div>
                    <p className="text-[9px] text-[var(--foreground)] mb-2">
                      {isAr ? 'إذا أكملت العادة في هذا الوقت = أخضر، خارجه = برتقالي، لم تكتمل = أحمر' : 'Done in window = green, outside = orange, missed = red'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-[var(--foreground)] mb-1 block">{isAr ? 'من' : 'From'}</label>
                        <input type="time" value={formData.windowStart}
                          onChange={e => setFormData(f => ({ ...f, windowStart: e.target.value }))}
                          className="app-input w-full rounded-lg bg-transparent px-2.5 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[var(--foreground)] mb-1 block">{isAr ? 'إلى' : 'To'}</label>
                        <input type="time" value={formData.windowEnd}
                          onChange={e => setFormData(f => ({ ...f, windowEnd: e.target.value }))}
                          className="app-input w-full rounded-lg bg-transparent px-2.5 py-2 text-sm" />
                      </div>
                    </div>
                    {/* Strict window checkbox */}
                    {(formData.windowStart || formData.windowEnd) && (
                      <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                        <input type="checkbox" checked={formData.strictWindow || false}
                          onChange={e => setFormData(f => ({ ...f, strictWindow: e.target.checked }))}
                          className="h-4 w-4 rounded accent-[var(--color-primary)]" />
                        <div>
                          <span className="text-xs font-bold text-[var(--foreground)]">
                            {isAr ? 'صارم — لا يمكن الإنجاز خارج هذا الوقت' : 'Strict — cannot complete outside this window'}
                          </span>
                          <p className="text-[9px] text-[var(--foreground)]">
                            {isAr ? 'إذا انتهى الوقت بدون إنجاز، تُسجل العادة كفائتة تلقائيًا' : 'If window passes without completion, habit auto-marks as missed'}
                          </p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Max daily repetitions */}
                  <div className="mt-3">
                    <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                      <input type="checkbox"
                        checked={formData.maxDailyReps !== '' && formData.maxDailyReps !== undefined}
                        onChange={e => setFormData(f => ({ ...f, maxDailyReps: e.target.checked ? (f.maxDailyReps || 2) : '' }))}
                        className="h-4 w-4 rounded border-[var(--foreground)]/20 accent-violet-500"
                      />
                      <span className="text-xs font-medium">{isAr ? 'تحديد أقصى عدد تكرارات يوميًا' : 'Limit daily repetitions'}</span>
                    </label>
                    {formData.maxDailyReps !== '' && formData.maxDailyReps !== undefined && (
                      <input type="number" min="1"
                        value={formData.maxDailyReps}
                        onChange={e => setFormData(f => ({ ...f, maxDailyReps: e.target.value }))}
                        className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                        placeholder={isAr ? 'مثال: 3 جلسات دراسة يوميًا' : 'e.g., 3 study sessions per day'} />
                    )}
                    <p className="text-[9px] text-[var(--foreground)] mt-1">
                      {isAr ? 'إذا لم يُفعَّل، غير محدود' : 'If unchecked, unlimited'}
                    </p>
                  </div>
                </div>

                {/* ── Section: Overall Goal ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-indigo-500/10 flex items-center justify-center"><Target className="h-3 w-3 text-indigo-500" /></div>
                    <span className="text-xs font-bold">{isAr ? 'الهدف الكلي' : 'Overall Goal'}</span>
                  </div>
                  <p className="text-[11px] text-[var(--foreground)] mb-3">
                    {isAr ? 'حدد أهدافاً إجمالية لهذه العادة — يمكنك اختيار أحدهما أو كليهما' : 'Set total goals for this habit — choose one or both'}
                  </p>
                  <div className="space-y-3">
                    {/* Repetitions goal */}
                    <div className="p-3 rounded-xl border border-[var(--foreground)]/[0.18] bg-[var(--foreground)]/[0.02]">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="text-[11px] font-bold text-[var(--foreground)]">{isAr ? 'هدف التكرارات' : 'Repetitions Goal'}</span>
                      </div>
                      <input type="number" min={1}
                        value={formData.goalReps}
                        onChange={e => setFormData(f => ({ ...f, goalReps: e.target.value }))}
                        className="w-full rounded-lg app-input px-3 py-2 text-sm"
                        placeholder={isAr ? 'مثال: 100 تكرار إجمالي' : 'e.g., 100 total reps'}
                      />
                    </div>
                    {/* Hours goal — only for habits that track time */}
                    {(formData.trackingType === 'timer' || formData.trackingType === 'duration') && (
                      <div className="p-3 rounded-xl border border-[var(--foreground)]/[0.18] bg-[var(--foreground)]/[0.02]">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-3.5 w-3.5 text-violet-500" />
                          <span className="text-[11px] font-bold text-[var(--foreground)]">{isAr ? 'هدف الساعات' : 'Hours Goal'}</span>
                        </div>
                        <input type="number" min={1} step="0.5"
                          value={formData.goalHours}
                          onChange={e => setFormData(f => ({ ...f, goalHours: e.target.value }))}
                          className="w-full rounded-lg app-input px-3 py-2 text-sm"
                          placeholder={isAr ? 'مثال: 50 ساعة إجمالية' : 'e.g., 50 total hours'}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Section: Streak Challenges (3 tiers) ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-amber-500/10 flex items-center justify-center"><Trophy className="h-3 w-3 text-amber-500" /></div>
                    <span className="text-xs font-bold">{isAr ? 'تحديات السلسلة' : 'Streak Challenges'}</span>
                  </div>
                  <p className="text-[11px] text-[var(--foreground)] mb-3">
                    {isAr ? 'حدد أهداف سلسلة متدرجة مع جوائز تحفيزية لكل مستوى' : 'Set tiered streak goals with motivational rewards for each level'}
                  </p>
                  <div className="space-y-4">
                    {([
                      { tier: 1, icon: '🥉', label: isAr ? 'المستوى الأول' : 'Tier 1', goalKey: 'streakGoal' as const, rewardEnKey: 'streakRewardEn' as const, rewardArKey: 'streakRewardAr' as const, color: 'text-amber-700 bg-amber-500/10 border-amber-500/20' },
                      { tier: 2, icon: '🥈', label: isAr ? 'المستوى الثاني' : 'Tier 2', goalKey: 'streakGoal2' as const, rewardEnKey: 'streakRewardEn2' as const, rewardArKey: 'streakRewardAr2' as const, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
                      { tier: 3, icon: '🥇', label: isAr ? 'المستوى الثالث' : 'Tier 3', goalKey: 'streakGoal3' as const, rewardEnKey: 'streakRewardEn3' as const, rewardArKey: 'streakRewardAr3' as const, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
                    ] as const).map(t => (
                      <div key={t.tier} className={cn('rounded-xl border p-3', t.color)}>
                        <p className="text-[11px] font-bold mb-2">{t.icon} {t.label}</p>
                        <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                          <div>
                            <label className="text-[10px] font-semibold mb-1 block">{isAr ? 'الأيام' : 'Days'}</label>
                            <input type="number" min="1"
                              value={formData[t.goalKey]}
                              onChange={e => setFormData(f => ({ ...f, [t.goalKey]: e.target.value }))}
                              className="app-input w-full rounded-lg bg-transparent px-2 py-1.5 text-sm"
                              placeholder={t.tier === 1 ? '7' : t.tier === 2 ? '30' : '90'} />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold mb-1 block">{isAr ? 'الجائزة' : 'Reward'}</label>
                            <input
                              value={isAr ? formData[t.rewardArKey] : formData[t.rewardEnKey]}
                              onChange={e => setFormData(f => isAr ? ({ ...f, [t.rewardArKey]: e.target.value }) : ({ ...f, [t.rewardEnKey]: e.target.value }))}
                              dir={isAr ? 'rtl' : 'ltr'}
                              className="app-input w-full rounded-lg bg-transparent px-2 py-1.5 text-sm"
                              placeholder={t.tier === 1 ? (isAr ? 'مثال: حلوى مفضلة' : 'e.g., Favorite dessert') : t.tier === 2 ? (isAr ? 'مثال: شراء كتاب' : 'e.g., Buy a book') : (isAr ? 'مثال: رحلة عطلة' : 'e.g., Weekend trip')} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Section: Habit Loop ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-orange-500/10 flex items-center justify-center"><Repeat className="h-3 w-3 text-orange-500" /></div>
                    <span className="text-xs font-bold text-[var(--foreground)]">{isAr ? 'حلقة العادة' : 'Habit Loop'}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1 flex items-center gap-1.5">
                        <Lightbulb className="h-3 w-3 text-amber-500" />
                        {isAr ? 'الإشارة (المحفز)' : 'Cue (Trigger)'}
                      </label>
                      <input
                        value={isAr ? formData.cueAr : formData.cueEn}
                        onChange={e => setFormData(f => isAr ? ({ ...f, cueAr: e.target.value }) : ({ ...f, cueEn: e.target.value }))}
                        className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                        placeholder={isAr ? 'مثال: بعد الاستيقاظ مباشرة' : 'e.g., Right after waking up'}
                        dir={isAr ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1 flex items-center gap-1.5">
                        <Repeat className="h-3 w-3 text-blue-500" />
                        {isAr ? 'العمل الروتيني' : 'Routine (Action)'}
                      </label>
                      <input
                        value={isAr ? formData.routineAr : formData.routineEn}
                        onChange={e => setFormData(f => isAr ? ({ ...f, routineAr: e.target.value }) : ({ ...f, routineEn: e.target.value }))}
                        className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                        placeholder={isAr ? 'مثال: تمارين لمدة 30 دقيقة' : 'e.g., 30 min workout'}
                        dir={isAr ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1 flex items-center gap-1.5">
                        <Gift className="h-3 w-3 text-emerald-500" />
                        {isAr ? 'المكافأة' : 'Reward'}
                      </label>
                      <input
                        value={isAr ? formData.rewardAr : formData.rewardEn}
                        onChange={e => setFormData(f => isAr ? ({ ...f, rewardAr: e.target.value }) : ({ ...f, rewardEn: e.target.value }))}
                        className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                        placeholder={isAr ? 'مثال: سموذي صحي' : 'e.g., Healthy smoothie'}
                        dir={isAr ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="sticky bottom-0 bg-[var(--color-background)] flex items-center justify-end gap-3 p-5 border-t border-[var(--foreground)]/[0.1]">
                {editingHabit && (
                  <button
                    onClick={() => {
                      if (window.confirm(isAr ? 'هل تريد أرشفة هذه العادة؟ يمكنك استعادتها لاحقاً' : 'Archive this habit? You can restore it later.')) {
                        store.deleteHabit(editingHabit.id); setShowForm(false); resetForm();
                      }
                    }}
                    className="me-auto text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Archive className="h-3.5 w-3.5" /> {isAr ? 'أرشفة' : 'Archive'}
                  </button>
                )}
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05]"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  className="app-btn-primary px-5 py-2 rounded-xl text-sm font-medium text-white"
                >
                  {editingHabit ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailHabit && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailHabit(null)}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/60"
              style={{ display: fullCalendarHabit ? 'none' : undefined }}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 sm:inset-x-2 md:inset-x-4 top-0 sm:top-[2%] md:top-[3%] z-[var(--z-modal)] md:w-[min(960px,calc(100vw-2rem))] lg:w-[1100px] md:inset-x-0 md:mx-auto max-h-[100vh] sm:max-h-[96vh] md:max-h-[95vh] overflow-y-auto rounded-none sm:rounded-2xl md:rounded-3xl bg-[var(--color-background)] border-0 sm:border border-[var(--foreground)]/[0.18] shadow-2xl"
              style={{ display: fullCalendarHabit ? 'none' : undefined }}
            >
              <HabitDetail habit={detailHabit} onClose={() => setDetailHabit(null)} onEdit={() => { setDetailHabit(null); openEdit(detailHabit); }} onViewFull={() => { setFullCalendarHabit(detailHabit); }} allHabits={store.habits.filter(h => !h.archived && (filterCategory === 'all' || h.category === filterCategory))} onNavigate={(h) => setDetailHabit(h)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Full Calendar Modal */}
      <AnimatePresence>
        {fullCalendarHabit && (
          <HabitFullCalendar habit={fullCalendarHabit} isAr={isAr} store={store} onClose={() => setFullCalendarHabit(null)} onBack={detailHabit ? () => setFullCalendarHabit(null) : undefined} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Full Calendar for a single habit ─── */
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
      const dayLogs = !isFuture && !beforeCreated ? store.habitLogs.filter(l => l.habitId === habit.id && l.date === dateStr && l.completed) : [];
      const log = dayLogs.length > 0 ? dayLogs[0] : undefined;
      days.push({
        date: dateStr, day: d, inMonth: true, isFuture, beforeCreated,
        completed: dayLogs.length > 0,
        sessionCount: dayLogs.length,
        color: !beforeCreated ? getCompletionColor(habit, log, dateStr) : 'none',
      });
    }
    return days;
  };

  // Stats
  const totalDone = store.habitLogs.filter(l => l.habitId === habit.id && l.completed).length;
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
                        <div key={di} title={day.sessionCount > 1 ? `${day.date} (${day.sessionCount}x)` : day.date}
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

/* ─── Flip Card — redesigned with clear hierarchy ─── */
function HabitFlipCard({ habit, index, isAr, store, today, onEdit, onArchive, onDelete, onDetail, onViewFull, onViewPage, expanded = false, rowExpanded = false, onToggleRow }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: () => void; onArchive: () => void; onDelete: () => void; onDetail: () => void; onViewFull?: () => void; onViewPage?: string; expanded?: boolean;
  rowExpanded?: boolean; onToggleRow?: () => void;
}) {
  const toast = useToast();
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(habit.notes || '');
  const minimized = !expanded;
  const hc = resolveHabitColor(habit.color); // resolved color (handles 'theme')
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
  const hasDuration = !!habit.expectedDuration;
  const streak = store.getHabitStreak(habit.id);
  const stats = store.getHabitStats(habit.id);
  const timeStats = useMemo(() => getHabitTimeStats(habit.id, store.habitLogs, habit.expectedDuration), [habit.id, store.habitLogs, habit.expectedDuration]);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const catLabel = getCategoryLabel(habit.category, isAr, store.deletedCategories, habit.archived);
  const freqLabel = isAr ? FREQ_LABELS[habit.frequency]?.ar : FREQ_LABELS[habit.frequency]?.en;
  const daysSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / 86400000));
  const placeLabel = isAr ? habit.placeAr : habit.placeEn;
  const totalMinutes = Math.floor(timeStats.secs.total / 60);
  const lastCompletedDate = streak.lastCompletedDate;
  // Build streak challenge tiers
  const streakTiers = useMemo(() => {
    const tiers: { goal: number; reward: string; done: boolean; progress: number; icon: string }[] = [];
    if (habit.streakGoal && habit.streakGoal > 0) tiers.push({ goal: habit.streakGoal, reward: (isAr ? habit.streakRewardAr : habit.streakRewardEn) || '', done: streak.current >= habit.streakGoal, progress: Math.min(1, streak.current / habit.streakGoal), icon: '🥉' });
    if (habit.streakGoal2 && habit.streakGoal2 > 0) tiers.push({ goal: habit.streakGoal2, reward: (isAr ? habit.streakRewardAr2 : habit.streakRewardEn2) || '', done: streak.current >= habit.streakGoal2, progress: Math.min(1, streak.current / habit.streakGoal2), icon: '🥈' });
    if (habit.streakGoal3 && habit.streakGoal3 > 0) tiers.push({ goal: habit.streakGoal3, reward: (isAr ? habit.streakRewardAr3 : habit.streakRewardEn3) || '', done: streak.current >= habit.streakGoal3, progress: Math.min(1, streak.current / habit.streakGoal3), icon: '🥇' });
    return tiers.sort((a, b) => a.goal - b.goal);
  }, [habit, streak.current, isAr]);
  const hasStreakChallenge = streakTiers.length > 0;

  const weekDays = useMemo(() => {
    const days: { date: string; done: boolean; color: CompletionColor }[] = [];
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...6=Sat
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // go back to Monday
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = formatLocalDate(d);
      const log = store.habitLogs.find(l => l.habitId === habit.id && l.date === ds && l.completed);
      const color = getCompletionColor(habit, log, ds);
      days.push({ date: ds, done: !!log, color });
    }
    return days;
  }, [habit.id, habit.windowStart, habit.windowEnd, store.habitLogs]);
  const completedCountWeek = weekDays.filter(d => d.done).length;

  const todayLog = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);
  const isCount = habit.trackingType === 'count';
  const countTarget = isCount ? (habit.targetValue ?? 1) : 1;
  const countUnit = isCount ? (habit.targetUnit ?? 'times') : 'times';
  // Sum all today's logged values for this count habit
  const todayCountValue = isCount
    ? store.habitLogs.filter(l => l.habitId === habit.id && l.date === today).reduce((s, l) => s + (l.value ?? (l.completed ? 1 : 0)), 0)
    : 0;
  const countProgress = isCount && countTarget > 0 ? Math.min(1, todayCountValue / countTarget) : 0;
  const goalLabel = hasDuration
    ? `${habit.expectedDuration}${isAr ? ' دقيقة' : ' min'}`
    : isCount
      ? `${habit.targetValue ?? 1} ${habit.targetUnit ?? 'times'}`
      : (isAr ? 'مرة يوميًا' : 'daily');

  // Strict time window enforcement
  const inWindow = isWithinWindow(habit);
  const windowExpired = isWindowPassed(habit);
  const strictLocked = habit.strictWindow && habit.windowStart && habit.windowEnd && windowExpired && !done;
  const strictNotYet = habit.strictWindow && habit.windowStart && habit.windowEnd && !inWindow && !windowExpired && !done;
  const notScheduledToday = !isHabitScheduledForDate(habit, today);
  const isDisabled = !!strictLocked || !!strictNotYet || notScheduledToday;

  // Daily repetitions tracking
  const maxReps = habit.maxDailyReps || Infinity;
  const todayCompletedReps = store.habitLogs.filter(l => l.habitId === habit.id && l.date === today && l.completed).length;
  const repsRemaining = maxReps === Infinity ? Infinity : Math.max(0, maxReps - todayCompletedReps);
  const allRepsDone = maxReps !== Infinity && todayCompletedReps >= maxReps;
  const hasMultipleReps = habit.maxDailyReps !== undefined && habit.maxDailyReps > 1;

  const handleCheck = () => {
    if (hasDuration || habit.archived || isDisabled) return;
    if (isCount) return;
    // Boolean habits can only be checked within their completion window
    if (!hasDuration && !isCount && !done && isBooleanOutsideWindow(habit)) return;
    // For single-rep habits: toggle done
    if (!hasMultipleReps) {
      if (done && todayLog) { store.deleteHabitLog(todayLog.id); return; }
    }
    // Don't allow if all reps done (applies to any habit with maxDailyReps)
    if (allRepsDone) return;
    store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: true });
  };

  const handleCountIncrement = (amount: number) => {
    if (isDisabled) return;
    const newValue = Math.max(0, todayCountValue + amount);
    const isCompleted = newValue >= countTarget;
    store.logHabit({
      habitId: habit.id, date: today,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      note: '', reminderUsed: false, perceivedDifficulty: 'medium',
      completed: isCompleted, value: newValue, source: 'manual',
    });
  };

  // Smart CTA label
  const ctaLabel = done
    ? (isAr ? 'مكتملة ✓' : 'Done ✓')
    : hasDuration
      ? (isAr ? 'ابدأ المؤقت' : 'Start Timer')
      : isCount
        ? (isAr ? 'سجّل التقدم' : 'Log Progress')
        : (isAr ? 'تم اليوم' : 'Mark Done');

  return (
    <motion.div
      variants={fadeUp} custom={index + 3}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="habit-flip-wrap h-full"
    >
        <div
          className={cn('rounded-2xl overflow-visible flex flex-col group/card habit-card-animated-border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] h-full')}
          style={{
            '--habit-color': hc,
            '--habit-border-color': allRepsDone ? '#22c55e' : (done && !hasDuration) ? '#22c55e' : (done && hasDuration && !allRepsDone) ? '#3b82f6' : isDisabled ? '#ef4444' : hc,
            background: minimized ? 'var(--color-background)' : `linear-gradient(180deg, ${hc}06 0%, var(--color-background) 120px)`,
            boxShadow: `0 2px 16px ${hc}0c, 0 1px 3px rgba(0,0,0,0.04)`,
            maxHeight: minimized ? '220px' : undefined,
          } as React.CSSProperties}
        >
          {/* Color accent bar */}
          <div className="w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-t-2xl" style={{ height: minimized ? 3 : 5, background: `linear-gradient(90deg, ${hc}, ${hc}aa)`, boxShadow: `0 2px 8px ${hc}30` }} />

          {/* Optional custom image — only when expanded */}
          {!minimized && habit.image && (
            <div className="relative h-28 w-full overflow-hidden">
              <img src={habit.image} alt="" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent" />
            </div>
          )}

          <div className={cn('px-4 pb-3 pt-3 flex-1 flex flex-col rounded-b-2xl')}>
            {/* ─ Row 1: Order # + Name + quick actions ─ */}
            <div className="flex items-start justify-between gap-2 mb-2 h-[58px] overflow-hidden">
              <div className="min-w-0 flex-1 flex items-start gap-2.5">
                {/* Order number badge */}
                <div className="hc-order h-7 w-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm cursor-default"
                  style={{ background: `${hc}20`, color: hc, border: `1.5px solid ${hc}30` }}>
                  {habit.order || '-'}
                </div>
                <div className="min-w-0">
                  <h3 className={cn('text-[15px] font-extrabold leading-snug tracking-tight', done && 'line-through opacity-40')}>{name}</h3>
                  <span className="text-[10px] font-bold mt-1 inline-block px-1.5 py-0.5 rounded-md" style={{ background: `${hc}10`, color: hc }}>{catLabel}</span>
                </div>
              </div>
              {/* Quick actions */}
              <div className="flex items-center gap-1 shrink-0">
                {onToggleRow && (
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onToggleRow(); }}
                    className={cn('h-8 w-8 rounded-xl flex items-center justify-center border border-transparent transition-all',
                      rowExpanded ? 'text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/20' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/20')}
                    title={rowExpanded ? (isAr ? 'طي الصف' : 'Collapse Row') : (isAr ? 'توسيع الصف' : 'Expand Row')}>
                    <ChevronsUpDown className="h-4 w-4" />
                  </motion.button>
                )}
                {!minimized && (
                  <>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onEdit}
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--foreground)] hover:text-blue-600 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
                      title={isAr ? 'تعديل' : 'Edit'}>
                      <Edit3 className="h-4 w-4" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onArchive}
                      className={cn('h-8 w-8 rounded-xl flex items-center justify-center border border-transparent transition-all',
                        habit.archived ? 'text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/20' : 'text-[var(--foreground)] hover:text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/20')}
                      title={habit.archived ? (isAr ? 'استعادة' : 'Restore') : (isAr ? 'أرشفة' : 'Archive')}>
                      {habit.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Minimized: status + timer + details button */}
            {minimized && (
              <div className="flex flex-col gap-2 py-1">
                <div className="flex items-center justify-between">
                  {allRepsDone ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {isAr ? 'مكتملة' : 'Done'}</span>
                  ) : done && hasDuration && !allRepsDone ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600"><CheckCircle2 className="h-4 w-4" /> {todayCompletedReps}x {isAr ? 'مكتمل' : 'done'}</span>
                  ) : done ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {isAr ? 'مكتملة' : 'Done'}</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]"><Circle className="h-4 w-4" /> {isAr ? 'لم تكتمل' : 'Pending'}</span>
                  )}
                  {streak.current > 0 && <span className="flex items-center gap-1 text-xs font-bold text-orange-500 px-1.5 py-0.5 rounded-md bg-orange-500/8"><Flame className="h-3 w-3" /> {streak.current}</span>}
                </div>
                {!habit.archived && (
                  <div onClick={e => e.stopPropagation()}>
                    <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done || allRepsDone} size="xs" disabled={isDisabled} />
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDetail(); }}
                  className="group/detbtn w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 ease-out cursor-pointer"
                  style={{ background: `${hc}10`, color: hc, border: `1.5px solid ${hc}20` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = hc; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = hc; e.currentTarget.style.boxShadow = `0 4px 16px ${hc}40`; e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}10`; e.currentTarget.style.color = hc; e.currentTarget.style.borderColor = `${hc}20`; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {isAr ? 'التفاصيل' : 'Details'}
                </button>
              </div>
            )}

            {!minimized && <>
            {/* ─ Row 2: Meta badges ─ */}
            <div className="relative mb-2 h-[76px] group/badges">
              {/* Normal — clipped */}
              <div className="flex items-center gap-1.5 flex-wrap h-full overflow-hidden content-start transition-opacity duration-300 ease-out group-hover/badges:opacity-0">
                <span className="hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default" style={{ background: `${hc}15`, color: hc, border: `1px solid ${hc}25` }}>
                  <Folder className="h-3 w-3" /> {catLabel}
                </span>
                <span className={cn('hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default',
                  habit.type === 'positive' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
                  {habit.type === 'positive' ? <Zap className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span className="opacity-50">{isAr ? 'النوع:' : 'Type:'}</span> {habit.type === 'positive' ? (isAr ? 'بناء' : 'Build') : (isAr ? 'تجنب' : 'Break')}
                </span>
                <span className={cn('hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default',
                  habit.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' : habit.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-500')}>
                  <BarChart3 className="h-3 w-3" />
                  <span className="opacity-50">{isAr ? 'الصعوبة:' : 'Diff:'}</span> {isAr ? (habit.difficulty === 'hard' ? 'صعبة' : habit.difficulty === 'medium' ? 'متوسطة' : 'سهلة') : habit.difficulty}
                </span>
                <span className={cn('hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default',
                  habit.priority === 'high' ? 'bg-red-500/10 text-red-500' : habit.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-sky-500/10 text-sky-500')}>
                  <ArrowUpDown className="h-3 w-3" />
                  <span className="opacity-50">{isAr ? 'الأولوية:' : 'Pri:'}</span> {isAr ? (habit.priority === 'high' ? 'عالية' : habit.priority === 'medium' ? 'متوسطة' : 'منخفضة') : habit.priority}
                </span>
                <span className="hc-badge text-[9px] font-bold px-2 py-1 rounded-md bg-[var(--foreground)]/[0.05] cursor-default text-[var(--foreground)] flex items-center gap-1">
                  <Target className="h-3 w-3" /> <span className="opacity-50">{isAr ? 'الهدف:' : 'Goal:'}</span> {goalLabel}
                </span>
                {habit.expectedDuration && (
                  <span className="hc-badge text-[9px] font-bold px-2 py-1 rounded-md bg-purple-500/10 cursor-default text-purple-600 flex items-center gap-1">
                    <Timer className="h-3 w-3" /> <span className="opacity-50">{isAr ? 'المدة:' : 'Dur:'}</span> {habit.expectedDuration} {isAr ? 'دقيقة' : 'min'}
                  </span>
                )}
                {habit.preferredTime && (
                  <span className="hc-badge text-[9px] font-bold px-2 py-1 rounded-md bg-sky-500/10 cursor-default text-sky-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> <span className="opacity-50">{isAr ? 'المفضل:' : 'Preferred:'}</span> {to12h(habit.preferredTime!)}
                  </span>
                )}
                {habit.windowStart && habit.windowEnd && (
                  <span className={cn('hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default',
                    habit.strictWindow ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-600')}>
                    <Target className="h-3 w-3" />
                    <span className="opacity-50">{habit.strictWindow ? (isAr ? 'إجباري:' : 'Strict:') : (isAr ? 'نافذة:' : 'Window:')}</span>
                    {to12h(habit.windowStart!)}–{to12h(habit.windowEnd!)}
                    {habit.strictWindow && <span className="opacity-60">({isAr ? 'بدونه لاغية' : 'void if missed'})</span>}
                  </span>
                )}
              </div>
              {/* Expanded on hover */}
              <div className="absolute left-[-20px] right-[-20px] top-[-14px] z-30 opacity-0 scale-90 pointer-events-none transition-all duration-300 ease-out group-hover/badges:opacity-100 group-hover/badges:scale-110 group-hover/badges:pointer-events-auto">
                <div className="flex items-center gap-1.5 flex-wrap content-start rounded-2xl p-4 shadow-2xl border border-[var(--foreground)]/10" style={{ background: 'var(--color-background)' }}>
                  <span className="hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default" style={{ background: `${hc}15`, color: hc, border: `1px solid ${hc}25` }}>
                    <Folder className="h-3 w-3" /> {catLabel}
                  </span>
                  <span className={cn('hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default',
                    habit.type === 'positive' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
                    {habit.type === 'positive' ? <Zap className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span className="opacity-50">{isAr ? 'النوع:' : 'Type:'}</span> {habit.type === 'positive' ? (isAr ? 'بناء' : 'Build') : (isAr ? 'تجنب' : 'Break')}
                  </span>
                  <span className={cn('hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default',
                    habit.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' : habit.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-500')}>
                    <BarChart3 className="h-3 w-3" />
                    <span className="opacity-50">{isAr ? 'الصعوبة:' : 'Diff:'}</span> {isAr ? (habit.difficulty === 'hard' ? 'صعبة' : habit.difficulty === 'medium' ? 'متوسطة' : 'سهلة') : habit.difficulty}
                  </span>
                  <span className={cn('hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default',
                    habit.priority === 'high' ? 'bg-red-500/10 text-red-500' : habit.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-sky-500/10 text-sky-500')}>
                    <ArrowUpDown className="h-3 w-3" />
                    <span className="opacity-50">{isAr ? 'الأولوية:' : 'Pri:'}</span> {isAr ? (habit.priority === 'high' ? 'عالية' : habit.priority === 'medium' ? 'متوسطة' : 'منخفضة') : habit.priority}
                  </span>
                  <span className="hc-badge text-[9px] font-bold px-2 py-1 rounded-md bg-[var(--foreground)]/[0.05] cursor-default text-[var(--foreground)] flex items-center gap-1">
                    <Target className="h-3 w-3" /> <span className="opacity-50">{isAr ? 'الهدف:' : 'Goal:'}</span> {goalLabel}
                  </span>
                  {habit.expectedDuration && (
                    <span className="hc-badge text-[9px] font-bold px-2 py-1 rounded-md bg-purple-500/10 cursor-default text-purple-600 flex items-center gap-1">
                      <Timer className="h-3 w-3" /> <span className="opacity-50">{isAr ? 'المدة:' : 'Dur:'}</span> {habit.expectedDuration} {isAr ? 'دقيقة' : 'min'}
                    </span>
                  )}
                  {habit.preferredTime && (
                    <span className="hc-badge text-[9px] font-bold px-2 py-1 rounded-md bg-sky-500/10 cursor-default text-sky-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> <span className="opacity-50">{isAr ? 'المفضل:' : 'Preferred:'}</span> {to12h(habit.preferredTime!)}
                    </span>
                  )}
                  {habit.windowStart && habit.windowEnd && (
                    <span className={cn('hc-badge text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 cursor-default',
                      habit.strictWindow ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-600')}>
                      <Target className="h-3 w-3" />
                      <span className="opacity-50">{habit.strictWindow ? (isAr ? 'إجباري:' : 'Strict:') : (isAr ? 'نافذة:' : 'Window:')}</span>
                      {to12h(habit.windowStart!)}–{to12h(habit.windowEnd!)}
                      {habit.strictWindow && <span className="opacity-60">({isAr ? 'بدونه لاغية' : 'void if missed'})</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ─ Row 3: Today's status banner ─ */}
            <div className={cn('hc-banner flex items-center gap-2 rounded-xl px-3 h-[40px] mb-2 text-xs font-bold cursor-default relative transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:z-30 hover:rounded-2xl')}
              style={strictLocked
                ? { background: '#ef444415', color: '#ef4444', border: '1px solid #ef444425' }
                : strictNotYet
                  ? { background: '#f59e0b12', color: '#f59e0b', border: '1px solid #f59e0b20' }
                  : allRepsDone
                    ? { background: '#22c55e15', color: '#16a34a' }
                    : done && hasDuration && !allRepsDone
                      ? { background: '#3b82f612', color: '#3b82f6', border: '1px solid #3b82f620' }
                      : done
                        ? { background: '#22c55e15', color: '#16a34a' }
                        : hasMultipleReps && todayCompletedReps > 0
                          ? { background: `${hc}12`, color: hc, border: `1px solid ${hc}20` }
                          : streak.current > 0
                            ? { background: `${hc}12`, color: hc, border: `1px solid ${hc}20` }
                            : { background: `${hc}08`, color: hc }}>
              {strictLocked ? (
                <><X className="h-4 w-4" /> {isAr ? `فات الوقت (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)}) — فائتة` : `Window passed (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)}) — Missed`}</>
              ) : strictNotYet ? (
                <><Clock className="h-4 w-4" /> {isAr ? `متاحة من ${to12h(habit.windowStart!)} إلى ${to12h(habit.windowEnd!)}` : `Available ${to12h(habit.windowStart!)} – ${to12h(habit.windowEnd!)}`}</>
              ) : allRepsDone ? (
                <><CheckCircle2 className="h-4 w-4" /> {hasMultipleReps ? `${todayCompletedReps}/${maxReps} ${isAr ? 'مكتمل ✓' : 'done ✓'}` : (isAr ? 'مكتملة اليوم ✓' : 'Completed today ✓')}</>
              ) : done && hasDuration && !allRepsDone ? (
                <><CheckCircle2 className="h-4 w-4" /> {todayCompletedReps}x {isAr ? 'مكتمل' : 'done'} ({formatSecs(timeStats.secs.today)}) — {isAr ? 'ابدأ جلسة أخرى' : 'start another session'}</>
              ) : hasMultipleReps && todayCompletedReps > 0 ? (
                <><Target className="h-4 w-4" /> {todayCompletedReps}/{maxReps} — {repsRemaining} {isAr ? 'متبقية' : 'remaining'}</>
              ) : streak.current > 0 ? (
                <><Flame className="h-4 w-4" /> {streak.current} {isAr ? 'يوم متواصل — حافظ عليها!' : 'day streak — keep going!'}</>
              ) : (
                <><Target className="h-4 w-4" /> {isAr ? 'لم تكتمل بعد — ابدأ الآن' : 'Not done yet — start now'}</>
              )}
            </div>

            {/* ─ Row 4a: Timer / Check-in display ─ */}
            <div className="mb-2 h-[140px]" onClick={e => e.stopPropagation()}>
              {habit.archived ? (
                <motion.button whileTap={{ scale: 0.97 }} onClick={onArchive}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
                  <RotateCcw className="h-4 w-4" /> {isAr ? 'استعادة' : 'Restore'}
                </motion.button>
              ) : !hasDuration && !isCount ? (
                <div className="hc-timer rounded-xl overflow-hidden relative h-full flex flex-col"
                  style={{ background: done ? 'linear-gradient(135deg, #22c55e08, #22c55e04)' : `linear-gradient(135deg, ${hc}06, transparent)`, border: `1.5px solid ${done ? '#22c55e25' : `${hc}15`}` }}>
                  <div className="relative p-3.5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: done ? '#22c55e' : `${hc}60`, boxShadow: done ? '0 0 6px #22c55e' : undefined }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]">
                          {done ? (isAr ? 'مكتمل' : 'Completed') : !isBooleanOutsideWindow(habit) ? (isAr ? 'تسجيل يومي' : 'Daily Check-in') : (isAr ? `متاح ${formatCompletionWindow(habit, true)}` : `Available ${formatCompletionWindow(habit, false)}`)}
                        </span>
                      </div>
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: done ? '#22c55e' : `${hc}50` }} />
                    </div>
                    <div className={cn('text-2xl font-mono font-black tracking-tight text-center my-auto', !done && 'opacity-40')} style={{ color: done ? '#22c55e' : hc }}>
                      {done ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <span className="text-lg">{isAr ? 'تم ✓' : 'Done ✓'}</span>
                        </div>
                      ) : (isAr ? 'هل أنجزتها؟' : 'Did you do it?')}
                    </div>
                    {todayLog && (
                      <div className="text-center mt-auto">
                        <span className="text-[10px] font-semibold text-[var(--foreground)]">
                          {isAr ? `سُجّلت ${todayLog.time}` : `Logged at ${todayLog.time}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="sm" disabled={isDisabled} />
              )}
            </div>

            {/* ─ Row 4b: Mark Done / Check-in button OR Checklist tasks ─ */}
            {/* Checklist tasks for habits with checklistItems */}
            {!habit.archived && (habit.checklistItems ?? []).length > 0 && (() => {
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
                <div className="mb-2" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--foreground)]/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(clCount / clItems.length) * 100}%`, background: clAllDone ? '#10b981' : hc }} />
                    </div>
                    <span className="text-[10px] font-black tabular-nums" style={{ color: clAllDone ? '#10b981' : hc }}>
                      {clCount}/{clItems.length}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {clItems.map(item => (
                      <button key={item.id} onClick={() => handleClToggle(item.id)}
                        className="flex items-center gap-2 w-full text-start py-1.5 px-2 rounded-lg hover:bg-[var(--foreground)]/[0.03] transition-colors">
                        <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          clState[item.id] ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--foreground)]/20')}>
                          {clState[item.id] && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={cn('text-xs font-semibold', clState[item.id] && 'line-through text-[var(--foreground)]/50')}>
                          {isAr ? (item.titleAr || item.titleEn) : (item.titleEn || item.titleAr)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {clAllDone && (
                    <div className="mt-1.5 flex items-center justify-center gap-2 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-xs font-black">{isAr ? 'مكتملة ✓' : 'All tasks done ✓'}</span>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* Mark Done button — only for habits WITHOUT checklist items */}
            {(habit.checklistItems ?? []).length === 0 && (
            <div className="mb-2 h-[40px]" onClick={e => e.stopPropagation()}>
              {!habit.archived && (() => {
                const isBooleanWindowBlocked = !hasDuration && !isCount && !done && isBooleanOutsideWindow(habit);
                const windowLabel = formatCompletionWindow(habit, isAr);
                const markDoneDisabled = isDisabled || (hasDuration && !done && !allRepsDone) || isBooleanWindowBlocked;
                return allRepsDone ? (
                  <div className="w-full h-full flex items-center justify-center gap-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 cursor-pointer hover:bg-emerald-500/15 transition-all"
                    onClick={() => toast.notifySuccess(
                      isAr ? 'مكتملة بالفعل ✓' : 'Already completed ✓',
                      hasMultipleReps
                        ? (isAr ? `أكملت ${todayCompletedReps} من ${maxReps} — الحد الأقصى لهذا اليوم` : `You completed ${todayCompletedReps}/${maxReps} — max for today reached`)
                        : (isAr ? 'هذه العادة تُنجز مرة واحدة يوميًا فقط. عُد غدًا!' : 'This habit can only be done once per day. Come back tomorrow!')
                    )}>
                    <CheckCircle2 className="h-4 w-4" />
                    {hasMultipleReps ? `${todayCompletedReps}/${maxReps} ${isAr ? 'مكتمل' : 'done'}` : (isAr ? 'مكتملة ✓' : 'Done ✓')}
                  </div>
                ) : (
                  <motion.button whileHover={!markDoneDisabled ? { scale: 1.02 } : {}} whileTap={!markDoneDisabled ? { scale: 0.97 } : {}}
                    onClick={!markDoneDisabled ? handleCheck : () => {
                      if (notScheduledToday) toast.notifyInfo(isAr ? 'غير مجدولة اليوم' : 'Not scheduled today', isAr ? 'هذه العادة غير مجدولة لهذا اليوم' : 'This habit is not scheduled for today');
                      else if (isBooleanWindowBlocked) toast.notifyInfo(isAr ? `متاح ${windowLabel}` : `Available ${windowLabel}`, isAr ? `يمكنك تسجيل هذه العادة خلال الفترة ${windowLabel}` : `You can check in during ${windowLabel}`);
                      else if (strictLocked) toast.notifyWarning(isAr ? 'فات الوقت' : 'Window passed', isAr ? `انتهى وقت النافذة (${habit.windowStart}–${habit.windowEnd})` : `Time window (${habit.windowStart}–${habit.windowEnd}) has passed`);
                      else if (strictNotYet) toast.notifyInfo(isAr ? 'لم يحن الوقت بعد' : 'Not yet', isAr ? `النافذة تبدأ الساعة ${habit.windowStart}` : `Window starts at ${habit.windowStart}`);
                      else if (hasDuration && !done) toast.notifyInfo(isAr ? 'استخدم المؤقت' : 'Use the timer', isAr ? 'هذه العادة تحتاج مؤقت لإكمالها' : 'This habit requires the timer to complete');
                    }}
                    className={cn('w-full h-full flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      markDoneDisabled ? 'opacity-40 border border-[var(--foreground)]/[0.18] text-[var(--foreground)]' : 'text-white shadow-sm hover:shadow-md')}
                    style={!markDoneDisabled ? { background: `linear-gradient(135deg, ${hc}, ${hc}cc)` } : undefined}>
                    <CheckCircle2 className="h-4 w-4" />
                    {hasMultipleReps
                      ? `${isAr ? 'تسجيل' : 'Log'} (${todayCompletedReps + 1}/${maxReps})`
                      : !hasDuration && !isCount
                        ? (isAr ? 'نعم، أنجزتها' : 'Yes, I did it')
                        : (isAr ? 'تم اليوم' : 'Mark Done')}
                  </motion.button>
                );
              })()}
            </div>
            )}

            {/* ─ Row 4c: Count controls (always visible, disabled for non-count habits) ─ */}
            <div className="mb-2 h-[40px]" onClick={e => e.stopPropagation()}>
              {!habit.archived && (() => {
                const countDisabled = !isCount || isDisabled;
                return (
                  <div className={cn('flex items-center gap-1.5 h-full', countDisabled && 'opacity-20')}
                    onClick={countDisabled ? () => {
                      if (!isCount) toast.notifyInfo(isAr ? 'ليست عادة عددية' : 'Not a count habit', isAr ? 'هذه العادة لا تدعم التتبع العددي' : 'This habit does not use count tracking');
                      else if (strictLocked) toast.notifyWarning(isAr ? 'فات الوقت' : 'Window passed', isAr ? `انتهى وقت النافذة (${habit.windowStart}–${habit.windowEnd})` : `Time window (${habit.windowStart}–${habit.windowEnd}) has passed`);
                      else if (strictNotYet) toast.notifyInfo(isAr ? 'لم يحن الوقت بعد' : 'Not yet', isAr ? `النافذة تبدأ الساعة ${habit.windowStart}` : `Window starts at ${habit.windowStart}`);
                    } : undefined}>
                    <button onClick={() => !countDisabled && handleCountIncrement(-1)} disabled={countDisabled || todayCountValue <= 0}
                      className="hc-count-btn h-9 w-9 rounded-xl flex items-center justify-center font-bold border border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05] disabled:opacity-30">
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-base font-black" style={{ color: !countDisabled && countProgress >= 1 ? '#22c55e' : countDisabled ? 'var(--foreground)' : hc }}>
                        {isCount ? todayCountValue : 0}
                      </span>
                      <span className="text-xs font-semibold text-[var(--foreground)]"> / {isCount ? countTarget : 1} {isCount ? countUnit : (isAr ? 'مرة' : 'times')}</span>
                    </div>
                    <button onClick={() => !countDisabled && handleCountIncrement(1)} disabled={countDisabled}
                      className="hc-count-btn h-9 w-9 rounded-xl flex items-center justify-center font-bold border border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05]"
                      style={!countDisabled && countProgress < 1 ? { background: `${hc}15`, color: hc } : !countDisabled ? { background: '#22c55e15', color: '#22c55e' } : undefined}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* ─ Row 5: Streak Challenges (fixed height with scroll) ─ */}
            <div className="relative mb-2 mt-1 pt-2 h-[160px] group/streak" style={{ borderTop: `1px dashed ${hc}15` }}>
              {/* Normal — clipped */}
              <div className="h-full overflow-hidden transition-opacity duration-300 ease-out group-hover/streak:opacity-0">
                {!hasStreakChallenge ? (
                  <div className="hc-empty rounded-2xl border border-dashed border-[var(--foreground)]/[0.18] py-5 flex flex-col items-center justify-center gap-1.5 cursor-default">
                    <Trophy className="h-4 w-4 text-[var(--foreground)]" />
                    <span className="text-[10px] font-bold text-[var(--foreground)]">{isAr ? 'لا توجد تحديات' : 'No challenges'}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {streakTiers.map((t, i) => {
                      const pct = Math.round(t.progress * 100);
                      const filled = Math.min(t.goal, streak.current);
                      const tierColor = t.done ? '#d97706' : hc;
                      return (
                        <div key={i} className="hc-tier rounded-xl px-3.5 py-3 cursor-default"
                          style={{ background: t.done ? '#f59e0b08' : `${hc}05`, border: `1px solid ${t.done ? '#f59e0b18' : `${hc}10`}` }}>
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-base leading-none">{t.icon}</span>
                            <span className="text-xs font-black" style={{ color: tierColor }}>
                              {filled}/{t.goal} {isAr ? 'يوم' : 'days'}
                            </span>
                            {t.done && <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />}
                            {t.reward && (
                              <span className={cn('text-[9px] font-bold truncate max-w-[100px] px-2 py-0.5 rounded-md ms-auto',
                                t.done ? 'bg-amber-500/10 text-amber-600' : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]')}>
                                {t.reward}
                              </span>
                            )}
                            <span className={cn('text-xs font-black', !t.reward && 'ms-auto')} style={{ color: tierColor }}>
                              {pct}%
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Array.from({ length: t.goal }).map((_, di) => (
                              <div key={di} className="h-[7px] w-[7px] rounded-full"
                                style={{ background: di < filled ? tierColor : `${hc}15` }} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Expanded on hover */}
              <div className="absolute left-[-20px] right-[-20px] top-[-14px] z-30 opacity-0 scale-90 pointer-events-none transition-all duration-300 ease-out group-hover/streak:opacity-100 group-hover/streak:scale-110 group-hover/streak:pointer-events-auto">
                <div className="rounded-2xl p-4 shadow-2xl border border-[var(--foreground)]/10 max-h-[300px] overflow-y-auto" style={{ background: 'var(--color-background)' }}>
                  {!hasStreakChallenge ? (
                    <div className="hc-empty rounded-2xl border border-dashed border-[var(--foreground)]/[0.18] py-5 flex flex-col items-center justify-center gap-1.5 cursor-default">
                      <Trophy className="h-4 w-4 text-[var(--foreground)]" />
                      <span className="text-[10px] font-bold text-[var(--foreground)]">{isAr ? 'لا توجد تحديات' : 'No challenges'}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {streakTiers.map((t, i) => {
                        const pct = Math.round(t.progress * 100);
                        const filled = Math.min(t.goal, streak.current);
                        const tierColor = t.done ? '#d97706' : hc;
                        return (
                          <div key={i} className="hc-tier rounded-xl px-3.5 py-3 cursor-default"
                            style={{ background: t.done ? '#f59e0b08' : `${hc}05`, border: `1px solid ${t.done ? '#f59e0b18' : `${hc}10`}` }}>
                            <div className="flex items-center gap-2 mb-2.5">
                              <span className="text-base leading-none">{t.icon}</span>
                              <span className="text-xs font-black" style={{ color: tierColor }}>
                                {filled}/{t.goal} {isAr ? 'يوم' : 'days'}
                              </span>
                              {t.done && <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />}
                              {t.reward && (
                                <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-md ms-auto',
                                  t.done ? 'bg-amber-500/10 text-amber-600' : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]')}>
                                  {t.reward}
                                </span>
                              )}
                              <span className={cn('text-xs font-black', !t.reward && 'ms-auto')} style={{ color: tierColor }}>
                                {pct}%
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from({ length: t.goal }).map((_, di) => (
                                <div key={di} className="h-[7px] w-[7px] rounded-full"
                                  style={{ background: di < filled ? tierColor : `${hc}15` }} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─ Row 5b: Habit Loop (always visible) ─ */}
            <div className="relative mb-2 h-[60px] group/loop">
              {/* Normal view */}
              <div className="flex items-center gap-1 h-full overflow-hidden transition-opacity duration-300 ease-out group-hover/loop:opacity-0">
                <div className="hc-loop flex-1 min-w-0 rounded-lg bg-amber-500/8 px-2 py-1.5 text-center cursor-default">
                  <Lightbulb className="h-3 w-3 text-amber-500 mx-auto mb-0.5" />
                  <p className="text-[8px] font-black text-amber-600 uppercase">{isAr ? 'المحفز' : 'Trigger'}</p>
                  <p className={cn('text-[9px] font-semibold truncate', (isAr ? habit.cueAr : habit.cueEn) ? 'text-[var(--foreground)]0' : 'text-[var(--foreground)] italic')}>
                    {(isAr ? habit.cueAr : habit.cueEn) || (isAr ? 'لم يُحدد' : '—')}
                  </p>
                </div>
                <ArrowRight className={cn('h-3 w-3 text-[var(--foreground)] shrink-0', isAr && 'rotate-180')} />
                <div className="hc-loop flex-1 min-w-0 rounded-lg bg-blue-500/8 px-2 py-1.5 text-center cursor-default">
                  <Repeat className="h-3 w-3 text-blue-500 mx-auto mb-0.5" />
                  <p className="text-[8px] font-black text-blue-600 uppercase">{isAr ? 'الروتين' : 'Routine'}</p>
                  <p className={cn('text-[9px] font-semibold truncate', (isAr ? habit.routineAr : habit.routineEn) ? 'text-[var(--foreground)]0' : 'text-[var(--foreground)] italic')}>
                    {(isAr ? habit.routineAr : habit.routineEn) || (isAr ? 'لم يُحدد' : '—')}
                  </p>
                </div>
                <ArrowRight className={cn('h-3 w-3 text-[var(--foreground)] shrink-0', isAr && 'rotate-180')} />
                <div className="hc-loop flex-1 min-w-0 rounded-lg bg-emerald-500/8 px-2 py-1.5 text-center cursor-default">
                  <Gift className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
                  <p className="text-[8px] font-black text-emerald-600 uppercase">{isAr ? 'المكافأة' : 'Reward'}</p>
                  <p className={cn('text-[9px] font-semibold truncate', (isAr ? habit.rewardAr : habit.rewardEn) ? 'text-[var(--foreground)]0' : 'text-[var(--foreground)] italic')}>
                    {(isAr ? habit.rewardAr : habit.rewardEn) || (isAr ? 'لم يُحدد' : '—')}
                  </p>
                </div>
              </div>
              {/* Expanded on hover — solid bg, smooth scale */}
              <div className="absolute left-[-20px] right-[-20px] top-[-14px] z-30 opacity-0 scale-90 pointer-events-none transition-all duration-300 ease-out group-hover/loop:opacity-100 group-hover/loop:scale-110 group-hover/loop:pointer-events-auto">
                <div className="flex items-start gap-2 rounded-2xl p-4 shadow-2xl border border-[var(--foreground)]/10" style={{ background: 'var(--color-background)' }}>
                  <div className="flex-1 min-w-0 rounded-lg bg-amber-500/8 px-2 py-2 text-center cursor-default">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 mx-auto mb-0.5" />
                    <p className="text-[8px] font-black text-amber-600 uppercase">{isAr ? 'المحفز' : 'Trigger'}</p>
                    <p className={cn('text-[10px] font-bold break-words leading-snug', (isAr ? habit.cueAr : habit.cueEn) ? 'text-[var(--foreground)]' : 'text-[var(--foreground)] italic')}>
                      {(isAr ? habit.cueAr : habit.cueEn) || (isAr ? 'لم يُحدد' : '—')}
                    </p>
                  </div>
                  <ArrowRight className={cn('h-3 w-3 text-[var(--foreground)] shrink-0 mt-4', isAr && 'rotate-180')} />
                  <div className="flex-1 min-w-0 rounded-lg bg-blue-500/8 px-2 py-2 text-center cursor-default">
                    <Repeat className="h-3.5 w-3.5 text-blue-500 mx-auto mb-0.5" />
                    <p className="text-[8px] font-black text-blue-600 uppercase">{isAr ? 'الروتين' : 'Routine'}</p>
                    <p className={cn('text-[10px] font-bold break-words leading-snug', (isAr ? habit.routineAr : habit.routineEn) ? 'text-[var(--foreground)]' : 'text-[var(--foreground)] italic')}>
                      {(isAr ? habit.routineAr : habit.routineEn) || (isAr ? 'لم يُحدد' : '—')}
                    </p>
                  </div>
                  <ArrowRight className={cn('h-3 w-3 text-[var(--foreground)] shrink-0 mt-4', isAr && 'rotate-180')} />
                  <div className="flex-1 min-w-0 rounded-lg bg-emerald-500/8 px-2 py-2 text-center cursor-default">
                    <Gift className="h-3.5 w-3.5 text-emerald-500 mx-auto mb-0.5" />
                    <p className="text-[8px] font-black text-emerald-600 uppercase">{isAr ? 'المكافأة' : 'Reward'}</p>
                    <p className={cn('text-[10px] font-bold break-words leading-snug', (isAr ? habit.rewardAr : habit.rewardEn) ? 'text-[var(--foreground)]' : 'text-[var(--foreground)] italic')}>
                      {(isAr ? habit.rewardAr : habit.rewardEn) || (isAr ? 'لم يُحدد' : '—')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─ Row 5c: Notes ─ */}
            <div className={cn('mb-2', showNote ? 'min-h-[24px]' : 'h-[24px] overflow-hidden')} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowNote(!showNote)}
                className="hc-hover flex items-center gap-1.5 text-xs font-bold mb-1 transition-all"
                style={{ color: hc }}>
                <Edit3 className="h-3 w-3" />
                {habit.notes
                  ? (isAr ? 'ملاحظة' : 'Note')
                  : (isAr ? 'إضافة ملاحظة' : 'Add Note')}
                <ChevronDown className={cn('h-3 w-3 transition-transform', showNote && 'rotate-180')} />
              </button>
              {!showNote && habit.notes && (
                <p className="text-[11px] font-medium text-[var(--foreground)] truncate">{habit.notes}</p>
              )}
              {showNote && (
                <div className="space-y-1.5">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onBlur={() => {
                      if (noteText !== (habit.notes || '')) {
                        store.updateHabit(habit.id, { notes: noteText || undefined });
                      }
                    }}
                    dir={isAr ? 'rtl' : 'ltr'}
                    rows={2}
                    placeholder={isAr ? 'اكتب ملاحظتك هنا... مثال: هذه العادة لبناء هوية رياضي محترف' : 'Write your note... e.g., This habit builds my identity as an athlete'}
                    className="w-full rounded-lg bg-transparent px-3 py-2 text-xs font-medium resize-none transition-all"
                    style={{ border: `1.5px solid ${hc}25`, background: `${hc}05` }}
                  />
                  <p className="text-[10px] font-medium text-[var(--foreground)]">{isAr ? 'يُحفظ تلقائيًا' : 'Auto-saved'}</p>
                </div>
              )}
            </div>

            {/* ─ Row 6: Weekly dots (Mon–Sun) ─ */}
            <div
              className="relative mb-2 rounded-xl px-3 py-2.5 cursor-pointer group/week transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:z-30 hover:rounded-2xl"
              style={{ background: `${hc}04`, border: `1px solid ${hc}10` }}
              onClick={(e) => { e.stopPropagation(); onViewFull ? onViewFull() : onDetail(); }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${hc}30`; e.currentTarget.style.background = 'var(--color-background)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${hc}10`; e.currentTarget.style.background = `${hc}04`; }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {isAr ? 'أداء الأسبوع' : 'This Week'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black" style={{ color: completedCountWeek >= 5 ? '#22c55e' : completedCountWeek >= 3 ? hc : '#ef4444' }}>
                    {Math.round((completedCountWeek / 7) * 100)}%
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--foreground)]">{completedCountWeek}/7</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover/week:opacity-100 transition-opacity"
                    style={{ background: `${hc}15`, color: hc }}>
                    {isAr ? 'كل الأيام' : 'All Days'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                {weekDays.map((d, i) => {
                  const dayLabel = parseLocalDate(d.date).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'narrow' });
                  const dayNum = parseLocalDate(d.date).getDate();
                  const isToday = d.date === today;
                  return (
                    <div key={i} className={cn('flex-1 flex flex-col items-center gap-1 rounded-lg py-1.5 transition-all',
                      isToday && 'bg-[var(--color-primary)]/[0.08]'
                    )}>
                      <span className={cn('text-[10px] font-semibold', isToday ? 'font-black text-[var(--color-primary)]' : 'text-[var(--foreground)]')}>
                        {dayLabel}
                      </span>
                      <div className="relative">
                        <div className={cn('hc-dot h-4 w-4 rounded-full cursor-default',
                          d.done
                            ? d.color === 'green' ? 'bg-emerald-500' : d.color === 'orange' ? 'bg-amber-500' : 'bg-emerald-500'
                            : d.color === 'not-scheduled' ? 'bg-red-500/8'
                            : d.color === 'red' ? 'bg-red-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        )}
                          style={isToday ? { boxShadow: `0 0 0 3px ${d.done ? '#22c55e35' : `${hc}30`}, 0 0 8px ${d.done ? '#22c55e20' : `${hc}15`}` } : undefined}
                          title={d.date}
                        />
                        {isToday && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-primary)]" />}
                      </div>
                      <span className={cn('text-[8px] leading-none', isToday ? 'font-black text-[var(--color-primary)]' : 'font-medium text-[var(--foreground)]')}>
                        {dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Legend: green=on time, orange=outside window, red=missed, gray=upcoming, dashed=off day */}
              <div className="flex items-center justify-center gap-3 mt-2 pt-1.5 flex-wrap" style={{ borderTop: `1px solid ${hc}08` }}>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /><span className="text-[8px] font-semibold text-[var(--foreground)]">{isAr ? 'في الوقت' : 'On time'}</span></span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /><span className="text-[8px] font-semibold text-[var(--foreground)]">{isAr ? 'خارج الوقت' : 'Late'}</span></span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /><span className="text-[8px] font-semibold text-[var(--foreground)]">{isAr ? 'فائت' : 'Missed'}</span></span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" /><span className="text-[8px] font-semibold text-[var(--foreground)]">{isAr ? 'قادم' : 'Upcoming'}</span></span>
                {habit.frequency !== 'daily' && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500/8 text-red-400/50 text-[5px] font-black inline-flex items-center justify-center">✕</span><span className="text-[8px] font-semibold text-[var(--foreground)]">{isAr ? 'غير مجدول' : 'N/A'}</span></span>}
              </div>
            </div>

            {/* ─ Row 7: Stats grid ─ */}
            <div className="relative grid grid-cols-4 gap-1.5 mb-2 transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:z-30 hover:rounded-2xl hover:p-2 hover:border hover:border-[var(--foreground)]/10" style={{ background: 'transparent' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-background)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {[
                { value: streak.current, label: isAr ? 'سلسلة' : 'Streak' },
                { value: streak.best, label: isAr ? 'أفضل' : 'Best' },
                { value: `${stats.completionRate}%`, label: isAr ? 'التزام' : 'Rate' },
                { value: totalMinutes > 0 ? (totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h` : `${totalMinutes}m`) : stats.totalCompletions, label: totalMinutes > 0 ? (isAr ? 'وقت' : 'Time') : (isAr ? 'مجمل' : 'Total') },
              ].map((s, i) => (
                <div key={i} className="hc-stat text-center rounded-lg py-1.5 cursor-default" style={{ background: `${hc}06` }}>
                  <p className="text-[13px] font-black leading-tight" style={{ color: hc }}>{s.value}</p>
                  <p className="text-[8px] font-bold text-[var(--foreground)] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ─ Row 8: Bottom actions bar ─ */}
            <div className="relative pt-2.5 mt-auto space-y-2 transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:z-30 hover:rounded-2xl hover:p-3 hover:border hover:border-[var(--foreground)]/10" style={{ borderTop: `1.5px solid ${hc}15` }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-background)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {/* Last completion info */}
              {(() => {
                if (!lastCompletedDate) {
                  return (
                    <div className="hc-info flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--foreground)]/[0.03] border border-dashed border-[var(--foreground)]/[0.18] cursor-default">
                      <Circle className="h-3.5 w-3.5 text-[var(--foreground)]" />
                      <span className="text-[10px] font-bold text-[var(--foreground)]">{isAr ? 'لم يُنجز بعد' : 'No completions yet'}</span>
                    </div>
                  );
                }
                const lastDate = new Date(lastCompletedDate);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);
                const dateStr = lastDate.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric' });
                const agoStr = diffDays === 0
                  ? (isAr ? 'اليوم' : 'Today')
                  : diffDays === 1
                    ? (isAr ? 'أمس' : 'Yesterday')
                    : (isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`);
                const isRecent = diffDays <= 1;
                return (
                  <div className="hc-info flex items-center justify-between py-2 px-3 rounded-xl cursor-default"
                    style={{ background: isRecent ? '#22c55e08' : `${hc}06`, border: `1px solid ${isRecent ? '#22c55e15' : `${hc}10`}` }}>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg flex items-center justify-center"
                        style={{ background: isRecent ? '#22c55e15' : `${hc}12` }}>
                        <CheckCircle2 className="h-3 w-3" style={{ color: isRecent ? '#22c55e' : hc }} />
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-[var(--foreground)]">{isAr ? 'آخر إنجاز' : 'Last done'}</p>
                        <p className="text-[11px] font-bold text-[var(--foreground)]0">{dateStr}</p>
                      </div>
                    </div>
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-md',
                      isRecent ? 'bg-emerald-500/10 text-emerald-600' : diffDays <= 3 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500')}>
                      {agoStr}
                    </span>
                  </div>
                );
              })()}
              {/* Action buttons row */}
              <div className="flex items-center gap-1.5">
                <Link href={`/app/habits/${habit.id}`}
                  className="hc-action flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 active:scale-[0.97]"
                  style={{ background: `${hc}10`, color: hc, border: `1px solid ${hc}20` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = hc; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = hc; e.currentTarget.style.boxShadow = `0 4px 14px ${hc}33`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}10`; e.currentTarget.style.color = hc; e.currentTarget.style.borderColor = `${hc}20`; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <Maximize2 className="h-3.5 w-3.5" /> {isAr ? 'الصفحة' : 'Page'}
                </Link>
                <button onClick={onDetail}
                  className="hc-action flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer active:scale-[0.97]"
                  style={{ background: `${hc}10`, color: hc, border: `1px solid ${hc}20` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = hc; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = hc; e.currentTarget.style.boxShadow = `0 4px 14px ${hc}33`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}10`; e.currentTarget.style.color = hc; e.currentTarget.style.borderColor = `${hc}20`; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <Eye className="h-3.5 w-3.5" /> {isAr ? 'تفاصيل' : 'Details'}
                </button>
              </div>
            </div>
            </>}
          </div>
        </div>
    </motion.div>
  );
}

/* ─── Grid Card (compact) ─── */
function HabitGridCard({ habit, index, isAr, store, today, onEdit, onDelete, onDetail, onViewPage }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: () => void; onDelete: () => void; onDetail: () => void; onViewPage?: string;
}) {
  const toast = useToast();
  const hc = resolveHabitColor(habit.color);
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
  const streak = store.getHabitStreak(habit.id);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const catLabel = getCategoryLabel(habit.category, isAr, store.deletedCategories, habit.archived);
  const hasDuration = !!habit.expectedDuration;
  const tt = habit.trackingType ?? 'boolean';
  const [durationInput, setDurationInput] = useState('');

  // Count tracking
  const isCount = tt === 'count';
  const countTarget = isCount ? (habit.targetValue ?? 1) : 1;
  const countUnit = isCount ? (habit.targetUnit ?? 'times') : 'times';
  const todayCountValue = isCount
    ? store.habitLogs.filter((l: HabitLog) => l.habitId === habit.id && l.date === today).reduce((s: number, l: HabitLog) => s + (l.value ?? (l.completed ? 1 : 0)), 0)
    : 0;
  const countDone = isCount && todayCountValue >= countTarget;

  // Checklist tracking — works for any habit with checklistItems
  const isChecklist = tt === 'checklist';
  const checklistItems = habit.checklistItems ?? [];
  const hasChecklistItems = checklistItems.length > 0;
  const todayChecklistLog = hasChecklistItems ? store.habitLogs.find((l: HabitLog) => l.habitId === habit.id && l.date === today) : null;
  const checklistState = todayChecklistLog?.checklistState ?? {};
  const checklistDone = hasChecklistItems && checklistItems.every(item => isItemDone(checklistState, item.id));
  const checklistCount = hasChecklistItems ? checklistItems.filter(item => isItemDone(checklistState, item.id)).length : 0;

  // Duration tracking
  const isDuration = tt === 'duration';
  const durationTarget = isDuration ? (habit.targetValue ?? 30) : 0;
  const todayDurationValue = isDuration
    ? store.habitLogs.filter((l: HabitLog) => l.habitId === habit.id && l.date === today).reduce((s: number, l: HabitLog) => s + (l.value ?? 0), 0)
    : 0;
  const durationDone = isDuration && todayDurationValue >= durationTarget;

  const isComplete = done || countDone || checklistDone || durationDone;

  const notScheduledToday = !isHabitScheduledForDate(habit, today);

  const handleToggle = () => {
    if (habit.archived || notScheduledToday) return;
    if (tt === 'timer' || hasDuration) return;
    if (tt === 'count' || tt === 'duration') return; // these have their own UI
    if (hasChecklistItems) return; // checklist items handle completion
    const existingLog = store.habitLogs.find((l: HabitLog) => l.habitId === habit.id && l.date === today && l.completed);
    if (existingLog) { store.deleteHabitLog(existingLog.id); }
    else { store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true }); }
  };

  const handleCountIncrement = () => {
    if (habit.archived || notScheduledToday) return;
    const newVal = todayCountValue + 1;
    store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: newVal >= countTarget, value: 1, source: 'manual' });
  };

  const handleChecklistToggle = (itemId: string) => {
    if (habit.archived || notScheduledToday) return;
    const wasDone = isItemDone(checklistState, itemId);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newState = {
      ...checklistState,
      [itemId]: { done: !wasDone, time: !wasDone ? now : null },
    };
    const allDone = checklistItems.every(item => isItemDone(newState, item.id));
    if (todayChecklistLog) {
      store.deleteHabitLog(todayChecklistLog.id);
    }
    store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: allDone, checklistState: newState, source: 'manual' });
  };

  const handleDurationLog = () => {
    if (habit.archived || notScheduledToday || !durationInput) return;
    const mins = Number(durationInput);
    if (mins <= 0) return;
    const newTotal = todayDurationValue + mins;
    store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), duration: mins, note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: newTotal >= durationTarget, value: mins, source: 'manual' });
    setDurationInput('');
  };

  return (
    <motion.div variants={fadeUp} custom={index} initial="hidden" animate="visible"
      className={cn('rounded-xl overflow-hidden flex flex-col cursor-pointer group/gc hover:shadow-md transition-all border',
        isComplete ? 'border-emerald-500/15 bg-emerald-500/[0.02]' : 'border-[var(--foreground)]/[0.15] bg-[var(--color-background)]')}
      onClick={onDetail}
    >
      <div className="h-0.5 w-full" style={{ background: hc }} />
      <div className="p-3 flex flex-col flex-1">
        {/* Name + Category */}
        <div className="flex items-start gap-2 mb-2">
          <button onClick={(e) => {
              e.stopPropagation();
              if (habit.archived) { toast.notifyWarning(isAr ? 'العادة مؤرشفة' : 'Habit is archived', isAr ? 'استعد العادة أولاً للتفاعل معها' : 'Restore the habit first to interact'); return; }
              if ((tt === 'timer' || hasDuration) && !isComplete) { toast.notifyInfo(isAr ? 'يتطلب مؤقت' : 'Timer required', isAr ? 'هذه العادة تحتاج تشغيل المؤقت أولاً لإكمالها' : 'Start the timer first to complete this habit'); return; }
              if (tt === 'count') { handleCountIncrement(); return; }
              handleToggle();
            }}
            className={cn('shrink-0 mt-0.5', (habit.archived || ((tt === 'timer' || hasDuration) && !isComplete)) && 'cursor-not-allowed')}>
            {isComplete ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
              : (tt === 'timer' || hasDuration) ? <Timer className="h-4.5 w-4.5 text-[var(--foreground)]" />
              : isCount ? <div className="h-4.5 w-4.5 rounded-full border-2 border-[var(--color-primary)]/40 flex items-center justify-center text-[8px] font-bold text-[var(--color-primary)]">+</div>
              : hasChecklistItems ? <ListChecks className="h-4.5 w-4.5 text-[var(--foreground)]" />
              : isDuration ? <Clock className="h-4.5 w-4.5 text-[var(--foreground)]" />
              : <Circle className="h-4.5 w-4.5 text-[var(--foreground)] hover:text-emerald-400 transition-colors" />}
          </button>
          <div className="min-w-0 flex-1">
            <h3 className={cn('text-sm font-semibold leading-tight truncate', isComplete && 'line-through opacity-50')}>{name}</h3>
            <p className="text-[9px] text-[var(--foreground)] mt-0.5">{catLabel}</p>
          </div>
        </div>

        {/* ── Completion Controls by Type ── */}
        <div className="mb-2" onClick={e => e.stopPropagation()}>
          {/* Timer */}
          {!habit.archived && (
            <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={isComplete} size="xs" />
          )}

          {/* Count +/- */}
          {isCount && !habit.archived && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (todayCountValue / countTarget) * 100)}%`, background: hc }} />
              </div>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: countDone ? '#10b981' : hc }}>
                {todayCountValue}/{countTarget}
              </span>
              <button onClick={handleCountIncrement}
                disabled={habit.archived}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold hover:bg-[var(--foreground)]/[0.08] transition-colors"
                style={{ color: hc }}>
                +
              </button>
            </div>
          )}

          {/* Checklist / Tasks */}
          {hasChecklistItems && !habit.archived && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${checklistItems.length > 0 ? (checklistCount / checklistItems.length) * 100 : 0}%`, background: hc }} />
                </div>
                <span className="text-[9px] font-bold" style={{ color: checklistDone ? '#10b981' : 'var(--foreground)', opacity: checklistDone ? 1 : 0.4 }}>
                  {checklistCount}/{checklistItems.length}
                </span>
              </div>
              {checklistItems.map(item => {
                const done = isItemDone(checklistState, item.id);
                const t = getItemTime(checklistState, item.id);
                return (
                <button key={item.id} onClick={() => handleChecklistToggle(item.id)}
                  className="flex items-center gap-1.5 w-full text-start py-0.5 hover:bg-[var(--foreground)]/[0.03] rounded px-1 -mx-1 transition-colors">
                  <div className={cn('w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 transition-all',
                    done ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--foreground)]/20')}>
                    {done && <Check className="w-2 h-2 text-white" />}
                  </div>
                  <span className={cn('text-[10px] truncate flex-1', done && 'line-through text-[var(--foreground)]')}>
                    {isAr ? (item.titleAr || item.titleEn) : (item.titleEn || item.titleAr)}
                  </span>
                  {t && <span className="text-[8px] text-[var(--foreground)]/40 flex-shrink-0">{t}</span>}
                </button>);
              })}
            </div>
          )}

          {/* Duration manual input */}
          {isDuration && !habit.archived && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (todayDurationValue / durationTarget) * 100)}%`, background: hc }} />
                </div>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: durationDone ? '#10b981' : hc }}>
                  {todayDurationValue}/{durationTarget}m
                </span>
              </div>
              <div className="flex gap-1">
                <input type="number" min={1} value={durationInput}
                  onChange={e => setDurationInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDurationLog()}
                  placeholder={isAr ? 'دقائق' : 'min'}
                  className="flex-1 rounded-lg bg-[var(--foreground)]/[0.05] border border-[var(--foreground)]/[0.18] px-2 py-1 text-[10px] min-w-0"
                />
                <button onClick={handleDurationLog}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium hover:bg-[var(--foreground)]/[0.08] transition-colors"
                  style={{ color: hc }}>
                  {isAr ? '+سجل' : '+Log'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom info */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[var(--foreground)]/[0.15]">
          {streak.current > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500">
              <Flame className="h-2.5 w-2.5" /> {streak.current}
            </span>
          )}
          {habit.preferredTime && <span className="text-[8px] text-[var(--foreground)]">{to12h(habit.preferredTime!)}</span>}
          <div className="flex items-center gap-1 ms-auto">
            <button onClick={(e) => { e.stopPropagation(); onDetail(); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all duration-200 cursor-pointer"
              style={{ background: `${hc}12`, color: hc, border: `1px solid ${hc}20` }}
              onMouseEnter={(e) => { e.currentTarget.style.background = hc; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = hc; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}12`; e.currentTarget.style.color = hc; e.currentTarget.style.borderColor = `${hc}20`; }}>
              <Eye className="h-2.5 w-2.5" /> {isAr ? 'تفاصيل' : 'Details'}
            </button>
            <div className="flex items-center gap-0.5 opacity-0 group-hover/gc:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.05]">
                <Edit3 className="h-2.5 w-2.5 text-[var(--foreground)]" />
              </button>
              {onViewPage && (
                <Link href={onViewPage} onClick={(e) => e.stopPropagation()}>
                  <div className="h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.05]">
                    <Maximize2 className="h-2.5 w-2.5 text-[var(--foreground)]" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── List Row ─── */
function HabitListRow({ habit, index, isAr, store, today, onEdit, onArchive, onDelete, onDetail, onViewPage }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: () => void; onArchive: () => void; onDelete: () => void; onDetail: () => void; onViewPage?: string;
}) {
  const toast = useToast();
  const hc = resolveHabitColor(habit.color);
  const done = store.habitLogs.some((l: HabitLog) => l.habitId === habit.id && l.date === today && l.completed);
  const streak = store.getHabitStreak(habit.id);
  const stats = store.getHabitStats(habit.id);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const catLabel = getCategoryLabel(habit.category, isAr, store.deletedCategories, habit.archived);
  const freqLabel = isAr ? FREQ_LABELS[habit.frequency]?.ar : FREQ_LABELS[habit.frequency]?.en;
  const hasDuration = !!habit.expectedDuration;
  const tt = habit.trackingType ?? 'boolean';

  // Count tracking for list row
  const isCount = tt === 'count';
  const countTarget = isCount ? (habit.targetValue ?? 1) : 1;
  const todayCountValue = isCount
    ? store.habitLogs.filter((l: HabitLog) => l.habitId === habit.id && l.date === today).reduce((s: number, l: HabitLog) => s + (l.value ?? (l.completed ? 1 : 0)), 0)
    : 0;
  const isChecklist = tt === 'checklist';
  const checklistItems = habit.checklistItems ?? [];
  const hasChecklistItems = checklistItems.length > 0;
  const todayChecklistLog = hasChecklistItems ? store.habitLogs.find((l: HabitLog) => l.habitId === habit.id && l.date === today) : null;
  const checklistState = todayChecklistLog?.checklistState ?? {};
  const isDuration = tt === 'duration';
  const durationTarget = isDuration ? (habit.targetValue ?? 30) : 0;
  const todayDurationValue = isDuration
    ? store.habitLogs.filter((l: HabitLog) => l.habitId === habit.id && l.date === today).reduce((s: number, l: HabitLog) => s + (l.value ?? 0), 0)
    : 0;

  const isComplete = done || (isCount && todayCountValue >= countTarget) || (hasChecklistItems && checklistItems.every(item => isItemDone(checklistState, item.id))) || (isDuration && todayDurationValue >= durationTarget);

  const handleToggle = () => {
    if (hasDuration || habit.archived || tt === 'timer') return;
    if (hasChecklistItems) return; // checklist items handle completion
    if (tt === 'count') {
      const newVal = todayCountValue + 1;
      store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: newVal >= countTarget, value: 1, source: 'manual' });
      return;
    }
    if (tt === 'duration') return;
    const existingLog = store.habitLogs.find((l: HabitLog) => l.habitId === habit.id && l.date === today && l.completed);
    if (existingLog) { store.deleteHabitLog(existingLog.id); }
    else { store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true }); }
  };

  // Last 7 days mini dots with window colors
  const last7 = useMemo(() => {
    const days: CompletionColor[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = formatLocalDate(d);
      const log = store.habitLogs.find(l => l.habitId === habit.id && l.date === ds && l.completed);
      days.push(getCompletionColor(habit, log, ds));
    }
    return days;
  }, [habit.id, habit.windowStart, habit.windowEnd, store.habitLogs]);

  return (
    <motion.div variants={fadeUp} custom={index} initial="hidden" animate="visible"
      className={cn('rounded-xl px-2.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 hover:shadow-sm transition-all group/lr border',
        isComplete ? 'border-emerald-500/15 bg-emerald-500/[0.02]' : 'border-[var(--foreground)]/[0.15] bg-[var(--color-background)]')}
    >
      {/* Check */}
      <button onClick={() => {
          if (habit.archived) { toast.notifyWarning(isAr ? 'العادة مؤرشفة' : 'Habit is archived', isAr ? 'استعد العادة أولاً للتفاعل معها' : 'Restore the habit first to interact'); return; }
          if ((tt === 'timer' || hasDuration) && !isComplete) { toast.notifyInfo(isAr ? 'يتطلب مؤقت' : 'Timer required', isAr ? 'هذه العادة تحتاج تشغيل المؤقت أولاً لإكمالها' : 'Start the timer first to complete this habit'); return; }
          handleToggle();
        }} className={cn('shrink-0', (habit.archived || ((tt === 'timer' || hasDuration) && !isComplete)) && 'cursor-not-allowed')}>
        {isComplete ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          : (tt === 'timer' || hasDuration) ? <Timer className="h-5 w-5 text-[var(--foreground)]" />
          : isCount ? <div className="h-5 w-5 rounded-full border-2 border-[var(--color-primary)]/40 flex items-center justify-center text-[9px] font-bold text-[var(--color-primary)]">+</div>
          : <Circle className="h-5 w-5 text-[var(--foreground)] hover:text-emerald-400 transition-colors" />}
      </button>

      {/* Color dot + name */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: hc || habit.color }} />
        <div className="min-w-0">
          <h3 className={cn('text-sm font-semibold truncate', isComplete && 'line-through opacity-50')}>{name}</h3>
          <div className="flex items-center gap-2 text-[10px] text-[var(--foreground)]">
            <span>{catLabel}</span>
            <span className="text-[var(--foreground)]">·</span>
            <span>{freqLabel}</span>
            {isCount && <span className="font-bold" style={{ color: todayCountValue >= countTarget ? '#10b981' : hc }}>{todayCountValue}/{countTarget} {habit.targetUnit ?? 'times'}</span>}
            {isDuration && <span className="font-bold" style={{ color: todayDurationValue >= durationTarget ? '#10b981' : hc }}>{todayDurationValue}/{durationTarget}m</span>}
            {hasChecklistItems && <span className="font-bold" style={{ color: isComplete ? '#10b981' : hc }}>{checklistItems.filter(i => isItemDone(checklistState, i.id)).length}/{checklistItems.length} {isAr ? 'مهام' : 'tasks'}</span>}
          </div>
        </div>
      </div>

      {/* Last 7 dots */}
      <div className="hidden sm:flex items-center gap-0.5">
        {last7.map((c, i) => (
          <div key={i} className={cn('h-1.5 w-1.5 rounded-full',
            c === 'green' ? 'bg-emerald-500' : c === 'orange' ? 'bg-amber-500' : c === 'red' ? 'bg-red-500' : c === 'not-scheduled' ? 'bg-red-500/15' : 'bg-gray-300 dark:bg-gray-600'
          )} />
        ))}
      </div>

      {/* Streak */}
      {streak.current > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500 shrink-0">
          <Flame className="h-3 w-3" /> {streak.current}
        </span>
      )}

      {/* Rate */}
      <span className="hidden md:block text-[10px] font-medium text-[var(--foreground)] shrink-0 w-10 text-center">{stats.completionRate}%</span>

      {/* Timer */}
      <div className="shrink-0" onClick={e => e.stopPropagation()}>
        <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="xs" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onDetail}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer"
          style={{ background: `${hc}12`, color: hc, border: `1px solid ${hc}20` }}
          onMouseEnter={(e) => { e.currentTarget.style.background = hc; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = hc; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}12`; e.currentTarget.style.color = hc; e.currentTarget.style.borderColor = `${hc}20`; }}>
          <Eye className="h-3 w-3" /> {isAr ? 'تفاصيل' : 'Details'}
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover/lr:opacity-100 transition-opacity">
          <button onClick={onEdit} className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05]">
            <Edit3 className="h-3 w-3 text-[var(--foreground)]" />
          </button>
          <button onClick={onArchive} className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05]">
            <Archive className={cn('h-3 w-3', habit.archived ? 'text-emerald-500' : 'text-[var(--foreground)]')} />
          </button>
          {onViewPage && (
            <Link href={onViewPage}>
              <div className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05]">
                <Maximize2 className="h-3 w-3 text-[var(--foreground)]" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Board View (Kanban by category) ─── */
function HabitBoardView({ habits, isAr, store, today, onEdit, onDelete, onDetail, locale }: {
  habits: Habit[]; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: (h: Habit) => void; onDelete: (h: Habit) => void; onDetail: (h: Habit) => void; locale?: string;
}) {
  const toast = useToast();
  // Group habits by category
  const grouped = useMemo(() => {
    const map: Record<string, Habit[]> = {};
    habits.forEach(h => {
      if (!map[h.category]) map[h.category] = [];
      map[h.category].push(h);
    });
    return map;
  }, [habits]);

  const categories = Object.keys(grouped);

  return (
    <motion.div initial="hidden" animate="visible" className="flex gap-3 sm:gap-5 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin">
      {categories.map((cat) => {
        const catLabel = isAr ? (CATEGORY_LABELS[cat]?.ar ?? cat) : (CATEGORY_LABELS[cat]?.en ?? cat);
        const catHabits = grouped[cat];
        const doneCount = catHabits.filter(h => store.habitLogs.some(l => l.habitId === h.id && l.date === today && l.completed)).length;
        return (
          <div key={cat} className="shrink-0 w-[260px] sm:w-[320px] flex flex-col">
            {/* Column header */}
            <div className="rounded-xl border border-[var(--foreground)]/[0.15] px-4 py-3 mb-3 flex items-center justify-between bg-[var(--foreground)]/[0.015]">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold">{catLabel || cat}</span>
                <span className="text-[10px] font-medium text-[var(--foreground)]">{catHabits.length}</span>
              </div>
              <span className="text-xs font-bold text-emerald-500">{doneCount}/{catHabits.length}</span>
            </div>
            {/* Column cards */}
            <div className="flex flex-col gap-3 flex-1">
              {catHabits.map((habit) => {
                const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
                const streak = store.getHabitStreak(habit.id);
                const name = isAr ? habit.nameAr : habit.nameEn;
                const boardHasDuration = !!habit.expectedDuration;
                const hc = resolveHabitColor(habit.color);
                const handleToggle = () => {
                  if (boardHasDuration || habit.archived) return;
                  const existingLog = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);
                  if (existingLog) { store.deleteHabitLog(existingLog.id); }
                  else { store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true }); }
                };
                return (
                  <div key={habit.id}
                    className={cn('rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all border', done ? 'border-emerald-500/15 bg-emerald-500/[0.02] opacity-60' : 'border-[var(--foreground)]/[0.15]')}
                    style={{ borderInlineStart: `4px solid ${hc}` }}
                    onClick={() => onDetail(habit)}
                  >
                    <div className="flex items-start gap-3">
                      <button onClick={(e) => {
                          e.stopPropagation();
                          if (habit.archived) { toast.notifyWarning(isAr ? 'العادة مؤرشفة' : 'Habit is archived', isAr ? 'استعد العادة أولاً للتفاعل معها' : 'Restore the habit first to interact'); return; }
                          if (boardHasDuration && !done) { toast.notifyInfo(isAr ? 'يتطلب مؤقت' : 'Timer required', isAr ? 'هذه العادة تحتاج تشغيل المؤقت أولاً لإكمالها' : 'Start the timer first to complete this habit'); return; }
                          handleToggle();
                        }} className={cn('shrink-0 mt-0.5', (habit.archived || (boardHasDuration && !done)) && 'cursor-not-allowed')}>
                        {done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : boardHasDuration ? <Timer className="h-5 w-5 text-[var(--foreground)]" /> : <Circle className="h-5 w-5 text-[var(--foreground)]" />}
                      </button>
                      <h4 className={cn('text-sm font-bold leading-snug', done && 'line-through')}>{name}</h4>
                    </div>
                    <div className="flex items-center gap-3 mt-3 ps-8">
                      <div className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span className="text-[11px] font-bold text-orange-500">{streak.current}</span>
                      </div>
                      {habit.preferredTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[var(--foreground)]" />
                          <span className="text-[11px] text-[var(--foreground)]">{to12h(habit.preferredTime!)}</span>
                        </div>
                      )}
                      {habit.expectedDuration && (
                        <div className="flex items-center gap-1">
                          <Hourglass className="h-3 w-3 text-[var(--foreground)]" />
                          <span className="text-[11px] text-[var(--foreground)]">{habit.expectedDuration}{isAr ? 'د' : 'm'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 ms-auto">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(habit); }}
                          className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05]">
                          <Edit3 className="h-3 w-3 text-[var(--foreground)]" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(habit); }}
                          className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-amber-500/10" title={isAr ? 'أرشفة' : 'Archive'}>
                          <Archive className="h-3 w-3 text-amber-500/60" />
                        </button>
                        {locale && (
                          <Link href={`/app/habits/${habit.id}`} onClick={(e) => e.stopPropagation()}>
                            <div className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-[var(--color-primary)]/10">
                              <Maximize2 className="h-3 w-3 text-[var(--color-primary)]/60" />
                            </div>
                          </Link>
                        )}
                      </div>
                    </div>
                    {/* Details button */}
                    <div className="mt-3 ps-8" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onDetail(habit)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer"
                        style={{ background: `${hc}10`, color: hc, border: `1.5px solid ${hc}20` }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = hc; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = hc; e.currentTarget.style.boxShadow = `0 4px 14px ${hc}33`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}10`; e.currentTarget.style.color = hc; e.currentTarget.style.borderColor = `${hc}20`; e.currentTarget.style.boxShadow = 'none'; }}>
                        <Eye className="h-3.5 w-3.5" /> {isAr ? 'التفاصيل' : 'Details'}
                      </button>
                    </div>
                    {/* Timer controls */}
                    {!habit.archived && (
                      <div className="mt-3 ps-8">
                        <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ─── Minimal Card ─── */
/* ─── Sortable wrapper — adds drag handle to any card ─── */
function SortableItem({ id, disabled, children }: { id: string; disabled?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

  if (disabled) return <>{children}</>;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn('h-full', isDragging && 'shadow-xl ring-2 ring-[var(--color-primary)]/30 rounded-2xl')}>
      {/* Floating drag handle */}
      <button {...attributes} {...listeners}
        className="absolute top-2 start-2 z-10 touch-none cursor-grab active:cursor-grabbing h-7 w-7 rounded-lg flex items-center justify-center bg-[var(--color-background)]/90 border border-[var(--foreground)]/[0.1] shadow-sm text-[var(--foreground)] hover:text-[var(--foreground)] hover:bg-[var(--color-background)] transition-all backdrop-blur-sm">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      {children}
    </div>
  );
}

function HabitMinimalCard({ habit, index, isAr, store, today, onToggle, onDelete, onDetail, onViewPage }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onToggle: () => void; onDelete: () => void; onDetail: () => void; onViewPage?: string;
}) {
  const toast = useToast();
  const hc = resolveHabitColor(habit.color);
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
  const streak = store.getHabitStreak(habit.id);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const hasDuration = !!habit.expectedDuration;

  return (
    <motion.div variants={fadeUp} custom={index} initial="hidden" animate="visible"
      className={cn(
        'rounded-xl px-3 py-2.5 cursor-pointer transition-all border group',
        done ? 'bg-emerald-500/[0.03] border-emerald-500/15' : 'border-[var(--foreground)]/[0.15] hover:border-[var(--foreground)]/[0.1]',
      )}
      onClick={onDetail}
    >
      <div className="flex items-center gap-2.5">
        <button onClick={(e) => {
            e.stopPropagation();
            if (habit.archived) { toast.notifyWarning(isAr ? 'العادة مؤرشفة' : 'Habit is archived', isAr ? 'استعد العادة أولاً للتفاعل معها' : 'Restore the habit first to interact'); return; }
            if (hasDuration && !done) { toast.notifyInfo(isAr ? 'يتطلب مؤقت' : 'Timer required', isAr ? 'هذه العادة تحتاج تشغيل المؤقت أولاً لإكمالها' : 'Start the timer first to complete this habit'); return; }
            onToggle();
          }}
          className={cn('shrink-0', (habit.archived || (hasDuration && !done)) && 'cursor-not-allowed')}>
          {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            : hasDuration ? <Timer className="h-4 w-4 text-[var(--foreground)]" />
            : <div className="h-4 w-4 rounded-full border-2 border-[var(--foreground)]/15 hover:border-emerald-400 transition-colors" />}
        </button>
        <span className={cn('text-xs font-semibold truncate flex-1', done && 'line-through opacity-50')}>{name}</span>
        {streak.current > 0 && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500 shrink-0">
            <Flame className="h-2.5 w-2.5" /> {streak.current}
          </span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDetail(); }}
          className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all duration-200 cursor-pointer"
          style={{ background: `${hc}12`, color: hc, border: `1px solid ${hc}20` }}
          onMouseEnter={(e) => { e.currentTarget.style.background = hc; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = hc; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}12`; e.currentTarget.style.color = hc; e.currentTarget.style.borderColor = `${hc}20`; }}>
          <Eye className="h-2.5 w-2.5" /> {isAr ? 'تفاصيل' : 'Details'}
        </button>
        {onViewPage && (
          <Link href={onViewPage} onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.05] opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="h-2.5 w-2.5 text-[var(--foreground)]" />
            </div>
          </Link>
        )}
      </div>
      {!habit.archived && (
        <div className="mt-1.5" onClick={e => e.stopPropagation()}>
          <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="xs" />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Insights Tab ─── */
function HabitsInsights({ isAr, store }: { isAr: boolean; store: ReturnType<typeof useAppStore> }) {
  const today = todayString();
  const activeHabits = store.habits.filter(h => !h.archived);
  const allLogs = store.habitLogs.filter(l => l.completed);
  const allHabitLogs = store.habitLogs; // All logs including incomplete — for time tracking

  // ── Time-based stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = todayString();

    // Total completions
    const totalCompletions = allLogs.length;

    // Total hours — count ALL logged time (completed or not)
    const totalMinutes = allHabitLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    // This week completions
    const weekStart = new Date(now);
    const wd = weekStart.getDay(); weekStart.setDate(weekStart.getDate() - (wd === 0 ? 6 : wd - 1));
    const weekStartStr = formatLocalDate(weekStart);
    const thisWeek = allLogs.filter(l => l.date >= weekStartStr && l.date <= todayStr).length;
    const thisWeekMinutes = allHabitLogs.filter(l => l.date >= weekStartStr && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);

    // This month
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const thisMonth = allLogs.filter(l => l.date >= monthStart && l.date <= todayStr).length;
    const thisMonthMinutes = allHabitLogs.filter(l => l.date >= monthStart && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);

    // This year
    const yearStart = `${now.getFullYear()}-01-01`;
    const thisYear = allLogs.filter(l => l.date >= yearStart && l.date <= todayStr).length;
    const thisYearMinutes = allHabitLogs.filter(l => l.date >= yearStart && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);

    // Active days (unique dates with at least one completion)
    const activeDays = new Set(allLogs.map(l => l.date)).size;

    // Longest streak across all habits
    let bestStreak = 0;
    let bestStreakHabit = '';
    activeHabits.forEach(h => {
      const s = store.getHabitStreak(h.id);
      if (s.best > bestStreak) {
        bestStreak = s.best;
        bestStreakHabit = isAr ? h.nameAr : h.nameEn;
      }
    });

    // Average daily completions
    const firstLog = allLogs.length > 0 ? allLogs.reduce((min, l) => l.date < min ? l.date : min, allLogs[0].date) : todayStr;
    const daysSinceFirst = Math.max(1, Math.floor((Date.now() - new Date(firstLog).getTime()) / 86400000));
    const avgPerDay = Math.round((totalCompletions / daysSinceFirst) * 10) / 10;

    return {
      totalCompletions, totalHours, totalMinutes,
      thisWeek, thisWeekMinutes,
      thisMonth, thisMonthMinutes,
      thisYear, thisYearMinutes,
      activeDays, bestStreak, bestStreakHabit,
      avgPerDay, daysSinceFirst,
    };
  }, [allLogs, activeHabits, store, isAr]);

  // ── Weekly heatmap (last 12 weeks) ──
  const weeklyData = useMemo(() => {
    const weeks: { weekLabel: string; days: { date: string; count: number; isToday: boolean }[] }[] = [];
    const base = new Date();
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(base);
      const wd4529 = weekStart.getDay(); weekStart.setDate(weekStart.getDate() - (wd4529 === 0 ? 6 : wd4529 - 1) - w * 7);
      const days: { date: string; count: number; isToday: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(weekStart);
        dt.setDate(dt.getDate() + d);
        const ds = formatLocalDate(dt);
        days.push({
          date: ds,
          count: ds <= today ? allLogs.filter(l => l.date === ds).length : -1,
          isToday: ds === today,
        });
      }
      const wStart = weekStart.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric' });
      weeks.push({ weekLabel: wStart, days });
    }
    return weeks;
  }, [allLogs, today, isAr]);

  const maxDayCount = Math.max(...weeklyData.flatMap(w => w.days.map(d => d.count)), 1);

  // ── Per-habit breakdown ──
  const habitBreakdown = useMemo(() => {
    return activeHabits.map(h => {
      const logs = allLogs.filter(l => l.habitId === h.id);
      const totalMin = logs.reduce((s, l) => s + (l.duration ?? 0), 0);
      const streak = store.getHabitStreak(h.id);
      const st = store.getHabitStats(h.id);
      return {
        habit: h,
        completions: logs.length,
        totalMinutes: totalMin,
        streak: streak.current,
        bestStreak: streak.best,
        rate: st.completionRate,
        lastDate: streak.lastCompletedDate,
      };
    }).sort((a, b) => b.completions - a.completions);
  }, [activeHabits, allLogs, store]);

  // ── Monthly trend (last 6 months) ──
  const monthlyTrend = useMemo(() => {
    const months: { label: string; count: number; minutes: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = formatLocalDate(d);
      const end = formatLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      const mLogs = allLogs.filter(l => l.date >= start && l.date <= end);
      months.push({
        label: d.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short' }),
        count: mLogs.length,
        minutes: mLogs.reduce((s, l) => s + (l.duration ?? 0), 0),
      });
    }
    return months;
  }, [allLogs, isAr]);

  const maxMonthCount = Math.max(...monthlyTrend.map(m => m.count), 1);

  const fmtTime = (min: number) => {
    if (min < 60) return `${min}${isAr ? ' د' : 'm'}`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}${isAr ? ' س' : 'h'} ${m}${isAr ? ' د' : 'm'}` : `${h}${isAr ? ' ساعة' : 'h'}`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { labelEn: 'Total Completions', labelAr: 'إجمالي الإنجازات', value: stats.totalCompletions, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
          { labelEn: 'Total Hours', labelAr: 'إجمالي الساعات', value: stats.totalHours > 0 ? fmtTime(stats.totalMinutes) : '—', icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
          { labelEn: 'This Week', labelAr: 'هذا الأسبوع', value: stats.thisWeek, sub: stats.thisWeekMinutes > 0 ? fmtTime(stats.thisWeekMinutes) : undefined, icon: CalendarIcon, color: 'text-violet-500 bg-violet-500/10' },
          { labelEn: 'This Month', labelAr: 'هذا الشهر', value: stats.thisMonth, sub: stats.thisMonthMinutes > 0 ? fmtTime(stats.thisMonthMinutes) : undefined, icon: BarChart3, color: 'text-amber-500 bg-amber-500/10' },
          { labelEn: 'This Year', labelAr: 'هذه السنة', value: stats.thisYear, sub: stats.thisYearMinutes > 0 ? fmtTime(stats.thisYearMinutes) : undefined, icon: TrendingUp, color: 'text-pink-500 bg-pink-500/10' },
          { labelEn: 'Active Days', labelAr: 'أيام نشطة', value: stats.activeDays, icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
          { labelEn: 'Avg / Day', labelAr: 'متوسط يومي', value: stats.avgPerDay, icon: Activity, color: 'text-cyan-500 bg-cyan-500/10' },
          { labelEn: 'Best Streak', labelAr: 'أطول سلسلة', value: stats.bestStreak, sub: stats.bestStreakHabit, icon: Trophy, color: 'text-yellow-500 bg-yellow-500/10' },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp} custom={i} className="app-stat-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-[var(--foreground)] uppercase tracking-wider">{isAr ? s.labelAr : s.labelEn}</span>
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', s.color.split(' ')[1])}>
                <s.icon className={cn('h-4 w-4', s.color.split(' ')[0])} />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            {'sub' in s && s.sub && <p className="text-[10px] text-[var(--foreground)] mt-0.5 truncate">{s.sub}</p>}
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8} className="app-card rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4">{isAr ? 'الإنجازات الشهرية' : 'Monthly Completions'}</h3>
          <div className="flex items-end gap-2 h-36">
            {monthlyTrend.map((m, i) => {
              const pct = (m.count / maxMonthCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--foreground)]">{m.count}</span>
                  <div className="w-full rounded-t-lg bg-[var(--color-primary)]/15 relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                    <div className="absolute bottom-0 w-full rounded-t-lg bg-[var(--color-primary)] transition-all" style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-[var(--foreground)] font-medium">{m.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 12-week Heatmap */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={9} className="app-card rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4">{isAr ? 'خريطة النشاط (١٢ أسبوع)' : 'Activity Heatmap (12 weeks)'}</h3>
          {/* Day labels */}
          <div className="flex gap-1">
            <div className="w-8 shrink-0 flex flex-col gap-1 pt-0">
              {(isAr ? DAY_LABELS.ar : DAY_LABELS.en).map((d, i) => (
                <div key={i} className="h-4 flex items-center">
                  <span className="text-[7px] text-[var(--foreground)]">{d[0]}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 flex gap-1 overflow-x-auto">
              {weeklyData.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1 min-w-[16px] flex-1">
                  {week.days.map((day, di) => (
                    <div key={di} title={`${day.date}: ${day.count >= 0 ? day.count : '—'}`}
                      className={cn(
                        'h-4 rounded-sm transition-colors',
                        day.count < 0 && 'bg-[var(--foreground)]/[0.02]',
                        day.count === 0 && 'bg-[var(--foreground)]/[0.05]',
                        day.count > 0 && day.count <= maxDayCount * 0.33 && 'bg-emerald-300',
                        day.count > maxDayCount * 0.33 && day.count <= maxDayCount * 0.66 && 'bg-emerald-500',
                        day.count > maxDayCount * 0.66 && 'bg-emerald-600',
                        day.isToday && 'ring-1 ring-[var(--color-primary)]',
                      )} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <span className="text-[8px] text-[var(--foreground)]">{isAr ? 'أقل' : 'Less'}</span>
            {[0.02, 0.06].map((_, i) => <div key={`e${i}`} className={cn('h-3 w-3 rounded-sm', i === 0 ? 'bg-[var(--foreground)]/[0.02]' : 'bg-[var(--foreground)]/[0.05]')} />)}
            {['bg-emerald-300', 'bg-emerald-500', 'bg-emerald-600'].map((c, i) => <div key={i} className={cn('h-3 w-3 rounded-sm', c)} />)}
            <span className="text-[8px] text-[var(--foreground)]">{isAr ? 'أكثر' : 'More'}</span>
          </div>
        </motion.div>
      </div>

      {/* Per-Habit Breakdown Table */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={10} className="app-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--foreground)]/[0.18]">
          <h3 className="text-sm font-bold">{isAr ? 'تفاصيل كل عادة' : 'Per-Habit Breakdown'}</h3>
        </div>
        {habitBreakdown.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="h-8 w-8 text-[var(--foreground)] mx-auto mb-2" />
            <p className="text-xs text-[var(--foreground)]">{isAr ? 'لا توجد عادات' : 'No habits yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--foreground)]/[0.15]">
                  <th className="text-start px-5 py-3 text-[10px] font-bold text-[var(--foreground)] uppercase tracking-wider">{isAr ? 'العادة' : 'Habit'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'الإنجازات' : 'Done'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'الوقت' : 'Time'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'السلسلة' : 'Streak'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'أفضل' : 'Best'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'المعدل' : 'Rate'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'آخر التزام' : 'Last'}</th>
                </tr>
              </thead>
              <tbody>
                {habitBreakdown.map((row, ri) => (
                  <tr key={row.habit.id} className={cn('border-b border-[var(--foreground)]/[0.15] hover:bg-[var(--foreground)]/[0.02]', ri % 2 === 1 && 'bg-[var(--foreground)]/[0.015]')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: row.habit.color }} />
                        <div>
                          <span className="text-sm font-semibold block">{isAr ? row.habit.nameAr : row.habit.nameEn}</span>
                          <span className="text-[9px] text-[var(--foreground)]">{isAr ? (CATEGORY_LABELS[row.habit.category]?.ar ?? row.habit.category) : (CATEGORY_LABELS[row.habit.category]?.en ?? row.habit.category)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold">{row.completions}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-medium text-[var(--foreground)]">{row.totalMinutes > 0 ? fmtTime(row.totalMinutes) : '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-orange-500">{row.streak}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-amber-500">{row.bestStreak}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        row.rate >= 80 ? 'text-emerald-500 bg-emerald-500/10' :
                        row.rate >= 50 ? 'text-amber-500 bg-amber-500/10' :
                        'text-red-400 bg-red-500/10'
                      )}>{row.rate}%</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[11px] text-[var(--foreground)]">
                        {row.lastDate ? new Date(row.lastDate).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Category Breakdown */}
      {(() => {
        const usedCategories = [...new Set(activeHabits.map(h => h.category))];
        const categoryData = usedCategories.map(cat => {
          const catHabits = activeHabits.filter(h => h.category === cat);
          const catLogs = allLogs.filter(l => catHabits.some(h => h.id === l.habitId));
          const catAllLogs = allHabitLogs.filter(l => catHabits.some(h => h.id === l.habitId));
          const totalMins = catAllLogs.reduce((s, l) => s + (l.duration ?? 0), 0);
          const avgRate = catHabits.length > 0
            ? Math.round(catHabits.reduce((s, h) => s + store.getHabitStats(h.id).completionRate, 0) / catHabits.length)
            : 0;
          return { category: cat, count: catHabits.length, completions: catLogs.length, minutes: totalMins, avgRate };
        }).sort((a, b) => b.avgRate - a.avgRate);
        const maxRate = Math.max(...categoryData.map(c => c.avgRate), 1);

        return categoryData.length > 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={11} className="app-card rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4">{isAr ? 'الأداء حسب الفئة' : 'Performance by Category'}</h3>
            <div className="space-y-2.5">
              {categoryData.map((c, i) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-[var(--foreground)] w-20 truncate text-end">
                    {isAr ? (CATEGORY_LABELS[c.category]?.ar ?? c.category) : (CATEGORY_LABELS[c.category]?.en ?? c.category)}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden relative">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(c.avgRate / maxRate) * 100}%`, background: i === 0 ? '#22c55e' : i === categoryData.length - 1 ? '#ef4444' : '#3b82f6' }} />
                    <span className="absolute inset-y-0 end-2 flex items-center text-[9px] font-bold text-[var(--foreground)]">
                      {c.avgRate}%
                    </span>
                  </div>
                  <span className="text-[9px] text-[var(--foreground)] w-8 text-end">{c.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null;
      })()}

      {/* Day-of-Week Analysis */}
      {(() => {
        const dayCompletions = Array(7).fill(0);
        const dayTotal = Array(7).fill(0);
        const now = new Date();
        // Last 90 days
        for (let i = 0; i < 90; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const ds = formatLocalDate(d);
          const dow = d.getDay();
          dayTotal[dow]++;
          dayCompletions[dow] += allLogs.filter(l => l.date === ds).length;
        }
        const dayRates = dayCompletions.map((c, i) => ({
          day: i,
          label: isAr ? DAY_LABELS.ar[i] : DAY_LABELS.en[i],
          completions: c,
          total: dayTotal[i],
          avg: dayTotal[i] > 0 ? Math.round((c / dayTotal[i]) * 10) / 10 : 0,
        }));
        const maxDayAvg = Math.max(...dayRates.map(d => d.avg), 1);
        const bestDayIdx = dayRates.reduce((best, d) => d.avg > dayRates[best].avg ? d.day : best, 0);
        const worstDayIdx = dayRates.reduce((worst, d) => d.avg < dayRates[worst].avg ? d.day : worst, 0);

        return (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={12} className="app-card rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4">{isAr ? 'أنماط أيام الأسبوع (٩٠ يوم)' : 'Weekday Patterns (90 days)'}</h3>
            <div className="flex items-end gap-2 h-28">
              {dayRates.map((d, i) => {
                const pct = (d.avg / maxDayAvg) * 100;
                const isBest = i === bestDayIdx;
                const isWorst = i === worstDayIdx;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-[var(--foreground)]">{d.avg}</span>
                    <div className={cn('w-full rounded-t-lg transition-all relative', isBest ? 'bg-emerald-500' : isWorst ? 'bg-red-400' : 'bg-blue-400')}
                      style={{ height: `${Math.max(pct, 6)}%` }} />
                    <span className={cn('text-[9px] font-medium', isBest ? 'text-emerald-600 font-bold' : isWorst ? 'text-red-500 font-bold' : 'text-[var(--foreground)]')}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[var(--foreground)] mt-3 text-center">
              {isAr
                ? `🟢 أفضل يوم: ${dayRates[bestDayIdx].label} — 🔴 أضعف يوم: ${dayRates[worstDayIdx].label}`
                : `🟢 Best: ${dayRates[bestDayIdx].label} — 🔴 Weakest: ${dayRates[worstDayIdx].label}`}
            </p>
          </motion.div>
        );
      })()}

      {/* Week-over-Week Comparison */}
      {(() => {
        const now = new Date();
        const thisWeekStart = new Date(now);
        const wd4847 = thisWeekStart.getDay(); thisWeekStart.setDate(thisWeekStart.getDate() - (wd4847 === 0 ? 6 : wd4847 - 1));
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const twStr = formatLocalDate(thisWeekStart);
        const lwStr = formatLocalDate(lastWeekStart);
        const lweStr = formatLocalDate(lastWeekEnd);
        const todayStr = todayString();

        const thisWeekCount = allLogs.filter(l => l.date >= twStr && l.date <= todayStr).length;
        const thisWeekMins = allLogs.filter(l => l.date >= twStr && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);
        const lastWeekCount = allLogs.filter(l => l.date >= lwStr && l.date <= lweStr).length;
        const lastWeekMins = allLogs.filter(l => l.date >= lwStr && l.date <= lweStr).reduce((s, l) => s + (l.duration ?? 0), 0);

        const countDiff = thisWeekCount - lastWeekCount;
        const countPct = lastWeekCount > 0 ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100) : 0;

        return (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={13} className="app-card rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4">{isAr ? 'مقارنة الأسبوع' : 'Week over Week'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center rounded-xl bg-[var(--foreground)]/[0.03] p-3">
                <p className="text-[10px] font-semibold text-[var(--foreground)] uppercase mb-1">{isAr ? 'الأسبوع الماضي' : 'Last Week'}</p>
                <p className="text-xl font-black">{lastWeekCount}</p>
                {lastWeekMins > 0 && <p className="text-[10px] text-[var(--foreground)]">{fmtTime(lastWeekMins)}</p>}
              </div>
              <div className="text-center rounded-xl bg-[var(--foreground)]/[0.03] p-3">
                <p className="text-[10px] font-semibold text-[var(--foreground)] uppercase mb-1">{isAr ? 'هذا الأسبوع' : 'This Week'}</p>
                <p className="text-xl font-black">{thisWeekCount}</p>
                {thisWeekMins > 0 && <p className="text-[10px] text-[var(--foreground)]">{fmtTime(thisWeekMins)}</p>}
              </div>
            </div>
            {lastWeekCount > 0 && (
              <div className={cn('mt-3 text-center text-xs font-bold px-3 py-2 rounded-lg',
                countDiff > 0 ? 'bg-emerald-500/10 text-emerald-600' :
                countDiff < 0 ? 'bg-red-500/10 text-red-500' : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]')}>
                {countDiff > 0 ? '↑' : countDiff < 0 ? '↓' : '→'} {Math.abs(countPct)}%
                {' '}{countDiff > 0 ? (isAr ? 'تحسن' : 'improvement') : countDiff < 0 ? (isAr ? 'تراجع' : 'decrease') : (isAr ? 'ثبات' : 'stable')}
              </div>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
}

/* ─── Full-screen Compliance Table ─── */
function HabitsComplianceTable({ habits, isAr, store, onClose }: { habits: Habit[]; isAr: boolean; store: ReturnType<typeof useAppStore>; onClose: () => void }) {
  const today = todayString();
  const [pageOffset, setPageOffset] = useState(0);
  const DAYS_PER_PAGE = 14;

  // Calculate dates for current page
  const pageDates = useMemo(() => {
    const dates: string[] = [];
    const base = parseLocalDate(today);
    base.setDate(base.getDate() - (DAYS_PER_PAGE - 1) + pageOffset * DAYS_PER_PAGE);
    for (let i = 0; i < DAYS_PER_PAGE; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(formatLocalDate(d));
    }
    return dates;
  }, [today, pageOffset]);

  const rangeLabel = useMemo(() => {
    const start = new Date(pageDates[0]);
    const end = new Date(pageDates[pageDates.length - 1]);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const yOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const loc = isAr ? 'ar-SA-u-nu-latn' : 'en-US';
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString(loc, yOpts)} – ${end.toLocaleDateString(loc, yOpts)}`;
    }
    return `${start.toLocaleDateString(loc, opts)} – ${end.toLocaleDateString(loc, yOpts)}`;
  }, [pageDates, isAr]);

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
              <h2 className="text-lg font-bold tracking-tight">{isAr ? 'جدول الالتزام' : 'Habit Compliance'}</h2>
              <p className="text-xs text-[var(--foreground)]">{isAr ? `${habits.length} عادة • معدل الالتزام ${overallRate}%` : `${habits.length} habits • ${overallRate}% overall rate`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Navigation */}
            <button onClick={() => setPageOffset(p => p - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--foreground)]/[0.08] transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center min-w-[160px]">
              <p className="text-xs font-semibold">{rangeLabel}</p>
            </div>
            <button onClick={() => setPageOffset(p => p + 1)}
              disabled={pageOffset >= 0}
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--foreground)]/[0.08] transition-colors disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
            {pageOffset !== 0 && (
              <button onClick={() => setPageOffset(0)}
                className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors">
                {isAr ? 'اليوم' : 'Today'}
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
                  <th className="text-start px-5 py-3.5 text-xs font-bold text-[var(--foreground)] uppercase tracking-wider sticky start-0 z-30 bg-[var(--color-background)] min-w-[200px] border-e border-[var(--foreground)]/[0.15]">
                    {isAr ? 'العادة' : 'Habit'}
                  </th>
                  {pageDates.map(d => {
                    const dt = new Date(d);
                    const isToday = d === today;
                    const isFuture = d > today;
                    return (
                      <th key={d} className={cn(
                        'px-1 py-3.5 text-center min-w-[52px]',
                        isToday && 'bg-[var(--color-primary)]/[0.08]',
                        isFuture && 'opacity-40',
                      )}>
                        <span className="text-[9px] font-medium text-[var(--foreground)] block">
                          {(isAr ? DAY_LABELS.ar : DAY_LABELS.en)[dt.getDay()]}
                        </span>
                        <span className={cn(
                          'text-sm font-bold block mt-0.5',
                          isToday ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]0'
                        )}>{dt.getDate()}</span>
                        {dt.getDate() === 1 && (
                          <span className="text-[8px] text-[var(--foreground)] block">
                            {dt.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short' })}
                          </span>
                        )}
                      </th>
                    );
                  })}
                  <th className="px-3 py-3.5 text-center min-w-[60px] border-s border-[var(--foreground)]/[0.15]">
                    <span className="text-[10px] font-bold text-[var(--foreground)] uppercase tracking-wider">{isAr ? 'العدد' : 'Total'}</span>
                  </th>
                  <th className="px-3 py-3.5 text-center min-w-[70px] border-s border-[var(--foreground)]/[0.15]">
                    <span className="text-[10px] font-bold text-[var(--foreground)] uppercase tracking-wider">{isAr ? 'المعدل' : 'Rate'}</span>
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
                  const totalAllTime = store.habitLogs.filter(l => l.habitId === habit.id && l.completed).length;

                  return (
                    <tr key={habit.id} className={cn(
                      'border-b border-[var(--foreground)]/[0.15] hover:bg-[var(--foreground)]/[0.02] transition-colors',
                      hi % 2 === 1 && 'bg-[var(--foreground)]/[0.015]'
                    )}>
                      <td className="px-5 py-3 sticky start-0 z-10 bg-[var(--color-background)] border-e border-[var(--foreground)]/[0.15]">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: habit.color }} />
                          <div className="min-w-0">
                            <span className="text-sm font-semibold truncate block max-w-[160px]">{isAr ? habit.nameAr : habit.nameEn}</span>
                            <span className="text-[10px] text-[var(--foreground)] block">
                              {isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category)}
                            </span>
                          </div>
                        </div>
                      </td>
                      {pageDates.map(d => {
                        const isFuture = d > today;
                        const beforeCreated = habit.createdAt.split('T')[0] > d;
                        const done = !isFuture && !beforeCreated && store.habitLogs.some(l => l.habitId === habit.id && l.date === d && l.completed);
                        const isToday = d === today;
                        return (
                          <td key={d} className={cn(
                            'px-1 py-3 text-center',
                            isToday && 'bg-[var(--color-primary)]/[0.08]',
                          )}>
                            {beforeCreated ? (
                              <div className="h-8 w-8 mx-auto rounded-lg bg-red-500/8 flex items-center justify-center">
                                <X className="h-3.5 w-3.5 text-red-400/40" />
                              </div>
                            ) : isFuture ? (
                              <div className="h-8 w-8 mx-auto rounded-lg bg-gray-200 dark:bg-gray-700" />
                            ) : done ? (
                              <div className="h-8 w-8 mx-auto rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 mx-auto rounded-lg bg-red-500/8 flex items-center justify-center">
                                <X className="h-3.5 w-3.5 text-red-400/60" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center border-s border-[var(--foreground)]/[0.15]">
                        <div className="flex flex-col items-center">
                          <span className="text-base font-bold text-[var(--color-primary)]">{totalAllTime}</span>
                          <span className="text-[9px] text-[var(--foreground)]">{isAr ? 'مرة' : 'times'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center border-s border-[var(--foreground)]/[0.15]">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            'text-sm font-bold',
                            rate >= 80 ? 'text-emerald-500' :
                            rate >= 50 ? 'text-amber-500' :
                            'text-red-400'
                          )}>{rate}%</span>
                          <div className="w-10 h-1.5 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden">
                            <div className={cn(
                              'h-full rounded-full transition-all',
                              rate >= 80 ? 'bg-emerald-500' :
                              rate >= 50 ? 'bg-amber-500' :
                              'bg-red-400'
                            )} style={{ width: `${rate}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer summary */}
              <tfoot className="sticky bottom-0 z-20 bg-[var(--color-background)]">
                <tr className="border-t-2 border-[var(--foreground)]/[0.1]">
                  <td className="px-5 py-3.5 sticky start-0 z-30 bg-[var(--color-background)] border-e border-[var(--foreground)]/[0.15]">
                    <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">{isAr ? 'الإجمالي' : 'Daily Total'}</span>
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
                      <td key={d} className={cn('px-1 py-3.5 text-center', isToday && 'bg-[var(--color-primary)]/[0.08]')}>
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
                  <td className="px-3 py-3.5 text-center border-s border-[var(--foreground)]/[0.15]">
                    <span className="text-sm font-bold text-[var(--color-primary)]">
                      {habits.reduce((sum, h) => sum + store.habitLogs.filter(l => l.habitId === h.id && l.completed).length, 0)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center border-s border-[var(--foreground)]/[0.15]">
                    <span className={cn(
                      'text-sm font-bold',
                      overallRate >= 80 ? 'text-emerald-500' :
                      overallRate >= 50 ? 'text-amber-500' :
                      'text-red-400'
                    )}>{overallRate}%</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 px-5 py-3 border-t border-[var(--foreground)]/[0.1] shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-emerald-500/15 flex items-center justify-center"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /></div>
            <span className="text-[10px] text-[var(--foreground)] font-medium">{isAr ? 'مكتمل' : 'Done'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-red-500/10 flex items-center justify-center"><X className="h-2.5 w-2.5 text-red-400/60" /></div>
            <span className="text-[10px] text-[var(--foreground)] font-medium">{isAr ? 'فائت' : 'Missed'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-amber-500/15 flex items-center justify-center"><Clock className="h-2.5 w-2.5 text-amber-500" /></div>
            <span className="text-[10px] text-[var(--foreground)] font-medium">{isAr ? 'مكتمل خارج الوقت' : 'Done late'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-[var(--foreground)]/[0.03]" />
            <span className="text-[10px] text-[var(--foreground)] font-medium">{isAr ? 'غير مطبق' : 'N/A'}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function HabitDetail({ habit, onClose, onEdit, onViewFull, allHabits, onNavigate }: { habit: Habit; onClose: () => void; onEdit: () => void; onViewFull: () => void; allHabits: Habit[]; onNavigate: (h: Habit) => void }) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const toast = useToast();
  const today = todayString();
  const stats = store.getHabitStats(habit.id);
  const streak = store.getHabitStreak(habit.id);
  const timeStats = useMemo(() => getHabitTimeStats(habit.id, store.habitLogs, habit.expectedDuration), [habit.id, store.habitLogs, habit.expectedDuration]);
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
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
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const log = store.habitLogs.find(l => l.habitId === habit.id && l.date === ds && l.completed);
      days.push({ date: ds, done: !!log, color: getCompletionColor(habit, log, ds) });
    }
    return days;
  }, [habit.id, store.habitLogs, habit.windowStart, habit.windowEnd]);

  // Today's logs for time display (timer habits can have multiple sessions)
  const todayLogs = useMemo(() => store.habitLogs.filter(l => l.habitId === habit.id && l.date === today && l.completed), [habit.id, today, store.habitLogs]);
  const todayLog = todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : undefined;
  const todaySessionCount = todayLogs.length;
  const todayTotalDurationSecs = todayLogs.reduce((sum, l) => sum + normalizeDurationToSecs(l.duration), 0);

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
      const dayLogs = !isFuture && !beforeCreated ? store.habitLogs.filter(l => l.habitId === habit.id && l.date === dateStr && l.completed) : [];
      const log = dayLogs.length > 0 ? dayLogs[0] : undefined;
      days.push({
        date: dateStr, day: d, inMonth: true, completed: dayLogs.length > 0, sessionCount: dayLogs.length, isFuture, beforeCreated,
        color: !beforeCreated ? getCompletionColor(habit, log, dateStr) : 'none',
      });
    }
    return days;
  }, [calMonth, habit.id, habit.windowStart, habit.windowEnd, store.habitLogs, createdDate]);

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
            </div>

          {/* Week strip — compact */}
          <div className="rounded-xl p-1.5 sm:p-2.5 mt-2" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
          <div className="flex items-center gap-0">
            {weekDays.map((d, i) => {
              const dayLabel = parseLocalDate(d.date).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'narrow' });
              const isToday = d.date === today;
              const isPast = d.date < today;
              const isNotScheduled = d.color === 'not-scheduled';
              const daySessionCount = store.habitLogs.filter(l => l.habitId === habit.id && l.date === d.date && l.completed).length;
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
                  {daySessionCount > 1 && (
                    <span className="absolute -top-1 end-0 h-4 min-w-[16px] px-1 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">{daySessionCount}x</span>
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
            {[catLabel, freqLabel, typeLabel, `${priLabel}`, `${diffLabel}`, ...(habit.expectedDuration ? [`${habit.expectedDuration}${isAr ? 'د' : 'm'}`] : []), habit.maxDailyReps ? `${isAr ? 'أقصى عدد جلسات: ' : 'Max sessions: '}${habit.maxDailyReps}${isAr ? '/يوم' : '/day'}` : (isAr ? 'أقصى عدد جلسات: غير محدود' : 'Max sessions: Unlimited'), `${habitAge}${isAr ? 'يوم' : 'd'}`].map((b, i) => (
              <span key={i} className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md cursor-default" style={{ background: `${hc}10`, color: hc, border: `1px solid ${hc}15` }}>{b}</span>
            ))}
          </div>
        </div>

        {/* ── BODY: 3-column grid ── */}
        <div className="px-3 sm:px-5 pb-3 sm:pb-4 pt-2">
          {/* Action zone — compact */}
          <div className="rounded-xl p-3 mb-3" style={{ background: `${hc}05`, border: `1px solid ${hc}12` }} onClick={e => e.stopPropagation()}>
            {hasDuration && !habit.archived && (
              <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="sm" />
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
            {todayLogs.length > 0 && (
              <div className="mt-2 flex flex-col items-center gap-1">
                {todaySessionCount > 1 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                    {todaySessionCount} {isAr ? 'جلسات اليوم' : 'sessions today'} — {formatSecs(todayTotalDurationSecs)} {isAr ? 'إجمالي' : 'total'}
                  </span>
                )}
                <div className="flex items-center justify-center gap-4 text-sm text-[var(--foreground)]">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {to12h(todayLog!.time)}</span>
                  {todayLog!.duration && <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {formatSecs(normalizeDurationToSecs(todayLog!.duration))}{todaySessionCount > 1 ? (isAr ? ' (آخر جلسة)' : ' (last)') : ''}</span>}
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

          {/* First & Last Done */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-3 rounded-xl p-1.5 sm:p-2" style={{ border: `1.5px solid ${hc}50`, background: `${hc}0a` }}>
            <div className="flex items-center gap-1.5 rounded-xl py-1.5 sm:py-2 px-2 sm:px-3 cursor-default" style={{ background: '#8b5cf608', border: '1px solid #8b5cf615' }}>
              <CalendarDays className="h-3 w-3 text-violet-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm font-bold text-[var(--foreground)]">{isAr ? 'أول إنجاز' : 'First Done'}</p>
                {firstDone
                  ? <p className="text-[10px] sm:text-sm font-black text-violet-600 tabular-nums truncate">{parseLocalDate(firstDone).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  : <p className="text-[10px] italic text-[var(--foreground)]">{isAr ? 'لم يُنجز بعد' : 'Not yet'}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl py-1.5 sm:py-2 px-2 sm:px-3 cursor-default" style={{ background: '#06b6d408', border: '1px solid #06b6d415' }}>
              <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm font-bold text-[var(--foreground)]">{isAr ? 'آخر إنجاز' : 'Last Done'}</p>
                {lastDone
                  ? <p className="text-[10px] sm:text-sm font-black text-cyan-600 tabular-nums truncate">{parseLocalDate(lastDone).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  : <p className="text-[10px] italic text-[var(--foreground)]">{isAr ? 'لم يُنجز بعد' : 'Not yet'}</p>}
              </div>
            </div>
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
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/8 text-emerald-600 border border-emerald-500/12"><Hourglass className="h-3.5 w-3.5" /> {isAr ? 'المدة المتوقعة:' : 'Duration:'} {habit.expectedDuration}{isAr ? ' دقيقة' : ' min'}</span>
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
