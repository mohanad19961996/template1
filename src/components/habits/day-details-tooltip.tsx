'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Habit, HabitLog, TimerSession, HabitHistoryEntry } from '@/types/app';
import { formatDurationSecs, todayString } from '@/types/app';
import { to12h, CATEGORY_LABELS } from './habit-constants';
import {
  Check, Clock, Timer, X, Hash, ListChecks, Play, Pause,
  Square, Smile, PenLine, Calendar, ChevronDown, ChevronRight,
  Pencil, Plus, Archive, RotateCcw, Settings, Info,
} from 'lucide-react';

// Field labels for change display
const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  nameEn: { ar: 'الاسم (إنجليزي)', en: 'Name (English)' }, nameAr: { ar: 'الاسم (عربي)', en: 'Name (Arabic)' },
  descriptionEn: { ar: 'الوصف', en: 'Description' }, descriptionAr: { ar: 'الوصف (عربي)', en: 'Description (AR)' },
  category: { ar: 'الفئة', en: 'Category' }, frequency: { ar: 'التكرار', en: 'Frequency' },
  priority: { ar: 'الأولوية', en: 'Priority' }, difficulty: { ar: 'الصعوبة', en: 'Difficulty' },
  color: { ar: 'اللون', en: 'Color' }, icon: { ar: 'الأيقونة', en: 'Icon' },
  type: { ar: 'النوع', en: 'Type' }, trackingType: { ar: 'نوع التتبع', en: 'Tracking Type' },
  targetValue: { ar: 'القيمة المستهدفة', en: 'Target Value' }, targetUnit: { ar: 'الوحدة', en: 'Unit' },
  expectedDuration: { ar: 'مدة المؤقت', en: 'Timer Duration' }, targetDuration: { ar: 'مدة الهدف', en: 'Target Duration' },
  maxDailyReps: { ar: 'أقصى تكرار يومي', en: 'Max Daily Reps' },
  windowStart: { ar: 'بداية النافذة الزمنية', en: 'Window Start' }, windowEnd: { ar: 'نهاية النافذة الزمنية', en: 'Window End' },
  strictWindow: { ar: 'نافذة صارمة', en: 'Strict Window' },
  preferredTime: { ar: 'الوقت المفضل', en: 'Preferred Time' },
  reminderEnabled: { ar: 'التذكير', en: 'Reminder' }, reminderTime: { ar: 'وقت التذكير', en: 'Reminder Time' },
  archived: { ar: 'مؤرشفة', en: 'Archived' },
  completionWindowStart: { ar: 'بداية نافذة الإنجاز', en: 'Completion Window Start' },
  completionWindowEnd: { ar: 'نهاية نافذة الإنجاز', en: 'Completion Window End' },
  allowPartial: { ar: 'إنجاز جزئي', en: 'Allow Partial' }, allowSkip: { ar: 'السماح بالتخطي', en: 'Allow Skip' },
  placeEn: { ar: 'المكان', en: 'Place' }, placeAr: { ar: 'المكان (عربي)', en: 'Place (AR)' },
  cueEn: { ar: 'الإشارة', en: 'Cue' }, routineEn: { ar: 'الروتين', en: 'Routine' }, rewardEn: { ar: 'المكافأة', en: 'Reward' },
  notes: { ar: 'ملاحظات', en: 'Notes' }, image: { ar: 'الصورة', en: 'Image' },
  streakGoal: { ar: 'هدف السلسلة', en: 'Streak Goal' }, endDate: { ar: 'تاريخ الانتهاء', en: 'End Date' },
};

function fmtFieldVal(field: string, val: unknown, isAr: boolean): string {
  if (val === null || val === undefined || val === '') return isAr ? 'فارغ' : 'Empty';
  if (typeof val === 'boolean') return val ? (isAr ? 'نعم ✓' : 'Yes ✓') : (isAr ? 'لا ✗' : 'No ✗');
  // Duration fields (seconds → human readable)
  if ((field === 'expectedDuration' || field === 'targetDuration' || field === 'habitTargetDuration') && typeof val === 'number' && val > 0) return formatDurationSecs(val);
  // Target value that might be seconds (for timer habits)
  if (field === 'targetValue' && typeof val === 'number' && val >= 60) return formatDurationSecs(val);
  // Frequency
  if (field === 'frequency') {
    const m: Record<string, string> = { daily: isAr ? 'يومي' : 'Daily', weekly: isAr ? 'أسبوعي' : 'Weekly', monthly: isAr ? 'شهري' : 'Monthly', custom: isAr ? 'مخصص' : 'Custom' };
    return m[String(val)] || String(val);
  }
  // Priority / Difficulty
  if (field === 'priority' || field === 'difficulty') {
    const m: Record<string, string> = { low: isAr ? 'منخفض' : 'Low', medium: isAr ? 'متوسط' : 'Medium', high: isAr ? 'مرتفع' : 'High', easy: isAr ? 'سهل' : 'Easy', hard: isAr ? 'صعب' : 'Hard' };
    return m[String(val)] || String(val);
  }
  // Type
  if (field === 'type') return String(val) === 'positive' ? (isAr ? 'إيجابية (بناء)' : 'Positive (Build)') : (isAr ? 'تجنب (كسر)' : 'Avoidance (Break)');
  // Tracking type
  if (field === 'trackingType') {
    const m: Record<string, string> = { boolean: isAr ? 'نعم/لا' : 'Yes/No', count: isAr ? 'عداد' : 'Count', timer: isAr ? 'مؤقت' : 'Timer', checklist: isAr ? 'قائمة' : 'Checklist' };
    return m[String(val)] || String(val);
  }
  // Time fields (HH:mm → 12h)
  if ((field.includes('Window') || field.includes('Time') || field === 'preferredTime' || field === 'reminderTime') && typeof val === 'string' && val.includes(':')) return to12h(val);
  // Category
  if (field === 'category' && typeof val === 'string') return isAr ? (CATEGORY_LABELS[val]?.ar ?? val) : (CATEGORY_LABELS[val]?.en ?? val);
  // Unit labels
  if (field === 'targetUnit' && typeof val === 'string') {
    const m: Record<string, string> = { times: isAr ? 'مرات' : 'times', cups: isAr ? 'أكواب' : 'cups', pages: isAr ? 'صفحات' : 'pages', minutes: isAr ? 'دقائق' : 'minutes', steps: isAr ? 'خطوات' : 'steps', reps: isAr ? 'تكرارات' : 'reps', glasses: isAr ? 'أكواب' : 'glasses' };
    return m[val] || val;
  }
  // Color
  if (field === 'color' && typeof val === 'string') return val === 'theme' ? (isAr ? 'لون الثيم' : 'Theme color') : val;
  // Max daily reps
  if (field === 'maxDailyReps' && typeof val === 'number') return `${val} ${isAr ? 'مرات/يوم' : 'times/day'}`;
  // Streak goal
  if (field === 'streakGoal' && typeof val === 'number') return `${val} ${isAr ? 'يوم' : 'days'}`;
  // Long strings
  if (typeof val === 'string' && val.length > 50) return val.slice(0, 50) + '...';
  // Arrays
  if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : (isAr ? 'فارغ' : 'Empty');
  // Numbers
  if (typeof val === 'number') return String(val);
  return String(val);
}

interface DayDetailsTooltipProps {
  habit: Habit;
  dateStr: string;
  logs: HabitLog[];
  timerSessions?: TimerSession[];
  habitHistory?: HabitHistoryEntry[];
  isAr: boolean;
  children: React.ReactNode;
}

export default function DayDetailsTooltip({ habit, dateStr, logs, timerSessions = [], habitHistory: externalHistory, isAr, children }: DayDetailsTooltipProps) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [fetchedHistory, setFetchedHistory] = useState<HabitHistoryEntry[]>([]);
  const today = todayString();

  // Auto-fetch history only when modal opens and no external data
  useEffect(() => {
    if (!open) return;
    if (externalHistory && externalHistory.length > 0) return;
    if (fetchedHistory.length > 0) return;
    if (!habit.id) return;
    fetch(`/api/habits/${habit.id}/history`)
      .then(r => r.json())
      .then(data => { if (data.data) setFetchedHistory(data.data); })
      .catch(() => {});
  }, [open, habit.id, externalHistory, fetchedHistory.length]);

  const habitHistory = (externalHistory && externalHistory.length > 0) ? externalHistory : fetchedHistory;
  const dayLogs = logs.filter(l => l.habitId === habit.id && l.date === dateStr);
  const daySessions = timerSessions.filter(session => {
    if (session.habitId !== habit.id) return false;
    if (session.endedAt) return session.endedAt.startsWith(dateStr);
    return session.startedAt?.startsWith(dateStr);
  });
  const hasData = dayLogs.length > 0 || daySessions.length > 0;

  const completedLogs = dayLogs.filter(l => l.completed);
  const timerLogs = dayLogs.filter(l => l.source === 'timer' && (l.duration ?? 0) > 0);
  // Prefer session durations (always correct absolute-timestamp-based seconds) over log durations
  const totalDuration = daySessions.length > 0
    ? daySessions.reduce((s, session) => s + (session.duration ?? 0), 0)
    : dayLogs.reduce((s, l) => s + (l.duration ?? 0), 0);
  const trackingType = habit.trackingType ?? (habit.expectedDuration ? 'timer' : 'boolean');
  const isToday = dateStr === today;

  const dateLabel = (() => {
    const d = new Date(dateStr + 'T00:00:00');
    const fullDate = d.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (isToday) return isAr ? `اليوم — ${fullDate}` : `Today — ${fullDate}`;
    return fullDate;
  })();

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const eventIcon = (action: string) => {
    switch (action) {
      case 'start': return <Play className="h-3.5 w-3.5 text-emerald-500" />;
      case 'pause': return <Pause className="h-3.5 w-3.5 text-amber-500" />;
      case 'resume': return <Play className="h-3.5 w-3.5 text-blue-500" />;
      case 'finish': return <Square className="h-3.5 w-3.5 text-emerald-600" />;
      case 'cancel': return <X className="h-3.5 w-3.5 text-red-400" />;
      default: return <Clock className="h-3.5 w-3.5 text-[var(--foreground)]/30" />;
    }
  };
  const eventLabel = (action: string) => {
    const l: Record<string, { ar: string; en: string }> = {
      start: { ar: 'بدأ المؤقت', en: 'Timer started' },
      pause: { ar: 'توقف مؤقت', en: 'Paused' },
      resume: { ar: 'استأنف', en: 'Resumed' },
      finish: { ar: 'اكتمل المؤقت', en: 'Timer finished' },
      cancel: { ar: 'تم الإلغاء', en: 'Cancelled' },
    };
    return isAr ? l[action]?.ar ?? action : l[action]?.en ?? action;
  };

  const isFuture = dateStr > today;
  const dayChanges = habitHistory.filter(h => h.habitId === habit.id && h.date === dateStr);
  const hasChanges = dayChanges.length > 0;

  // Don't allow click on non-scheduled / before-created days
  const createdDate = habit.createdAt?.split('T')[0] || '';
  const beforeCreated = dateStr < createdDate;
  const isScheduledDay = !beforeCreated && (dateStr <= today ? true : true); // future days are clickable too
  const isNonScheduledPast = beforeCreated || (!hasData && dateStr < today && !dayChanges.length);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNonScheduledPast) return; // don't open for non-scheduled past days
    if (dateStr) setOpen(true);
  }, [dateStr, isNonScheduledPast]);

  // Modal content
  const modal = open && typeof document !== 'undefined' && createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[var(--z-modal)] overflow-y-auto" onClick={() => setOpen(false)}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[var(--color-card)] rounded-2xl overflow-hidden"
            style={{
              border: '2px solid rgba(var(--color-primary-rgb)/0.15)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(var(--color-primary-rgb)/0.05)',
              direction: isAr ? 'rtl' : 'ltr',
            }}
          >
            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent 10%, var(--color-primary), transparent 90%)' }} />

            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(var(--color-primary-rgb)/0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(var(--color-primary-rgb)/0.1)' }}>
                  <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold">{dateLabel}</h3>
                  <p className="text-xs text-[var(--foreground)]/45">
                    {isAr ? (habit.nameAr || habit.nameEn) : (habit.nameEn || habit.nameAr)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {completedLogs.length > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600">
                    {isAr ? 'مكتمل' : 'Done'}
                  </span>
                )}
                <button onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 hover:bg-[rgba(var(--color-primary-rgb)/0.06)] transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">

              {/* No activity */}
              {!hasData && (
                <div className="text-center py-6">
                  <Calendar className="h-10 w-10 text-[var(--foreground)]/15 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[var(--foreground)]/40">
                    {isFuture
                      ? (isAr ? 'يوم قادم — لم يحن بعد' : 'Upcoming day — not yet')
                      : (isAr ? 'لا يوجد نشاط مسجل لهذا اليوم' : 'No activity recorded for this day')}
                  </p>
                  <p className="text-xs text-[var(--foreground)]/25 mt-1">
                    {isFuture
                      ? (isAr ? 'ستظهر التفاصيل بعد إنجاز العادة' : 'Details will appear after completing the habit')
                      : (isAr ? 'لم يتم تسجيل أي إنجاز أو جلسة' : 'No completion or session was logged')}
                  </p>
                </div>
              )}

              {/* Timer sessions with timeline */}
              {trackingType === 'timer' && (timerLogs.length > 0 || daySessions.length > 0) && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5" />
                    {isAr ? 'جلسات المؤقت' : 'Timer Sessions'}
                  </h4>

                  {/* Sessions with events */}
                  {daySessions.length > 0 ? daySessions.map((session, si) => (
                    <div key={session.id || si} className="mb-3 last:mb-0 rounded-xl p-3"
                      style={{ background: 'rgba(var(--color-primary-rgb)/0.03)', border: '1.5px solid rgba(var(--color-primary-rgb)/0.08)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">{isAr ? `جلسة ${si + 1}` : `Session ${si + 1}`}</span>
                        <span className="text-sm font-bold tabular-nums text-[var(--color-primary)]">{formatDurationSecs(session.duration)}</span>
                      </div>
                      {session.events && session.events.length > 0 ? (
                        <div className="space-y-1.5 ps-1">
                          {session.events.map((ev, ei) => (
                            <div key={ei} className="flex items-center gap-2.5">
                              {eventIcon(ev.action)}
                              <span className="text-xs font-medium text-[var(--foreground)]/60">{eventLabel(ev.action)}</span>
                              <span className="text-xs font-bold tabular-nums text-[var(--foreground)]/70 ms-auto">{formatTime(ev.at)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (() => {
                        const startStr = session.startedAt ? formatTime(session.startedAt) : '—';
                        let endStr = '';
                        if (session.endedAt) {
                          endStr = formatTime(session.endedAt);
                        } else if (session.startedAt && session.duration > 0) {
                          const endMs = new Date(session.startedAt).getTime() + session.duration * 1000;
                          endStr = formatTime(new Date(endMs).toISOString());
                        }
                        return (
                          <div className="space-y-1.5 ps-1">
                            <div className="flex items-center gap-2.5">
                              <Play className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-xs font-medium text-[var(--foreground)]/60">{isAr ? 'بدأ المؤقت' : 'Timer started'}</span>
                              <span className="text-xs font-bold tabular-nums text-[var(--foreground)]/70 ms-auto">{startStr}</span>
                            </div>
                            {endStr && (
                              <div className="flex items-center gap-2.5">
                                <Square className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-xs font-medium text-[var(--foreground)]/60">{isAr ? 'اكتمل المؤقت' : 'Timer finished'}</span>
                                <span className="text-xs font-bold tabular-nums text-[var(--foreground)]/70 ms-auto">{endStr}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid rgba(var(--color-primary-rgb)/0.06)' }}>
                        {session.completed
                          ? <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-xs text-emerald-600 font-semibold">{isAr ? 'اكتمل بنجاح' : 'Completed successfully'}</span></>
                          : <><X className="h-3.5 w-3.5 text-red-400" /><span className="text-xs text-red-400 font-semibold">{isAr ? 'لم يكتمل' : 'Not completed'}</span></>}
                      </div>
                    </div>
                  )) : timerLogs.map((log, i) => {
                    const durSec = log.duration ?? 0;
                    let startTimeStr = '';
                    let endTimeStr = '';
                    if (log.time && durSec > 0) {
                      // log.time = when the log was recorded (end time)
                      // Calculate start = end - duration
                      const [hh, mm] = log.time.split(':').map(Number);
                      const endMin = hh * 60 + mm;
                      const startMin = endMin - Math.round(durSec / 60);
                      const normalizedStartMin = ((startMin % 1440) + 1440) % 1440;
                      const sH = Math.floor(normalizedStartMin / 60);
                      const sM = normalizedStartMin % 60;
                      startTimeStr = to12h(`${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`);
                      endTimeStr = to12h(log.time);
                    } else if (log.time) {
                      // Has time but no duration — show time as end
                      endTimeStr = to12h(log.time);
                    } else if (durSec > 0) {
                      // Has duration but no time — can't calculate, just show duration
                      startTimeStr = '—';
                    }
                    return (
                      <div key={log.id || i} className="mb-3 last:mb-0 rounded-xl p-3"
                        style={{ background: 'rgba(var(--color-primary-rgb)/0.03)', border: '1.5px solid rgba(var(--color-primary-rgb)/0.08)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold">{isAr ? `جلسة ${i + 1}` : `Session ${i + 1}`}</span>
                          <span className="text-sm font-bold tabular-nums text-[var(--color-primary)]">{formatDurationSecs(durSec)}</span>
                        </div>
                        <div className="space-y-1.5 ps-1">
                          {(startTimeStr || endTimeStr) && (
                            <div className="flex items-center gap-2.5">
                              <Play className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-xs font-medium text-[var(--foreground)]/60">{isAr ? 'بدأ المؤقت' : 'Timer started'}</span>
                              <span className="text-xs font-bold tabular-nums text-[var(--foreground)]/70 ms-auto">{startTimeStr || '—'}</span>
                            </div>
                          )}
                          {endTimeStr && (
                            <div className="flex items-center gap-2.5">
                              <Square className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-xs font-medium text-[var(--foreground)]/60">{isAr ? 'اكتمل المؤقت' : 'Timer finished'}</span>
                              <span className="text-xs font-bold tabular-nums text-[var(--foreground)]/70 ms-auto">{endTimeStr}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid rgba(var(--color-primary-rgb)/0.06)' }}>
                          {log.completed
                            ? <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-xs text-emerald-600 font-semibold">{isAr ? 'اكتمل بنجاح' : 'Completed successfully'}</span></>
                            : <><X className="h-3.5 w-3.5 text-red-400" /><span className="text-xs text-red-400 font-semibold">{isAr ? 'لم يكتمل' : 'Not completed'}</span></>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Manual completions */}
              {dayLogs.filter(l => l.source !== 'timer' && l.completed).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    {isAr ? 'إنجاز يدوي' : 'Manual Completion'}
                  </h4>
                  {dayLogs.filter(l => l.source !== 'timer' && l.completed).map((log, i) => (
                    <div key={log.id || `m${i}`} className="flex items-center gap-2.5 py-1.5 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="font-medium text-[var(--foreground)]/70">{isAr ? 'تم الإنجاز' : 'Marked done'}</span>
                      <span className="font-bold tabular-nums text-[var(--foreground)]/70 ms-auto">{log.time ? to12h(log.time) : '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Count */}
              {trackingType === 'count' && dayLogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" /> {isAr ? 'العدّاد' : 'Count Progress'}
                  </h4>
                  {dayLogs.map((log, i) => (
                    <div key={log.id || i} className="flex items-center gap-2.5 py-1.5 text-sm">
                      <Hash className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                      <span className="font-medium text-[var(--foreground)]/70">{log.time ? to12h(log.time) : '—'}</span>
                      <span className="font-bold tabular-nums text-[var(--foreground)]/80 ms-auto">
                        {log.value ?? 0} / {habit.targetValue ?? 1} {habit.targetUnit ?? ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Checklist */}
              {trackingType === 'checklist' && dayLogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ListChecks className="h-3.5 w-3.5" /> {isAr ? 'قائمة المهام' : 'Checklist'}
                  </h4>
                  {(() => {
                    const log = dayLogs.find(l => l.checklistState) ?? dayLogs[0];
                    const items = habit.checklistItems ?? [];
                    const state = log?.checklistState ?? {};
                    return items.map(item => {
                      const done = typeof state[item.id] === 'boolean' ? state[item.id] : (state[item.id] as any)?.done ?? false;
                      return (
                        <div key={item.id} className="flex items-center gap-2.5 py-1 text-sm">
                          {done ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-[var(--foreground)]/20 shrink-0" />}
                          <span className={cn('font-medium', done ? 'text-[var(--foreground)]/70' : 'text-[var(--foreground)]/35')}>
                            {isAr ? item.titleAr : item.titleEn}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Boolean */}
              {trackingType === 'boolean' && dayLogs.length > 0 && timerLogs.length === 0 && daySessions.length === 0 && (
                <div>
                  {dayLogs.filter(l => l.completed).map((log, i) => (
                    <div key={log.id || i} className="flex items-center gap-2.5 py-1.5 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="font-medium text-[var(--foreground)]/70">{isAr ? 'تم الإنجاز' : 'Completed'}</span>
                      <span className="font-bold tabular-nums text-[var(--foreground)]/70 ms-auto">{log.time ? to12h(log.time) : '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total time */}
              {totalDuration > 0 && (
                <div className="flex items-center justify-between py-3 rounded-xl px-3"
                  style={{ background: 'rgba(var(--color-primary-rgb)/0.04)', border: '1px solid rgba(var(--color-primary-rgb)/0.08)' }}>
                  <span className="text-sm font-medium text-[var(--foreground)]/50 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {isAr ? 'إجمالي الوقت' : 'Total Time'}
                  </span>
                  <span className="text-lg font-bold text-[var(--color-primary)] tabular-nums">{formatDurationSecs(totalDuration)}</span>
                </div>
              )}

              {/* Mood */}
              {dayLogs.some(l => l.moodBefore || l.moodAfter) && (
                <div className="flex items-center gap-4">
                  <Smile className="h-4 w-4 text-[var(--foreground)]/30 shrink-0" />
                  {dayLogs[0]?.moodBefore && <span className="text-sm text-[var(--foreground)]/50">{isAr ? 'قبل' : 'Before'}: {'😞😐😊😄🤩'[dayLogs[0].moodBefore - 1]}</span>}
                  {dayLogs[0]?.moodAfter && <span className="text-sm text-[var(--foreground)]/50">{isAr ? 'بعد' : 'After'}: {'😞😐😊😄🤩'[dayLogs[0].moodAfter - 1]}</span>}
                </div>
              )}

              {/* Habit changes on this day */}
              {(() => {
                if (dayChanges.length === 0) return null;
                const changeLabels: Record<string, { ar: string; en: string }> = {
                  created: { ar: 'تم إنشاء العادة', en: 'Habit created' },
                  edited: { ar: 'تم تعديل إعدادات العادة', en: 'Habit settings edited' },
                  archived: { ar: 'تم أرشفة العادة', en: 'Habit archived' },
                  restored: { ar: 'تم استعادة العادة', en: 'Habit restored' },
                };
                return (
                  <div>
                    <h4 className="text-sm font-bold text-violet-600 mb-3 flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      {isAr ? 'تغييرات الإعدادات في هذا اليوم' : 'Settings changes on this day'}
                    </h4>
                    {dayChanges.map(entry => (
                      <div key={entry.id} className="mb-3 last:mb-0 rounded-xl p-4"
                        style={{ background: 'rgba(139,92,246,0.04)', border: '2px solid rgba(139,92,246,0.15)' }}>
                        <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-violet-500/10">
                            <Pencil className="h-3.5 w-3.5 text-violet-500" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-bold">{isAr ? changeLabels[entry.changeType]?.ar : changeLabels[entry.changeType]?.en}</span>
                            <p className="text-[11px] tabular-nums text-[var(--foreground)]/40">
                              {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {Object.keys(entry.changes).length > 0 && (
                          <div className="space-y-2.5">
                            {Object.entries(entry.changes).map(([field, diff]) => {
                              const fieldLabel = FIELD_LABELS[field] ? (isAr ? FIELD_LABELS[field].ar : FIELD_LABELS[field].en) : field;
                              return (
                                <div key={field} className="rounded-lg p-3" style={{ background: 'var(--color-background)', border: '1.5px solid rgba(var(--color-primary-rgb)/0.08)' }}>
                                  <p className="text-xs font-bold text-[var(--foreground)]/60 mb-2">{fieldLabel}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] text-red-400 font-medium mb-0.5">{isAr ? 'القيمة السابقة' : 'Previous'}</p>
                                      <p className="text-sm font-bold text-red-500 line-through break-words">{fmtFieldVal(field, diff.from, isAr)}</p>
                                    </div>
                                    <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-[var(--foreground)]/[0.04]">
                                      <ChevronRight className={cn('h-4 w-4 text-[var(--foreground)]/30', isAr && 'rotate-180')} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] text-emerald-500 font-medium mb-0.5">{isAr ? 'القيمة الجديدة' : 'New value'}</p>
                                      <p className="text-sm font-bold text-emerald-600 break-words">{fmtFieldVal(field, diff.to, isAr)}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Habit details button — opens sub-modal */}
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-md"
                style={{
                  background: 'rgba(var(--color-primary-rgb)/0.04)',
                  border: '2px solid rgba(var(--color-primary-rgb)/0.12)',
                }}
              >
                <span className="flex items-center gap-2 text-[var(--color-primary)]">
                  <Settings className="h-4 w-4" />
                  {isAr ? 'عرض إعدادات العادة لهذا اليوم' : 'View habit settings for this day'}
                </span>
                <ChevronRight className={cn('h-4 w-4 text-[var(--color-primary)]', isAr && 'rotate-180')} />
              </button>

              {/* Note — always shown */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(var(--color-primary-rgb)/0.02)', border: '1px solid rgba(var(--color-primary-rgb)/0.06)' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <PenLine className="h-3.5 w-3.5 text-[var(--foreground)]/30" />
                  <span className="text-xs font-bold text-[var(--foreground)]/40 uppercase tracking-wider">{isAr ? 'ملاحظة اليوم' : "Day's Note"}</span>
                </div>
                {dayLogs.some(l => l.note?.trim()) ? (
                  <p className="text-sm text-[var(--foreground)]/60 leading-relaxed whitespace-pre-wrap">{dayLogs.find(l => l.note?.trim())?.note}</p>
                ) : (
                  <p className="text-sm text-[var(--foreground)]/20 italic">{isAr ? 'لا توجد ملاحظة لهذا اليوم' : 'No note for this day'}</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body,
  );

  // Sub-modal for habit details
  const detailsModal = showDetails && typeof document !== 'undefined' && createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[calc(var(--z-modal)+10)] overflow-y-auto" onClick={() => setShowDetails(false)}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[var(--color-card)] rounded-2xl overflow-hidden"
            style={{
              border: '2px solid rgba(var(--color-primary-rgb)/0.15)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
              direction: isAr ? 'rtl' : 'ltr',
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(var(--color-primary-rgb)/0.1)', background: 'rgba(var(--color-primary-rgb)/0.03)' }}>
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="text-base font-bold">{isAr ? 'إعدادات العادة' : 'Habit Settings'}</h3>
                  <p className="text-xs text-[var(--foreground)]/45">{dateLabel}</p>
                </div>
              </div>
              <button onClick={() => setShowDetails(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 hover:bg-[rgba(var(--color-primary-rgb)/0.06)] transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Settings grid */}
            <div className="px-6 py-5 space-y-3 max-h-[65vh] overflow-y-auto scrollbar-thin">
              {[
                { label: isAr ? 'اسم العادة' : 'Habit Name', value: isAr ? habit.nameAr : habit.nameEn, icon: <Info className="h-4 w-4 text-[var(--color-primary)]" /> },
                { label: isAr ? 'الفئة' : 'Category', value: isAr ? (CATEGORY_LABELS[habit.category]?.ar ?? habit.category) : (CATEGORY_LABELS[habit.category]?.en ?? habit.category) },
                { label: isAr ? 'التكرار' : 'Frequency', value: habit.frequency },
                { label: isAr ? 'نوع التتبع' : 'Tracking Type', value: habit.trackingType ?? 'boolean' },
                ...(habit.expectedDuration ? [{ label: isAr ? 'مدة المؤقت' : 'Timer Duration', value: formatDurationSecs(habit.expectedDuration) }] : []),
                ...(habit.targetValue && habit.trackingType === 'count' ? [{ label: isAr ? 'الهدف' : 'Target', value: `${habit.targetValue} ${habit.targetUnit ?? ''}` }] : []),
                { label: isAr ? 'الأولوية' : 'Priority', value: habit.priority },
                { label: isAr ? 'الصعوبة' : 'Difficulty', value: habit.difficulty },
                { label: isAr ? 'النوع' : 'Type', value: habit.type === 'positive' ? (isAr ? 'إيجابية' : 'Positive') : (isAr ? 'تجنب' : 'Avoidance') },
                ...(habit.windowStart && habit.windowEnd ? [{ label: isAr ? 'نافذة الوقت' : 'Time Window', value: `${to12h(habit.windowStart)} – ${to12h(habit.windowEnd)}${habit.strictWindow ? (isAr ? ' (إجباري)' : ' (strict)') : ''}` }] : []),
                ...(habit.maxDailyReps ? [{ label: isAr ? 'أقصى تكرار يومي' : 'Max Daily Reps', value: String(habit.maxDailyReps) }] : []),
                ...(habit.preferredTime ? [{ label: isAr ? 'الوقت المفضل' : 'Preferred Time', value: to12h(habit.preferredTime) }] : []),
                ...(habit.reminderEnabled ? [{ label: isAr ? 'التذكير' : 'Reminder', value: habit.reminderTime ? to12h(habit.reminderTime) : (isAr ? 'مفعّل' : 'Enabled') }] : []),
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ background: i % 2 === 0 ? 'rgba(var(--color-primary-rgb)/0.02)' : 'transparent' }}>
                  <span className="text-sm text-[var(--foreground)]/50 font-medium">{item.label}</span>
                  <span className="text-sm font-bold text-[var(--foreground)]/80">{item.value}</span>
                </div>
              ))}

              {/* Changes on this day */}
              {dayChanges.length > 0 && (() => {
                const FIELD_LABELS_MAP: Record<string, { ar: string; en: string }> = {
                  nameEn: { ar: 'الاسم (إنجليزي)', en: 'Name (English)' }, nameAr: { ar: 'الاسم (عربي)', en: 'Name (Arabic)' },
                  descriptionEn: { ar: 'الوصف', en: 'Description' }, descriptionAr: { ar: 'الوصف (عربي)', en: 'Description (AR)' },
                  category: { ar: 'الفئة', en: 'Category' }, frequency: { ar: 'التكرار', en: 'Frequency' },
                  priority: { ar: 'الأولوية', en: 'Priority' }, difficulty: { ar: 'الصعوبة', en: 'Difficulty' },
                  color: { ar: 'اللون', en: 'Color' }, icon: { ar: 'الأيقونة', en: 'Icon' },
                  type: { ar: 'النوع', en: 'Type' }, trackingType: { ar: 'نوع التتبع', en: 'Tracking Type' },
                  targetValue: { ar: 'القيمة المستهدفة', en: 'Target Value' }, targetUnit: { ar: 'الوحدة', en: 'Unit' },
                  expectedDuration: { ar: 'مدة المؤقت', en: 'Timer Duration' }, targetDuration: { ar: 'مدة الهدف', en: 'Target Duration' },
                  maxDailyReps: { ar: 'أقصى تكرار يومي', en: 'Max Daily Reps' },
                  windowStart: { ar: 'بداية النافذة', en: 'Window Start' }, windowEnd: { ar: 'نهاية النافذة', en: 'Window End' },
                  strictWindow: { ar: 'نافذة صارمة', en: 'Strict Window' },
                  preferredTime: { ar: 'الوقت المفضل', en: 'Preferred Time' },
                  reminderEnabled: { ar: 'التذكير', en: 'Reminder' }, reminderTime: { ar: 'وقت التذكير', en: 'Reminder Time' },
                  archived: { ar: 'مؤرشفة', en: 'Archived' },
                  completionWindowStart: { ar: 'بداية نافذة الإنجاز', en: 'Completion Start' },
                  completionWindowEnd: { ar: 'نهاية نافذة الإنجاز', en: 'Completion End' },
                  allowPartial: { ar: 'إنجاز جزئي', en: 'Allow Partial' }, allowSkip: { ar: 'السماح بالتخطي', en: 'Allow Skip' },
                  placeEn: { ar: 'المكان', en: 'Place' }, placeAr: { ar: 'المكان (عربي)', en: 'Place (AR)' },
                  cueEn: { ar: 'الإشارة', en: 'Cue' }, routineEn: { ar: 'الروتين', en: 'Routine' }, rewardEn: { ar: 'المكافأة', en: 'Reward' },
                  notes: { ar: 'ملاحظات', en: 'Notes' },
                };
                const fmtVal = (f: string, v: unknown): string => {
                  if (v === null || v === undefined) return isAr ? 'فارغ' : 'Empty';
                  if (typeof v === 'boolean') return v ? (isAr ? 'نعم ✓' : 'Yes ✓') : (isAr ? 'لا ✗' : 'No ✗');
                  if ((f === 'expectedDuration' || f === 'targetDuration') && typeof v === 'number' && v > 0) return formatDurationSecs(v);
                  if (f === 'frequency') { const m: Record<string, string> = { daily: isAr ? 'يومي' : 'Daily', weekly: isAr ? 'أسبوعي' : 'Weekly', monthly: isAr ? 'شهري' : 'Monthly', custom: isAr ? 'مخصص' : 'Custom' }; return m[String(v)] || String(v); }
                  if (f === 'priority' || f === 'difficulty') { const m: Record<string, string> = { low: isAr ? 'منخفض' : 'Low', medium: isAr ? 'متوسط' : 'Medium', high: isAr ? 'مرتفع' : 'High', easy: isAr ? 'سهل' : 'Easy', hard: isAr ? 'صعب' : 'Hard' }; return m[String(v)] || String(v); }
                  if (f === 'type') return String(v) === 'positive' ? (isAr ? 'إيجابية' : 'Positive') : (isAr ? 'تجنب' : 'Avoidance');
                  if (f === 'trackingType') { const m: Record<string, string> = { boolean: isAr ? 'نعم/لا' : 'Yes/No', count: isAr ? 'عداد' : 'Count', timer: isAr ? 'مؤقت' : 'Timer', checklist: isAr ? 'قائمة' : 'Checklist' }; return m[String(v)] || String(v); }
                  if ((f === 'windowStart' || f === 'windowEnd' || f === 'preferredTime' || f === 'reminderTime' || f === 'completionWindowStart' || f === 'completionWindowEnd') && typeof v === 'string' && v.includes(':')) return to12h(v);
                  if (f === 'category') return isAr ? (CATEGORY_LABELS[String(v)]?.ar ?? String(v)) : (CATEGORY_LABELS[String(v)]?.en ?? String(v));
                  if (typeof v === 'string' && v.length > 50) return v.slice(0, 50) + '...';
                  if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : (isAr ? 'فارغ' : 'Empty');
                  return String(v);
                };
                const changeLabels: Record<string, { ar: string; en: string }> = {
                  created: { ar: 'تم إنشاء العادة', en: 'Habit created' },
                  edited: { ar: 'تم تعديل إعدادات العادة', en: 'Habit settings edited' },
                  archived: { ar: 'تم أرشفة العادة', en: 'Habit archived' },
                  restored: { ar: 'تم استعادة العادة', en: 'Habit restored' },
                };
                return (
                <div className="mt-4 pt-4" style={{ borderTop: '2px solid rgba(139,92,246,0.15)' }}>
                  <h4 className="text-sm font-bold text-violet-500 mb-3 flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    {isAr ? 'تغييرات تمت في هذا اليوم' : 'Changes made on this day'}
                  </h4>
                  {dayChanges.map(entry => (
                      <div key={entry.id} className="mb-3 last:mb-0 rounded-xl p-4"
                        style={{ background: 'rgba(139,92,246,0.04)', border: '1.5px solid rgba(139,92,246,0.12)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Pencil className="h-4 w-4 text-violet-500" />
                          <span className="text-sm font-bold">{isAr ? changeLabels[entry.changeType]?.ar : changeLabels[entry.changeType]?.en}</span>
                          <span className="text-xs tabular-nums text-[var(--foreground)]/40 ms-auto">
                            {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {Object.keys(entry.changes).length > 0 && (
                          <div className="space-y-2">
                            {Object.entries(entry.changes).map(([field, diff]) => {
                              const fieldLabel = FIELD_LABELS_MAP[field] ? (isAr ? FIELD_LABELS_MAP[field].ar : FIELD_LABELS_MAP[field].en) : field;
                              return (
                              <div key={field} className="rounded-lg p-2.5" style={{ background: 'rgba(var(--color-primary-rgb)/0.03)', border: '1px solid rgba(var(--color-primary-rgb)/0.06)' }}>
                                <p className="text-xs font-bold text-[var(--foreground)]/60 mb-1.5">{fieldLabel}</p>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="px-2 py-0.5 rounded-md bg-red-500/8 text-red-500 line-through font-medium">{fmtVal(field, diff.from)}</span>
                                  <span className="text-[var(--foreground)]/30 font-bold">→</span>
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">{fmtVal(field, diff.to)}</span>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                  ))}
                </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body,
  );

  return (
    <>
      <div
        className={cn(
          'relative transition-all duration-200 flex-1 min-w-0',
          !isNonScheduledPast && 'cursor-pointer hover:scale-[1.08] hover:z-10 hover:brightness-[1.12]',
          isNonScheduledPast && 'cursor-default',
          open && 'scale-[1.08] z-10 ring-2 ring-[var(--color-primary)] ring-offset-1 rounded-lg brightness-[1.12]',
        )}
        onClick={handleClick}
      >
        {children}
        {hasChanges && (
          <span className="absolute bottom-0 start-0.5 h-2 w-2 rounded-full bg-violet-500 z-[3] border border-white dark:border-gray-900" />
        )}
      </div>
      {modal}
      {detailsModal}
    </>
  );
}
