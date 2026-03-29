'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import { useHabitTimer, useStoreHabitTimer, HabitTimerControls } from '@/components/app/habit-timer-controls';
import { useToast } from '@/components/app/toast-notifications';
import {
  Habit, HabitLog, DEFAULT_HABIT_CATEGORIES, HabitCategory, HabitFrequency,
  HabitType, HabitTrackingType, Priority, Difficulty, todayString, generateId, ITEM_COLORS,
  WeekDay, formatDuration, formatTimerDuration, resolveHabitColor,
} from '@/types/app';
import {
  Plus, CheckCircle2, Circle, Flame, Filter, Search, X, Archive,
  MoreHorizontal, Trash2, Edit3, Eye, ChevronDown, Calendar as CalendarIcon,
  TrendingUp, Target, Clock, Star, BarChart3, Table2, ListChecks, PieChart,
  ChevronLeft, ChevronRight, RotateCcw, Zap, Award, Hash, Trophy, Activity,
  Sparkles, ArrowRight, Play, Pause, Square, Timer, MapPin, Repeat, Gift,
  Lightbulb, Maximize2, Hourglass, LayoutGrid, List, Columns3, Grid3x3,
  CreditCard, Palette, ArrowUpDown, SlidersHorizontal, Minus, GripVertical, Tag, Rows3, ChevronsUpDown,
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// useHabitTimer, useStoreHabitTimer, HabitTimerControls imported from @/components/app/habit-timer-controls

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
  const [gridCols, setGridCols] = useState<2 | 3>(3);
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'priority' | 'newest' | 'streak' | 'completion' | 'order' | 'custom'>('order');
  const [showGoals, setShowGoals] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalTaggingId, setGoalTaggingId] = useState<string | null>(null);
  const [goalNewTags, setGoalNewTags] = useState<string[]>([]);
  const [identityGoals, setIdentityGoals] = useState<{ id: string; text: string; createdAt: string; habitIds?: string[] }[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('habits-identity-goals') || '[]'); } catch { return []; }
  });
  const saveGoals = useCallback((goals: typeof identityGoals) => {
    setIdentityGoals(goals);
    localStorage.setItem('habits-identity-goals', JSON.stringify(goals));
  }, []);
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'avoidance'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterTracking, setFilterTracking] = useState<'all' | 'boolean' | 'count' | 'timer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'done' | 'pending' | 'missed'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
    trackingType: 'boolean' as HabitTrackingType,
    targetValue: 1,
    targetUnit: 'times',
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
    orderNumber: '' as string | number, colSpan: 1, rowSpan: 1,
    streakGoal: '' as string | number, streakRewardEn: '', streakRewardAr: '',
    streakGoal2: '' as string | number, streakRewardEn2: '', streakRewardAr2: '',
    streakGoal3: '' as string | number, streakRewardEn3: '', streakRewardAr3: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
      category: 'health', frequency: 'daily', customDays: [],
      priority: 'medium', difficulty: 'medium', color: ITEM_COLORS[0],
      icon: 'Activity', type: 'positive',
      trackingType: 'boolean', targetValue: 1, targetUnit: 'times',
      scheduleType: 'daily', weeklyTarget: 3, allowPartial: false, allowSkip: false,
      reminderEnabled: false, reminderTime: '08:00',
      image: '',
      cueEn: '', cueAr: '', routineEn: '', routineAr: '', rewardEn: '', rewardAr: '',
      placeEn: '', placeAr: '', preferredTime: '', expectedDuration: '',
      windowStart: '', windowEnd: '', strictWindow: false, maxDailyReps: '', orderNumber: '', colSpan: 1, rowSpan: 1,
      streakGoal: '', streakRewardEn: '', streakRewardAr: '',
      streakGoal2: '', streakRewardEn2: '', streakRewardAr2: '',
      streakGoal3: '', streakRewardEn3: '', streakRewardAr3: '',
      notes: '',
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
    store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true });
    toast.notifyHabitComplete(isAr ? habit.nameAr : habit.nameEn);
  }, [store, today, isAr, toast]);

  const openEdit = (habit: Habit) => {
    setFormData({
      nameEn: habit.nameEn, nameAr: habit.nameAr,
      descriptionEn: habit.descriptionEn, descriptionAr: habit.descriptionAr,
      category: habit.category, frequency: habit.frequency,
      customDays: habit.customDays ?? [],
      priority: habit.priority, difficulty: habit.difficulty,
      color: habit.color, icon: habit.icon, type: habit.type,
      trackingType: habit.trackingType ?? 'boolean',
      targetValue: habit.targetValue ?? 1,
      targetUnit: habit.targetUnit ?? 'times',
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
      orderNumber: habit.order ?? '', colSpan: habit.colSpan ?? 1, rowSpan: habit.rowSpan ?? 1,
      streakGoal: habit.streakGoal ?? '', streakRewardEn: habit.streakRewardEn ?? '', streakRewardAr: habit.streakRewardAr ?? '',
      streakGoal2: habit.streakGoal2 ?? '', streakRewardEn2: habit.streakRewardEn2 ?? '', streakRewardAr2: habit.streakRewardAr2 ?? '',
      streakGoal3: habit.streakGoal3 ?? '', streakRewardEn3: habit.streakRewardEn3 ?? '', streakRewardAr3: habit.streakRewardAr3 ?? '',
      notes: habit.notes ?? '',
    });
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.nameEn && !formData.nameAr) return;
    const { orderNumber, streakGoal, streakGoal2, streakGoal3, maxDailyReps, ...rest } = formData;
    const data = {
      ...rest,
      expectedDuration: formData.expectedDuration ? Number(formData.expectedDuration) : undefined,
      windowStart: formData.windowStart || undefined,
      windowEnd: formData.windowEnd || undefined,
      strictWindow: formData.strictWindow || undefined,
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
  };

  const filteredHabits = useMemo(() => {
    let result = store.habits.filter(h => {
      if (h.archived !== showArchived) return false;
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
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      {/* ═══ Hero Title Section ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-6 pt-2"
      >
        {/* Animated icon */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 5, -5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4 shadow-lg"
          style={{ background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.6))`, boxShadow: `0 8px 30px rgba(var(--color-primary-rgb) / 0.3)` }}
        >
          <Sparkles className="h-8 w-8 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter cursor-default"
          whileHover={{ scale: 1.05, letterSpacing: '-0.02em' }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{
            background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.5), var(--color-primary))`,
            backgroundSize: '200% 200%',
            animation: 'gradientShift 4s ease infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 4px 12px rgba(var(--color-primary-rgb) / 0.2))`,
          }}
        >
          {isAr ? 'العادات' : 'Habits'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-base font-bold text-[var(--foreground)]/70 mt-2"
        >
          {isAr ? 'ابنِ عاداتك، اصنع حياتك' : 'Build your habits, shape your life'}
        </motion.p>
      </motion.div>

      {/* ═══ Inspirational Quote ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative overflow-hidden rounded-3xl mb-8 group/quote cursor-default"
        style={{ background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.65))` }}
      >
        {/* Animated background effects */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 end-0 w-60 h-60 rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 60%)' }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-0 start-0 w-48 h-48 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 60%)' }}
        />
        {/* Shimmer line */}
        <div className="absolute inset-0 opacity-0 group-hover/quote:opacity-100 transition-opacity duration-700"
          style={{ background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'shimmer 2s ease infinite' }} />

        <div className="relative z-10 p-7 sm:p-10 text-center text-white">
          {/* Quote mark */}
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-5xl font-black mb-2 select-none" style={{ lineHeight: 1 }}
          >"</motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-base sm:text-lg font-bold leading-loose max-w-2xl mx-auto mb-5"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            dir="rtl"
          >
            أغمض عينيك، وسافر بخيالك إلى مستقبلٍ بعيد، حيث تقف أمام عمرٍ أثقلته الحسرة وأحلامٍ أرهقها التأجيل. هناك تمنّيت فرصة واحدة فقط: أن تعود إلى هذه اللحظة لتبدأ كما ينبغي.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl"
            >✨</motion.span>
            <span className="text-lg sm:text-xl font-black" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }} dir="rtl">
              افتح عينيك... أنت هنا فعلًا. انهض وابدأ!
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══ Tabs ═══ */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-6">

        {/* Tabs — centered */}
        <div className="flex items-center justify-center gap-2">
          {([
            { key: 'habits' as const, labelEn: 'My Habits', labelAr: 'عاداتي' },
            { key: 'insights' as const, labelEn: 'Insights', labelAr: 'التحليلات' },
          ]).map(tab => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative px-6 py-2.5 text-sm font-bold rounded-xl transition-all',
                activeTab === tab.key
                  ? 'text-white shadow-lg'
                  : 'text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.06] border border-[var(--foreground)]/[0.1]'
              )}
              style={activeTab === tab.key ? { background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.75))` } : undefined}
            >
              {isAr ? tab.labelAr : tab.labelEn}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {activeTab === 'habits' ? (
        <>
          {/* Stats Bar */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-3 gap-3 mb-6">
            <motion.div whileHover={{ scale: 1.02, y: -2 }} className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-5 text-center transition-shadow hover:shadow-lg cursor-default">
              <Target className="h-5 w-5 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-black tracking-tight">{activeHabitsCount}</p>
              <p className="text-xs font-bold text-[var(--foreground)]/70 mt-1">{isAr ? 'عادات نشطة' : 'Active Habits'}</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02, y: -2 }} className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5 text-center transition-shadow hover:shadow-lg cursor-default">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-black tracking-tight">{completedTodayCount}<span className="text-lg font-bold text-[var(--foreground)]/40"> / {activeHabitsCount}</span></p>
              <p className="text-xs font-bold text-[var(--foreground)]/70 mt-1">{isAr ? 'مكتملة اليوم' : 'Done Today'}</p>
              {activeHabitsCount > 0 && (
                <div className="mt-2.5 h-2 rounded-full bg-[var(--foreground)]/[0.08] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((completedTodayCount / activeHabitsCount) * 100)}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-emerald-500" />
                </div>
              )}
            </motion.div>
            <motion.div whileHover={{ scale: 1.02, y: -2 }} className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-5 text-center transition-shadow hover:shadow-lg cursor-default">
              <Archive className="h-5 w-5 text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-black tracking-tight">{store.habits.filter(h => h.archived).length}</p>
              <p className="text-xs font-bold text-[var(--foreground)]/70 mt-1">{isAr ? 'مؤرشفة' : 'Archived'}</p>
            </motion.div>
          </motion.div>

          {/* Toolbar */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="flex flex-wrap items-center gap-2.5 mb-6 relative z-[100]">
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
                  <button className="flex items-center gap-2 rounded-xl border border-[var(--foreground)]/[0.12] bg-[var(--color-primary)]/5 px-4 py-2.5 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/25 transition-all">
                    <current.icon className="h-4 w-4 text-[var(--color-primary)]" />
                    {isAr ? current.ar : current.en}
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--foreground)]/50" />
                  </button>
                  <div className="absolute top-full mt-1.5 start-0 z-50 w-48 rounded-xl border border-[var(--foreground)]/[0.1] bg-[var(--color-background)] shadow-xl py-1.5 opacity-0 invisible group-hover/view:opacity-100 group-hover/view:visible transition-all duration-200">
                    {views.map(v => (
                      <button key={v.key} onClick={() => setViewMode(v.key)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition-all',
                          viewMode === v.key
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.06]'
                        )}>
                        <v.icon className="h-4 w-4" />
                        {isAr ? v.ar : v.en}
                        {viewMode === v.key && <CheckCircle2 className="h-3.5 w-3.5 ms-auto text-[var(--color-primary)]" />}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Category Filter */}
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-[var(--foreground)]/[0.12] bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] hover:border-[var(--foreground)]/[0.2] focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all cursor-pointer">
              <option value="all">{isAr ? 'كل الفئات' : 'All Categories'}</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{isAr ? (CATEGORY_LABELS[c]?.ar ?? c) : (CATEGORY_LABELS[c]?.en ?? c)}</option>
              ))}
            </select>

            {/* Archive */}
            <button onClick={() => setShowArchived(!showArchived)}
              className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all',
                showArchived
                  ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'border-[var(--foreground)]/[0.12] text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] hover:border-[var(--foreground)]/[0.2]')}>
              <Archive className="h-4 w-4" />
              {showArchived ? (isAr ? 'المؤرشفة' : 'Archived') : (isAr ? 'الأرشيف' : 'Archive')}
            </button>

            {/* Compliance */}
            <button onClick={() => setShowFullTable(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--foreground)]/[0.12] px-4 py-2.5 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] hover:border-[var(--foreground)]/[0.2] transition-all">
              <Table2 className="h-4 w-4" />
              {isAr ? 'جدول الالتزام' : 'Compliance Table'}
            </button>
            <Link href="/app/habits/log"
              className="flex items-center gap-2 rounded-xl border border-[var(--foreground)]/[0.12] px-4 py-2.5 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] hover:border-[var(--foreground)]/[0.2] transition-all">
              <CalendarIcon className="h-4 w-4" />
              {isAr ? 'السجل' : 'History'}
            </Link>

            {/* Categories */}
            <div className="relative z-[100]">
              <button onClick={() => setShowCategoryManager(!showCategoryManager)}
                className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all',
                  showCategoryManager
                    ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--foreground)]/[0.12] text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] hover:border-[var(--foreground)]/[0.2]')}>
                <Plus className="h-4 w-4" />
                {isAr ? 'الفئات' : 'Categories'}
              </button>
              <AnimatePresence>
                {showCategoryManager && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute top-full mt-2 end-0 z-50 w-64 rounded-xl border border-[var(--foreground)]/[0.08] bg-[var(--color-background)] shadow-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold">{isAr ? 'إدارة الفئات' : 'Manage Categories'}</h4>
                      <button onClick={() => setShowCategoryManager(false)} className="h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.08]">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
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
                        className="flex-1 rounded-lg border border-[var(--foreground)]/[0.08] bg-transparent px-2.5 py-1.5 text-xs"
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

            {/* Sort */}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl border border-[var(--foreground)]/[0.12] bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] hover:border-[var(--foreground)]/[0.2] focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all cursor-pointer">
              <option value="default">{isAr ? 'ترتيب افتراضي' : 'Default Order'}</option>
              <option value="name">{isAr ? 'الاسم' : 'Name'}</option>
              <option value="priority">{isAr ? 'الأولوية' : 'Priority'}</option>
              <option value="newest">{isAr ? 'الأحدث' : 'Newest'}</option>
              <option value="streak">{isAr ? 'السلسلة' : 'Streak'}</option>
              <option value="completion">{isAr ? 'نسبة الإنجاز' : 'Completion %'}</option>
              <option value="order">{isAr ? 'رقم الترتيب' : 'Order Number'}</option>
              <option value="custom">{isAr ? 'ترتيب يدوي (سحب)' : 'Custom (Drag)'}</option>
            </select>
            {/* Advanced Filters */}
            {(() => {
              const activeFilterCount = [filterType !== 'all', filterPriority !== 'all', filterTracking !== 'all', filterStatus !== 'all'].filter(Boolean).length;
              return (
                <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all',
                    showAdvancedFilters || activeFilterCount > 0
                      ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-[var(--foreground)]/[0.12] text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] hover:border-[var(--foreground)]/[0.2]')}>
                  <SlidersHorizontal className="h-4 w-4" />
                  {isAr ? 'فلاتر' : 'Filters'}
                  {activeFilterCount > 0 && <span className="text-[11px] font-black bg-[var(--color-primary)] text-white h-5 min-w-[20px] rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                </button>
              );
            })()}

            {/* Search */}
            {/* Column toggle + Expand/Collapse */}
            {viewMode === 'cards' && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-xl border border-[var(--foreground)]/[0.12] p-1">
                  {([2, 3] as const).map(n => (
                    <button key={n} onClick={() => setGridCols(n)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-black transition-all',
                        gridCols === n ? 'text-white' : 'text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.06]')}
                      style={gridCols === n ? { background: 'var(--color-primary)' } : undefined}>
                      {n}
                    </button>
                  ))}
                </div>
                <button onClick={() => { const next = !cardsExpanded; setCardsExpanded(next); if (next) { const totalRows = Math.ceil(filteredHabits.length / gridCols); setExpandedRows(new Set(Array.from({ length: totalRows }, (_, i) => i))); } else { setExpandedRows(new Set()); } }}
                  className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all',
                    cardsExpanded
                      ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-[var(--foreground)]/[0.12] text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05]')}>
                  <ChevronDown className={cn('h-4 w-4 transition-transform', cardsExpanded && 'rotate-180')} />
                  {cardsExpanded ? (isAr ? 'طي الكل' : 'Collapse') : (isAr ? 'توسيع الكل' : 'Expand')}
                </button>
              </div>
            )}

            <div className="relative ms-auto">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/40" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث...' : 'Search...'}
                className="rounded-xl border border-[var(--foreground)]/[0.1] bg-transparent ps-9 pe-3 py-2.5 text-sm font-medium w-[160px] sm:w-[220px] placeholder:text-[var(--foreground)]/40 focus:outline-none focus:border-[var(--color-primary)]/40 focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all" />
            </div>
          </motion.div>

          {/* Add New Habit — prominent CTA */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2.5} className="mb-5">
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { resetForm(); setShowForm(true); }}
              className="w-full sm:w-auto sm:mx-auto sm:flex app-btn-primary inline-flex items-center justify-center gap-2.5 rounded-2xl px-8 py-3.5 text-base font-black text-white shadow-lg hover:shadow-xl transition-all"
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Type filter */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)]/70 uppercase tracking-wider mb-2 block">{isAr ? 'النوع' : 'Type'}</label>
                      <div className="flex flex-wrap gap-1">
                        {([
                          { v: 'all' as const, en: 'All', ar: 'الكل' },
                          { v: 'positive' as const, en: 'Build', ar: 'إيجابية' },
                          { v: 'avoidance' as const, en: 'Break', ar: 'تجنب' },
                        ]).map(o => (
                          <button key={o.v} onClick={() => setFilterType(o.v)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                              filterType === o.v ? 'bg-[var(--foreground)]/[0.12] text-[var(--foreground)] shadow-sm' : 'text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/[0.06]')}>
                            {isAr ? o.ar : o.en}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Priority filter */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)]/70 uppercase tracking-wider mb-2 block">{isAr ? 'الأولوية' : 'Priority'}</label>
                      <div className="flex flex-wrap gap-1">
                        {([
                          { v: 'all' as const, en: 'All', ar: 'الكل' },
                          { v: 'high' as const, en: 'High', ar: 'عالية' },
                          { v: 'medium' as const, en: 'Med', ar: 'متوسطة' },
                          { v: 'low' as const, en: 'Low', ar: 'منخفضة' },
                        ]).map(o => (
                          <button key={o.v} onClick={() => setFilterPriority(o.v)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                              filterPriority === o.v ? 'bg-[var(--foreground)]/[0.12] text-[var(--foreground)] shadow-sm' : 'text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/[0.06]')}>
                            {isAr ? o.ar : o.en}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Tracking type filter */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)]/70 uppercase tracking-wider mb-2 block">{isAr ? 'التتبع' : 'Tracking'}</label>
                      <div className="flex flex-wrap gap-1">
                        {([
                          { v: 'all' as const, en: 'All', ar: 'الكل' },
                          { v: 'boolean' as const, en: 'Yes/No', ar: 'نعم/لا' },
                          { v: 'count' as const, en: 'Count', ar: 'عدّ' },
                          { v: 'timer' as const, en: 'Timer', ar: 'مؤقت' },
                        ]).map(o => (
                          <button key={o.v} onClick={() => setFilterTracking(o.v)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                              filterTracking === o.v ? 'bg-[var(--foreground)]/[0.12] text-[var(--foreground)] shadow-sm' : 'text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/[0.06]')}>
                            {isAr ? o.ar : o.en}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Status filter */}
                    <div>
                      <label className="text-[11px] font-bold text-[var(--foreground)]/70 uppercase tracking-wider mb-2 block">{isAr ? 'الحالة اليوم' : "Today's Status"}</label>
                      <div className="flex flex-wrap gap-1">
                        {([
                          { v: 'all' as const, en: 'All', ar: 'الكل' },
                          { v: 'done' as const, en: 'Done', ar: 'مكتمل' },
                          { v: 'pending' as const, en: 'Pending', ar: 'متبقي' },
                        ]).map(o => (
                          <button key={o.v} onClick={() => setFilterStatus(o.v)}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                              filterStatus === o.v ? 'bg-[var(--foreground)]/[0.12] text-[var(--foreground)] shadow-sm' : 'text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/[0.06]')}>
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

          {/* ── Today Focus ── */}
          {!showArchived && activeHabitsCount > 0 && (() => {
            const todayHabits = store.habits.filter(h => !h.archived);
            const doneIds = new Set(store.habitLogs.filter(l => l.date === today && l.completed).map(l => l.habitId));
            const timerHabitId = ht.activeHabitId;
            const inProgress = todayHabits.filter(h => h.id === timerHabitId && !doneIds.has(h.id));
            // Sort remaining by preferredTime then priority
            const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
            const remaining = todayHabits.filter(h => !doneIds.has(h.id) && h.id !== timerHabitId)
              .sort((a, b) => {
                // By preferred time first (empty = end)
                const tA = a.preferredTime || 'zzz';
                const tB = b.preferredTime || 'zzz';
                if (tA !== tB) return tA.localeCompare(tB);
                return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
              });
            const done = todayHabits.filter(h => doneIds.has(h.id));
            const allDone = remaining.length === 0 && inProgress.length === 0;
            return (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="mb-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.02] overflow-hidden shadow-sm">
                {/* Section header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-500/10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-sm font-black">{isAr ? 'تركيز اليوم' : "Today's Focus"}</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--foreground)]/70">
                    {allDone
                      ? (isAr ? 'أحسنت! أكملت الكل ✓' : 'All done! Great job ✓')
                      : `${done.length} / ${todayHabits.length} ${isAr ? 'مكتمل' : 'done'}`}
                  </span>
                </div>

                {/* In-progress timer */}
                {inProgress.map(h => {
                  const habit = h;
                  return (
                    <div key={habit.id} className="px-4 py-3 border-b border-[var(--foreground)]/[0.05] flex items-center gap-3"
                      style={{ background: `${habit.color}08` }}>
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${habit.color}18` }}>
                        <Timer className="h-4 w-4 animate-pulse" style={{ color: habit.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{isAr ? habit.nameAr : habit.nameEn}</p>
                        <p className="text-[10px] font-medium" style={{ color: habit.color }}>
                          {isAr ? 'المؤقت يعمل...' : 'Timer running...'}
                        </p>
                      </div>
                      <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={false} size="xs" />
                    </div>
                  );
                })}

                {/* Remaining habits — compact horizontal list */}
                {remaining.length > 0 && (
                  <div className="px-5 py-3.5 space-y-2">
                    {remaining.length > 0 && (
                      <p className="text-xs font-bold text-[var(--foreground)]/70 uppercase tracking-wider mb-2.5">
                        {isAr ? 'المتبقية' : 'Remaining'} ({remaining.length})
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {remaining.map(habit => {
                        const hasDuration = !!habit.expectedDuration;
                        const hIsCount = habit.trackingType === 'count';
                        const isTimerBusy = ht.hasActiveTimer && ht.activeHabitId !== habit.id;
                        const hCountVal = hIsCount ? store.habitLogs.filter(l => l.habitId === habit.id && l.date === today).reduce((s, l) => s + (l.value ?? (l.completed ? 1 : 0)), 0) : 0;
                        const hCountTarget = hIsCount ? (habit.targetValue ?? 1) : 1;
                        return (
                          <button key={habit.id}
                            onClick={() => {
                              if (hasDuration || hIsCount) {
                                // Open detail for timer and count habits
                                setDetailHabit(habit);
                              } else {
                                // Quick-complete boolean habits
                                store.logHabit({
                                  habitId: habit.id, date: today,
                                  time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                                  note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true,
                                });
                              }
                            }}
                            disabled={hasDuration && isTimerBusy}
                            className={cn(
                              'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all border',
                              hasDuration && isTimerBusy
                                ? 'opacity-40 cursor-not-allowed border-[var(--foreground)]/[0.06]'
                                : 'border-[var(--foreground)]/[0.1] hover:border-[var(--foreground)]/[0.2] hover:bg-[var(--foreground)]/[0.04] hover:shadow-sm active:scale-95'
                            )}>
                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: resolveHabitColor(habit.color) }} />
                            <span className="truncate max-w-[130px]">{isAr ? habit.nameAr : habit.nameEn}</span>
                            {hIsCount && <span className="text-[10px] text-[var(--foreground)]/60 font-mono">{hCountVal}/{hCountTarget}</span>}
                            {hasDuration ? (
                              <Play className="h-3 w-3 text-[var(--foreground)]/50" />
                            ) : hIsCount ? (
                              <Hash className="h-3 w-3 text-[var(--foreground)]/50" />
                            ) : (
                              <Circle className="h-3 w-3 text-[var(--foreground)]/50" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Done habits — collapsed row */}
                {done.length > 0 && (
                  <div className="px-5 py-3 border-t border-emerald-500/10 flex items-center gap-2.5 flex-wrap">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    {done.map(h => (
                      <span key={h.id} className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500/50" />
                        {isAr ? h.nameAr : h.nameEn}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* ── Identity & Goals Section ── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mb-6">
            {/* Toggle button */}
            <button onClick={() => setShowGoals(!showGoals)}
              className="w-full flex items-center justify-between rounded-2xl px-5 py-3.5 transition-all border"
              style={{
                background: showGoals ? `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.75))` : `rgba(var(--color-primary-rgb) / 0.04)`,
                borderColor: showGoals ? 'transparent' : `rgba(var(--color-primary-rgb) / 0.15)`,
                color: showGoals ? 'white' : 'var(--foreground)',
              }}>
              <div className="flex items-center gap-3">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', showGoals ? 'bg-white/20' : 'bg-[var(--color-primary)]/10')}>
                  <Star className={cn('h-5 w-5', showGoals ? 'text-white' : 'text-[var(--color-primary)]')} />
                </div>
                <div className="text-start">
                  <p className="text-sm font-black">{isAr ? 'هويتي وأهدافي' : 'My Identity & Goals'}</p>
                  <p className={cn('text-xs font-medium', showGoals ? 'text-white/80' : 'text-[var(--foreground)]/60')}>
                    {isAr ? 'لماذا أبني هذه العادات؟ من أريد أن أكون؟' : 'Why am I building these habits? Who do I want to become?'}
                  </p>
                </div>
              </div>
              <ChevronDown className={cn('h-5 w-5 transition-transform duration-300', showGoals && 'rotate-180')} />
            </button>

            {/* Collapsible content */}
            <AnimatePresence>
              {showGoals && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border mt-2 p-5 space-y-4"
                    style={{ borderColor: `rgba(var(--color-primary-rgb) / 0.15)`, background: `rgba(var(--color-primary-rgb) / 0.02)` }}>

                    {/* Add new goal */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={goalInput}
                          onChange={e => setGoalInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && goalInput.trim()) {
                              saveGoals([...identityGoals, { id: generateId(), text: goalInput.trim(), createdAt: new Date().toISOString(), habitIds: goalNewTags.length > 0 ? goalNewTags : undefined }]);
                              setGoalInput(''); setGoalNewTags([]);
                            }
                          }}
                          placeholder={isAr ? 'مثال: أنا شخص رياضي يتمرن يوميًا...' : 'e.g., I am someone who exercises daily...'}
                          dir={isAr ? 'rtl' : 'ltr'}
                          className="flex-1 rounded-xl bg-transparent px-4 py-3 text-sm font-medium border transition-all"
                          style={{ borderColor: `rgba(var(--color-primary-rgb) / 0.15)` }}
                        />
                        <button
                          onClick={() => {
                            if (goalInput.trim()) {
                              saveGoals([...identityGoals, { id: generateId(), text: goalInput.trim(), createdAt: new Date().toISOString(), habitIds: goalNewTags.length > 0 ? goalNewTags : undefined }]);
                              setGoalInput(''); setGoalNewTags([]);
                            }
                          }}
                          disabled={!goalInput.trim()}
                          className="h-11 px-4 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all active:scale-95"
                          style={{ background: `linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.75))` }}
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                      {/* Tag habits to new goal */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[var(--foreground)]/60 flex items-center gap-1">
                          <Tag className="h-3 w-3" /> {isAr ? 'ربط بعادات:' : 'Tag habits:'}
                        </span>
                        {store.habits.filter(h => !h.archived).map(h => {
                          const tagged = goalNewTags.includes(h.id);
                          return (
                            <button key={h.id} onClick={() => setGoalNewTags(prev => tagged ? prev.filter(id => id !== h.id) : [...prev, h.id])}
                              className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95',
                                tagged ? 'text-white' : 'text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.05]')}
                              style={tagged ? { background: resolveHabitColor(h.color), borderColor: resolveHabitColor(h.color) } : { borderColor: `rgba(var(--color-primary-rgb) / 0.12)` }}>
                              <div className="h-2 w-2 rounded-full" style={{ background: tagged ? 'white' : resolveHabitColor(h.color) }} />
                              {isAr ? h.nameAr : h.nameEn}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Goals list */}
                    {identityGoals.length === 0 ? (
                      <div className="text-center py-6">
                        <Star className="h-8 w-8 mx-auto mb-2" style={{ color: `rgba(var(--color-primary-rgb) / 0.3)` }} />
                        <p className="text-sm font-bold text-[var(--foreground)]/60">
                          {isAr ? 'اكتب هويتك المستقبلية وأهدافك هنا' : 'Write your future identity and goals here'}
                        </p>
                        <p className="text-xs text-[var(--foreground)]/40 mt-1">
                          {isAr ? 'مثال: "أنا شخص منضبط يقرأ كل يوم" — "هدفي: قراءة 50 كتاب هذا العام"' : 'e.g., "I am a disciplined person who reads daily" — "Goal: Read 50 books this year"'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {identityGoals.map((goal, i) => {
                          const isTagging = goalTaggingId === goal.id;
                          const taggedHabits = (goal.habitIds || []).map(id => store.habits.find(h => h.id === id)).filter(Boolean) as Habit[];
                          return (
                            <motion.div
                              key={goal.id}
                              initial={{ opacity: 0, x: isAr ? 20 : -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="rounded-xl px-4 py-3 transition-all"
                              style={{ background: `rgba(var(--color-primary-rgb) / 0.04)`, border: `1px solid rgba(var(--color-primary-rgb) / 0.08)` }}
                            >
                              <div className="flex items-start gap-3 group">
                                <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ background: `rgba(var(--color-primary-rgb) / 0.12)` }}>
                                  <Star className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold leading-relaxed" dir={isAr ? 'rtl' : 'ltr'}>{goal.text}</p>
                                  {/* Tagged habits display */}
                                  {taggedHabits.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                      {taggedHabits.map(h => (
                                        <span key={h.id} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                                          style={{ background: resolveHabitColor(h.color) }}>
                                          {isAr ? h.nameAr : h.nameEn}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={() => { setGoalTaggingId(isTagging ? null : goal.id); }}
                                    className={cn('h-7 w-7 rounded-lg flex items-center justify-center transition-all',
                                      isTagging ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'opacity-0 group-hover:opacity-100 text-[var(--foreground)]/40 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10')}>
                                    <Tag className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => saveGoals(identityGoals.filter(g => g.id !== goal.id))}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 text-[var(--foreground)]/40 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              {/* Tag picker for existing goal */}
                              {isTagging && (
                                <div className="mt-2.5 pt-2.5 flex items-center gap-1.5 flex-wrap" style={{ borderTop: `1px solid rgba(var(--color-primary-rgb) / 0.1)` }}>
                                  <span className="text-[10px] font-bold text-[var(--foreground)]/50 flex items-center gap-1">
                                    <Tag className="h-2.5 w-2.5" /> {isAr ? 'ربط:' : 'Link:'}
                                  </span>
                                  {store.habits.filter(h => !h.archived).map(h => {
                                    const linked = (goal.habitIds || []).includes(h.id);
                                    return (
                                      <button key={h.id}
                                        onClick={() => {
                                          const newIds = linked ? (goal.habitIds || []).filter(id => id !== h.id) : [...(goal.habitIds || []), h.id];
                                          saveGoals(identityGoals.map(g => g.id === goal.id ? { ...g, habitIds: newIds.length > 0 ? newIds : undefined } : g));
                                        }}
                                        className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all active:scale-95',
                                          linked ? 'text-white' : 'text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.05]')}
                                        style={linked ? { background: resolveHabitColor(h.color), borderColor: resolveHabitColor(h.color) } : { borderColor: `rgba(var(--color-primary-rgb) / 0.12)` }}>
                                        <div className="h-2 w-2 rounded-full" style={{ background: linked ? 'white' : resolveHabitColor(h.color) }} />
                                        {isAr ? h.nameAr : h.nameEn}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Habits — view modes (wrapped in DndContext when drag mode) */}
          {(() => {
            const dndStrategy = viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy;
            const viewContent = (
              <>
              {viewMode === 'cards' && (
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
                  {filteredHabits.map((habit, i) => (
                    <SortableItem key={habit.id} id={habit.id} disabled={!isDragMode}>
                      <HabitFlipCard habit={habit} index={i} isAr={isAr} store={store} today={today} expanded={cardsExpanded || expandedRows.has(Math.floor(i / gridCols))}
                        onEdit={() => openEdit(habit)} onArchive={() => store.toggleHabitArchive(habit.id)} onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} onViewPage={`/app/habits/${habit.id}`}
                        rowExpanded={expandedRows.has(Math.floor(i / gridCols))}
                        onToggleRow={() => { const row = Math.floor(i / gridCols); setExpandedRows(prev => { const next = new Set(prev); if (next.has(row)) next.delete(row); else next.add(row); return next; }); }} />
                    </SortableItem>
                  ))}
                </div>
              )}

              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
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
                  <GripVertical className="h-4 w-4 text-[var(--foreground)]/25" />
                  <span className="text-xs font-medium text-[var(--foreground)]/40">
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
        </>
      ) : (
        <HabitsInsights isAr={isAr} store={store} />
      )}

          {filteredHabits.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--foreground)]/[0.04]">
                <Target className="h-6 w-6 text-[var(--foreground)]/25" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]/50 mb-1">
                {showArchived
                  ? (isAr ? 'لا توجد عادات مؤرشفة' : 'No archived habits')
                  : searchQuery
                    ? (isAr ? 'لا توجد عادات تطابق البحث' : 'No habits match your search')
                    : filterCategory !== 'all'
                      ? (isAr ? 'لا توجد عادات في هذه الفئة' : 'No habits in this category')
                      : (isAr ? 'لا توجد عادات بعد' : 'No habits yet')}
              </p>
              <p className="text-xs text-[var(--foreground)]/30 mb-4">
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
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/50 border border-[var(--foreground)]/[0.08] hover:bg-[var(--foreground)]/[0.04]">
                    <X className="h-3 w-3" /> {isAr ? 'مسح البحث' : 'Clear Search'}
                  </button>
                )}
                {filterCategory !== 'all' && (
                  <button onClick={() => setFilterCategory('all')}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/50 border border-[var(--foreground)]/[0.08] hover:bg-[var(--foreground)]/[0.04]">
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

              <div className="p-5 space-y-6">
                {/* ── Section: Basic Info ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-blue-500/10 flex items-center justify-center"><Edit3 className="h-3 w-3 text-blue-500" /></div>
                    <span className="text-xs font-bold text-[var(--foreground)]/70">{isAr ? 'المعلومات الأساسية' : 'Basic Info'}</span>
                  </div>
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
                    <span className="text-xs font-bold text-[var(--foreground)]/70">{isAr ? 'السلوك والتصنيف' : 'Behavior & Settings'}</span>
                  </div>
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
                {/* Order Number */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">
                    {isAr ? 'رقم الترتيب (اختياري)' : 'Order Number (optional)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.orderNumber}
                    onChange={e => setFormData(f => ({ ...f, orderNumber: e.target.value }))}
                    className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                    placeholder={isAr ? 'مثال: 1, 2, 3...' : 'e.g., 1, 2, 3...'}
                  />
                  <p className="text-[9px] text-[var(--foreground)]/35 mt-1">
                    {isAr ? 'رقم أصغر = يظهر أولاً عند الترتيب حسب الرقم' : 'Lower number = appears first when sorting by order'}
                  </p>
                </div>
                </div>

                {/* ── Section: Customization ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-pink-500/10 flex items-center justify-center"><Palette className="h-3 w-3 text-pink-500" /></div>
                    <span className="text-xs font-bold text-[var(--foreground)]/70">{isAr ? 'التخصيص' : 'Customization'}</span>
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
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">
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
                </div>

                {/* ── Section: Place & Time ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-teal-500/10 flex items-center justify-center"><MapPin className="h-3 w-3 text-teal-500" /></div>
                    <span className="text-xs font-bold text-[var(--foreground)]/70">{isAr ? 'المكان والزمان' : 'Place & Time'}</span>
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
                          <p className="text-[9px] text-[var(--foreground)]/50">
                            {isAr ? 'إذا انتهى الوقت بدون إنجاز، تُسجل العادة كفائتة تلقائيًا' : 'If window passes without completion, habit auto-marks as missed'}
                          </p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Max daily repetitions */}
                  <div className="mt-3">
                    <label className="text-xs font-medium mb-1.5 block">
                      {isAr ? 'أقصى عدد تكرارات يوميًا (اختياري)' : 'Max Daily Repetitions (optional)'}
                    </label>
                    <input type="number" min="1"
                      value={formData.maxDailyReps}
                      onChange={e => setFormData(f => ({ ...f, maxDailyReps: e.target.value }))}
                      className="app-input w-full rounded-xl bg-transparent px-3 py-2.5 text-sm"
                      placeholder={isAr ? 'مثال: 3 جلسات دراسة يوميًا' : 'e.g., 3 study sessions per day'} />
                    <p className="text-[9px] text-[var(--foreground)]/50 mt-1">
                      {isAr ? 'اتركه فارغًا للعادات التي تُنجز مرة واحدة يوميًا' : 'Leave empty for habits done once per day'}
                    </p>
                  </div>
                </div>

                {/* ── Section: Streak Challenges (3 tiers) ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded-md bg-amber-500/10 flex items-center justify-center"><Trophy className="h-3 w-3 text-amber-500" /></div>
                    <span className="text-xs font-bold">{isAr ? 'تحديات السلسلة' : 'Streak Challenges'}</span>
                  </div>
                  <p className="text-[11px] text-[var(--foreground)]/60 mb-3">
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
                    <span className="text-xs font-bold text-[var(--foreground)]/70">{isAr ? 'حلقة العادة' : 'Habit Loop'}</span>
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

/* ─── Flip Card — redesigned with clear hierarchy ─── */
function HabitFlipCard({ habit, index, isAr, store, today, onEdit, onArchive, onDelete, onDetail, onViewPage, expanded = false, rowExpanded = false, onToggleRow }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: () => void; onArchive: () => void; onDelete: () => void; onDetail: () => void; onViewPage?: string; expanded?: boolean;
  rowExpanded?: boolean; onToggleRow?: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [flippedTab, setFlippedTab] = useState<'details' | 'stats'>('details');
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(habit.notes || '');
  const minimized = !expanded;
  const hc = resolveHabitColor(habit.color); // resolved color (handles 'theme')
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
  const hasDuration = !!habit.expectedDuration;
  const streak = store.getHabitStreak(habit.id);
  const stats = store.getHabitStats(habit.id);
  const timeStats = useMemo(() => getHabitTimeStats(habit.id, store.habitLogs), [habit.id, store.habitLogs]);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const catLabel = isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category);
  const freqLabel = isAr ? FREQ_LABELS[habit.frequency]?.ar : FREQ_LABELS[habit.frequency]?.en;
  const daysSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / 86400000));
  const placeLabel = isAr ? habit.placeAr : habit.placeEn;
  const totalMinutes = timeStats.mins.total;
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
  const completedCount7 = last7.filter(d => d.done).length;

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
  const isDisabled = !!strictLocked || !!strictNotYet;

  // Daily repetitions tracking
  const maxReps = habit.maxDailyReps || 1;
  const todayCompletedReps = store.habitLogs.filter(l => l.habitId === habit.id && l.date === today && l.completed).length;
  const repsRemaining = Math.max(0, maxReps - todayCompletedReps);
  const allRepsDone = todayCompletedReps >= maxReps;
  const hasMultipleReps = maxReps > 1;

  const handleCheck = () => {
    if (hasDuration || habit.archived || isDisabled) return;
    if (isCount) return;
    // For single-rep habits: toggle done
    if (!hasMultipleReps) {
      if (done && todayLog) { store.deleteHabitLog(todayLog.id); return; }
    }
    // For multi-rep habits: don't allow if all reps done
    if (hasMultipleReps && allRepsDone) return;
    store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: true });
  };

  const handleCountIncrement = (amount: number) => {
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
          className={cn('rounded-2xl overflow-hidden flex flex-col habit-flip-front group/card habit-card-animated-border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]', flipped && 'invisible')}
          style={{
            backfaceVisibility: 'hidden',
            '--habit-color': hc,
            '--habit-border-color': done || allRepsDone ? '#22c55e' : isDisabled ? '#ef4444' : hc,
            background: minimized ? 'var(--color-background)' : `linear-gradient(180deg, ${hc}06 0%, var(--color-background) 120px)`,
            boxShadow: `0 2px 12px ${hc}10`,
            maxHeight: minimized ? '180px' : '780px',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {/* Color accent bar */}
          <div className="w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ height: minimized ? 4 : 8, background: `linear-gradient(90deg, ${hc}, ${hc}bb)` }} />

          {/* Optional custom image — only when expanded */}
          {!minimized && habit.image && (
            <div className="relative h-28 w-full overflow-hidden">
              <img src={habit.image} alt="" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent" />
            </div>
          )}

          <div className={cn('px-4 pb-3 pt-3 flex-1 flex flex-col', !minimized && 'overflow-y-auto')}>
            {/* ─ Row 1: Order # + Name + quick actions ─ */}
            <div className="flex items-start justify-between gap-2 h-[56px] mb-2 overflow-hidden">
              <div className="min-w-0 flex-1 flex items-start gap-2.5">
                {/* Order number badge */}
                <div className="h-7 w-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm"
                  style={{ background: `${hc}20`, color: hc, border: `1.5px solid ${hc}30` }}>
                  {habit.order ?? 0}
                </div>
                <div className="min-w-0">
                  <h3 className={cn('text-[15px] font-extrabold leading-snug tracking-tight', done && 'line-through opacity-50')}>{name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-[var(--foreground)]/70">
                    <span>{catLabel}</span>
                    <span>·</span>
                    <span>{freqLabel}</span>
                    {placeLabel && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{placeLabel}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Quick actions */}
              <div className="flex items-center gap-1 shrink-0">
                {onToggleRow && (
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onToggleRow(); }}
                    className={cn('h-8 w-8 rounded-xl flex items-center justify-center border border-transparent transition-all',
                      rowExpanded ? 'text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/20' : 'text-[var(--foreground)]/70 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/20')}
                    title={rowExpanded ? (isAr ? 'طي الصف' : 'Collapse Row') : (isAr ? 'توسيع الصف' : 'Expand Row')}>
                    <ChevronsUpDown className="h-4 w-4" />
                  </motion.button>
                )}
                {!minimized && (
                  <>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onEdit}
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--foreground)]/70 hover:text-blue-600 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
                      title={isAr ? 'تعديل' : 'Edit'}>
                      <Edit3 className="h-4 w-4" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onArchive}
                      className={cn('h-8 w-8 rounded-xl flex items-center justify-center border border-transparent transition-all',
                        habit.archived ? 'text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/20' : 'text-[var(--foreground)]/70 hover:text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/20')}
                      title={habit.archived ? (isAr ? 'استعادة' : 'Restore') : (isAr ? 'أرشفة' : 'Archive')}>
                      {habit.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Minimized: just show status */}
            {minimized && (
              <div className="flex items-center justify-between py-1">
                {(done || allRepsDone) ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {isAr ? 'مكتملة' : 'Done'}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]/60"><Circle className="h-4 w-4" /> {isAr ? 'لم تكتمل' : 'Pending'}</span>
                )}
                {streak.current > 0 && <span className="text-xs font-bold text-orange-500">🔥 {streak.current}</span>}
              </div>
            )}

            {!minimized && <>
            {/* ─ Row 2: Meta badges ─ */}
            <div className="flex items-center gap-1 h-[28px] mb-2 flex-wrap overflow-hidden">
              <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-md',
                habit.type === 'positive' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
                {habit.type === 'positive' ? (isAr ? 'بناء' : 'Build') : (isAr ? 'تجنب' : 'Break')}
              </span>
              <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-md',
                habit.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' : habit.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-500')}>
                {isAr ? (habit.difficulty === 'hard' ? 'صعبة' : habit.difficulty === 'medium' ? 'متوسطة' : 'سهلة') : habit.difficulty}
              </span>
              <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-md',
                habit.priority === 'high' ? 'bg-red-500/10 text-red-500' : habit.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-sky-500/10 text-sky-500')}>
                {isAr ? (habit.priority === 'high' ? 'عالية' : habit.priority === 'medium' ? 'متوسطة' : 'منخفضة') : habit.priority}
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/70">
                🎯 {goalLabel}
              </span>
              {habit.preferredTime && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/70">
                  🕐 {habit.preferredTime}
                </span>
              )}
            </div>

            {/* ─ Row 3: Today's status banner ─ */}
            <div className={cn('flex items-center gap-2 rounded-xl px-3 h-[40px] mb-2 text-xs font-bold')}
              style={strictLocked
                ? { background: '#ef444415', color: '#ef4444', border: '1px solid #ef444425' }
                : strictNotYet
                  ? { background: '#f59e0b12', color: '#f59e0b', border: '1px solid #f59e0b20' }
                  : (done || allRepsDone)
                    ? { background: '#22c55e15', color: '#16a34a' }
                    : hasMultipleReps && todayCompletedReps > 0
                      ? { background: `${hc}12`, color: hc, border: `1px solid ${hc}20` }
                      : streak.current > 0
                        ? { background: `${hc}12`, color: hc, border: `1px solid ${hc}20` }
                        : { background: `${hc}08`, color: hc }}>
              {strictLocked ? (
                <><X className="h-4 w-4" /> {isAr ? `فات الوقت (${habit.windowStart}–${habit.windowEnd}) — فائتة` : `Window passed (${habit.windowStart}–${habit.windowEnd}) — Missed`}</>
              ) : strictNotYet ? (
                <><Clock className="h-4 w-4" /> {isAr ? `متاحة من ${habit.windowStart} إلى ${habit.windowEnd}` : `Available ${habit.windowStart} – ${habit.windowEnd}`}</>
              ) : allRepsDone ? (
                <><CheckCircle2 className="h-4 w-4" /> {hasMultipleReps ? `${todayCompletedReps}/${maxReps} ${isAr ? 'مكتمل ✓' : 'done ✓'}` : (isAr ? 'مكتملة اليوم ✓' : 'Completed today ✓')}</>
              ) : hasMultipleReps && todayCompletedReps > 0 ? (
                <><Target className="h-4 w-4" /> {todayCompletedReps}/{maxReps} — {repsRemaining} {isAr ? 'متبقية' : 'remaining'}</>
              ) : streak.current > 0 ? (
                <><Flame className="h-4 w-4" /> {streak.current} {isAr ? 'يوم متواصل — حافظ عليها!' : 'day streak — keep going!'}</>
              ) : (
                <><Target className="h-4 w-4" /> {isAr ? 'لم تكتمل بعد — ابدأ الآن' : 'Not done yet — start now'}</>
              )}
            </div>

            {/* ─ Row 4: Primary CTA ─ */}
            <div className={cn('h-[48px] mb-2 overflow-hidden', isDisabled && 'opacity-40 pointer-events-none')}>
              {!habit.archived ? (
                <div onClick={e => e.stopPropagation()}>
                  <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="sm" disabled={isDisabled} />
                  {isCount && !hasDuration && (
                    <div className="mt-1.5 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleCountIncrement(-1)} disabled={todayCountValue <= 0}
                          className="h-9 w-9 rounded-xl flex items-center justify-center font-bold border border-[var(--foreground)]/[0.12] hover:bg-[var(--foreground)]/[0.06] disabled:opacity-30 transition-all active:scale-95">
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="flex-1 text-center">
                          <span className="text-base font-black" style={{ color: countProgress >= 1 ? '#22c55e' : hc }}>
                            {todayCountValue}
                          </span>
                          <span className="text-xs font-semibold text-[var(--foreground)]/60"> / {countTarget} {countUnit}</span>
                        </div>
                        <button onClick={() => handleCountIncrement(1)}
                          className="h-9 w-9 rounded-xl flex items-center justify-center font-bold border border-[var(--foreground)]/[0.12] hover:bg-[var(--foreground)]/[0.06] transition-all active:scale-95"
                          style={countProgress < 1 ? { background: `${hc}15`, color: hc } : { background: '#22c55e15', color: '#22c55e' }}>
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--foreground)]/[0.08] overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${countProgress * 100}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ background: countProgress >= 1 ? '#22c55e' : hc }} />
                      </div>
                    </div>
                  )}
                  {!isCount && !hasDuration && !allRepsDone && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCheck}
                      className="w-full mt-1.5 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:shadow-md"
                      style={{ background: `linear-gradient(135deg, ${hc}, ${hc}cc)` }}>
                      <CheckCircle2 className="h-4 w-4" />
                      {hasMultipleReps ? `${isAr ? 'تسجيل' : 'Log'} (${todayCompletedReps + 1}/${maxReps})` : ctaLabel}
                    </motion.button>
                  )}
                  {!isCount && !hasDuration && allRepsDone && (
                    <div className="w-full mt-1.5 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {hasMultipleReps ? `${todayCompletedReps}/${maxReps} ${isAr ? 'مكتمل' : 'done'}` : (isAr ? 'مكتملة ✓' : 'Done ✓')}
                    </div>
                  )}
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={onArchive}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
                  <RotateCcw className="h-4 w-4" /> {isAr ? 'استعادة' : 'Restore'}
                </motion.button>
              )}
            </div>

            {/* ─ Row 5: Streak Challenges — fixed height */}
            <div className="h-[100px] mb-2 overflow-hidden">
            {!hasStreakChallenge ? (
              <div className="rounded-xl border border-dashed border-[var(--foreground)]/[0.06] p-2.5 h-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-[var(--foreground)]/30 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" /> {isAr ? 'لا توجد تحديات — أضف من التعديل' : 'No challenges — add from edit'}
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--foreground)]/[0.08] bg-[var(--foreground)]/[0.02] p-2.5 h-full overflow-y-auto space-y-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[10px] font-black">{isAr ? 'التحديات' : 'Challenges'}</span>
                </div>
                {streakTiers.map((t, i) => {
                  const filledDots = Math.min(t.goal, streak.current);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold flex items-center gap-1">
                          {t.icon} {streak.current}/{t.goal} {isAr ? 'يوم' : 'd'}
                          {t.done && <span className="text-amber-500">✓</span>}
                        </span>
                        {t.reward && (
                          <span className={cn('text-[9px] font-bold truncate max-w-[120px]', t.done ? 'text-amber-600' : 'text-[var(--foreground)]/60')}>
                            🎁 {t.reward}
                          </span>
                        )}
                      </div>
                      {/* Dots grid — one dot per day */}
                      <div className="flex flex-wrap gap-[3px]">
                        {Array.from({ length: t.goal }).map((_, si) => (
                          <div key={si}
                            className="h-[6px] w-[6px] rounded-full transition-all duration-300"
                            style={{
                              background: si < filledDots
                                ? t.done ? '#eab308' : hc
                                : `${hc}15`,
                              transitionDelay: `${Math.min(si * 10, 500)}ms`,
                            }} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-bold" style={{ color: t.done ? '#eab308' : `${hc}99` }}>{Math.round(t.progress * 100)}%</span>
                        {t.done && <span className="text-[9px] font-black text-amber-500">🏆</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
           </div>

            {/* ─ Row 5b: Habit Loop (always visible) ─ */}
            <div className="flex items-center gap-1 h-[60px] mb-2 overflow-hidden">
              <div className="flex-1 min-w-0 rounded-lg bg-amber-500/8 px-2 py-1.5 text-center">
                <Lightbulb className="h-3 w-3 text-amber-500 mx-auto mb-0.5" />
                <p className="text-[8px] font-black text-amber-600 uppercase">{isAr ? 'المحفز' : 'Trigger'}</p>
                <p className={cn('text-[9px] font-semibold truncate', (isAr ? habit.cueAr : habit.cueEn) ? 'text-[var(--foreground)]/80' : 'text-[var(--foreground)]/30 italic')}>
                  {(isAr ? habit.cueAr : habit.cueEn) || (isAr ? 'لم يُحدد' : '—')}
                </p>
              </div>
              <ArrowRight className={cn('h-3 w-3 text-[var(--foreground)]/30 shrink-0', isAr && 'rotate-180')} />
              <div className="flex-1 min-w-0 rounded-lg bg-blue-500/8 px-2 py-1.5 text-center">
                <Repeat className="h-3 w-3 text-blue-500 mx-auto mb-0.5" />
                <p className="text-[8px] font-black text-blue-600 uppercase">{isAr ? 'الروتين' : 'Routine'}</p>
                <p className={cn('text-[9px] font-semibold truncate', (isAr ? habit.routineAr : habit.routineEn) ? 'text-[var(--foreground)]/80' : 'text-[var(--foreground)]/30 italic')}>
                  {(isAr ? habit.routineAr : habit.routineEn) || (isAr ? 'لم يُحدد' : '—')}
                </p>
              </div>
              <ArrowRight className={cn('h-3 w-3 text-[var(--foreground)]/30 shrink-0', isAr && 'rotate-180')} />
              <div className="flex-1 min-w-0 rounded-lg bg-emerald-500/8 px-2 py-1.5 text-center">
                <Gift className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
                <p className="text-[8px] font-black text-emerald-600 uppercase">{isAr ? 'المكافأة' : 'Reward'}</p>
                <p className={cn('text-[9px] font-semibold truncate', (isAr ? habit.rewardAr : habit.rewardEn) ? 'text-[var(--foreground)]/80' : 'text-[var(--foreground)]/30 italic')}>
                  {(isAr ? habit.rewardAr : habit.rewardEn) || (isAr ? 'لم يُحدد' : '—')}
                </p>
              </div>
            </div>

            {/* ─ Row 5c: Notes ─ */}
            <div className="h-[24px] mb-2 overflow-hidden" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowNote(!showNote)}
                className="flex items-center gap-1.5 text-xs font-bold mb-1 transition-all"
                style={{ color: hc }}>
                <Edit3 className="h-3 w-3" />
                {habit.notes
                  ? (isAr ? 'ملاحظة' : 'Note')
                  : (isAr ? 'إضافة ملاحظة' : 'Add Note')}
                <ChevronDown className={cn('h-3 w-3 transition-transform', showNote && 'rotate-180')} />
              </button>
              {!showNote && habit.notes && (
                <p className="text-[11px] font-medium text-[var(--foreground)]/70 truncate">{habit.notes}</p>
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
                  <p className="text-[10px] font-medium text-[var(--foreground)]/50">{isAr ? 'يُحفظ تلقائيًا' : 'Auto-saved'}</p>
                </div>
              )}
            </div>

            {/* ─ Row 6: 7-day visual dots ─ */}
            <div className="h-[75px] mb-2 overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold" style={{ color: hc }}>{isAr ? 'آخر ٧ أيام' : 'Last 7 days'}</span>
                <span className="text-xs font-black" style={{ color: completedCount7 >= 5 ? '#22c55e' : completedCount7 >= 3 ? hc : '#ef4444' }}>
                  {completedCount7}/7
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                {last7.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className={cn('h-3 w-3 rounded-full transition-all',
                      d.done ? (d.color === 'green' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : d.color === 'orange' ? 'bg-amber-500 shadow-sm shadow-amber-500/30' : 'bg-emerald-500 shadow-sm shadow-emerald-500/30')
                        : d.date <= today ? 'bg-red-400/50' : 'bg-[var(--foreground)]/[0.08]')}
                      title={d.date} />
                    <span className="text-[8px] font-semibold text-[var(--foreground)]/60">
                      {new Date(d.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'narrow' })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1.5 rounded-full bg-[var(--foreground)]/[0.08] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(completedCount7 / 7) * 100}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: completedCount7 >= 5 ? '#22c55e' : completedCount7 >= 3 ? '#eab308' : '#ef4444' }} />
              </div>
            </div>

            {/* ─ Row 7: Stats grid ─ */}
            <div className="grid grid-cols-4 gap-1.5 h-[56px] mb-2">
              <div className="text-center rounded-xl py-2" style={{ background: `${hc}08`, border: `1px solid ${hc}12` }}>
                <p className="text-sm font-black" style={{ color: hc }}>{streak.current}</p>
                <p className="text-[9px] font-bold text-[var(--foreground)]/70">{isAr ? 'سلسلة' : 'Streak'}</p>
              </div>
              <div className="text-center rounded-xl py-2" style={{ background: `${hc}08`, border: `1px solid ${hc}12` }}>
                <p className="text-sm font-black" style={{ color: hc }}>{streak.best}</p>
                <p className="text-[9px] font-bold text-[var(--foreground)]/70">{isAr ? 'أفضل' : 'Best'}</p>
              </div>
              <div className="text-center rounded-xl py-2" style={{ background: `${hc}08`, border: `1px solid ${hc}12` }}>
                <p className="text-sm font-black" style={{ color: hc }}>{stats.completionRate}%</p>
                <p className="text-[9px] font-bold text-[var(--foreground)]/70">{isAr ? 'التزام' : 'Rate'}</p>
              </div>
              <div className="text-center rounded-xl py-2" style={{ background: `${hc}08`, border: `1px solid ${hc}12` }}>
                <p className="text-sm font-black" style={{ color: hc }}>
                  {totalMinutes > 0 ? (totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h` : `${totalMinutes}m`) : stats.totalCompletions}
                </p>
                <p className="text-[9px] font-bold text-[var(--foreground)]/70">{totalMinutes > 0 ? (isAr ? 'وقت' : 'Time') : (isAr ? 'مجمل' : 'Total')}</p>
              </div>
            </div>

            {/* ─ Row 8: Bottom actions bar ─ */}
            <div className="pt-2.5 mt-auto space-y-2" style={{ borderTop: `1.5px solid ${hc}15` }}>
              {/* Last completion info */}
              <p className="text-[11px] font-bold text-[var(--foreground)]/80 text-center">
                {lastCompletedDate
                  ? `${isAr ? 'آخر إنجاز' : 'Last done'}: ${new Date(lastCompletedDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}`
                  : (isAr ? 'لم يُنجز بعد' : 'No completions yet')}
              </p>
              {/* Action buttons row */}
              <div className="flex items-center gap-1.5">
                <Link href={`/app/habits/${habit.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                  style={{ background: `${hc}10`, color: hc, border: `1px solid ${hc}20` }}>
                  <Maximize2 className="h-3.5 w-3.5" /> {isAr ? 'الصفحة' : 'Page'}
                </Link>
                <button onClick={onDetail}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                  style={{ background: `${hc}10`, color: hc, border: `1px solid ${hc}20` }}>
                  <Eye className="h-3.5 w-3.5" /> {isAr ? 'تفاصيل' : 'Details'}
                </button>
                <button onClick={() => { setFlipped(true); setFlippedTab('stats'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                  style={{ background: `${hc}10`, color: hc, border: `1px solid ${hc}20` }}>
                  <BarChart3 className="h-3.5 w-3.5" /> {isAr ? 'إحصائيات' : 'Stats'}
                </button>
              </div>
            </div>
            </>}
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className={cn('rounded-2xl overflow-hidden flex flex-col habit-flip-back habit-card-animated-border', !flipped ? 'invisible absolute inset-0' : 'absolute inset-x-0 top-0')}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            '--habit-color': hc,
            '--habit-border-color': hc,
            background: `linear-gradient(180deg, ${hc}06 0%, var(--color-background) 100px)`,
            boxShadow: `0 2px 12px ${hc}10`,
          } as React.CSSProperties}
        >
          <div className="h-1.5 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${hc}, ${hc}99)` }} />

          <div className="p-4 flex-1 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }} onClick={() => setFlipped(false)}
                className="flex items-center gap-1.5 rounded-xl py-1.5 px-3 text-[11px] font-bold text-[var(--foreground)]/80 bg-[var(--foreground)]/[0.06] hover:bg-[var(--foreground)]/[0.12] transition-all cursor-pointer border border-[var(--foreground)]/[0.06] hover:border-[var(--foreground)]/[0.15]">
                <ChevronLeft className={cn('h-3.5 w-3.5', isAr && 'rotate-180')} /> {isAr ? 'رجوع' : 'Back'}
              </motion.button>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${hc}15` }}>
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: hc }} />
              </div>
            </div>
            <h3 className="text-sm font-extrabold text-center mb-3">{name}</h3>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-3 rounded-xl bg-[var(--foreground)]/[0.05] p-1">
              {([
                { key: 'details' as const, label: isAr ? 'التفاصيل' : 'Details' },
                { key: 'stats' as const, label: isAr ? 'الإحصائيات' : 'Statistics' },
              ]).map(t => (
                <button key={t.key} onClick={() => setFlippedTab(t.key)}
                  className={cn('flex-1 py-2 rounded-lg text-[11px] font-bold transition-all',
                    flippedTab === t.key ? 'bg-[var(--color-background)] text-[var(--foreground)] shadow-sm' : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)]/80')}>
                  {t.label}
                </button>
              ))}
            </div>

            {flippedTab === 'details' ? (
              <>
                {(isAr ? habit.descriptionAr : habit.descriptionEn) && (
                  <p className="text-[11px] text-[var(--foreground)]/70 leading-relaxed mb-3 rounded-xl px-3 py-2.5 bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.06]">
                    {isAr ? habit.descriptionAr : habit.descriptionEn}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {(isAr ? habit.placeAr : habit.placeEn) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600"><MapPin className="h-3 w-3" /> {isAr ? habit.placeAr : habit.placeEn}</span>
                  )}
                  {habit.preferredTime && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600"><Clock className="h-3 w-3" /> {habit.preferredTime}</span>
                  )}
                  {habit.expectedDuration && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600"><Hourglass className="h-3 w-3" /> {habit.expectedDuration}{isAr ? 'د' : 'm'}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: isAr ? 'الصعوبة' : 'Difficulty', value: isAr ? (habit.difficulty === 'hard' ? 'صعبة' : habit.difficulty === 'medium' ? 'متوسطة' : 'سهلة') : habit.difficulty },
                    { label: isAr ? 'النوع' : 'Type', value: isAr ? (habit.type === 'positive' ? 'بناء' : 'تجنب') : (habit.type === 'positive' ? 'Build' : 'Break') },
                    { label: isAr ? 'منذ' : 'Since', value: new Date(habit.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }) },
                    { label: isAr ? 'العمر' : 'Age', value: `${daysSinceCreation}${isAr ? ' يوم' : 'd'}` },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl bg-[var(--foreground)]/[0.03] p-2.5 border border-[var(--foreground)]/[0.06]">
                      <p className="text-[9px] text-[var(--foreground)]/60 font-bold uppercase">{item.label}</p>
                      <p className="text-[12px] font-extrabold">{item.value}</p>
                    </div>
                  ))}
                </div>
                {/* Habit Loop */}
                {(() => {
                  const hasCue = !!(isAr ? habit.cueAr : habit.cueEn);
                  const hasRoutine = !!(isAr ? habit.routineAr : habit.routineEn);
                  const hasReward = !!(isAr ? habit.rewardAr : habit.rewardEn);
                  if (!hasCue && !hasRoutine && !hasReward) return null;
                  return (
                    <div className="mb-3 rounded-xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] p-3 space-y-2">
                      <span className="text-[9px] font-black text-[var(--foreground)]/60 uppercase flex items-center gap-1"><Repeat className="h-3 w-3" /> {isAr ? 'حلقة العادة' : 'Habit Loop'}</span>
                      {hasCue && <p className="text-[11px] text-[var(--foreground)]/80"><span className="text-amber-500 font-bold">{isAr ? 'المحفز' : 'Trigger'}:</span> {isAr ? habit.cueAr : habit.cueEn}</p>}
                      {hasRoutine && <p className="text-[11px] text-[var(--foreground)]/80"><span className="text-blue-500 font-bold">{isAr ? 'الروتين' : 'Routine'}:</span> {isAr ? habit.routineAr : habit.routineEn}</p>}
                      {hasReward && <p className="text-[11px] text-[var(--foreground)]/80"><span className="text-emerald-500 font-bold">{isAr ? 'المكافأة' : 'Reward'}:</span> {isAr ? habit.rewardAr : habit.rewardEn}</p>}
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[
                    { label: isAr ? 'أسبوع' : 'Week', value: timeStats.reps.week },
                    { label: isAr ? 'شهر' : 'Month', value: timeStats.reps.month },
                    { label: isAr ? 'سنة' : 'Year', value: timeStats.reps.year },
                    { label: isAr ? 'المجمل' : 'Total', value: timeStats.reps.total },
                  ].map((r, i) => (
                    <div key={i} className="text-center rounded-xl bg-[var(--foreground)]/[0.04] border border-[var(--foreground)]/[0.06] py-2">
                      <p className="text-sm font-black">{r.value}</p>
                      <p className="text-[8px] text-[var(--foreground)]/60 font-bold uppercase">{r.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-center rounded-xl bg-orange-500/8 border border-orange-500/15 py-2.5">
                    <Flame className="h-4 w-4 mx-auto text-orange-500 mb-0.5" />
                    <p className="text-sm font-black">{streak.current} / {streak.best}</p>
                    <p className="text-[8px] text-[var(--foreground)]/60 font-bold uppercase">{isAr ? 'سلسلة / أفضل' : 'Streak / Best'}</p>
                  </div>
                  <div className="text-center rounded-xl bg-blue-500/8 border border-blue-500/15 py-2.5">
                    <TrendingUp className="h-4 w-4 mx-auto text-blue-500 mb-0.5" />
                    <p className="text-sm font-black">{stats.completionRate}%</p>
                    <p className="text-[8px] text-[var(--foreground)]/60 font-bold uppercase">{isAr ? 'معدل الإنجاز' : 'Rate'}</p>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-12 px-1 mb-3">
                  {stats.completionsByWeekday.map((count, wi) => {
                    const max = Math.max(...stats.completionsByWeekday, 1);
                    const pct = (count / max) * 100;
                    return (
                      <div key={wi} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full rounded-sm transition-all hover:opacity-100" style={{ height: `${Math.max(pct, 8)}%`, background: pct > 0 ? hc : 'var(--foreground)', opacity: pct > 0 ? 0.7 : 0.06 }} />
                        <span className="text-[8px] font-bold text-[var(--foreground)]/60">{(isAr ? DAY_LABELS.ar : DAY_LABELS.en)[wi][0]}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Bottom action buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-[var(--foreground)]/[0.08] mt-auto">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-[var(--foreground)]/80 bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.1] border border-[var(--foreground)]/[0.06] hover:border-[var(--foreground)]/[0.15] transition-all">
                <Edit3 className="h-3.5 w-3.5" /> {isAr ? 'تعديل' : 'Edit'}
              </motion.button>
              <Link href={onViewPage || `/app/habits/${habit.id}`} className="flex-1">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-white shadow-sm hover:shadow-md transition-all"
                  style={{ background: `linear-gradient(135deg, ${hc}, ${hc}cc)` }}>
                  <Maximize2 className="h-3.5 w-3.5" /> {isAr ? 'الصفحة' : 'Page'}
                </motion.div>
              </Link>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={onArchive}
                className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold border transition-all',
                  habit.archived
                    ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'text-amber-600 bg-amber-500/5 border-amber-500/15 hover:bg-amber-500/15')}>
                {habit.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                {habit.archived ? (isAr ? 'استعادة' : 'Restore') : (isAr ? 'أرشفة' : 'Archive')}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Grid Card (compact) ─── */
function HabitGridCard({ habit, index, isAr, store, today, onEdit, onDelete, onDetail, onViewPage }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: () => void; onDelete: () => void; onDetail: () => void; onViewPage?: string;
}) {
  const hc = resolveHabitColor(habit.color);
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
      className={cn('rounded-xl overflow-hidden flex flex-col cursor-pointer group/gc hover:shadow-md transition-all border',
        done ? 'border-emerald-500/15 bg-emerald-500/[0.02]' : 'border-[var(--foreground)]/[0.06] bg-[var(--color-background)]')}
      onClick={onDetail}
    >
      <div className="h-0.5 w-full" style={{ background: hc }} />
      <div className="p-3 flex flex-col flex-1">
        {/* Name + Category */}
        <div className="flex items-start gap-2 mb-2">
          <button onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            className={cn('shrink-0 mt-0.5', hasDuration && !done && 'cursor-not-allowed')}
            disabled={habit.archived || (hasDuration && !done)}>
            {done ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
              : hasDuration ? <Timer className="h-4.5 w-4.5 text-[var(--foreground)]/25" />
              : <Circle className="h-4.5 w-4.5 text-[var(--foreground)]/20 hover:text-emerald-400 transition-colors" />}
          </button>
          <div className="min-w-0 flex-1">
            <h3 className={cn('text-sm font-semibold leading-tight truncate', done && 'line-through opacity-50')}>{name}</h3>
            <p className="text-[9px] text-[var(--foreground)]/35 mt-0.5">{catLabel}</p>
          </div>
        </div>

        {/* Timer controls */}
        {!habit.archived && (
          <div className="mb-2" onClick={e => e.stopPropagation()}>
            <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="xs" />
          </div>
        )}

        {/* Bottom info */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[var(--foreground)]/[0.04]">
          {streak.current > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500">
              <Flame className="h-2.5 w-2.5" /> {streak.current}
            </span>
          )}
          {habit.preferredTime && <span className="text-[8px] text-[var(--foreground)]/30">{habit.preferredTime}</span>}
          <div className="flex items-center gap-0.5 ms-auto opacity-0 group-hover/gc:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.06]">
              <Edit3 className="h-2.5 w-2.5 text-[var(--foreground)]/30" />
            </button>
            {onViewPage && (
              <Link href={onViewPage} onClick={(e) => e.stopPropagation()}>
                <div className="h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.06]">
                  <Maximize2 className="h-2.5 w-2.5 text-[var(--foreground)]/30" />
                </div>
              </Link>
            )}
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
  const hc = resolveHabitColor(habit.color);
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
      className={cn('rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all group/lr border',
        done ? 'border-emerald-500/15 bg-emerald-500/[0.02]' : 'border-[var(--foreground)]/[0.06] bg-[var(--color-background)]')}
    >
      {/* Check */}
      <button onClick={handleToggle} className={cn('shrink-0', hasDuration && !done && 'cursor-not-allowed')}
        disabled={habit.archived || (hasDuration && !done)}>
        {done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          : hasDuration ? <Timer className="h-5 w-5 text-[var(--foreground)]/25" />
          : <Circle className="h-5 w-5 text-[var(--foreground)]/20 hover:text-emerald-400 transition-colors" />}
      </button>

      {/* Color dot + name */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: hc || habit.color }} />
        <div className="min-w-0">
          <h3 className={cn('text-sm font-semibold truncate', done && 'line-through opacity-50')}>{name}</h3>
          <div className="flex items-center gap-2 text-[10px] text-[var(--foreground)]/35">
            <span>{catLabel}</span>
            <span className="text-[var(--foreground)]/15">·</span>
            <span>{freqLabel}</span>
          </div>
        </div>
      </div>

      {/* Last 7 dots */}
      <div className="hidden sm:flex items-center gap-0.5">
        {last7.map((c, i) => (
          <div key={i} className={cn('h-1.5 w-1.5 rounded-full',
            c === 'green' ? 'bg-emerald-500' : c === 'orange' ? 'bg-amber-500' : c === 'red' ? 'bg-red-400' : 'bg-[var(--foreground)]/8'
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
      <span className="hidden md:block text-[10px] font-medium text-[var(--foreground)]/35 shrink-0 w-10 text-center">{stats.completionRate}%</span>

      {/* Timer */}
      <div className="shrink-0" onClick={e => e.stopPropagation()}>
        <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="xs" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/lr:opacity-100 transition-opacity">
        <button onClick={onEdit} className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05]">
          <Edit3 className="h-3 w-3 text-[var(--foreground)]/30" />
        </button>
        <button onClick={onArchive} className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05]">
          <Archive className={cn('h-3 w-3', habit.archived ? 'text-emerald-500' : 'text-[var(--foreground)]/30')} />
        </button>
        {onViewPage && (
          <Link href={onViewPage}>
            <div className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05]">
              <Maximize2 className="h-3 w-3 text-[var(--foreground)]/30" />
            </div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Board View (Kanban by category) ─── */
function HabitBoardView({ habits, isAr, store, today, onEdit, onDelete, onDetail, locale }: {
  habits: Habit[]; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: (h: Habit) => void; onDelete: (h: Habit) => void; onDetail: (h: Habit) => void; locale?: string;
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
            <div className="rounded-xl border border-[var(--foreground)]/[0.06] px-3 py-2.5 mb-2 flex items-center justify-between bg-[var(--foreground)]/[0.015]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{catLabel || cat}</span>
                <span className="text-[9px] font-medium text-[var(--foreground)]/30">{catHabits.length}</span>
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
                    className={cn('rounded-xl p-3 cursor-pointer hover:shadow-sm transition-all border', done ? 'border-emerald-500/15 bg-emerald-500/[0.02] opacity-60' : 'border-[var(--foreground)]/[0.06]')}
                    style={{ borderInlineStart: `3px solid ${resolveHabitColor(habit.color)}` }}
                    onClick={() => onDetail(habit)}
                  >
                    <div className="flex items-start gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleToggle(); }} className={cn('shrink-0 mt-0.5', boardHasDuration && !done && 'cursor-not-allowed')} disabled={habit.archived || (boardHasDuration && !done)}>
                        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : boardHasDuration ? <Timer className="h-4 w-4 text-[var(--foreground)]/25" /> : <Circle className="h-4 w-4 text-[var(--foreground)]/20" />}
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
                        <button onClick={(e) => { e.stopPropagation(); onDelete(habit); }}
                          className="h-5 w-5 rounded flex items-center justify-center hover:bg-amber-500/10" title={isAr ? 'أرشفة' : 'Archive'}>
                          <Archive className="h-2.5 w-2.5 text-amber-500/60" />
                        </button>
                        {locale && (
                          <Link href={`/app/habits/${habit.id}`} onClick={(e) => e.stopPropagation()}>
                            <div className="h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--color-primary)]/10">
                              <Maximize2 className="h-2.5 w-2.5 text-[var(--color-primary)]/60" />
                            </div>
                          </Link>
                        )}
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
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'shadow-xl ring-2 ring-[var(--color-primary)]/30 rounded-2xl')}>
      {/* Floating drag handle */}
      <button {...attributes} {...listeners}
        className="absolute top-2 start-2 z-10 touch-none cursor-grab active:cursor-grabbing h-7 w-7 rounded-lg flex items-center justify-center bg-[var(--color-background)]/90 border border-[var(--foreground)]/[0.1] shadow-sm text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 hover:bg-[var(--color-background)] transition-all backdrop-blur-sm">
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
  const hc = resolveHabitColor(habit.color);
  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
  const streak = store.getHabitStreak(habit.id);
  const name = isAr ? habit.nameAr : habit.nameEn;
  const hasDuration = !!habit.expectedDuration;

  return (
    <motion.div variants={fadeUp} custom={index} initial="hidden" animate="visible"
      className={cn(
        'rounded-xl px-3 py-2.5 cursor-pointer transition-all border group',
        done ? 'bg-emerald-500/[0.03] border-emerald-500/15' : 'border-[var(--foreground)]/[0.06] hover:border-[var(--foreground)]/[0.1]',
      )}
      onClick={onDetail}
    >
      <div className="flex items-center gap-2.5">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={cn('shrink-0', hasDuration && !done && 'cursor-not-allowed')}
          disabled={habit.archived || (hasDuration && !done)}>
          {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            : hasDuration ? <Timer className="h-4 w-4 text-[var(--foreground)]/25" />
            : <div className="h-4 w-4 rounded-full border-2 border-[var(--foreground)]/15 hover:border-emerald-400 transition-colors" />}
        </button>
        <span className={cn('text-xs font-semibold truncate flex-1', done && 'line-through opacity-50')}>{name}</span>
        {streak.current > 0 && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500 shrink-0">
            <Flame className="h-2.5 w-2.5" /> {streak.current}
          </span>
        )}
        {onViewPage && (
          <Link href={onViewPage} onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 h-5 w-5 rounded flex items-center justify-center hover:bg-[var(--foreground)]/[0.05] opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="h-2.5 w-2.5 text-[var(--foreground)]/25" />
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

      {/* Category Breakdown */}
      {(() => {
        const usedCategories = [...new Set(activeHabits.map(h => h.category))];
        const categoryData = usedCategories.map(cat => {
          const catHabits = activeHabits.filter(h => h.category === cat);
          const catLogs = allLogs.filter(l => catHabits.some(h => h.id === l.habitId));
          const totalMins = catLogs.reduce((s, l) => s + (l.duration ?? 0), 0);
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
                  <span className="text-[10px] font-semibold text-[var(--foreground)]/60 w-20 truncate text-end">
                    {isAr ? (CATEGORY_LABELS[c.category]?.ar ?? c.category) : (CATEGORY_LABELS[c.category]?.en ?? c.category)}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden relative">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(c.avgRate / maxRate) * 100}%`, background: i === 0 ? '#22c55e' : i === categoryData.length - 1 ? '#ef4444' : '#3b82f6' }} />
                    <span className="absolute inset-y-0 end-2 flex items-center text-[9px] font-bold text-[var(--foreground)]/50">
                      {c.avgRate}%
                    </span>
                  </div>
                  <span className="text-[9px] text-[var(--foreground)]/40 w-8 text-end">{c.count}</span>
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
          const ds = d.toISOString().split('T')[0];
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
                    <span className="text-[9px] font-bold text-[var(--foreground)]/60">{d.avg}</span>
                    <div className={cn('w-full rounded-t-lg transition-all relative', isBest ? 'bg-emerald-500' : isWorst ? 'bg-red-400' : 'bg-blue-400')}
                      style={{ height: `${Math.max(pct, 6)}%` }} />
                    <span className={cn('text-[9px] font-medium', isBest ? 'text-emerald-600 font-bold' : isWorst ? 'text-red-500 font-bold' : 'text-[var(--foreground)]/40')}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[var(--foreground)]/40 mt-3 text-center">
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
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const twStr = thisWeekStart.toISOString().split('T')[0];
        const lwStr = lastWeekStart.toISOString().split('T')[0];
        const lweStr = lastWeekEnd.toISOString().split('T')[0];
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
                <p className="text-[10px] font-semibold text-[var(--foreground)]/50 uppercase mb-1">{isAr ? 'الأسبوع الماضي' : 'Last Week'}</p>
                <p className="text-xl font-black">{lastWeekCount}</p>
                {lastWeekMins > 0 && <p className="text-[10px] text-[var(--foreground)]/40">{fmtTime(lastWeekMins)}</p>}
              </div>
              <div className="text-center rounded-xl bg-[var(--foreground)]/[0.03] p-3">
                <p className="text-[10px] font-semibold text-[var(--foreground)]/50 uppercase mb-1">{isAr ? 'هذا الأسبوع' : 'This Week'}</p>
                <p className="text-xl font-black">{thisWeekCount}</p>
                {thisWeekMins > 0 && <p className="text-[10px] text-[var(--foreground)]/40">{fmtTime(thisWeekMins)}</p>}
              </div>
            </div>
            {lastWeekCount > 0 && (
              <div className={cn('mt-3 text-center text-xs font-bold px-3 py-2 rounded-lg',
                countDiff > 0 ? 'bg-emerald-500/10 text-emerald-600' :
                countDiff < 0 ? 'bg-red-500/10 text-red-500' : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/60')}>
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
  const today = todayString();
  const stats = store.getHabitStats(habit.id);
  const streak = store.getHabitStreak(habit.id);
  const timeStats = useMemo(() => getHabitTimeStats(habit.id, store.habitLogs), [habit.id, store.habitLogs]);
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
        {/* Description */}
        {(isAr ? habit.descriptionAr : habit.descriptionEn) && (
          <p className="text-xs text-[var(--foreground)]/60 leading-relaxed">{isAr ? habit.descriptionAr : habit.descriptionEn}</p>
        )}

        {/* Meta badges: category, frequency, type, priority, difficulty, tracking, age */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/60">
            {isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category)}
          </span>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/60">
            {isAr ? FREQ_LABELS[habit.frequency]?.ar : FREQ_LABELS[habit.frequency]?.en}
          </span>
          <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-md',
            habit.type === 'positive' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
            {habit.type === 'positive' ? (isAr ? 'إيجابية' : 'Build') : (isAr ? 'تجنب' : 'Break')}
          </span>
          <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-md',
            habit.priority === 'high' ? 'bg-red-500/10 text-red-500' : habit.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-500')}>
            {isAr ? (habit.priority === 'high' ? 'أولوية عالية' : habit.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة')
              : (habit.priority === 'high' ? 'High Priority' : habit.priority === 'medium' ? 'Medium' : 'Low')}
          </span>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/60">
            {isAr ? (habit.difficulty === 'hard' ? 'صعبة' : habit.difficulty === 'medium' ? 'متوسطة' : 'سهلة')
              : (habit.difficulty === 'hard' ? 'Hard' : habit.difficulty === 'medium' ? 'Medium' : 'Easy')}
          </span>
          {isCountHabit && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-violet-500/10 text-violet-600">
              {isAr ? 'تتبع عددي' : 'Count'}: {dCountTarget} {dCountUnit}
            </span>
          )}
          {hasDuration && (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-sky-500/10 text-sky-600">
              {isAr ? 'مؤقت' : 'Timer'}: {habit.expectedDuration}{isAr ? ' د' : 'm'}
            </span>
          )}
          <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/40">
            {habitAge}{isAr ? ' يوم' : ' days'}
          </span>
        </div>

        {/* Timer controls for timed habits */}
        {hasDuration && !habit.archived && (
          <div onClick={e => e.stopPropagation()}>
            <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="md" />
          </div>
        )}

        {/* Count habit stepper */}
        {isCountHabit && !habit.archived && (
          <div className="rounded-xl border border-[var(--foreground)]/[0.08] bg-[var(--foreground)]/[0.02] p-4">
            <div className="flex items-center gap-3">
              <button onClick={() => {
                const newVal = Math.max(0, dCountValue - 1);
                store.logHabit({
                  habitId: habit.id, date: today,
                  time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                  note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty,
                  completed: newVal >= dCountTarget, value: newVal, source: 'manual',
                });
              }} disabled={dCountValue <= 0}
                className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold border border-[var(--foreground)]/[0.1] hover:bg-[var(--foreground)]/[0.05] disabled:opacity-30 transition-all">
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-black" style={{ color: dCountProgress >= 1 ? '#22c55e' : habit.color }}>
                  {dCountValue}
                </span>
                <span className="text-sm text-[var(--foreground)]/40"> / {dCountTarget} {dCountUnit}</span>
              </div>
              <button onClick={() => {
                const newVal = dCountValue + 1;
                store.logHabit({
                  habitId: habit.id, date: today,
                  time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                  note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty,
                  completed: newVal >= dCountTarget, value: newVal, source: 'manual',
                });
              }}
                className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold border border-[var(--foreground)]/[0.1] hover:bg-[var(--foreground)]/[0.05] transition-all"
                style={dCountProgress < 1 ? { background: `${habit.color}15`, color: habit.color } : { background: '#22c55e15', color: '#22c55e' }}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[var(--foreground)]/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${dCountProgress * 100}%`, background: dCountProgress >= 1 ? '#22c55e' : habit.color }} />
            </div>
          </div>
        )}

        {/* Quick complete button for boolean habits */}
        {!isCountHabit && !hasDuration && !habit.archived && (
          <button onClick={() => {
            if (done) {
              const log = store.habitLogs.find(l => l.habitId === habit.id && l.date === today && l.completed);
              if (log) store.deleteHabitLog(log.id);
            } else {
              store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true });
            }
          }}
            className={cn('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
              done ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'text-white hover:opacity-90')}
            style={!done ? { background: habit.color } : undefined}>
            <CheckCircle2 className="h-4 w-4" />
            {done ? (isAr ? 'مكتملة ✓' : 'Done ✓') : (isAr ? 'تم اليوم' : 'Mark Done')}
          </button>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-2">
          <Link href={`/app/habits/${habit.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[var(--foreground)]/[0.08] text-xs font-semibold text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/[0.04] transition-all">
            <Maximize2 className="h-3.5 w-3.5" /> {isAr ? 'صفحة كاملة' : 'Full Page'}
          </Link>
        </div>

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
