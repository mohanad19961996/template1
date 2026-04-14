'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Moon, Sunrise, Clock, Star, Lock, Edit3, Check, X,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Bell, BellOff, Zap, TrendingUp, Calendar as CalendarIcon,
  Sparkles, AlarmClock, Pen, BookOpen,
} from 'lucide-react';

/* ════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════ */
interface SleepConfig {
  user_id: string;
  bedtime: string;
  wake_time: string;
  enabled: boolean;
  last_schedule_edit: string | null;
  reminder_enabled: boolean;
  reminder_offset_minutes: number;
}

interface SleepLog {
  id: string;
  date: string;
  scheduled_bedtime: string;
  scheduled_wake_time: string;
  sleep_button_at: string | null;
  wake_button_at: string | null;
  paused_at: string | null;
  total_paused_seconds: number;
  pause_count: number;
  sleep_duration_minutes: number | null;
  bedtime_deviation_minutes: number | null;
  wake_deviation_minutes: number | null;
  sleep_quality: number | null;
  mood_on_wake: number | null;
  notes: string;
  dream_note: string;
}

/* ════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════ */
function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function calcDurationStr(bed: string, wake: string): string {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let diff = (wh * 60 + wm) - (bh * 60 + bm);
  if (diff <= 0) diff += 1440;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function daysUntilCanEdit(lastEdit: string | null): number {
  if (!lastEdit) return 0;
  const editDate = new Date(lastEdit).getTime();
  const daysPassed = Math.floor((Date.now() - editDate) / 86400000);
  return Math.max(0, 30 - daysPassed);
}

function fmtDuration(mins: number | null): string {
  if (!mins || mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtDeviation(mins: number | null, isAr: boolean): string {
  if (mins === null || mins === undefined) return '—';
  if (mins === 0) return isAr ? 'في الوقت' : 'On time';
  if (mins > 0) return isAr ? `+${mins} د متأخر` : `+${mins}m late`;
  return isAr ? `${mins} د مبكر` : `${mins}m early`;
}

function durColor(mins: number | null): string {
  if (!mins) return 'text-[var(--foreground)]/40';
  if (mins >= 420 && mins <= 540) return 'text-emerald-500';
  if (mins >= 360) return 'text-amber-500';
  return 'text-red-500';
}

function durBg(mins: number | null): string {
  if (!mins) return 'bg-[var(--foreground)]/10';
  if (mins >= 420 && mins <= 540) return 'bg-emerald-500';
  if (mins >= 360) return 'bg-amber-500';
  return 'bg-red-500';
}

function qualityColor(q: number | null): string {
  if (!q) return 'bg-[var(--foreground)]/10';
  if (q >= 4) return 'bg-emerald-500';
  if (q >= 3) return 'bg-amber-500';
  return 'bg-red-500';
}

// Use app-card / app-stat-card / app-btn-primary / app-btn-secondary CSS classes from globals.css

const DAY_NAMES_AR = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
const DAY_NAMES_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTH_NAMES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const OFFSET_OPTIONS = [10, 15, 30, 60];

/* ════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════ */
export default function SleepPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  /* ─── State ─── */
  const [config, setConfig] = useState<SleepConfig | null>(null);
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [yearLogs, setYearLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editBed, setEditBed] = useState('');
  const [editWake, setEditWake] = useState('');
  const [editError, setEditError] = useState('');
  const [countdown, setCountdown] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Active sleep
  const [activeSleepLog, setActiveSleepLog] = useState<SleepLog | null>(null);
  const [sleepElapsed, setSleepElapsed] = useState('');

  // Wake-up rating (single compact form)
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingLogId, setRatingLogId] = useState<string | null>(null);
  const [rateQuality, setRateQuality] = useState(0);
  const [rateMood, setRateMood] = useState(0);
  const [rateNotes, setRateNotes] = useState('');
  const [rateDream, setRateDream] = useState('');
  const [savingRating, setSavingRating] = useState(false);

  // Reminder
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [reminderBanner, setReminderBanner] = useState('');
  const reminderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Load Data ─── */
  const loadData = useCallback(async () => {
    try {
      const [cfgRes, logsRes, statusRes] = await Promise.all([
        fetch('/api/sleep/config'),
        fetch('/api/sleep/logs?last=30'),
        fetch('/api/sleep/status'),
      ]);
      const cfgJson = await cfgRes.json();
      const logsJson = await logsRes.json();
      const statusJson = await statusRes.json();

      if (cfgJson.data) {
        setConfig(cfgJson.data);
        setEditBed(cfgJson.data.bedtime);
        setEditWake(cfgJson.data.wake_time);
      }
      if (logsJson.data) setLogs(logsJson.data);
      if (statusJson.data?.sleeping && statusJson.data?.sleepLog) {
        setActiveSleepLog(statusJson.data.sleepLog);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ─── Load Year Logs ─── */
  const loadYearLogs = useCallback(async (year: number) => {
    try {
      const res = await fetch(`/api/sleep/logs?year=${year}`);
      const json = await res.json();
      if (json.data) setYearLogs(json.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadYearLogs(calendarYear); }, [calendarYear, loadYearLogs]);

  /* ─── Notification permission check ─── */
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifPermission('unsupported');
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  /* ─── Countdown to bedtime (ticks every second) ─── */
  useEffect(() => {
    if (!config?.enabled || !config.bedtime || activeSleepLog) { setCountdown(''); return; }
    const tick = () => {
      const now = new Date();
      const [bh, bm] = config.bedtime.split(':').map(Number);
      const bed = new Date(now);
      bed.setHours(bh, bm, 0, 0);
      if (bed.getTime() <= now.getTime()) bed.setDate(bed.getDate() + 1);
      const diff = bed.getTime() - now.getTime();
      if (diff <= 0) { setCountdown(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) {
        setCountdown(`${h}h ${String(m).padStart(2, '0')}m`);
      } else {
        setCountdown(`${m}m ${String(s).padStart(2, '0')}s`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [config, activeSleepLog]);

  /* ─── Elapsed sleep timer (ticks every second, accounts for pauses) ─── */
  useEffect(() => {
    if (!activeSleepLog?.sleep_button_at) { setSleepElapsed(''); return; }
    const isPaused = !!activeSleepLog.paused_at;
    const tick = () => {
      const start = new Date(activeSleepLog.sleep_button_at!).getTime();
      const totalPausedMs = (activeSleepLog.total_paused_seconds || 0) * 1000;
      // If currently paused, freeze the timer at pause moment
      const endPoint = isPaused ? new Date(activeSleepLog.paused_at!).getTime() : Date.now();
      const diff = Math.max(0, endPoint - start - totalPausedMs);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setSleepElapsed(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    if (isPaused) return; // Don't tick when paused
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSleepLog]);

  /* ─── Bedtime Reminder Scheduler ─── */
  useEffect(() => {
    if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
      reminderTimeoutRef.current = null;
    }
    if (!config?.enabled || !config.reminder_enabled || !config.bedtime) return;
    if (notifPermission !== 'granted') return;

    const scheduleReminder = () => {
      const now = new Date();
      const [bh, bm] = config.bedtime.split(':').map(Number);
      const bedtime = new Date(now);
      bedtime.setHours(bh, bm, 0, 0);
      if (bedtime.getTime() <= now.getTime()) bedtime.setDate(bedtime.getDate() + 1);

      const reminderTime = new Date(bedtime.getTime() - config.reminder_offset_minutes * 60000);
      const delay = reminderTime.getTime() - now.getTime();
      if (delay <= 0) return;

      reminderTimeoutRef.current = setTimeout(() => {
        // Browser notification
        try {
          new Notification(isAr ? 'حان وقت النوم' : 'Time for bed', {
            body: isAr ? `موعد نومك بعد ${config.reminder_offset_minutes} دقيقة` : `Bedtime in ${config.reminder_offset_minutes} minutes`,
            icon: '/icon-192x192.png',
          });
        } catch { /* ignore */ }
        // In-app banner
        setReminderBanner(isAr ? 'حان وقت النوم!' : 'Time for bed!');
        setTimeout(() => setReminderBanner(''), 10000);
      }, delay);
    };

    scheduleReminder();
    return () => {
      if (reminderTimeoutRef.current) clearTimeout(reminderTimeoutRef.current);
    };
  }, [config, notifPermission, isAr]);

  /* ─── Actions ─── */
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveSchedule = async () => {
    setEditError('');
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/sleep/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedtime: editBed, wake_time: editWake }),
      });
      const json = await res.json();
      if (json.error) { setEditError(json.error); setSaving(false); return; }
      setConfig(json.data);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setEditError(isAr ? 'فشل الحفظ' : 'Save failed'); setSaving(false); }
  };

  // Auto-save: debounce 2 seconds after time change
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!config) return;
    const bedChanged = editBed !== config.bedtime;
    const wakeChanged = editWake !== config.wake_time;
    if (!bedChanged && !wakeChanged) return;

    // Check if edit is allowed (same logic as canEdit)
    let canAutoSave = true;
    if (config.last_schedule_edit) {
      const editDate = new Date(config.last_schedule_edit);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const editDayStart = new Date(editDate); editDayStart.setHours(0, 0, 0, 0);
      const daysPassed = Math.floor((todayStart.getTime() - editDayStart.getTime()) / 86400000);
      canAutoSave = daysPassed >= 7;
    }
    if (!canAutoSave) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveSchedule();
    }, 2000);

    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [editBed, editWake]); // eslint-disable-line react-hooks/exhaustive-deps

  const _toggleEnabled = async () => {
    // Sleep system is always enabled — no toggle needed
    void 0;
  };

  const toggleReminder = async () => {
    if (!config) return;
    try {
      const res = await fetch('/api/sleep/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_enabled: !config.reminder_enabled }),
      });
      const json = await res.json();
      if (json.data) setConfig(json.data);
    } catch { /* ignore */ }
  };

  const updateReminderOffset = async (offset: number) => {
    if (!config) return;
    try {
      const res = await fetch('/api/sleep/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_offset_minutes: offset }),
      });
      const json = await res.json();
      if (json.data) setConfig(json.data);
    } catch { /* ignore */ }
  };

  const requestNotifPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted' && config && !config.reminder_enabled) {
      toggleReminder();
    }
  };

  const startSleep = async () => {
    if (!config) return;
    const now = new Date();
    const [wh] = config.wake_time.split(':').map(Number);
    const curH = now.getHours();
    const date = now.toISOString().split('T')[0];
    const sleepDate = curH < wh ? new Date(Date.now() - 86400000).toISOString().split('T')[0] : date;
    try {
      const res = await fetch('/api/sleep/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: sleepDate,
          scheduled_bedtime: config.bedtime,
          scheduled_wake_time: config.wake_time,
          sleep_button_at: now.toISOString(),
        }),
      });
      const json = await res.json();
      if (json.data) setActiveSleepLog(json.data);
    } catch { /* ignore */ }
  };

  const pauseSleep = async () => {
    if (!activeSleepLog || activeSleepLog.paused_at) return;
    try {
      const res = await fetch(`/api/sleep/logs/${activeSleepLog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused_at: new Date().toISOString() }),
      });
      const json = await res.json();
      if (json.data) setActiveSleepLog(json.data);
    } catch { /* ignore */ }
  };

  const resumeSleep = async () => {
    if (!activeSleepLog || !activeSleepLog.paused_at) return;
    const pausedSecs = Math.floor((Date.now() - new Date(activeSleepLog.paused_at).getTime()) / 1000);
    const newTotalPaused = (activeSleepLog.total_paused_seconds || 0) + pausedSecs;
    try {
      const res = await fetch(`/api/sleep/logs/${activeSleepLog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paused_at: null,
          total_paused_seconds: newTotalPaused,
          pause_count: (activeSleepLog.pause_count || 0) + 1,
        }),
      });
      const json = await res.json();
      if (json.data) setActiveSleepLog(json.data);
    } catch { /* ignore */ }
  };

  const wakeUp = async () => {
    if (!activeSleepLog) return;
    // If paused, add final pause duration before waking
    let finalPausedSecs = activeSleepLog.total_paused_seconds || 0;
    if (activeSleepLog.paused_at) {
      finalPausedSecs += Math.floor((Date.now() - new Date(activeSleepLog.paused_at).getTime()) / 1000);
    }
    try {
      const res = await fetch(`/api/sleep/logs/${activeSleepLog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wake_button_at: new Date().toISOString(),
          paused_at: null,
          total_paused_seconds: finalPausedSecs,
          pause_count: (activeSleepLog.pause_count || 0) + (activeSleepLog.paused_at ? 1 : 0),
        }),
      });
      const json = await res.json();
      if (json.data) {
        setActiveSleepLog(null);
        setRatingLogId(json.data.id);
        setShowRatingForm(true);
        setRateQuality(0);
        setRateMood(0);
        setRateNotes('');
        setRateDream('');
      }
    } catch { /* ignore */ }
  };

  const saveRating = async () => {
    if (!ratingLogId) return;
    setSavingRating(true);
    try {
      await fetch(`/api/sleep/logs/${ratingLogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleep_quality: rateQuality || null,
          mood_on_wake: rateMood || null,
          notes: rateNotes,
          dream_note: rateDream,
        }),
      });
    } catch { /* ignore */ }
    setSavingRating(false);
    setShowRatingForm(false);
    setRatingLogId(null);
    loadData();
    loadYearLogs(calendarYear);
  };

  /* ─── Computed ─── */
  const lockedDays = config ? daysUntilCanEdit(config.last_schedule_edit) : 0;
  const completedLogs = useMemo(() => logs.filter(l => l.sleep_duration_minutes && l.sleep_duration_minutes > 0), [logs]);

  const avgDuration = useMemo(() => {
    if (completedLogs.length === 0) return null;
    return Math.round(completedLogs.reduce((s, l) => s + (l.sleep_duration_minutes || 0), 0) / completedLogs.length);
  }, [completedLogs]);

  const avgQuality = useMemo(() => {
    const rated = completedLogs.filter(l => l.sleep_quality);
    if (rated.length === 0) return null;
    return (rated.reduce((s, l) => s + (l.sleep_quality || 0), 0) / rated.length).toFixed(1);
  }, [completedLogs]);

  const consistency = useMemo(() => {
    if (completedLogs.length === 0) return 0;
    const good = completedLogs.filter(l => (l.sleep_duration_minutes || 0) >= 420 && (l.sleep_duration_minutes || 0) <= 540).length;
    return Math.round((good / completedLogs.length) * 100);
  }, [completedLogs]);

  const currentStreak = useMemo(() => {
    if (logs.length === 0) return 0;
    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (sorted[i].date === expectedStr && sorted[i].sleep_duration_minutes && sorted[i].sleep_duration_minutes! > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [logs]);

  /* ─── Weekly chart data ─── */
  const weekData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    // Saturday-based week: Saturday=0
    const satOffset = (dayOfWeek + 1) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - satOffset);

    const days: { date: string; dayName: string; hours: number; quality: number | null }[] = [];
    const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;
    for (let i = 0; i < 7; i++) {
      const d = new Date(saturday);
      d.setDate(saturday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs.find(l => l.date === dateStr);
      days.push({
        date: dateStr,
        dayName: dayNames[i],
        hours: log?.sleep_duration_minutes ? log.sleep_duration_minutes / 60 : 0,
        quality: log?.sleep_quality ?? null,
      });
    }
    return days;
  }, [logs, isAr]);

  /* ─── Year calendar data ─── */
  const yearLogMap = useMemo(() => {
    const map: Record<string, SleepLog> = {};
    for (const log of yearLogs) {
      map[log.date] = log;
    }
    return map;
  }, [yearLogs]);

  const calendarWeeks = useMemo(() => {
    const year = calendarYear;
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    // Start from the Saturday on or before Jan 1
    const startDay = new Date(jan1);
    const d = startDay.getDay(); // 0=Sun
    const satOff = (d + 1) % 7; // how many days since Saturday
    startDay.setDate(startDay.getDate() - satOff);

    const weeks: { date: Date; dateStr: string }[][] = [];
    let current = new Date(startDay);
    while (current <= dec31 || weeks.length === 0) {
      const week: { date: Date; dateStr: string }[] = [];
      for (let i = 0; i < 7; i++) {
        week.push({
          date: new Date(current),
          dateStr: current.toISOString().split('T')[0],
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      if (current > dec31 && weeks.length >= 52) break;
    }
    return weeks;
  }, [calendarYear]);

  /* ─── Day detail popup data ─── */
  const selectedDayLog = selectedDay ? yearLogMap[selectedDay] : null;

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={cn('rounded-2xl animate-pulse bg-[var(--foreground)]/[0.04]', i === 5 ? 'h-48' : 'h-20')} />
        ))}
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ═══ Reminder Banner ═══ */}
      <AnimatePresence>
        {reminderBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, purple))' }}
          >
            <AlarmClock className="w-4 h-4" />
            {reminderBanner}
            <button onClick={() => setReminderBanner('')} className="ms-auto cursor-pointer"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 1. Header ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, black))', boxShadow: '0 4px 14px rgba(var(--color-primary-rgb) / 0.25)' }}>
          <Moon className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--foreground)]">{isAr ? 'النوم' : 'Sleep'}</h1>
          <p className="text-[11px] text-[var(--foreground)]/40">{isAr ? 'تتبع نومك وحسّن نظامك الصحي' : 'Track your sleep & improve your routine'}</p>
        </div>
      </motion.div>

      <div className="space-y-4">
        {/* ═══ 2. Sleep Schedule Card ═══ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          className="app-card rounded-2xl p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              {isAr ? 'جدول النوم' : 'Sleep Schedule'}
            </span>
            {(() => {
              if (!config?.last_schedule_edit) {
                return (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                    <Edit3 className="w-2.5 h-2.5" />
                    {isAr ? 'يمكنك التعديل الآن' : 'Editable now'}
                  </span>
                );
              }
              // Calculate days since edit using calendar days (resets at midnight)
              const editDate = new Date(config.last_schedule_edit);
              const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
              const editDayStart = new Date(editDate); editDayStart.setHours(0, 0, 0, 0);
              const daysPassed = Math.floor((todayStart.getTime() - editDayStart.getTime()) / 86400000);
              const canEdit = daysPassed >= 7;
              const daysLeft = 7 - daysPassed;

              if (canEdit) {
                return (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                    <Edit3 className="w-2.5 h-2.5" />
                    {isAr ? 'يمكنك التعديل الآن' : 'Editable now'}
                  </span>
                );
              }

              // Show next edit date
              const nextEditDate = new Date(editDayStart.getTime() + 7 * 86400000);
              const nextEditStr = nextEditDate.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' });
              return (
                <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" />
                  {isAr ? `التعديل القادم: ${nextEditStr} (${daysLeft} أيام)` : `Next edit: ${nextEditStr} (${daysLeft}d)`}
                </span>
              );
            })()}
          </div>

          {/* Time inputs — always visible, editable once per 7 calendar days */}
          {(() => {
            let canEdit = true;
            if (config?.last_schedule_edit) {
              const editDate = new Date(config.last_schedule_edit);
              const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
              const editDayStart = new Date(editDate); editDayStart.setHours(0, 0, 0, 0);
              const daysPassed = Math.floor((todayStart.getTime() - editDayStart.getTime()) / 86400000);
              canEdit = daysPassed >= 7;
            }
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Bedtime input */}
                  <div className={cn(
                    'relative rounded-xl p-3 transition-all duration-200',
                    canEdit
                      ? 'bg-[rgba(var(--color-primary-rgb)/0.04)] border-[1.5px] border-[rgba(var(--color-primary-rgb)/0.15)] hover:border-[rgba(var(--color-primary-rgb)/0.3)] hover:shadow-md'
                      : 'bg-[var(--foreground)]/[0.02] border-[1.5px] border-[var(--foreground)]/[0.06]',
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        'w-6 h-6 rounded-lg flex items-center justify-center',
                        canEdit ? 'bg-[rgba(var(--color-primary-rgb)/0.12)]' : 'bg-[var(--foreground)]/[0.05]',
                      )}>
                        <Moon className={cn('w-3 h-3', canEdit ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]/30')} />
                      </div>
                      <label className="text-[11px] font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">
                        {isAr ? 'وقت النوم' : 'Bedtime'}
                      </label>
                    </div>
                    {canEdit ? (
                      <input
                        type="time"
                        value={editBed}
                        onChange={e => setEditBed(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg text-base font-bold tabular-nums bg-[var(--color-background)] border-[1.5px] border-[rgba(var(--color-primary-rgb)/0.12)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]/40 transition-all"
                      />
                    ) : (
                      <div className="h-10 px-3 rounded-lg flex items-center text-base font-bold tabular-nums text-[var(--foreground)] bg-[var(--foreground)]/[0.02] border-[1.5px] border-[var(--foreground)]/[0.04]">
                        {config ? to12h(config.bedtime) : '—'}
                      </div>
                    )}
                  </div>

                  {/* Wake time input */}
                  <div className={cn(
                    'relative rounded-xl p-3 transition-all duration-200',
                    canEdit
                      ? 'bg-[rgba(var(--color-primary-rgb)/0.04)] border-[1.5px] border-[rgba(var(--color-primary-rgb)/0.15)] hover:border-[rgba(var(--color-primary-rgb)/0.3)] hover:shadow-md'
                      : 'bg-[var(--foreground)]/[0.02] border-[1.5px] border-[var(--foreground)]/[0.06]',
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        'w-6 h-6 rounded-lg flex items-center justify-center',
                        canEdit ? 'bg-[rgba(var(--color-primary-rgb)/0.12)]' : 'bg-[var(--foreground)]/[0.05]',
                      )}>
                        <Sunrise className={cn('w-3 h-3', canEdit ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]/30')} />
                      </div>
                      <label className="text-[11px] font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">
                        {isAr ? 'وقت الاستيقاظ' : 'Wake Time'}
                      </label>
                    </div>
                    {canEdit ? (
                      <input
                        type="time"
                        value={editWake}
                        onChange={e => setEditWake(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg text-base font-bold tabular-nums bg-[var(--color-background)] border-[1.5px] border-[rgba(var(--color-primary-rgb)/0.12)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]/40 transition-all"
                      />
                    ) : (
                      <div className="h-10 px-3 rounded-lg flex items-center text-base font-bold tabular-nums text-[var(--foreground)] bg-[var(--foreground)]/[0.02] border-[1.5px] border-[var(--foreground)]/[0.04]">
                        {config ? to12h(config.wake_time) : '—'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration + Save row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--foreground)]/40">{isAr ? 'مدة النوم:' : 'Duration:'}</span>
                    <span className="text-sm font-bold tabular-nums text-[var(--color-primary)]">
                      {config ? calcDurationStr(canEdit ? editBed : config.bedtime, canEdit ? editWake : config.wake_time) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {saving && (
                      <span className="text-[11px] text-[var(--foreground)]/40 flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
                        {isAr ? 'جاري الحفظ...' : 'Saving...'}
                      </span>
                    )}
                    {saved && !saving && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {isAr ? 'تم الحفظ' : 'Saved'}
                      </span>
                    )}
                    {canEdit && (editBed !== config?.bedtime || editWake !== config?.wake_time) && !saving && (
                      <>
                        <span className="text-[10px] text-[var(--foreground)]/25">{isAr ? 'يحفظ تلقائيًا...' : 'Auto-saves...'}</span>
                        <button onClick={saveSchedule}
                          className="app-btn-primary h-7 px-3 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1">
                          <Check className="w-3 h-3" />{isAr ? 'حفظ الآن' : 'Save Now'}
                        </button>
                        <button onClick={() => { if (config) { setEditBed(config.bedtime); setEditWake(config.wake_time); } setEditError(''); }}
                          className="app-btn-secondary h-7 px-2.5 rounded-lg text-[11px] cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editError && <p className="text-xs text-red-500 font-medium">{editError}</p>}

                {/* Edit rule note */}
                <div className="app-card rounded-xl p-3 mt-2">
                  {(() => {
                    const lastEdit = config?.last_schedule_edit ? new Date(config.last_schedule_edit) : null;
                    const lastEditStr = lastEdit
                      ? lastEdit.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })
                      : null;
                    let nextEditStr = '';
                    let daysLeft = 0;
                    if (lastEdit && !canEdit) {
                      const editDayStart = new Date(lastEdit); editDayStart.setHours(0, 0, 0, 0);
                      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                      daysLeft = 7 - Math.floor((todayStart.getTime() - editDayStart.getTime()) / 86400000);
                      const nextDate = new Date(editDayStart.getTime() + 7 * 86400000);
                      nextEditStr = nextDate.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' });
                    }
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center bg-[rgba(var(--color-primary-rgb)/0.1)]">
                            <Clock className="w-3 h-3 text-[var(--color-primary)]" />
                          </div>
                          <span className="text-xs font-semibold text-[var(--foreground)]/70">
                            {isAr ? 'قاعدة التعديل' : 'Edit Policy'}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-[var(--foreground)]/50 ps-7">
                          {isAr
                            ? 'يمكن تعديل جدول النوم مرة واحدة كل 7 أيام — لتشجيعك على الالتزام بجدول ثابت. يُعاد الحساب عند منتصف الليل.'
                            : 'Sleep schedule can be changed once every 7 days — to encourage a consistent routine. Resets at midnight.'}
                        </p>
                        <div className="flex items-center gap-3 ps-7 pt-0.5">
                          {lastEditStr ? (
                            <span className="text-[11px] text-[var(--foreground)]/40">
                              {isAr ? `آخر تعديل: ${lastEditStr}` : `Last edit: ${lastEditStr}`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-medium">
                              {isAr ? 'لم يُعدَّل بعد' : 'Not yet edited'}
                            </span>
                          )}
                          {nextEditStr && (
                            <>
                              <span className="text-[var(--foreground)]/15">•</span>
                              <span className="text-[11px] font-semibold text-[var(--color-primary)]">
                                {isAr ? `التعديل القادم: ${nextEditStr} (${daysLeft} أيام)` : `Next edit: ${nextEditStr} (${daysLeft}d)`}
                              </span>
                            </>
                          )}
                          {canEdit && lastEditStr && (
                            <>
                              <span className="text-[var(--foreground)]/15">•</span>
                              <span className="text-[11px] font-semibold text-emerald-600">
                                {isAr ? 'متاح للتعديل الآن' : 'Available to edit now'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* ── Sleep Control Buttons ── */}
          <div className="mt-4 pt-4 border-t border-[var(--foreground)]/[0.06]">
            {!activeSleepLog ? (
              /* NOT SLEEPING — show Start Sleep button */
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]/60">
                    {isAr ? 'التحكم بالنوم' : 'Sleep Control'}
                  </p>
                  {countdown && (
                    <p className="text-[11px] text-[var(--foreground)]/35 mt-0.5 tabular-nums">
                      {isAr ? `النوم بعد ${countdown}` : `Bedtime in ${countdown}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={startSleep}
                  className="group relative h-10 px-6 rounded-xl text-sm font-bold cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 75%, #1e1b4b))',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 16px rgba(var(--color-primary-rgb) / 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    {isAr ? 'بدء النوم' : 'Start Sleep'}
                  </span>
                </button>
              </div>
            ) : (
              /* SLEEPING — show elapsed, pause/resume, end */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground)]/60 flex items-center gap-1.5">
                      {activeSleepLog.paused_at ? (
                        <><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />{isAr ? 'النوم متوقف مؤقتًا' : 'Sleep Paused'}</>
                      ) : (
                        <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{isAr ? 'نائم الآن' : 'Sleeping Now'}</>
                      )}
                    </p>
                    <p className="text-2xl font-extrabold tabular-nums text-[var(--foreground)] mt-1 tracking-tight" style={{ fontFamily: 'monospace, system-ui' }}>
                      {sleepElapsed || '0:00:00'}
                    </p>
                    {(activeSleepLog.pause_count > 0 || activeSleepLog.paused_at) && (
                      <p className="text-[10px] text-[var(--foreground)]/30 mt-0.5">
                        {isAr
                          ? `${activeSleepLog.pause_count + (activeSleepLog.paused_at ? 1 : 0)} إيقاف مؤقت`
                          : `${activeSleepLog.pause_count + (activeSleepLog.paused_at ? 1 : 0)} pause(s)`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Pause / Resume button */}
                    {activeSleepLog.paused_at ? (
                      <button
                        onClick={resumeSleep}
                        className="group relative h-10 px-5 rounded-xl text-sm font-bold cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.97]"
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white',
                          border: '2px solid rgba(255,255,255,0.12)',
                          boxShadow: '0 4px 16px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                        }}
                      >
                        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          {isAr ? 'استئناف' : 'Resume'}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={pauseSleep}
                        className="group relative h-10 px-5 rounded-xl text-sm font-bold cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.97]"
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: 'white',
                          border: '2px solid rgba(255,255,255,0.12)',
                          boxShadow: '0 4px 16px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                        }}
                      >
                        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {isAr ? 'إيقاف مؤقت' : 'Pause'}
                        </span>
                      </button>
                    )}

                    {/* End Sleep button */}
                    <button
                      onClick={wakeUp}
                      className="group relative h-10 px-5 rounded-xl text-sm font-bold cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.97]"
                      style={{
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        color: 'white',
                        border: '2px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 4px 16px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                      }}
                    >
                      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center gap-2">
                        <Sunrise className="w-4 h-4" />
                        {isAr ? 'استيقاظ' : 'Wake Up'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reminder row */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--foreground)]/[0.05]">
                <button onClick={toggleReminder} className={cn(
                  'flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors',
                  config?.reminder_enabled ? 'text-[var(--color-primary)]' : 'text-[var(--foreground)]/30',
                )}>
                  {config?.reminder_enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                  {isAr ? 'التذكير' : 'Reminder'}
                </button>
                {config?.reminder_enabled && (
                  <select
                    value={config.reminder_offset_minutes}
                    onChange={e => updateReminderOffset(Number(e.target.value))}
                    className="h-6 px-1.5 rounded-md text-[11px] bg-[var(--foreground)]/[0.04] border border-[var(--foreground)]/[0.08] text-[var(--foreground)] cursor-pointer"
                  >
                    {OFFSET_OPTIONS.map(o => (
                      <option key={o} value={o}>{o} {isAr ? 'د' : 'min'}</option>
                    ))}
                  </select>
                )}
                <span className="text-[10px] text-[var(--foreground)]/25 ms-auto">
                  {config?.reminder_enabled ? (isAr ? `قبل النوم بـ ${config.reminder_offset_minutes} دقيقة` : `${config.reminder_offset_minutes}min before bed`) : ''}
                </span>
              </div>
        </motion.div>

        {/* ═══ 3. Tonight's Sleep Card ═══ */}
        {config?.enabled && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="app-card rounded-2xl p-4">

            {/* State A: Sleeping */}
            {activeSleepLog ? (
              <div className="text-center py-2">
                <p className="text-xs text-[var(--foreground)]/40 mb-1 flex items-center justify-center gap-1">
                  <Moon className="w-3 h-3" />{isAr ? 'مدة النوم' : 'Sleeping for'}
                </p>
                <p className="text-3xl font-extrabold tabular-nums text-[var(--color-primary)] mb-3 tracking-tight">{sleepElapsed || '0:00:00'}</p>
                <button onClick={wakeUp}
                  className="h-10 px-8 rounded-xl text-sm font-bold cursor-pointer transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'white', boxShadow: '0 4px 14px rgba(245,158,11,0.25)' }}>
                  <Sunrise className="w-4 h-4 inline-block me-1.5 -mt-0.5" />
                  {isAr ? 'استيقاظ' : 'Wake Up'}
                </button>
              </div>
            ) : showRatingForm ? (
              /* State C: Just woke up — compact rating form */
              <div className="space-y-3">
                <p className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  {isAr ? 'كيف كان نومك؟' : 'How was your sleep?'}
                </p>

                {/* Quality */}
                <div>
                  <p className="text-[11px] text-[var(--foreground)]/50 mb-1.5">{isAr ? 'جودة النوم' : 'Sleep Quality'}</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setRateQuality(n)}
                        className={cn('w-8 h-8 rounded-lg text-xs font-bold cursor-pointer transition-all',
                          rateQuality === n
                            ? 'bg-[var(--color-primary)] text-white scale-110 shadow-md'
                            : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/[0.1]')}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <p className="text-[11px] text-[var(--foreground)]/50 mb-1.5">{isAr ? 'المزاج عند الاستيقاظ' : 'Wake-up Mood'}</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setRateMood(n)}
                        className={cn('w-8 h-8 rounded-lg text-xs font-bold cursor-pointer transition-all',
                          rateMood === n
                            ? 'bg-[var(--color-primary)] text-white scale-110 shadow-md'
                            : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/[0.1]')}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes + Dream */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[11px] text-[var(--foreground)]/50 mb-1 flex items-center gap-1">
                      <Pen className="w-3 h-3" />{isAr ? 'ملاحظات' : 'Notes'}
                    </p>
                    <textarea
                      value={rateNotes} onChange={e => setRateNotes(e.target.value)}
                      rows={2}
                      placeholder={isAr ? 'كيف كان نومك...' : 'How did you sleep...'}
                      className="w-full rounded-lg text-xs px-2.5 py-2 bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.08] text-[var(--foreground)] placeholder:text-[var(--foreground)]/20 resize-none"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--foreground)]/50 mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />{isAr ? 'أحلام' : 'Dreams'}
                    </p>
                    <textarea
                      value={rateDream} onChange={e => setRateDream(e.target.value)}
                      rows={2}
                      placeholder={isAr ? 'هل حلمت بشيء...' : 'Any dreams...'}
                      className="w-full rounded-lg text-xs px-2.5 py-2 bg-[var(--foreground)]/[0.03] border border-[var(--foreground)]/[0.08] text-[var(--foreground)] placeholder:text-[var(--foreground)]/20 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={saveRating} disabled={savingRating}
                    className="app-btn-primary h-8 px-4 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" />{isAr ? 'حفظ' : 'Save'}
                  </button>
                  <button onClick={() => { setShowRatingForm(false); setRatingLogId(null); loadData(); }}
                    className="app-btn-secondary h-8 px-3 rounded-lg text-xs cursor-pointer">
                    {isAr ? 'تخطي' : 'Skip'}
                  </button>
                </div>
              </div>
            ) : (
              /* State B: Before bedtime */
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    {isAr ? 'نوم الليلة' : "Tonight's Sleep"}
                  </span>
                  {countdown && (
                    <p className="text-xs text-[var(--foreground)]/40 mt-0.5 tabular-nums">
                      {isAr ? `النوم بعد ${countdown}` : `Bedtime in ${countdown}`}
                    </p>
                  )}
                </div>
                <button onClick={startSleep}
                  className="app-btn-primary h-9 px-5 rounded-xl text-xs font-bold cursor-pointer">
                  <Moon className="w-3.5 h-3.5 inline-block me-1.5 -mt-0.5" />
                  {isAr ? 'بدء النوم' : 'Start Sleep'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ 4. Stats Row ═══ */}
        {completedLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="grid grid-cols-4 gap-2.5">
            {[
              { label: isAr ? 'متوسط المدة' : 'Avg Duration', value: fmtDuration(avgDuration), color: avgDuration ? durColor(avgDuration) : '', icon: <Clock className="w-3 h-3" /> },
              { label: isAr ? 'الجودة' : 'Quality', value: avgQuality ? `${avgQuality}/5` : '—', color: '', icon: <Star className="w-3 h-3" /> },
              { label: isAr ? 'الاتساق' : 'Consistency', value: `${consistency}%`, color: consistency >= 70 ? 'text-emerald-500' : consistency >= 50 ? 'text-amber-500' : 'text-red-500', icon: <TrendingUp className="w-3 h-3" /> },
              { label: isAr ? 'السلسلة' : 'Streak', value: `${currentStreak}`, color: currentStreak >= 7 ? 'text-emerald-500' : currentStreak >= 3 ? 'text-amber-500' : 'text-[var(--foreground)]', icon: <Zap className="w-3 h-3" /> },
            ].map((stat, i) => (
              <div key={i} className="app-stat-card rounded-xl p-2.5 text-center">
                <div className="flex justify-center mb-1 text-[var(--foreground)]/30">{stat.icon}</div>
                <p className={cn('text-base font-extrabold tabular-nums', stat.color || 'text-[var(--foreground)]')}>{stat.value}</p>
                <p className="text-[9px] text-[var(--foreground)]/35 mt-0.5 leading-tight">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* ═══ 5. Weekly Mini-Chart ═══ */}
        {logs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="app-card rounded-2xl p-4">
            <p className="text-xs font-bold text-[var(--foreground)] mb-3 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              {isAr ? 'هذا الأسبوع' : 'This Week'}
            </p>
            <div className="flex items-end justify-between gap-1.5" style={{ height: 80 }}>
              {weekData.map((day, i) => {
                const maxH = 12;
                const barH = day.hours > 0 ? Math.max(6, (day.hours / maxH) * 68) : 4;
                const isToday = day.date === todayStr;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 gap-1">
                    {day.hours > 0 && (
                      <span className="text-[9px] tabular-nums text-[var(--foreground)]/40 font-medium">
                        {day.hours.toFixed(1)}
                      </span>
                    )}
                    <div
                      className={cn('w-full rounded-md transition-all', durBg(day.hours > 0 ? day.hours * 60 : null))}
                      style={{ height: barH, minWidth: 8, opacity: day.hours > 0 ? 0.85 : 0.15 }}
                    />
                    <span className={cn('text-[9px] font-medium',
                      isToday ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--foreground)]/35')}>
                      {day.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ 6. Yearly Calendar — 12 Month Grid ═══ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="app-card rounded-2xl p-4">
          {/* Year selector */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              {isAr ? 'التقويم السنوي' : 'Year Calendar'}
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCalendarYear(y => y - 1)}
                className="app-btn-secondary w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold tabular-nums text-[var(--foreground)] min-w-[3rem] text-center">{calendarYear}</span>
              <button onClick={() => setCalendarYear(y => y + 1)}
                className="app-btn-secondary w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 12 Month Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {Array.from({ length: 12 }, (_, monthIdx) => {
              const monthNames = isAr ? MONTH_NAMES_AR : MONTH_NAMES_EN;
              const firstDay = new Date(calendarYear, monthIdx, 1);
              const daysInMonth = new Date(calendarYear, monthIdx + 1, 0).getDate();
              const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
              const dayAbbrs = isAr ? ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
              const cells: (number | null)[] = Array(startDow).fill(null);
              for (let d = 1; d <= daysInMonth; d++) cells.push(d);
              while (cells.length % 7 !== 0) cells.push(null);

              return (
                <div key={monthIdx} className="min-w-0">
                  <p className="text-[10px] font-bold text-[var(--foreground)]/50 mb-1.5 text-center">{monthNames[monthIdx]}</p>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-[2px] mb-1">
                    {dayAbbrs.map((d, i) => (
                      <span key={i} className="text-[7px] text-[var(--foreground)]/25 text-center leading-none">{d}</span>
                    ))}
                  </div>
                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-[2px]">
                    {cells.map((day, ci) => {
                      if (day === null) return <div key={ci} className="aspect-square" />;
                      const dateStr = `${calendarYear}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const log = yearLogMap[dateStr];
                      const isToday = dateStr === todayStr;
                      const mins = log?.sleep_duration_minutes;
                      let bg = 'bg-[var(--foreground)]/[0.04]';
                      if (log && mins && mins > 0) {
                        if (mins >= 420 && mins <= 540) bg = 'bg-emerald-500';
                        else if (mins >= 360) bg = 'bg-emerald-400/60';
                        else if (mins > 600) bg = 'bg-red-500';
                        else bg = 'bg-red-400/70';
                      }
                      const hasData = !!log;
                      return (
                        <button
                          key={ci}
                          onClick={() => hasData && setSelectedDay(dateStr)}
                          className={cn(
                            'aspect-square rounded-[3px] text-[7px] font-medium flex items-center justify-center transition-all',
                            bg,
                            hasData && 'cursor-pointer hover:scale-125 hover:shadow-md hover:z-10',
                            !hasData && 'cursor-default',
                            isToday && 'ring-1.5 ring-[var(--color-primary)] ring-offset-1 ring-offset-[var(--color-background)]',
                            log && mins && mins > 0 ? 'text-white/80' : 'text-[var(--foreground)]/25',
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-[var(--foreground)]/[0.05]">
            {[
              { color: 'bg-[var(--foreground)]/[0.04]', label: isAr ? 'لا بيانات' : 'No data' },
              { color: 'bg-red-400/70', label: isAr ? '< 6 ساعات' : '< 6h' },
              { color: 'bg-emerald-400/60', label: isAr ? '6-7 ساعات' : '6-7h' },
              { color: 'bg-emerald-500', label: isAr ? '7-9 ساعات' : '7-9h' },
              { color: 'bg-red-500', label: isAr ? '> 10 ساعات' : '> 10h' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={cn('w-3 h-3 rounded-[3px]', item.color)} />
                <span className="text-[9px] text-[var(--foreground)]/35">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ═══ Day Detail Modal ═══ */}
        <AnimatePresence>
          {selectedDay && (() => {
            const log = yearLogMap[selectedDay];
            const dayDate = new Date(selectedDay + 'T00:00:00');
            const fullDate = dayDate.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            const sleepTime = log?.sleep_button_at ? new Date(log.sleep_button_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null;
            const wakeTime = log?.wake_button_at ? new Date(log.wake_button_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : null;

            return (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setSelectedDay(null)}
                  className="fixed inset-0 z-[var(--z-overlay)] bg-black/30 backdrop-blur-sm"
                />
                {/* Modal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
                  onClick={() => setSelectedDay(null)}
                >
                  <div
                    onClick={e => e.stopPropagation()}
                    className="app-card rounded-2xl w-full max-w-sm p-5 space-y-4"
                    style={{ background: 'var(--color-background)' }}
                  >
                    {/* Modal header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--color-primary-rgb)/0.1)' }}>
                          <Moon className="w-4.5 h-4.5 text-[var(--color-primary)]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--foreground)]">{fullDate}</p>
                          <p className="text-[10px] text-[var(--foreground)]/35">{isAr ? 'تفاصيل النوم' : 'Sleep Details'}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedDay(null)} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[var(--foreground)]/[0.05] transition-colors">
                        <X className="w-4 h-4 text-[var(--foreground)]/40" />
                      </button>
                    </div>

                    {log ? (
                      <>
                        {/* Duration hero */}
                        <div className="text-center py-2">
                          <p className={cn('text-3xl font-extrabold tabular-nums', durColor(log.sleep_duration_minutes))}>
                            {fmtDuration(log.sleep_duration_minutes)}
                          </p>
                          <p className="text-[10px] text-[var(--foreground)]/30 mt-1">{isAr ? 'مدة النوم الفعلية' : 'Actual sleep duration'}</p>
                        </div>

                        {/* Time details */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="app-stat-card rounded-xl p-3 text-center">
                            <Moon className="w-3.5 h-3.5 text-[var(--foreground)]/30 mx-auto mb-1" />
                            <p className="text-xs font-bold tabular-nums text-[var(--foreground)]">{sleepTime || '—'}</p>
                            <p className="text-[9px] text-[var(--foreground)]/30 mt-0.5">{isAr ? 'وقت النوم' : 'Bedtime'}</p>
                            {log.bedtime_deviation_minutes !== null && (
                              <p className="text-[9px] font-medium mt-0.5" style={{ color: Math.abs(log.bedtime_deviation_minutes) <= 15 ? '#10b981' : '#f59e0b' }}>
                                {fmtDeviation(log.bedtime_deviation_minutes, isAr)}
                              </p>
                            )}
                          </div>
                          <div className="app-stat-card rounded-xl p-3 text-center">
                            <Sunrise className="w-3.5 h-3.5 text-[var(--foreground)]/30 mx-auto mb-1" />
                            <p className="text-xs font-bold tabular-nums text-[var(--foreground)]">{wakeTime || '—'}</p>
                            <p className="text-[9px] text-[var(--foreground)]/30 mt-0.5">{isAr ? 'وقت الاستيقاظ' : 'Wake Time'}</p>
                            {log.wake_deviation_minutes !== null && (
                              <p className="text-[9px] font-medium mt-0.5" style={{ color: Math.abs(log.wake_deviation_minutes) <= 15 ? '#10b981' : '#f59e0b' }}>
                                {fmtDeviation(log.wake_deviation_minutes, isAr)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quality + Mood + Pauses */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg p-2 text-center bg-[var(--foreground)]/[0.02] border border-[var(--foreground)]/[0.05]">
                            <p className="text-[9px] text-[var(--foreground)]/35">{isAr ? 'الجودة' : 'Quality'}</p>
                            <p className="text-sm font-bold text-[var(--foreground)]">{log.sleep_quality ? `${log.sleep_quality}/5` : '—'}</p>
                          </div>
                          <div className="rounded-lg p-2 text-center bg-[var(--foreground)]/[0.02] border border-[var(--foreground)]/[0.05]">
                            <p className="text-[9px] text-[var(--foreground)]/35">{isAr ? 'المزاج' : 'Mood'}</p>
                            <p className="text-sm font-bold text-[var(--foreground)]">{log.mood_on_wake ? `${log.mood_on_wake}/5` : '—'}</p>
                          </div>
                          <div className="rounded-lg p-2 text-center bg-[var(--foreground)]/[0.02] border border-[var(--foreground)]/[0.05]">
                            <p className="text-[9px] text-[var(--foreground)]/35">{isAr ? 'إيقافات' : 'Pauses'}</p>
                            <p className="text-sm font-bold text-[var(--foreground)]">{log.pause_count || 0}</p>
                          </div>
                        </div>

                        {/* Scheduled times */}
                        <div className="text-center py-1">
                          <p className="text-[10px] text-[var(--foreground)]/30">
                            {isAr ? 'الجدول المخطط:' : 'Scheduled:'} {to12h(log.scheduled_bedtime)} → {to12h(log.scheduled_wake_time)}
                          </p>
                        </div>

                        {/* Notes */}
                        {(log.notes || log.dream_note) && (
                          <div className="space-y-2 pt-2 border-t border-[var(--foreground)]/[0.05]">
                            {log.notes && (
                              <div>
                                <p className="text-[10px] font-semibold text-[var(--foreground)]/40 mb-0.5">{isAr ? 'ملاحظات' : 'Notes'}</p>
                                <p className="text-xs text-[var(--foreground)]/60 leading-relaxed">{log.notes}</p>
                              </div>
                            )}
                            {log.dream_note && (
                              <div>
                                <p className="text-[10px] font-semibold text-[var(--foreground)]/40 mb-0.5">{isAr ? 'أحلام' : 'Dreams'}</p>
                                <p className="text-xs text-[var(--foreground)]/60 leading-relaxed">{log.dream_note}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <Moon className="w-8 h-8 text-[var(--foreground)]/10 mx-auto mb-2" />
                        <p className="text-sm text-[var(--foreground)]/30">{isAr ? 'لا يوجد بيانات نوم لهذا اليوم' : 'No sleep data for this day'}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>

        {/* ═══ 7. Sleep History (collapsible) ═══ */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="app-card rounded-2xl">
          <button onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 cursor-pointer">
            <span className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              {isAr ? 'سجل النوم' : 'Sleep History'}
              <span className="text-[10px] text-[var(--foreground)]/25 font-normal ms-1">
                ({isAr ? `آخر 14 يوم` : 'Last 14 days'})
              </span>
            </span>
            {showHistory ? <ChevronUp className="w-4 h-4 text-[var(--foreground)]/30" /> : <ChevronDown className="w-4 h-4 text-[var(--foreground)]/30" />}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-0.5">
                  {logs.length === 0 ? (
                    <p className="text-xs text-[var(--foreground)]/30 text-center py-4">
                      {isAr ? 'لا يوجد سجل نوم بعد' : 'No sleep logs yet'}
                    </p>
                  ) : logs.slice(0, 14).map((log, idx) => {
                    const d = new Date(log.date + 'T00:00:00');
                    const dayName = d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'short' });
                    const dateStr = d.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric' });
                    const sleepTime = log.sleep_button_at ? new Date(log.sleep_button_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—';
                    const wakeTime = log.wake_button_at ? new Date(log.wake_button_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: isAr ? 8 : -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="flex items-center gap-2 py-2 border-b border-[var(--foreground)]/[0.04] last:border-0"
                      >
                        <div className="w-12 shrink-0">
                          <p className="text-[10px] text-[var(--foreground)]/35">{dayName}</p>
                          <p className="text-[11px] font-bold text-[var(--foreground)]/60">{dateStr}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-[var(--foreground)]/50 tabular-nums truncate">
                            {sleepTime} → {wakeTime}
                          </p>
                        </div>
                        <span className={cn('text-xs font-bold tabular-nums shrink-0', durColor(log.sleep_duration_minutes))}>
                          {fmtDuration(log.sleep_duration_minutes)}
                        </span>
                        {log.sleep_quality !== null && log.sleep_quality !== undefined && (
                          <span className="text-[10px] text-[var(--foreground)]/35 shrink-0 tabular-nums">
                            {log.sleep_quality}/5
                          </span>
                        )}
                        <span className={cn('text-[10px] shrink-0', {
                          'text-red-500': (log.bedtime_deviation_minutes ?? 0) > 15,
                          'text-emerald-500': (log.bedtime_deviation_minutes ?? 0) < -5,
                          'text-[var(--foreground)]/25': !((log.bedtime_deviation_minutes ?? 0) > 15) && !((log.bedtime_deviation_minutes ?? 0) < -5),
                        })}>
                          {fmtDeviation(log.bedtime_deviation_minutes, isAr)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ═══ 8. Bedtime Reminder ═══ */}
        {notifPermission !== 'unsupported' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="app-card rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    {isAr ? 'إشعارات المتصفح' : 'Browser Notifications'}
                  </p>
                  <p className="text-[10px] text-[var(--foreground)]/35">
                    {notifPermission === 'granted'
                      ? (isAr ? 'مفعّلة' : 'Enabled')
                      : notifPermission === 'denied'
                        ? (isAr ? 'محظورة — فعّلها من إعدادات المتصفح' : 'Blocked — enable in browser settings')
                        : (isAr ? 'فعّل الإشعارات لتذكيرك بموعد النوم' : 'Enable notifications for bedtime reminders')}
                  </p>
                </div>
              </div>
              {notifPermission === 'default' && (
                <button onClick={requestNotifPermission}
                  className="app-btn-primary h-7 px-3 rounded-lg text-[11px] font-semibold cursor-pointer">
                  {isAr ? 'تفعيل' : 'Enable'}
                </button>
              )}
              {notifPermission === 'granted' && (
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
