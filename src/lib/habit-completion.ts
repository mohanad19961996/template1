import type { Habit, HabitLog } from '@/types/app';

export function sumLoggedDurationSecsOnDate(habitId: string, logs: HabitLog[], dateStr: string): number {
  return logs
    .filter(l => l.habitId === habitId && l.date === dateStr)
    .reduce((sum, l) => sum + (l.duration ?? 0), 0);
}

/** Full timer targets earned on a date from summed duration (capped by maxDailyReps). */
export function getTimerCompletionCount(habit: Habit, logs: HabitLog[], dateStr: string): number {
  if (!habit.expectedDuration) return 0;
  const totalSecs = sumLoggedDurationSecsOnDate(habit.id, logs, dateStr);
  const earned = Math.floor(totalSecs / habit.expectedDuration);
  const maxReps = habit.maxDailyReps ?? Infinity;
  return maxReps === Infinity ? earned : Math.min(earned, maxReps);
}

/**
 * Done reps for a date — drives N× badges and per-day aggregation.
 * Boolean (and default) habits: at most one rep per calendar day even if multiple completed rows exist.
 */
export function getDoneRepCountForDate(habit: Habit, logs: HabitLog[], dateStr: string): number {
  if (habit.expectedDuration) {
    return getTimerCompletionCount(habit, logs, dateStr);
  }
  if (habit.trackingType === 'count') {
    const target = habit.targetValue ?? 1;
    if (target <= 0) return 0;
    const dayLogs = logs.filter(l => l.habitId === habit.id && l.date === dateStr);
    const maxVal = dayLogs.reduce((m, l) => Math.max(m, l.value ?? 0), 0);
    if (maxVal > 0) return Math.floor(maxVal / target);
    const completedCount = dayLogs.filter(l => l.completed).length;
    if (target === 1) return completedCount > 0 ? 1 : 0;
    return completedCount;
  }
  const effectiveType = habit.trackingType ?? 'boolean';
  if (effectiveType === 'boolean' || effectiveType === 'checklist') {
    return logs.some(l => l.habitId === habit.id && l.date === dateStr && l.completed) ? 1 : 0;
  }
  return logs.filter(l => l.habitId === habit.id && l.date === dateStr && l.completed).length;
}

/** Total completion units for stats (matches per-day rep semantics; boolean = unique completed days). */
export function getTotalCompletionUnits(habit: Habit, logs: HabitLog[]): number {
  const habitId = habit.id;
  const habitLogs = logs.filter(l => l.habitId === habitId);
  if (habitLogs.length === 0) return 0;

  if (habit.expectedDuration) {
    const dates = [...new Set(habitLogs.map(l => l.date))];
    return dates.reduce((sum, d) => sum + getTimerCompletionCount(habit, logs, d), 0);
  }
  if (habit.trackingType === 'count') {
    const dates = [...new Set(habitLogs.map(l => l.date))];
    return dates.reduce((sum, d) => sum + getDoneRepCountForDate(habit, logs, d), 0);
  }
  return new Set(habitLogs.filter(l => l.completed).map(l => l.date)).size;
}
