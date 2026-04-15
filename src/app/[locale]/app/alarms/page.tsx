'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useToast } from '@/components/app/toast-notifications';
import {
  Alarm, AlarmSound, AlarmType, WeekDay,
  ALARM_SOUNDS, ALARM_ICONS, ITEM_COLORS,
} from '@/types/app';
import { playAlarmPreview } from '@/lib/alarm-sounds';
import {
  Bell, BellRing, Plus, Pencil, Trash2, X, Clock,
  Volume2, VolumeX, Play, Square, Check, AlertTriangle,
  Calendar, ChevronDown, BellOff, AlarmClock, Timer,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────

const DAY_LABELS_AR = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
const DAY_LABELS_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
// WeekDay 0=Sat, 1=Sun, ..., 6=Fri
const WEEKDAYS: WeekDay[] = [0, 1, 2, 3, 4, 5, 6];

const SNOOZE_DURATIONS = [5, 10, 15, 20, 30];
const MAX_SNOOZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTH_NAMES_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

// ── Helpers ────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minuteGap(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 1440 - diff);
}

function formatTime12(time: string, isAr: boolean): { h: string; mm: string; period: string } {
  const [hh, mm] = time.split(':').map(Number);
  const period = hh >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
  const h12 = hh % 12 || 12;
  return { h: String(h12), mm: String(mm).padStart(2, '0'), period };
}

function getJSDayToWeekDay(jsDay: number): WeekDay {
  // JS: 0=Sun,1=Mon,...,6=Sat -> Our: 0=Sat,1=Sun,2=Mon,...,6=Fri
  const map: Record<number, WeekDay> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0 };
  return map[jsDay];
}

function getNextOccurrence(alarm: Alarm): Date | null {
  const now = new Date();
  const [hh, mm] = alarm.time.split(':').map(Number);

  // One-time alarm
  if (alarm.oneTimeDate) {
    const d = new Date(alarm.oneTimeDate + 'T' + alarm.time + ':00');
    return d > now ? d : null;
  }

  const mode = alarm.scheduleMode || 'weekdays';

  if (mode === 'weekdays' && (alarm.days?.length ?? 0) > 0) {
    // Check today and next 7 days
    for (let offset = 0; offset < 8; offset++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + offset);
      candidate.setHours(hh, mm, 0, 0);
      if (candidate <= now) continue;
      const wd = getJSDayToWeekDay(candidate.getDay());
      if (alarm.days?.includes(wd)) return candidate;
    }
  }

  if (mode === 'monthdays' && alarm.monthDays && alarm.monthDays.length > 0) {
    for (let offset = 0; offset < 62; offset++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + offset);
      candidate.setHours(hh, mm, 0, 0);
      if (candidate <= now) continue;
      if (alarm.monthDays.includes(candidate.getDate())) return candidate;
    }
  }

  if (mode === 'yeardays' && alarm.yearDays && alarm.yearDays.length > 0) {
    for (let offset = 0; offset < 400; offset++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + offset);
      candidate.setHours(hh, mm, 0, 0);
      if (candidate <= now) continue;
      if (alarm.yearDays.some(yd => yd.month === candidate.getMonth() + 1 && yd.day === candidate.getDate())) return candidate;
    }
  }

  // Fallback for no schedule: next occurrence is today or tomorrow at that time
  if ((alarm.days?.length ?? 0) === 0 && !alarm.oneTimeDate) {
    const today = new Date(now);
    today.setHours(hh, mm, 0, 0);
    if (today > now) return today;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hh, mm, 0, 0);
    return tomorrow;
  }

  return null;
}

function formatCountdown(target: Date, isAr: boolean): string {
  const now = new Date();
  let diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return isAr ? 'الآن' : 'now';
  const totalMin = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return isAr ? `بعد ${m} دقيقة` : `in ${m}m`;
  if (m === 0) return isAr ? `بعد ${h} ساعة` : `in ${h}h`;
  return isAr ? `بعد ${h} ساعة و ${m} دقيقة` : `in ${h}h ${m}m`;
}

// ── Default alarm data ────────────────────────────────────

function defaultAlarmData() {
  return {
    labelEn: '', labelAr: '', type: 'independent' as AlarmType,
    linkedId: '', time: '07:00', days: [] as WeekDay[],
    scheduleMode: 'weekdays' as 'weekdays' | 'monthdays' | 'yeardays',
    monthDays: [] as number[], yearDays: [] as { month: number; day: number }[],
    oneTimeDate: '', sound: 'classic' as AlarmSound, volume: 70,
    snoozeEnabled: true, snoozeDuration: 5, maxSnoozes: 3,
    vibrate: true, gradualVolume: false, enabled: true,
    color: ITEM_COLORS[5], icon: 'AlarmClock',
    scheduleType: 'weekly' as 'onetime' | 'weekly' | 'monthly' | 'yearly',
  };
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function AlarmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultAlarmData());
  const [formError, setFormError] = useState('');
  const [, setTick] = useState(0);
  const previewStopRef = useRef<(() => void) | null>(null);

  // Countdown refresh every 30 seconds
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  // Cleanup preview sound on unmount
  useEffect(() => {
    return () => { previewStopRef.current?.(); };
  }, []);

  const alarms = store.alarms ?? [];
  const habits = store.habits ?? [];

  // ── Sorted alarms: ringing first, then by time ──
  const sortedAlarms = useMemo(() => {
    return [...alarms].sort((a, b) => {
      const statusOrder = { ringing: 0, snoozed: 1, idle: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
  }, [alarms]);

  const ringingAlarms = useMemo(() => alarms.filter(a => a.status === 'ringing' || a.status === 'snoozed'), [alarms]);
  const enabledCount = useMemo(() => alarms.filter(a => a.enabled).length, [alarms]);
  const habitLinkedCount = useMemo(() => alarms.filter(a => a.type === 'habit').length, [alarms]);

  const nextAlarm = useMemo(() => {
    let earliest: Date | null = null;
    let earliestAlarm: Alarm | null = null;
    for (const a of alarms) {
      if (!a.enabled) continue;
      const next = getNextOccurrence(a);
      if (next && (!earliest || next < earliest)) {
        earliest = next;
        earliestAlarm = a;
      }
    }
    return earliest ? { date: earliest, alarm: earliestAlarm! } : null;
  }, [alarms]);

  // ── 3-minute gap validation ──
  const validateTimeGap = useCallback((time: string, excludeId?: string | null): string | null => {
    const newMin = timeToMinutes(time);
    for (const a of alarms) {
      if (excludeId && a.id === excludeId) continue;
      if (!a.enabled) continue;
      const gap = minuteGap(newMin, timeToMinutes(a.time));
      if (gap < 3) {
        const label = isAr ? a.labelAr || a.labelEn : a.labelEn || a.labelAr;
        return isAr
          ? `يجب أن يكون هناك 3 دقائق على الأقل بين المنبهات. التعارض مع "${label}" (${a.time})`
          : `Must have at least 3 minutes between alarms. Conflicts with "${label}" (${a.time})`;
      }
    }
    return null;
  }, [alarms, isAr]);

  // ── Form handlers ──
  const openCreate = useCallback(() => {
    setFormData(defaultAlarmData());
    setEditingId(null);
    setFormError('');
    setShowForm(true);
  }, []);

  const openEdit = useCallback((alarm: Alarm) => {
    const scheduleType = alarm.oneTimeDate ? 'onetime'
      : alarm.scheduleMode === 'monthdays' ? 'monthly'
      : alarm.scheduleMode === 'yeardays' ? 'yearly' : 'weekly';
    setFormData({
      labelEn: alarm.labelEn, labelAr: alarm.labelAr, type: alarm.type,
      linkedId: alarm.linkedId || '', time: alarm.time, days: [...alarm.days],
      scheduleMode: alarm.scheduleMode || 'weekdays',
      monthDays: alarm.monthDays ? [...alarm.monthDays] : [],
      yearDays: alarm.yearDays ? [...alarm.yearDays] : [],
      oneTimeDate: alarm.oneTimeDate || '', sound: alarm.sound, volume: alarm.volume,
      snoozeEnabled: alarm.snoozeEnabled, snoozeDuration: alarm.snoozeDuration,
      maxSnoozes: alarm.maxSnoozes, vibrate: alarm.vibrate,
      gradualVolume: alarm.gradualVolume, enabled: alarm.enabled,
      color: alarm.color, icon: alarm.icon, scheduleType,
    });
    setEditingId(alarm.id);
    setFormError('');
    setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    // Validate time gap
    const gapErr = validateTimeGap(formData.time, editingId);
    if (gapErr) { setFormError(gapErr); return; }

    // Validate labels
    if (!formData.labelEn.trim() && !formData.labelAr.trim()) {
      setFormError(isAr ? 'يرجى إدخال اسم المنبه' : 'Please enter an alarm label');
      return;
    }

    const scheduleMode = formData.scheduleType === 'monthly' ? 'monthdays'
      : formData.scheduleType === 'yearly' ? 'yeardays' : 'weekdays';

    const payload = {
      labelEn: formData.labelEn.trim(),
      labelAr: formData.labelAr.trim(),
      type: formData.type,
      linkedId: formData.type === 'habit' ? formData.linkedId || undefined : undefined,
      time: formData.time,
      days: formData.scheduleType === 'weekly' ? formData.days : [],
      scheduleMode: scheduleMode as 'weekdays' | 'monthdays' | 'yeardays',
      monthDays: formData.scheduleType === 'monthly' ? formData.monthDays : undefined,
      yearDays: formData.scheduleType === 'yearly' ? formData.yearDays : undefined,
      oneTimeDate: formData.scheduleType === 'onetime' ? formData.oneTimeDate || undefined : undefined,
      sound: formData.sound,
      volume: formData.volume,
      snoozeEnabled: formData.snoozeEnabled,
      snoozeDuration: formData.snoozeDuration,
      maxSnoozes: formData.maxSnoozes,
      vibrate: formData.vibrate,
      gradualVolume: formData.gradualVolume,
      enabled: formData.enabled,
      color: formData.color,
      icon: formData.icon,
    };

    if (editingId) {
      store.updateAlarm(editingId, payload);
      toast.notifySuccess(isAr ? 'تم تحديث المنبه' : 'Alarm updated');
    } else {
      store.addAlarm(payload);
      toast.notifySuccess(isAr ? 'تم إنشاء المنبه' : 'Alarm created');
    }
    setShowForm(false);
    setEditingId(null);
  }, [formData, editingId, isAr, store, toast, validateTimeGap]);

  const handleDelete = useCallback((id: string) => {
    store.deleteAlarm(id);
    toast.notifyInfo(isAr ? 'تم حذف المنبه' : 'Alarm deleted');
  }, [store, toast, isAr]);

  const handlePreviewSound = useCallback(() => {
    previewStopRef.current?.();
    const stop = playAlarmPreview(formData.sound, formData.volume);
    previewStopRef.current = stop;
    setTimeout(() => { stop(); }, 2500);
  }, [formData.sound, formData.volume]);

  const handleTimeChange = useCallback((time: string) => {
    setFormData(prev => ({ ...prev, time }));
    const err = validateTimeGap(time, editingId);
    setFormError(err || '');
  }, [editingId, validateTimeGap]);

  const toggleDay = useCallback((day: WeekDay) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  }, []);

  const toggleMonthDay = useCallback((day: number) => {
    setFormData(prev => ({
      ...prev,
      monthDays: prev.monthDays.includes(day) ? prev.monthDays.filter(d => d !== day) : [...prev.monthDays, day],
    }));
  }, []);

  const handleHabitSelect = useCallback((habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    setFormData(prev => ({
      ...prev,
      linkedId: habitId,
      labelEn: habit?.nameEn || prev.labelEn,
      labelAr: habit?.nameAr || prev.labelAr,
    }));
  }, [habits]);

  // ── Get habit name by id ──
  const getHabitName = useCallback((id?: string) => {
    if (!id) return '';
    const h = habits.find(h => h.id === id);
    if (!h) return '';
    return isAr ? h.nameAr || h.nameEn : h.nameEn || h.nameAr;
  }, [habits, isAr]);

  // ── Get sound label ──
  const getSoundLabel = useCallback((sound: AlarmSound) => {
    const s = ALARM_SOUNDS.find(s => s.id === sound);
    return s ? (isAr ? s.labelAr : s.labelEn) : sound;
  }, [isAr]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen pb-24" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-3 py-4 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-lg font-bold">{isAr ? 'المنبهات' : 'Alarms'}</h1>
          </div>
          <button onClick={openCreate} className="app-btn-primary flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg">
            <Plus className="h-4 w-4" />
            {isAr ? 'إنشاء منبه' : 'New Alarm'}
          </button>
        </div>

        {/* ── Statistics Strip ── */}
        {alarms.length > 0 && (
          <motion.div {...fadeUp} className="grid grid-cols-4 gap-2">
            {[
              { label: isAr ? 'الكل' : 'Total', value: alarms.length },
              { label: isAr ? 'مفعّل' : 'Enabled', value: enabledCount },
              { label: isAr ? 'التالي' : 'Next', value: nextAlarm ? formatTime12(nextAlarm.alarm.time, isAr).h + ':' + formatTime12(nextAlarm.alarm.time, isAr).mm + ' ' + formatTime12(nextAlarm.alarm.time, isAr).period : '-' },
              { label: isAr ? 'مرتبط' : 'Linked', value: habitLinkedCount },
            ].map((stat, i) => (
              <div key={i} className="app-card p-2 text-center rounded-lg">
                <div className="text-xs text-[var(--foreground)]/50">{stat.label}</div>
                <div className="text-sm font-bold mt-0.5">{stat.value}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Ringing / Snoozed Section ── */}
        <AnimatePresence>
          {ringingAlarms.length > 0 && (
            <motion.div {...fadeUp} className="space-y-2">
              {ringingAlarms.map(alarm => (
                <motion.div
                  key={alarm.id + '-ring'}
                  layout
                  className={cn(
                    'app-card p-3 rounded-xl border-2',
                    alarm.status === 'ringing' ? 'border-red-500/60 bg-red-500/5' : 'border-amber-500/60 bg-amber-500/5',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className={cn('h-3 w-3 rounded-full shrink-0', alarm.status === 'ringing' ? 'bg-red-500' : 'bg-amber-500')}
                      />
                      <div className="min-w-0">
                        <div className="text-lg font-bold">
                          {formatTime12(alarm.time, isAr).h}:{formatTime12(alarm.time, isAr).mm}{' '}
                          <span className="text-xs font-normal">{formatTime12(alarm.time, isAr).period}</span>
                        </div>
                        <div className="text-sm text-[var(--foreground)]/70 truncate">
                          {isAr ? alarm.labelAr || alarm.labelEn : alarm.labelEn || alarm.labelAr}
                        </div>
                        {alarm.status === 'snoozed' && (
                          <div className="text-xs text-amber-600 mt-0.5">
                            {isAr ? `غفوة ${alarm.snoozeCount}/${alarm.maxSnoozes}` : `Snooze ${alarm.snoozeCount}/${alarm.maxSnoozes}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {alarm.snoozeEnabled && alarm.snoozeCount < alarm.maxSnoozes && (
                        <button
                          onClick={() => store.snoozeAlarm(alarm.id)}
                          className="app-btn-secondary px-3 py-1.5 rounded-lg text-sm font-medium"
                        >
                          {isAr ? 'غفوة' : 'Snooze'}
                        </button>
                      )}
                      <button
                        onClick={() => store.dismissAlarm(alarm.id)}
                        className="app-btn-primary px-4 py-1.5 rounded-lg text-sm font-bold"
                      >
                        {isAr ? 'إيقاف' : 'Dismiss'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Alarms List ── */}
        {alarms.length === 0 ? (
          <motion.div {...fadeUp} className="app-card rounded-xl p-8 text-center">
            <BellOff className="h-12 w-12 mx-auto text-[var(--foreground)]/20 mb-3" />
            <p className="text-base font-semibold text-[var(--foreground)]/50">
              {isAr ? 'لا توجد منبهات' : 'No alarms yet'}
            </p>
            <p className="text-sm text-[var(--foreground)]/30 mt-1">
              {isAr ? 'أنشئ منبهك الأول للبدء' : 'Create your first alarm to get started'}
            </p>
            <button onClick={openCreate} className="app-btn-primary mt-4 px-4 py-2 rounded-lg text-sm">
              <Plus className="h-4 w-4 inline mr-1" />
              {isAr ? 'إنشاء منبه' : 'New Alarm'}
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {sortedAlarms.map(alarm => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  isAr={isAr}
                  getHabitName={getHabitName}
                  getSoundLabel={getSoundLabel}
                  onToggle={() => store.toggleAlarm(alarm.id)}
                  onEdit={() => openEdit(alarm)}
                  onDelete={() => handleDelete(alarm.id)}
                  onDismiss={() => store.dismissAlarm(alarm.id)}
                  onSnooze={() => store.snoozeAlarm(alarm.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <AnimatePresence>
        {showForm && (
          <AlarmFormModal
            isAr={isAr}
            formData={formData}
            setFormData={setFormData}
            formError={formError}
            editingId={editingId}
            habits={habits}
            onTimeChange={handleTimeChange}
            onToggleDay={toggleDay}
            onToggleMonthDay={toggleMonthDay}
            onHabitSelect={handleHabitSelect}
            onPreviewSound={handlePreviewSound}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditingId(null); previewStopRef.current?.(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// ALARM CARD COMPONENT
// ============================================================

interface AlarmCardProps {
  alarm: Alarm;
  isAr: boolean;
  getHabitName: (id?: string) => string;
  getSoundLabel: (sound: AlarmSound) => string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDismiss: () => void;
  onSnooze: () => void;
}

function AlarmCard({ alarm, isAr, getHabitName, getSoundLabel, onToggle, onEdit, onDelete, onDismiss, onSnooze }: AlarmCardProps) {
  const { h, mm, period } = formatTime12(alarm.time, isAr);
  const nextOcc = alarm.enabled ? getNextOccurrence(alarm) : null;
  const dayLabels = isAr ? DAY_LABELS_AR : DAY_LABELS_EN;
  const label = isAr ? alarm.labelAr || alarm.labelEn : alarm.labelEn || alarm.labelAr;
  const habitName = alarm.type === 'habit' ? getHabitName(alarm.linkedId) : '';

  const isOneTime = !!alarm.oneTimeDate;
  const scheduleMode = alarm.scheduleMode || 'weekdays';

  return (
    <motion.div
      layout
      {...fadeUp}
      className={cn(
        'app-card rounded-xl p-3 transition-all',
        !alarm.enabled && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors border-2',
            alarm.enabled
              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'bg-[var(--foreground)]/5 border-[var(--foreground)]/20 text-[var(--foreground)]/30',
          )}
        >
          {alarm.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">{h}:{mm}</span>
            <span className="text-sm text-[var(--foreground)]/50 font-medium">{period}</span>
            {/* Status dot */}
            <span className={cn(
              'h-2 w-2 rounded-full shrink-0',
              alarm.status === 'idle' && 'bg-[var(--foreground)]/20',
              alarm.status === 'ringing' && 'bg-red-500 animate-pulse',
              alarm.status === 'snoozed' && 'bg-amber-500 animate-pulse',
            )} />
          </div>

          {label && (
            <p className="text-sm text-[var(--foreground)]/70 mt-0.5 truncate">{label}</p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Schedule badges */}
            {isOneTime ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--foreground)]/5 text-[var(--foreground)]/50">
                {isAr ? 'مرة واحدة' : 'One-time'}{alarm.oneTimeDate ? ` ${alarm.oneTimeDate}` : ''}
              </span>
            ) : scheduleMode === 'weekdays' && (alarm.days?.length ?? 0) > 0 ? (
              (alarm.days?.length ?? 0) === 7 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  {isAr ? 'كل يوم' : 'Every day'}
                </span>
              ) : (
                [...(alarm.days || [])].sort((a, b) => a - b).map(d => (
                  <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--foreground)]/5 text-[var(--foreground)]/50">
                    {dayLabels[d]}
                  </span>
                ))
              )
            ) : scheduleMode === 'monthdays' ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--foreground)]/5 text-[var(--foreground)]/50">
                {isAr ? 'شهري' : 'Monthly'}: {alarm.monthDays?.join(', ')}
              </span>
            ) : scheduleMode === 'yeardays' ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--foreground)]/5 text-[var(--foreground)]/50">
                {isAr ? 'سنوي' : 'Yearly'}
              </span>
            ) : null}

            {/* Habit badge */}
            {habitName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
                {habitName}
              </span>
            )}

            {/* Sound badge */}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--foreground)]/5 text-[var(--foreground)]/40">
              <Volume2 className="h-2.5 w-2.5 inline -mt-0.5" /> {getSoundLabel(alarm.sound)}
            </span>
          </div>

          {/* Countdown */}
          {alarm.enabled && nextOcc && (
            <p className="text-xs text-[var(--color-primary)] mt-1.5 font-medium">
              <Clock className="h-3 w-3 inline -mt-0.5" /> {formatCountdown(nextOcc, isAr)}
            </p>
          )}

          {/* Ringing actions */}
          {(alarm.status === 'ringing' || alarm.status === 'snoozed') && (
            <div className="flex items-center gap-2 mt-2">
              <button onClick={onDismiss} className="app-btn-primary px-3 py-1 rounded-lg text-xs font-bold">
                {isAr ? 'إيقاف' : 'Dismiss'}
              </button>
              {alarm.snoozeEnabled && alarm.snoozeCount < alarm.maxSnoozes && (
                <button onClick={onSnooze} className="app-btn-secondary px-3 py-1 rounded-lg text-xs">
                  {isAr ? 'غفوة' : 'Snooze'} ({alarm.snoozeCount}/{alarm.maxSnoozes})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 shrink-0 mt-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/5 text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--foreground)]/40 hover:text-red-500 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// ALARM FORM MODAL
// ============================================================

interface AlarmFormModalProps {
  isAr: boolean;
  formData: ReturnType<typeof defaultAlarmData>;
  setFormData: React.Dispatch<React.SetStateAction<ReturnType<typeof defaultAlarmData>>>;
  formError: string;
  editingId: string | null;
  habits: { id: string; nameEn: string; nameAr: string; archived: boolean }[];
  onTimeChange: (time: string) => void;
  onToggleDay: (day: WeekDay) => void;
  onToggleMonthDay: (day: number) => void;
  onHabitSelect: (id: string) => void;
  onPreviewSound: () => void;
  onSave: () => void;
  onClose: () => void;
}

function AlarmFormModal({
  isAr, formData, setFormData, formError, editingId, habits,
  onTimeChange, onToggleDay, onToggleMonthDay, onHabitSelect,
  onPreviewSound, onSave, onClose,
}: AlarmFormModalProps) {
  const dayLabels = isAr ? DAY_LABELS_AR : DAY_LABELS_EN;
  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[var(--card)] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-[var(--foreground)]/10"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal header */}
        <div className="sticky top-0 z-10 bg-[var(--card)] border-b border-[var(--foreground)]/10 px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold">
            {editingId ? (isAr ? 'تعديل المنبه' : 'Edit Alarm') : (isAr ? 'منبه جديد' : 'New Alarm')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">

          {/* ── Time Input ── */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 block">
              {isAr ? 'الوقت' : 'Time'}
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={e => onTimeChange(e.target.value)}
              className="w-full text-3xl font-bold text-center py-3 px-4 rounded-xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-colors"
            />
            {formError && (
              <motion.p {...fadeUp} className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {formError}
              </motion.p>
            )}
          </div>

          {/* ── Labels ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1 block">
                {isAr ? 'الاسم (إنجليزي)' : 'Label (English)'}
              </label>
              <input
                type="text"
                value={formData.labelEn}
                onChange={e => setFormData(p => ({ ...p, labelEn: e.target.value }))}
                placeholder="Morning alarm"
                className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1 block">
                {isAr ? 'الاسم (عربي)' : 'Label (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.labelAr}
                onChange={e => setFormData(p => ({ ...p, labelAr: e.target.value }))}
                placeholder="منبه الصباح"
                dir="rtl"
                className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 focus:border-[var(--color-primary)] outline-none"
              />
            </div>
          </div>

          {/* ── Type Selector ── */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 block">
              {isAr ? 'النوع' : 'Type'}
            </label>
            <div className="flex gap-2">
              {(['independent', 'habit'] as AlarmType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFormData(p => ({ ...p, type, linkedId: '' }))}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors',
                    formData.type === type
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-[var(--foreground)]/10 text-[var(--foreground)]/50 hover:border-[var(--foreground)]/20',
                  )}
                >
                  {type === 'independent'
                    ? (isAr ? 'مستقل' : 'Independent')
                    : (isAr ? 'مرتبط بعادة' : 'Linked to Habit')}
                </button>
              ))}
            </div>
          </div>

          {/* ── Habit Selector ── */}
          {formData.type === 'habit' && (
            <motion.div {...fadeUp}>
              <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 block">
                {isAr ? 'اختر العادة' : 'Select Habit'}
              </label>
              <select
                value={formData.linkedId}
                onChange={e => onHabitSelect(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 focus:border-[var(--color-primary)] outline-none"
              >
                <option value="">{isAr ? '-- اختر عادة --' : '-- Select habit --'}</option>
                {activeHabits.map(h => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr || h.nameEn : h.nameEn || h.nameAr}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* ── Schedule Type ── */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 block">
              {isAr ? 'نوع الجدول' : 'Schedule'}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {([
                { key: 'onetime', en: 'One-time', ar: 'مرة واحدة' },
                { key: 'weekly', en: 'Weekly', ar: 'أسبوعي' },
                { key: 'monthly', en: 'Monthly', ar: 'شهري' },
                { key: 'yearly', en: 'Yearly', ar: 'سنوي' },
              ] as const).map(st => (
                <button
                  key={st.key}
                  onClick={() => setFormData(p => ({ ...p, scheduleType: st.key }))}
                  className={cn(
                    'py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors',
                    formData.scheduleType === st.key
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-[var(--foreground)]/10 text-[var(--foreground)]/50',
                  )}
                >
                  {isAr ? st.ar : st.en}
                </button>
              ))}
            </div>
          </div>

          {/* ── One-time date picker ── */}
          {formData.scheduleType === 'onetime' && (
            <motion.div {...fadeUp}>
              <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1 block">
                {isAr ? 'التاريخ' : 'Date'}
              </label>
              <input
                type="date"
                value={formData.oneTimeDate}
                onChange={e => setFormData(p => ({ ...p, oneTimeDate: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 focus:border-[var(--color-primary)] outline-none"
              />
            </motion.div>
          )}

          {/* ── Weekly day checkboxes ── */}
          {formData.scheduleType === 'weekly' && (
            <motion.div {...fadeUp}>
              <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 block">
                {isAr ? 'الأيام' : 'Days'}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {WEEKDAYS.map(d => (
                  <button
                    key={d}
                    onClick={() => onToggleDay(d)}
                    className={cn(
                      'h-9 w-9 rounded-lg text-xs font-bold border transition-colors',
                      formData.days.includes(d)
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                        : 'border-[var(--foreground)]/10 text-[var(--foreground)]/40 hover:border-[var(--foreground)]/20',
                    )}
                  >
                    {dayLabels[d]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Monthly day grid ── */}
          {formData.scheduleType === 'monthly' && (
            <motion.div {...fadeUp}>
              <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 block">
                {isAr ? 'أيام الشهر' : 'Days of Month'}
              </label>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <button
                    key={d}
                    onClick={() => onToggleMonthDay(d)}
                    className={cn(
                      'h-8 rounded text-xs font-medium border transition-colors',
                      formData.monthDays.includes(d)
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                        : 'border-[var(--foreground)]/10 text-[var(--foreground)]/40',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Yearly: month + day selectors ── */}
          {formData.scheduleType === 'yearly' && (
            <motion.div {...fadeUp} className="space-y-2">
              <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1 block">
                {isAr ? 'أيام السنة' : 'Dates in Year'}
              </label>
              <YearDayPicker
                isAr={isAr}
                yearDays={formData.yearDays}
                onChange={(yd) => setFormData(p => ({ ...p, yearDays: yd }))}
              />
            </motion.div>
          )}

          {/* ── Sound Selector ── */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 block">
              {isAr ? 'الصوت' : 'Sound'}
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={formData.sound}
                onChange={e => setFormData(p => ({ ...p, sound: e.target.value as AlarmSound }))}
                className="flex-1 text-sm px-3 py-2 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 focus:border-[var(--color-primary)] outline-none"
              >
                {ALARM_SOUNDS.map(s => (
                  <option key={s.id} value={s.id}>
                    {isAr ? s.labelAr : s.labelEn}
                  </option>
                ))}
              </select>
              <button
                onClick={onPreviewSound}
                className="app-btn-secondary p-2 rounded-lg shrink-0"
                title={isAr ? 'معاينة' : 'Preview'}
              >
                <Play className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Volume Slider ── */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 flex items-center justify-between">
              <span>{isAr ? 'مستوى الصوت' : 'Volume'}</span>
              <span className="tabular-nums">{formData.volume}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={formData.volume}
              onChange={e => setFormData(p => ({ ...p, volume: Number(e.target.value) }))}
              className="w-full accent-[var(--color-primary)]"
            />
          </div>

          {/* ── Gradual Volume ── */}
          <ToggleRow
            label={isAr ? 'زيادة تدريجية للصوت' : 'Gradual Volume'}
            desc={isAr ? 'يبدأ هادئًا ويرتفع تدريجيًا' : 'Starts quiet, gets louder over 30s'}
            checked={formData.gradualVolume}
            onChange={v => setFormData(p => ({ ...p, gradualVolume: v }))}
          />

          {/* ── Snooze Settings ── */}
          <div className="space-y-3">
            <ToggleRow
              label={isAr ? 'الغفوة' : 'Snooze'}
              desc={isAr ? 'السماح بتأجيل المنبه' : 'Allow snoozing the alarm'}
              checked={formData.snoozeEnabled}
              onChange={v => setFormData(p => ({ ...p, snoozeEnabled: v }))}
            />

            {formData.snoozeEnabled && (
              <motion.div {...fadeUp} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--foreground)]/50 mb-1 block">
                    {isAr ? 'مدة الغفوة' : 'Snooze Duration'}
                  </label>
                  <select
                    value={formData.snoozeDuration}
                    onChange={e => setFormData(p => ({ ...p, snoozeDuration: Number(e.target.value) }))}
                    className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 outline-none"
                  >
                    {SNOOZE_DURATIONS.map(d => (
                      <option key={d} value={d}>{d} {isAr ? 'دقيقة' : 'min'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--foreground)]/50 mb-1 block">
                    {isAr ? 'أقصى عدد غفوات' : 'Max Snoozes'}
                  </label>
                  <select
                    value={formData.maxSnoozes}
                    onChange={e => setFormData(p => ({ ...p, maxSnoozes: Number(e.target.value) }))}
                    className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 outline-none"
                  >
                    {MAX_SNOOZE_OPTIONS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Color Picker ── */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 block">
              {isAr ? 'اللون' : 'Color'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ITEM_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setFormData(p => ({ ...p, color: c }))}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-transform',
                    formData.color === c ? 'border-[var(--foreground)] scale-110' : 'border-transparent',
                  )}
                  style={{ backgroundColor: c === 'theme' ? 'var(--color-primary)' : c }}
                />
              ))}
            </div>
          </div>

          {/* ── Save Button ── */}
          <button
            onClick={onSave}
            disabled={!!formError}
            className={cn(
              'w-full app-btn-primary py-2.5 rounded-xl text-sm font-bold transition-opacity',
              formError && 'opacity-50 cursor-not-allowed',
            )}
          >
            {editingId ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء المنبه' : 'Create Alarm')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// TOGGLE ROW COMPONENT
// ============================================================

function ToggleRow({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-[var(--foreground)]/40">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors shrink-0',
          checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--foreground)]/20',
        )}
      >
        <motion.div
          layout
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          style={{ [checked ? 'right' : 'left']: 2 }}
        />
      </button>
    </div>
  );
}

// ============================================================
// YEAR DAY PICKER COMPONENT
// ============================================================

function YearDayPicker({ isAr, yearDays, onChange }: {
  isAr: boolean;
  yearDays: { month: number; day: number }[];
  onChange: (yd: { month: number; day: number }[]) => void;
}) {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const monthNames = isAr ? MONTH_NAMES_AR : MONTH_NAMES_EN;

  const daysInMonth = (m: number) => new Date(2024, m, 0).getDate();

  const addYearDay = () => {
    if (yearDays.some(yd => yd.month === selectedMonth && yd.day === selectedDay)) return;
    onChange([...yearDays, { month: selectedMonth, day: selectedDay }]);
  };

  const removeYearDay = (m: number, d: number) => {
    onChange(yearDays.filter(yd => !(yd.month === m && yd.day === d)));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <select
            value={selectedMonth}
            onChange={e => { setSelectedMonth(Number(e.target.value)); setSelectedDay(1); }}
            className="w-full text-sm px-2 py-1.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 outline-none"
          >
            {monthNames.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <select
            value={selectedDay}
            onChange={e => setSelectedDay(Number(e.target.value))}
            className="w-full text-sm px-2 py-1.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 outline-none"
          >
            {Array.from({ length: daysInMonth(selectedMonth) }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <button onClick={addYearDay} className="app-btn-primary p-1.5 rounded-lg shrink-0">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {yearDays.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {yearDays
            .sort((a, b) => a.month - b.month || a.day - b.day)
            .map((yd, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center gap-1"
              >
                {monthNames[yd.month - 1]} {yd.day}
                <button onClick={() => removeYearDay(yd.month, yd.day)} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
