'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  Habit, HabitCategory, HabitFrequency, HabitType, HabitTrackingType,
  Priority, Difficulty, WeekDay, CustomScheduleType,
  ITEM_COLORS, generateId, formatDurationSecs,
} from '@/types/app';
import {
  CATEGORY_LABELS, FREQ_LABELS, DAY_LABELS, MONTH_LABELS, CUSTOM_SCHEDULE_LABELS,
} from '@/components/habits/habit-constants';
import CategoryPicker from '@/components/habits/category-picker';
import {
  Plus, X, Archive, Edit3, Clock, Target, Activity,
  Palette, Trophy, Hash, Repeat, Gift, Lightbulb, MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react';

// ── Form data shape (mirrors the parent useState) ──
export type HabitFormData = {
  nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  customDays: WeekDay[];
  customScheduleType: CustomScheduleType;
  customMonthDays: number[];
  customYearDays: { month: number; day: number }[];
  priority: Priority;
  difficulty: Difficulty;
  color: string;
  icon: string;
  type: HabitType;
  trackingType: HabitTrackingType;
  targetValue: number;
  targetUnit: string;
  checklistItems: { id: string; titleEn: string; titleAr: string }[];
  newChecklistItem: string;
  scheduleType: 'daily' | 'weekly' | 'custom';
  weeklyTarget: number;
  allowPartial: boolean;
  allowSkip: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  image: string;
  cueEn: string; cueAr: string; routineEn: string; routineAr: string; rewardEn: string; rewardAr: string;
  placeEn: string; placeAr: string; preferredTime: string; expectedDuration: string | number;
  windowStart: string; windowEnd: string; strictWindow: boolean; maxDailyReps: string | number;
  completionWindowStart: string; completionWindowEnd: string;
  orderNumber: string | number; colSpan: number; rowSpan: number; endDate: string;
  streakGoal: string | number; streakRewardEn: string; streakRewardAr: string;
  streakGoal2: string | number; streakRewardEn2: string; streakRewardAr2: string;
  streakGoal3: string | number; streakRewardEn3: string; streakRewardAr3: string;
  notes: string;
  goalReps: string | number;
  goalHours: string | number;
};

export interface HabitFormModalProps {
  isAr: boolean;
  showForm: boolean;
  editingHabit: Habit | null;
  formData: HabitFormData;
  setFormData: React.Dispatch<React.SetStateAction<HabitFormData>>;
  allCategories: string[];
  store: ReturnType<typeof useAppStore>;
  onClose: () => void;
  onSave: () => void;
}

export default function HabitFormModal({
  isAr, showForm, editingHabit, formData, setFormData,
  allCategories, store, onClose, onSave,
}: HabitFormModalProps) {
  return (
    <AnimatePresence>
      {showForm && (
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
            className="fixed inset-x-2 sm:inset-x-4 top-[2%] sm:top-[10%] z-[var(--z-modal)] sm:w-[540px] sm:inset-x-0 sm:mx-auto max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.18] shadow-2xl"
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-[var(--color-background)] flex items-center justify-between p-5 border-b border-[var(--foreground)]/[0.1]">
              <h2 className="text-lg font-semibold">
                {editingHabit
                  ? (isAr ? 'تعديل العادة' : 'Edit Habit')
                  : (isAr ? 'عادة جديدة' : 'New Habit')}
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
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
                  <CategoryPicker isAr={isAr} allCategories={allCategories} value={formData.category} onChange={(cat) => setFormData(f => ({ ...f, category: cat as HabitCategory }))} store={store} />
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

              {/* Monthly — day of month picker (1-31 grid) */}
              {formData.frequency === 'monthly' && (
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                    {isAr ? 'اختر أيام الشهر' : 'Pick days of the month'}
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <button
                        key={d}
                        type="button"
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
                    <p className="text-[10px] text-[var(--foreground)]/50 mt-1.5">
                      {isAr ? 'المحدد: ' : 'Selected: '}{formData.customMonthDays.join(', ')}
                    </p>
                  )}
                  {formData.customMonthDays.length === 0 && (
                    <p className="text-[10px] text-amber-500 mt-1.5">
                      {isAr ? 'لم تحدد أي يوم — ستظهر في اليوم الأول من كل شهر' : 'No days selected — defaults to 1st of each month'}
                    </p>
                  )}
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

                {/* Timer settings — H:M:S */}
                {formData.trackingType === 'timer' && (() => {
                  const totalSecs = Number(formData.expectedDuration) || 0;
                  const dH = Math.floor(totalSecs / 3600);
                  const dM = Math.floor((totalSecs % 3600) / 60);
                  const dS = Math.floor(totalSecs % 60);
                  const setHMS = (h: number, m: number, s: number) => setFormData(f => ({ ...f, expectedDuration: h * 3600 + m * 60 + s }));
                  return (
                  <div className="p-3 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.15]">
                    <label className="text-[10px] font-semibold text-[var(--foreground)] uppercase tracking-wider mb-1 block">
                      {isAr ? 'المدة المطلوبة' : 'Target Duration'}
                    </label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {[5, 10, 15, 20, 25, 30, 45, 60, 90].map(m => (
                        <button key={m} type="button"
                          onClick={() => setFormData(f => ({ ...f, expectedDuration: m * 60 }))}
                          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            totalSecs === m * 60
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]')}>
                          {m}m
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-medium text-[var(--foreground)]/60 mb-0.5 block">{isAr ? 'ساعات' : 'Hours'}</label>
                        <input type="number" min={0} max={23} value={dH}
                          onChange={e => setHMS(Math.max(0, Math.min(23, Number(e.target.value) || 0)), dM, dS)}
                          className="w-full rounded-lg app-input px-3 py-2 text-sm text-center" />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-[var(--foreground)]/60 mb-0.5 block">{isAr ? 'دقائق' : 'Minutes'}</label>
                        <input type="number" min={0} max={59} value={dM}
                          onChange={e => setHMS(dH, Math.max(0, Math.min(59, Number(e.target.value) || 0)), dS)}
                          className="w-full rounded-lg app-input px-3 py-2 text-sm text-center" />
                      </div>
                      <div>
                        <label className="text-[9px] font-medium text-[var(--foreground)]/60 mb-0.5 block">{isAr ? 'ثواني' : 'Seconds'}</label>
                        <input type="number" min={0} max={59} value={dS}
                          onChange={e => setHMS(dH, dM, Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                          className="w-full rounded-lg app-input px-3 py-2 text-sm text-center" />
                      </div>
                    </div>
                    {totalSecs > 0 && (
                      <p className="text-[10px] font-bold text-[var(--color-primary)] mt-1.5 text-center">{formatDurationSecs(totalSecs)}</p>
                    )}
                  </div>
                  );
                })()}

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
                              <span className="text-xs">&times;</span>
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
                      {isAr ? (t === 'positive' ? '\u2713 عادة إيجابية' : '\u2717 عادة للتجنب') : (t === 'positive' ? '\u2713 Build' : '\u2717 Break')}
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
                  {(() => {
                    const ctxSecs = Number(formData.expectedDuration) || 0;
                    const ctxH = Math.floor(ctxSecs / 3600);
                    const ctxM = Math.floor((ctxSecs % 3600) / 60);
                    const ctxS = Math.floor(ctxSecs % 60);
                    const setCtxHMS = (h: number, m: number, s: number) => setFormData(f => ({ ...f, expectedDuration: h * 3600 + m * 60 + s }));
                    return (
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">
                        {isAr ? 'المدة المتوقعة' : 'Expected Duration'}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <input type="number" min={0} max={23} value={ctxH || ''}
                          onChange={e => setCtxHMS(Math.max(0, Math.min(23, Number(e.target.value) || 0)), ctxM, ctxS)}
                          className="app-input w-full rounded-xl bg-transparent px-2 py-2.5 text-sm text-center"
                          placeholder={isAr ? 'س' : 'H'} />
                        <input type="number" min={0} max={59} value={ctxM || ''}
                          onChange={e => setCtxHMS(ctxH, Math.max(0, Math.min(59, Number(e.target.value) || 0)), ctxS)}
                          className="app-input w-full rounded-xl bg-transparent px-2 py-2.5 text-sm text-center"
                          placeholder={isAr ? 'د' : 'M'} />
                        <input type="number" min={0} max={59} value={ctxS || ''}
                          onChange={e => setCtxHMS(ctxH, ctxM, Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                          className="app-input w-full rounded-xl bg-transparent px-2 py-2.5 text-sm text-center"
                          placeholder={isAr ? 'ث' : 'S'} />
                      </div>
                      {ctxSecs > 0 && <p className="text-[9px] font-bold text-[var(--color-primary)] mt-0.5">{formatDurationSecs(ctxSecs)}</p>}
                    </div>
                    );
                  })()}
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

              {/* ── End Date (goal horizon) ── */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 rounded-md bg-[var(--color-primary)]/10 flex items-center justify-center"><CalendarIcon className="h-3 w-3 text-[var(--color-primary)]" /></div>
                  <span className="text-xs font-bold">{isAr ? 'تاريخ انتهاء العادة' : 'Habit End Date'}</span>
                  <span className="text-[9px] text-[var(--foreground)]/40">{isAr ? '(اختياري)' : '(optional)'}</span>
                </div>
                <p className="text-[10px] text-[var(--foreground)]/40 mb-2">
                  {isAr ? 'الهدف هو الالتزام بهذه العادة حتى هذا التاريخ. لا يؤثر على أي وظيفة — فقط للعرض.' : 'The goal is to maintain this habit until this date. Display only — no effect on functionality.'}
                </p>
                <input type="date" value={formData.endDate} onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full sm:w-64 rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] text-[var(--foreground)] px-3 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none" />
                {formData.endDate && (() => {
                  const diff = Math.ceil((new Date(formData.endDate).getTime() - Date.now()) / 86400000);
                  return (
                    <p className={cn('text-[10px] font-semibold mt-1', diff > 0 ? 'text-[var(--color-primary)]' : 'text-red-500')}>
                      {diff > 0
                        ? (isAr ? `${diff} يوم متبقي` : `${diff} days remaining`)
                        : diff === 0
                          ? (isAr ? 'اليوم هو آخر يوم!' : 'Today is the last day!')
                          : (isAr ? `انتهت قبل ${Math.abs(diff)} يوم` : `Ended ${Math.abs(diff)} days ago`)}
                    </p>
                  );
                })()}
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
                    { tier: 1, icon: '\u{1F949}', label: isAr ? 'المستوى الأول' : 'Tier 1', goalKey: 'streakGoal' as const, rewardEnKey: 'streakRewardEn' as const, rewardArKey: 'streakRewardAr' as const, color: 'text-amber-700 bg-amber-500/10 border-amber-500/20' },
                    { tier: 2, icon: '\u{1F948}', label: isAr ? 'المستوى الثاني' : 'Tier 2', goalKey: 'streakGoal2' as const, rewardEnKey: 'streakRewardEn2' as const, rewardArKey: 'streakRewardAr2' as const, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
                    { tier: 3, icon: '\u{1F947}', label: isAr ? 'المستوى الثالث' : 'Tier 3', goalKey: 'streakGoal3' as const, rewardEnKey: 'streakRewardEn3' as const, rewardArKey: 'streakRewardAr3' as const, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
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
                      store.toggleHabitArchive(editingHabit.id); onClose();
                    }
                  }}
                  className="me-auto text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <Archive className="h-3.5 w-3.5" /> {isAr ? 'أرشفة' : 'Archive'}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05]"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={onSave}
                className="app-btn-primary px-5 py-2 rounded-xl text-sm font-medium text-white"
              >
                {editingHabit ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
