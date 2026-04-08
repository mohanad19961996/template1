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
  ChevronLeft, ChevronRight, Star, Activity,
  MapPin, Repeat, CheckCircle2, Circle,
  Pencil, Plus, RotateCcw, AlertCircle, Timer, Hash, Send, MessageSquare, ListChecks, ChevronDown,
} from 'lucide-react';
import { useToast } from '@/components/app/toast-notifications';

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
  targetValue: { en: 'Target Value', ar: 'القيمة المستهدفة' }, targetUnit: { en: 'Target Unit', ar: 'وحدة القياس' },
  scheduleType: { en: 'Schedule', ar: 'الجدول' }, scheduleDays: { en: 'Schedule Days', ar: 'أيام الجدول' },
  archived: { en: 'Archived', ar: 'مؤرشفة' }, image: { en: 'Image', ar: 'الصورة' },
  preferredTime: { en: 'Preferred Time', ar: 'الوقت المفضل' }, expectedDuration: { en: 'Expected Duration', ar: 'المدة المتوقعة' },
  placeEn: { en: 'Place', ar: 'المكان' }, placeAr: { en: 'Place (AR)', ar: 'المكان (عربي)' },
  cueEn: { en: 'Cue', ar: 'الإشارة' }, routineEn: { en: 'Routine', ar: 'الروتين' }, rewardEn: { en: 'Reward', ar: 'المكافأة' },
  reminderEnabled: { en: 'Reminder', ar: 'التذكير' }, reminderTime: { en: 'Reminder Time', ar: 'وقت التذكير' },
  windowStart: { en: 'Window Start', ar: 'بداية النافذة' }, windowEnd: { en: 'Window End', ar: 'نهاية النافذة' },
  allowPartial: { en: 'Allow Partial', ar: 'السماح بالجزئي' }, allowSkip: { en: 'Allow Skip', ar: 'السماح بالتخطي' },
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
function formatHistoryDisplayValue(field: string, val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? '✓' : '✗';
  if (field === 'expectedDuration' && typeof val === 'number' && val > 0) return formatDurationSecs(val);
  if (typeof val === 'string' && val.length > 48) return val.slice(0, 48) + '...';
  if (Array.isArray(val)) return val.join(', ') || '—';
  return String(val);
}

// ── Shared styles ──
const cardBase = 'rounded-2xl border border-[rgba(var(--color-primary-rgb)/0.15)] bg-[var(--color-background)]';
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

  // Fetch history
  useEffect(() => {
    if (!habitId) return;
    setLoadingHistory(true);
    fetch(`/api/habits/${habitId}/history`)
      .then(r => r.json()).then(data => { if (data.data) setHistory(data.data); })
      .catch(() => {}).finally(() => setLoadingHistory(false));
  }, [habitId]);

  // Deduplicated logs
  const habitLogs = useMemo(() => {
    const raw = store.habitLogs.filter(l => l.habitId === habitId);
    const seen = new Set<string>();
    return raw.filter(l => {
      const key = `${l.date}|${l.time}|${l.duration ?? 0}|${l.completed}|${l.source ?? ''}`;
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

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-8 space-y-5">
      {/* ═══ 1. Header ═══ */}
      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className={cn(cardBase, 'px-4 sm:px-6 py-4 sm:py-5')}>
        <div className="flex items-start gap-3">
          <Link href="/app/habits" className={cn(btnBase, 'shrink-0 h-10 w-10')}>
            <ArrowLeft className="h-[18px] w-[18px] text-[var(--foreground)]/70 rtl:rotate-180" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="h-3.5 w-3.5 rounded-full shrink-0 ring-2 ring-white/30 shadow" style={{ background: habit.color }} />
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-[var(--foreground)] truncate">{name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn(badge, 'bg-[rgba(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)] border-[rgba(var(--color-primary-rgb)/0.2)]')}>{catLabel}</span>
              <span className={cn(badge, 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/60 border-[var(--foreground)]/[0.1]')}>{freqLabel}</span>
              <span className={cn(badge, 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50 border-[var(--foreground)]/[0.08]')}>{trackingLabel}</span>
              {habit.archived && (
                <span className={cn(badge, 'bg-amber-500/10 text-amber-600 border-amber-500/20')}>{isAr ? 'مؤرشفة' : 'Archived'}</span>
              )}
            </div>
            {description && <p className="text-xs sm:text-sm text-[var(--foreground)]/50 mt-2 leading-relaxed line-clamp-2">{description}</p>}
          </div>
        </div>
      </motion.header>

      {/* ═══ 2. Stats Row ═══ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.35 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox icon={<Flame className="h-4 w-4 text-orange-500" />} label={isAr ? 'السلسلة' : 'Streak'} value={`${streak.current}`} sub={isAr ? 'أيام' : 'days'} />
        <StatBox icon={<Star className="h-4 w-4 text-yellow-500" />} label={isAr ? 'أفضل' : 'Best'} value={`${streak.best}`} sub={isAr ? 'أيام' : 'days'} />
        <StatBox icon={<Target className="h-4 w-4 text-emerald-500" />} label={isAr ? 'الالتزام' : 'Rate'} value={`${stats.completionRate}%`} />
        <StatBox icon={<CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" />} label={isAr ? 'الإنجازات' : 'Total'} value={`${stats.totalCompletions}`} />
      </motion.div>

      {/* ═══ 3. Main Content — 2 Column Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* LEFT: Calendar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.35 }}>
          <HabitCalendar calMonth={calMonth} setCalMonth={setCalMonth} logsByDate={logsByDate}
            historyByDate={historyByDate} habitLogs={habitLogs} selectedDate={selectedDate}
            setSelectedDate={(d) => { setSelectedDate(d); if (d) setViewingDate(d); }}
            isAr={isAr} habitColor={habit.color} habit={habit} today={today} />
        </motion.div>

        {/* RIGHT: Day Detail Panel */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}
          className={cn(cardBase, 'p-4 sm:p-5 space-y-4 self-start')}>
          {/* Date nav */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigateDay(-1)} className={cn(btnBase, 'h-8 w-8')}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <div className="text-center">
              <h3 className="text-sm font-bold flex items-center gap-1.5 justify-center">
                <CalendarIcon className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                {formatViewingDate(viewingDate)}
              </h3>
              <p className="text-[10px] text-[var(--foreground)]/35 mt-0.5 tabular-nums">{viewingDate}</p>
            </div>
            <button type="button" onClick={() => navigateDay(1)} disabled={isViewingToday}
              className={cn(btnBase, 'h-8 w-8', isViewingToday && 'opacity-30 cursor-not-allowed hover:bg-transparent')}>
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>

          {!isViewingToday && (
            <button onClick={() => setViewingDate(today)}
              className="w-full text-center text-[10px] font-semibold text-[var(--color-primary)] hover:underline py-0.5">
              {isAr ? '← الذهاب لليوم' : '← Jump to Today'}
            </button>
          )}

          {/* Completion status + mark done */}
          <CompletionAction habit={habit} effectiveTracking={effectiveTracking} isViewingToday={isViewingToday}
            viewingDateDone={viewingDateDone} viewingDate={viewingDate} handleToggleDay={handleToggleDay}
            isAr={isAr} toast={toast} dailyNote={dailyNote} />

          {/* Logs for this day */}
          <DayLogs habitId={habitId} viewingDate={viewingDate} viewingDateLogs={viewingDateLogs}
            store={store} isAr={isAr} />

          {/* Settings changes */}
          {viewingDateHistory.length > 0 && (
            <SettingsChanges entries={viewingDateHistory} isAr={isAr} />
          )}

          {/* Daily note */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-3.5 w-3.5 text-[var(--foreground)]/35" />
              <span className="text-xs font-medium text-[var(--foreground)]/45">{isAr ? 'ملاحظة اليوم' : 'Daily Note'}</span>
            </div>
            <div className="flex gap-2">
              <textarea value={dailyNote} onChange={e => setDailyNote(e.target.value)}
                placeholder={isAr ? 'اكتب ملاحظة عن هذا اليوم...' : 'Write a note about this day...'}
                className="flex-1 rounded-xl px-3 py-2 text-sm resize-none bg-[var(--foreground)]/[0.03] border border-[rgba(var(--color-primary-rgb)/0.12)] placeholder:text-[var(--foreground)]/25 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                rows={2} />
              <button onClick={handleSaveNote} disabled={savingNote}
                className={cn(btnBase, 'shrink-0 h-10 w-10 self-end',
                  dailyNote.trim() ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:opacity-90' : 'text-[var(--foreground)]/30')}>
                {savingNote ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isViewingToday && viewingDateLogs.length === 0 && viewingDateHistory.length === 0 && !dailyNote.trim() && (
            <p className="text-xs text-[var(--foreground)]/35 italic text-center py-2">{isAr ? 'لا توجد بيانات لهذا اليوم' : 'No data for this day'}</p>
          )}
        </motion.div>
      </div>

      {/* ═══ 4. Habit Info (collapsible) ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className={cn(cardBase, 'overflow-hidden')}>
        <button type="button" onClick={() => setInfoOpen(!infoOpen)}
          className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 hover:bg-[rgba(var(--color-primary-rgb)/0.04)] transition-colors">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="text-sm font-bold">{isAr ? 'معلومات العادة' : 'Habit Info'}</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-[var(--foreground)]/40 transition-transform duration-200', infoOpen && 'rotate-180')} />
        </button>
        {infoOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.25 }}
            className="px-4 sm:px-6 pb-4 sm:pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[rgba(var(--color-primary-rgb)/0.1)]">
              <InfoItem label={isAr ? 'نوع التتبع' : 'Tracking'} value={trackingLabel} icon={
                effectiveTracking === 'timer' || effectiveTracking === 'duration' ? <Timer className="h-3.5 w-3.5" /> :
                effectiveTracking === 'count' ? <Hash className="h-3.5 w-3.5" /> :
                effectiveTracking === 'checklist' ? <ListChecks className="h-3.5 w-3.5" /> :
                <CheckCircle2 className="h-3.5 w-3.5" />} />
              <InfoItem label={isAr ? 'الهدف' : 'Target'} value={`${habit.targetValue ?? 1} ${habit.targetUnit ?? 'times'}`} icon={<Target className="h-3.5 w-3.5" />} />
              <InfoItem label={isAr ? 'الأولوية' : 'Priority'} value={habit.priority} icon={<Star className="h-3.5 w-3.5" />} />
              <InfoItem label={isAr ? 'الصعوبة' : 'Difficulty'} value={habit.difficulty} icon={<Activity className="h-3.5 w-3.5" />} />
              {habit.preferredTime && <InfoItem label={isAr ? 'الوقت المفضل' : 'Preferred Time'} value={habit.preferredTime} icon={<Clock className="h-3.5 w-3.5" />} />}
              {habitUsesTimerToLog(habit) && habit.expectedDuration && (
                <InfoItem label={isAr ? 'جلسة المؤقت' : 'Timer target'} value={formatDurationSecs(habit.expectedDuration)} icon={<Timer className="h-3.5 w-3.5" />} />
              )}
              {(habit.placeEn || habit.placeAr) && (
                <InfoItem label={isAr ? 'المكان' : 'Place'} value={isAr ? habit.placeAr || habit.placeEn || '' : habit.placeEn || habit.placeAr || ''} icon={<MapPin className="h-3.5 w-3.5" />} />
              )}
              {(habit.windowStart || habit.windowEnd) && (
                <InfoItem label={isAr ? 'نافذة الوقت' : 'Time Window'}
                  value={`${habit.windowStart ? to12h(habit.windowStart) : '—'} - ${habit.windowEnd ? to12h(habit.windowEnd) : '—'}`}
                  icon={<Clock className="h-3.5 w-3.5" />} />
              )}
              <InfoItem label={isAr ? 'تاريخ الإنشاء' : 'Created'}
                value={new Date(habit.createdAt).toLocaleDateString(isAr ? 'ar-u-nu-latn' : 'en', { year: 'numeric', month: 'short', day: 'numeric' })}
                icon={<CalendarIcon className="h-3.5 w-3.5" />} />
              {habit.endDate && (
                <InfoItem label={isAr ? 'ينتهي في' : 'Ends on'}
                  value={new Date(habit.endDate + 'T00:00:00').toLocaleDateString(isAr ? 'ar-u-nu-latn' : 'en', { year: 'numeric', month: 'short', day: 'numeric' })}
                  icon={<Target className="h-3.5 w-3.5" />} />
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ═══ 5. Habit Loop ═══ */}
      {(habit.cueEn || habit.cueAr || habit.routineEn || habit.routineAr || habit.rewardEn || habit.rewardAr) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className={cn(cardBase, 'p-4 sm:p-6 space-y-3')}>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Repeat className="h-4 w-4 text-violet-500" />
            {isAr ? 'حلقة العادة' : 'Habit Loop'}
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {(habit.cueEn || habit.cueAr) && <LoopItem emoji="🔔" label={isAr ? 'الإشارة' : 'Cue'} value={isAr ? habit.cueAr || habit.cueEn || '' : habit.cueEn || habit.cueAr || ''} />}
            {(habit.routineEn || habit.routineAr) && <LoopItem emoji="⚡" label={isAr ? 'الروتين' : 'Routine'} value={isAr ? habit.routineAr || habit.routineEn || '' : habit.routineEn || habit.routineAr || ''} />}
            {(habit.rewardEn || habit.rewardAr) && <LoopItem emoji="🎁" label={isAr ? 'المكافأة' : 'Reward'} value={isAr ? habit.rewardAr || habit.rewardEn || '' : habit.rewardEn || habit.rewardAr || ''} />}
          </div>
        </motion.div>
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
  const daySessions = store.timerSessions.filter(s => s.habitId === habitId && s.startedAt?.startsWith(viewingDate));
  if (viewingDateLogs.length === 0 && daySessions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-[var(--foreground)]/35 uppercase tracking-wider">{isAr ? 'السجلات' : 'Logs'}</p>
      {viewingDateLogs.map(log => {
        const matchedSession = log.source === 'timer' && log.duration
          ? daySessions.find(s => Math.abs(s.duration - (log.duration ?? 0)) < 5) : null;
        const startEvent = matchedSession?.events?.find(e => e.action === 'start');
        const finishEvent = matchedSession?.events?.find(e => e.action === 'finish' || e.action === 'cancel');
        const startTime = startEvent ? new Date(startEvent.at).toLocaleTimeString(isAr ? 'ar-u-nu-latn' : 'en', { hour: '2-digit', minute: '2-digit' }) : null;
        const endTime = finishEvent ? new Date(finishEvent.at).toLocaleTimeString(isAr ? 'ar-u-nu-latn' : 'en', { hour: '2-digit', minute: '2-digit' }) : null;
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
                  const time = new Date(ev.at).toLocaleTimeString(isAr ? 'ar-u-nu-latn' : 'en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
                const time = new Date(ev.at).toLocaleTimeString(isAr ? 'ar-u-nu-latn' : 'en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
    <details className="group border-t border-[rgba(var(--color-primary-rgb)/0.1)] pt-2">
      <summary className="flex cursor-pointer items-center justify-between gap-2 py-2 text-xs font-bold text-[var(--foreground)]/50 list-none [&::-webkit-details-marker]:hidden hover:text-[var(--foreground)]/70 transition-colors">
        <span className="flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          {isAr ? 'تحديثات إعدادات العادة هذا اليوم' : 'Habit settings updated this day'}
        </span>
        <ChevronRight className="h-4 w-4 text-[var(--foreground)]/30 transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:-rotate-90" />
      </summary>
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
                    {new Date(entry.timestamp).toLocaleTimeString(isAr ? 'ar-u-nu-latn' : 'en', { hour: '2-digit', minute: '2-digit' })}
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
                        <span className="line-through decoration-red-400/50 text-red-400/70">{formatHistoryDisplayValue(field, diff.from)}</span>
                        <span className="text-[var(--foreground)]/30 mx-1">-&gt;</span>
                        <span className="text-emerald-500 font-medium">{formatHistoryDisplayValue(field, diff.to)}</span>
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
          const isMissed = !hasCompletion && dateStr < today && isHabitScheduledForDate(habit, dateStr);
          const hasHistory = (historyByDate[dateStr] || []).length > 0;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > today;
          const isScheduled = isHabitScheduledForDate(habit, dateStr);
          const hasLateCompletion = hasCompletion && habit.strictWindow && habit.windowStart && habit.windowEnd && logs.some(l => l.completed && l.time && (l.time < habit.windowStart! || l.time > habit.windowEnd!));

          return (
            <button type="button" key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              disabled={isFuture && !hasCompletion}
              className={cn(
                'relative h-11 rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all duration-150 overflow-hidden',
                isSelected ? 'text-white font-bold shadow-lg scale-[1.02]'
                : isToday ? 'font-black'
                : isFuture || (!isScheduled && !hasCompletion) ? 'opacity-35 cursor-default'
                : 'hover:bg-[rgba(var(--color-primary-rgb)/0.06)]',
              )}
              style={{
                ...(isSelected ? { background: `var(--color-primary)` } : {}),
                ...(isToday && !isSelected ? { boxShadow: `inset 0 -2px 0 0 ${hc}` } : {}),
              }}>
              <span className={cn('relative z-[1]', hasCompletion && !isSelected && 'text-white font-bold drop-shadow-sm')}>
                {day}
              </span>

              {/* Green bg for done */}
              {hasCompletion && !isSelected && (
                <div className="absolute inset-0.5 rounded-lg -z-0" style={{ background: hasLateCompletion ? '#f59e0b' : habitColor, opacity: 0.8 }} />
              )}
              {/* Red dot for missed */}
              {isMissed && !isSelected && (
                <span className="absolute top-1 end-1 h-1.5 w-1.5 rounded-full bg-red-400 z-[2]" />
              )}
              {/* Purple dot for settings changes */}
              {hasHistory && (
                <span className="absolute bottom-0.5 start-0.5 h-1.5 w-1.5 rounded-full bg-violet-500 z-[2]" />
              )}
              {/* Multi-rep badge */}
              {repCount > 1 && (
                <span className="absolute bottom-0.5 end-0 min-w-[14px] px-0.5 rounded-full bg-blue-600 text-white text-[7px] font-black text-center z-[2]">{repCount}x</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[rgba(var(--color-primary-rgb)/0.1)] flex-wrap">
        <LegendDot color={habitColor} label={isAr ? 'مكتملة' : 'Done'} />
        <LegendDot color="rgb(248 113 113)" dot label={isAr ? 'فائتة' : 'Missed'} />
        <LegendDot color="rgb(139 92 246)" dot label={isAr ? 'تعديل' : 'Settings'} />
        {habit.strictWindow && <LegendDot color="#f59e0b" label={isAr ? 'متأخر' : 'Late'} />}
      </div>
    </div>
  );
}

function LegendDot({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[9px] text-[var(--foreground)]/45">
      {dot
        ? <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        : <span className="h-3 w-3 rounded" style={{ background: color, opacity: 0.75 }} />}
      {label}
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
