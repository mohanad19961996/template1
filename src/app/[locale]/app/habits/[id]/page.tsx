'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import { HabitTimerControls } from '@/components/app/habit-timer-controls';
import { Habit, HabitHistoryEntry, HabitLog, WeekDay, todayString, resolveHabitColor, parseLocalDate, formatDurationSecs } from '@/types/app';
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, Flame, Target, Edit3, Archive,
  ChevronLeft, ChevronRight, Star, BarChart3, TrendingUp, Activity,
  MapPin, Repeat, Gift, Lightbulb, History, Eye, CheckCircle2, Circle,
  Pencil, Plus, RotateCcw, AlertCircle, Timer, Hash, Send, MessageSquare, Minus,
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
    if (habit.expectedDuration && isViewingToday) return; // timed habits — use timer for today
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <Link href="/app/habits" className="shrink-0 mt-1">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.1] transition-colors">
            <ArrowLeft className="h-4 w-4 text-[var(--foreground)]/60" />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
              style={{ background: `linear-gradient(135deg, ${habit.color}, ${habit.color}cc)` }}>
              {name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{name}</h1>
              <div className="flex items-center gap-2 text-xs text-[var(--foreground)]/50 mt-0.5">
                <span>{catLabel}</span>
                <span>·</span>
                <span>{freqLabel}</span>
                {habit.archived && (
                  <>
                    <span>·</span>
                    <span className="text-amber-500 font-semibold">{isAr ? 'مؤرشفة' : 'Archived'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {description && (
            <p className="text-sm text-[var(--foreground)]/60 mt-2">{description}</p>
          )}
        </div>
      </div>

      {/* ── Day Navigator: Timer + Check + Note + Logs ── */}
      <div className="app-card rounded-xl p-4 space-y-4">
        {/* Date navigation header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigateDay(-1)}
            className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05] transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <h3 className="text-sm font-bold flex items-center gap-2 justify-center">
              <CalendarIcon className="h-4 w-4 text-[var(--color-primary)]" />
              {formatViewingDate(viewingDate)}
            </h3>
            <p className="text-[10px] text-[var(--foreground)]/40 mt-0.5">{viewingDate}</p>
          </div>
          <button onClick={() => navigateDay(1)}
            disabled={isViewingToday}
            className={cn('h-9 w-9 rounded-lg flex items-center justify-center transition-colors',
              isViewingToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--foreground)]/[0.05]')}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Quick jump to today */}
        {!isViewingToday && (
          <button onClick={() => setViewingDate(today)}
            className="w-full text-center text-[10px] font-semibold text-[var(--color-primary)] hover:underline py-1">
            {isAr ? '← الذهاب لليوم' : '← Jump to Today'}
          </button>
        )}

        {/* Completion status */}
        {(() => {
          const hasDuration = !!habit.expectedDuration;
          const isCount = habit.trackingType === 'count';
          const isBooleanHabit = !hasDuration && !isCount;

          // Time window checks (only for today)
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const inWindow = !habit.windowStart || !habit.windowEnd || (currentTime >= habit.windowStart && currentTime <= habit.windowEnd);
          const windowExpired = habit.windowStart && habit.windowEnd && currentTime > habit.windowEnd;
          const strictLocked = isViewingToday && habit.strictWindow && habit.windowStart && habit.windowEnd && windowExpired && !viewingDateDone;
          const strictNotYet = isViewingToday && habit.strictWindow && habit.windowStart && habit.windowEnd && !inWindow && !windowExpired && !viewingDateDone;
          const isBooleanBefore9pm = isViewingToday && isBooleanHabit && !viewingDateDone && now.getHours() < 21;
          const isTimerHabit = isViewingToday && hasDuration && !viewingDateDone;

          const isDisabled = !!strictLocked || !!strictNotYet || isBooleanBefore9pm || isTimerHabit;

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
            } else if (isTimerHabit) {
              toast.notifyInfo(
                isAr ? 'استخدم المؤقت' : 'Use the timer',
                isAr ? `هذه العادة تحتاج مؤقت (${formatDurationSecs(habit.expectedDuration!)}) لإكمالها` : `This habit requires the timer (${formatDurationSecs(habit.expectedDuration!)}) to complete`
              );
            } else {
              handleToggleDay();
            }
          };

          return (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--foreground)]/50">
                {isAr ? 'حالة الإنجاز' : 'Completion Status'}
              </span>
              <button onClick={handleClick}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  viewingDateDone
                    ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                    : isDisabled
                      ? 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/40 cursor-not-allowed'
                      : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'
                )}>
                {viewingDateDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {viewingDateDone
                  ? (isAr ? 'مكتملة — تراجع' : 'Done — Undo')
                  : isBooleanBefore9pm
                    ? (isAr ? 'متاح بعد ٩ مساءً' : 'After 9 PM')
                    : strictNotYet
                      ? (isAr ? `متاح من ${to12h(habit.windowStart!)}` : `From ${to12h(habit.windowStart!)}`)
                      : strictLocked
                        ? (isAr ? 'فات الوقت' : 'Window Passed')
                        : isTimerHabit
                          ? (isAr ? 'استخدم المؤقت' : 'Use Timer')
                          : (isAr ? 'تسجيل إنجاز' : 'Mark Done')}
              </button>
            </div>
          );
        })()}

        {/* Timer info for timed habits */}
        {isViewingToday && habit.expectedDuration && (
          <div className="p-3 rounded-xl bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.15]">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-[var(--foreground)]/40" />
              <span className="text-xs font-medium text-[var(--foreground)]/50">
                {isAr ? `المؤقت: ${formatDurationSecs(habit.expectedDuration!)} — استخدم بطاقة العادة للتسجيل` : `Timer: ${formatDurationSecs(habit.expectedDuration!)} — use the habit card to log`}
              </span>
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
                    {log.duration && <span className="text-[var(--foreground)]/40">{log.duration}m</span>}
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

        {/* Changes for this day */}
        {viewingDateHistory.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[var(--foreground)]/[0.15]">
            <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">{isAr ? 'التغييرات' : 'Changes'}</p>
            {viewingDateHistory.map(entry => {
              const info = CHANGE_TYPE_LABELS[entry.changeType] || CHANGE_TYPE_LABELS.edited;
              return (
                <div key={entry.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/[0.04]">
                  <div className={cn('h-6 w-6 rounded-full flex items-center justify-center shrink-0', info.color)}>
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-semibold">{isAr ? info.ar : info.en}</p>
                    <p className="text-[10px] text-[var(--foreground)]/40">
                      {new Date(entry.timestamp).toLocaleTimeString(isAr ? 'ar-u-nu-latn' : 'en', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {Object.keys(entry.changes).length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {Object.entries(entry.changes).map(([field, diff]) => {
                          const label = FIELD_LABELS[field] ? (isAr ? FIELD_LABELS[field].ar : FIELD_LABELS[field].en) : field;
                          return (
                            <p key={field} className="text-[10px] text-[var(--foreground)]/50">
                              <span className="font-medium">{label}:</span>{' '}
                              <span className="line-through text-red-400">{formatValue(diff.from)}</span>{' → '}
                              <span className="text-emerald-500">{formatValue(diff.to)}</span>
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
              className="flex-1 rounded-xl border border-[var(--foreground)]/[0.18] bg-[var(--foreground)]/[0.02] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 placeholder:text-[var(--foreground)]/30"
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

      {/* ── Quick Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon={<Flame className="h-4 w-4 text-orange-500" />} label={isAr ? 'السلسلة الحالية' : 'Current Streak'} value={`${streak.current}`} sub={isAr ? 'أيام' : 'days'} />
        <StatBox icon={<Star className="h-4 w-4 text-yellow-500" />} label={isAr ? 'أفضل سلسلة' : 'Best Streak'} value={`${streak.best}`} sub={isAr ? 'أيام' : 'days'} />
        <StatBox icon={<Target className="h-4 w-4 text-emerald-500" />} label={isAr ? 'معدل الإنجاز' : 'Completion Rate'} value={`${stats.completionRate}%`} />
        <StatBox icon={<CheckCircle2 className="h-4 w-4 text-blue-500" />} label={isAr ? 'إجمالي الإنجازات' : 'Total Completions'} value={`${stats.totalCompletions}`} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--foreground)]/[0.05] border border-[var(--foreground)]/[0.15]">
        {[
          { key: 'calendar' as const, icon: CalendarIcon, labelEn: 'Calendar', labelAr: 'التقويم' },
          { key: 'history' as const, icon: History, labelEn: 'History', labelAr: 'السجل' },
          { key: 'stats' as const, icon: BarChart3, labelEn: 'Details', labelAr: 'التفاصيل' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === tab.key
                ? 'bg-[var(--color-background)] text-[var(--color-primary)] shadow-sm'
                : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]/70')}>
            <tab.icon className="h-3.5 w-3.5" />
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* ── Calendar Tab ── */}
      {activeTab === 'calendar' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <HabitCalendar
            calMonth={calMonth}
            setCalMonth={setCalMonth}
            logsByDate={logsByDate}
            historyByDate={historyByDate}
            selectedDate={selectedDate}
            setSelectedDate={(d) => { setSelectedDate(d); if (d) setViewingDate(d); }}
            isAr={isAr}
            habitColor={habit.color}
            habit={habit}
          />

          {/* Selected day details */}
          <AnimatePresence mode="wait">
            {selectedDate && (
              <motion.div key={selectedDate} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="app-card rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-[var(--color-primary)]" />
                  {selectedDate}
                </h3>

                {/* Logs for this day */}
                {logsByDate[selectedDate] && logsByDate[selectedDate].length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">{isAr ? 'السجلات' : 'Logs'}</p>
                    {logsByDate[selectedDate].map(log => (
                      <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--foreground)]/[0.03]">
                        {log.completed
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          : <Circle className="h-4 w-4 text-[var(--foreground)]/30 shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium">{log.time}</span>
                            {log.status && <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold',
                              log.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                              log.status === 'partial' ? 'bg-amber-500/10 text-amber-600' :
                              log.status === 'skipped' ? 'bg-gray-500/10 text-gray-600' :
                              'bg-red-500/10 text-red-600'
                            )}>{log.status}</span>}
                            {log.duration && <span className="text-[var(--foreground)]/40">{log.duration}m</span>}
                          </div>
                          {log.note && <p className="text-[10px] text-[var(--foreground)]/50 mt-0.5 truncate">{log.note}</p>}
                        </div>
                        {log.moodAfter && (
                          <div className="text-xs text-[var(--foreground)]/40">{['😞','😐','🙂','😊','🤩'][log.moodAfter - 1]}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--foreground)]/40 italic">{isAr ? 'لا توجد سجلات في هذا اليوم' : 'No logs for this day'}</p>
                )}

                {/* History entries for this day */}
                {historyByDate[selectedDate] && historyByDate[selectedDate].length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--foreground)]/[0.15]">
                    <p className="text-[10px] font-bold text-[var(--foreground)]/40 uppercase tracking-wider">{isAr ? 'التغييرات' : 'Changes'}</p>
                    {historyByDate[selectedDate].map(entry => {
                      const info = CHANGE_TYPE_LABELS[entry.changeType] || CHANGE_TYPE_LABELS.edited;
                      return (
                        <div key={entry.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/[0.04]">
                          <div className={cn('h-6 w-6 rounded-full flex items-center justify-center shrink-0', info.color)}>
                            {info.icon}
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-semibold">{isAr ? info.ar : info.en}</p>
                            <p className="text-[10px] text-[var(--foreground)]/40">
                              {new Date(entry.timestamp).toLocaleTimeString(isAr ? 'ar-u-nu-latn' : 'en', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {Object.keys(entry.changes).length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {Object.entries(entry.changes).map(([field, diff]) => {
                                  const label = FIELD_LABELS[field] ? (isAr ? FIELD_LABELS[field].ar : FIELD_LABELS[field].en) : field;
                                  return (
                                    <p key={field} className="text-[10px] text-[var(--foreground)]/50">
                                      <span className="font-medium">{label}:</span>{' '}
                                      <span className="line-through text-red-400">{formatValue(diff.from)}</span>{' → '}
                                      <span className="text-emerald-500">{formatValue(diff.to)}</span>
                                    </p>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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

                    <div className="flex-1 min-w-0 app-card rounded-xl p-3">
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
                                <span className="text-red-400 line-through truncate max-w-[120px]">{formatValue(diff.from)}</span>
                                <span className="text-[var(--foreground)]/30">→</span>
                                <span className="text-emerald-500 truncate max-w-[120px]">{formatValue(diff.to)}</span>
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
          {/* Viewing date banner */}
          <div className="app-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={() => navigateDay(-1)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05] transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <h3 className="text-sm font-bold flex items-center gap-2 justify-center">
                  <CalendarIcon className="h-4 w-4 text-[var(--color-primary)]" />
                  {formatViewingDate(viewingDate)}
                </h3>
                <p className="text-[10px] text-[var(--foreground)]/40 mt-0.5">{viewingDate}</p>
              </div>
              <button onClick={() => navigateDay(1)}
                disabled={isViewingToday}
                className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                  isViewingToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--foreground)]/[0.05]')}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {!isViewingToday && (
              <button onClick={() => setViewingDate(today)}
                className="w-full text-center text-[10px] font-semibold text-[var(--color-primary)] hover:underline">
                {isAr ? '← الذهاب لليوم' : '← Jump to Today'}
              </button>
            )}
            {/* Day status summary */}
            <div className="flex items-center justify-center gap-3 py-2 rounded-lg bg-[var(--foreground)]/[0.03]">
              {viewingDateDone ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> {isAr ? 'مكتملة' : 'Completed'}
                </span>
              ) : viewingDateLogs.length > 0 ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <Circle className="h-4 w-4" /> {isAr ? 'جزئية' : 'Partial'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)]/40">
                  <Circle className="h-4 w-4" /> {isAr ? 'لم يتم' : 'Not done'}
                </span>
              )}
              {viewingDateLogs.some(l => l.duration) && (
                <span className="text-xs text-[var(--foreground)]/50">
                  <Timer className="h-3 w-3 inline mr-1" />
                  {viewingDateLogs.reduce((sum, l) => sum + (l.duration || 0), 0)}{isAr ? ' دقيقة' : ' min'}
                </span>
              )}
              {viewingDateLog?.note && (
                <span className="text-xs text-[var(--foreground)]/50">
                  <MessageSquare className="h-3 w-3 inline mr-1" />
                  {isAr ? 'ملاحظة' : 'Note'}
                </span>
              )}
            </div>
            {/* Day's logs */}
            {viewingDateLogs.length > 0 && (
              <div className="space-y-1.5">
                {viewingDateLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--foreground)]/[0.03]">
                    {log.completed
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      : <Circle className="h-3.5 w-3.5 text-[var(--foreground)]/30 shrink-0" />}
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-medium">{log.time}</span>
                      {log.duration && <span className="text-[var(--foreground)]/40 ml-2">{log.duration}m</span>}
                      {log.note && <p className="text-[10px] text-[var(--foreground)]/50 mt-0.5 truncate">{log.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Habit Info */}
          <div className="app-card rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-primary)]" />
              {isAr ? 'معلومات العادة' : 'Habit Info'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label={isAr ? 'نوع التتبع' : 'Tracking'} value={habit.trackingType || 'boolean'} icon={
                habit.trackingType === 'timer' ? <Timer className="h-3.5 w-3.5" /> :
                habit.trackingType === 'count' ? <Hash className="h-3.5 w-3.5" /> :
                <CheckCircle2 className="h-3.5 w-3.5" />
              } />
              <InfoItem label={isAr ? 'الهدف' : 'Target'} value={`${habit.targetValue ?? 1} ${habit.targetUnit ?? 'times'}`} icon={<Target className="h-3.5 w-3.5" />} />
              <InfoItem label={isAr ? 'الأولوية' : 'Priority'} value={habit.priority} icon={<Star className="h-3.5 w-3.5" />} />
              <InfoItem label={isAr ? 'الصعوبة' : 'Difficulty'} value={habit.difficulty} icon={<Activity className="h-3.5 w-3.5" />} />
              {habit.preferredTime && (
                <InfoItem label={isAr ? 'الوقت المفضل' : 'Preferred Time'} value={habit.preferredTime} icon={<Clock className="h-3.5 w-3.5" />} />
              )}
              {habit.expectedDuration && (
                <InfoItem label={isAr ? 'المدة المتوقعة' : 'Duration'} value={formatDurationSecs(habit.expectedDuration!)} icon={<Timer className="h-3.5 w-3.5" />} />
              )}
              {(habit.placeEn || habit.placeAr) && (
                <InfoItem label={isAr ? 'المكان' : 'Place'} value={isAr ? habit.placeAr || habit.placeEn || '' : habit.placeEn || habit.placeAr || ''} icon={<MapPin className="h-3.5 w-3.5" />} />
              )}
              <InfoItem label={isAr ? 'تاريخ الإنشاء' : 'Created'} value={new Date(habit.createdAt).toLocaleDateString(isAr ? 'ar-u-nu-latn' : 'en', { year: 'numeric', month: 'short', day: 'numeric' })} icon={<CalendarIcon className="h-3.5 w-3.5" />} />
            </div>
          </div>

          {/* Habit Loop */}
          {(habit.cueEn || habit.cueAr || habit.routineEn || habit.routineAr || habit.rewardEn || habit.rewardAr) && (
            <div className="app-card rounded-xl p-4 space-y-3">
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
          <div className="app-card rounded-xl p-4 space-y-3">
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
            <div className="app-card rounded-xl p-4 space-y-2">
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
  calMonth, setCalMonth, logsByDate, historyByDate, selectedDate, setSelectedDate, isAr, habitColor, habit,
}: {
  calMonth: { year: number; month: number };
  setCalMonth: (m: { year: number; month: number }) => void;
  logsByDate: Record<string, HabitLog[]>;
  historyByDate: Record<string, HabitHistoryEntry[]>;
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
    <div className="app-card rounded-xl p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05] transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-bold">
          {isAr ? MONTH_NAMES.ar[calMonth.month] : MONTH_NAMES.en[calMonth.month]} {calMonth.year}
        </h3>
        <button onClick={nextMonth} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/[0.05] transition-colors">
          <ChevronRight className="h-4 w-4" />
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
          const hasCompletion = logs.some(l => l.completed);
          const hasPartial = logs.some(l => l.status === 'partial');
          const hasSkipped = logs.some(l => l.status === 'skipped');
          const hasHistory = !!historyByDate[dateStr];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > today;
          const isScheduled = habit ? isHabitScheduledForDate(habit, dateStr) : true;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              disabled={isFuture || !isScheduled}
              className={cn(
                'relative h-10 rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all',
                !isScheduled && !hasCompletion ? 'bg-red-500/8 text-red-400/50 cursor-not-allowed' :
                isSelected ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/10' :
                isToday ? 'ring-2 ring-offset-1 font-black shadow-sm' :
                isFuture ? 'opacity-30 cursor-not-allowed' :
                'hover:bg-[var(--foreground)]/[0.05]',
              )}
              style={isToday && isScheduled && !isSelected ? { ['--tw-ring-color' as string]: hc } : undefined}
            >
              <span className={cn(
                hasCompletion && 'text-white font-bold',
              )}>
                {!isScheduled && !hasCompletion ? '✕' : day}
              </span>

              {/* Completion dot */}
              {hasCompletion && (
                <div className="absolute inset-1 rounded-md -z-10" style={{ background: habitColor, opacity: 0.75 }} />
              )}
              {hasPartial && !hasCompletion && (
                <div className="absolute inset-1 rounded-md -z-10 bg-amber-400/40" />
              )}
              {hasSkipped && !hasCompletion && !hasPartial && (
                <div className="absolute inset-1 rounded-md -z-10 bg-gray-400/20" />
              )}

              {/* Edit/change marker */}
              {hasHistory && (
                <div className="absolute top-0.5 end-0.5 h-2 w-2 rounded-full bg-blue-500 border border-[var(--color-background)]" />
              )}

              {/* Bottom dots for multiple logs */}
              {logs.length > 1 && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {logs.slice(0, 3).map((_, idx) => (
                    <div key={idx} className="h-1 w-1 rounded-full bg-[var(--foreground)]/30" />
                  ))}
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
          <div className="relative h-3 w-3 rounded border border-[var(--foreground)]/10">
            <div className="absolute top-0 end-0 h-1.5 w-1.5 rounded-full bg-blue-500 -translate-y-0.5 translate-x-0.5" />
          </div>
          {isAr ? 'تم التعديل' : 'Edited'}
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
    <div className="app-card rounded-xl p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-[var(--foreground)]/[0.05] shrink-0">{icon}</div>
      <div>
        <p className="text-lg font-bold leading-tight">{value} {sub && <span className="text-[10px] font-normal text-[var(--foreground)]/40">{sub}</span>}</p>
        <p className="text-[9px] text-[var(--foreground)]/50">{label}</p>
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

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? '✓' : '✗';
  if (typeof val === 'string' && val.length > 40) return val.slice(0, 40) + '…';
  if (Array.isArray(val)) return val.join(', ') || '—';
  return String(val);
}
