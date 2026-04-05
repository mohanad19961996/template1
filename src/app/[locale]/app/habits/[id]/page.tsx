'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import { Habit, HabitHistoryEntry, HabitLog, HabitTrackingType, WeekDay, todayString, resolveHabitColor, parseLocalDate, formatDurationSecs } from '@/types/app';
import { getDoneRepCountForDate } from '@/lib/habit-completion';
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, Flame, Target, Edit3, Archive,
  ChevronLeft, ChevronRight, Star, BarChart3, TrendingUp, Activity,
  MapPin, Repeat, Gift, Lightbulb, History, Eye, CheckCircle2, Circle,
  Pencil, Plus, RotateCcw, AlertCircle, Timer, Hash, Send, MessageSquare, Minus, ListChecks,
} from 'lucide-react';
import { useToast } from '@/components/app/toast-notifications';

function to12h(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

// ── Labels ──
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

// Field name translations for the history diff
const FIELD_LABELS: Record<string, { en: string; ar: string }> = {
  nameEn: { en: 'Name (English)', ar: 'الاسم (إنجليزي)' },
  nameAr: { en: 'Name (Arabic)', ar: 'الاسم (عربي)' },
  descriptionEn: { en: 'Description (EN)', ar: 'الوصف (إنجليزي)' },
  descriptionAr: { en: 'Description (AR)', ar: 'الوصف (عربي)' },
  category: { en: 'Category', ar: 'الفئة' },
  frequency: { en: 'Frequency', ar: 'التكرار' },
  priority: { en: 'Priority', ar: 'الأولوية' },
  difficulty: { en: 'Difficulty', ar: 'الصعوبة' },
  color: { en: 'Color', ar: 'اللون' },
  icon: { en: 'Icon', ar: 'الأيقونة' },
  type: { en: 'Type', ar: 'النوع' },
  trackingType: { en: 'Tracking Type', ar: 'نوع التتبع' },
  targetValue: { en: 'Target Value', ar: 'القيمة المستهدفة' },
  targetUnit: { en: 'Target Unit', ar: 'وحدة القياس' },
  scheduleType: { en: 'Schedule', ar: 'الجدول' },
  scheduleDays: { en: 'Schedule Days', ar: 'أيام الجدول' },
  archived: { en: 'Archived', ar: 'مؤرشفة' },
  image: { en: 'Image', ar: 'الصورة' },
  preferredTime: { en: 'Preferred Time', ar: 'الوقت المفضل' },
  expectedDuration: { en: 'Expected Duration', ar: 'المدة المتوقعة' },
  placeEn: { en: 'Place', ar: 'المكان' },
  placeAr: { en: 'Place (AR)', ar: 'المكان (عربي)' },
  cueEn: { en: 'Cue', ar: 'الإشارة' },
  routineEn: { en: 'Routine', ar: 'الروتين' },
  rewardEn: { en: 'Reward', ar: 'المكافأة' },
  reminderEnabled: { en: 'Reminder', ar: 'التذكير' },
  reminderTime: { en: 'Reminder Time', ar: 'وقت التذكير' },
  windowStart: { en: 'Window Start', ar: 'بداية النافذة' },
  windowEnd: { en: 'Window End', ar: 'نهاية النافذة' },
  allowPartial: { en: 'Allow Partial', ar: 'السماح بالجزئي' },
  allowSkip: { en: 'Allow Skip', ar: 'السماح بالتخطي' },
};

const TRACKING_LABELS: Record<HabitTrackingType, { en: string; ar: string }> = {
  boolean: { en: 'Yes / No', ar: 'نعم / لا' },
  count: { en: 'Count goal', ar: 'هدف عددي' },
  timer: { en: 'Timer session', ar: 'جلسة بمؤقت' },
  checklist: { en: 'Checklist', ar: 'قائمة خطوات' },
  duration: { en: 'Duration log', ar: 'تسجيل مدة' },
};

function getEffectiveTrackingType(habit: Habit): HabitTrackingType {
  return habit.trackingType ?? (habit.expectedDuration ? 'timer' : 'boolean');
}

function habitUsesTimerToLog(habit: Habit): boolean {
  return getEffectiveTrackingType(habit) === 'timer';
}

function formatHistoryDisplayValue(field: string, val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? '✓' : '✗';
  if (field === 'expectedDuration' && typeof val === 'number' && val > 0) {
    return formatDurationSecs(val);
  }
  if (typeof val === 'string' && val.length > 48) return val.slice(0, 48) + '…';
  if (Array.isArray(val)) return val.join(', ') || '—';
  return String(val);
}

export default function HabitDetailPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const params = useParams();
  const habitId = params.id as string;
  const store = useAppStore();
  const today = todayString();

  const toast = useToast();
  const habit = store.habits.find(h => h.id === habitId);
  const [history, setHistory] = useState<HabitHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'history' | 'stats'>('calendar');
  const [viewingDate, setViewingDate] = useState(today);
  const [dailyNote, setDailyNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Fetch history from API
  useEffect(() => {
    if (!habitId) return;
    setLoadingHistory(true);
    fetch(`/api/habits/${habitId}/history`)
      .then(r => r.json())
      .then(data => {
        if (data.data) setHistory(data.data);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [habitId]);

  // All logs for this habit
  const habitLogs = useMemo(() =>
    store.habitLogs.filter(l => l.habitId === habitId),
    [store.habitLogs, habitId]
  );

  // Logs indexed by date for fast lookup
  const logsByDate = useMemo(() => {
    const map: Record<string, HabitLog[]> = {};
    habitLogs.forEach(l => {
      if (!map[l.date]) map[l.date] = [];
      map[l.date].push(l);
    });
    return map;
  }, [habitLogs]);

  // History entries indexed by date
  const historyByDate = useMemo(() => {
    const map: Record<string, HabitHistoryEntry[]> = {};
    history.forEach(h => {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push(h);
    });
    return map;
  }, [history]);

  // Stats
  const streak = store.getHabitStreak(habitId);
  const stats = store.getHabitStats(habitId);
  // Day navigator — viewing date state
  const isViewingToday = viewingDate === today;
  const viewingDateDone = habitLogs.some(l => l.date === viewingDate && l.completed);
  const viewingDateLog = habitLogs.find(l => l.date === viewingDate);
  const viewingDateLogs = logsByDate[viewingDate] || [];
  const viewingDateHistory = historyByDate[viewingDate] || [];

  // Sync daily note when viewingDate changes
  useEffect(() => {
    const log = habitLogs.find(l => l.date === viewingDate);
    setDailyNote(log?.note || '');
  }, [viewingDate, habitLogs]);

  const navigateDay = (dir: -1 | 1) => {
    const d = new Date(viewingDate + 'T00:00:00');
    d.setDate(d.getDate() + dir);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (next > today) return; // can't go to future
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
      store.logHabit({
        habitId: habit.id, date: viewingDate,
        time: viewingDateLog.time,
        note: dailyNote,
        reminderUsed: viewingDateLog.reminderUsed,
        perceivedDifficulty: viewingDateLog.perceivedDifficulty,
        completed: viewingDateLog.completed,
        status: viewingDateLog.status,
        source: viewingDateLog.source,
        duration: viewingDateLog.duration,
        moodBefore: viewingDateLog.moodBefore,
        moodAfter: viewingDateLog.moodAfter,
      });
    } else {
      store.logHabit({
        habitId: habit.id, date: viewingDate,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        note: dailyNote,
        reminderUsed: false,
        perceivedDifficulty: habit.difficulty || 'medium',
        completed: false,
        status: 'pending',
        source: 'manual',
      });
    }
    setTimeout(() => setSavingNote(false), 500);
  };

  const handleToggleDay = () => {
    if (!habit) return;
    if (habitUsesTimerToLog(habit) && isViewingToday) return; // timer habits — log from main habits / timer
    if (viewingDateDone && viewingDateLog) {
      store.deleteHabitLog(viewingDateLog.id);
    } else {
      store.logHabit({
        habitId: habit.id, date: viewingDate,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        note: dailyNote, reminderUsed: false, perceivedDifficulty: habit.difficulty || 'medium', completed: true,
      });
    }
  };

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

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
      <div className="tasks-glass-shell rounded-2xl sm:rounded-3xl overflow-hidden">
        <div className="tasks-glass-stack">
          {/* ── Header ── */}
          <header className="tasks-glass-header px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <Link href="/app/habits" className="tasks-glass-icon-btn shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border border-[rgba(var(--color-primary-rgb)/0.25)] bg-[rgba(var(--color-background-rgb)/0.45)] hover:bg-[rgba(var(--color-primary-rgb)/0.12)] transition-colors">
                <ArrowLeft className="h-[18px] w-[18px] text-[var(--foreground)]/70 rtl:rotate-180" />
              </Link>
              <div className="flex-1 min-w-0 flex gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0 shadow-lg ring-2 ring-white/20"
                  style={{ background: `linear-gradient(145deg, ${habit.color}, ${habit.color}aa)` }}>
                  {name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-[var(--foreground)] truncate">{name}</h1>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-[rgba(var(--color-primary-rgb)/0.12)] text-[var(--color-primary)] border border-[rgba(var(--color-primary-rgb)/0.2)]">{catLabel}</span>
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/70 border border-[var(--foreground)]/[0.1]">{freqLabel}</span>
                    <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/60 border border-[var(--foreground)]/[0.08]">{trackingLabel}</span>
                    {habit.archived && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 border border-amber-500/25">{isAr ? 'مؤرشفة' : 'Archived'}</span>
                    )}
                  </div>
                  {description ? (
                    <p className="text-xs sm:text-sm text-[var(--foreground)]/55 mt-2 leading-relaxed line-clamp-3">{description}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          {/* ── Stats ── */}
          <div className="tasks-glass-stats-row grid grid-cols-2 lg:grid-cols-4">
            <StatBox icon={<Flame className="h-4 w-4 text-orange-500" />} label={isAr ? 'السلسلة' : 'Streak'} value={`${streak.current}`} sub={isAr ? 'أيام' : 'days'} />
            <StatBox icon={<Star className="h-4 w-4 text-yellow-500" />} label={isAr ? 'أفضل' : 'Best'} value={`${streak.best}`} sub={isAr ? 'أيام' : 'days'} />
            <StatBox icon={<Target className="h-4 w-4 text-emerald-500" />} label={isAr ? 'الالتزام' : 'Rate'} value={`${stats.completionRate}%`} />
            <StatBox icon={<CheckCircle2 className="h-4 w-4 text-blue-500" />} label={isAr ? 'الإنجازات' : 'Total'} value={`${stats.totalCompletions}`} />
          </div>

          {/* ── Tabs ── */}
          <div className="tasks-glass-toolbar px-3 sm:px-4 py-3">
            <div className="tasks-glass-segmented flex rounded-xl p-1 gap-0.5">
              {[
                { key: 'calendar' as const, icon: CalendarIcon, labelEn: 'Calendar', labelAr: 'التقويم' },
                { key: 'history' as const, icon: History, labelEn: 'Activity', labelAr: 'النشاط' },
                { key: 'stats' as const, icon: BarChart3, labelEn: 'About', labelAr: 'عن العادة' },
              ].map(tab => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all',
                    activeTab === tab.key
                      ? 'bg-[var(--color-background)] text-[var(--color-primary)] shadow-md ring-1 ring-[rgba(var(--color-primary-rgb)/0.2)]'
                      : 'text-[var(--foreground)]/45 hover:text-[var(--foreground)]/75 hover:bg-[var(--foreground)]/[0.04]')}>
                  <tab.icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  {isAr ? tab.labelAr : tab.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 sm:px-4 pb-4 sm:pb-6 pt-1 space-y-4 sm:space-y-5">
      {/* ── Day panel (always visible — primary actions) ── */}
      <div className="rounded-2xl border border-[rgba(var(--color-primary-rgb)/0.2)] bg-[rgba(var(--color-background-rgb)/0.4)] backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-[0_8px_32px_rgba(var(--color-primary-rgb)/0.08)]">
        {/* Date navigation header */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigateDay(-1)}
            className="h-9 w-9 rounded-xl flex items-center justify-center border border-[var(--foreground)]/[0.08] hover:bg-[var(--foreground)]/[0.06] transition-colors">
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </button>
          <div className="text-center">
            <h3 className="text-sm font-bold flex items-center gap-2 justify-center">
              <CalendarIcon className="h-4 w-4 text-[var(--color-primary)]" />
              {formatViewingDate(viewingDate)}
            </h3>
            <p className="text-[10px] text-[var(--foreground)]/40 mt-0.5">{viewingDate}</p>
          </div>
          <button type="button" onClick={() => navigateDay(1)}
            disabled={isViewingToday}
            className={cn('h-9 w-9 rounded-xl flex items-center justify-center border border-[var(--foreground)]/[0.08] transition-colors',
              isViewingToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--foreground)]/[0.06]')}>
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>

        {/* Quick jump to today */}
        {!isViewingToday && (
          <button onClick={() => setViewingDate(today)}
            className="w-full text-center text-[10px] font-semibold text-[var(--color-primary)] hover:underline py-1">
            {isAr ? '← الذهاب لليوم' : '← Jump to Today'}
          </button>
        )}

        {/* Completion status — uses effective tracking (boolean vs timer), not stray duration fields */}
        {(() => {
          const usesTimer = habitUsesTimerToLog(habit);
          const isCount = effectiveTracking === 'count';
          const isBooleanHabit = effectiveTracking === 'boolean';

          // Time window checks (only for today)
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
            if (isBooleanBefore9pm) {
              toast.notifyInfo(
                isAr ? 'متاح بعد ٩ مساءً' : 'Available after 9 PM',
                isAr ? 'يمكنك تسجيل هذه العادة بعد الساعة ٩ مساءً لتقييم يومك' : 'You can check in after 9 PM to evaluate your full day'
              );
            } else if (strictLocked) {
              toast.notifyWarning(
                isAr ? 'فات الوقت' : 'Window passed',
                isAr ? `انتهى وقت النافذة (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)})` : `Time window (${to12h(habit.windowStart!)}–${to12h(habit.windowEnd!)}) has passed`
              );
            } else if (strictNotYet) {
              toast.notifyInfo(
                isAr ? 'لم يحن الوقت بعد' : 'Not yet',
                isAr ? `النافذة تبدأ الساعة ${to12h(habit.windowStart!)}` : `Window starts at ${to12h(habit.windowStart!)}`
              );
            } else if (needTimerToday) {
              toast.notifyInfo(
                isAr ? 'استخدم المؤقت' : 'Use the timer',
                isAr ? `سجّل الجلسة من صفحة العادات أو المؤقتات (${habit.expectedDuration ? formatDurationSecs(habit.expectedDuration) : '—'})` : `Log this habit from the habits list or timers (${habit.expectedDuration ? formatDurationSecs(habit.expectedDuration) : '—'})`
              );
            } else {
              handleToggleDay();
            }
          };

          return (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)]/40">
                {isAr ? 'هذا اليوم' : 'This day'}
              </span>
              <button type="button" onClick={handleClick}
                className={cn('w-full flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl text-sm font-bold transition-all border',
                  viewingDateDone
                    ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/25'
                    : isDisabled
                      ? 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/35 border-[var(--foreground)]/[0.08] cursor-not-allowed'
                      : 'bg-[rgba(var(--color-primary-rgb)/0.14)] text-[var(--color-primary)] border-[rgba(var(--color-primary-rgb)/0.28)] hover:bg-[rgba(var(--color-primary-rgb)/0.22)] shadow-sm'
                )}>
                {viewingDateDone ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 opacity-60" />}
                {viewingDateDone
                  ? (isAr ? 'مكتمل — للتراجع اضغط' : 'Done — tap to undo')
                  : isBooleanBefore9pm
                    ? (isAr ? 'يُسجَّل بعد ٩ مساءً' : 'Check-in after 9 PM')
                    : strictNotYet
                      ? (isAr ? `من ${to12h(habit.windowStart!)}` : `From ${to12h(habit.windowStart!)}`)
                      : strictLocked
                        ? (isAr ? 'انتهى الوقت' : 'Window ended')
                        : needTimerToday
                          ? (isAr ? 'سجّل من المؤقت في قائمة العادات' : 'Log via timer on habits list')
                          : isCount
                            ? (isAr ? 'تسجيل التقدم من قائمة العادات' : 'Log progress from habits list')
                            : (isAr ? 'تسجيل إنجاز اليوم' : 'Mark done for this day')}
              </button>
            </div>
          );
        })()}

        {/* Timer habits: clarify logging path (no misleading text for boolean habits) */}
        {habitUsesTimerToLog(habit) && habit.expectedDuration && (
          <div className="p-3 rounded-xl bg-[rgba(var(--color-primary-rgb)/0.08)] border border-[rgba(var(--color-primary-rgb)/0.2)]">
            <div className="flex items-start gap-2.5">
              <Timer className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-[var(--foreground)]/70">
                <p className="font-bold text-[var(--foreground)]/85 mb-0.5">{isAr ? 'عادة بمؤقت' : 'Timer-based habit'}</p>
                <p>
                  {isAr
                    ? `الهدف ${formatDurationSecs(habit.expectedDuration)}. افتح «عادات اليوم» أو «العادات» وابدأ المؤقت من بطاقة العادة.`
                    : `Target session ${formatDurationSecs(habit.expectedDuration)}. Start the timer from the habit card on Today or All Habits.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logs for this day (past days) */}
        {!isViewingToday && viewingDateLogs.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">{isAr ? 'السجلات' : 'Logs'}</p>
            {viewingDateLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--foreground)]/[0.03]">
                {log.completed
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <Circle className="h-4 w-4 text-[var(--foreground)]/30 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{log.time}</span>
                    {log.status && <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold',
                      log.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                      log.status === 'partial' ? 'bg-amber-500/10 text-amber-600' :
                      log.status === 'skipped' ? 'bg-gray-500/10 text-gray-600' :
                      'bg-red-500/10 text-red-600'
                    )}>{log.status}</span>}
                    {log.duration ? <span className="text-[var(--foreground)]/40">{formatDurationSecs(log.duration)}</span> : null}
                  </div>
                  {log.note && <p className="text-[10px] text-[var(--foreground)]/50 mt-0.5">{log.note}</p>}
                </div>
                {log.moodAfter && (
                  <div className="text-xs text-[var(--foreground)]/40">{['😞','😐','🙂','😊','🤩'][log.moodAfter - 1]}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Habit settings activity (collapsed — not raw debug) */}
        {viewingDateHistory.length > 0 && (
          <details className="group pt-2 border-t border-[var(--foreground)]/[0.12] rounded-xl">
            <summary className="flex cursor-pointer items-center justify-between gap-2 py-2 text-xs font-bold text-[var(--foreground)]/55 list-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                {isAr ? 'تحديثات إعدادات العادة هذا اليوم' : 'Habit settings updated this day'}
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--foreground)]/35 transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:-rotate-90" />
            </summary>
            <div className="space-y-2 pb-1 pt-1">
              {viewingDateHistory.map(entry => {
                const info = CHANGE_TYPE_LABELS[entry.changeType] || CHANGE_TYPE_LABELS.edited;
                return (
                  <div key={entry.id} className="rounded-xl border border-[rgba(var(--color-primary-rgb)/0.15)] bg-[var(--foreground)]/[0.02] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', info.color)}>{info.icon}</span>
                      <div>
                        <p className="text-xs font-bold">{isAr ? info.ar : info.en}</p>
                        <p className="text-[10px] text-[var(--foreground)]/45">
                          {new Date(entry.timestamp).toLocaleTimeString(isAr ? 'ar-u-nu-latn' : 'en', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {Object.keys(entry.changes).length > 0 && (
                      <ul className="space-y-1.5">
                        {Object.entries(entry.changes).map(([field, diff]) => {
                          const label = FIELD_LABELS[field] ? (isAr ? FIELD_LABELS[field].ar : FIELD_LABELS[field].en) : field;
                          return (
                            <li key={field} className="text-[11px] text-[var(--foreground)]/65 leading-snug">
                              <span className="font-semibold text-[var(--foreground)]/80">{label}</span>
                              <span className="text-[var(--foreground)]/35"> · </span>
                              <span className="line-through decoration-red-400/50 text-red-400/80">{formatHistoryDisplayValue(field, diff.from)}</span>
                              <span className="text-[var(--foreground)]/35 mx-1">→</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatHistoryDisplayValue(field, diff.to)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* Daily note */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-[var(--foreground)]/40" />
            <span className="text-xs font-medium text-[var(--foreground)]/50">
              {isAr ? 'ملاحظة اليوم' : 'Daily Note'}
            </span>
          </div>
          <div className="flex gap-2">
            <textarea
              value={dailyNote}
              onChange={e => setDailyNote(e.target.value)}
              placeholder={isAr ? 'اكتب ملاحظة عن هذا اليوم...' : 'Write a note about this day...'}
              className="tasks-glass-input flex-1 rounded-xl px-3 py-2 text-sm resize-none placeholder:text-[var(--foreground)]/30"
              rows={2}
            />
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className={cn(
                'shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all self-end',
                dailyNote.trim()
                  ? 'bg-[var(--color-primary)] text-white hover:opacity-90'
                  : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/30'
              )}
            >
              {savingNote ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Empty state for past days with no data */}
        {!isViewingToday && viewingDateLogs.length === 0 && viewingDateHistory.length === 0 && !dailyNote.trim() && (
          <p className="text-xs text-[var(--foreground)]/40 italic text-center py-2">
            {isAr ? 'لا توجد بيانات لهذا اليوم' : 'No data for this day'}
          </p>
        )}
      </div>

      {/* ── Calendar Tab ── */}
      {activeTab === 'calendar' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <HabitCalendar
            calMonth={calMonth}
            setCalMonth={setCalMonth}
            logsByDate={logsByDate}
            historyByDate={historyByDate}
            habitLogs={habitLogs}
            selectedDate={selectedDate}
            setSelectedDate={(d) => { setSelectedDate(d); if (d) setViewingDate(d); }}
            isAr={isAr}
            habitColor={habit.color}
            habit={habit}
          />

          <p className="text-center text-[11px] text-[var(--foreground)]/45 px-2">
            {isAr ? 'عند اختيار يوم في التقويم يتم تحديث البطاقة أعلاه (الإنجاز والملاحظات).' : 'Picking a day in the grid updates the card above (done state and note).'}
          </p>
        </motion.div>
      )}

      {/* ── History Tab ── */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          {loadingHistory ? (
            <div className="text-center py-12 text-sm text-[var(--foreground)]/40">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-sm text-[var(--foreground)]/40">{isAr ? 'لا يوجد سجل تغييرات' : 'No change history'}</div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-0 bottom-0 start-[19px] w-0.5 bg-[var(--foreground)]/[0.18]" />

              {history.map((entry, i) => {
                const info = CHANGE_TYPE_LABELS[entry.changeType] || CHANGE_TYPE_LABELS.edited;
                return (
                  <motion.div key={entry.id} initial={{ opacity: 0, x: isAr ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative flex items-start gap-3 py-3 ps-0">
                    {/* Timeline dot */}
                    <div className={cn('relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2 border-[var(--color-background)]', info.color)}>
                      {info.icon}
                    </div>

                    <div className="flex-1 min-w-0 rounded-xl border border-[rgba(var(--color-primary-rgb)/0.15)] bg-[rgba(var(--color-background-rgb)/0.5)] backdrop-blur-md p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold">{isAr ? info.ar : info.en}</p>
                        <p className="text-[10px] text-[var(--foreground)]/40 shrink-0">
                          {new Date(entry.timestamp).toLocaleDateString(isAr ? 'ar-u-nu-latn' : 'en', { year: 'numeric', month: 'short', day: 'numeric' })}
                          {' '}
                          {new Date(entry.timestamp).toLocaleTimeString(isAr ? 'ar-u-nu-latn' : 'en', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {Object.keys(entry.changes).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(entry.changes).map(([field, diff]) => {
                            const label = FIELD_LABELS[field] ? (isAr ? FIELD_LABELS[field].ar : FIELD_LABELS[field].en) : field;
                            return (
                              <div key={field} className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-[var(--foreground)]/60 shrink-0">{label}</span>
                                <span className="text-red-400/90 line-through truncate max-w-[140px]">{formatHistoryDisplayValue(field, diff.from)}</span>
                                <span className="text-[var(--foreground)]/30">→</span>
                                <span className="text-emerald-500 truncate max-w-[140px]">{formatHistoryDisplayValue(field, diff.to)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Details/Stats Tab ── */}
      {activeTab === 'stats' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-xs text-[var(--foreground)]/50 text-center px-1">
            {isAr ? 'تفاصيل الجدول والتتبع. لتسجيل يوم محدد استخدم البطاقة أعلى الصفحة أو التقويم.' : 'Schedule and tracking details. Use the top card or calendar to log a specific day.'}
          </p>

          {/* Habit Info */}
          <div className="rounded-2xl border border-[rgba(var(--color-primary-rgb)/0.18)] bg-[rgba(var(--color-background-rgb)/0.45)] backdrop-blur-xl p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-primary)]" />
              {isAr ? 'معلومات العادة' : 'Habit Info'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label={isAr ? 'نوع التتبع' : 'Tracking'} value={trackingLabel} icon={
                effectiveTracking === 'timer' || effectiveTracking === 'duration' ? <Timer className="h-3.5 w-3.5" /> :
                effectiveTracking === 'count' ? <Hash className="h-3.5 w-3.5" /> :
                effectiveTracking === 'checklist' ? <ListChecks className="h-3.5 w-3.5" /> :
                <CheckCircle2 className="h-3.5 w-3.5" />
              } />
              <InfoItem label={isAr ? 'الهدف' : 'Target'} value={`${habit.targetValue ?? 1} ${habit.targetUnit ?? 'times'}`} icon={<Target className="h-3.5 w-3.5" />} />
              <InfoItem label={isAr ? 'الأولوية' : 'Priority'} value={habit.priority} icon={<Star className="h-3.5 w-3.5" />} />
              <InfoItem label={isAr ? 'الصعوبة' : 'Difficulty'} value={habit.difficulty} icon={<Activity className="h-3.5 w-3.5" />} />
              {habit.preferredTime && (
                <InfoItem label={isAr ? 'الوقت المفضل' : 'Preferred Time'} value={habit.preferredTime} icon={<Clock className="h-3.5 w-3.5" />} />
              )}
              {habitUsesTimerToLog(habit) && habit.expectedDuration && (
                <InfoItem label={isAr ? 'جلسة المؤقت' : 'Timer target'} value={formatDurationSecs(habit.expectedDuration)} icon={<Timer className="h-3.5 w-3.5" />} />
              )}
              {(habit.placeEn || habit.placeAr) && (
                <InfoItem label={isAr ? 'المكان' : 'Place'} value={isAr ? habit.placeAr || habit.placeEn || '' : habit.placeEn || habit.placeAr || ''} icon={<MapPin className="h-3.5 w-3.5" />} />
              )}
              <InfoItem label={isAr ? 'تاريخ الإنشاء' : 'Created'} value={new Date(habit.createdAt).toLocaleDateString(isAr ? 'ar-u-nu-latn' : 'en', { year: 'numeric', month: 'short', day: 'numeric' })} icon={<CalendarIcon className="h-3.5 w-3.5" />} />
              {habit.endDate && (
                <InfoItem label={isAr ? 'ينتهي في' : 'Ends on'} value={new Date(habit.endDate + 'T00:00:00').toLocaleDateString(isAr ? 'ar-u-nu-latn' : 'en', { year: 'numeric', month: 'short', day: 'numeric' })} icon={<Target className="h-3.5 w-3.5" />} />
              )}
            </div>
          </div>

          {/* Habit Loop */}
          {(habit.cueEn || habit.cueAr || habit.routineEn || habit.routineAr || habit.rewardEn || habit.rewardAr) && (
            <div className="rounded-2xl border border-[rgba(var(--color-primary-rgb)/0.18)] bg-[rgba(var(--color-background-rgb)/0.45)] backdrop-blur-xl p-4 sm:p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Repeat className="h-4 w-4 text-violet-500" />
                {isAr ? 'حلقة العادة' : 'Habit Loop'}
              </h3>
              <div className="grid gap-2">
                {(habit.cueEn || habit.cueAr) && (
                  <LoopItem emoji="🔔" label={isAr ? 'الإشارة' : 'Cue'} value={isAr ? habit.cueAr || habit.cueEn || '' : habit.cueEn || habit.cueAr || ''} />
                )}
                {(habit.routineEn || habit.routineAr) && (
                  <LoopItem emoji="⚡" label={isAr ? 'الروتين' : 'Routine'} value={isAr ? habit.routineAr || habit.routineEn || '' : habit.routineEn || habit.routineAr || ''} />
                )}
                {(habit.rewardEn || habit.rewardAr) && (
                  <LoopItem emoji="🎁" label={isAr ? 'المكافأة' : 'Reward'} value={isAr ? habit.rewardAr || habit.rewardEn || '' : habit.rewardEn || habit.rewardAr || ''} />
                )}
              </div>
            </div>
          )}

          {/* Weekly Performance */}
          <div className="rounded-2xl border border-[rgba(var(--color-primary-rgb)/0.18)] bg-[rgba(var(--color-background-rgb)/0.45)] backdrop-blur-xl p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              {isAr ? 'الأداء الأسبوعي' : 'Weekly Performance'}
            </h3>
            <div className="flex items-end gap-1 h-24">
              {stats.completionsByWeekday.map((count, i) => {
                const max = Math.max(...stats.completionsByWeekday, 1);
                const pct = (count / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct, 4)}%`, background: `linear-gradient(to top, ${habit.color}, ${habit.color}88)` }} />
                    <span className="text-[8px] text-[var(--foreground)]/40">{isAr ? DAY_NAMES.ar[i] : DAY_NAMES.en[i]}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--foreground)]/40">
              <span>{isAr ? 'أفضل يوم' : 'Best Day'}: <strong className="text-[var(--foreground)]/70">{stats.bestDay}</strong></span>
              <span>{isAr ? 'أضعف يوم' : 'Worst Day'}: <strong className="text-[var(--foreground)]/70">{stats.worstDay}</strong></span>
            </div>
          </div>

          {/* Mood Impact */}
          {(stats.averageMoodBefore > 0 || stats.averageMoodAfter > 0) && (
            <div className="rounded-2xl border border-[rgba(var(--color-primary-rgb)/0.18)] bg-[rgba(var(--color-background-rgb)/0.45)] backdrop-blur-xl p-4 sm:p-5 space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-pink-500" />
                {isAr ? 'تأثير المزاج' : 'Mood Impact'}
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{stats.averageMoodBefore.toFixed(1)}</p>
                  <p className="text-[9px] text-[var(--foreground)]/40">{isAr ? 'قبل' : 'Before'}</p>
                </div>
                <div className="text-[var(--foreground)]/20">→</div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-500">{stats.averageMoodAfter.toFixed(1)}</p>
                  <p className="text-[9px] text-[var(--foreground)]/40">{isAr ? 'بعد' : 'After'}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Calendar Component ──
// Check if a habit is scheduled for a specific date
function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
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
    if (habit.customScheduleType === 'weekdays' && habit.customDays?.length) {
      return habit.customDays.includes(d.getDay() as WeekDay);
    }
    if (habit.customScheduleType === 'monthdays' && habit.customMonthDays?.length) {
      return habit.customMonthDays.includes(d.getDate());
    }
    if (habit.customScheduleType === 'yeardays' && habit.customYearDays?.length) {
      return habit.customYearDays.some(yd => yd.month === d.getMonth() && yd.day === d.getDate());
    }
  }
  const scheduleDays = habit.scheduleDays ?? habit.customDays ?? [];
  const scheduleType = habit.scheduleType ?? 'daily';
  if (scheduleType === 'daily') return true;
  if ((scheduleType === 'custom' || scheduleType === 'weekly') && scheduleDays.length > 0) {
    return scheduleDays.includes(d.getDay() as WeekDay);
  }
  return true;
}

function HabitCalendar({
  calMonth, setCalMonth, logsByDate, historyByDate, habitLogs, selectedDate, setSelectedDate, isAr, habitColor, habit,
}: {
  calMonth: { year: number; month: number };
  setCalMonth: (m: { year: number; month: number }) => void;
  logsByDate: Record<string, HabitLog[]>;
  historyByDate: Record<string, HabitHistoryEntry[]>;
  habitLogs: HabitLog[];
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
  isAr: boolean;
  habitColor: string;
  habit?: Habit;
}) {
  const today = todayString();
  const hc = resolveHabitColor(habitColor);
  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(calMonth.year, calMonth.month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    setCalMonth(calMonth.month === 0
      ? { year: calMonth.year - 1, month: 11 }
      : { year: calMonth.year, month: calMonth.month - 1 });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCalMonth(calMonth.month === 11
      ? { year: calMonth.year + 1, month: 0 }
      : { year: calMonth.year, month: calMonth.month + 1 });
    setSelectedDate(null);
  };

  return (
    <div className="rounded-2xl border border-[rgba(var(--color-primary-rgb)/0.2)] bg-[rgba(var(--color-background-rgb)/0.5)] backdrop-blur-xl p-4 sm:p-5 shadow-[0_8px_40px_rgba(var(--color-primary-rgb)/0.06)]">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="h-9 w-9 rounded-xl flex items-center justify-center border border-[var(--foreground)]/[0.08] hover:bg-[var(--foreground)]/[0.06] transition-colors">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <h3 className="text-sm font-black tracking-tight">
          {isAr ? MONTH_NAMES.ar[calMonth.month] : MONTH_NAMES.en[calMonth.month]} {calMonth.year}
        </h3>
        <button type="button" onClick={nextMonth} className="h-9 w-9 rounded-xl flex items-center justify-center border border-[var(--foreground)]/[0.08] hover:bg-[var(--foreground)]/[0.06] transition-colors">
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {(isAr ? DAY_NAMES.ar : DAY_NAMES.en).map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-[var(--foreground)]/30 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for first week offset */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(day => {
          const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const logs = logsByDate[dateStr] || [];
          const repCount = habit ? getDoneRepCountForDate(habit, habitLogs, dateStr) : 0;
          const hasCompletion = repCount > 0;
          const hasPartial = logs.some(l => l.status === 'partial') && !hasCompletion;
          const hasSkipped = logs.some(l => l.status === 'skipped') && !hasCompletion && !hasPartial;
          const historyEntries = historyByDate[dateStr] || [];
          const hasHistory = historyEntries.length > 0;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > today;
          const isScheduled = habit ? isHabitScheduledForDate(habit, dateStr) : true;
          const showMultiRep = repCount > 1;

          return (
            <button
              type="button"
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              disabled={isFuture || !isScheduled}
              className={cn(
                'relative h-11 rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all overflow-hidden',
                !isScheduled && !hasCompletion ? 'bg-red-500/8 text-red-400/50 cursor-not-allowed' :
                isSelected ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)] bg-[rgba(var(--color-primary-rgb)/0.12)]' :
                isToday ? 'ring-2 ring-offset-1 font-black shadow-sm' :
                isFuture ? 'opacity-30 cursor-not-allowed' :
                'hover:bg-[var(--foreground)]/[0.05]',
              )}
              style={isToday && isScheduled && !isSelected ? { ['--tw-ring-color' as string]: hc } : undefined}
            >
              <span className={cn('relative z-[1]', hasCompletion && 'text-white font-bold drop-shadow-sm')}>
                {!isScheduled && !hasCompletion ? '✕' : day}
              </span>

              {hasCompletion && (
                <div className="absolute inset-0.5 rounded-lg -z-0" style={{ background: habitColor, opacity: 0.82 }} />
              )}
              {hasPartial && !hasCompletion && (
                <div className="absolute inset-0.5 rounded-lg -z-0 bg-amber-400/45" />
              )}
              {hasSkipped && !hasCompletion && !hasPartial && (
                <div className="absolute inset-0.5 rounded-lg -z-0 bg-gray-400/25" />
              )}

              {/* One bottom row: multi-rep badge and/or settings activity (no double blue dots) */}
              {(showMultiRep || hasHistory) && (
                <div className="absolute bottom-0.5 inset-x-0 z-[2] flex items-center justify-center gap-0.5 pointer-events-none">
                  {showMultiRep && (
                    <span className="min-w-[16px] px-0.5 rounded-full bg-blue-600 text-white text-[7px] font-black leading-tight shadow-sm">{repCount}×</span>
                  )}
                  {hasHistory && (
                    <span className="text-[8px] font-black text-violet-600 dark:text-violet-300 bg-violet-500/20 px-1 rounded" title={isAr ? 'تعديل إعدادات' : 'Settings edited'}>✎</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--foreground)]/[0.15] flex-wrap">
        <div className="flex items-center gap-1.5 text-[9px] text-[var(--foreground)]/50">
          <div className="h-3 w-3 rounded" style={{ background: habitColor, opacity: 0.75 }} />
          {isAr ? 'مكتملة' : 'Completed'}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-[var(--foreground)]/50">
          <div className="h-3 w-3 rounded bg-amber-400/40" />
          {isAr ? 'جزئية' : 'Partial'}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-[var(--foreground)]/50">
          <span className="text-[9px] font-black text-violet-600 bg-violet-500/15 px-1 rounded">✎</span>
          {isAr ? 'تعديل إعدادات' : 'Settings'}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-[var(--foreground)]/50">
          <span className="min-w-[14px] px-0.5 rounded-full bg-blue-600 text-white text-[7px] font-black text-center">2×</span>
          {isAr ? 'أكثر من جلسة' : 'Multi session'}
        </div>
        {habit && habit.frequency !== 'daily' && (
          <div className="flex items-center gap-1.5 text-[9px] text-[var(--foreground)]/50">
            <div className="h-3 w-3 rounded bg-red-500/8 text-red-400/50 text-[7px] font-black flex items-center justify-center">✕</div>
            {isAr ? 'غير مجدول' : 'N/A'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Utility Components ──
function StatBox({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="tasks-glass-stat-cell flex items-center gap-3 p-3 sm:p-4 border-e border-[rgba(var(--color-primary-rgb)/0.12)] last:border-e-0">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[rgba(var(--color-primary-rgb)/0.1)] border border-[rgba(var(--color-primary-rgb)/0.15)] shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-lg sm:text-xl font-black leading-tight tabular-nums">{value}{sub ? <span className="text-[10px] font-semibold text-[var(--foreground)]/45 ms-1">{sub}</span> : null}</p>
        <p className="text-[9px] sm:text-[10px] font-bold text-[var(--foreground)]/45 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--foreground)]/[0.03]">
      <div className="h-6 w-6 rounded flex items-center justify-center text-[var(--foreground)]/40 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] text-[var(--foreground)]/40">{label}</p>
        <p className="text-xs font-semibold truncate capitalize">{value}</p>
      </div>
    </div>
  );
}

function LoopItem({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--foreground)]/[0.03]">
      <span className="text-base">{emoji}</span>
      <div>
        <p className="text-[9px] font-bold text-[var(--foreground)]/40 uppercase">{label}</p>
        <p className="text-xs text-[var(--foreground)]/70 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

