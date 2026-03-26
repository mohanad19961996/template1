'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  Habit, HabitLog, HABIT_CATEGORIES, HabitCategory, HabitFrequency,
  HabitType, Priority, Difficulty, todayString, generateId, ITEM_COLORS,
  WeekDay, formatDuration,
} from '@/types/app';
import {
  Plus, CheckCircle2, Circle, Flame, Filter, Search, X, Archive,
  MoreHorizontal, Trash2, Edit3, Eye, ChevronDown, Calendar as CalendarIcon,
  TrendingUp, Target, Clock, Star, BarChart3,
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

export default function HabitsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

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
  });

  const resetForm = () => {
    setFormData({
      nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
      category: 'health', frequency: 'daily', customDays: [],
      priority: 'medium', difficulty: 'medium', color: ITEM_COLORS[0],
      icon: 'Activity', type: 'positive', reminderEnabled: false, reminderTime: '08:00',
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
    });
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.nameEn && !formData.nameAr) return;
    if (editingHabit) {
      store.updateHabit(editingHabit.id, { ...formData });
    } else {
      store.addHabit({ ...formData });
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
          <p className="text-sm text-[var(--foreground)]/50 mt-1">
            {isAr
              ? `${completedTodayCount} من ${activeHabitsCount} مكتملة اليوم`
              : `${completedTodayCount} of ${activeHabitsCount} completed today`}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="h-4 w-4" /> {isAr ? 'عادة جديدة' : 'New Habit'}
        </button>
      </motion.div>

      {/* Stats Bar */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-3 gap-3 mb-6">
        {[
          { labelEn: 'Active', labelAr: 'نشطة', value: activeHabitsCount, icon: Target, color: 'text-blue-500 bg-blue-500/10' },
          { labelEn: 'Today', labelAr: 'اليوم', value: `${completedTodayCount}/${activeHabitsCount}`, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
          { labelEn: 'Archived', labelAr: 'مؤرشفة', value: store.habits.filter(h => h.archived).length, icon: Archive, color: 'text-amber-500 bg-amber-500/10' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] p-3 flex items-center gap-3">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', s.color.split(' ')[1])}>
              <s.icon className={cn('h-4 w-4', s.color.split(' ')[0])} />
            </div>
            <div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-[var(--foreground)]/40">{isAr ? s.labelAr : s.labelEn}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="flex flex-wrap gap-2 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث...' : 'Search...'}
            className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent ps-9 pe-3 py-2 text-sm placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-[var(--color-primary)]/40"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]/40"
        >
          <option value="all">{isAr ? 'كل الفئات' : 'All Categories'}</option>
          {HABIT_CATEGORIES.map(c => (
            <option key={c} value={c}>{isAr ? CATEGORY_LABELS[c]?.ar : CATEGORY_LABELS[c]?.en}</option>
          ))}
        </select>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={cn(
            'rounded-xl border px-3 py-2 text-sm transition-all',
            showArchived
              ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'border-[var(--foreground)]/[0.08] text-[var(--foreground)]/50'
          )}
        >
          <Archive className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Habits Grid */}
      <motion.div initial="hidden" animate="visible" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredHabits.map((habit, i) => {
            const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
            const streak = store.getHabitStreak(habit.id);
            const stats = store.getHabitStats(habit.id);

            return (
              <motion.div
                key={habit.id}
                variants={fadeUp}
                custom={i + 3}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  'group rounded-2xl border bg-[var(--foreground)]/[0.02] overflow-hidden transition-all duration-300 hover:shadow-md',
                  done ? 'border-emerald-500/20' : 'border-[var(--foreground)]/[0.06] hover:border-[var(--foreground)]/[0.12]'
                )}
              >
                {/* Color accent */}
                <div className="h-1 w-full" style={{ backgroundColor: habit.color }} />

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => {
                        if (!done && !habit.archived) {
                          store.logHabit({
                            habitId: habit.id, date: today,
                            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                            note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: true,
                          });
                        }
                      }}
                      className="mt-0.5 shrink-0"
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-[var(--foreground)]/20 hover:text-[var(--color-primary)] transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn('text-sm font-semibold truncate', done && 'line-through text-[var(--foreground)]/40')}>
                          {isAr ? habit.nameAr : habit.nameEn}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50">
                          {isAr ? CATEGORY_LABELS[habit.category]?.ar : CATEGORY_LABELS[habit.category]?.en}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50">
                          {isAr ? FREQ_LABELS[habit.frequency]?.ar : FREQ_LABELS[habit.frequency]?.en}
                        </span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-md font-medium',
                          habit.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                          habit.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-blue-500/10 text-blue-500'
                        )}>
                          {isAr
                            ? (habit.priority === 'high' ? 'عالية' : habit.priority === 'medium' ? 'متوسطة' : 'منخفضة')
                            : habit.priority}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(habit)} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                        <Edit3 className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
                      </button>
                      <button onClick={() => store.toggleHabitArchive(habit.id)} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                        <Archive className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
                      </button>
                      <button onClick={() => setDetailHabit(habit)} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                        <Eye className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-1 pt-3 border-t border-[var(--foreground)]/[0.04]">
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-400" />
                      <span className="text-[10px] font-medium">{streak.current}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] font-medium">{streak.best}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3 text-blue-400" />
                      <span className="text-[10px] font-medium">{stats.completionRate}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] font-medium">{stats.totalCompletions}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredHabits.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--foreground)]/[0.04]">
            <Target className="h-8 w-8 text-[var(--foreground)]/20" />
          </div>
          <p className="text-sm text-[var(--foreground)]/40 mb-4">
            {showArchived
              ? (isAr ? 'لا توجد عادات مؤرشفة' : 'No archived habits')
              : (isAr ? 'لا توجد عادات بعد. أنشئ عادتك الأولى!' : 'No habits yet. Create your first one!')}
          </p>
          {!showArchived && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> {isAr ? 'إضافة عادة' : 'Add Habit'}
            </button>
          )}
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); resetForm(); }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 top-[5%] sm:top-[10%] z-[var(--z-modal)] sm:w-[540px] max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--background)] border border-[var(--foreground)]/[0.08] shadow-2xl"
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-[var(--background)] flex items-center justify-between p-5 border-b border-[var(--foreground)]/[0.06]">
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
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">
                      {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
                    </label>
                    <input
                      dir="rtl"
                      value={formData.nameAr}
                      onChange={e => setFormData(f => ({ ...f, nameAr: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40"
                      placeholder="مثال: شرب الماء"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">
                      {isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}
                    </label>
                    <input
                      dir="ltr"
                      value={formData.nameEn}
                      onChange={e => setFormData(f => ({ ...f, nameEn: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40"
                      placeholder="e.g., Drink Water"
                    />
                  </div>
                </div>

                {/* Category & Frequency */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">
                      {isAr ? 'الفئة' : 'Category'}
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData(f => ({ ...f, category: e.target.value as HabitCategory }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40"
                    >
                      {HABIT_CATEGORIES.map(c => (
                        <option key={c} value={c}>{isAr ? CATEGORY_LABELS[c]?.ar : CATEGORY_LABELS[c]?.en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">
                      {isAr ? 'التكرار' : 'Frequency'}
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={e => setFormData(f => ({ ...f, frequency: e.target.value as HabitFrequency }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40"
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
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">
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
                            'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                            formData.customDays.includes(d as WeekDay)
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.08]'
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
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">
                      {isAr ? 'الأولوية' : 'Priority'}
                    </label>
                    <div className="flex gap-1.5">
                      {(['low', 'medium', 'high'] as Priority[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setFormData(f => ({ ...f, priority: p }))}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                            formData.priority === p
                              ? (p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white')
                              : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50'
                          )}
                        >
                          {isAr ? (p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة') : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">
                      {isAr ? 'الصعوبة' : 'Difficulty'}
                    </label>
                    <div className="flex gap-1.5">
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                        <button
                          key={d}
                          onClick={() => setFormData(f => ({ ...f, difficulty: d }))}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                            formData.difficulty === d
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50'
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
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">
                    {isAr ? 'النوع' : 'Type'}
                  </label>
                  <div className="flex gap-2">
                    {(['positive', 'avoidance'] as HabitType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setFormData(f => ({ ...f, type: t }))}
                        className={cn(
                          'flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border',
                          formData.type === t
                            ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'border-[var(--foreground)]/[0.08] text-[var(--foreground)]/50'
                        )}
                      >
                        {isAr ? (t === 'positive' ? '✓ عادة إيجابية' : '✗ عادة للتجنب') : (t === 'positive' ? '✓ Build' : '✗ Break')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">
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
              </div>

              {/* Modal footer */}
              <div className="sticky bottom-0 bg-[var(--background)] flex items-center justify-end gap-3 p-5 border-t border-[var(--foreground)]/[0.06]">
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
                  className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-sm font-medium text-white hover:opacity-90 transition-opacity"
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
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 top-[5%] sm:top-[10%] z-[var(--z-modal)] sm:w-[540px] max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--background)] border border-[var(--foreground)]/[0.08] shadow-2xl"
            >
              <HabitDetail habit={detailHabit} onClose={() => setDetailHabit(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function HabitDetail({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const stats = store.getHabitStats(habit.id);
  const streak = store.getHabitStreak(habit.id);

  // Last 30 days heatmap
  const last30 = useMemo(() => {
    const days: { date: string; completed: boolean }[] = [];
    const d = new Date();
    for (let i = 29; i >= 0; i--) {
      const dt = new Date(d);
      dt.setDate(dt.getDate() - i);
      const dateStr = dt.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        completed: store.habitLogs.some(l => l.habitId === habit.id && l.date === dateStr && l.completed),
      });
    }
    return days;
  }, [habit.id, store.habitLogs]);

  return (
    <div>
      <div className="p-5 border-b border-[var(--foreground)]/[0.06]">
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
            <div key={i} className="rounded-xl bg-[var(--foreground)]/[0.03] p-3 text-center">
              <s.icon className={cn('h-4 w-4 mx-auto mb-1', s.color)} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-[var(--foreground)]/40">{isAr ? s.labelAr : s.labelEn}</p>
            </div>
          ))}
        </div>

        {/* 30-day heatmap */}
        <div>
          <h3 className="text-xs font-medium text-[var(--foreground)]/50 mb-2">
            {isAr ? 'آخر 30 يوم' : 'Last 30 Days'}
          </h3>
          <div className="flex gap-1 flex-wrap">
            {last30.map(day => (
              <div
                key={day.date}
                title={day.date}
                className={cn(
                  'h-5 w-5 rounded-sm transition-colors',
                  day.completed ? 'bg-emerald-500' : 'bg-[var(--foreground)]/[0.06]'
                )}
              />
            ))}
          </div>
        </div>

        {/* Weekday performance */}
        <div>
          <h3 className="text-xs font-medium text-[var(--foreground)]/50 mb-2">
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
          <p className="text-xs text-[var(--foreground)]/60">
            {isAr
              ? `🏆 أفضل يوم لك هو ${stats.bestDay} — أضعف يوم هو ${stats.worstDay}`
              : `🏆 Your best day is ${stats.bestDay} — weakest is ${stats.worstDay}`}
          </p>
        </div>
      </div>
    </div>
  );
}
