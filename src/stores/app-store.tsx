'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  AppState, DEFAULT_APP_STATE, Habit, HabitLog, Skill, SkillSession,
  TimerSession, Reminder, Alarm, AlarmStatus, HormoneLog, NutritionLog, HydrationLog,
  Task, Goal, MoodEntry, UserSettings, ActiveTimer, generateId, todayString, parseLocalDate,
  StreakInfo, HabitStats, SkillStats, DateString,
  HabitHistoryEntry, HabitChangeType,
  computeTimerElapsed, computeTimerRemaining,
} from '@/types/app';
import { playHabitDoneSound, playHabitUndoneSound } from '@/lib/sounds';

// ── Storage ────────────────────────────────────────────────

const STORAGE_KEY = 'habits-app-state';

function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_APP_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_STATE;
    const parsed = JSON.parse(raw);
    const normalized = normalizeState({ ...DEFAULT_APP_STATE, ...parsed });
    // Persist migrations immediately so they don't re-run
    if (JSON.stringify(normalized) !== raw) {
      saveState(normalized);
    }
    return normalized;
  } catch {
    return DEFAULT_APP_STATE;
  }
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage full — silently fail */ }
}

// ── Data Normalization (backward compat for new fields) ───

function normalizeState(state: AppState): AppState {
  // Migrate expectedDuration from minutes to seconds (one-time)
  const needsDurationMigration = !(state as any)._durationMigratedToSecs;

  const habits = state.habits.map(h => ({
    ...h,
    expectedDuration: h.expectedDuration
      ? (needsDurationMigration ? h.expectedDuration * 60 : h.expectedDuration)
      : h.expectedDuration,
    trackingType: h.trackingType ?? (h.expectedDuration ? 'timer' : 'boolean'),
    targetValue: h.targetValue ?? (h.expectedDuration ? h.expectedDuration : 1),
    targetUnit: h.targetUnit ?? (h.expectedDuration ? 'minutes' : 'times'),
    scheduleType: h.scheduleType ?? (h.frequency === 'custom' ? 'custom' : h.frequency === 'weekly' ? 'weekly' : 'daily'),
    scheduleDays: h.scheduleDays ?? h.customDays,
    allowPartial: h.allowPartial ?? false,
    allowSkip: h.allowSkip ?? false,
  }));

  // Fix timer habit log completion flags: recalculate based on cumulative per-rep logic
  const needsLogFix = !(state as any)._timerLogsCumulativeFixed2;
  let habitLogs = state.habitLogs.map(l => ({
    ...l,
    status: l.status ?? (l.completed ? 'completed' : 'missed'),
    source: l.source ?? 'manual',
  }));

  if (needsLogFix) {
    // Build a map of timer habits by id
    const timerHabits = new Map<string, { expectedDuration: number; maxDailyReps: number }>();
    for (const h of habits) {
      if (h.expectedDuration) {
        timerHabits.set(h.id, { expectedDuration: h.expectedDuration, maxDailyReps: h.maxDailyReps || Infinity });
      }
    }
    // Group ALL logs for timer habits by habitId + date (regardless of source)
    const timerLogsByKey = new Map<string, typeof habitLogs>();
    for (const log of habitLogs) {
      if (!timerHabits.has(log.habitId)) continue;
      const key = `${log.habitId}|${log.date}`;
      if (!timerLogsByKey.has(key)) timerLogsByKey.set(key, []);
      timerLogsByKey.get(key)!.push(log);
    }
    // For each group, recalculate which logs should be completed
    const fixedIds = new Map<string, boolean>();
    for (const [key, logs] of timerLogsByKey) {
      const habitId = key.split('|')[0];
      const h = timerHabits.get(habitId)!;
      let cumulative = 0;
      let repsEarned = 0;
      for (const log of logs) {
        cumulative += log.duration ?? 0;
        const newReps = Math.floor(cumulative / h.expectedDuration);
        const shouldComplete = newReps > repsEarned && (h.maxDailyReps === Infinity || newReps <= h.maxDailyReps);
        if (shouldComplete) repsEarned = newReps;
        if (log.completed !== shouldComplete) {
          fixedIds.set(log.id, shouldComplete);
        }
      }
    }
    if (fixedIds.size > 0) {
      habitLogs = habitLogs.map(l => fixedIds.has(l.id) ? { ...l, completed: fixedIds.get(l.id)! } : l);
    }
  }

  return {
    ...state,
    _durationMigratedToSecs: true,
    _timerLogsCumulativeFixed2: true,
    habits,
    habitLogs,
    categoryOrder: state.categoryOrder ?? [],
    deletedCategories: state.deletedCategories ?? [],
  };
}

// ── API Helpers (per-collection) ─────────────────────────

async function fetchHabitsFromAPI(): Promise<Habit[] | null> {
  try {
    const res = await fetch('/api/habits');
    if (!res.ok) return null;
    const { data } = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function fetchLogsFromAPI(): Promise<HabitLog[] | null> {
  try {
    const res = await fetch('/api/logs');
    if (!res.ok) return null;
    const { data } = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function fetchTasksFromAPI(): Promise<Task[] | null> {
  try {
    const res = await fetch('/api/tasks');
    if (!res.ok) return null;
    const { data } = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

// Fire-and-forget API calls for mutations (optimistic local updates)
function apiPost(url: string, body: unknown) {
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .catch(() => { /* network error — localStorage has the data */ });
}

function apiPatch(url: string, body: unknown) {
  fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .catch(() => {});
}

function apiDelete(url: string) {
  fetch(url, { method: 'DELETE' }).catch(() => {});
}

// Record a habit change in the history collection
function recordHabitHistory(
  habitId: string,
  changeType: HabitChangeType,
  changes: Record<string, { from: unknown; to: unknown }>,
  snapshot: Partial<Habit>,
) {
  apiPost(`/api/habits/${habitId}/history`, { changeType, changes, snapshot });
}

// Build a field-level diff between old and new habit
function diffHabit(old: Habit, updates: Partial<Habit>): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(updates) as (keyof Habit)[]) {
    if (key === 'id' || key === 'createdAt') continue;
    const oldVal = old[key];
    const newVal = updates[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { from: oldVal, to: newVal };
    }
  }
  return diff;
}

// ── Timer Recovery ────────────────────────────────────────
// On page load: check if a running countdown/pomodoro timer has already ended.
// No need to "recover" elapsed — it's always computed from absolute timestamps.

function recoverTimer(state: AppState): AppState {
  const t = state.activeTimer;
  if (!t || t.state !== 'running') return state;

  // For countdown/pomodoro: check if endsAt has passed
  if (t.endsAt && new Date(t.endsAt).getTime() <= Date.now()) {
    const session = state.timerSessions.find(s => s.id === t.sessionId);
    const endedAt = new Date().toISOString();

    // Auto-log habit session time and check cumulative completion
    let habitLogs = state.habitLogs;
    const linkedHabitId = t.habitId ?? session?.habitId;
    if (linkedHabitId && t.targetDuration) {
      const today = todayString();
      const habit = state.habits.find(h => h.id === linkedHabitId);
      const maxReps = habit?.maxDailyReps || Infinity;
      const habitTarget = habit?.expectedDuration || 0;
      // Per-rep cumulative: check if this session crosses a new completion threshold
      const prevTotal = habitLogs
        .filter(l => l.habitId === linkedHabitId && l.date === today)
        .reduce((sum, l) => sum + (l.duration ?? 0), 0);
      const prevReps = habitTarget > 0 ? Math.floor(prevTotal / habitTarget) : 0;
      const newReps = habitTarget > 0 ? Math.floor((prevTotal + t.targetDuration) / habitTarget) : 0;
      const isCompleted = newReps > prevReps && (maxReps === Infinity || newReps <= maxReps);
      const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      habitLogs = [...habitLogs, {
        id: generateId(),
        habitId: linkedHabitId,
        date: today,
        time: nowTime,
        duration: t.targetDuration,
        note: '',
        reminderUsed: false,
        perceivedDifficulty: 'medium' as const,
        completed: isCompleted,
        source: 'timer' as const,
      }];
    }

    return {
      ...state,
      habitLogs,
      activeTimer: {
        ...t, state: 'completed',
        elapsedMs: t.targetDuration ? t.targetDuration * 1000 : 0,
        remainingMs: 0, endsAt: undefined, pausedAt: undefined,
      },
      timerSessions: state.timerSessions.map(s =>
        s.id === t.sessionId ? { ...s, completed: true, endedAt, duration: t.targetDuration! } : s
      ),
    };
  }

  // For stopwatch or countdown that hasn't ended: nothing to do.
  // Elapsed is computed from startedAt/endsAt on every render.
  return state;
}

// ── Context ────────────────────────────────────────────────

interface AppStore extends AppState {
  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'order'> & { order?: number }) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitArchive: (id: string) => void;
  reorderHabits: (orderedIds: string[]) => void;
  logHabit: (log: Omit<HabitLog, 'id'>) => HabitLog;
  deleteHabitLog: (id: string) => void;
  getHabitLogs: (habitId: string, startDate?: string, endDate?: string) => HabitLog[];
  getHabitStats: (habitId: string) => HabitStats;
  getHabitStreak: (habitId: string) => StreakInfo;
  isHabitCompletedToday: (habitId: string) => boolean;
  getTodayCompletionRate: () => number;

  // Skills
  addSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'archived' | 'totalMinutes' | 'totalSessions'>) => Skill;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  logSkillSession: (session: Omit<SkillSession, 'id'>) => SkillSession;
  deleteSkillSession: (id: string) => void;
  getSkillSessions: (skillId: string, startDate?: string, endDate?: string) => SkillSession[];
  getSkillStats: (skillId: string) => SkillStats;

  // Timers
  startTimer: (session: Omit<TimerSession, 'id' | 'completed' | 'distractionCount' | 'note'>) => string;
  updateActiveTimer: (updates: Partial<ActiveTimer>) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  completeTimer: (sessionId: string, note?: string, productivityRating?: number) => void;
  cancelTimer: () => void;
  addDistraction: () => void;

  // Reminders
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => Reminder;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;

  // Alarms
  addAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt' | 'snoozeCount' | 'status'>) => Alarm;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  triggerAlarm: (id: string) => void;
  snoozeAlarm: (id: string) => void;
  dismissAlarm: (id: string) => void;
  dismissAllAlarms: () => void;

  // Hormones
  logHormone: (log: Omit<HormoneLog, 'id'>) => HormoneLog;
  deleteHormoneLog: (id: string) => void;
  getHormoneLogs: (type?: string, startDate?: string, endDate?: string) => HormoneLog[];

  // Nutrition
  logNutrition: (log: Omit<NutritionLog, 'id'>) => NutritionLog;
  deleteNutritionLog: (id: string) => void;
  logHydration: (date: string, glasses: number, target: number) => void;
  getHydrationForDate: (date: string) => HydrationLog | undefined;
  getNutritionForDate: (date: string) => NutritionLog[];

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'order'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  reorderTasks: (orderedIds: string[]) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'progress'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleGoalMilestone: (goalId: string, milestoneId: string) => void;

  // Mood
  logMood: (entry: Omit<MoodEntry, 'id'>) => MoodEntry;
  getMoodForDate: (date: string) => MoodEntry[];

  // Custom categories
  addCustomCategory: (name: string) => void;
  deleteCustomCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  reorderCategories: (orderedCategories: string[]) => void;

  // Settings
  updateSettings: (updates: Partial<UserSettings>) => void;

  // Bulk / utility
  getLogsForDate: (date: string) => { habits: HabitLog[]; skills: SkillSession[]; hormones: HormoneLog[]; nutrition: NutritionLog[]; mood: MoodEntry[] };
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

// ── Provider ───────────────────────────────────────────────

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);
  const [mounted, setMounted] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    // Load localStorage immediately for fast first paint
    const local = loadState();
    const recovered = recoverTimer(local);
    setState(recovered);
    setMounted(true);

    // Fetch active timer from DB (source of truth for timers)
    fetch('/api/timer').then(r => r.json()).then(res => {
      setState(prev => {
        if (res.data) {
          // DB has an active timer — use it as source of truth
          const withDbTimer = { ...prev, activeTimer: res.data };
          return recoverTimer(withDbTimer);
        } else {
          // DB has no active timer — clear any stale local timer
          if (prev.activeTimer && prev.activeTimer.state !== 'completed') {
            return { ...prev, activeTimer: null };
          }
          return prev;
        }
      });
    }).catch(() => { /* use local state */ });

    // Then load habits, logs & tasks from API for latest data
    Promise.all([fetchHabitsFromAPI(), fetchLogsFromAPI(), fetchTasksFromAPI()]).then(([habits, logs, tasks]) => {
      if ((habits && habits.length > 0) || (logs && logs.length > 0) || (tasks && tasks.length > 0)) {
        setState(prev => {
          const updated = {
            ...prev,
            ...(habits && habits.length > 0 ? { habits } : {}),
            ...(logs && logs.length > 0 ? { habitLogs: logs } : {}),
            ...(tasks && tasks.length > 0 ? { tasks } : {}),
          };
          const normalized = normalizeState(updated);
          saveState(normalized);
          return normalized;
        });
      } else if (recovered.habits.length > 0 || recovered.habitLogs.length > 0 || recovered.tasks.length > 0) {
        // DB is empty but localStorage has data — sync it up
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            habits: recovered.habits,
            habitLogs: recovered.habitLogs,
            tasks: recovered.tasks,
          }),
        }).catch(() => {});
      }
    });
  }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!mounted) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveState(state);
    }, 300);
  }, [state, mounted]);

  const update = useCallback((fn: (prev: AppState) => AppState) => {
    setState(prev => fn(prev));
  }, []);

  // ── Habits ──

  const addHabit = useCallback((data: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'order'> & { order?: number }): Habit => {
    const habit: Habit = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      archived: false,
      order: data.order ?? (stateRef.current.habits.filter(h => !h.archived).length + 1),
      trackingType: data.trackingType ?? 'boolean',
      targetValue: data.targetValue ?? 1,
      targetUnit: data.targetUnit ?? 'times',
      scheduleType: data.scheduleType ?? 'daily',
      allowPartial: data.allowPartial ?? false,
      allowSkip: data.allowSkip ?? false,
    };
    update(s => ({ ...s, habits: [...s.habits, habit] }));
    apiPost('/api/habits', habit);
    recordHabitHistory(habit.id, 'created', {}, { nameEn: habit.nameEn, nameAr: habit.nameAr, category: habit.category, color: habit.color });
    return habit;
  }, [update]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    const oldHabit = stateRef.current.habits.find(h => h.id === id);
    update(s => ({ ...s, habits: s.habits.map(h => h.id === id ? { ...h, ...updates } : h) }));
    // Convert undefined to null so JSON.stringify includes them and DB clears old values
    const apiUpdates: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      apiUpdates[key] = (updates as Record<string, unknown>)[key] ?? null;
    }
    apiPatch(`/api/habits/${id}`, apiUpdates);
    if (oldHabit) {
      const changes = diffHabit(oldHabit, updates);
      if (Object.keys(changes).length > 0) {
        const snapshot = { ...oldHabit, ...updates };
        recordHabitHistory(id, 'edited', changes, snapshot);
      }
    }
  }, [update]);

  // Habits are never truly deleted — only archived
  const deleteHabit = useCallback((id: string) => {
    const habit = stateRef.current.habits.find(h => h.id === id);
    update(s => ({ ...s, habits: s.habits.map(h => h.id === id ? { ...h, archived: true } : h) }));
    apiPatch(`/api/habits/${id}`, { archived: true });
    if (habit) {
      recordHabitHistory(id, 'archived', { archived: { from: false, to: true } }, { ...habit, archived: true });
    }
  }, [update]);

  const toggleHabitArchive = useCallback((id: string) => {
    const habit = stateRef.current.habits.find(h => h.id === id);
    const newArchived = !habit?.archived;
    update(s => ({ ...s, habits: s.habits.map(h => h.id === id ? { ...h, archived: !h.archived } : h) }));
    apiPatch(`/api/habits/${id}`, { archived: newArchived });
    if (habit) {
      recordHabitHistory(id, newArchived ? 'archived' : 'restored',
        { archived: { from: habit.archived, to: newArchived } },
        { ...habit, archived: newArchived });
    }
  }, [update]);

  const reorderHabits = useCallback((orderedIds: string[]) => {
    update(s => ({
      ...s,
      habits: s.habits.map(h => {
        const idx = orderedIds.indexOf(h.id);
        return idx >= 0 ? { ...h, order: idx + 1 } : h;
      }),
    }));
    // Persist order to API for each habit
    orderedIds.forEach((id, idx) => {
      apiPatch(`/api/habits/${id}`, { order: idx + 1 });
    });
  }, [update]);

  const logHabit = useCallback((data: Omit<HabitLog, 'id'>): HabitLog => {
    const log: HabitLog = {
      ...data,
      id: generateId(),
      status: data.status ?? (data.completed ? 'completed' : 'pending'),
      source: data.source ?? 'manual',
    };
    // For simple boolean completions (no value/duration tracking), replace existing log for same habit+date
    // to prevent duplicate entries. Count/duration/timer habits can have multiple logs per day.
    const isSimpleLog = data.value === undefined && data.duration === undefined;
    update(s => {
      const filtered = isSimpleLog
        ? s.habitLogs.filter(l => !(l.habitId === data.habitId && l.date === data.date && l.value === undefined && l.duration === undefined))
        : s.habitLogs;
      return { ...s, habitLogs: [...filtered, log] };
    });
    // Only upsert simple boolean logs; timer/count/duration logs always insert new rows
    apiPost(`/api/habits/${data.habitId}/logs`, { ...log, upsert: isSimpleLog });
    if (data.completed) playHabitDoneSound();
    return log;
  }, [update]);

  const deleteHabitLog = useCallback((id: string) => {
    const log = stateRef.current.habitLogs.find(l => l.id === id);
    update(s => ({ ...s, habitLogs: s.habitLogs.filter(l => l.id !== id) }));
    if (log) {
      apiDelete(`/api/habits/${log.habitId}/logs?logId=${id}`);
      if (log.completed) playHabitUndoneSound();
    }
  }, [update]);

  const getHabitLogs = useCallback((habitId: string, startDate?: string, endDate?: string): HabitLog[] => {
    return stateRef.current.habitLogs.filter(l => {
      if (l.habitId !== habitId) return false;
      if (startDate && l.date < startDate) return false;
      if (endDate && l.date > endDate) return false;
      return true;
    });
  }, []);

  const isHabitCompletedToday = useCallback((habitId: string): boolean => {
    const today = todayString();
    return stateRef.current.habitLogs.some(l => l.habitId === habitId && l.date === today && l.completed);
  }, []);

  const getHabitStreak = useCallback((habitId: string): StreakInfo => {
    const habit = stateRef.current.habits.find(h => h.id === habitId);
    const logs = stateRef.current.habitLogs
      .filter(l => l.habitId === habitId && l.completed)
      .map(l => l.date)
      .sort()
      .reverse();

    if (logs.length === 0) return { current: 0, best: 0, lastCompletedDate: null };

    const uniqueDates = new Set(logs);
    const lastDate = [...uniqueDates][0];
    const today = todayString();

    // Determine which days are scheduled for this habit
    const scheduleDays = habit?.scheduleDays ?? habit?.customDays ?? [];
    const scheduleType = habit?.scheduleType ?? (habit?.frequency === 'custom' ? 'custom' : habit?.frequency === 'weekly' ? 'weekly' : 'daily');
    const isScheduledDay = (dateStr: string) => {
      if (scheduleType === 'daily') return true;
      if (habit?.frequency === 'custom' && habit?.customScheduleType) {
        const d = parseLocalDate(dateStr);
        if (habit.customScheduleType === 'weekdays' && habit.customDays?.length) {
          return habit.customDays.includes(d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6);
        }
        if (habit.customScheduleType === 'monthdays' && habit.customMonthDays?.length) {
          return habit.customMonthDays.includes(d.getDate());
        }
        if (habit.customScheduleType === 'yeardays' && habit.customYearDays?.length) {
          return habit.customYearDays.some(yd => yd.month === d.getMonth() && yd.day === d.getDate());
        }
      }
      if (scheduleType === 'custom' && scheduleDays.length > 0) {
        const dayOfWeek = parseLocalDate(dateStr).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        return scheduleDays.includes(dayOfWeek);
      }
      return true; // weekly/monthly: treat all days as eligible for streak
    };

    // Current streak: go back from today, skip non-scheduled days
    let current = 0;
    const checkDate = parseLocalDate(today);
    for (let i = 0; i < 400; i++) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (isScheduledDay(dateStr)) {
        if (uniqueDates.has(dateStr)) {
          current++;
        } else {
          // Today not done yet is OK, break on first missed scheduled day in the past
          if (dateStr !== today) break;
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const best = Math.max(current, calculateBestStreak([...uniqueDates], isScheduledDay));
    return { current, best, lastCompletedDate: lastDate };
  }, []);

  const getHabitStats = useCallback((habitId: string): HabitStats => {
    const logs = stateRef.current.habitLogs.filter(l => l.habitId === habitId);
    const completedLogs = logs.filter(l => l.completed);
    const streak = getHabitStreak(habitId);

    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    completedLogs.forEach(l => {
      const day = parseLocalDate(l.date).getDay();
      weekdayCounts[day]++;
    });

    const moodsBefore = completedLogs.filter(l => l.moodBefore).map(l => l.moodBefore!);
    const moodsAfter = completedLogs.filter(l => l.moodAfter).map(l => l.moodAfter!);

    const bestDayIdx = weekdayCounts.indexOf(Math.max(...weekdayCounts));
    const worstDayIdx = weekdayCounts.indexOf(Math.min(...weekdayCounts));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const habit = stateRef.current.habits.find(h => h.id === habitId);
    const daysSinceCreation = habit ? Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / 86400000)) : 1;
    const uniqueCompletedDays = new Set(completedLogs.map(l => l.date)).size;

    return {
      totalCompletions: completedLogs.length,
      completionRate: Math.min(100, Math.round((uniqueCompletedDays / daysSinceCreation) * 100)),
      streak,
      averageMoodBefore: moodsBefore.length ? moodsBefore.reduce((a, b) => a + b, 0) / moodsBefore.length : 0,
      averageMoodAfter: moodsAfter.length ? moodsAfter.reduce((a, b) => a + b, 0) / moodsAfter.length : 0,
      bestDay: dayNames[bestDayIdx],
      worstDay: dayNames[worstDayIdx],
      completionsByWeekday: weekdayCounts,
    };
  }, [getHabitStreak]);

  const getTodayCompletionRate = useCallback((): number => {
    const today = todayString();
    const activeHabits = stateRef.current.habits.filter(h => !h.archived);
    if (activeHabits.length === 0) return 0;
    const todayDate = parseLocalDate(today);
    const todayHabits = activeHabits.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'weekly') {
        const dayOfWeek = todayDate.getDay() as number;
        if (h.customDays?.length) return h.customDays.includes(dayOfWeek as any);
        return dayOfWeek === 0;
      }
      if (h.frequency === 'monthly') {
        if (h.customMonthDays?.length) return h.customMonthDays.includes(todayDate.getDate());
        return todayDate.getDate() === 1;
      }
      if (h.frequency === 'custom' && h.customScheduleType) {
        if (h.customScheduleType === 'weekdays' && h.customDays?.length) {
          return h.customDays.includes(todayDate.getDay() as any);
        }
        if (h.customScheduleType === 'monthdays' && h.customMonthDays?.length) {
          return h.customMonthDays.includes(todayDate.getDate());
        }
        if (h.customScheduleType === 'yeardays' && h.customYearDays?.length) {
          return h.customYearDays.some(yd => yd.month === todayDate.getMonth() && yd.day === todayDate.getDate());
        }
      }
      return true;
    });
    if (todayHabits.length === 0) return 0;
    const completed = todayHabits.filter(h =>
      stateRef.current.habitLogs.some(l => l.habitId === h.id && l.date === today && l.completed)
    ).length;
    return Math.round((completed / todayHabits.length) * 100);
  }, []);

  // ── Skills ──

  const addSkill = useCallback((data: Omit<Skill, 'id' | 'createdAt' | 'archived' | 'totalMinutes' | 'totalSessions'>): Skill => {
    const skill: Skill = { ...data, id: generateId(), createdAt: new Date().toISOString(), archived: false, totalMinutes: 0, totalSessions: 0 };
    update(s => ({ ...s, skills: [...s.skills, skill] }));
    return skill;
  }, [update]);

  const updateSkill = useCallback((id: string, updates: Partial<Skill>) => {
    update(s => ({ ...s, skills: s.skills.map(sk => sk.id === id ? { ...sk, ...updates } : sk) }));
  }, [update]);

  const deleteSkill = useCallback((id: string) => {
    update(s => ({ ...s, skills: s.skills.filter(sk => sk.id !== id), skillSessions: s.skillSessions.filter(ss => ss.skillId !== id) }));
  }, [update]);

  const logSkillSession = useCallback((data: Omit<SkillSession, 'id'>): SkillSession => {
    const session: SkillSession = { ...data, id: generateId() };
    update(s => {
      const skill = s.skills.find(sk => sk.id === data.skillId);
      const updatedSkills = skill ? s.skills.map(sk =>
        sk.id === data.skillId ? { ...sk, totalMinutes: sk.totalMinutes + data.duration, totalSessions: sk.totalSessions + 1 } : sk
      ) : s.skills;
      return { ...s, skillSessions: [...s.skillSessions, session], skills: updatedSkills };
    });
    return session;
  }, [update]);

  const deleteSkillSession = useCallback((id: string) => {
    update(s => {
      const session = s.skillSessions.find(ss => ss.id === id);
      if (!session) return s;
      return {
        ...s,
        skillSessions: s.skillSessions.filter(ss => ss.id !== id),
        skills: s.skills.map(sk => sk.id === session.skillId ? { ...sk, totalMinutes: Math.max(0, sk.totalMinutes - session.duration), totalSessions: Math.max(0, sk.totalSessions - 1) } : sk)
      };
    });
  }, [update]);

  const getSkillSessions = useCallback((skillId: string, startDate?: string, endDate?: string): SkillSession[] => {
    return stateRef.current.skillSessions.filter(s => {
      if (s.skillId !== skillId) return false;
      if (startDate && s.date < startDate) return false;
      if (endDate && s.date > endDate) return false;
      return true;
    });
  }, []);

  const getSkillStats = useCallback((skillId: string): SkillStats => {
    const sessions = stateRef.current.skillSessions.filter(s => s.skillId === skillId);
    const totalMin = sessions.reduce((a, s) => a + s.duration, 0);
    const avgLen = sessions.length ? totalMin / sessions.length : 0;
    const avgQ = sessions.length ? sessions.reduce((a, s) => a + s.qualityRating, 0) / sessions.length : 0;
    const avgF = sessions.length ? sessions.reduce((a, s) => a + s.focusRating, 0) / sessions.length : 0;

    const weekdayMin = [0, 0, 0, 0, 0, 0, 0];
    sessions.forEach(s => { weekdayMin[parseLocalDate(s.date).getDay()] += s.duration; });
    const bestDayIdx = weekdayMin.indexOf(Math.max(...weekdayMin));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // weekly hours for last 12 weeks
    const weeklyHours: number[] = [];
    const now = new Date();
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(now);
      const wd = now.getDay(); weekStart.setDate(weekStart.getDate() - (w * 7 + (wd === 0 ? 6 : wd - 1)));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const startStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      const endStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
      const mins = sessions.filter(s => s.date >= startStr && s.date < endStr).reduce((a, s) => a + s.duration, 0);
      weeklyHours.push(Math.round(mins / 60 * 10) / 10);
    }

    return {
      totalHours: Math.round(totalMin / 60 * 10) / 10,
      totalSessions: sessions.length,
      averageSessionLength: Math.round(avgLen),
      averageQuality: Math.round(avgQ * 10) / 10,
      averageFocus: Math.round(avgF * 10) / 10,
      bestDay: dayNames[bestDayIdx],
      growthRate: weeklyHours.length >= 2 ? weeklyHours[weeklyHours.length - 1] - weeklyHours[weeklyHours.length - 2] : 0,
      weeklyHours,
    };
  }, []);

  // ── Timers ──

  const startTimer = useCallback((data: Omit<TimerSession, 'id' | 'completed' | 'distractionCount' | 'note'>): string => {
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const session: TimerSession = { ...data, id: generateId(), completed: false, distractionCount: 0, note: '', events: [{ action: 'start', at: now }] };
    const active: ActiveTimer = {
      sessionId: session.id,
      state: 'running',
      mode: data.mode,
      habitId: data.habitId,
      labelEn: data.labelEn,
      labelAr: data.labelAr,
      startedAt: now,
      endsAt: data.targetDuration ? new Date(nowMs + data.targetDuration * 1000).toISOString() : undefined,
      targetDuration: data.targetDuration,
      habitTargetDuration: data.habitTargetDuration,
      pomodoroPhase: data.mode === 'pomodoro' ? 'work' : undefined,
      pomodoroRound: data.mode === 'pomodoro' ? 1 : undefined,
    };
    update(s => ({ ...s, timerSessions: [...s.timerSessions, session], activeTimer: active }));
    // Persist to DB
    apiPost('/api/timer', active);
    return session.id;
  }, [update]);

  const updateActiveTimer = useCallback((updates: Partial<ActiveTimer>) => {
    update(s => {
      if (!s.activeTimer) return s;
      const now = new Date().toISOString();
      let updatedSessions = s.timerSessions;
      if (updates.state === 'paused' || updates.state === 'running') {
        const action = updates.state === 'paused' ? 'pause' as const : 'resume' as const;
        updatedSessions = s.timerSessions.map(t => t.id === s.activeTimer!.sessionId ? {
          ...t,
          events: [...(t.events || []), { action, at: now }],
          pausedAt: action === 'pause' ? now : t.pausedAt,
          resumedAt: action === 'resume' ? now : t.resumedAt,
          totalPausedTime: action === 'resume' && t.pausedAt
            ? (t.totalPausedTime || 0) + Math.floor((Date.now() - new Date(t.pausedAt).getTime()) / 1000)
            : t.totalPausedTime,
        } : t);
      }
      const newActive = { ...s.activeTimer, ...updates };
      apiPatch('/api/timer', newActive);
      return { ...s, timerSessions: updatedSessions, activeTimer: newActive };
    });
  }, [update]);

  const pauseTimer = useCallback(() => {
    update(s => {
      const t = s.activeTimer;
      if (!t || t.state !== 'running') return s;
      const now = Date.now();
      const nowISO = new Date(now).toISOString();

      let paused: ActiveTimer;
      if (t.mode === 'stopwatch') {
        // Store total elapsed ms
        const elapsedMs = now - new Date(t.startedAt).getTime();
        paused = { ...t, state: 'paused', pausedAt: nowISO, elapsedMs, endsAt: undefined };
      } else {
        // Store remaining ms for countdown/pomodoro
        const remainingMs = t.endsAt ? Math.max(0, new Date(t.endsAt).getTime() - now) : 0;
        paused = { ...t, state: 'paused', pausedAt: nowISO, remainingMs, endsAt: undefined };
      }

      const updatedSessions = s.timerSessions.map(sess => sess.id === t.sessionId ? {
        ...sess,
        events: [...(sess.events || []), { action: 'pause' as const, at: nowISO }],
        pausedAt: nowISO,
      } : sess);

      apiPatch('/api/timer', paused);
      return { ...s, activeTimer: paused, timerSessions: updatedSessions };
    });
  }, [update]);

  const resumeTimer = useCallback(() => {
    update(s => {
      const t = s.activeTimer;
      if (!t || t.state !== 'paused') return s;
      const now = Date.now();
      const nowISO = new Date(now).toISOString();

      let resumed: ActiveTimer;
      if (t.mode === 'stopwatch') {
        // Shift startedAt forward so elapsed = now - startedAt stays correct
        const newStartedAt = new Date(now - (t.elapsedMs ?? 0)).toISOString();
        resumed = { ...t, state: 'running', startedAt: newStartedAt, pausedAt: undefined, elapsedMs: undefined };
      } else {
        // Set new absolute end time from remaining
        const endsAt = new Date(now + (t.remainingMs ?? 0)).toISOString();
        resumed = { ...t, state: 'running', startedAt: nowISO, endsAt, pausedAt: undefined, remainingMs: undefined };
      }

      const updatedSessions = s.timerSessions.map(sess => sess.id === t.sessionId ? {
        ...sess,
        events: [...(sess.events || []), { action: 'resume' as const, at: nowISO }],
        resumedAt: nowISO,
        totalPausedTime: sess.pausedAt
          ? (sess.totalPausedTime || 0) + Math.floor((now - new Date(sess.pausedAt).getTime()) / 1000)
          : sess.totalPausedTime,
      } : sess);

      apiPatch('/api/timer', resumed);
      return { ...s, activeTimer: resumed, timerSessions: updatedSessions };
    });
  }, [update]);

  const completeTimer = useCallback((sessionId: string, note?: string, productivityRating?: number) => {
    const now = new Date().toISOString();
    update(s => {
      const elapsed = computeTimerElapsed(s.activeTimer);
      return {
        ...s,
        timerSessions: s.timerSessions.map(t => t.id === sessionId ? {
          ...t, completed: true, endedAt: now,
          duration: elapsed,
          note: note ?? t.note,
          productivityRating: productivityRating as any ?? t.productivityRating,
          events: [...(t.events || []), { action: 'finish' as const, at: now }],
        } : t),
        activeTimer: null,
      };
    });
    apiDelete('/api/timer');
  }, [update]);

  const cancelTimer = useCallback(() => {
    const now = new Date().toISOString();
    update(s => {
      if (!s.activeTimer) return s;
      const elapsed = computeTimerElapsed(s.activeTimer);
      return {
        ...s,
        timerSessions: s.timerSessions.map(t => t.id === s.activeTimer!.sessionId ? {
          ...t,
          endedAt: now,
          duration: elapsed,
          completed: false,
          events: [...(t.events || []), { action: 'cancel' as const, at: now }],
        } : t),
        activeTimer: null,
      };
    });
    apiDelete('/api/timer');
  }, [update]);

  const addDistraction = useCallback(() => {
    update(s => {
      if (!s.activeTimer) return s;
      return {
        ...s,
        timerSessions: s.timerSessions.map(t => t.id === s.activeTimer!.sessionId ? { ...t, distractionCount: t.distractionCount + 1 } : t)
      };
    });
  }, [update]);

  // ── Reminders ──

  const addReminder = useCallback((data: Omit<Reminder, 'id' | 'createdAt'>): Reminder => {
    const reminder: Reminder = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    update(s => ({ ...s, reminders: [...s.reminders, reminder] }));
    return reminder;
  }, [update]);

  const updateReminder = useCallback((id: string, updates: Partial<Reminder>) => {
    update(s => ({ ...s, reminders: s.reminders.map(r => r.id === id ? { ...r, ...updates } : r) }));
  }, [update]);

  const deleteReminder = useCallback((id: string) => {
    update(s => ({ ...s, reminders: s.reminders.filter(r => r.id !== id) }));
  }, [update]);

  const toggleReminder = useCallback((id: string) => {
    update(s => ({ ...s, reminders: s.reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) }));
  }, [update]);

  // ── Alarms ──

  const addAlarm = useCallback((data: Omit<Alarm, 'id' | 'createdAt' | 'snoozeCount' | 'status'>): Alarm => {
    const alarm: Alarm = { ...data, id: generateId(), createdAt: new Date().toISOString(), snoozeCount: 0, status: 'idle' };
    update(s => ({ ...s, alarms: [...s.alarms, alarm] }));
    return alarm;
  }, [update]);

  const updateAlarm = useCallback((id: string, updates: Partial<Alarm>) => {
    update(s => ({ ...s, alarms: s.alarms.map(a => a.id === id ? { ...a, ...updates } : a) }));
  }, [update]);

  const deleteAlarm = useCallback((id: string) => {
    update(s => ({ ...s, alarms: s.alarms.filter(a => a.id !== id) }));
  }, [update]);

  const toggleAlarm = useCallback((id: string) => {
    update(s => ({ ...s, alarms: s.alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled, status: 'idle' as AlarmStatus, snoozeCount: 0 } : a) }));
  }, [update]);

  const triggerAlarm = useCallback((id: string) => {
    update(s => ({ ...s, alarms: s.alarms.map(a => a.id === id ? { ...a, status: 'ringing' as AlarmStatus, lastTriggered: new Date().toISOString() } : a) }));
  }, [update]);

  const snoozeAlarm = useCallback((id: string) => {
    update(s => ({
      ...s,
      alarms: s.alarms.map(a => {
        if (a.id !== id) return a;
        if (a.snoozeCount >= a.maxSnoozes) return { ...a, status: 'idle' as AlarmStatus, snoozeCount: 0 };
        return { ...a, status: 'snoozed' as AlarmStatus, snoozeCount: a.snoozeCount + 1, lastTriggered: new Date().toISOString() };
      }),
    }));
  }, [update]);

  const dismissAlarm = useCallback((id: string) => {
    update(s => ({ ...s, alarms: s.alarms.map(a => a.id === id ? { ...a, status: 'idle' as AlarmStatus, snoozeCount: 0 } : a) }));
  }, [update]);

  const dismissAllAlarms = useCallback(() => {
    update(s => ({ ...s, alarms: s.alarms.map(a => a.status !== 'idle' ? { ...a, status: 'idle' as AlarmStatus, snoozeCount: 0 } : a) }));
  }, [update]);

  // ── Hormones ──

  const logHormone = useCallback((data: Omit<HormoneLog, 'id'>): HormoneLog => {
    const log: HormoneLog = { ...data, id: generateId() };
    update(s => ({ ...s, hormoneLogs: [...s.hormoneLogs, log] }));
    return log;
  }, [update]);

  const deleteHormoneLog = useCallback((id: string) => {
    update(s => ({ ...s, hormoneLogs: s.hormoneLogs.filter(l => l.id !== id) }));
  }, [update]);

  const getHormoneLogs = useCallback((type?: string, startDate?: string, endDate?: string): HormoneLog[] => {
    return stateRef.current.hormoneLogs.filter(l => {
      if (type && l.type !== type) return false;
      if (startDate && l.date < startDate) return false;
      if (endDate && l.date > endDate) return false;
      return true;
    });
  }, []);

  // ── Nutrition ──

  const logNutrition = useCallback((data: Omit<NutritionLog, 'id'>): NutritionLog => {
    const log: NutritionLog = { ...data, id: generateId() };
    update(s => ({ ...s, nutritionLogs: [...s.nutritionLogs, log] }));
    return log;
  }, [update]);

  const deleteNutritionLog = useCallback((id: string) => {
    update(s => ({ ...s, nutritionLogs: s.nutritionLogs.filter(l => l.id !== id) }));
  }, [update]);

  const logHydration = useCallback((date: string, glasses: number, target: number) => {
    update(s => {
      const existing = s.hydrationLogs.findIndex(h => h.date === date);
      if (existing >= 0) {
        const updated = [...s.hydrationLogs];
        updated[existing] = { ...updated[existing], glasses, target };
        return { ...s, hydrationLogs: updated };
      }
      return { ...s, hydrationLogs: [...s.hydrationLogs, { id: generateId(), date, glasses, target }] };
    });
  }, [update]);

  const getHydrationForDate = useCallback((date: string) => {
    return stateRef.current.hydrationLogs.find(h => h.date === date);
  }, []);

  const getNutritionForDate = useCallback((date: string) => {
    return stateRef.current.nutritionLogs.filter(n => n.date === date);
  }, []);

  // ── Tasks ──

  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'order'>): Task => {
    const task: Task = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      order: stateRef.current.tasks.length + 1,
    };
    update(s => ({ ...s, tasks: [...s.tasks, task] }));
    apiPost('/api/tasks', task);
    return task;
  }, [update]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    update(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t) }));
    apiPatch(`/api/tasks/${id}`, updates);
  }, [update]);

  const deleteTask = useCallback((id: string) => {
    update(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }));
    apiDelete(`/api/tasks/${id}`);
  }, [update]);

  const toggleTaskStatus = useCallback((id: string) => {
    let updatedFields: Partial<Task> = {};
    update(s => ({
      ...s,
      tasks: s.tasks.map(t => {
        if (t.id !== id) return t;
        const newStatus = t.status === 'completed' ? 'todo' : 'completed';
        updatedFields = {
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
        return { ...t, ...updatedFields };
      }),
    }));
    apiPatch(`/api/tasks/${id}`, updatedFields);
  }, [update]);

  const reorderTasks = useCallback((orderedIds: string[]) => {
    update(s => ({
      ...s,
      tasks: s.tasks.map(t => {
        const idx = orderedIds.indexOf(t.id);
        return idx >= 0 ? { ...t, order: idx + 1 } : t;
      }),
    }));
    // Sync all reordered tasks
    const current = stateRef.current.tasks;
    orderedIds.forEach((id, idx) => {
      const task = current.find(t => t.id === id);
      if (task) apiPatch(`/api/tasks/${id}`, { order: idx + 1 });
    });
  }, [update]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    let updatedSubtasks: Task['subtasks'];
    update(s => ({
      ...s,
      tasks: s.tasks.map(t => {
        if (t.id !== taskId || !t.subtasks) return t;
        updatedSubtasks = t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
        return {
          ...t,
          subtasks: updatedSubtasks,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    apiPatch(`/api/tasks/${taskId}`, { subtasks: updatedSubtasks });
  }, [update]);

  // ── Goals ──

  const addGoal = useCallback((data: Omit<Goal, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'progress'>): Goal => {
    const goal: Goal = { ...data, id: generateId(), createdAt: new Date().toISOString(), completed: false, completedAt: undefined, progress: 0 };
    update(s => ({ ...s, goals: [...s.goals, goal] }));
    return goal;
  }, [update]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    update(s => ({ ...s, goals: s.goals.map(g => g.id === id ? { ...g, ...updates } : g) }));
  }, [update]);

  const deleteGoal = useCallback((id: string) => {
    update(s => ({ ...s, goals: s.goals.filter(g => g.id !== id) }));
  }, [update]);

  const toggleGoalMilestone = useCallback((goalId: string, milestoneId: string) => {
    update(s => ({
      ...s,
      goals: s.goals.map(g => {
        if (g.id !== goalId) return g;
        const milestones = g.milestones.map(m =>
          m.id === milestoneId ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined } : m
        );
        const completedCount = milestones.filter(m => m.completed).length;
        const progress = milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0;
        const completed = progress === 100;
        return { ...g, milestones, progress, completed, completedAt: completed ? new Date().toISOString() : undefined };
      })
    }));
  }, [update]);

  // ── Mood ──

  const logMood = useCallback((data: Omit<MoodEntry, 'id'>): MoodEntry => {
    const entry: MoodEntry = { ...data, id: generateId() };
    update(s => ({ ...s, moodEntries: [...s.moodEntries, entry] }));
    return entry;
  }, [update]);

  const getMoodForDate = useCallback((date: string) => {
    return stateRef.current.moodEntries.filter(m => m.date === date);
  }, []);

  // ── Custom Categories ──

  const addCustomCategory = useCallback((name: string) => {
    update(s => s.customCategories.includes(name) ? s : { ...s, customCategories: [...s.customCategories, name] });
  }, [update]);

  const deleteCustomCategory = useCallback((name: string) => {
    update(s => ({
      ...s,
      customCategories: s.customCategories.filter(c => c !== name),
      deletedCategories: s.deletedCategories?.includes(name) ? s.deletedCategories : [...(s.deletedCategories ?? []), name],
      categoryOrder: (s.categoryOrder ?? []).filter(c => c !== name),
    }));
  }, [update]);

  const renameCategory = useCallback((oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    update(s => ({
      ...s,
      habits: s.habits.map(h => h.category === oldName ? { ...h, category: newName } : h),
      customCategories: s.customCategories.map(c => c === oldName ? newName : c),
      categoryOrder: (s.categoryOrder ?? []).map(c => c === oldName ? newName : c),
      deletedCategories: (s.deletedCategories ?? []).filter(c => c !== oldName),
    }));
  }, [update]);

  const reorderCategories = useCallback((orderedCategories: string[]) => {
    update(s => ({ ...s, categoryOrder: orderedCategories }));
  }, [update]);

  // ── Settings ──

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    update(s => ({ ...s, settings: { ...s.settings, ...updates } }));
  }, [update]);

  // ── Utility ──

  const getLogsForDate = useCallback((date: string) => ({
    habits: stateRef.current.habitLogs.filter(l => l.date === date),
    skills: stateRef.current.skillSessions.filter(s => s.date === date),
    hormones: stateRef.current.hormoneLogs.filter(l => l.date === date),
    nutrition: stateRef.current.nutritionLogs.filter(n => n.date === date),
    mood: stateRef.current.moodEntries.filter(m => m.date === date),
  }), []);

  const exportData = useCallback((): string => {
    return JSON.stringify(stateRef.current, null, 2);
  }, []);

  const importData = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json);
      setState({ ...DEFAULT_APP_STATE, ...data });
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetData = useCallback(() => {
    setState(DEFAULT_APP_STATE);
  }, []);

  const store: AppStore = {
    ...state,
    addHabit, updateHabit, deleteHabit, toggleHabitArchive, reorderHabits,
    logHabit, deleteHabitLog, getHabitLogs, getHabitStats, getHabitStreak,
    isHabitCompletedToday, getTodayCompletionRate,
    addSkill, updateSkill, deleteSkill,
    logSkillSession, deleteSkillSession, getSkillSessions, getSkillStats,
    startTimer, updateActiveTimer, pauseTimer, resumeTimer, completeTimer, cancelTimer, addDistraction,
    addReminder, updateReminder, deleteReminder, toggleReminder,
    addAlarm, updateAlarm, deleteAlarm, toggleAlarm, triggerAlarm, snoozeAlarm, dismissAlarm, dismissAllAlarms,
    logHormone, deleteHormoneLog, getHormoneLogs,
    logNutrition, deleteNutritionLog, logHydration, getHydrationForDate, getNutritionForDate,
    addTask, updateTask, deleteTask, toggleTaskStatus, reorderTasks, toggleSubtask,
    addGoal, updateGoal, deleteGoal, toggleGoalMilestone,
    logMood, getMoodForDate,
    addCustomCategory, deleteCustomCategory, renameCategory, reorderCategories,
    updateSettings,
    getLogsForDate, exportData, importData, resetData,
  };

  return (
    <AppStoreContext.Provider value={store}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}

// ── Helpers ──

function calculateBestStreak(sortedDatesDesc: string[], isScheduledDay?: (d: string) => boolean): number {
  if (sortedDatesDesc.length === 0) return 0;
  const completedSet = new Set(sortedDatesDesc);
  const sorted = [...sortedDatesDesc].sort();
  const firstDate = new Date(sorted[0]);
  const lastDate = new Date(sorted[sorted.length - 1]);

  let best = 0;
  let current = 0;
  const checkDate = new Date(firstDate);

  // Walk through every day from first completion to last
  while (checkDate <= lastDate) {
    const ds = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    const scheduled = isScheduledDay ? isScheduledDay(ds) : true;
    if (scheduled) {
      if (completedSet.has(ds)) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    // Non-scheduled days don't affect streak
    checkDate.setDate(checkDate.getDate() + 1);
  }
  return best;
}
