'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import {
  Habit, HabitLog, DEFAULT_HABIT_CATEGORIES, HabitCategory, HabitFrequency,
  HabitType, Priority, Difficulty, todayString, generateId, ITEM_COLORS,
  WeekDay, formatDuration, formatTimerDuration,
} from '@/types/app';
import {
  Plus, CheckCircle2, Circle, Flame, Filter, Search, X, Archive,
  MoreHorizontal, Trash2, Edit3, Eye, ChevronDown, Calendar as CalendarIcon,
  TrendingUp, Target, Clock, Star, BarChart3, Table2, ListChecks, PieChart,
  ChevronLeft, ChevronRight, RotateCcw, Zap, Award, Hash, Trophy, Activity,
  Sparkles, ArrowRight, Play, Pause, Square, Timer, MapPin, Repeat, Gift,
  Lightbulb, Maximize2, Hourglass, LayoutGrid, List, Columns3, Grid3x3,
  CreditCard,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
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

function getHabitTimeStats(habitId: string, logs: HabitLog[]) {
  const completed = logs.filter(l => l.habitId === habitId && l.completed);
  const now = new Date();
  const todayStr = todayString();

  // Week start (Sunday)
  const ws = new Date(now); ws.setDate(ws.getDate() - ws.getDay());
  const weekStart = ws.toISOString().split('T')[0];
  // Month start
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  // Year start
  const yearStart = `${now.getFullYear()}-01-01`;

  const thisWeek = completed.filter(l => l.date >= weekStart && l.date <= todayStr);
  const thisMonth = completed.filter(l => l.date >= monthStart && l.date <= todayStr);
  const thisYear = completed.filter(l => l.date >= yearStart && l.date <= todayStr);

  const sumMin = (arr: HabitLog[]) => arr.reduce((s, l) => s + (l.duration ?? 0), 0);

  return {
    reps: { week: thisWeek.length, month: thisMonth.length, year: thisYear.length, total: completed.length },
    mins: { today: sumMin(completed.filter(l => l.date === todayStr)), week: sumMin(thisWeek), month: sumMin(thisMonth), year: sumMin(thisYear), total: sumMin(completed) },
  };
}

function formatMins(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

// Returns 'green' | 'orange' | 'red' | 'none' based on time window
// green = done in window, orange = done outside window, red = not done, none = no window set
type CompletionColor = 'green' | 'orange' | 'red' | 'none';

function getCompletionColor(habit: Habit, log: HabitLog | undefined): CompletionColor {
  if (!log || !log.completed) {
    return habit.windowStart && habit.windowEnd ? 'red' : 'none';
  }
  if (!habit.windowStart || !habit.windowEnd) return 'green'; // no window = always green when done
  const logTime = log.time; // HH:mm
  if (logTime >= habit.windowStart && logTime <= habit.windowEnd) return 'green';
  return 'orange';
}

// Helper to extract the active habit timer from the store
function useStoreHabitTimer(store: ReturnType<typeof useAppStore>) {
  const active = store.activeTimer;
  const currentSession = active ? store.timerSessions.find(t => t.id === active.sessionId) : null;
  const activeHabitId = currentSession?.type === 'habit-linked' ? currentSession.habitId ?? null : null;
  const running = active?.state === 'running';
  const paused = active?.state === 'paused';
  const elapsed = active?.elapsed ?? 0;
  const hasActiveTimer = !!active && active.state !== 'completed';

  return { activeHabitId, running, paused, elapsed, hasActiveTimer, currentSession };
}

// Per-habit timer state & actions — used by all view components
function useHabitTimer(habit: Habit, store: ReturnType<typeof useAppStore>) {
  const active = store.activeTimer;
  const currentSession = active ? store.timerSessions.find(t => t.id === active.sessionId) : null;
  const activeHabitId = currentSession?.type === 'habit-linked' ? currentSession.habitId ?? null : null;
  const isMyTimer = activeHabitId === habit.id;
  const hasActiveTimer = !!active && active.state !== 'completed';
  const anotherRunning = hasActiveTimer && !isMyTimer;
  const running = isMyTimer && active?.state === 'running';
  const paused = isMyTimer && active?.state === 'paused';
  const elapsed = isMyTimer ? (active?.elapsed ?? 0) : 0;
  const hasDuration = !!habit.expectedDuration;
  const targetSecs = hasDuration ? habit.expectedDuration! * 60 : 0;

  const start = () => {
    if (anotherRunning) return;
    store.startTimer({
      type: 'habit-linked', mode: hasDuration ? 'countdown' : 'stopwatch',
      habitId: habit.id, labelEn: habit.nameEn, labelAr: habit.nameAr,
      startedAt: new Date().toISOString(), duration: 0,
      targetDuration: hasDuration ? targetSecs : undefined,
    });
  };
  const pause = () => store.updateActiveTimer({ state: 'paused' });
  const resume = () => store.updateActiveTimer({ state: 'running' });
  const cancel = () => store.cancelTimer();
  const stop = (today: string, done: boolean) => {
    if (!currentSession) return;
    const secs = elapsed;
    if (secs > 0 && !hasDuration && !done && !habit.archived) {
      store.logHabit({
        habitId: habit.id, date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: Math.max(1, Math.round(secs / 60)),
        note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: true,
      });
    }
    store.completeTimer(currentSession.id);
  };

  return { isMyTimer, anotherRunning, running, paused, elapsed, targetSecs, hasDuration, start, pause, resume, cancel, stop };
}

// Compact timer controls — reusable across all views
function HabitTimerControls({ habit, isAr, store, today, done, size = 'sm' }: {
  habit: Habit; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string; done: boolean; size?: 'sm' | 'xs';
}) {
  const t = useHabitTimer(habit, store);
  if (habit.archived) return null;

  const btnCls = size === 'xs' ? 'py-1 px-1.5 text-[8px] rounded-md gap-1' : 'py-1 px-2 text-[9px] rounded-lg gap-1';
  const iconCls = size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const remaining = t.hasDuration && t.isMyTimer ? Math.max(0, t.targetSecs - t.elapsed) : 0;
  const progress = t.hasDuration && t.isMyTimer && t.targetSecs > 0 ? Math.min(1, t.elapsed / t.targetSecs) : 0;

  return (
    <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
      {/* Timer display when active */}
      {t.isMyTimer && (t.running || t.paused) && (
        <div className="flex items-center gap-1.5">
          <Timer className={cn(iconCls, t.running ? 'text-[var(--color-primary)] animate-pulse' : 'text-[var(--foreground)]/40')} />
          <span className="text-[10px] font-mono font-bold" style={{ color: habit.color }}>
            {t.hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(t.elapsed)}
          </span>
        </div>
      )}
      {/* Progress bar */}
      {t.hasDuration && t.isMyTimer && t.elapsed > 0 && (
        <div className="h-1 rounded-full bg-[var(--foreground)]/[0.08] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%`, background: habit.color }} />
        </div>
      )}
      {/* Buttons */}
      <div className="flex items-center gap-1">
        {!t.isMyTimer && (
          <button onClick={() => t.start()}
            disabled={t.anotherRunning}
            className={cn('flex items-center font-semibold text-white', btnCls,
              t.anotherRunning && 'opacity-40 cursor-not-allowed')}
            style={{ background: habit.color }}>
            <Play className={iconCls} /> {isAr ? 'ابدأ' : 'Start'}
          </button>
        )}
        {t.running && (
          <>
            <button onClick={() => t.pause()} className={cn('flex items-center font-semibold bg-amber-500/15 text-amber-600', btnCls)}>
              <Pause className={iconCls} />
            </button>
            {!t.hasDuration && (
              <button onClick={() => t.stop(today, done)} className={cn('flex items-center font-semibold bg-emerald-500/15 text-emerald-600', btnCls)}>
                <Square className={iconCls} /> {isAr ? 'إنهاء' : 'Stop'}
              </button>
            )}
          </>
        )}
        {t.paused && (
          <>
            <button onClick={() => t.resume()} className={cn('flex items-center font-semibold', btnCls)}
              style={{ background: `${habit.color}15`, color: habit.color }}>
              <Play className={iconCls} />
            </button>
            {!t.hasDuration && (
              <button onClick={() => t.stop(today, done)} className={cn('flex items-center font-semibold bg-emerald-500/15 text-emerald-600', btnCls)}>
                <CheckCircle2 className={iconCls} />
              </button>
            )}
            <button onClick={() => t.cancel()} className={cn('flex items-center font-semibold bg-red-500/10 text-red-500', btnCls)}>
              <X className={iconCls} />
            </button>
          </>
        )}
        {!t.isMyTimer && t.anotherRunning && !done && (
          <span className="text-[7px] text-amber-500 font-medium">{isAr ? 'مؤقت آخر' : 'Busy'}</span>
        )}
      </div>
    </div>
  );
}

export default function HabitsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();

  const ht = useStoreHabitTimer(store);

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
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [showFullTable, setShowFullTable] = useState(false);
  const [fullCalendarHabit, setFullCalendarHabit] = useState<Habit | null>(null);
  const [activeTab, setActiveTab] = useState<'habits' | 'insights'>('habits');
  const [viewMode, setViewMode] = useState<'cards' | 'grid' | 'list' | 'board' | 'minimal'>('cards');

  // Auto-complete: when timed habit timer reaches expectedDuration, auto-log
  const autoCompleteRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ht.activeHabitId || !ht.running) return;
    const habit = store.habits.find(h => h.id === ht.activeHabitId);
    if (!habit?.expectedDuration) return;
    const targetSecs = habit.expectedDuration * 60;
    if (ht.elapsed >= targetSecs && autoCompleteRef.current !== ht.activeHabitId) {
      autoCompleteRef.current = ht.activeHabitId;
      const durationMin = Math.max(1, Math.round(ht.elapsed / 60));
      const alreadyDone = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
      if (!alreadyDone) {
        store.logHabit({
          habitId: habit.id, date: today,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          duration: durationMin,
          note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true,
        });
      }
      // Complete the timer session in the store
      if (ht.currentSession) {
        store.completeTimer(ht.currentSession.id);
      }
    }
  }, [ht.elapsed, ht.activeHabitId, ht.running, store, today]);

  // Form state
  const [formData, setFormData] = useState({
    nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
    category: 'health' as HabitCategory,
    frequency: 'daily' as HabitFrequency,
    customDays: [] as WeekDay[],
    priority: 'medium' as Priority,
    difficulty: 'medium' as Difficulty,
    color: ITEM_COLORS[0],
    icon: 'Activity',
    type: 'positive' as HabitType,
    reminderEnabled: false,
    reminderTime: '08:00',
    image: '' as string,
    cueEn: '', cueAr: '', routineEn: '', routineAr: '', rewardEn: '', rewardAr: '',
    placeEn: '', placeAr: '', preferredTime: '', expectedDuration: '' as string | number,
    windowStart: '', windowEnd: '',
  });

  const resetForm = () => {
    setFormData({
      nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
      category: 'health', frequency: 'daily', customDays: [],
      priority: 'medium', difficulty: 'medium', color: ITEM_COLORS[0],
      icon: 'Activity', type: 'positive', reminderEnabled: false, reminderTime: '08:00',
      image: '',
      cueEn: '', cueAr: '', routineEn: '', routineAr: '', rewardEn: '', rewardAr: '',
      placeEn: '', placeAr: '', preferredTime: '', expectedDuration: '',
      windowStart: '', windowEnd: '',
    });
    setEditingHabit(null);
  };

  const openEdit = (habit: Habit) => {
    setFormData({
      nameEn: habit.nameEn, nameAr: habit.nameAr,
      descriptionEn: habit.descriptionEn, descriptionAr: habit.descriptionAr,
      category: habit.category, frequency: habit.frequency,
      customDays: habit.customDays ?? [],
      priority: habit.priority, difficulty: habit.difficulty,
      color: habit.color, icon: habit.icon, type: habit.type,
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
    });
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.nameEn && !formData.nameAr) return;
    const data = {
      ...formData,
      expectedDuration: formData.expectedDuration ? Number(formData.expectedDuration) : undefined,
      windowStart: formData.windowStart || undefined,
      windowEnd: formData.windowEnd || undefined,
    };
    if (editingHabit) {
      store.updateHabit(editingHabit.id, data);
    } else {
      store.addHabit(data);
    }
    setShowForm(false);
    resetForm();
  };

  const filteredHabits = useMemo(() => {
    return store.habits.filter(h => {
      if (h.archived !== showArchived) return false;
      if (filterCategory !== 'all' && h.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return h.nameEn.toLowerCase().includes(q) || h.nameAr.includes(q);
      }
      return true;
    });
  }, [store.habits, showArchived, filterCategory, searchQuery]);

  const activeHabitsCount = store.habits.filter(h => !h.archived).length;
  const completedTodayCount = store.habits.filter(h =>
    !h.archived && store.habitLogs.some(l => l.habitId === h.id && l.date === today && l.completed)
  ).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'العادات' : 'Habits'}</h1>
          <p className="text-sm text-[var(--foreground)]/70 mt-1">
            {isAr
              ? `${completedTodayCount} من ${activeHabitsCount} مكتملة اليوم`
              : `${completedTodayCount} of ${activeHabitsCount} completed today`}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="app-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm"
        >
          <Plus className="h-4 w-4" /> {isAr ? 'عادة جديدة' : 'New Habit'}
        </button>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex items-center gap-1 mb-6 border-b border-[var(--foreground)]/[0.08]">
        {([
          { key: 'habits' as const, labelEn: 'My Habits', labelAr: 'عاداتي', icon: ListChecks },
          { key: 'insights' as const, labelEn: 'Insights', labelAr: 'التحليلات', icon: PieChart },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]/80'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {isAr ? tab.labelAr : tab.labelEn}
            {activeTab === tab.key && (
              <motion.div layoutId="habits-tab" className="absolute bottom-0 inset-x-0 h-0.5 bg-[var(--color-primary)] rounded-full" />
            )}
          </button>
        ))}
      </motion.div>

      {activeTab === 'habits' ? (
        <>
          {/* Stats Bar */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="grid grid-cols-3 gap-3 mb-6">
            {[
              { labelEn: 'Active', labelAr: 'نشطة', value: activeHabitsCount, icon: Target, color: 'text-blue-500 bg-blue-500/10' },
              { labelEn: 'Today', labelAr: 'اليوم', value: `${completedTodayCount}/${activeHabitsCount}`, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
              { labelEn: 'Archived', labelAr: 'مؤرشفة', value: store.habits.filter(h => h.archived).length, icon: Archive, color: 'text-amber-500 bg-amber-500/10' },
            ].map((s, i) => (
              <div key={i} className="app-stat-card rounded-xl p-3 flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', s.color.split(' ')[1])}>
                  <s.icon className={cn('h-4 w-4', s.color.split(' ')[0])} />
                </div>
                <div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-[var(--foreground)]/60">{isAr ? s.labelAr : s.labelEn}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="app-card rounded-xl p-2 flex flex-wrap gap-2 mb-6 relative z-[100]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/30" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث...' : 'Search...'}
                className="app-input w-full rounded-xl bg-transparent ps-9 pe-3 py-2 text-sm placeholder:text-[var(--foreground)]/30" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="app-input rounded-xl bg-transparent px-3 py-2 text-sm">
              <option value="all">{isAr ? 'كل الفئات' : 'All Categories'}</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c)}</option>
              ))}
            </select>
            <div className="relative z-[100]">
              <button onClick={() => setShowCategoryManager(!showCategoryManager)}
                className={cn('rounded-xl border px-2.5 py-2 text-sm transition-all',
                  showCategoryManager ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--foreground)]/[0.12] text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.06]')}
                title={isAr ? 'إدارة الفئات' : 'Manage Categories'}>
                <Plus className="h-4 w-4" />
              </button>
              {/* Category manager popover */}
              <AnimatePresence>
                {showCategoryManager && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute top-full mt-2 end-0 z-50 w-64 rounded-xl border border-[var(--foreground)]/[0.12] bg-[var(--color-background)] shadow-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold">{isAr ? 'إدارة الفئات' : 'Manage Categories'}</h4>
                      <button onClick={() => setShowCategoryManager(false)} className="h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.08]">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Add new */}
                    <div className="flex gap-1.5 mb-3">
                      <input
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newCategoryName.trim()) {
                            store.addCustomCategory(newCategoryName.trim());
                            setNewCategoryName('');
                          }
                        }}
                        placeholder={isAr ? 'اسم الفئة...' : 'Category name...'}
                        className="app-input flex-1 rounded-lg bg-transparent px-2.5 py-1.5 text-xs"
                      />
                      <button
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            store.addCustomCategory(newCategoryName.trim());
                            setNewCategoryName('');
                          }
                        }}
                        disabled={!newCategoryName.trim()}
                        className="app-btn-primary rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Custom categories list */}
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                      {(store.customCategories ?? []).length === 0 && (
                        <p className="text-[10px] text-[var(--foreground)]/40 text-center py-2">{isAr ? 'لا توجد فئات مخصصة' : 'No custom categories'}</p>
                      )}
                      {(store.customCategories ?? []).map(c => {
                        const usedCount = store.habits.filter(h => h.category === c).length;
                        return (
                          <div key={c} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-[var(--foreground)]/[0.03] hover:bg-[var(--foreground)]/[0.06] transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-medium truncate">{c}</span>
                              {usedCount > 0 && (
                                <span className="text-[9px] text-[var(--foreground)]/40 shrink-0">{usedCount}</span>
                              )}
                            </div>
                            <button onClick={() => store.deleteCustomCategory(c)}
                              className="h-5 w-5 rounded flex items-center justify-center shrink-0 hover:bg-red-500/10 transition-colors"
                              title={isAr ? 'حذف' : 'Delete'}>
                              <Trash2 className="h-3 w-3 text-red-500/60" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setShowArchived(!showArchived)}
              className={cn('rounded-xl border px-3 py-2 text-sm transition-all',
                showArchived ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--foreground)]/[0.12] text-[var(--foreground)]/70')}>
              <Archive className="h-4 w-4" />
            </button>
            <button onClick={() => setShowFullTable(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--foreground)]/[0.12] px-3 py-2 text-sm text-[var(--foreground)]/70 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all">
              <Table2 className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">{isAr ? 'جدول الالتزام' : 'Compliance'}</span>
            </button>

            {/* View mode switcher */}
            <div className="flex items-center rounded-xl border border-[var(--foreground)]/[0.12] overflow-hidden">
              {([
                { key: 'cards' as const, icon: CreditCard, tipEn: 'Cards', tipAr: 'بطاقات' },
                { key: 'grid' as const, icon: LayoutGrid, tipEn: 'Grid', tipAr: 'شبكة' },
                { key: 'list' as const, icon: List, tipEn: 'List', tipAr: 'قائمة' },
                { key: 'board' as const, icon: Columns3, tipEn: 'Board', tipAr: 'لوحة' },
                { key: 'minimal' as const, icon: Grid3x3, tipEn: 'Minimal', tipAr: 'مختصر' },
              ] as const).map((v) => (
                <button key={v.key} onClick={() => setViewMode(v.key)}
                  title={isAr ? v.tipAr : v.tipEn}
                  className={cn(
                    'flex items-center justify-center h-[38px] w-[38px] transition-all',
                    viewMode === v.key
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.06]'
                  )}>
                  <v.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Habits — view modes */}
          {viewMode === 'cards' && (
            <motion.div initial="hidden" animate="visible" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredHabits.map((habit, i) => (
                  <HabitFlipCard key={habit.id} habit={habit} index={i} isAr={isAr} store={store} today={today}
                    onEdit={() => openEdit(habit)} onArchive={() => store.toggleHabitArchive(habit.id)} onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {viewMode === 'grid' && (
            <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredHabits.map((habit, i) => (
                <HabitGridCard key={habit.id} habit={habit} index={i} isAr={isAr} store={store} today={today}
                  onEdit={() => openEdit(habit)} onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} />
              ))}
            </motion.div>
          )}

          {viewMode === 'list' && (
            <motion.div initial="hidden" animate="visible" className="space-y-2">
              {filteredHabits.map((habit, i) => (
                <HabitListRow key={habit.id} habit={habit} index={i} isAr={isAr} store={store} today={today}
                  onEdit={() => openEdit(habit)} onArchive={() => store.toggleHabitArchive(habit.id)} onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} />
              ))}
            </motion.div>
          )}

          {viewMode === 'board' && (
            <HabitBoardView habits={filteredHabits} isAr={isAr} store={store} today={today}
              onEdit={(h) => openEdit(h)} onDelete={(h) => store.deleteHabit(h.id)} onDetail={(h) => setDetailHabit(h)} />
          )}

          {viewMode === 'minimal' && (
            <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredHabits.map((habit, i) => (
                <HabitMinimalCard key={habit.id} habit={habit} index={i} isAr={isAr} store={store} today={today}
                  onToggle={() => {
                    if (habit.expectedDuration) return; // timed habits can only be completed via timer
                    const existingLog = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);
                    if (existingLog) { store.deleteHabitLog(existingLog.id); }
                    else { store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true }); }
                  }}
                  onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} />
              ))}
            </motion.div>
          )}
        </>
      ) : (
        <HabitsInsights isAr={isAr} store={store} />
      )}

          {filteredHabits.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--foreground)]/[0.06]">
                <Target className="h-8 w-8 text-[var(--foreground)]/40" />
              </div>
              <p className="text-sm text-[var(--foreground)]/60 mb-4">
                {showArchived
                  ? (isAr ? 'لا توجد عادات مؤرشفة' : 'No archived habits')
                  : (isAr ? 'لا توجد عادات بعد. أنشئ عادتك الأولى!' : 'No habits yet. Create your first one!')}
              </p>
              {!showArchived && (
                <button onClick={() => { resetForm(); setShowForm(true); }}
                  className="app-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white">
                  <Plus className="h-4 w-4" /> {isAr ? 'إضافة عادة' : 'Add Habit'}
                </button>
              )}
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
              className="fixed inset-x-4 top-[5%] sm:top-[10%] z-[var(--z-modal)] sm:w-[540px] sm:inset-x-0 sm:mx-auto max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.12] shadow-2xl"
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

              <div className="p-5 space-y-5">
                {/* Name fields */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">
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
                    <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">
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
                    <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">
                      {isAr ? 'الفئة' : 'Category'}
                    </label>
                    <div className="relative">
                      <input
                        list="habit-category-list"
                        value={formData.category}
                        onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                        placeholder={isAr ? 'اختر أو اكتب فئة جديدة' : 'Select or type new category'}
                        className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                      />
                      <datalist id="habit-category-list">
                        {allCategories.map(c => (
                          <option key={c} value={c}>{isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c)}</option>
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">
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

                {/* Custom days */}
                {(formData.frequency === 'weekly' || formData.frequency === 'custom') && (
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">
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
                              : 'text-[var(--foreground)]/70'
                          )}
                        >
                          {isAr ? DAY_LABELS.ar[d] : DAY_LABELS.en[d]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority & Difficulty */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">
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
                              : 'text-[var(--foreground)]/70'
                          )}
                        >
                          {isAr ? (p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة') : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">
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
                              : 'text-[var(--foreground)]/70'
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
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">
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
                            : 'text-[var(--foreground)]/70'
                        )}
                      >
                        {isAr ? (t === 'positive' ? '✓ عادة إيجابية' : '✗ عادة للتجنب') : (t === 'positive' ? '✓ Build' : '✗ Break')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">
                    {isAr ? 'اللون' : 'Color'}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {ITEM_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setFormData(f => ({ ...f, color: c }))}
                        className={cn(
                          'h-7 w-7 rounded-full transition-all',
                          formData.color === c ? 'ring-2 ring-offset-2 ring-[var(--foreground)]/20 scale-110' : 'hover:scale-110'
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Image */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">
                    {isAr ? 'صورة (اختياري)' : 'Image (optional)'}
                  </label>
                  {formData.image ? (
                    <div className="relative rounded-xl overflow-hidden h-28">
                      <img src={formData.image} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setFormData(f => ({ ...f, image: '' }))}
                        className="absolute top-2 end-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-[var(--foreground)]/[0.12] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.03] cursor-pointer transition-colors">
                      <Plus className="h-5 w-5 text-[var(--foreground)]/30 mb-1" />
                      <span className="text-[10px] text-[var(--foreground)]/40">{isAr ? 'اضغط لإضافة صورة' : 'Click to add image'}</span>
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

                {/* ── Place & Time ── */}
                <div className="border-t border-[var(--foreground)]/[0.06] pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
                    <span className="text-xs font-semibold text-[var(--foreground)]/70">{isAr ? 'المكان والزمان' : 'Place & Time'}</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">
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
                      <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">
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
                      <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">
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
                      <span className="text-[10px] font-semibold text-[var(--foreground)]/60">{isAr ? 'نافذة الوقت المثالي (اختياري)' : 'Ideal Time Window (optional)'}</span>
                    </div>
                    <p className="text-[9px] text-[var(--foreground)]/40 mb-2">
                      {isAr ? 'إذا أكملت العادة في هذا الوقت = أخضر، خارجه = برتقالي، لم تكتمل = أحمر' : 'Done in window = green, outside = orange, missed = red'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-[var(--foreground)]/60 mb-1 block">{isAr ? 'من' : 'From'}</label>
                        <input type="time" value={formData.windowStart}
                          onChange={e => setFormData(f => ({ ...f, windowStart: e.target.value }))}
                          className="app-input w-full rounded-lg bg-transparent px-2.5 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[var(--foreground)]/60 mb-1 block">{isAr ? 'إلى' : 'To'}</label>
                        <input type="time" value={formData.windowEnd}
                          onChange={e => setFormData(f => ({ ...f, windowEnd: e.target.value }))}
                          className="app-input w-full rounded-lg bg-transparent px-2.5 py-2 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Habit Loop: Cue → Routine → Reward ── */}
                <div className="border-t border-[var(--foreground)]/[0.06] pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Repeat className="h-4 w-4 text-[var(--color-primary)]" />
                    <span className="text-xs font-semibold text-[var(--foreground)]/70">{isAr ? 'حلقة العادة' : 'Habit Loop'}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 flex items-center gap-1.5">
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
                      <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 flex items-center gap-1.5">
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
                      <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 flex items-center gap-1.5">
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
                    onClick={() => { store.deleteHabit(editingHabit.id); setShowForm(false); resetForm(); }}
                    className="me-auto text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {isAr ? 'حذف' : 'Delete'}
                  </button>
                )}
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.05]"
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
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 top-[5%] sm:top-[10%] z-[var(--z-modal)] sm:w-[540px] sm:inset-x-0 sm:mx-auto max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.12] shadow-2xl"
            >
              <HabitDetail habit={detailHabit} onClose={() => setDetailHabit(null)} onViewFull={() => { setDetailHabit(null); setFullCalendarHabit(detailHabit); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Full Calendar Modal */}
      <AnimatePresence>
        {fullCalendarHabit && (
          <HabitFullCalendar habit={fullCalendarHabit} isAr={isAr} store={store} onClose={() => setFullCalendarHabit(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Full Calendar for a single habit ─── */
function HabitFullCalendar({ habit, isAr, store, onClose }: { habit: Habit; isAr: boolean; store: ReturnType<typeof useAppStore>; onClose: () => void }) {
  const today = todayString();
  const createdDate = new Date(habit.createdAt);
  const createdMonth = { year: createdDate.getFullYear(), month: createdDate.getMonth() };
  const todayDate = new Date();
  const currentMonth = { year: todayDate.getFullYear(), month: todayDate.getMonth() };

  // Build all months from creation to today
  const allMonths = useMemo(() => {
    const months: { year: number; month: number }[] = [];
    let y = createdMonth.year, m = createdMonth.month;
    while (y < currentMonth.year || (y === currentMonth.year && m <= currentMonth.month)) {
      months.push({ year: y, month: m });
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return months.reverse(); // newest first
  }, [createdMonth.year, createdMonth.month, currentMonth.year, currentMonth.month]);

  const buildMonthDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days: { date: string; day: number; inMonth: boolean; completed: boolean; isFuture: boolean; beforeCreated: boolean; color: CompletionColor }[] = [];
    for (let i = 0; i < startPad; i++) {
      days.push({ date: '', day: 0, inMonth: false, completed: false, isFuture: false, beforeCreated: false, color: 'none' });
    }
    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(year, month, d);
      const dateStr = dt.toISOString().split('T')[0];
      const isFuture = dateStr > today;
      const beforeCreated = dt < new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      const log = !isFuture && !beforeCreated ? store.habitLogs.find(l => l.habitId === habit.id && l.date === dateStr && l.completed) : undefined;
      days.push({
        date: dateStr, day: d, inMonth: true, isFuture, beforeCreated,
        completed: !!log,
        color: !isFuture && !beforeCreated ? getCompletionColor(habit, log) : 'none',
      });
    }
    return days;
  };

  // Stats
  const totalDone = store.habitLogs.filter(l => l.habitId === habit.id && l.completed).length;
  const daysSince = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / 86400000));
  const rate = Math.round((totalDone / daysSince) * 100);

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
        className="fixed inset-4 sm:inset-6 lg:inset-8 z-[var(--z-modal)] rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.12] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--foreground)]/[0.1] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
            <div>
              <h2 className="text-lg font-bold tracking-tight">{isAr ? habit.nameAr : habit.nameEn}</h2>
              <p className="text-xs text-[var(--foreground)]/60">
                {isAr ? `${totalDone} مرة • ${rate}% التزام • ${daysSince} يوم` : `${totalDone} times • ${rate}% rate • ${daysSince} days`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-emerald-500" />
                <span className="text-[10px] text-[var(--foreground)]/50 font-medium">{isAr ? 'مكتمل' : 'Done'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-red-500/80" />
                <span className="text-[10px] text-[var(--foreground)]/50 font-medium">{isAr ? 'فائت' : 'Missed'}</span>
              </div>
            </div>
            <button onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[var(--foreground)]/[0.08] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Months grid */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[900px] mx-auto">
            {allMonths.map(({ year, month }) => {
              const days = buildMonthDays(year, month);
              const label = new Date(year, month).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
              const monthDone = days.filter(d => d.inMonth && d.completed).length;
              const monthApplicable = days.filter(d => d.inMonth && !d.isFuture && !d.beforeCreated).length;
              const monthRate = monthApplicable > 0 ? Math.round((monthDone / monthApplicable) * 100) : 0;
              return (
                <div key={`${year}-${month}`} className="rounded-xl border border-[var(--foreground)]/[0.08] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold">{label}</h3>
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                      monthRate >= 80 ? 'text-emerald-500 bg-emerald-500/10' :
                      monthRate >= 50 ? 'text-amber-500 bg-amber-500/10' :
                      'text-red-400 bg-red-500/10'
                    )}>{monthDone}/{monthApplicable}</span>
                  </div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                    {(isAr ? DAY_LABELS.ar : DAY_LABELS.en).map(d => (
                      <div key={d} className="text-center text-[7px] font-semibold text-[var(--foreground)]/30">{d[0]}</div>
                    ))}
                  </div>
                  {/* Days */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {days.map((day, di) => {
                      const isApplicable = day.inMonth && !day.isFuture && !day.beforeCreated;
                      const isToday = day.date === today;
                      return (
                        <div key={di} title={day.date}
                          className={cn(
                            'h-6 rounded flex items-center justify-center text-[8px] font-semibold',
                            !day.inMonth && 'invisible',
                            day.isFuture && day.inMonth && 'text-[var(--foreground)]/10',
                            day.beforeCreated && day.inMonth && 'text-[var(--foreground)]/10',
                            isApplicable && day.color === 'green' && 'bg-emerald-500 text-white',
                            isApplicable && day.color === 'orange' && 'bg-amber-500 text-white',
                            isApplicable && day.color === 'red' && 'bg-red-500/80 text-white',
                            isApplicable && day.color === 'none' && day.completed && 'bg-emerald-500 text-white',
                            isApplicable && day.color === 'none' && !day.completed && 'bg-red-500/80 text-white',
                            isToday && 'ring-1.5 ring-[var(--color-primary)] ring-offset-1',
                          )}>
                          {day.inMonth ? day.day : ''}
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

/* ─── Flip Card ─── */
function HabitFlipCard({ habit, index, isAr, store, today, onEdit, onArchive, onDelete, onDetail }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: () => void; onArchive: () => void; onDelete: () => void; onDetail: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [flippedTab, setFlippedTab] = useState<'details' | 'stats'>('details');
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
  const hasDuration = !!habit.expectedDuration;

  // Derive timer state from store
  const active = store.activeTimer;
  const currentSession = active ? store.timerSessions.find(t => t.id === active.sessionId) : null;
  const activeHabitId = currentSession?.type === 'habit-linked' ? currentSession.habitId ?? null : null;
  const isMyTimer = activeHabitId === habit.id;
  const hasActiveTimer = !!active && active.state !== 'completed';
  const anotherTimerRunning = hasActiveTimer && !isMyTimer;
  const timerRunning = active?.state === 'running';
  const timerPaused = active?.state === 'paused';
  const timerElapsed = active?.elapsed ?? 0;
  const streak = store.getHabitStreak(habit.id);
  const stats = store.getHabitStats(habit.id);
  const timeStats = useMemo(() => getHabitTimeStats(habit.id, store.habitLogs), [habit.id, store.habitLogs]);

  const last7 = useMemo(() => {
    const days: { date: string; done: boolean; color: CompletionColor }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const log = store.habitLogs.find(l => l.habitId === habit.id && l.date === ds && l.completed);
      const color = getCompletionColor(habit, log);
      days.push({ date: ds, done: !!log, color });
    }
    return days;
  }, [habit.id, habit.windowStart, habit.windowEnd, store.habitLogs]);

  const daysSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / 86400000));
  const completedCount7 = last7.filter(d => d.done).length;

  const CATEGORY_PLACEHOLDERS: Record<string, string> = {
    health: 'https://images.unsplash.com/photo-1505576399279-0d06b2000de4?w=400&h=200&fit=crop&q=80',
    fitness: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=200&fit=crop&q=80',
    learning: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=200&fit=crop&q=80',
    productivity: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=200&fit=crop&q=80',
    mindfulness: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=200&fit=crop&q=80',
    social: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=200&fit=crop&q=80',
    creativity: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=200&fit=crop&q=80',
    finance: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop&q=80',
    nutrition: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop&q=80',
    sleep: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=200&fit=crop&q=80',
    other: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=200&fit=crop&q=80',
  };

  const cardImage = habit.image || CATEGORY_PLACEHOLDERS[habit.category] || CATEGORY_PLACEHOLDERS.other;

  const todayLog = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);

  // Manual check/uncheck — only for habits WITHOUT expectedDuration
  const handleCheck = () => {
    if (hasDuration || habit.archived) return;
    if (done && todayLog) {
      store.deleteHabitLog(todayLog.id);
      return;
    }
    store.logHabit({
      habitId: habit.id, date: today,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: true,
    });
  };

  const handleTimerStart = () => {
    if (anotherTimerRunning || done) return;
    const targetDuration = hasDuration ? habit.expectedDuration! * 60 : undefined;
    store.startTimer({
      type: 'habit-linked',
      mode: hasDuration ? 'countdown' : 'stopwatch',
      habitId: habit.id,
      labelEn: habit.nameEn,
      labelAr: habit.nameAr,
      startedAt: new Date().toISOString(),
      duration: 0,
      targetDuration,
    });
  };

  const handleTimerStop = () => {
    if (!isMyTimer || !currentSession) return;
    const secs = timerElapsed;
    if (secs <= 0) return;
    const durationMin = Math.max(1, Math.round(secs / 60));
    // For habits with expectedDuration — only auto-complete handles marking done
    // For habits without — manual stop logs it
    if (!hasDuration && !done && !habit.archived) {
      store.logHabit({
        habitId: habit.id, date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: durationMin,
        note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: true,
      });
    } else if (done) {
      store.logHabit({
        habitId: habit.id, date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: durationMin,
        note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: true,
      });
    }
    store.completeTimer(currentSession.id);
  };

  return (
    <motion.div
      variants={fadeUp} custom={index + 3} layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ perspective: '1200px' }}
      className="habit-flip-wrap"
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ── FRONT ── */}
        <div
          className={cn('rounded-2xl overflow-hidden flex flex-col habit-flip-front', flipped && 'invisible')}
          style={{
            backfaceVisibility: 'hidden',
            border: `1px solid rgba(var(--color-primary-rgb) / 0.08)`,
            background: 'var(--color-background)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.04)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            height: 580,
          }}
        >
          {/* ── Image hero ── */}
          <div className="relative h-36 w-full overflow-hidden">
            <img src={cardImage} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" />
            {/* Multi-layer overlay — strong bottom gradient for name readability */}
            <div className="absolute inset-0" style={{
              background: `linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 35%, transparent 55%), linear-gradient(160deg, ${habit.color}44 0%, transparent 50%), linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%)`,
            }} />

            {/* Completion check — glass pill */}
            <button
              onClick={() => handleCheck()}
              disabled={hasDuration && !done}
              className="absolute top-3 end-3 z-10 group/check"
              title={hasDuration && !done ? (isAr ? 'أكمل المؤقت لتسجيل العادة' : 'Complete the timer to mark done') : undefined}
            >
              <motion.div
                whileHover={!hasDuration || done ? { scale: 1.1 } : {}}
                whileTap={!hasDuration || done ? { scale: 0.9 } : {}}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 backdrop-blur-xl transition-all',
                  done
                    ? 'bg-emerald-500/90 shadow-lg shadow-emerald-500/30'
                    : hasDuration
                      ? 'bg-black/20 cursor-not-allowed'
                      : 'bg-black/30 hover:bg-black/50',
                )}
              >
                {done ? (
                  <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }} className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-[9px] font-bold text-white tracking-wide">{isAr ? 'تم' : 'DONE'}</span>
                  </motion.div>
                ) : hasDuration ? (
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4 text-white/50" />
                    <span className="text-[9px] font-medium text-white/50">{isAr ? 'مؤقت' : 'Timer'}</span>
                  </div>
                ) : (
                  <>
                    <Circle className="h-4 w-4 text-white/80 group-hover/check:text-emerald-300 transition-colors" />
                    <span className="text-[9px] font-medium text-white/80">{isAr ? 'تسجيل' : 'Log'}</span>
                  </>
                )}
              </motion.div>
            </button>

            {/* Priority + streak pill — top start */}
            <div className="absolute top-3 start-3 flex items-center gap-1.5 z-10">
              <span className={cn(
                'text-[9px] px-2 py-1 rounded-full font-bold uppercase backdrop-blur-xl',
                habit.priority === 'high' ? 'bg-red-500/80 text-white shadow-lg shadow-red-500/20' :
                habit.priority === 'medium' ? 'bg-amber-500/80 text-white shadow-lg shadow-amber-500/20' :
                'bg-white/30 text-white'
              )}>
                {isAr ? (habit.priority === 'high' ? 'عالية' : habit.priority === 'medium' ? 'متوسطة' : 'منخفضة') : habit.priority}
              </span>
              {streak.current > 0 && (
                <span className="flex items-center gap-0.5 text-[9px] px-2 py-1 rounded-full font-bold bg-orange-500/80 text-white backdrop-blur-xl shadow-lg shadow-orange-500/20">
                  <Flame className="h-3 w-3" /> {streak.current}
                </span>
              )}
            </div>

            {/* Name + category — bottom overlay */}
            <div className="absolute bottom-0 inset-x-0 px-4 pb-3.5">
              <div className="flex items-center justify-center gap-2">
                {done && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </motion.span>
                )}
                <h3
                  className="text-lg font-extrabold text-center leading-snug text-white"
                  style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6), 0 0 30px rgba(0,0,0,0.3)' }}
                >
                  {isAr ? habit.nameAr : habit.nameEn}
                </h3>
              </div>
              <p className="text-[11px] text-white/90 text-center mt-1 font-semibold" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.3)' }}>
                {isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category)} · {isAr ? FREQ_LABELS[habit.frequency]?.ar : FREQ_LABELS[habit.frequency]?.en}
              </p>
            </div>
          </div>

          {/* ── Card body ── */}
          <div className="px-4 pb-4 pt-3 flex-1 flex flex-col">

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { icon: Flame, value: streak.current, label: isAr ? 'سلسلة' : 'Streak', gradient: 'from-orange-500/15 to-orange-500/5', iconColor: 'text-orange-500' },
                { icon: Trophy, value: streak.best, label: isAr ? 'أفضل' : 'Best', gradient: 'from-amber-500/15 to-amber-500/5', iconColor: 'text-amber-500' },
                { icon: Hash, value: stats.totalCompletions, label: isAr ? 'إجمالي' : 'Total', gradient: 'from-emerald-500/15 to-emerald-500/5', iconColor: 'text-emerald-500' },
                { icon: Clock, value: formatMins(timeStats.mins.total), label: isAr ? 'الوقت' : 'Time', gradient: 'from-blue-500/15 to-blue-500/5', iconColor: 'text-blue-500' },
              ].map((s, si) => (
                <div key={si} className={cn('text-center rounded-xl py-2 px-1 bg-gradient-to-b border border-[var(--foreground)]/[0.04]', s.gradient)}>
                  <s.icon className={cn('h-3.5 w-3.5 mx-auto mb-0.5', s.iconColor)} />
                  <p className="text-[12px] font-extrabold leading-none">{s.value}</p>
                  <p className="text-[7px] text-[var(--foreground)]/45 font-medium mt-0.5 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* 7-day tracker */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-[var(--foreground)]/45 uppercase tracking-widest">{isAr ? 'آخر ٧ أيام' : 'Last 7 days'}</span>
                <span className="text-[10px] font-extrabold" style={{ color: completedCount7 >= 5 ? '#22c55e' : completedCount7 >= 3 ? '#eab308' : '#ef4444' }}>
                  {completedCount7}/7
                </span>
              </div>
              <div className="h-1 rounded-full bg-[var(--foreground)]/[0.06] mb-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount7 / 7) * 100}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: completedCount7 >= 5 ? 'linear-gradient(90deg, #22c55e, #10b981)' : completedCount7 >= 3 ? 'linear-gradient(90deg, #eab308, #f59e0b)' : 'linear-gradient(90deg, #ef4444, #f97316)' }}
                />
              </div>
              <div className="flex gap-1">
                {last7.map((d, di) => {
                  const dt = new Date(d.date);
                  const isFuture = d.date > today;
                  const isToday = d.date === today;
                  return (
                    <div key={di} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className={cn('text-[8px] font-semibold', isToday ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]/30')}>
                        {(isAr ? DAY_LABELS.ar : DAY_LABELS.en)[dt.getDay()][0]}
                      </span>
                      <div className={cn(
                        'w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold',
                        isFuture && 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/20',
                        !isFuture && d.color === 'green' && 'bg-emerald-500 text-white',
                        !isFuture && d.color === 'orange' && 'bg-amber-500 text-white',
                        !isFuture && d.color === 'red' && 'bg-red-500/80 text-white',
                        !isFuture && d.color === 'none' && d.done && 'bg-emerald-500 text-white',
                        !isFuture && d.color === 'none' && !d.done && 'bg-red-500/80 text-white',
                        isToday && 'ring-2 ring-[var(--color-primary)] ring-offset-1',
                      )}>
                        {dt.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mini timer — always visible */}
            {!habit.archived && (() => {
              const targetSecs = hasDuration ? habit.expectedDuration! * 60 : 0;
              const remaining = hasDuration && isMyTimer ? Math.max(0, targetSecs - timerElapsed) : 0;
              const progress = hasDuration && isMyTimer ? Math.min(1, timerElapsed / targetSecs) : 0;
              return (
              <div className={cn('mb-3 rounded-xl border p-2.5', isMyTimer && timerRunning ? 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.04]' : 'border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02]')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className={cn('h-3.5 w-3.5', isMyTimer && timerRunning ? 'text-[var(--color-primary)] animate-pulse' : 'text-[var(--foreground)]/40')} />
                    <span className="text-[10px] font-semibold text-[var(--foreground)]/50">
                      {hasDuration ? (isAr ? 'مؤقت مطلوب' : 'Timer required') : (isAr ? 'مؤقت' : 'Timer')}
                    </span>
                    {hasDuration && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        {habit.expectedDuration! >= 60
                          ? `${Math.floor(habit.expectedDuration! / 60)}${isAr ? 'س' : 'h'} ${habit.expectedDuration! % 60 ? `${habit.expectedDuration! % 60}${isAr ? 'د' : 'm'}` : ''}`
                          : `${habit.expectedDuration} ${isAr ? 'دقيقة' : 'min'}`}
                      </span>
                    )}
                  </div>
                  {isMyTimer && timerRunning && (
                    <span className="text-sm font-mono font-bold" style={{ color: habit.color }}>
                      {hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(timerElapsed)}
                    </span>
                  )}
                  {isMyTimer && timerPaused && timerElapsed > 0 && (
                    <span className="text-sm font-mono font-bold text-emerald-500">
                      {formatTimerDuration(timerElapsed)}
                    </span>
                  )}
                </div>

                {/* Progress bar for timed habits */}
                {hasDuration && isMyTimer && timerElapsed > 0 && (
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--foreground)]/[0.08] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${habit.color}, ${habit.color}cc)` }} />
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-2">
                  {/* Idle — no timer running for this habit */}
                  {!isMyTimer && (
                    <>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleTimerStart}
                      disabled={anotherTimerRunning || done}
                      className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold text-white',
                        (anotherTimerRunning || done) && 'opacity-40 cursor-not-allowed')}
                      style={{ background: habit.color }}>
                      <Play className="h-3 w-3" /> {done ? (isAr ? 'مكتمل' : 'Done') : (isAr ? 'ابدأ' : 'Start')}
                    </motion.button>
                    {anotherTimerRunning && !done && (
                      <span className="text-[8px] text-amber-500 font-medium">{isAr ? 'مؤقت آخر يعمل' : 'Another timer running'}</span>
                    )}
                    {!anotherTimerRunning && !done && (
                      <Link href={`/app/timers?habitId=${habit.id}`}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-[10px] font-semibold bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/[0.1] transition-colors">
                        <Maximize2 className="h-3 w-3" /> {isAr ? 'كامل' : 'Full'}
                      </Link>
                    )}
                    </>
                  )}
                  {/* Running */}
                  {isMyTimer && timerRunning && (
                    <>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => store.updateActiveTimer({ state: 'paused' })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold bg-amber-500/15 text-amber-600">
                        <Pause className="h-3 w-3" /> {isAr ? 'إيقاف مؤقت' : 'Pause'}
                      </motion.button>
                      {!hasDuration && (
                        <motion.button whileTap={{ scale: 0.95 }} onClick={handleTimerStop}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-600">
                          <Square className="h-3 w-3" /> {done ? (isAr ? 'إضافة وقت' : 'Add Time') : (isAr ? 'إنهاء وتسجيل' : 'Finish & Log')}
                        </motion.button>
                      )}
                    </>
                  )}
                  {/* Paused */}
                  {isMyTimer && timerPaused && timerElapsed > 0 && (
                    <>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => store.updateActiveTimer({ state: 'running' })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold"
                        style={{ background: `${habit.color}15`, color: habit.color }}>
                        <Play className="h-3 w-3" /> {isAr ? 'متابعة' : 'Resume'}
                      </motion.button>
                      {!hasDuration && (
                        <motion.button whileTap={{ scale: 0.95 }} onClick={handleTimerStop}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> {isAr ? 'حفظ' : 'Save'}
                        </motion.button>
                      )}
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => store.cancelTimer()}
                        className="flex items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-semibold bg-red-500/10 text-red-500">
                        <X className="h-3 w-3" />
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
              );
            })()}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[var(--foreground)]/[0.06] mt-auto">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3 text-[var(--foreground)]/25" />
                <span className="text-[9px] text-[var(--foreground)]/45 font-medium">
                  {streak.lastCompletedDate
                    ? `${isAr ? 'آخر: ' : 'Last: '}${new Date(streak.lastCompletedDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}`
                    : (isAr ? 'لم يبدأ بعد' : 'Not started')}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => { setFlipped(true); setFlippedTab('details'); }}
                className="relative flex items-center gap-1.5 rounded-full py-1.5 pe-2 ps-3 text-[10px] font-bold text-white overflow-hidden cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${habit.color}, color-mix(in srgb, ${habit.color} 75%, black))`,
                  boxShadow: `0 2px 10px ${habit.color}40`,
                }}
              >
                {isAr ? 'المزيد' : 'More'} <ArrowRight className={cn('h-3 w-3', isAr && 'rotate-180')} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className={cn('rounded-2xl overflow-hidden flex flex-col habit-flip-back', !flipped ? 'invisible absolute inset-0' : 'absolute inset-x-0 top-0')}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            border: `1px solid rgba(var(--color-primary-rgb) / 0.08)`,
            background: 'var(--color-background)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(var(--color-primary-rgb) / 0.04)',
            height: 580,
          }}
        >
          <div className="h-1.5 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${habit.color}, ${habit.color}88)` }} />

          <div className="p-4 flex-1 overflow-y-auto flex flex-col">
            {/* Back header */}
            <div className="flex items-center justify-between mb-2">
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setFlipped(false)}
                className="flex items-center gap-1.5 rounded-full py-1.5 px-3 text-[11px] font-bold text-[var(--foreground)]/60 bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.1] border border-[var(--foreground)]/[0.08] transition-colors cursor-pointer">
                <RotateCcw className="h-3.5 w-3.5" /> {isAr ? 'رجوع' : 'Back'}
              </motion.button>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${habit.color}20` }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: habit.color }} />
              </div>
            </div>
            <h3 className="text-base font-extrabold text-center mb-2 leading-snug">{isAr ? habit.nameAr : habit.nameEn}</h3>

            {/* Tab switcher: Details / Stats */}
            <div className="flex gap-1 mb-3 rounded-lg bg-[var(--foreground)]/[0.04] p-0.5">
              {([
                { key: 'details' as const, label: isAr ? 'التفاصيل' : 'Details' },
                { key: 'stats' as const, label: isAr ? 'الإحصائيات' : 'Statistics' },
              ]).map(t => (
                <button key={t.key} onClick={() => setFlippedTab(t.key)}
                  className={cn('flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all',
                    flippedTab === t.key ? 'bg-[var(--color-background)] text-[var(--foreground)] shadow-sm' : 'text-[var(--foreground)]/45'
                  )}>
                  {t.label}
                </button>
              ))}
            </div>

            {flippedTab === 'details' ? (
              <>
                {/* Description */}
                {(isAr ? habit.descriptionAr : habit.descriptionEn) && (
                  <p className="text-xs text-[var(--foreground)]/60 leading-relaxed mb-3 bg-[var(--foreground)]/[0.02] rounded-lg px-3 py-2 border border-[var(--foreground)]/[0.05]">
                    {isAr ? habit.descriptionAr : habit.descriptionEn}
                  </p>
                )}

                {/* Place & Time */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {(isAr ? habit.placeAr : habit.placeEn) ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/15">
                      <MapPin className="h-3 w-3" /> {isAr ? habit.placeAr : habit.placeEn}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/30 border border-dashed border-[var(--foreground)]/[0.1]">
                      <MapPin className="h-3 w-3" /> {isAr ? 'أضف مكان' : 'Add place'}
                    </span>
                  )}
                  {habit.preferredTime ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/15">
                      <Clock className="h-3 w-3" /> {habit.preferredTime}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/30 border border-dashed border-[var(--foreground)]/[0.1]">
                      <Clock className="h-3 w-3" /> {isAr ? 'أضف وقت' : 'Add time'}
                    </span>
                  )}
                  {habit.expectedDuration ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
                      <Hourglass className="h-3 w-3" />
                      {habit.expectedDuration >= 60
                        ? `${Math.floor(habit.expectedDuration / 60)}${isAr ? 'س' : 'h'} ${habit.expectedDuration % 60 ? `${habit.expectedDuration % 60}${isAr ? 'د' : 'm'}` : ''}`
                        : `${habit.expectedDuration} ${isAr ? 'دقيقة' : 'min'}`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/30 border border-dashed border-[var(--foreground)]/[0.1]">
                      <Hourglass className="h-3 w-3" /> {isAr ? 'أضف مدة' : 'Add duration'}
                    </span>
                  )}
                  {habit.windowStart && habit.windowEnd && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/15">
                      <Target className="h-3 w-3" /> {habit.windowStart} – {habit.windowEnd}
                    </span>
                  )}
                </div>

                {/* Habit Loop: Cue → Routine → Reward */}
                {(() => {
                  const hasCue = !!(isAr ? habit.cueAr : habit.cueEn);
                  const hasRoutine = !!(isAr ? habit.routineAr : habit.routineEn);
                  const hasReward = !!(isAr ? habit.rewardAr : habit.rewardEn);
                  const hasAny = hasCue || hasRoutine || hasReward;
                  return (
                  <div className="mb-3 rounded-xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.015] p-2.5 space-y-1.5">
                    <span className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase tracking-widest">{isAr ? 'حلقة العادة' : 'Habit Loop'}</span>
                    {!hasAny ? (
                      <button onClick={onEdit} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-[var(--foreground)]/[0.1] text-[10px] text-[var(--foreground)]/35 hover:text-[var(--foreground)]/60 hover:border-[var(--color-primary)]/30 transition-colors">
                        <Plus className="h-3 w-3" /> {isAr ? 'أضف الإشارة، الروتين، والمكافأة' : 'Add cue, routine & reward'}
                      </button>
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/15 mt-0.5">
                            <Lightbulb className="h-3 w-3 text-amber-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-amber-600 uppercase">{isAr ? 'الإشارة' : 'Cue'}</p>
                            <p className={cn('text-[11px] leading-snug', hasCue ? 'text-[var(--foreground)]/70' : 'text-[var(--foreground)]/25 italic')}>{hasCue ? (isAr ? habit.cueAr : habit.cueEn) : (isAr ? 'غير محدد' : 'Not set')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/15 mt-0.5">
                            <Repeat className="h-3 w-3 text-blue-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-blue-600 uppercase">{isAr ? 'الروتين' : 'Routine'}</p>
                            <p className={cn('text-[11px] leading-snug', hasRoutine ? 'text-[var(--foreground)]/70' : 'text-[var(--foreground)]/25 italic')}>{hasRoutine ? (isAr ? habit.routineAr : habit.routineEn) : (isAr ? 'غير محدد' : 'Not set')}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 mt-0.5">
                            <Gift className="h-3 w-3 text-emerald-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-emerald-600 uppercase">{isAr ? 'المكافأة' : 'Reward'}</p>
                            <p className={cn('text-[11px] leading-snug', hasReward ? 'text-[var(--foreground)]/70' : 'text-[var(--foreground)]/25 italic')}>{hasReward ? (isAr ? habit.rewardAr : habit.rewardEn) : (isAr ? 'غير محدد' : 'Not set')}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  );
                })()}

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { icon: Zap, label: isAr ? 'الصعوبة' : 'Difficulty', value: isAr ? (habit.difficulty === 'hard' ? 'صعبة' : habit.difficulty === 'medium' ? 'متوسطة' : 'سهلة') : habit.difficulty, color: '#a855f7' },
                    { icon: Target, label: isAr ? 'النوع' : 'Type', value: isAr ? (habit.type === 'positive' ? 'بناء' : 'تجنب') : (habit.type === 'positive' ? 'Build' : 'Break'), color: '#3b82f6' },
                    { icon: CalendarIcon, label: isAr ? 'منذ' : 'Since', value: new Date(habit.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }), color: '#22c55e' },
                    { icon: Clock, label: isAr ? 'عمر العادة' : 'Age', value: `${daysSinceCreation} ${isAr ? 'يوم' : (daysSinceCreation === 1 ? 'day' : 'days')}`, color: '#f59e0b' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-[var(--foreground)]/[0.025] p-2 border border-[var(--foreground)]/[0.05]">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${item.color}15` }}>
                        <item.icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-[var(--foreground)]/45 font-semibold uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs font-bold truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Weekly bar chart */}
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-[var(--foreground)]/45 uppercase tracking-widest block mb-1.5">{isAr ? 'الأداء الأسبوعي' : 'Weekly perf.'}</span>
                  <div className="flex items-end gap-1.5 h-10 px-1">
                    {stats.completionsByWeekday.map((count, wi) => {
                      const max = Math.max(...stats.completionsByWeekday, 1);
                      const pct = (count / max) * 100;
                      return (
                        <div key={wi} className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="w-full rounded-sm transition-all" style={{
                            height: `${Math.max(pct, 8)}%`,
                            background: pct > 0 ? `linear-gradient(to top, ${habit.color}, ${habit.color}99)` : `var(--foreground)`,
                            opacity: pct > 0 ? 1 : 0.06,
                          }} />
                          <span className="text-[8px] font-semibold text-[var(--foreground)]/35">{(isAr ? DAY_LABELS.ar : DAY_LABELS.en)[wi][0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* ── STATS TAB ── */}
                {/* Repetitions */}
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-[var(--foreground)]/45 uppercase tracking-widest block mb-1.5">{isAr ? 'عدد التكرارات' : 'Repetitions'}</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: isAr ? 'أسبوع' : 'Week', value: timeStats.reps.week },
                      { label: isAr ? 'شهر' : 'Month', value: timeStats.reps.month },
                      { label: isAr ? 'سنة' : 'Year', value: timeStats.reps.year },
                      { label: isAr ? 'المجمل' : 'Total', value: timeStats.reps.total },
                    ].map((r, i) => (
                      <div key={i} className="text-center rounded-lg bg-emerald-500/8 border border-emerald-500/10 py-1.5">
                        <p className="text-sm font-extrabold text-emerald-600">{r.value}</p>
                        <p className="text-[7px] text-[var(--foreground)]/40 font-semibold uppercase">{r.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time spent */}
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-[var(--foreground)]/45 uppercase tracking-widest block mb-1.5">{isAr ? 'الوقت المصروف' : 'Time Spent'}</span>
                  <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                    {[
                      { label: isAr ? 'اليوم' : 'Today', value: formatMins(timeStats.mins.today) },
                      { label: isAr ? 'أسبوع' : 'Week', value: formatMins(timeStats.mins.week) },
                      { label: isAr ? 'شهر' : 'Month', value: formatMins(timeStats.mins.month) },
                    ].map((r, i) => (
                      <div key={i} className="text-center rounded-lg bg-blue-500/8 border border-blue-500/10 py-1.5">
                        <p className="text-xs font-extrabold text-blue-600">{r.value}</p>
                        <p className="text-[7px] text-[var(--foreground)]/40 font-semibold uppercase">{r.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: isAr ? 'سنة' : 'Year', value: formatMins(timeStats.mins.year) },
                      { label: isAr ? 'المجمل' : 'Total', value: formatMins(timeStats.mins.total) },
                    ].map((r, i) => (
                      <div key={i} className="text-center rounded-lg bg-blue-500/8 border border-blue-500/10 py-1.5">
                        <p className="text-xs font-extrabold text-blue-600">{r.value}</p>
                        <p className="text-[7px] text-[var(--foreground)]/40 font-semibold uppercase">{r.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completion rate + streak summary */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <div className="text-center rounded-lg bg-orange-500/8 border border-orange-500/10 py-2">
                    <Flame className="h-4 w-4 mx-auto text-orange-500 mb-0.5" />
                    <p className="text-sm font-extrabold">{streak.current} / {streak.best}</p>
                    <p className="text-[7px] text-[var(--foreground)]/40 font-semibold uppercase">{isAr ? 'سلسلة / أفضل' : 'Streak / Best'}</p>
                  </div>
                  <div className="text-center rounded-lg bg-purple-500/8 border border-purple-500/10 py-2">
                    <TrendingUp className="h-4 w-4 mx-auto text-purple-500 mb-0.5" />
                    <p className="text-sm font-extrabold">{stats.completionRate}%</p>
                    <p className="text-[7px] text-[var(--foreground)]/40 font-semibold uppercase">{isAr ? 'معدل الإنجاز' : 'Rate'}</p>
                  </div>
                </div>
              </>
            )}

            {/* Back footer actions */}
            <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--foreground)]/[0.06] mt-auto">
              <motion.button whileTap={{ scale: 0.97 }} onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold text-[var(--foreground)]/65 bg-[var(--foreground)]/[0.04] hover:bg-[var(--foreground)]/[0.08] transition-colors border border-[var(--foreground)]/[0.05]">
                <Edit3 className="h-3.5 w-3.5" /> {isAr ? 'تعديل' : 'Edit'}
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={onDetail}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold text-white transition-colors"
                style={{ background: `linear-gradient(135deg, ${habit.color}, ${habit.color}cc)`, boxShadow: `0 2px 8px ${habit.color}33` }}>
                <Eye className="h-3.5 w-3.5" /> {isAr ? 'عرض' : 'View'}
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={onArchive}
                className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-colors border border-[var(--foreground)]/[0.05]',
                  habit.archived ? 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-[var(--foreground)]/65 bg-[var(--foreground)]/[0.04] hover:bg-[var(--foreground)]/[0.08]')}>
                <Archive className="h-3.5 w-3.5" /> {habit.archived ? (isAr ? 'استعادة' : 'Restore') : (isAr ? 'أرشفة' : 'Archive')}
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                  if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه العادة؟' : 'Are you sure you want to delete this habit?')) onDelete();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/10">
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Grid Card (compact) ─── */
function HabitGridCard({ habit, index, isAr, store, today, onEdit, onDelete, onDetail }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: () => void; onDelete: () => void; onDetail: () => void;
}) {
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
  const streak = store.getHabitStreak(habit.id);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const catLabel = isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category);
  const hasDuration = !!habit.expectedDuration;

  const handleToggle = () => {
    if (hasDuration || habit.archived) return;
    const existingLog = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);
    if (existingLog) { store.deleteHabitLog(existingLog.id); }
    else { store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true }); }
  };

  return (
    <motion.div variants={fadeUp} custom={index} initial="hidden" animate="visible"
      className="app-card rounded-xl overflow-hidden flex flex-col cursor-pointer group/gc hover:shadow-lg transition-shadow"
      onClick={onDetail}
    >
      {/* Color bar */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${habit.color}, ${habit.color}88)` }} />
      <div className="p-3 flex flex-col flex-1">
        {/* Top row: check + name */}
        <div className="flex items-start gap-2 mb-2">
          <button onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            className={cn('shrink-0 mt-0.5', hasDuration && !done && 'cursor-not-allowed')}
            disabled={habit.archived || (hasDuration && !done)}
            title={hasDuration && !done ? (isAr ? 'أكمل المؤقت' : 'Complete timer') : undefined}>
            {done
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              : hasDuration
                ? <Timer className="h-5 w-5 text-[var(--color-primary)]/40" />
                : <Circle className="h-5 w-5 text-[var(--foreground)]/25 hover:text-[var(--color-primary)] transition-colors" />
            }
          </button>
          <div className="min-w-0 flex-1">
            <h3 className={cn('text-sm font-bold leading-tight truncate', done && 'line-through opacity-60')}>{name}</h3>
            <p className="text-[9px] text-[var(--foreground)]/50 mt-0.5">{catLabel}</p>
          </div>
        </div>

        {/* Timer controls */}
        {!habit.archived && (
          <div className="mb-2">
            <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="xs" />
          </div>
        )}

        {/* Streak + actions */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[var(--foreground)]/[0.06]">
          <div className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-[10px] font-bold text-orange-500">{streak.current}</span>
          </div>
          {habit.expectedDuration && (
            <div className="flex items-center gap-1">
              <Hourglass className="h-3 w-3 text-[var(--foreground)]/30" />
              <span className="text-[9px] text-[var(--foreground)]/40">{habit.expectedDuration}{isAr ? 'د' : 'm'}</span>
            </div>
          )}
          {habit.preferredTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[var(--foreground)]/30" />
              <span className="text-[9px] text-[var(--foreground)]/40">{habit.preferredTime}</span>
            </div>
          )}
          <div className="flex items-center gap-0.5 ms-auto opacity-0 group-hover/gc:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.06]">
              <Edit3 className="h-2.5 w-2.5 text-[var(--foreground)]/40" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه العادة؟' : 'Are you sure you want to delete this habit?')) onDelete(); }}
              className="h-5 w-5 rounded flex items-center justify-center hover:bg-red-500/10">
              <Trash2 className="h-2.5 w-2.5 text-red-500/60" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── List Row ─── */
function HabitListRow({ habit, index, isAr, store, today, onEdit, onArchive, onDelete, onDetail }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: () => void; onArchive: () => void; onDelete: () => void; onDetail: () => void;
}) {
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
  const streak = store.getHabitStreak(habit.id);
  const stats = store.getHabitStats(habit.id);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const catLabel = isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category);
  const freqLabel = isAr ? FREQ_LABELS[habit.frequency]?.ar : FREQ_LABELS[habit.frequency]?.en;
  const hasDuration = !!habit.expectedDuration;

  const handleToggle = () => {
    if (hasDuration || habit.archived) return;
    const existingLog = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);
    if (existingLog) { store.deleteHabitLog(existingLog.id); }
    else { store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true }); }
  };

  // Last 7 days mini dots with window colors
  const last7 = useMemo(() => {
    const days: CompletionColor[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const log = store.habitLogs.find(l => l.habitId === habit.id && l.date === ds && l.completed);
      days.push(getCompletionColor(habit, log));
    }
    return days;
  }, [habit.id, habit.windowStart, habit.windowEnd, store.habitLogs]);

  return (
    <motion.div variants={fadeUp} custom={index} initial="hidden" animate="visible"
      className="app-card rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-md transition-shadow group/lr"
    >
      {/* Check */}
      <button onClick={handleToggle} className={cn('shrink-0', hasDuration && !done && 'cursor-not-allowed')}
        disabled={habit.archived || (hasDuration && !done)}
        title={hasDuration && !done ? (isAr ? 'أكمل المؤقت' : 'Complete timer') : undefined}>
        {done
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          : hasDuration
            ? <Timer className="h-5 w-5 text-[var(--color-primary)]/40" />
            : <Circle className="h-5 w-5 text-[var(--foreground)]/25 hover:text-[var(--color-primary)] transition-colors" />
        }
      </button>

      {/* Color dot + name */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: habit.color }} />
        <div className="min-w-0">
          <h3 className={cn('text-sm font-semibold truncate', done && 'line-through opacity-50')}>{name}</h3>
          <div className="flex items-center gap-2 text-[10px] text-[var(--foreground)]/45">
            <span>{catLabel}</span>
            <span className="text-[var(--foreground)]/20">·</span>
            <span>{freqLabel}</span>
            {habit.expectedDuration && (
              <>
                <span className="text-[var(--foreground)]/20">·</span>
                <span className="flex items-center gap-0.5"><Hourglass className="h-2.5 w-2.5" />{habit.expectedDuration}{isAr ? 'د' : 'm'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Last 7 dots — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-0.5">
        {last7.map((c, i) => (
          <div key={i} className={cn('h-2 w-2 rounded-full',
            c === 'green' ? 'bg-emerald-500' : c === 'orange' ? 'bg-amber-500' : c === 'red' ? 'bg-red-500' : 'bg-[var(--foreground)]/10'
          )} />
        ))}
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1 shrink-0">
        <Flame className="h-3.5 w-3.5 text-orange-500" />
        <span className="text-xs font-bold text-orange-500">{streak.current}</span>
      </div>

      {/* Rate */}
      <span className="hidden md:block text-xs font-semibold text-[var(--foreground)]/60 shrink-0 w-12 text-center">{stats.completionRate}%</span>

      {/* Timer */}
      <div className="shrink-0">
        <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="xs" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/lr:opacity-100 transition-opacity">
        <button onClick={onDetail} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.06] transition-colors">
          <Eye className="h-3.5 w-3.5 text-[var(--foreground)]/50" />
        </button>
        <button onClick={onEdit} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.06] transition-colors">
          <Edit3 className="h-3.5 w-3.5 text-[var(--foreground)]/50" />
        </button>
        <button onClick={onArchive} className={cn('h-7 w-7 rounded-lg flex items-center justify-center transition-colors',
          habit.archived ? 'hover:bg-emerald-500/10' : 'hover:bg-[var(--foreground)]/[0.06]')}
          title={habit.archived ? (isAr ? 'استعادة' : 'Restore') : (isAr ? 'أرشفة' : 'Archive')}>
          <Archive className={cn('h-3.5 w-3.5', habit.archived ? 'text-emerald-500' : 'text-[var(--foreground)]/50')} />
        </button>
        <button onClick={() => {
            if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه العادة؟' : 'Are you sure you want to delete this habit?')) onDelete();
          }} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors"
          title={isAr ? 'حذف' : 'Delete'}>
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Board View (Kanban by category) ─── */
function HabitBoardView({ habits, isAr, store, today, onEdit, onDelete, onDetail }: {
  habits: Habit[]; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: (h: Habit) => void; onDelete: (h: Habit) => void; onDetail: (h: Habit) => void;
}) {
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
    <motion.div initial="hidden" animate="visible" className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin">
      {categories.map((cat) => {
        const catLabel = isAr ? (CATEGORY_LABELS[cat]?.ar ?? cat) : (CATEGORY_LABELS[cat]?.en ?? cat);
        const catHabits = grouped[cat];
        const doneCount = catHabits.filter(h => store.habitLogs.some(l => l.habitId === h.id && l.date === today && l.completed)).length;
        return (
          <div key={cat} className="shrink-0 w-[260px] flex flex-col">
            {/* Column header */}
            <div className="app-card rounded-xl px-3 py-2.5 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{catLabel || cat}</span>
                <span className="text-[9px] font-semibold text-[var(--foreground)]/40">{catHabits.length}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-500">{doneCount}/{catHabits.length}</span>
            </div>
            {/* Column cards */}
            <div className="flex flex-col gap-2 flex-1">
              {catHabits.map((habit) => {
                const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
                const streak = store.getHabitStreak(habit.id);
                const name = isAr ? habit.nameAr : habit.nameEn;
                const boardHasDuration = !!habit.expectedDuration;
                const handleToggle = () => {
                  if (boardHasDuration || habit.archived) return;
                  const existingLog = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);
                  if (existingLog) { store.deleteHabitLog(existingLog.id); }
                  else { store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true }); }
                };
                return (
                  <div key={habit.id}
                    className={cn('app-card rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow', done && 'opacity-60')}
                    style={{ borderInlineStart: `3px solid ${habit.color}` }}
                    onClick={() => onDetail(habit)}
                  >
                    <div className="flex items-start gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleToggle(); }} className={cn('shrink-0 mt-0.5', boardHasDuration && !done && 'cursor-not-allowed')} disabled={habit.archived || (boardHasDuration && !done)}>
                        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : boardHasDuration ? <Timer className="h-4 w-4 text-[var(--color-primary)]/40" /> : <Circle className="h-4 w-4 text-[var(--foreground)]/25" />}
                      </button>
                      <h4 className={cn('text-xs font-semibold leading-snug', done && 'line-through')}>{name}</h4>
                    </div>
                    <div className="flex items-center gap-3 mt-2 ps-6">
                      <div className="flex items-center gap-1">
                        <Flame className="h-2.5 w-2.5 text-orange-500" />
                        <span className="text-[9px] font-bold text-orange-500">{streak.current}</span>
                      </div>
                      {habit.preferredTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-[var(--foreground)]/30" />
                          <span className="text-[9px] text-[var(--foreground)]/40">{habit.preferredTime}</span>
                        </div>
                      )}
                      {habit.expectedDuration && (
                        <div className="flex items-center gap-1">
                          <Hourglass className="h-2.5 w-2.5 text-[var(--foreground)]/30" />
                          <span className="text-[9px] text-[var(--foreground)]/40">{habit.expectedDuration}{isAr ? 'د' : 'm'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-0.5 ms-auto">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(habit); }}
                          className="h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.06]">
                          <Edit3 className="h-2.5 w-2.5 text-[var(--foreground)]/30" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه العادة؟' : 'Are you sure you want to delete this habit?')) onDelete(habit); }}
                          className="h-5 w-5 rounded flex items-center justify-center hover:bg-red-500/10">
                          <Trash2 className="h-2.5 w-2.5 text-red-500/60" />
                        </button>
                      </div>
                    </div>
                    {/* Timer controls */}
                    {!habit.archived && (
                      <div className="mt-2 ps-6">
                        <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="xs" />
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
function HabitMinimalCard({ habit, index, isAr, store, today, onToggle, onDelete, onDetail }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onToggle: () => void; onDelete: () => void; onDetail: () => void;
}) {
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
  const streak = store.getHabitStreak(habit.id);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const hasDuration = !!habit.expectedDuration;

  return (
    <motion.div variants={fadeUp} custom={index} initial="hidden" animate="visible"
      className={cn(
        'rounded-xl px-3 py-2.5 cursor-pointer transition-all border group',
        done
          ? 'bg-emerald-500/8 border-emerald-500/20'
          : 'app-card border-transparent hover:shadow-md',
      )}
      onClick={onDetail}
    >
      <div className="flex items-center gap-2.5">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={cn('shrink-0', hasDuration && !done && 'cursor-not-allowed')}
          disabled={habit.archived || (hasDuration && !done)}>
          {done
            ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
            : hasDuration
              ? <Timer className="h-4 w-4 text-[var(--color-primary)]/40" />
              : <div className="h-4 w-4 rounded-full border-2" style={{ borderColor: habit.color }} />
          }
        </button>
        <span className={cn('text-xs font-semibold truncate flex-1', done && 'line-through opacity-50')}>{name}</span>
        {streak.current > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-[9px] font-bold text-orange-500">{streak.current}</span>
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه العادة؟' : 'Are you sure you want to delete this habit?')) onDelete(); }}
          className="shrink-0 h-5 w-5 rounded flex items-center justify-center hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="h-2.5 w-2.5 text-red-500/60" />
        </button>
      </div>
      {!habit.archived && (
        <div className="mt-1.5">
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

  // ── Time-based stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = todayString();

    // Total completions
    const totalCompletions = allLogs.length;

    // Total hours (from duration field in logs)
    const totalMinutes = allLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    // This week completions
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const thisWeek = allLogs.filter(l => l.date >= weekStartStr && l.date <= todayStr).length;
    const thisWeekMinutes = allLogs.filter(l => l.date >= weekStartStr && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);

    // This month
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const thisMonth = allLogs.filter(l => l.date >= monthStart && l.date <= todayStr).length;
    const thisMonthMinutes = allLogs.filter(l => l.date >= monthStart && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);

    // This year
    const yearStart = `${now.getFullYear()}-01-01`;
    const thisYear = allLogs.filter(l => l.date >= yearStart && l.date <= todayStr).length;
    const thisYearMinutes = allLogs.filter(l => l.date >= yearStart && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);

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
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - w * 7);
      const days: { date: string; count: number; isToday: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(weekStart);
        dt.setDate(dt.getDate() + d);
        const ds = dt.toISOString().split('T')[0];
        days.push({
          date: ds,
          count: ds <= today ? allLogs.filter(l => l.date === ds).length : -1,
          isToday: ds === today,
        });
      }
      const wStart = weekStart.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
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
      const start = d.toISOString().split('T')[0];
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const mLogs = allLogs.filter(l => l.date >= start && l.date <= end);
      months.push({
        label: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short' }),
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
              <span className="text-[10px] font-medium text-[var(--foreground)]/50 uppercase tracking-wider">{isAr ? s.labelAr : s.labelEn}</span>
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', s.color.split(' ')[1])}>
                <s.icon className={cn('h-4 w-4', s.color.split(' ')[0])} />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            {'sub' in s && s.sub && <p className="text-[10px] text-[var(--foreground)]/40 mt-0.5 truncate">{s.sub}</p>}
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
                  <span className="text-[10px] font-bold text-[var(--foreground)]/70">{m.count}</span>
                  <div className="w-full rounded-t-lg bg-[var(--color-primary)]/15 relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                    <div className="absolute bottom-0 w-full rounded-t-lg bg-[var(--color-primary)] transition-all" style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-[var(--foreground)]/40 font-medium">{m.label}</span>
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
                  <span className="text-[7px] text-[var(--foreground)]/30">{d[0]}</span>
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
                        day.count === 0 && 'bg-[var(--foreground)]/[0.06]',
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
            <span className="text-[8px] text-[var(--foreground)]/30">{isAr ? 'أقل' : 'Less'}</span>
            {[0.02, 0.06].map((_, i) => <div key={`e${i}`} className={cn('h-3 w-3 rounded-sm', i === 0 ? 'bg-[var(--foreground)]/[0.02]' : 'bg-[var(--foreground)]/[0.06]')} />)}
            {['bg-emerald-300', 'bg-emerald-500', 'bg-emerald-600'].map((c, i) => <div key={i} className={cn('h-3 w-3 rounded-sm', c)} />)}
            <span className="text-[8px] text-[var(--foreground)]/30">{isAr ? 'أكثر' : 'More'}</span>
          </div>
        </motion.div>
      </div>

      {/* Per-Habit Breakdown Table */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={10} className="app-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--foreground)]/[0.08]">
          <h3 className="text-sm font-bold">{isAr ? 'تفاصيل كل عادة' : 'Per-Habit Breakdown'}</h3>
        </div>
        {habitBreakdown.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="h-8 w-8 text-[var(--foreground)]/15 mx-auto mb-2" />
            <p className="text-xs text-[var(--foreground)]/30">{isAr ? 'لا توجد عادات' : 'No habits yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--foreground)]/[0.06]">
                  <th className="text-start px-5 py-3 text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider">{isAr ? 'العادة' : 'Habit'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)]/50 uppercase">{isAr ? 'الإنجازات' : 'Done'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)]/50 uppercase">{isAr ? 'الوقت' : 'Time'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)]/50 uppercase">{isAr ? 'السلسلة' : 'Streak'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)]/50 uppercase">{isAr ? 'أفضل' : 'Best'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)]/50 uppercase">{isAr ? 'المعدل' : 'Rate'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)]/50 uppercase">{isAr ? 'آخر التزام' : 'Last'}</th>
                </tr>
              </thead>
              <tbody>
                {habitBreakdown.map((row, ri) => (
                  <tr key={row.habit.id} className={cn('border-b border-[var(--foreground)]/[0.04] hover:bg-[var(--foreground)]/[0.02]', ri % 2 === 1 && 'bg-[var(--foreground)]/[0.015]')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: row.habit.color }} />
                        <div>
                          <span className="text-sm font-semibold block">{isAr ? row.habit.nameAr : row.habit.nameEn}</span>
                          <span className="text-[9px] text-[var(--foreground)]/40">{isAr ? (CATEGORY_LABELS[row.habit.category]?.ar ?? row.habit.category) : (CATEGORY_LABELS[row.habit.category]?.en ?? row.habit.category)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold">{row.completions}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-medium text-[var(--foreground)]/70">{row.totalMinutes > 0 ? fmtTime(row.totalMinutes) : '—'}</span>
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
                      <span className="text-[11px] text-[var(--foreground)]/50">
                        {row.lastDate ? new Date(row.lastDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
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
    const base = new Date(today);
    base.setDate(base.getDate() - (DAYS_PER_PAGE - 1) + pageOffset * DAYS_PER_PAGE);
    for (let i = 0; i < DAYS_PER_PAGE; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [today, pageOffset]);

  const rangeLabel = useMemo(() => {
    const start = new Date(pageDates[0]);
    const end = new Date(pageDates[pageDates.length - 1]);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const yOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const loc = isAr ? 'ar-SA' : 'en-US';
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
        className="fixed inset-4 sm:inset-6 lg:inset-8 z-[var(--z-modal)] rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.12] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--foreground)]/[0.1] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
              <Table2 className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{isAr ? 'جدول الالتزام' : 'Habit Compliance'}</h2>
              <p className="text-xs text-[var(--foreground)]/60">{isAr ? `${habits.length} عادة • معدل الالتزام ${overallRate}%` : `${habits.length} habits • ${overallRate}% overall rate`}</p>
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
              <Target className="h-12 w-12 text-[var(--foreground)]/15 mx-auto mb-3" />
              <p className="text-sm text-[var(--foreground)]/40">{isAr ? 'لا توجد عادات نشطة' : 'No active habits'}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-20 bg-[var(--color-background)]">
                <tr className="border-b border-[var(--foreground)]/[0.1]">
                  <th className="text-start px-5 py-3.5 text-xs font-bold text-[var(--foreground)]/70 uppercase tracking-wider sticky start-0 z-30 bg-[var(--color-background)] min-w-[200px] border-e border-[var(--foreground)]/[0.06]">
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
                        <span className="text-[9px] font-medium text-[var(--foreground)]/40 block">
                          {(isAr ? DAY_LABELS.ar : DAY_LABELS.en)[dt.getDay()]}
                        </span>
                        <span className={cn(
                          'text-sm font-bold block mt-0.5',
                          isToday ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]/80'
                        )}>{dt.getDate()}</span>
                        {dt.getDate() === 1 && (
                          <span className="text-[8px] text-[var(--foreground)]/40 block">
                            {dt.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short' })}
                          </span>
                        )}
                      </th>
                    );
                  })}
                  <th className="px-3 py-3.5 text-center min-w-[60px] border-s border-[var(--foreground)]/[0.06]">
                    <span className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider">{isAr ? 'العدد' : 'Total'}</span>
                  </th>
                  <th className="px-3 py-3.5 text-center min-w-[70px] border-s border-[var(--foreground)]/[0.06]">
                    <span className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-wider">{isAr ? 'المعدل' : 'Rate'}</span>
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
                      'border-b border-[var(--foreground)]/[0.04] hover:bg-[var(--foreground)]/[0.02] transition-colors',
                      hi % 2 === 1 && 'bg-[var(--foreground)]/[0.015]'
                    )}>
                      <td className="px-5 py-3 sticky start-0 z-10 bg-[var(--color-background)] border-e border-[var(--foreground)]/[0.06]">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: habit.color }} />
                          <div className="min-w-0">
                            <span className="text-sm font-semibold truncate block max-w-[160px]">{isAr ? habit.nameAr : habit.nameEn}</span>
                            <span className="text-[10px] text-[var(--foreground)]/40 block">
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
                            {isFuture || beforeCreated ? (
                              <div className="h-8 w-8 mx-auto rounded-lg bg-[var(--foreground)]/[0.02]" />
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
                      <td className="px-3 py-3 text-center border-s border-[var(--foreground)]/[0.06]">
                        <div className="flex flex-col items-center">
                          <span className="text-base font-bold text-[var(--color-primary)]">{totalAllTime}</span>
                          <span className="text-[9px] text-[var(--foreground)]/40">{isAr ? 'مرة' : 'times'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center border-s border-[var(--foreground)]/[0.06]">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            'text-sm font-bold',
                            rate >= 80 ? 'text-emerald-500' :
                            rate >= 50 ? 'text-amber-500' :
                            'text-red-400'
                          )}>{rate}%</span>
                          <div className="w-10 h-1.5 rounded-full bg-[var(--foreground)]/[0.06] overflow-hidden">
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
                  <td className="px-5 py-3.5 sticky start-0 z-30 bg-[var(--color-background)] border-e border-[var(--foreground)]/[0.06]">
                    <span className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider">{isAr ? 'الإجمالي' : 'Daily Total'}</span>
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
                          <span className="text-[10px] text-[var(--foreground)]/20">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3.5 text-center border-s border-[var(--foreground)]/[0.06]">
                    <span className="text-sm font-bold text-[var(--color-primary)]">
                      {habits.reduce((sum, h) => sum + store.habitLogs.filter(l => l.habitId === h.id && l.completed).length, 0)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center border-s border-[var(--foreground)]/[0.06]">
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
            <span className="text-[10px] text-[var(--foreground)]/50 font-medium">{isAr ? 'مكتمل' : 'Done'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-red-500/10 flex items-center justify-center"><X className="h-2.5 w-2.5 text-red-400/60" /></div>
            <span className="text-[10px] text-[var(--foreground)]/50 font-medium">{isAr ? 'فائت' : 'Missed'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-[var(--foreground)]/[0.03]" />
            <span className="text-[10px] text-[var(--foreground)]/50 font-medium">{isAr ? 'غير مطبق' : 'N/A'}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function HabitDetail({ habit, onClose, onViewFull }: { habit: Habit; onClose: () => void; onViewFull: () => void }) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const stats = store.getHabitStats(habit.id);
  const streak = store.getHabitStreak(habit.id);
  const timeStats = useMemo(() => getHabitTimeStats(habit.id, store.habitLogs), [habit.id, store.habitLogs]);

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
    const startPad = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();
    const today = todayString();

    const days: { date: string; day: number; inMonth: boolean; completed: boolean; isFuture: boolean; beforeCreated: boolean; color: CompletionColor }[] = [];

    // Padding for days before 1st
    for (let i = 0; i < startPad; i++) {
      days.push({ date: '', day: 0, inMonth: false, completed: false, isFuture: false, beforeCreated: false, color: 'none' });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(year, month, d);
      const dateStr = dt.toISOString().split('T')[0];
      const isFuture = dateStr > today;
      const beforeCreated = dt < new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      const log = !isFuture && !beforeCreated ? store.habitLogs.find(l => l.habitId === habit.id && l.date === dateStr && l.completed) : undefined;
      days.push({
        date: dateStr,
        day: d,
        inMonth: true,
        completed: !!log,
        isFuture,
        beforeCreated,
        color: !isFuture && !beforeCreated ? getCompletionColor(habit, log) : 'none',
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

  const monthLabel = new Date(calMonth.year, calMonth.month).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="p-5 border-b border-[var(--foreground)]/[0.1]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
            <h2 className="text-lg font-semibold">{isAr ? habit.nameAr : habit.nameEn}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { labelEn: 'Current Streak', labelAr: 'السلسلة الحالية', value: streak.current, icon: Flame, color: 'text-orange-500' },
            { labelEn: 'Best Streak', labelAr: 'أفضل سلسلة', value: streak.best, icon: Star, color: 'text-amber-500' },
            { labelEn: 'Total Done', labelAr: 'إجمالي المرات', value: stats.totalCompletions, icon: CheckCircle2, color: 'text-emerald-500' },
            { labelEn: 'Rate', labelAr: 'معدل الإنجاز', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-blue-500' },
          ].map((s, i) => (
            <div key={i} className="app-stat-card rounded-xl p-3 text-center">
              <s.icon className={cn('h-4 w-4 mx-auto mb-1', s.color)} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-[var(--foreground)]/60">{isAr ? s.labelAr : s.labelEn}</p>
            </div>
          ))}
        </div>

        {/* Place & Time & Duration & Window */}
        {((isAr ? habit.placeAr : habit.placeEn) || habit.preferredTime || habit.expectedDuration || (habit.windowStart && habit.windowEnd)) && (
          <div className="flex items-center gap-2 flex-wrap">
            {(isAr ? habit.placeAr : habit.placeEn) && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/15">
                <MapPin className="h-3.5 w-3.5" /> {isAr ? habit.placeAr : habit.placeEn}
              </span>
            )}
            {habit.preferredTime && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/15">
                <Clock className="h-3.5 w-3.5" /> {habit.preferredTime}
              </span>
            )}
            {habit.expectedDuration && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
                <Hourglass className="h-3.5 w-3.5" />
                {habit.expectedDuration >= 60
                  ? `${Math.floor(habit.expectedDuration / 60)}${isAr ? 'س' : 'h'} ${habit.expectedDuration % 60 ? `${habit.expectedDuration % 60}${isAr ? 'د' : 'm'}` : ''}`
                  : `${habit.expectedDuration} ${isAr ? 'دقيقة' : 'min'}`}
              </span>
            )}
            {habit.windowStart && habit.windowEnd && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/15">
                <Target className="h-3.5 w-3.5" /> {habit.windowStart} – {habit.windowEnd}
              </span>
            )}
          </div>
        )}

        {/* Habit Loop */}
        {((isAr ? habit.cueAr : habit.cueEn) || (isAr ? habit.routineAr : habit.routineEn) || (isAr ? habit.rewardAr : habit.rewardEn)) && (
          <div className="rounded-xl border border-[var(--foreground)]/[0.08] bg-[var(--foreground)]/[0.02] p-4 space-y-3">
            <h3 className="text-xs font-semibold text-[var(--foreground)]/70 flex items-center gap-2">
              <Repeat className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              {isAr ? 'حلقة العادة' : 'Habit Loop'}
            </h3>
            <div className="flex items-center gap-2">
              {(isAr ? habit.cueAr : habit.cueEn) && (
                <div className="flex-1 text-center rounded-lg bg-amber-500/10 border border-amber-500/15 p-2.5">
                  <Lightbulb className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-[9px] font-bold text-amber-600 uppercase mb-0.5">{isAr ? 'الإشارة' : 'Cue'}</p>
                  <p className="text-[11px] text-[var(--foreground)]/70 leading-snug">{isAr ? habit.cueAr : habit.cueEn}</p>
                </div>
              )}
              {(isAr ? habit.routineAr : habit.routineEn) && (
                <>
                  <ArrowRight className={cn('h-3.5 w-3.5 text-[var(--foreground)]/20 shrink-0', isAr && 'rotate-180')} />
                  <div className="flex-1 text-center rounded-lg bg-blue-500/10 border border-blue-500/15 p-2.5">
                    <Repeat className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">{isAr ? 'الروتين' : 'Routine'}</p>
                    <p className="text-[11px] text-[var(--foreground)]/70 leading-snug">{isAr ? habit.routineAr : habit.routineEn}</p>
                  </div>
                </>
              )}
              {(isAr ? habit.rewardAr : habit.rewardEn) && (
                <>
                  <ArrowRight className={cn('h-3.5 w-3.5 text-[var(--foreground)]/20 shrink-0', isAr && 'rotate-180')} />
                  <div className="flex-1 text-center rounded-lg bg-emerald-500/10 border border-emerald-500/15 p-2.5">
                    <Gift className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-[9px] font-bold text-emerald-600 uppercase mb-0.5">{isAr ? 'المكافأة' : 'Reward'}</p>
                    <p className="text-[11px] text-[var(--foreground)]/70 leading-snug">{isAr ? habit.rewardAr : habit.rewardEn}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Month calendar grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalMonth(m => {
              const prev = new Date(m.year, m.month - 1);
              return { year: prev.getFullYear(), month: prev.getMonth() };
            })} disabled={!canGoPrev}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[var(--foreground)]/[0.08] disabled:opacity-30">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <h3 className="text-xs font-semibold">{monthLabel}</h3>
            <button onClick={() => setCalMonth(m => {
              const next = new Date(m.year, m.month + 1);
              return { year: next.getFullYear(), month: next.getMonth() };
            })} disabled={!canGoNext}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[var(--foreground)]/[0.08] disabled:opacity-30">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {(isAr ? DAY_LABELS.ar : DAY_LABELS.en).map(d => (
              <div key={d} className="text-center text-[8px] font-semibold text-[var(--foreground)]/50 uppercase">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const isApplicable = day.inMonth && !day.isFuture && !day.beforeCreated;
              const isToday = day.date === todayString();
              return (
                <div key={i} title={day.date}
                  className={cn(
                    'h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-colors relative',
                    !day.inMonth && 'invisible',
                    day.isFuture && 'text-[var(--foreground)]/15 bg-[var(--foreground)]/[0.02]',
                    day.beforeCreated && day.inMonth && 'text-[var(--foreground)]/10',
                    isApplicable && day.color === 'green' && 'bg-emerald-500 text-white',
                    isApplicable && day.color === 'orange' && 'bg-amber-500 text-white',
                    isApplicable && day.color === 'red' && 'bg-red-500/80 text-white',
                    isApplicable && day.color === 'none' && day.completed && 'bg-emerald-500 text-white',
                    isApplicable && day.color === 'none' && !day.completed && 'bg-red-500/80 text-white',
                    isToday && 'ring-2 ring-[var(--color-primary)] ring-offset-1',
                  )}>
                  {day.inMonth && day.day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2.5">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-emerald-500" />
              <span className="text-[9px] text-[var(--foreground)]/50">{isAr ? 'مكتمل' : 'Done'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-red-500/80" />
              <span className="text-[9px] text-[var(--foreground)]/50">{isAr ? 'فائت' : 'Missed'}</span>
            </div>
          </div>
        </div>

        {/* Full calendar button */}
        <button onClick={onViewFull}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-[var(--color-primary)] text-xs font-semibold hover:bg-[var(--color-primary)]/10 transition-colors">
          <CalendarIcon className="h-3.5 w-3.5" />
          {isAr ? 'عرض كل الأيام' : 'View All Days'}
        </button>

        {/* Repetitions breakdown */}
        <div>
          <h3 className="text-xs font-medium text-[var(--foreground)]/70 mb-2">
            {isAr ? 'عدد التكرارات' : 'Repetitions'}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: isAr ? 'أسبوع' : 'Week', value: timeStats.reps.week, color: 'text-emerald-600 bg-emerald-500/10' },
              { label: isAr ? 'شهر' : 'Month', value: timeStats.reps.month, color: 'text-emerald-600 bg-emerald-500/10' },
              { label: isAr ? 'سنة' : 'Year', value: timeStats.reps.year, color: 'text-emerald-600 bg-emerald-500/10' },
              { label: isAr ? 'المجمل' : 'Total', value: timeStats.reps.total, color: 'text-emerald-600 bg-emerald-500/10' },
            ].map((r, i) => (
              <div key={i} className={cn('text-center rounded-xl p-2.5 border border-emerald-500/10', r.color.split(' ')[1])}>
                <p className={cn('text-lg font-bold', r.color.split(' ')[0])}>{r.value}</p>
                <p className="text-[9px] text-[var(--foreground)]/50 font-medium">{r.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Time spent breakdown */}
        <div>
          <h3 className="text-xs font-medium text-[var(--foreground)]/70 mb-2">
            {isAr ? 'الوقت المصروف' : 'Time Spent'}
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { label: isAr ? 'اليوم' : 'Today', value: formatMins(timeStats.mins.today) },
              { label: isAr ? 'أسبوع' : 'Week', value: formatMins(timeStats.mins.week) },
              { label: isAr ? 'شهر' : 'Month', value: formatMins(timeStats.mins.month) },
            ].map((r, i) => (
              <div key={i} className="text-center rounded-xl p-2.5 bg-blue-500/10 border border-blue-500/10">
                <p className="text-sm font-bold text-blue-600">{r.value}</p>
                <p className="text-[9px] text-[var(--foreground)]/50 font-medium">{r.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: isAr ? 'سنة' : 'Year', value: formatMins(timeStats.mins.year) },
              { label: isAr ? 'المجمل' : 'Total', value: formatMins(timeStats.mins.total) },
            ].map((r, i) => (
              <div key={i} className="text-center rounded-xl p-2.5 bg-blue-500/10 border border-blue-500/10">
                <p className="text-sm font-bold text-blue-600">{r.value}</p>
                <p className="text-[9px] text-[var(--foreground)]/50 font-medium">{r.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekday performance */}
        <div>
          <h3 className="text-xs font-medium text-[var(--foreground)]/70 mb-2">
            {isAr ? 'الأداء حسب اليوم' : 'Performance by Day'}
          </h3>
          <div className="flex items-end gap-1 h-20">
            {stats.completionsByWeekday.map((count, i) => {
              const max = Math.max(...stats.completionsByWeekday, 1);
              const height = (count / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-sm bg-[var(--color-primary)]/20 relative" style={{ height: `${Math.max(height, 4)}%` }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-sm bg-[var(--color-primary)]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-[var(--foreground)]/30">
                    {isAr ? DAY_LABELS.ar[i] : DAY_LABELS.en[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best day insight */}
        <div className="rounded-xl bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent p-3 border border-[var(--color-primary)]/10">
          <p className="text-xs text-[var(--foreground)]/80">
            {isAr
              ? `🏆 أفضل يوم لك هو ${stats.bestDay} — أضعف يوم هو ${stats.worstDay}`
              : `🏆 Your best day is ${stats.bestDay} — weakest is ${stats.worstDay}`}
          </p>
        </div>
      </div>
    </div>
  );
}
