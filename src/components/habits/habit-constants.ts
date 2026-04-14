/**
 * Shared constants, labels, and helper functions used across habit components.
 */

import { Habit, HabitLog, WeekDay, todayString, parseLocalDate, resolveHabitColor } from '@/types/app';
import { sumLoggedDurationSecsOnDate, getDoneRepCountForDate } from '@/lib/habit-completion';

// ── Labels ──────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
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

export const FREQ_LABELS: Record<string, { en: string; ar: string }> = {
  daily: { en: 'Daily', ar: 'يومي' },
  weekly: { en: 'Weekly', ar: 'أسبوعي' },
  monthly: { en: 'Monthly', ar: 'شهري' },
  custom: { en: 'Custom', ar: 'مخصص' },
};

export const DAY_LABELS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};

export const MONTH_LABELS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

export const CUSTOM_SCHEDULE_LABELS: Record<string, { en: string; ar: string }> = {
  weekdays: { en: 'Specific Weekdays', ar: 'أيام محددة من الأسبوع' },
  monthdays: { en: 'Specific Days of Month', ar: 'أيام محددة من الشهر' },
  yeardays: { en: 'Specific Days of Year', ar: 'أيام محددة من السنة' },
};

// ── Animation Variants ──────────────────────────────────

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

export const habitsHeroEase = [0.16, 1, 0.3, 1] as const;

export const habitsHeroTitle = {
  container: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.13, delayChildren: 0.06 } },
  },
  icon: {
    hidden: { opacity: 0, scale: 0.6, y: 16, rotate: -12 },
    visible: { opacity: 1, scale: 1, y: 0, rotate: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 20 } },
  },
  heading: {
    hidden: { opacity: 0, y: 36, scale: 0.92 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.62, ease: habitsHeroEase } },
  },
  rule: {
    hidden: { opacity: 0, scaleX: 0 },
    visible: { opacity: 1, scaleX: 1, transition: { duration: 0.55, ease: habitsHeroEase } },
  },
  subtitle: {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: habitsHeroEase } },
  },
};

// ── CSS Base Classes ────────────────────────────────────

export const categoryTileBase =
  'group relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-start transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]';

// ── Checklist State Helpers ─────────────────────────────

export type ChecklistStateValue = boolean | { done: boolean; time: string | null };

export const isItemDone = (state: Record<string, ChecklistStateValue> | undefined, id: string): boolean => {
  if (!state) return false;
  const v = (state as Record<string, ChecklistStateValue>)[id];
  return typeof v === 'boolean' ? v : !!(v && v.done);
};

export const getItemTime = (state: Record<string, ChecklistStateValue> | undefined, id: string): string | null => {
  if (!state) return null;
  const v = (state as Record<string, ChecklistStateValue>)[id];
  return (v && typeof v === 'object') ? v.time : null;
};

// ── Duration / Time Helpers ─────────────────────────────

export function normalizeDurationToSecs(dur: number | undefined): number {
  if (!dur) return 0;
  return dur;
}

export function isHabitDoneToday(habit: Habit, logs: HabitLog[], today: string): boolean {
  // Check for any completed log first (covers manual completions, timer completions, etc.)
  if (logs.some(l => l.habitId === habit.id && l.date === today && l.completed)) return true;
  // For timer habits, also check if cumulative duration meets the target
  if (habit.expectedDuration) {
    const totalSecs = sumLoggedDurationSecsOnDate(habit.id, logs, today);
    return totalSecs >= habit.expectedDuration;
  }
  return false;
}

export function getHabitTimeStats(habit: Habit, logs: HabitLog[]) {
  const habitId = habit.id;
  const habitLogs = logs.filter(l => l.habitId === habitId);
  const now = new Date();
  const todayStr = todayString();
  const expectedDuration = habit.expectedDuration;

  const ws = new Date(now); const day = ws.getDay(); ws.setDate(ws.getDate() - (day === 0 ? 6 : day - 1));
  const weekStart = `${ws.getFullYear()}-${String(ws.getMonth() + 1).padStart(2, '0')}-${String(ws.getDate()).padStart(2, '0')}`;
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const yearStart = `${now.getFullYear()}-01-01`;

  const sumRepsInRange = (startStr: string, endStr: string) => {
    const dates = [...new Set(habitLogs.filter(l => l.date >= startStr && l.date <= endStr).map(l => l.date))];
    return dates.reduce((sum, d) => sum + getDoneRepCountForDate(habit, logs, d), 0);
  };

  const sumAllSecs = (arr: HabitLog[]) => {
    let total = 0;
    for (const l of arr) {
      const secs = normalizeDurationToSecs(l.duration);
      if (secs > 0) total += secs;
      else if (l.completed) total += (expectedDuration ?? 0);
    }
    return total;
  };

  const thisWeekAll = habitLogs.filter(l => l.date >= weekStart && l.date <= todayStr);
  const thisMonthAll = habitLogs.filter(l => l.date >= monthStart && l.date <= todayStr);
  const thisYearAll = habitLogs.filter(l => l.date >= yearStart && l.date <= todayStr);
  const allDates = [...new Set(habitLogs.map(l => l.date))];

  return {
    reps: {
      week: sumRepsInRange(weekStart, todayStr),
      month: sumRepsInRange(monthStart, todayStr),
      year: sumRepsInRange(yearStart, todayStr),
      total: allDates.reduce((sum, d) => sum + getDoneRepCountForDate(habit, logs, d), 0),
    },
    secs: { today: sumAllSecs(habitLogs.filter(l => l.date === todayStr)), week: sumAllSecs(thisWeekAll), month: sumAllSecs(thisMonthAll), year: sumAllSecs(thisYearAll), total: sumAllSecs(habitLogs) },
  };
}

export function formatSecs(totalSecs: number): string {
  if (totalSecs <= 0) return '0s';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.floor(totalSecs % 60);
  if (h > 0) return s > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

export function to12h(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

// ── Window / Scheduling Helpers ─────────────────────────

export function isBooleanOutsideWindow(habit: Habit): boolean {
  const start = habit.completionWindowStart;
  const end = habit.completionWindowEnd;
  if (!start && !end) return false;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (start && end) {
    if (start <= end) return currentTime < start || currentTime > end;
    return currentTime > end && currentTime < start;
  }
  if (start) return currentTime < start;
  if (end) return currentTime > end;
  return false;
}

export function formatCompletionWindow(habit: Habit, isAr: boolean): string {
  const start = habit.completionWindowStart;
  const end = habit.completionWindowEnd;
  if (start && end) return `${to12h(start)} – ${to12h(end)}`;
  if (start) return isAr ? `بعد ${to12h(start)}` : `After ${to12h(start)}`;
  if (end) return isAr ? `قبل ${to12h(end)}` : `Before ${to12h(end)}`;
  return '';
}

export function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
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
  if (scheduleType === 'custom' && scheduleDays.length > 0) return scheduleDays.includes(d.getDay() as WeekDay);
  if (scheduleType === 'weekly' && scheduleDays.length > 0) return scheduleDays.includes(d.getDay() as WeekDay);
  return true;
}

export type CompletionColor = 'green' | 'orange' | 'red' | 'none' | 'not-scheduled';

export function getCompletionColor(habit: Habit, log: HabitLog | undefined, dateStr?: string, allLogs?: HabitLog[]): CompletionColor {
  // For timer habits, check cumulative duration across all logs for the date
  const isTimerDone = habit.expectedDuration && dateStr && allLogs
    ? sumLoggedDurationSecsOnDate(habit.id, allLogs, dateStr) >= habit.expectedDuration
    : false;

  if ((!log || !log.completed) && !isTimerDone) {
    const today = todayString();
    const checkDate = dateStr || '';
    if (checkDate && !isHabitScheduledForDate(habit, checkDate)) return 'not-scheduled';
    if (checkDate > today) return 'none';
    // Don't mark days before habit creation as missed
    if (checkDate && habit.createdAt) {
      const createdDate = habit.createdAt.slice(0, 10); // YYYY-MM-DD from ISO
      if (checkDate < createdDate) return 'not-scheduled';
    }
    if (checkDate === today) {
      if (habit.strictWindow && habit.windowEnd) {
        const now = new Date();
        const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (ct > habit.windowEnd) return 'red';
      }
      return 'none';
    }
    return 'red';
  }
  if (habit.expectedDuration) return 'green';
  if (habit.strictWindow && habit.windowStart && habit.windowEnd && log?.time) {
    const logTime = log.time;
    if (logTime < habit.windowStart || logTime > habit.windowEnd) return 'orange';
  }
  return 'green';
}

export function isWithinWindow(habit: Habit): boolean {
  if (!habit.windowStart || !habit.windowEnd) return true;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= habit.windowStart && currentTime <= habit.windowEnd;
}

export function isWindowPassed(habit: Habit): boolean {
  if (!habit.windowStart || !habit.windowEnd) return false;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime > habit.windowEnd;
}

export function getCategoryLabel(category: string, isAr: boolean, deletedCategories?: string[], isArchived?: boolean): string {
  const label = isAr ? (CATEGORY_LABELS[category]?.ar ?? category) : (CATEGORY_LABELS[category]?.en ?? category);
  if (isArchived && deletedCategories?.includes(category)) {
    return `${label} (${isAr ? 'محذوفة' : 'deleted'})`;
  }
  return label;
}
