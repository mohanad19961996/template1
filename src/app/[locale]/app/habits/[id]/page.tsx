'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import { Habit, HabitHistoryEntry, HabitLog, HabitTrackingType, todayString, resolveHabitColor, formatDurationSecs } from '@/types/app';
import { getDoneRepCountForDate } from '@/lib/habit-completion';
import {
  isHabitScheduledForDate,
  CATEGORY_LABELS, FREQ_LABELS, to12h,
} from '@/components/habits/habit-constants';
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, Flame, Target, Archive,
  ChevronLeft, ChevronRight, Star, Activity, Eye, Edit3, Play,
  MapPin, Repeat, CheckCircle2, Circle,
  Pencil, Plus, RotateCcw, AlertCircle, Timer, Hash, Send, MessageSquare, ListChecks, ChevronDown, Lightbulb,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/app/toast-notifications';
import { HabitDetail } from '@/components/habits/habit-detail';
import DayDetailsTooltip from '@/components/habits/day-details-tooltip';

// ── Labels ──
const DAY_NAMES = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};
const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const CHANGE_TYPE_LABELS: Record<string, { en: string; ar: string; icon: React.ReactNode; color: string }> = {
  created: { en: 'Created', ar: 'تم الإنشاء', icon: <Plus className="h-3.5 w-3.5" />, color: 'text-emerald-500 bg-emerald-500/10' },
  edited: { en: 'Edited', ar: 'تم التعديل', icon: <Pencil className="h-3.5 w-3.5" />, color: 'text-blue-500 bg-blue-500/10' },
  archived: { en: 'Archived', ar: 'تم الأرشفة', icon: <Archive className="h-3.5 w-3.5" />, color: 'text-amber-500 bg-amber-500/10' },
  restored: { en: 'Restored', ar: 'تم الاستعادة', icon: <RotateCcw className="h-3.5 w-3.5" />, color: 'text-violet-500 bg-violet-500/10' },
};

const FIELD_LABELS: Record<string, { en: string; ar: string }> = {
  nameEn: { en: 'Name (English)', ar: 'الاسم (إنجليزي)' }, nameAr: { en: 'Name (Arabic)', ar: 'الاسم (عربي)' },
  descriptionEn: { en: 'Description (EN)', ar: 'الوصف (إنجليزي)' }, descriptionAr: { en: 'Description (AR)', ar: 'الوصف (عربي)' },
  category: { en: 'Category', ar: 'الفئة' }, frequency: { en: 'Frequency', ar: 'التكرار' },
  priority: { en: 'Priority', ar: 'الأولوية' }, difficulty: { en: 'Difficulty', ar: 'الصعوبة' },
  color: { en: 'Color', ar: 'اللون' }, icon: { en: 'Icon', ar: 'الأيقونة' },
  type: { en: 'Type', ar: 'النوع' }, trackingType: { en: 'Tracking Type', ar: 'نوع التتبع' },
  targetValue: { en: 'Target Value', ar: 'القيمة المستهدفة' }, targetUnit: { en: 'Unit', ar: 'وحدة القياس' },
  scheduleType: { en: 'Schedule', ar: 'الجدول' }, scheduleDays: { en: 'Schedule Days', ar: 'أيام الجدول' },
  archived: { en: 'Archived', ar: 'مؤرشفة' }, image: { en: 'Image', ar: 'الصورة' },
  preferredTime: { en: 'Preferred Time', ar: 'الوقت المفضل' }, expectedDuration: { en: 'Timer Duration', ar: 'مدة المؤقت' },
  placeEn: { en: 'Place', ar: 'المكان' }, placeAr: { en: 'Place (AR)', ar: 'المكان (عربي)' },
  cueEn: { en: 'Cue', ar: 'الإشارة' }, cueAr: { en: 'Cue (AR)', ar: 'الإشارة (عربي)' },
  routineEn: { en: 'Routine', ar: 'الروتين' }, routineAr: { en: 'Routine (AR)', ar: 'الروتين (عربي)' },
  rewardEn: { en: 'Reward', ar: 'المكافأة' }, rewardAr: { en: 'Reward (AR)', ar: 'المكافأة (عربي)' },
  reminderEnabled: { en: 'Reminder', ar: 'التذكير' }, reminderTime: { en: 'Reminder Time', ar: 'وقت التذكير' },
  windowStart: { en: 'Window Start', ar: 'بداية النافذة الزمنية' }, windowEnd: { en: 'Window End', ar: 'نهاية النافذة الزمنية' },
  strictWindow: { en: 'Strict Time Window', ar: 'نافذة زمنية صارمة' },
  completionWindowStart: { en: 'Completion Window Start', ar: 'بداية نافذة الإنجاز' },
  completionWindowEnd: { en: 'Completion Window End', ar: 'نهاية نافذة الإنجاز' },
  allowPartial: { en: 'Allow Partial', ar: 'السماح بالإنجاز الجزئي' }, allowSkip: { en: 'Allow Skip', ar: 'السماح بالتخطي' },
  maxDailyReps: { en: 'Max Daily Reps', ar: 'أقصى تكرارات يومية' },
  customDays: { en: 'Custom Days', ar: 'أيام مخصصة' }, customMonthDays: { en: 'Month Days', ar: 'أيام الشهر' },
  customScheduleType: { en: 'Schedule Type', ar: 'نوع الجدول' },
  endDate: { en: 'End Date', ar: 'تاريخ الانتهاء' },
  streakGoal: { en: 'Streak Goal', ar: 'هدف السلسلة' }, streakRewardEn: { en: 'Streak Reward', ar: 'مكافأة السلسلة' },
  notes: { en: 'Notes', ar: 'ملاحظات' },
  order: { en: 'Display Order', ar: 'ترتيب العرض' },
  goalReps: { en: 'Total Reps Goal', ar: 'هدف التكرارات الإجمالي' },
  goalHours: { en: 'Total Hours Goal', ar: 'هدف الساعات الإجمالي' },
  checklistItems: { en: 'Checklist Items', ar: 'عناصر القائمة' },
};

const TRACKING_LABELS: Record<HabitTrackingType, { en: string; ar: string }> = {
  boolean: { en: 'Yes / No', ar: 'نعم / لا' }, count: { en: 'Count goal', ar: 'هدف عددي' },
  timer: { en: 'Timer session', ar: 'جلسة بمؤقت' }, checklist: { en: 'Checklist', ar: 'قائمة خطوات' },
  duration: { en: 'Duration log', ar: 'تسجيل مدة' },
};

function getEffectiveTrackingType(habit: Habit): HabitTrackingType {
  return habit.trackingType ?? (habit.expectedDuration ? 'timer' : 'boolean');
}
function habitUsesTimerToLog(habit: Habit): boolean {
  return getEffectiveTrackingType(habit) === 'timer';
}
function formatHistoryDisplayValue(field: string, val: unknown, isAr?: boolean): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? (isAr ? 'نعم ✓' : 'Yes ✓') : (isAr ? 'لا ✗' : 'No ✗');
  // Duration fields (seconds)
  if ((field === 'expectedDuration' || field === 'targetDuration') && typeof val === 'number' && val > 0) return formatDurationSecs(val);
  // Target value — if large number, might be seconds
  if (field === 'targetValue' && typeof val === 'number' && val >= 60) return formatDurationSecs(val);
  // Unit labels
  if (field === 'targetUnit' && typeof val === 'string') {
    const unitLabels: Record<string, string> = { times: isAr ? 'مرات' : 'times', cups: isAr ? 'أكواب' : 'cups', pages: isAr ? 'صفحات' : 'pages', minutes: isAr ? 'دقائق' : 'minutes', steps: isAr ? 'خطوات' : 'steps', reps: isAr ? 'تكرارات' : 'reps' };
    return unitLabels[val] || val;
  }
  // Frequency
  if (field === 'frequency' && typeof val === 'string') {
    const freqMap: Record<string, string> = { daily: isAr ? 'يومي' : 'Daily', weekly: isAr ? 'أسبوعي' : 'Weekly', monthly: isAr ? 'شهري' : 'Monthly', custom: isAr ? 'مخصص' : 'Custom' };
    return freqMap[val] || val;
  }
  // Priority / Difficulty
  if ((field === 'priority' || field === 'difficulty') && typeof val === 'string') {
    const levelMap: Record<string, string> = { low: isAr ? 'منخفض' : 'Low', medium: isAr ? 'متوسط' : 'Medium', high: isAr ? 'مرتفع' : 'High', easy: isAr ? 'سهل' : 'Easy', hard: isAr ? 'صعب' : 'Hard' };
    return levelMap[val] || val;
  }
  // Type
  if (field === 'type' && typeof val === 'string') {
    return val === 'positive' ? (isAr ? 'إيجابية (بناء)' : 'Positive (Build)') : (isAr ? 'تجنب (كسر)' : 'Avoidance (Break)');
  }
  // Tracking type
  if (field === 'trackingType' && typeof val === 'string') {
    const ttMap: Record<string, string> = { boolean: isAr ? 'نعم/لا' : 'Yes/No', count: isAr ? 'عداد' : 'Count', timer: isAr ? 'مؤقت' : 'Timer', checklist: isAr ? 'قائمة' : 'Checklist', duration: isAr ? 'مدة' : 'Duration' };
    return ttMap[val] || val;
  }
  if (typeof val === 'string' && val.length > 48) return val.slice(0, 48) + '...';
  if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : '—';
  return String(val);
}

// ── Shared styles ──
const cardBase = 'rounded-2xl border-2 border-[var(--color-primary)]/30 bg-[var(--color-background)]';
const btnBase = 'rounded-xl flex items-center justify-center border border-[rgba(var(--color-primary-rgb)/0.2)] transition-all duration-200 hover:bg-[rgba(var(--color-primary-rgb)/0.08)] hover:border-[rgba(var(--color-primary-rgb)/0.35)]';
const badge = 'text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg border';

const EVENT_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  start: { en: 'Started', ar: 'بدأ', color: 'text-blue-500 bg-blue-500/10' },
  pause: { en: 'Paused', ar: 'توقف', color: 'text-amber-500 bg-amber-500/10' },
  resume: { en: 'Resumed', ar: 'استئناف', color: 'text-sky-500 bg-sky-500/10' },
  finish: { en: 'Completed', ar: 'اكتمل', color: 'text-emerald-500 bg-emerald-500/10' },
  cancel: { en: 'Cancelled', ar: 'ألغي', color: 'text-red-400 bg-red-400/10' },
};

// ══════════════════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════════════════
export default function HabitDetailPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const params = useParams();
  const searchParams = useSearchParams();
  const habitId = params.id as string;
  const store = useAppStore();
  const today = todayString();
  const toast = useToast();
  const habit = store.habits.find(h => h.id === habitId);

  const [history, setHistory] = useState<HabitHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [calMonth, setCalMonth] = useState(() => {
    const viewDate = searchParams.get('viewDate');
    if (viewDate) { const [y, m] = viewDate.split('-').map(Number); return { year: y, month: m - 1 }; }
    const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewingDate, setViewingDate] = useState(() => searchParams.get('viewDate') || today);
  const [dailyNote, setDailyNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Fetch history
  useEffect(() => {
    if (!habitId) return;
    setLoadingHistory(true);
    fetch(`/api/habits/${habitId}/history`)
      .then(r => r.json()).then(data => { if (data.data) setHistory(data.data); })
      .catch(() => {}).finally(() => setLoadingHistory(false));
  }, [habitId]);

  // Deduplicated logs — for timer logs, ignore time field (can differ by minutes between start/end)
  // Sort completed=true first so dedup keeps completed version over incomplete
  const habitLogs = useMemo(() => {
    const raw = store.habitLogs.filter(l => l.habitId === habitId);
    const sorted = [...raw].sort((a, b) => (b.completed ? 1 : 0) - (a.completed ? 1 : 0));
    const seen = new Set<string>();
    return sorted.filter(l => {
      const isTimer = l.source === 'timer';
      const key = isTimer
        ? `${l.date}|${l.duration ?? 0}|timer`
        : `${l.date}|${l.time}|${l.duration ?? 0}|${l.completed}|${l.source ?? ''}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    });
  }, [store.habitLogs, habitId]);

  const logsByDate = useMemo(() => {
    const map: Record<string, HabitLog[]> = {};
    habitLogs.forEach(l => { if (!map[l.date]) map[l.date] = []; map[l.date].push(l); });
    return map;
  }, [habitLogs]);

  const historyByDate = useMemo(() => {
    const map: Record<string, HabitHistoryEntry[]> = {};
    history.forEach(h => { if (!map[h.date]) map[h.date] = []; map[h.date].push(h); });
    return map;
  }, [history]);

  // Stats
  const streak = store.getHabitStreak(habitId);
  const stats = store.getHabitStats(habitId);

  const isViewingToday = viewingDate === today;
  const viewingDateDone = habitLogs.some(l => l.date === viewingDate && l.completed);
  const viewingDateLog = habitLogs.find(l => l.date === viewingDate);
  const viewingDateLogs = logsByDate[viewingDate] || [];
  const viewingDateHistory = historyByDate[viewingDate] || [];

  const noteSeedForViewingDate = viewingDateLog?.note ?? '';
  useEffect(() => { setDailyNote(noteSeedForViewingDate); }, [viewingDate, noteSeedForViewingDate]);

  const navigateDay = (dir: -1 | 1) => {
    const d = new Date(viewingDate + 'T00:00:00');
    d.setDate(d.getDate() + dir);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (next > today) return;
    setViewingDate(next);
  };

  const formatViewingDate = (dateStr: string) => {
    if (dateStr === today) return isAr ? 'اليوم' : 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(isAr ? 'ar-u-nu-latn' : 'en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSaveNote = () => {
    if (!habit) return;
    setSavingNote(true);
    if (viewingDateLog) {
      store.logHabit({ habitId: habit.id, date: viewingDate, time: viewingDateLog.time, note: dailyNote,
        reminderUsed: viewingDateLog.reminderUsed, perceivedDifficulty: viewingDateLog.perceivedDifficulty,
        completed: viewingDateLog.completed, status: viewingDateLog.status, source: viewingDateLog.source,
        duration: viewingDateLog.duration, moodBefore: viewingDateLog.moodBefore, moodAfter: viewingDateLog.moodAfter });
    } else {
      store.logHabit({ habitId: habit.id, date: viewingDate,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        note: dailyNote, reminderUsed: false, perceivedDifficulty: habit.difficulty || 'medium',
        completed: false, status: 'pending', source: 'manual' });
    }
    setTimeout(() => setSavingNote(false), 500);
  };

  const handleToggleDay = () => {
    if (!habit) return;
    if (viewingDateDone) {
      toast.notifyInfo(isAr ? 'لا يمكن التراجع' : 'Cannot undo', isAr ? 'العادة مكتملة — الالتزام يعني عدم التراجع!' : 'Habit is done — commitment means no going back!');
      return;
    }
    if (!isViewingToday) {
      toast.notifyWarning(isAr ? 'اليوم فقط' : 'Today only', isAr ? 'يمكنك تسجيل الإنجاز في نفس اليوم فقط' : 'You can only mark habits done on the same day');
      return;
    }
    if (habitUsesTimerToLog(habit)) return;
    store.logHabit({ habitId: habit.id, date: viewingDate,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      note: dailyNote, reminderUsed: false, perceivedDifficulty: habit.difficulty || 'medium', completed: true });
  };

  // ── Not found ──
  if (!habit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-[var(--foreground)]/30 mx-auto" />
          <p className="text-lg font-semibold text-[var(--foreground)]/60">{isAr ? 'العادة غير موجودة' : 'Habit not found'}</p>
          <Link href="/app/habits" className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline">
            <ArrowLeft className="h-4 w-4" /> {isAr ? 'العودة للعادات' : 'Back to Habits'}
          </Link>
        </div>
      </div>
    );
  }

  const name = isAr ? habit.nameAr : habit.nameEn;
  const description = isAr ? habit.descriptionAr : habit.descriptionEn;
  const catLabel = isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category);
  const freqLabel = isAr ? (FREQ_LABELS[habit.frequency]?.ar ?? habit.frequency) : (FREQ_LABELS[habit.frequency]?.en ?? habit.frequency);
  const effectiveTracking = getEffectiveTrackingType(habit);
  const trackingLabel = isAr ? TRACKING_LABELS[effectiveTracking].ar : TRACKING_LABELS[effectiveTracking].en;
  const hc = resolveHabitColor(habit.color);

  const DAY_ABBRS = isAr
    ? ['أ', 'إ', 'ث', 'أر', 'خ', 'ج', 'س']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
    new Date(2026, i).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'long' })
  );

  const createdDateStr = habit.createdAt.split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">

      {/* ═══ 1. Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        <Link href="/app/habits" className={cn(btnBase, 'shrink-0 h-10 w-10')}>
          <ArrowLeft className="h-[18px] w-[18px] text-[var(--foreground)]/70 rtl:rotate-180" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-full shrink-0 ring-2 ring-white/30 shadow" style={{ background: hc }} />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={cn(badge, 'bg-[rgba(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)] border-[rgba(var(--color-primary-rgb)/0.2)]')}>{catLabel}</span>
            <span className={cn(badge, 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/60 border-[var(--foreground)]/[0.1]')}>{freqLabel}</span>
            <span className={cn(badge, 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50 border-[var(--foreground)]/[0.08]')}>{trackingLabel}</span>
            {habit.archived && <span className={cn(badge, 'bg-amber-500/10 text-amber-600 border-amber-500/20')}>{isAr ? 'مؤرشفة' : 'Archived'}</span>}
          </div>
        </div>
      </motion.div>

      {/* ═══ 2. Action buttons + Stats ═══ */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/app/habits?openHabit=${habit.id}`}
          className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--color-primary)]/25 px-3 py-2 text-[12px] font-bold text-[var(--foreground)]/60 transition-all duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md active:scale-95">
          <Edit3 className="h-3.5 w-3.5" /> {isAr ? 'تعديل' : 'Edit'}
        </Link>
        {effectiveTracking === 'timer' && (
          <Link href={`/app/timers?habitId=${habit.id}`}
            className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--color-primary)]/25 px-3 py-2 text-[12px] font-bold text-[var(--foreground)]/60 transition-all duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md active:scale-95">
            <Play className="h-3.5 w-3.5" /> {isAr ? 'بدء المؤقت' : 'Start Timer'}
          </Link>
        )}
        <button type="button" onClick={() => { store.toggleHabitArchive(habit.id); toast.notifySuccess(isAr ? (habit.archived ? 'تم الاستعادة' : 'تم الأرشفة') : (habit.archived ? 'Restored' : 'Archived')); }}
          className="flex items-center gap-1.5 rounded-xl border-2 border-amber-500/25 px-3 py-2 text-[12px] font-bold text-amber-600 transition-all duration-200 hover:border-amber-500 hover:bg-amber-500 hover:text-white hover:shadow-md active:scale-95">
          <Archive className="h-3.5 w-3.5" /> {habit.archived ? (isAr ? 'استعادة' : 'Restore') : (isAr ? 'أرشفة' : 'Archive')}
        </button>
        <div className="flex-1" />
        {/* Inline stats */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-500" /><b>{streak.current}</b> {isAr ? 'يوم' : 'days'}</span>
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-500" /><b>{streak.best}</b> {isAr ? 'أفضل' : 'best'}</span>
          <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5 text-emerald-500" /><b>{stats.completionRate}%</b></span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-primary)]" /><b>{stats.totalCompletions}</b></span>
        </div>
      </div>

      {/* ═══ 3. Year Calendar ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className={cn(cardBase, 'p-4 sm:p-6')}>
        {/* Year selector */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCalYear(y => y - 1)} className={cn(btnBase, 'h-9 w-9')}>
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </button>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: hc }}>{calYear}</h2>
          <button onClick={() => setCalYear(y => y + 1)}
            disabled={calYear >= new Date().getFullYear()}
            className={cn(btnBase, 'h-9 w-9', calYear >= new Date().getFullYear() && 'opacity-30')}>
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>

        {/* Legend + hint */}
        <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm bg-emerald-500" /><span className="text-xs font-semibold text-[var(--foreground)]/60">{isAr ? 'مكتمل' : 'Done'}</span></div>
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm bg-amber-500" /><span className="text-xs font-semibold text-[var(--foreground)]/60">{isAr ? 'متأخر' : 'Late'}</span></div>
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm bg-red-500" /><span className="text-xs font-semibold text-[var(--foreground)]/60">{isAr ? 'فائت' : 'Missed'}</span></div>
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm bg-gray-300 dark:bg-gray-600" /><span className="text-xs font-semibold text-[var(--foreground)]/60">{isAr ? 'قادم' : 'Upcoming'}</span></div>
          <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm bg-red-500/15 text-red-400 text-[7px] font-black flex items-center justify-center">✕</div><span className="text-xs font-semibold text-[var(--foreground)]/60">{isAr ? 'غير مجدول' : 'N/A'}</span></div>
          <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-violet-500" /><span className="text-xs font-semibold text-[var(--foreground)]/60">{isAr ? 'تم تعديل الإعدادات' : 'Settings edited'}</span></div>
        </div>
        <p className="text-center text-sm text-[var(--color-primary)] font-bold mb-4">
          {isAr ? '📅 اضغط على أي يوم لعرض تفاصيل الجلسة والإنجاز' : '📅 Click any day to view session details'}
        </p>

        {/* 12-month grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, mi) => {
            const daysInMonth = new Date(calYear, mi + 1, 0).getDate();
            const firstDow = new Date(calYear, mi, 1).getDay();
            const monthName = MONTH_NAMES[mi];
            return (
              <div key={mi} className="rounded-xl p-3 transition-all"
                style={{ border: `1.5px solid ${hc}20`, background: `${hc}04` }}>
                <p className="text-sm font-bold text-center mb-2" style={{ color: hc }}>{monthName}</p>
                <div className="grid grid-cols-7 gap-px text-center">
                  {DAY_ABBRS.map(d => (
                    <div key={d} className="text-[8px] font-bold text-[var(--foreground)]/30 py-0.5">{d}</div>
                  ))}
                  {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, di) => {
                    const day = di + 1;
                    const dateStr = `${calYear}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const beforeCreated = dateStr < createdDateStr;
                    const isFutureDay = dateStr > today;
                    const isScheduledForDay = !beforeCreated && isHabitScheduledForDate(habit, dateStr);
                    const repCount = !beforeCreated && !isFutureDay ? getDoneRepCountForDate(habit, store.habitLogs, dateStr) : 0;
                    const hasCompletedLog = !beforeCreated && !isFutureDay && store.habitLogs.some(l => l.habitId === habit.id && l.date === dateStr && l.completed);
                    const isDone = repCount > 0 || hasCompletedLog;
                    const isMissed = !isDone && !isFutureDay && !beforeCreated && isScheduledForDay;
                    const isNotScheduled = !isScheduledForDay && !isFutureDay;
                    const isTodayCell = dateStr === today;
                    const hasEdits = history.some(h => h.date === dateStr);

                    return (
                      <DayDetailsTooltip key={day} habit={habit} dateStr={dateStr} logs={store.habitLogs}
                        timerSessions={store.timerSessions} habitHistory={history} isAr={isAr}>
                        <div className={cn(
                          'h-6 rounded text-[9px] font-bold flex items-center justify-center relative',
                          isDone && 'bg-emerald-500 text-white',
                          isMissed && 'bg-red-500 text-white',
                          isNotScheduled && 'bg-red-500/10 text-red-400/50',
                          isFutureDay && isScheduledForDay && 'bg-gray-200 dark:bg-gray-700 text-[var(--foreground)]/40',
                          isFutureDay && !isScheduledForDay && 'text-[var(--foreground)]/20',
                          !isDone && !isMissed && !isFutureDay && !isNotScheduled && 'text-[var(--foreground)]/50',
                          isTodayCell && 'ring-2 ring-offset-1 font-black',
                        )}
                        style={isTodayCell ? { ['--tw-ring-color' as string]: hc } : undefined}>
                          {isNotScheduled ? '✕' : day}
                          {hasEdits && <span className="absolute bottom-0 start-0.5 h-1.5 w-1.5 rounded-full bg-violet-500 z-[2]" />}
                        </div>
                      </DayDetailsTooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </motion.div>

      {/* ═══ 4. Habit Notes ═══ */}
      {habit.notes && habit.notes.trim() && (
        <div className={cn(cardBase, 'px-4 sm:px-5 py-3 sm:py-4')} style={{ borderInlineStart: `3px solid ${hc}` }}>
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider mb-1">{isAr ? 'ملاحظات العادة' : 'Habit Notes'}</p>
              <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-wrap">{habit.notes.trim()}</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 5. Habit Loop ═══ */}
      {(habit.cueEn || habit.cueAr || habit.routineEn || habit.routineAr || habit.rewardEn || habit.rewardAr) && (
        <div className={cn(cardBase, 'p-4 sm:p-6 space-y-3')}>
          <h3 className="text-sm font-bold flex items-center gap-2"><Repeat className="h-4 w-4 text-violet-500" /> {isAr ? 'حلقة العادة' : 'Habit Loop'}</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {(habit.cueEn || habit.cueAr) && <LoopItem emoji="🔔" label={isAr ? 'الإشارة' : 'Cue'} value={isAr ? habit.cueAr || habit.cueEn || '' : habit.cueEn || habit.cueAr || ''} />}
            {(habit.routineEn || habit.routineAr) && <LoopItem emoji="⚡" label={isAr ? 'الروتين' : 'Routine'} value={isAr ? habit.routineAr || habit.routineEn || '' : habit.routineEn || habit.routineAr || ''} />}
            {(habit.rewardEn || habit.rewardAr) && <LoopItem emoji="🎁" label={isAr ? 'المكافأة' : 'Reward'} value={isAr ? habit.rewardAr || habit.rewardEn || '' : habit.rewardEn || habit.rewardAr || ''} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// CompletionAction — mark done button with all the edge cases
// ══════════════════════════════════════════════════════════
function CompletionAction({ habit, effectiveTracking, isViewingToday, viewingDateDone, viewingDate, handleToggleDay, isAr, toast, dailyNote }: {
  habit: Habit; effectiveTracking: HabitTrackingType; isViewingToday: boolean; viewingDateDone: boolean;
  viewingDate: string; handleToggleDay: () => void; isAr: boolean; toast: ReturnType<typeof useToast>; dailyNote: string;
}) {
  const usesTimer = habitUsesTimerToLog(habit);
  const isCount = effectiveTracking === 'count';
  const isBooleanHabit = effectiveTracking === 'boolean';
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const inWindow = !habit.windowStart || !habit.windowEnd || (currentTime >= habit.windowStart && currentTime <= habit.windowEnd);
  const windowExpired = habit.windowStart && habit.windowEnd && currentTime > habit.windowEnd;
  const strictLocked = isViewingToday && habit.strictWindow && habit.windowStart && habit.windowEnd && windowExpired && !viewingDateDone;
  const strictNotYet = isViewingToday && habit.strictWindow && habit.windowStart && habit.windowEnd && !inWindow && !windowExpired && !viewingDateDone;
  const isBooleanBefore9pm = isViewingToday && isBooleanHabit && !viewingDateDone && now.getHours() < 21;
  const needTimerToday = isViewingToday && usesTimer && !viewingDateDone;
  const isDisabled = !!strictLocked || !!strictNotYet || isBooleanBefore9pm || needTimerToday;

  const handleClick = () => {
    if (viewingDateDone) {
      toast.notifyInfo(isAr ? 'لا يمكن التراجع' : 'Cannot undo', isAr ? 'العادة مكتملة — الالتزام يعني عدم التراجع!' : 'Habit is done — commitment means no going back!');
    } else if (!isViewingToday) {
      toast.notifyWarning(isAr ? 'اليوم فقط' : 'Today only', isAr ? 'يمكنك تسجيل الإنجاز في نفس اليوم فقط' : 'You can only mark habits done on the same day');
    } else if (isBooleanBefore9pm) {
      toast.notifyInfo(isAr ? 'متاح بعد ٩ مساءً' : 'Available after 9 PM', isAr ? 'يمكنك تسجيل هذه العادة بعد الساعة ٩ مساءً لتقييم يومك' : 'You can check in after 9 PM to evaluate your full day');
    } else if (strictLocked) {
      toast.notifyWarning(isAr ? 'فات الوقت' : 'Window passed', isAr ? `انتهى وقت النافذة (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)})` : `Time window (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)}) has passed`);
    } else if (strictNotYet) {
      toast.notifyInfo(isAr ? 'لم يحن الوقت بعد' : 'Not yet', isAr ? `النافذة تبدأ الساعة ${to12h(habit.windowStart!)}` : `Window starts at ${to12h(habit.windowStart!)}`);
    } else if (needTimerToday) {
      toast.notifyInfo(isAr ? 'استخدم المؤقت' : 'Use the timer', isAr ? `سجّل الجلسة من صفحة العادات أو المؤقتات (${habit.expectedDuration ? formatDurationSecs(habit.expectedDuration) : '—'})` : `Log this habit from the habits list or timers (${habit.expectedDuration ? formatDurationSecs(habit.expectedDuration) : '—'})`);
    } else {
      handleToggleDay();
    }
  };

  const label = viewingDateDone ? (isAr ? '✓ مكتمل' : '✓ Done')
    : isBooleanBefore9pm ? (isAr ? 'يُسجَّل بعد ٩ مساءً' : 'Check-in after 9 PM')
    : strictNotYet ? (isAr ? `من ${to12h(habit.windowStart!)}` : `From ${to12h(habit.windowStart!)}`)
    : strictLocked ? (isAr ? 'انتهى الوقت' : 'Window ended')
    : needTimerToday ? (isAr ? 'سجّل من المؤقت في قائمة العادات' : 'Log via timer on habits list')
    : isCount ? (isAr ? 'تسجيل التقدم من قائمة العادات' : 'Log progress from habits list')
    : (isAr ? 'تسجيل إنجاز اليوم' : 'Mark done for this day');

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]/35">
        {isAr ? 'هذا اليوم' : 'This day'}
      </span>
      <button type="button" onClick={handleClick}
        className={cn('w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-bold transition-all duration-200 border',
          viewingDateDone ? 'bg-emerald-500/12 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/20'
          : isDisabled ? 'bg-[var(--foreground)]/[0.03] text-[var(--foreground)]/30 border-[var(--foreground)]/[0.08] cursor-not-allowed'
          : 'bg-[rgba(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)] border-[rgba(var(--color-primary-rgb)/0.25)] hover:bg-[rgba(var(--color-primary-rgb)/0.2)] hover:shadow-md')}>
        {viewingDateDone ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 opacity-50" />}
        {label}
      </button>
      {usesTimer && habit.expectedDuration && (
        <div className="p-3 rounded-xl bg-[rgba(var(--color-primary-rgb)/0.06)] border border-[rgba(var(--color-primary-rgb)/0.15)]">
          <div className="flex items-start gap-2">
            <Timer className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--foreground)]/60 leading-relaxed">
              <span className="font-bold text-[var(--foreground)]/75">{isAr ? 'عادة بمؤقت' : 'Timer-based habit'} </span>
              {isAr ? `الهدف ${formatDurationSecs(habit.expectedDuration)}. ابدأ المؤقت من بطاقة العادة.`
                : `Target ${formatDurationSecs(habit.expectedDuration)}. Start from the habit card.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// DayLogs — logs + timer sessions for a day
// ══════════════════════════════════════════════════════════
function DayLogs({ habitId, viewingDate, viewingDateLogs, store, isAr }: {
  habitId: string; viewingDate: string; viewingDateLogs: HabitLog[];
  store: ReturnType<typeof useAppStore>; isAr: boolean;
}) {
  const daySessions = store.timerSessions.filter(session => {
    if (session.habitId !== habitId) return false;
    if (session.endedAt) return session.endedAt.startsWith(viewingDate);
    return session.startedAt?.startsWith(viewingDate);
  });
  if (viewingDateLogs.length === 0 && daySessions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-[var(--foreground)]/35 uppercase tracking-wider">{isAr ? 'السجلات' : 'Logs'}</p>
      {viewingDateLogs.map(log => {
        const matchedSession = log.source === 'timer' && log.duration
          ? daySessions.find(s => Math.abs(s.duration - (log.duration ?? 0)) < 5) : null;
        const startEvent = matchedSession?.events?.find(e => e.action === 'start');
        const finishEvent = matchedSession?.events?.find(e => e.action === 'finish' || e.action === 'cancel');
        const startTime = startEvent ? new Date(startEvent.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
        const endTime = finishEvent ? new Date(finishEvent.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
        let computedStart = startTime;
        if (!computedStart && log.time && log.duration && log.duration > 0) {
          const [hh, mm] = log.time.split(':').map(Number);
          const startMins = hh * 60 + mm - Math.floor(log.duration / 60);
          const sH = Math.floor(((startMins % 1440) + 1440) % 1440 / 60);
          const sM = ((startMins % 1440) + 1440) % 1440 % 60;
          computedStart = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;
        }

        return (
          <div key={log.id} className="rounded-xl border border-[rgba(var(--color-primary-rgb)/0.1)] bg-[var(--foreground)]/[0.015] p-3 space-y-1.5 hover:border-[rgba(var(--color-primary-rgb)/0.25)] transition-colors">
            <div className="flex items-center gap-2">
              {log.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-[var(--foreground)]/25 shrink-0" />}
              <div className="flex items-center flex-wrap gap-1.5 text-xs flex-1">
                {log.source === 'timer' && <span className="font-bold text-blue-500 bg-blue-500/10 rounded px-1.5 py-0.5 text-[9px]">{isAr ? 'مؤقت' : 'Timer'}</span>}
                {log.completed && <span className="font-bold text-emerald-500 bg-emerald-500/10 rounded px-1.5 py-0.5 text-[9px]">{isAr ? 'مكتمل' : 'Done'}</span>}
                {log.duration && log.duration > 0 && <span className="font-bold text-[var(--foreground)]/45">{formatDurationSecs(log.duration)}</span>}
              </div>
              {log.moodAfter && <span className="text-sm">{['😞','😐','🙂','😊','🤩'][log.moodAfter - 1]}</span>}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[var(--foreground)]/45 ps-6">
              {computedStart && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {isAr ? 'بدأ' : 'Start'}: <span className="font-bold text-[var(--foreground)]/65">{computedStart}</span>
                </span>
              )}
              {(endTime || log.time) && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {isAr ? 'انتهى' : 'Done'}: <span className="font-bold text-[var(--foreground)]/65">{endTime || log.time}</span>
                </span>
              )}
            </div>
            {matchedSession?.events && matchedSession.events.length > 1 && (
              <div className="ps-6 flex flex-wrap gap-1">
                {matchedSession.events.map((ev, ei) => {
                  const info = EVENT_LABELS[ev.action] || { en: ev.action, ar: ev.action, color: 'text-[var(--foreground)]/50 bg-[var(--foreground)]/[0.05]' };
                  const time = new Date(ev.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return <span key={ei} className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold', info.color)}>{isAr ? info.ar : info.en} {time}</span>;
                })}
              </div>
            )}
            {log.note && <p className="text-[10px] text-[var(--foreground)]/35 ps-6">{log.note}</p>}
          </div>
        );
      })}

      {/* Standalone timer sessions */}
      {daySessions.filter(s => !viewingDateLogs.some(l => l.source === 'timer' && l.duration && Math.abs(s.duration - (l.duration ?? 0)) < 5)).map(session => (
        <div key={session.id} className="rounded-xl border border-blue-500/15 bg-blue-500/[0.02] p-3 space-y-1.5 hover:border-blue-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{isAr ? 'جلسة مؤقت' : 'Timer Session'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {session.completed
                ? <span className="text-[9px] font-bold rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500">{isAr ? 'مكتمل' : 'Done'}</span>
                : <span className="text-[9px] font-bold rounded px-1.5 py-0.5 bg-red-500/10 text-red-400">{isAr ? 'ملغي' : 'Cancelled'}</span>}
              <span className="text-[10px] font-bold text-[var(--foreground)]/45">{formatDurationSecs(session.duration)}</span>
            </div>
          </div>
          {session.events && session.events.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {session.events.map((ev, ei) => {
                const info = EVENT_LABELS[ev.action] || { en: ev.action, ar: ev.action, color: 'text-[var(--foreground)]/50 bg-[var(--foreground)]/[0.05]' };
                const time = new Date(ev.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return <span key={ei} className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold', info.color)}>{isAr ? info.ar : info.en} {time}</span>;
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SettingsChanges — history entries for a given day
// ══════════════════════════════════════════════════════════
function SettingsChanges({ entries, isAr }: { entries: HabitHistoryEntry[]; isAr: boolean }) {
  return (
    <div className="border-t-2 border-violet-500/20 pt-3">
      <p className="flex items-center gap-2 text-xs font-bold text-violet-500 mb-2">
        <Pencil className="h-3.5 w-3.5" />
        {isAr ? 'تعديلات هذا اليوم' : 'Changes on this day'}
      </p>
      <div className="space-y-2 pb-1 pt-1">
        {entries.map(entry => {
          const info = CHANGE_TYPE_LABELS[entry.changeType] || CHANGE_TYPE_LABELS.edited;
          return (
            <div key={entry.id} className="rounded-xl border border-[rgba(var(--color-primary-rgb)/0.12)] bg-[var(--foreground)]/[0.015] p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', info.color)}>{info.icon}</span>
                <div>
                  <p className="text-xs font-bold">{isAr ? info.ar : info.en}</p>
                  <p className="text-[10px] text-[var(--foreground)]/40">
                    {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {Object.keys(entry.changes).length > 0 && (
                <ul className="space-y-1">
                  {Object.entries(entry.changes).map(([field, diff]) => {
                    const label = FIELD_LABELS[field] ? (isAr ? FIELD_LABELS[field].ar : FIELD_LABELS[field].en) : field;
                    return (
                      <li key={field} className="text-[11px] text-[var(--foreground)]/60 leading-snug">
                        <span className="font-semibold text-[var(--foreground)]/75">{label}</span>
                        <span className="text-[var(--foreground)]/30 mx-1">:</span>
                        <span className="line-through decoration-red-400/50 text-red-400/70">{formatHistoryDisplayValue(field, diff.from, isAr)}</span>
                        <span className="text-[var(--foreground)]/30 mx-1">→</span>
                        <span className="text-emerald-500 font-medium">{formatHistoryDisplayValue(field, diff.to, isAr)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Calendar
// ══════════════════════════════════════════════════════════
function HabitCalendar({ calMonth, setCalMonth, logsByDate, historyByDate, habitLogs, selectedDate, setSelectedDate, isAr, habitColor, habit, today }: {
  calMonth: { year: number; month: number }; setCalMonth: (m: { year: number; month: number }) => void;
  logsByDate: Record<string, HabitLog[]>; historyByDate: Record<string, HabitHistoryEntry[]>;
  habitLogs: HabitLog[]; selectedDate: string | null; setSelectedDate: (d: string | null) => void;
  isAr: boolean; habitColor: string; habit: Habit; today: string;
}) {
  const calStore = useAppStore();
  const hc = resolveHabitColor(habitColor);
  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(calMonth.year, calMonth.month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayMonth = new Date();
  const isCurrentMonth = calMonth.year === todayMonth.getFullYear() && calMonth.month === todayMonth.getMonth();

  const prevMonth = () => {
    setCalMonth(calMonth.month === 0 ? { year: calMonth.year - 1, month: 11 } : { year: calMonth.year, month: calMonth.month - 1 });
    setSelectedDate(null);
  };
  const nextMonth = () => {
    setCalMonth(calMonth.month === 11 ? { year: calMonth.year + 1, month: 0 } : { year: calMonth.year, month: calMonth.month + 1 });
    setSelectedDate(null);
  };
  const goToday = () => {
    setCalMonth({ year: todayMonth.getFullYear(), month: todayMonth.getMonth() });
    setSelectedDate(null);
  };

  return (
    <div className={cn(cardBase, 'p-4 sm:p-5')}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className={cn(btnBase, 'h-9 w-9')}>
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-extrabold tracking-tight">
            {isAr ? MONTH_NAMES.ar[calMonth.month] : MONTH_NAMES.en[calMonth.month]} {calMonth.year}
          </h3>
          {!isCurrentMonth && (
            <button type="button" onClick={goToday}
              className="text-[10px] font-bold text-[var(--color-primary)] hover:underline px-1.5 py-0.5 rounded-md hover:bg-[rgba(var(--color-primary-rgb)/0.08)] transition-colors">
              {isAr ? 'اليوم' : 'Today'}
            </button>
          )}
        </div>
        <button type="button" onClick={nextMonth} className={cn(btnBase, 'h-9 w-9')}>
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {(isAr ? DAY_NAMES.ar : DAY_NAMES.en).map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-[var(--foreground)]/30 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} />)}
        {days.map(day => {
          const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const logs = logsByDate[dateStr] || [];
          const repCount = getDoneRepCountForDate(habit, habitLogs, dateStr);
          const hasCompletion = repCount > 0;
          const beforeCreatedCheck = habit.createdAt.split('T')[0] > dateStr;
          const isMissed = !hasCompletion && dateStr < today && !beforeCreatedCheck && isHabitScheduledForDate(habit, dateStr);
          const hasHistory = (historyByDate[dateStr] || []).length > 0;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > today;
          const isScheduled = isHabitScheduledForDate(habit, dateStr);
          const hasLateCompletion = hasCompletion && habit.strictWindow && habit.windowStart && habit.windowEnd && logs.some(l => l.completed && l.time && (l.time < habit.windowStart! || l.time > habit.windowEnd!));

          const isNotScheduled = !isScheduled && !isFuture;
          const beforeCreated = habit.createdAt.split('T')[0] > dateStr;

          return (
            <DayDetailsTooltip key={day} habit={habit} dateStr={dateStr} logs={habitLogs} timerSessions={calStore.timerSessions} habitHistory={historyByDate[dateStr] || []} isAr={isAr}>
            <button type="button"
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              disabled={beforeCreated}
              className={cn(
                'relative h-9 sm:h-10 w-full rounded-md flex items-center justify-center text-[11px] sm:text-sm font-bold transition-all duration-150 cursor-pointer',
                isSelected && 'text-white shadow-md ring-2 ring-offset-1',
                !isSelected && hasCompletion && !hasLateCompletion && 'bg-emerald-500 text-white',
                !isSelected && hasCompletion && hasLateCompletion && 'bg-amber-500 text-white',
                !isSelected && isMissed && 'bg-red-500 text-white',
                !isSelected && isNotScheduled && !beforeCreated && !hasCompletion && 'bg-red-500/15 text-red-500 font-black',
                !isSelected && isFuture && isScheduled && 'bg-gray-200 dark:bg-gray-700 text-[var(--foreground)]/50',
                beforeCreated && 'opacity-20 cursor-default',
                isToday && !isSelected && 'ring-2 ring-offset-1 font-black',
                !isSelected && !hasCompletion && !isMissed && !isFuture && !isNotScheduled && !beforeCreated && 'text-[var(--foreground)]/70 hover:bg-[rgba(var(--color-primary-rgb)/0.08)]',
              )}
              style={{
                ...(isSelected ? { background: 'var(--color-primary)', ['--tw-ring-color' as string]: 'var(--color-primary)' } : {}),
                ...(isToday && !isSelected ? { ['--tw-ring-color' as string]: hc } : {}),
              }}>
              {isNotScheduled && !beforeCreated && !hasCompletion ? '✕' : day}
              {hasHistory && (
                <span className="absolute bottom-0 start-0.5 h-2.5 w-2.5 rounded-full bg-violet-500 z-[2] border border-white dark:border-gray-900" />
              )}
              {repCount > 1 && (
                <span className="absolute -top-1 -end-1 min-w-[16px] px-0.5 rounded-full bg-blue-500 text-white text-[8px] font-black text-center z-[2] shadow-sm ring-1 ring-white dark:ring-gray-900">{repCount}x</span>
              )}
            </button>
            </DayDetailsTooltip>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-[rgba(var(--color-primary-rgb)/0.1)] flex-wrap">
        <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /><span className="text-[9px] font-semibold text-[var(--foreground)]/50">{isAr ? 'مكتمل' : 'Done'}</span></div>
        <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-red-500" /><span className="text-[9px] font-semibold text-[var(--foreground)]/50">{isAr ? 'فائت' : 'Missed'}</span></div>
        <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-gray-300 dark:bg-gray-600" /><span className="text-[9px] font-semibold text-[var(--foreground)]/50">{isAr ? 'قادم' : 'Upcoming'}</span></div>
        <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-red-500/10 text-red-400 text-[6px] font-black flex items-center justify-center">✕</div><span className="text-[9px] font-semibold text-[var(--foreground)]/50">{isAr ? 'غير مجدول' : 'N/A'}</span></div>
        {habit.strictWindow && <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-amber-500" /><span className="text-[9px] font-semibold text-[var(--foreground)]/50">{isAr ? 'متأخر' : 'Late'}</span></div>}
        <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-violet-500" /><span className="text-[9px] font-semibold text-[var(--foreground)]/50">{isAr ? 'تعديل' : 'Edit'}</span></div>
      </div>
      {/* Click hint */}
      <p className="text-center text-sm text-[var(--color-primary)] font-bold mt-3">
        {isAr ? '📅 اضغط على أي يوم لعرض تفاصيل الجلسة والإنجاز' : '📅 Click any day to view session details'}
      </p>
    </div>
  );
}


// ══════════════════════════════════════════════════════════
// Small utility components
// ══════════════════════════════════════════════════════════
function StatBox({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className={cn(cardBase, 'flex items-center gap-3 p-3 sm:p-4 hover:border-[rgba(var(--color-primary-rgb)/0.3)] transition-colors')}>
      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[rgba(var(--color-primary-rgb)/0.08)] border border-[rgba(var(--color-primary-rgb)/0.12)] shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-lg sm:text-xl font-extrabold leading-tight tabular-nums">{value}{sub ? <span className="text-[10px] font-semibold text-[var(--foreground)]/40 ms-1">{sub}</span> : null}</p>
        <p className="text-[9px] sm:text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--foreground)]/[0.02] border border-[rgba(var(--color-primary-rgb)/0.08)] hover:border-[rgba(var(--color-primary-rgb)/0.2)] transition-colors">
      <div className="h-6 w-6 rounded-lg flex items-center justify-center text-[var(--color-primary)]/60 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] text-[var(--foreground)]/35">{label}</p>
        <p className="text-xs font-semibold truncate capitalize">{value}</p>
      </div>
    </div>
  );
}

function LoopItem({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--foreground)]/[0.02] border border-[rgba(var(--color-primary-rgb)/0.1)] hover:border-[rgba(var(--color-primary-rgb)/0.2)] transition-colors">
      <span className="text-base">{emoji}</span>
      <div>
        <p className="text-[9px] font-bold text-[var(--foreground)]/35 uppercase">{label}</p>
        <p className="text-xs text-[var(--foreground)]/65 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
