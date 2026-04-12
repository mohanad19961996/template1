'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import { useToast } from '@/components/app/toast-notifications';
import {
  Habit, HabitLog, DEFAULT_HABIT_CATEGORIES, HabitCategory, HabitFrequency,
  HabitType, HabitTrackingType, Priority, Difficulty, todayString, ITEM_COLORS,
  WeekDay, CustomScheduleType,
} from '@/types/app';
import {
  Plus, Target, Search, X, Archive, Filter, Sparkles, Repeat,
  Table2, SlidersHorizontal, GripVertical, CalendarDays,
  Calendar as CalendarIcon, ChevronDown,
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

// ── Extracted Components ──
import { fadeUp, isHabitDoneToday, isHabitScheduledForDate, getCategoryLabel } from '@/components/habits/habit-constants';
import CategoryChipsRail from '@/components/habits/category-chips-rail';
import ActiveTimerBanner from '@/components/habits/habits-active-timer-banner';
import HabitCompactRow from '@/components/habits/habit-compact-card';
import SortableItem from '@/components/habits/sortable-habit-item';
import HabitsComplianceTable from '@/components/habits/habits-compliance-table';
import HabitFullCalendar from '@/components/habits/habit-full-calendar';
import HabitFormModal, { type HabitFormData } from '@/components/habits/habit-form-modal';

import { HabitDetail } from '@/components/habits/habit-detail';
import CategoryHabitsModal from '@/components/habits/category-habits-modal';
import { FolderOpen } from 'lucide-react';

const SCHEDULE_GROUP_ORDER: HabitFrequency[] = ['daily', 'weekly', 'monthly', 'custom'];
const SCHEDULE_SECTION_LABELS: Record<HabitFrequency, { en: string; ar: string }> = {
  daily: { en: 'Daily habits', ar: 'العادات اليومية' },
  weekly: { en: 'Weekly habits', ar: 'العادات الأسبوعية' },
  monthly: { en: 'Monthly habits', ar: 'العادات الشهرية' },
  custom: { en: 'Custom schedule', ar: 'جدول مخصص' },
};

const SCHEDULE_ICONS: Record<HabitFrequency, typeof Repeat> = {
  daily: Repeat,
  weekly: CalendarDays,
  monthly: CalendarIcon,
  custom: SlidersHorizontal,
};

export default function HabitsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();
  const toast = useToast();

  // Theme change detector — forces re-render of all theme-colored components
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick(t => t + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);

  // Normalize order numbers
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
    const fromHabits = store.habits.filter(h => !h.archived).map(h => h.category).filter(c => c);
    const fromStore = store.customCategories ?? [];
    const deleted = new Set(store.deletedCategories ?? []);
    const all = new Set([...defaults, ...fromStore, ...fromHabits]);
    return Array.from(all).filter(c => !deleted.has(c));
  }, [store.habits, store.customCategories, store.deletedCategories]);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

  // Category folder mode
  const [folderMode, setFolderMode] = useState(false);
  const [folderCategory, setFolderCategory] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const openHabitId = searchParams.get('openHabit');
  const openHabitHandled = useRef(false);
  useEffect(() => {
    if (openHabitHandled.current || !openHabitId) return;
    const habit = store.habits.find(h => h.id === openHabitId);
    if (habit) {
      setDetailHabit(habit);
      openHabitHandled.current = true;
    }
  }, [openHabitId, store.habits]);
  const [showFullTable, setShowFullTable] = useState(false);
  const [fullCalendarHabit, setFullCalendarHabit] = useState<Habit | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'positive' | 'avoidance'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterTracking, setFilterTracking] = useState<'all' | 'boolean' | 'count' | 'timer'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'done' | 'pending' | 'missed'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  /** Collapsible schedule sections — counts stay visible on the header when open or closed */
  const [openScheduleSections, setOpenScheduleSections] = useState<Record<HabitFrequency, boolean>>({
    daily: true,
    weekly: true,
    monthly: true,
    custom: true,
  });
  const toggleScheduleSection = useCallback((f: HabitFrequency, el?: HTMLElement | null) => {
    setOpenScheduleSections((p) => {
      const willOpen = !p[f];
      if (willOpen && el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      }
      return { ...p, [f]: willOpen };
    });
  }, []);

  /** Category filter rail — collapsible (same scroll-safe pattern as schedule groups) */
  const [categoriesOpen, setCategoriesOpen] = useState(true);

  // ── Form State ──
  const [formData, setFormData] = useState<HabitFormData>({
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
    targetValue: 1, targetUnit: 'times',
    checklistItems: [] as { id: string; titleEn: string; titleAr: string }[],
    newChecklistItem: '',
    scheduleType: 'daily' as 'daily' | 'weekly' | 'custom',
    weeklyTarget: 3, allowPartial: false, allowSkip: false,
    reminderEnabled: false, reminderTime: '08:00', image: '',
    cueEn: '', cueAr: '', routineEn: '', routineAr: '', rewardEn: '', rewardAr: '',
    placeEn: '', placeAr: '', preferredTime: '', expectedDuration: '' as string | number,
    windowStart: '00:00', windowEnd: '23:59', strictWindow: false, maxDailyReps: '' as string | number,
    completionWindowEnabled: false, completionWindowStart: '06:00', completionWindowEnd: '23:59',
    orderNumber: '' as string | number, colSpan: 1, rowSpan: 1, endDate: '',
    streakGoal: '' as string | number, streakRewardEn: '', streakRewardAr: '',
    streakGoal2: '' as string | number, streakRewardEn2: '', streakRewardAr2: '',
    streakGoal3: '' as string | number, streakRewardEn3: '', streakRewardAr3: '',
    notes: '', goalReps: '' as string | number, goalHours: '' as string | number,
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
      reminderEnabled: false, reminderTime: '08:00', image: '',
      cueEn: '', cueAr: '', routineEn: '', routineAr: '', rewardEn: '', rewardAr: '',
      placeEn: '', placeAr: '', preferredTime: '', expectedDuration: '',
      windowStart: '00:00', windowEnd: '23:59', strictWindow: false, maxDailyReps: '',
      completionWindowEnabled: false, completionWindowStart: '06:00', completionWindowEnd: '23:59',
      orderNumber: '', colSpan: 1, rowSpan: 1, endDate: '',
      streakGoal: '', streakRewardEn: '', streakRewardAr: '',
      streakGoal2: '', streakRewardEn2: '', streakRewardAr2: '',
      streakGoal3: '', streakRewardEn3: '', streakRewardAr3: '',
      notes: '', goalReps: '', goalHours: '',
    });
    setEditingHabit(null);
  };

  const handleArchiveToggle = useCallback((habit: Habit) => {
    store.toggleHabitArchive(habit.id);
    const name = isAr ? habit.nameAr : habit.nameEn;
    if (habit.archived) toast.notifySuccess(isAr ? 'تمت الاستعادة' : 'Restored', name);
    else toast.notifyHabitArchived(isAr ? `تم أرشفة: ${name}` : `Archived: ${name}`);
  }, [store, isAr, toast]);

  const openEdit = (habit: Habit) => {
    setFormData({
      nameEn: habit.nameEn, nameAr: habit.nameAr,
      descriptionEn: habit.descriptionEn, descriptionAr: habit.descriptionAr,
      category: habit.category, frequency: habit.frequency,
      customDays: habit.customDays ?? [], customScheduleType: habit.customScheduleType ?? 'weekdays',
      customMonthDays: habit.customMonthDays ?? [], customYearDays: habit.customYearDays ?? [],
      priority: habit.priority, difficulty: habit.difficulty,
      color: habit.color, icon: habit.icon, type: habit.type,
      trackingType: habit.trackingType ?? 'boolean',
      targetValue: habit.targetValue ?? 1, targetUnit: habit.targetUnit ?? 'times',
      checklistItems: habit.checklistItems ?? [], newChecklistItem: '',
      scheduleType: habit.scheduleType ?? 'daily',
      weeklyTarget: habit.weeklyTarget ?? 3, allowPartial: habit.allowPartial ?? false, allowSkip: habit.allowSkip ?? false,
      reminderEnabled: habit.reminderEnabled, reminderTime: habit.reminderTime ?? '08:00',
      image: habit.image ?? '',
      cueEn: habit.cueEn ?? '', cueAr: habit.cueAr ?? '',
      routineEn: habit.routineEn ?? '', routineAr: habit.routineAr ?? '',
      rewardEn: habit.rewardEn ?? '', rewardAr: habit.rewardAr ?? '',
      placeEn: habit.placeEn ?? '', placeAr: habit.placeAr ?? '',
      preferredTime: habit.preferredTime ?? '', expectedDuration: habit.expectedDuration ?? '',
      windowStart: habit.windowStart ?? '00:00', windowEnd: habit.windowEnd ?? '23:59',
      strictWindow: habit.strictWindow ?? false, maxDailyReps: habit.maxDailyReps ?? '',
      completionWindowEnabled: !!(habit.completionWindowStart || habit.completionWindowEnd), completionWindowStart: habit.completionWindowStart ?? '06:00', completionWindowEnd: habit.completionWindowEnd ?? '23:59',
      orderNumber: habit.order ?? '', colSpan: habit.colSpan ?? 1, rowSpan: habit.rowSpan ?? 1, endDate: habit.endDate ?? '',
      streakGoal: habit.streakGoal ?? '', streakRewardEn: habit.streakRewardEn ?? '', streakRewardAr: habit.streakRewardAr ?? '',
      streakGoal2: habit.streakGoal2 ?? '', streakRewardEn2: habit.streakRewardEn2 ?? '', streakRewardAr2: habit.streakRewardAr2 ?? '',
      streakGoal3: habit.streakGoal3 ?? '', streakRewardEn3: habit.streakRewardEn3 ?? '', streakRewardAr3: habit.streakRewardAr3 ?? '',
      notes: habit.notes ?? '', goalReps: habit.goalReps ?? '', goalHours: habit.goalHours ?? '',
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
      if (formData.orderNumber === '' || formData.orderNumber === undefined) {
        const usedOrders = store.habits.filter(h => !editingHabit || h.id !== editingHabit.id).map(h => h.order).filter(Boolean);
        formData.orderNumber = usedOrders.length > 0 ? Math.max(...usedOrders) + 1 : 1;
      } else {
        const num = Number(formData.orderNumber);
        if (isNaN(num) || num < 1) {
          toast.notifyError(isAr ? 'رقم الترتيب غير صالح' : 'Invalid order number', isAr ? 'يجب أن يكون رقم الترتيب 1 أو أكثر' : 'Order number must be 1 or greater');
          return;
        }
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
        customMonthDays: formData.frequency === 'monthly' ? (formData.customMonthDays.length > 0 ? formData.customMonthDays : undefined) : (isCustom && formData.customScheduleType === 'monthdays' ? formData.customMonthDays : undefined),
        customYearDays: isCustom && formData.customScheduleType === 'yeardays' ? formData.customYearDays : undefined,
        checklistItems: formData.checklistItems.length > 0 ? formData.checklistItems : undefined,
        targetValue: formData.trackingType === 'count' ? formData.targetValue : formData.trackingType === 'duration' ? formData.targetValue : undefined,
        targetUnit: formData.trackingType === 'count' ? formData.targetUnit : formData.trackingType === 'duration' ? 'minutes' : undefined,
        expectedDuration: formData.trackingType === 'timer' && formData.expectedDuration ? Number(formData.expectedDuration) : (formData.expectedDuration ? Number(formData.expectedDuration) : undefined),
        windowStart: formData.windowStart || undefined,
        windowEnd: formData.windowEnd || undefined,
        strictWindow: formData.strictWindow || undefined,
        completionWindowStart: formData.trackingType === 'boolean' && formData.completionWindowEnabled && formData.completionWindowStart ? formData.completionWindowStart : undefined,
        completionWindowEnd: formData.trackingType === 'boolean' && formData.completionWindowEnabled && formData.completionWindowEnd ? formData.completionWindowEnd : undefined,
        maxDailyReps: maxDailyReps !== '' ? Number(maxDailyReps) : undefined,
        order: orderNumber !== '' ? Number(orderNumber) : undefined,
        colSpan: formData.colSpan && formData.colSpan > 1 ? formData.colSpan : undefined,
        rowSpan: formData.rowSpan && formData.rowSpan > 1 ? formData.rowSpan : undefined,
        endDate: formData.endDate || undefined,
        streakGoal: streakGoal !== '' ? Number(streakGoal) : undefined,
        streakRewardEn: formData.streakRewardEn || undefined, streakRewardAr: formData.streakRewardAr || undefined,
        streakGoal2: streakGoal2 !== '' ? Number(streakGoal2) : undefined,
        streakRewardEn2: formData.streakRewardEn2 || undefined, streakRewardAr2: formData.streakRewardAr2 || undefined,
        streakGoal3: streakGoal3 !== '' ? Number(streakGoal3) : undefined,
        streakRewardEn3: formData.streakRewardEn3 || undefined, streakRewardAr3: formData.streakRewardAr3 || undefined,
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

  // ── Filtered & Sorted Habits ──
  const filteredHabits = useMemo(() => {
    let result = store.habits.filter(h => {
      if (h.archived !== showArchived) return false;
      if (!showArchived && !isHabitScheduledForDate(h, today)) return false;
      if (filterCategory !== 'all' && h.category !== filterCategory) return false;
      if (filterType !== 'all' && h.type !== filterType) return false;
      if (filterPriority !== 'all' && h.priority !== filterPriority) return false;
      if (filterTracking !== 'all') {
        const ht = h.trackingType ?? (h.expectedDuration ? 'timer' : 'boolean');
        if (ht !== filterTracking) return false;
      }
      if (filterStatus !== 'all') {
        const isDone = isHabitDoneToday(h, store.habitLogs, today);
        if (filterStatus === 'done' && !isDone) return false;
        if (filterStatus === 'pending' && isDone) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return h.nameEn.toLowerCase().includes(q) || h.nameAr.includes(q);
      }
      return true;
    });
    result = [...result].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return result;
  }, [store.habits, store.habitLogs, showArchived, filterCategory, filterType, filterPriority, filterTracking, filterStatus, searchQuery, today]);

  const habitsBySchedule = useMemo(() => {
    const buckets: Record<HabitFrequency, Habit[]> = { daily: [], weekly: [], monthly: [], custom: [] };
    for (const h of filteredHabits) {
      const raw = h.frequency ?? 'daily';
      const key: HabitFrequency = SCHEDULE_GROUP_ORDER.includes(raw as HabitFrequency) ? (raw as HabitFrequency) : 'daily';
      buckets[key].push(h);
    }
    for (const k of SCHEDULE_GROUP_ORDER) {
      buckets[k].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    }
    return SCHEDULE_GROUP_ORDER.map((key) => ({
      key,
      label: SCHEDULE_SECTION_LABELS[key],
      habits: buckets[key],
      count: buckets[key].length,
    }));
  }, [filteredHabits]);

  /** Flattened list in section order — used for drag-and-drop and global reorder */
  const habitsForDnd = useMemo(() => habitsBySchedule.flatMap((s) => s.habits), [habitsBySchedule]);

  /** Category folders — groups filtered habits by category */
  const habitsByCategory = useMemo(() => {
    const map: Record<string, Habit[]> = {};
    for (const h of filteredHabits) {
      const cat = h.category || 'other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(h);
    }
    // Sort categories: use categoryOrder if available, then alphabetical
    const ordered = store.categoryOrder?.length > 0
      ? [...new Set([...store.categoryOrder, ...Object.keys(map)])]
      : Object.keys(map);
    return ordered.filter(c => map[c] && map[c].length > 0).map(cat => ({
      category: cat,
      habits: map[cat],
      count: map[cat].length,
    }));
  }, [filteredHabits, store.categoryOrder]);

  const activeHabitsCount = store.habits.filter(h => !h.archived).length;
  const todayScheduledCount = store.habits.filter(h => !h.archived && isHabitScheduledForDate(h, today)).length;
  const completedTodayCount = store.habits.filter(h => !h.archived && isHabitDoneToday(h, store.habitLogs, today)).length;

  // DnD
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = habitsForDnd.findIndex(h => h.id === active.id);
    const newIndex = habitsForDnd.findIndex(h => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(habitsForDnd, oldIndex, newIndex);
    store.reorderHabits(reordered.map(h => h.id));
  }, [habitsForDnd, store]);
  const isDragMode = true;

  // ═══════════════════════════════════════════════════════
  // JSX
  // ═══════════════════════════════════════════════════════

  return (
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 max-w-[1400px] mx-auto">
      {/* Sticky Active Timer Banner */}
      <ActiveTimerBanner store={store} isAr={isAr} today={today} onDetail={(h) => setDetailHabit(h)} />

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="group/hero relative overflow-hidden rounded-2xl mb-3 transition-[box-shadow,filter,transform] duration-500 ease-out motion-safe:hover:shadow-[0_20px_50px_-14px_rgba(var(--color-primary-rgb)_/_0.42)] motion-safe:hover:brightness-[1.04] motion-safe:hover:scale-[1.008]"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.7))', boxShadow: '0 6px 24px rgba(var(--color-primary-rgb) / 0.18)' }}>
        <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)' }} />
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 px-5 py-3 sm:px-7 sm:py-3.5">
          <motion.div className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl transition-transform duration-300 ease-out motion-safe:group-hover/hero:scale-110" style={{ background: 'rgba(255,255,255,0.18)' }}
            animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white transition-[filter,transform] duration-300 motion-safe:group-hover/hero:drop-shadow-[0_0_12px_rgba(255,255,255,0.65)] motion-safe:group-hover/hero:scale-110" />
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl font-black tracking-tight text-white cursor-default select-none rounded-xl px-3 py-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            animate={{
              scale: [1, 1.02, 1],
              textShadow: [
                '0 2px 20px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.12)',
                '0 6px 36px rgba(255,255,255,0.32), 0 3px 20px rgba(0,0,0,0.3)',
                '0 2px 20px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.12)',
              ],
            }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{
              scale: 1.09,
              y: -4,
              textShadow: '0 10px 48px rgba(255,255,255,0.5), 0 4px 28px rgba(0,0,0,0.32), 0 0 2px rgba(255,255,255,0.95)',
            }}
            whileTap={{ scale: 1.02, y: -1 }}
            style={{ willChange: 'transform' }}
          >
            {isAr ? 'العادات' : 'Habits'}
          </motion.h1>
          <motion.div
            className="h-[3px] rounded-full bg-gradient-to-r from-white/40 via-white to-white/40"
            initial={{ width: '48%', opacity: 0.8 }}
            animate={{
              width: ['42%', '58%', '46%', '54%', '48%'],
              opacity: [0.65, 1, 0.75, 1, 0.7],
            }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.p
            className="text-sm sm:text-base font-semibold cursor-default select-none rounded-lg px-3 py-1.5 max-w-lg text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
            animate={{
              opacity: [0.78, 1, 0.82, 1, 0.78],
              scale: [1, 1.04, 1, 1.03, 1],
              y: [0, -2, 0, -1, 0],
              color: ['rgba(255,255,255,0.78)', 'rgba(255,255,255,0.98)', 'rgba(255,255,255,0.82)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0.78)'],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{
              scale: 1.12,
              y: -3,
              color: '#ffffff',
              textShadow: '0 0 28px rgba(255,255,255,0.75), 0 4px 18px rgba(0,0,0,0.22)',
            }}
            whileTap={{ scale: 1.05 }}
            style={{ willChange: 'transform' }}
          >
            {isAr ? 'ابنِ عاداتك، اصنع حياتك' : 'Build your habits, shape your life'}
          </motion.p>
        </div>
      </motion.div>

      {/* Stats Section */}
      {(() => {
        const completionRate = todayScheduledCount > 0 ? Math.round((completedTodayCount / todayScheduledCount) * 100) : 0;
        const dailyHabits = store.habits.filter(h => !h.archived && h.frequency === 'daily').length;
        const nonDailyHabits = store.habits.filter(h => !h.archived && h.frequency !== 'daily').length;
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className="group/stat rounded-2xl border px-5 py-4 flex items-center gap-4 cursor-default transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:shadow-xl motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02] motion-safe:hover:border-[var(--color-primary)]/35" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.15)', background: 'rgba(var(--color-primary-rgb) / 0.04)' }}>
              <div className="relative h-14 w-14 shrink-0 transition-transform duration-300 ease-out motion-safe:group-hover/stat:scale-110">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--foreground)]/[0.06]" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeDasharray={`${completionRate * 0.94} 94`} strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color: 'var(--color-primary)' }}>{completionRate}%</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl font-black tabular-nums">{completedTodayCount}<span className="text-[var(--foreground)]/20 text-base">/{todayScheduledCount}</span></p>
                <p className="text-[11px] font-semibold text-[var(--foreground)]/45">{isAr ? 'إنجاز اليوم' : "Today's progress"}</p>
              </div>
            </div>
            <div className="group/stat2 rounded-2xl border px-4 py-3.5 flex items-center gap-3 cursor-default transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:shadow-xl motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02] motion-safe:hover:border-orange-400/35" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.08)' }}>
              <div className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-orange-500/10 transition-transform duration-300 motion-safe:group-hover/stat2:scale-110 motion-safe:group-hover/stat2:rotate-3"><Repeat className="h-5 w-5 text-orange-500 transition-transform duration-300 motion-safe:group-hover/stat2:scale-110" /></div>
              <div className="min-w-0"><p className="text-base font-bold tabular-nums">{dailyHabits}</p><p className="text-[10px] font-semibold text-[var(--foreground)]/45">{isAr ? 'عادة يومية' : 'Daily habits'}</p></div>
            </div>
            <div className="group/stat3 rounded-2xl border px-4 py-3.5 flex items-center gap-3 cursor-default transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:shadow-xl motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02] motion-safe:hover:border-purple-400/35" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.08)' }}>
              <div className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-purple-500/10 transition-transform duration-300 motion-safe:group-hover/stat3:scale-110 motion-safe:group-hover/stat3:-rotate-3"><CalendarDays className="h-5 w-5 text-purple-500 transition-transform duration-300 motion-safe:group-hover/stat3:scale-110" /></div>
              <div className="min-w-0"><p className="text-base font-bold tabular-nums">{nonDailyHabits}</p><p className="text-[10px] font-semibold text-[var(--foreground)]/45">{isAr ? 'أسبوعية / شهرية / مخصصة' : 'Weekly / Monthly / Custom'}</p></div>
            </div>
            <div className="group/stat4 rounded-2xl border px-4 py-3.5 flex items-center gap-3 cursor-default transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:shadow-xl motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02] motion-safe:hover:border-emerald-400/35 col-span-2 sm:col-span-1" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.08)' }}>
              <div className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-emerald-500/10 transition-transform duration-300 motion-safe:group-hover/stat4:scale-110"><Target className="h-5 w-5 text-emerald-500 transition-transform duration-300 motion-safe:group-hover/stat4:scale-110" /></div>
              <div className="min-w-0"><p className="text-base font-bold tabular-nums">{activeHabitsCount} <span className="text-[10px] text-[var(--foreground)]/25">{isAr ? 'إجمالي' : 'total'}</span></p><p className="text-[10px] font-semibold text-[var(--foreground)]/45">{isAr ? `${dailyHabits} يومية + ${nonDailyHabits} أخرى` : `${dailyHabits} daily + ${nonDailyHabits} other`}</p></div>
            </div>
          </motion.div>
        );
      })()}

      {/* Quote */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
        className="group/quote cursor-default rounded-xl border px-4 py-3 text-center mb-4 sm:px-6 sm:py-3.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:shadow-lg motion-safe:hover:scale-[1.008] motion-safe:hover:border-[var(--color-primary)]/28"
        style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)', background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.03), rgba(var(--color-primary-rgb) / 0.06))' }}
        dir="rtl">
        <p className="text-xs font-semibold italic leading-relaxed text-[var(--foreground)]/50 sm:text-sm transition-colors duration-300 motion-safe:group-hover/quote:text-[var(--foreground)]/62">
          أغمض عينيك، وسافر بخيالك إلى مستقبلٍ بعيد، حيث تقف أمام عمرٍ أثقلته الحسرة وأحلامٍ أرهقها التأجيل. هناك تمنّيت فرصة واحدة فقط: أن تعود إلى هذه اللحظة لتبدأ كما ينبغي.
          <span className="font-black not-italic" style={{ color: 'var(--color-primary)' }}> افتح عينيك... أنت هنا فعلًا. انهض وابدأ!</span>
        </p>
      </motion.div>

      {/* Toolbar */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mb-4 flex items-center gap-1.5 sm:gap-2 relative z-[100]">
        {/* Search */}
        <div className="relative flex-1 min-w-0 group/search rounded-xl">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 z-[1] transition-colors duration-200 text-[var(--color-primary)]/40 group-focus-within/search:text-[var(--color-primary)] group-hover/search:text-[var(--color-primary)]" />
          {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute end-2 top-1/2 -translate-y-1/2 z-[1] h-5 w-5 rounded-full flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-200"><X className="h-2.5 w-2.5" /></button>}
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isAr ? 'بحث...' : 'Search...'}
            className="w-full rounded-xl border-2 border-[var(--color-primary)]/25 ps-8 pe-8 py-1.5 text-[12px] font-semibold placeholder:text-[var(--foreground)]/30 focus:outline-none transition-all duration-200 bg-transparent hover:border-[var(--color-primary)]/50 focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb)_/_0.1)]" />
        </div>
        {/* New Habit */}
        <button type="button" onClick={() => { resetForm(); setShowForm(true); }}
          className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 text-[12px] font-bold text-white transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.85))', boxShadow: '0 4px 14px rgba(var(--color-primary-rgb) / 0.2)' }}>
          <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? 'عادة جديدة' : 'New Habit'}</span>
        </button>
        {/* Archive */}
        <button type="button" onClick={() => setShowArchived(!showArchived)}
          className={cn('shrink-0 flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-[12px] font-bold cursor-pointer transition-all duration-200 active:scale-95',
            showArchived
              ? 'border-[var(--color-primary)] text-white'
              : 'border-[var(--color-primary)]/25 text-[var(--foreground)]/60 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md')}
          style={showArchived ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
          <Archive className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? 'الأرشيف' : 'Archive'}</span>
          {store.habits.filter(h => h.archived).length > 0 && <span className={cn('rounded-full px-1.5 py-px text-[9px] font-black tabular-nums', showArchived ? 'bg-white/25 text-white' : 'bg-amber-500/15 text-amber-600')}>{store.habits.filter(h => h.archived).length}</span>}
        </button>
        {/* Compliance */}
        <button type="button" onClick={() => setShowFullTable(true)}
          className="shrink-0 flex items-center gap-1.5 rounded-xl border-2 border-[var(--color-primary)]/25 px-2.5 py-1.5 text-[12px] font-bold text-[var(--foreground)]/60 cursor-pointer transition-all duration-200 active:scale-95 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md">
          <Table2 className="h-3.5 w-3.5" /><span className="hidden lg:inline">{isAr ? 'الالتزام الشهري' : 'Monthly Compliance'}</span>
        </button>
        {/* Log */}
        <Link href="/app/habits/log"
          className="shrink-0 flex items-center gap-1.5 rounded-xl border-2 border-[var(--color-primary)]/25 px-2.5 py-1.5 text-[12px] font-bold text-[var(--foreground)]/60 transition-all duration-200 active:scale-95 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md">
          <CalendarIcon className="h-3.5 w-3.5" /><span className="hidden lg:inline">{isAr ? 'السجل' : 'Log'}</span>
        </Link>
        {/* Filters */}
        {(() => {
          const activeFilterCount = [filterType !== 'all', filterPriority !== 'all', filterTracking !== 'all', filterStatus !== 'all'].filter(Boolean).length;
          return (
            <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn('shrink-0 flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-[12px] font-bold cursor-pointer transition-all duration-200 active:scale-95',
                showAdvancedFilters || activeFilterCount > 0
                  ? 'border-[var(--color-primary)] text-white'
                  : 'border-[var(--color-primary)]/25 text-[var(--foreground)]/60 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md')}
              style={(showAdvancedFilters || activeFilterCount > 0) ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
              <SlidersHorizontal className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? 'فلاتر' : 'Filters'}</span>
              {activeFilterCount > 0 && <span className="text-[9px] font-black bg-white/25 text-white h-4 min-w-[16px] rounded-full flex items-center justify-center">{activeFilterCount}</span>}
            </button>
          );
        })()}
      </motion.div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-background)] p-5 transition-all duration-300 hover:border-[var(--color-primary)]/35">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold">{isAr ? 'فلاتر متقدمة' : 'Advanced Filters'}</span>
                {(filterType !== 'all' || filterPriority !== 'all' || filterTracking !== 'all' || filterStatus !== 'all') && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => { setFilterType('all'); setFilterPriority('all'); setFilterTracking('all'); setFilterStatus('all'); }}
                    className="text-xs text-[var(--color-primary)] font-bold px-2 py-1 rounded-lg hover:bg-[var(--color-primary)]/12 hover:underline transition-all duration-200 motion-safe:hover:shadow-sm">
                    {isAr ? 'مسح الكل' : 'Clear All'}
                  </motion.button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {([
                  { label: isAr ? 'النوع' : 'Type', state: filterType, setter: setFilterType, options: [{ v: 'all' as const, en: 'All', ar: 'الكل' }, { v: 'positive' as const, en: 'Build', ar: 'إيجابية' }, { v: 'avoidance' as const, en: 'Break', ar: 'تجنب' }] },
                  { label: isAr ? 'الأولوية' : 'Priority', state: filterPriority, setter: setFilterPriority, options: [{ v: 'all' as const, en: 'All', ar: 'الكل' }, { v: 'high' as const, en: 'High', ar: 'عالية' }, { v: 'medium' as const, en: 'Med', ar: 'متوسطة' }, { v: 'low' as const, en: 'Low', ar: 'منخفضة' }] },
                  { label: isAr ? 'التتبع' : 'Tracking', state: filterTracking, setter: setFilterTracking, options: [{ v: 'all' as const, en: 'All', ar: 'الكل' }, { v: 'boolean' as const, en: 'Yes/No', ar: 'نعم/لا' }, { v: 'count' as const, en: 'Count', ar: 'عدّ' }, { v: 'timer' as const, en: 'Timer', ar: 'مؤقت' }] },
                  { label: isAr ? 'الحالة اليوم' : "Today's Status", state: filterStatus, setter: setFilterStatus, options: [{ v: 'all' as const, en: 'All', ar: 'الكل' }, { v: 'done' as const, en: 'Done', ar: 'مكتمل' }, { v: 'pending' as const, en: 'Pending', ar: 'متبقي' }] },
                ] as const).map(filter => (
                  <div key={filter.label}>
                    <label className="text-[11px] font-bold text-[var(--foreground)] uppercase tracking-wider mb-2 block">{filter.label}</label>
                    <div className="flex flex-wrap gap-1">
                      {filter.options.map(o => (
                        <button type="button" key={o.v} onClick={() => (filter.setter as (v: string) => void)(o.v)}
                          className={cn('px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:scale-105 motion-safe:active:scale-95', filter.state === o.v ? 'text-white shadow-sm motion-safe:hover:shadow-md' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.08]')}
                          style={filter.state === o.v ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                          {isAr ? o.ar : o.en}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories — collapsible (same pattern as schedule groups) */}
      <div
        className={cn(
          'habits-schedule-section relative z-[90] mb-3 sm:mb-4 rounded-xl overflow-hidden transition-[border-color,background-color,box-shadow] duration-200',
          categoriesOpen
            ? 'border border-[var(--color-primary)]/40 bg-[var(--color-background)]'
            : 'border border-[var(--color-primary)]/30 bg-[var(--color-background)]',
        )}
      >
        <button
          type="button"
          onClick={(e) => { const el = e.currentTarget.closest('.habits-schedule-section'); setCategoriesOpen((o) => { if (!o && el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150); return !o; }); }}
          aria-expanded={categoriesOpen}
          className={cn(
            'group/acc relative w-full grid items-center gap-x-2 sm:gap-x-4 gap-y-2',
            'grid-cols-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
            'px-3 py-3 sm:px-4 sm:py-3.5',
            'border-0 bg-transparent text-start transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
            categoriesOpen && 'border-b-2 border-[var(--color-primary)]/20',
            'hover:bg-[var(--color-primary)]/[0.08]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]/40',
          )}
        >
          <div className="relative z-[1] col-start-1 row-start-1 flex items-center gap-2 justify-self-start min-w-0 ps-1 sm:col-auto sm:row-auto">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-out',
                categoriesOpen
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'border-2 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/[0.08] text-[var(--color-primary)] group-hover/acc:bg-[var(--color-primary)] group-hover/acc:text-white group-hover/acc:border-transparent group-hover/acc:shadow-md',
              )}
            >
              <Filter className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
            </div>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all duration-200',
                categoriesOpen
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                  : 'text-[var(--foreground)]/40 group-hover/acc:text-[var(--color-primary)] group-hover/acc:bg-[var(--color-primary)]/10',
                categoriesOpen ? 'rotate-0' : '-rotate-90',
              )}
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </span>
          </div>
          <div className="relative z-[1] col-span-2 row-start-2 flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:max-w-md sm:justify-self-center">
            <span className={cn('text-center text-[15px] font-bold leading-snug tracking-tight line-clamp-2 sm:text-base transition-colors duration-200', categoriesOpen ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)] group-hover/acc:text-[var(--color-primary)]')}>
              {isAr ? 'الفئات' : 'Categories'}
            </span>
            <span className="text-center text-[10px] font-medium text-[var(--foreground)]/45 line-clamp-2 sm:text-[11px] group-hover/acc:text-[var(--color-primary)]/60 transition-colors duration-200">
              {filterCategory === 'all'
                ? (isAr ? 'تصفية حسب الفئة' : 'Filter by category')
                : getCategoryLabel(filterCategory, isAr, store.deletedCategories)}
            </span>
          </div>
          <div className="relative z-[1] col-start-2 row-start-1 flex flex-wrap items-center justify-end gap-2 justify-self-end min-w-0 sm:col-auto sm:row-auto">
            <span
              className={cn(
                'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums sm:text-xs transition-all duration-200',
                categoriesOpen
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                  : 'bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/70 group-hover/acc:bg-[var(--color-primary)]/15 group-hover/acc:text-[var(--color-primary)]',
              )}
            >
              {allCategories.length}
            </span>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 sm:px-3 sm:text-[11px]',
                categoriesOpen
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50 group-hover/acc:bg-[var(--color-primary)] group-hover/acc:text-white group-hover/acc:shadow-sm',
              )}
            >
              {categoriesOpen ? (isAr ? 'طيّ' : 'Collapse') : (isAr ? 'توسيع' : 'Expand')}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', categoriesOpen && 'rotate-180')} strokeWidth={2.5} aria-hidden />
            </span>
          </div>
        </button>

        <div
          className="habits-schedule-collapse overflow-hidden"
          style={{ gridTemplateRows: categoriesOpen ? '1fr' : '0fr' }}
        >
          <div className={cn('min-h-0 overflow-hidden', !categoriesOpen && 'pointer-events-none')}>
            <div className="px-2 pb-2 pt-1 sm:px-3">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2.15}>
                <CategoryChipsRail isAr={isAr} allCategories={allCategories} filterCategory={filterCategory} setFilterCategory={setFilterCategory} showArchived={showArchived} store={store} toast={toast} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-center mb-3">
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ background: 'rgba(var(--color-primary-rgb)/0.06)', border: '1px solid rgba(var(--color-primary-rgb)/0.1)' }}>
          <button type="button" onClick={() => setFolderMode(false)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150',
              !folderMode
                ? 'bg-[var(--color-card)] text-[var(--color-primary)] shadow-sm'
                : 'text-[var(--foreground)]/40 hover:text-[var(--foreground)]/60')}
            style={!folderMode ? { boxShadow: '0 1px 4px rgba(var(--color-primary-rgb)/0.1)' } : undefined}>
            <CalendarDays className="h-3.5 w-3.5" />
            {isAr ? 'حسب الجدول' : 'By Schedule'}
          </button>
          <button type="button" onClick={() => setFolderMode(true)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150',
              folderMode
                ? 'bg-[var(--color-card)] text-[var(--color-primary)] shadow-sm'
                : 'text-[var(--foreground)]/40 hover:text-[var(--foreground)]/60')}
            style={folderMode ? { boxShadow: '0 1px 4px rgba(var(--color-primary-rgb)/0.1)' } : undefined}>
            <FolderOpen className="h-3.5 w-3.5" />
            {isAr ? 'حسب الفئة' : 'By Category'}
          </button>
        </div>
      </div>

      {/* Archive Mode Banner */}
      {showArchived && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="group/archive-banner mb-4 flex items-center gap-4 rounded-2xl border-2 border-amber-500/25 bg-amber-500/[0.06] px-5 py-4 transition-all duration-300 motion-safe:hover:border-amber-500/35 motion-safe:hover:shadow-md">
          <div className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center bg-amber-500/15 transition-transform duration-300 motion-safe:group-hover/archive-banner:scale-105"><Archive className="h-6 w-6 text-amber-600 transition-transform duration-300 motion-safe:group-hover/archive-banner:-rotate-6" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-amber-700 dark:text-amber-400">{isAr ? 'وضع الأرشيف' : 'Archive Mode'}</p>
            <p className="text-sm font-semibold text-amber-600/70 dark:text-amber-400/60 mt-0.5">
              {isAr ? `${store.habits.filter(h => h.archived).length} عادة مؤرشفة — يمكنك استعادتها أو حذفها نهائياً` : `${store.habits.filter(h => h.archived).length} archived habits — restore or permanently delete`}
            </p>
          </div>
          <button type="button" onClick={() => setShowArchived(false)} className="group/exit-arch shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-400 border-2 border-amber-500/25 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:bg-amber-500/15 motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:hover:border-amber-500/40 motion-safe:hover:shadow-md">
            <X className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover/exit-arch:rotate-90" />{isAr ? 'خروج من الأرشيف' : 'Exit Archive'}
          </button>
        </motion.div>
      )}

      {/* ═══ Category Folder Mode ═══ */}
      {folderMode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 mb-4">
          {habitsByCategory.map((group, gi) => {
            const catLabel = getCategoryLabel(group.category, isAr);
            const doneCount = group.habits.filter(h => isHabitDoneToday(h, store.habitLogs, today)).length;
            const allDone = doneCount === group.count && group.count > 0;
            return (
              <motion.button
                key={group.category}
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: gi * 0.03, duration: 0.2 }}
                onClick={() => setFolderCategory(group.category)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all duration-150 active:scale-95',
                  'border hover:shadow-md',
                  allDone
                    ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5 hover:border-[var(--color-success)]/50'
                    : 'border-[var(--color-primary)]/15 bg-[var(--color-background)] hover:border-[var(--color-primary)]/35 hover:bg-[var(--color-primary)]/[0.04]',
                )}
              >
                <FolderOpen className={cn('h-4 w-4 shrink-0', allDone ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)]')} />
                <span className="text-xs font-bold whitespace-nowrap">{catLabel}</span>
                <span className={cn(
                  'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full',
                  allDone
                    ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                    : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
                )}>
                  {doneCount}/{group.count}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Category Habits Modal */}
      <CategoryHabitsModal
        open={!!folderCategory}
        onClose={() => setFolderCategory(null)}
        category={folderCategory ?? ''}
        habits={folderCategory ? filteredHabits.filter(h => (h.category || 'other') === folderCategory) : []}
        isAr={isAr}
        store={store}
        today={today}
        onEdit={(habit) => { setFolderCategory(null); openEdit(habit); }}
        onDetail={(habit) => { setFolderCategory(null); setDetailHabit(habit); }}
        themeTick={themeTick}
      />

      {/* Habits by schedule — collapsible sections (count always on header) */}
      {!folderMode && (() => {
        const renderHabitCard = (habit: Habit, i: number) => (
          <SortableItem key={habit.id} id={habit.id} disabled={!isDragMode}>
            <HabitCompactRow habit={habit} index={i} isAr={isAr} store={store} today={today}
              onEdit={() => openEdit(habit)} onArchive={() => store.toggleHabitArchive(habit.id)} onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} onViewPage={`/app/habits/${habit.id}`} />
          </SortableItem>
        );

        const sections = habitsBySchedule.filter((s) => s.count > 0).map((section) => {
          const open = openScheduleSections[section.key];
          const title = isAr ? section.label.ar : section.label.en;
          const SectionIcon = SCHEDULE_ICONS[section.key];
          return (
            <div
              key={section.key}
              className={cn(
                'habits-schedule-section mb-3 sm:mb-4 rounded-xl overflow-hidden transition-[border-color,background-color,box-shadow] duration-200',
                open
                  ? 'border border-[var(--color-primary)]/40 bg-[var(--color-background)]'
                  : 'border border-[var(--color-primary)]/30 bg-[var(--color-background)]',
              )}
            >
              <button
                type="button"
                onClick={(e) => toggleScheduleSection(section.key, e.currentTarget.closest('.habits-schedule-section') as HTMLElement)}
                aria-expanded={open}
                className={cn(
                  'group/acc relative w-full grid items-center gap-x-2 sm:gap-x-4 gap-y-2',
                  'grid-cols-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
                  'px-3 py-3 sm:px-4 sm:py-3.5',
                  'border-0 bg-transparent text-start',
                  'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  open && 'border-b-2 border-[var(--color-primary)]/20',
                  'hover:bg-[var(--color-primary)]/[0.08]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]/40',
                )}
              >
                <div className="relative z-[1] col-start-1 row-start-1 flex items-center gap-2 justify-self-start min-w-0 ps-1 sm:col-auto sm:row-auto">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ease-out',
                      open
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'border-2 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/[0.08] text-[var(--color-primary)] group-hover/acc:bg-[var(--color-primary)] group-hover/acc:text-white group-hover/acc:border-transparent group-hover/acc:shadow-md',
                    )}
                  >
                    <SectionIcon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all duration-200',
                      open
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                        : 'text-[var(--foreground)]/40 group-hover/acc:text-[var(--color-primary)] group-hover/acc:bg-[var(--color-primary)]/10',
                      open ? 'rotate-0' : '-rotate-90',
                    )}
                  >
                    <ChevronDown className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  </span>
                </div>

                <div className="relative z-[1] col-span-2 row-start-2 flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:max-w-md sm:justify-self-center">
                  <span className={cn('text-center text-[15px] font-bold leading-snug tracking-tight line-clamp-2 sm:text-base transition-colors duration-200', open ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)] group-hover/acc:text-[var(--color-primary)]')}>
                    {title}
                  </span>
                  <span className="text-center text-[10px] font-medium text-[var(--foreground)]/45 line-clamp-2 sm:text-[11px] group-hover/acc:text-[var(--color-primary)]/60 transition-colors duration-200">
                    {open
                      ? (isAr ? 'إخفاء العادات' : 'Hide habits in this group')
                      : (isAr ? 'عرض العادات' : 'Show habits in this group')}
                  </span>
                </div>

                <div className="relative z-[1] col-start-2 row-start-1 flex flex-wrap items-center justify-end gap-2 justify-self-end min-w-0 sm:col-auto sm:row-auto">
                  <span
                    className={cn(
                      'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums sm:text-xs transition-all duration-200',
                      open
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                        : 'bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/70 group-hover/acc:bg-[var(--color-primary)]/15 group-hover/acc:text-[var(--color-primary)]',
                    )}
                  >
                    {section.count}
                  </span>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 sm:px-3 sm:text-[11px]',
                      open
                        ? 'bg-[var(--color-primary)] text-white shadow-sm'
                        : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50 group-hover/acc:bg-[var(--color-primary)] group-hover/acc:text-white group-hover/acc:shadow-sm',
                    )}
                  >
                    {open ? (isAr ? 'طيّ' : 'Collapse') : (isAr ? 'توسيع' : 'Expand')}
                    <ChevronDown
                      className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')}
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  </span>
                </div>
              </button>

              {/* CSS grid 0fr→1fr avoids height:auto layout thrash + scroll anchoring jumps */}
              <div
                className="habits-schedule-collapse overflow-hidden"
                style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
              >
                <div className={cn('min-h-0 overflow-hidden', !open && 'pointer-events-none')}>
                  <div className="px-2 sm:px-3 pb-2.5 sm:pb-3 pt-0">
                    <div
                      className={cn(
                        'rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-background)] p-2 sm:p-3',
                        'transition-all duration-300 ease-out motion-safe:hover:border-[var(--color-primary)]/35 motion-safe:hover:shadow-md',
                      )}
                    >
                      <p className="mb-2 px-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-primary)]/50 text-center sm:text-start">
                        {isAr ? `${section.count} عادة في هذا القسم` : `${section.count} habit${section.count === 1 ? '' : 's'} in this section`}
                      </p>
                      <div key={themeTick} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                        {section.habits.map((habit, idx) => renderHabitCard(habit, idx))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        });

        const groupedContent = <div className="space-y-0">{sections}</div>;

        return isDragMode ? (
          <>
            <div className="flex items-center gap-2 mb-3 rounded-lg px-1 py-0.5 transition-colors duration-200 motion-safe:hover:bg-[var(--foreground)]/[0.03]">
              <GripVertical className="h-4 w-4 text-[var(--foreground)]/60 transition-all duration-200 motion-safe:hover:text-[var(--color-primary)] motion-safe:hover:scale-110" />
              <span className="text-xs font-medium text-[var(--foreground)] transition-colors duration-200 motion-safe:hover:text-[var(--foreground)]/90">{isAr ? 'اسحب العادات لإعادة ترتيبها (عبر الأقسام)' : 'Drag habits to reorder (across sections)'}</span>
            </div>
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={habitsForDnd.map(h => h.id)} strategy={rectSortingStrategy}>
                {groupedContent}
              </SortableContext>
            </DndContext>
          </>
        ) : groupedContent;
      })()}

      {/* Empty State */}
      {filteredHabits.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="group/empty-ico mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--foreground)]/[0.05] transition-all duration-300 motion-safe:hover:scale-110 motion-safe:hover:bg-[var(--color-primary)]/10 motion-safe:hover:shadow-md">
            <Target className="h-6 w-6 text-[var(--foreground)] transition-colors duration-300 motion-safe:group-hover/empty-ico:text-[var(--color-primary)] motion-safe:group-hover/empty-ico:scale-110" />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">
            {showArchived ? (isAr ? 'لا توجد عادات مؤرشفة' : 'No archived habits')
              : searchQuery ? (isAr ? 'لا توجد عادات تطابق البحث' : 'No habits match your search')
              : filterCategory !== 'all' ? (isAr ? 'لا توجد عادات في هذه الفئة' : 'No habits in this category')
              : (isAr ? 'لا توجد عادات بعد' : 'No habits yet')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--foreground)] border border-[var(--foreground)]/[0.18] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md motion-safe:active:scale-95 hover:bg-[var(--foreground)]/[0.06] hover:border-[var(--color-primary)]/25 motion-safe:hover:[&_svg]:rotate-90"><X className="h-3 w-3 transition-transform duration-200" /> {isAr ? 'مسح البحث' : 'Clear Search'}</button>}
            {filterCategory !== 'all' && <button type="button" onClick={() => setFilterCategory('all')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--foreground)] border border-[var(--foreground)]/[0.18] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md motion-safe:active:scale-95 hover:bg-[var(--color-primary)]/[0.08] hover:border-[var(--color-primary)]/30 motion-safe:hover:[&_svg]:scale-110"><Filter className="h-3 w-3 transition-transform duration-200" /> {isAr ? 'كل الفئات' : 'All Categories'}</button>}
            {!showArchived && <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="group/empty-add app-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-all duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:hover:shadow-lg motion-safe:hover:brightness-110"><Plus className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover/empty-add:rotate-90" /> {isAr ? 'إضافة عادة' : 'Add Habit'}</button>}
          </div>
        </motion.div>
      )}

      {/* Compliance Table Modal */}
      <AnimatePresence>
        {showFullTable && <HabitsComplianceTable habits={store.habits.filter(h => !h.archived)} isAr={isAr} store={store} onClose={() => setShowFullTable(false)} />}
      </AnimatePresence>

      {/* Create/Edit Form Modal */}
      <HabitFormModal isAr={isAr} showForm={showForm} editingHabit={editingHabit} formData={formData} setFormData={setFormData}
        allCategories={allCategories} store={store} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} />

      {/* Detail Modal */}
      <AnimatePresence>
        {detailHabit && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailHabit(null)} className="fixed inset-0 z-[var(--z-overlay)] bg-black/60"
              style={{ display: fullCalendarHabit ? 'none' : undefined }} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 sm:inset-x-2 md:inset-x-4 top-0 sm:top-[2%] md:top-[3%] z-[var(--z-modal)] md:w-[min(960px,calc(100vw-2rem))] lg:w-[1100px] md:inset-x-0 md:mx-auto max-h-[100vh] sm:max-h-[96vh] md:max-h-[95vh] overflow-y-auto rounded-none sm:rounded-2xl md:rounded-3xl bg-[var(--color-background)] border-0 sm:border border-[var(--foreground)]/[0.18] shadow-2xl"
              style={{ display: fullCalendarHabit ? 'none' : undefined }}>
              <HabitDetail habit={detailHabit} onClose={() => setDetailHabit(null)} onEdit={() => { setDetailHabit(null); openEdit(detailHabit); }} onViewFull={() => { setFullCalendarHabit(detailHabit); }}
                allHabits={store.habits.filter(h => !h.archived && (filterCategory === 'all' || h.category === filterCategory))} onNavigate={(h) => setDetailHabit(h)}
                onArchive={() => { store.toggleHabitArchive(detailHabit.id); setDetailHabit(null); }}
                onDelete={() => {
                  const id = detailHabit.id;
                  store.updateHabit(id, {});
                  fetch(`/api/habits/${id}`, { method: 'DELETE' }).catch(() => {});
                  const raw = localStorage.getItem('habits-app-state');
                  if (raw) { try { const state = JSON.parse(raw); state.habits = (state.habits || []).filter((h: Habit) => h.id !== id); state.habitLogs = (state.habitLogs || []).filter((l: HabitLog) => l.habitId !== id); localStorage.setItem('habits-app-state', JSON.stringify(state)); } catch {} }
                  window.location.reload();
                }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Full Calendar Modal */}
      <AnimatePresence>
        {fullCalendarHabit && <HabitFullCalendar habit={fullCalendarHabit} isAr={isAr} store={store} onClose={() => setFullCalendarHabit(null)} onBack={detailHabit ? () => setFullCalendarHabit(null) : undefined} />}
      </AnimatePresence>
    </div>
  );
}
