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
  Calendar as CalendarIcon,
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

// ── Extracted Components ──
import { fadeUp, isHabitDoneToday, isHabitScheduledForDate } from '@/components/habits/habit-constants';
import CategoryChipsRail from '@/components/habits/category-chips-rail';
import ActiveTimerBanner from '@/components/habits/habits-active-timer-banner';
import HabitCompactRow from '@/components/habits/habit-compact-card';
import SortableItem from '@/components/habits/sortable-habit-item';
import HabitsComplianceTable from '@/components/habits/habits-compliance-table';
import HabitFullCalendar from '@/components/habits/habit-full-calendar';
import HabitFormModal, { type HabitFormData } from '@/components/habits/habit-form-modal';

import { HabitDetail } from '@/components/habits/habit-detail';

export default function HabitsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();
  const toast = useToast();

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
    const fromHabits = store.habits.map(h => h.category).filter(c => c);
    const fromStore = store.customCategories ?? [];
    const all = new Set([...defaults, ...fromStore, ...fromHabits]);
    return Array.from(all);
  }, [store.habits, store.customCategories]);

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
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
    windowStart: '', windowEnd: '', strictWindow: false, maxDailyReps: '' as string | number,
    completionWindowStart: '', completionWindowEnd: '',
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
      windowStart: '', windowEnd: '', strictWindow: false, maxDailyReps: '',
      completionWindowStart: '', completionWindowEnd: '',
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
      windowStart: habit.windowStart ?? '', windowEnd: habit.windowEnd ?? '',
      strictWindow: habit.strictWindow ?? false, maxDailyReps: habit.maxDailyReps ?? '',
      completionWindowStart: habit.completionWindowStart ?? '', completionWindowEnd: habit.completionWindowEnd ?? '',
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
        completionWindowStart: formData.trackingType === 'boolean' && formData.completionWindowStart ? formData.completionWindowStart : undefined,
        completionWindowEnd: formData.trackingType === 'boolean' && formData.completionWindowEnd ? formData.completionWindowEnd : undefined,
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

  const activeHabitsCount = store.habits.filter(h => !h.archived).length;
  const todayScheduledCount = store.habits.filter(h => !h.archived && isHabitScheduledForDate(h, today)).length;
  const completedTodayCount = store.habits.filter(h => !h.archived && isHabitDoneToday(h, store.habitLogs, today)).length;

  // DnD
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredHabits.findIndex(h => h.id === active.id);
    const newIndex = filteredHabits.findIndex(h => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(filteredHabits, oldIndex, newIndex);
    store.reorderHabits(reordered.map(h => h.id));
  }, [filteredHabits, store]);
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
        className="relative overflow-hidden rounded-2xl mb-3"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.7))', boxShadow: '0 6px 24px rgba(var(--color-primary-rgb) / 0.18)' }}>
        <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)' }} />
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 px-5 py-3 sm:px-7 sm:py-3.5">
          <motion.div className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.18)' }}
            animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </motion.div>
          <motion.h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            {isAr ? 'العادات' : 'Habits'}
          </motion.h1>
          <motion.div className="h-[3px] rounded-full bg-white/90" initial={{ width: 0 }} animate={{ width: ['0%', '60%', '40%', '50%'] }} transition={{ duration: 2, ease: 'easeOut' }} />
          <motion.p className="text-sm sm:text-base font-semibold text-white/90" animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
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
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-2xl border px-5 py-4 flex items-center gap-4 transition-all duration-200 cursor-default hover:shadow-lg hover:-translate-y-0.5 hover:border-[var(--color-primary)]/25" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.15)', background: 'rgba(var(--color-primary-rgb) / 0.04)' }}>
              <div className="relative h-14 w-14 shrink-0">
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
            <div className="rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-all duration-200 cursor-default hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-400/25" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.08)' }}>
              <div className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-orange-500/10"><Repeat className="h-5 w-5 text-orange-500" /></div>
              <div className="min-w-0"><p className="text-base font-bold tabular-nums">{dailyHabits}</p><p className="text-[10px] font-semibold text-[var(--foreground)]/45">{isAr ? 'عادة يومية' : 'Daily habits'}</p></div>
            </div>
            <div className="rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-all duration-200 cursor-default hover:shadow-lg hover:-translate-y-0.5 hover:border-purple-400/25" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.08)' }}>
              <div className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-purple-500/10"><CalendarDays className="h-5 w-5 text-purple-500" /></div>
              <div className="min-w-0"><p className="text-base font-bold tabular-nums">{nonDailyHabits}</p><p className="text-[10px] font-semibold text-[var(--foreground)]/45">{isAr ? 'أسبوعية / شهرية / مخصصة' : 'Weekly / Monthly / Custom'}</p></div>
            </div>
            <div className="rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-all duration-200 cursor-default hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-400/25 col-span-2 sm:col-span-1" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.08)' }}>
              <div className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-emerald-500/10"><Target className="h-5 w-5 text-emerald-500" /></div>
              <div className="min-w-0"><p className="text-base font-bold tabular-nums">{activeHabitsCount} <span className="text-[10px] text-[var(--foreground)]/25">{isAr ? 'إجمالي' : 'total'}</span></p><p className="text-[10px] font-semibold text-[var(--foreground)]/45">{isAr ? `${dailyHabits} يومية + ${nonDailyHabits} أخرى` : `${dailyHabits} daily + ${nonDailyHabits} other`}</p></div>
            </div>
          </motion.div>
        );
      })()}

      {/* Quote */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
        className="mb-4 cursor-default rounded-xl border px-4 py-3 text-center transition-all duration-300 hover:shadow-md sm:px-6 sm:py-3.5"
        style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)', background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.03), rgba(var(--color-primary-rgb) / 0.06))' }}
        dir="rtl">
        <p className="text-xs font-semibold italic leading-relaxed text-[var(--foreground)]/50 sm:text-sm">
          أغمض عينيك، وسافر بخيالك إلى مستقبلٍ بعيد، حيث تقف أمام عمرٍ أثقلته الحسرة وأحلامٍ أرهقها التأجيل. هناك تمنّيت فرصة واحدة فقط: أن تعود إلى هذه اللحظة لتبدأ كما ينبغي.
          <span className="font-black not-italic" style={{ color: 'var(--color-primary)' }}> افتح عينيك... أنت هنا فعلًا. انهض وابدأ!</span>
        </p>
      </motion.div>

      {/* Toolbar */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mb-4 flex items-center gap-1.5 sm:gap-2 relative z-[100]">
        <div className="relative flex-1 min-w-0 group/search">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 group-focus-within/search:text-[var(--color-primary)]" style={{ color: 'rgba(var(--color-primary-rgb) / 0.35)' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute end-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center bg-[var(--foreground)]/[0.08] hover:bg-[var(--foreground)]/[0.15] transition-colors"><X className="h-3 w-3 text-[var(--foreground)]/50" /></button>}
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isAr ? 'بحث...' : 'Search...'}
            className="w-full rounded-xl border ps-9 pe-9 py-2 text-[13px] font-semibold placeholder:text-[var(--foreground)]/30 focus:outline-none transition-all duration-200 bg-transparent"
            style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--color-primary-rgb) / 0.08)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.12)'; e.currentTarget.style.boxShadow = 'none'; }} />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { resetForm(); setShowForm(true); }}
          className="shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 sm:px-5 py-2 text-[13px] font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.85))', boxShadow: '0 4px 14px rgba(var(--color-primary-rgb) / 0.2)' }}>
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">{isAr ? 'عادة جديدة' : 'New Habit'}</span>
        </motion.button>
        <button onClick={() => setShowArchived(!showArchived)}
          className={cn('shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-bold transition-all cursor-pointer', showArchived ? 'text-white' : 'text-[var(--foreground)]/70 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/25')}
          style={showArchived ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))', borderColor: 'var(--color-primary)' } : { borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}>
          <Archive className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? 'الأرشيف' : 'Archive'}</span>
          {store.habits.filter(h => h.archived).length > 0 && <span className={cn('rounded-full px-1.5 py-px text-[10px] font-black tabular-nums', showArchived ? 'bg-white/25 text-white' : 'bg-amber-500/15 text-amber-600')}>{store.habits.filter(h => h.archived).length}</span>}
        </button>
        <button onClick={() => setShowFullTable(true)} className="shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-bold text-[var(--foreground)]/70 transition-all cursor-pointer hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/25" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}>
          <Table2 className="h-3.5 w-3.5" /><span className="hidden lg:inline">{isAr ? 'الالتزام الشهري' : 'Monthly Compliance'}</span>
        </button>
        <Link href="/app/habits/log" className="shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-bold text-[var(--foreground)]/70 transition-all hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/25" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}>
          <CalendarIcon className="h-3.5 w-3.5" /><span className="hidden lg:inline">{isAr ? 'السجل' : 'Log'}</span>
        </Link>
        {(() => {
          const activeFilterCount = [filterType !== 'all', filterPriority !== 'all', filterTracking !== 'all', filterStatus !== 'all'].filter(Boolean).length;
          return (
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn('shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-bold transition-all cursor-pointer', showAdvancedFilters || activeFilterCount > 0 ? 'text-white' : 'text-[var(--foreground)]/70 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/25')}
              style={(showAdvancedFilters || activeFilterCount > 0) ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))', borderColor: 'var(--color-primary)' } : { borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}>
              <SlidersHorizontal className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? 'فلاتر' : 'Filters'}</span>
              {activeFilterCount > 0 && <span className="text-[10px] font-black bg-white/25 text-white h-4 min-w-[16px] rounded-full flex items-center justify-center">{activeFilterCount}</span>}
            </button>
          );
        })()}
      </motion.div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
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
                        <button key={o.v} onClick={() => (filter.setter as (v: string) => void)(o.v)}
                          className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer', filter.state === o.v ? 'text-white shadow-sm' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]')}
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

      {/* Category Rail */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2.15} className="relative z-[90] mb-3 sm:mb-4">
        <CategoryChipsRail isAr={isAr} allCategories={allCategories} filterCategory={filterCategory} setFilterCategory={setFilterCategory} showArchived={showArchived} store={store} toast={toast} />
      </motion.div>

      {/* Archive Mode Banner */}
      {showArchived && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center gap-4 rounded-2xl border-2 border-amber-500/25 bg-amber-500/[0.06] px-5 py-4">
          <div className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center bg-amber-500/15"><Archive className="h-6 w-6 text-amber-600" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-amber-700 dark:text-amber-400">{isAr ? 'وضع الأرشيف' : 'Archive Mode'}</p>
            <p className="text-sm font-semibold text-amber-600/70 dark:text-amber-400/60 mt-0.5">
              {isAr ? `${store.habits.filter(h => h.archived).length} عادة مؤرشفة — يمكنك استعادتها أو حذفها نهائياً` : `${store.habits.filter(h => h.archived).length} archived habits — restore or permanently delete`}
            </p>
          </div>
          <button onClick={() => setShowArchived(false)} className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-400 border-2 border-amber-500/25 hover:bg-amber-500/15 transition-all">
            <X className="h-4 w-4" />{isAr ? 'خروج من الأرشيف' : 'Exit Archive'}
          </button>
        </motion.div>
      )}

      {/* Habits Grid */}
      {(() => {
        const habitGrid = (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {filteredHabits.map((habit, i) => (
              <SortableItem key={habit.id} id={habit.id} disabled={!isDragMode}>
                <HabitCompactRow habit={habit} index={i} isAr={isAr} store={store} today={today}
                  onEdit={() => openEdit(habit)} onArchive={() => store.toggleHabitArchive(habit.id)} onDelete={() => store.deleteHabit(habit.id)} onDetail={() => setDetailHabit(habit)} onViewPage={`/app/habits/${habit.id}`} />
              </SortableItem>
            ))}
          </div>
        );
        return isDragMode ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <GripVertical className="h-4 w-4 text-[var(--foreground)]" />
              <span className="text-xs font-medium text-[var(--foreground)]">{isAr ? 'اسحب العادات لإعادة ترتيبها' : 'Drag habits to reorder them'}</span>
            </div>
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredHabits.map(h => h.id)} strategy={rectSortingStrategy}>
                {habitGrid}
              </SortableContext>
            </DndContext>
          </>
        ) : habitGrid;
      })()}

      {/* Empty State */}
      {filteredHabits.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--foreground)]/[0.05]">
            <Target className="h-6 w-6 text-[var(--foreground)]" />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">
            {showArchived ? (isAr ? 'لا توجد عادات مؤرشفة' : 'No archived habits')
              : searchQuery ? (isAr ? 'لا توجد عادات تطابق البحث' : 'No habits match your search')
              : filterCategory !== 'all' ? (isAr ? 'لا توجد عادات في هذه الفئة' : 'No habits in this category')
              : (isAr ? 'لا توجد عادات بعد' : 'No habits yet')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {searchQuery && <button onClick={() => setSearchQuery('')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--foreground)] border border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05]"><X className="h-3 w-3" /> {isAr ? 'مسح البحث' : 'Clear Search'}</button>}
            {filterCategory !== 'all' && <button onClick={() => setFilterCategory('all')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--foreground)] border border-[var(--foreground)]/[0.18] hover:bg-[var(--foreground)]/[0.05]"><Filter className="h-3 w-3" /> {isAr ? 'كل الفئات' : 'All Categories'}</button>}
            {!showArchived && <button onClick={() => { resetForm(); setShowForm(true); }} className="app-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة عادة' : 'Add Habit'}</button>}
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
