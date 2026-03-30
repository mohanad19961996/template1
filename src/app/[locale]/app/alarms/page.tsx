'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/app-store';
import {
  Alarm, AlarmSound, AlarmType, WeekDay, ALARM_SOUNDS, ITEM_COLORS,
  generateId,
} from '@/types/app';
import { playAlarmPreview, startAlarmSound, stopAlarmSound, stopAllAlarmSounds } from '@/lib/alarm-sounds';
import {
  AlarmClock, Bell, BellRing, Clock, Sun, Moon, Coffee, Dumbbell,
  BookOpen, Brain, Heart, Star, Plus, X, Trash2, Edit3, Volume2,
  VolumeX, Play, Square, Check, ChevronDown, ChevronUp, Link2,
  Repeat, ZapOff, AlertTriangle, Pause, ToggleLeft, ToggleRight,
  ListChecks, GraduationCap,
} from 'lucide-react';

// ── Icon Map ──────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  AlarmClock, Bell, BellRing, Clock, Sun, Moon, Coffee, Dumbbell,
  BookOpen, Brain, Heart, Star,
};

const ALARM_ICON_OPTIONS = Object.keys(ICON_MAP);

// ── Day Names ─────────────────────────────────────────────

const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LABELS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const SCHEDULE_MODE_LABELS: Record<string, { en: string; ar: string }> = {
  weekdays: { en: 'Weekdays', ar: 'أيام الأسبوع' },
  monthdays: { en: 'Month Days', ar: 'أيام الشهر' },
  yeardays: { en: 'Year Days', ar: 'أيام السنة' },
};

const SNOOZE_OPTIONS = [5, 10, 15, 20, 30];

// ── Default Alarm Form ────────────────────────────────────

type AlarmFormData = Omit<Alarm, 'id' | 'createdAt' | 'snoozeCount' | 'status'> & {
  scheduleMode: 'weekdays' | 'monthdays' | 'yeardays';
  monthDays: number[];
  yearDays: { month: number; day: number }[];
};

function defaultAlarmForm(): AlarmFormData {
  return {
    labelEn: '',
    labelAr: '',
    type: 'independent',
    linkedId: undefined,
    time: '07:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    scheduleMode: 'weekdays',
    monthDays: [],
    yearDays: [],
    oneTimeDate: undefined,
    sound: 'classic',
    volume: 80,
    snoozeEnabled: true,
    snoozeDuration: 5,
    maxSnoozes: 3,
    vibrate: true,
    gradualVolume: false,
    enabled: true,
    color: 'theme',
    icon: 'AlarmClock',
  };
}

// ── Live Clock Component ──────────────────────────────────

function LiveClock({ isAr }: { isAr: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="relative flex flex-col items-center gap-6" style={{ minHeight: 280 }} />;

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const period = h >= 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM');
  const h12 = h % 12 || 12;

  const dateStr = now.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Clock hand angles
  const secAngle = s * 6;
  const minAngle = m * 6 + s * 0.1;
  const hrAngle = (h % 12) * 30 + m * 0.5;

  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* Analog Clock */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56">
        {/* Clock face */}
        <div
          className="absolute inset-0 rounded-full border-2 border-[var(--foreground)]/20"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb)/0.05), rgba(var(--color-primary-rgb)/0.02))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 2px 8px rgba(var(--color-primary-rgb)/0.1)',
          }}
        >
          {/* Hour markers */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = i * 30 - 90;
            const rad = (angle * Math.PI) / 180;
            const isMain = i % 3 === 0;
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${50 + 42 * Math.cos(rad)}%`,
                  top: `${50 + 42 * Math.sin(rad)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div
                  className={`rounded-full ${isMain ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'}`}
                  style={{ background: isMain ? 'var(--color-primary)' : 'var(--foreground)', opacity: isMain ? 1 : 0.3 }}
                />
              </div>
            );
          })}
          {/* Hour hand */}
          <div
            className="absolute left-1/2 bottom-1/2 origin-bottom"
            style={{
              width: 4, height: '28%', marginLeft: -2, borderRadius: 4,
              background: 'var(--foreground)',
              transform: `rotate(${hrAngle}deg)`,
              transition: 'transform 0.3s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
            }}
          />
          {/* Minute hand */}
          <div
            className="absolute left-1/2 bottom-1/2 origin-bottom"
            style={{
              width: 3, height: '36%', marginLeft: -1.5, borderRadius: 3,
              background: 'var(--color-primary)',
              transform: `rotate(${minAngle}deg)`,
              transition: 'transform 0.3s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
            }}
          />
          {/* Second hand */}
          <div
            className="absolute left-1/2 bottom-1/2 origin-bottom"
            style={{
              width: 1.5, height: '40%', marginLeft: -0.75, borderRadius: 2,
              background: '#EF4444',
              transform: `rotate(${secAngle}deg)`,
            }}
          />
          {/* Center dot */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{ background: 'var(--color-primary)', boxShadow: '0 0 8px rgba(var(--color-primary-rgb)/0.5)' }}
          />
        </div>
      </div>

      {/* Digital time */}
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums" style={{ fontFamily: 'monospace' }}>
            {String(h12).padStart(2, '0')}
            <span className="animate-pulse">:</span>
            {String(m).padStart(2, '0')}
            <span className="text-2xl sm:text-3xl text-[var(--foreground)]/40">:{String(s).padStart(2, '0')}</span>
          </span>
          <span className="text-sm font-bold text-[var(--color-primary)] ms-2">{period}</span>
        </div>
        <p className="text-sm text-[var(--foreground)]/60 mt-1">{dateStr}</p>
      </div>
    </div>
  );
}

// ── Countdown Progress Bar ────────────────────────────────

function AlarmCountdown({ alarm, isAr }: { alarm: Alarm; isAr: boolean }) {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const [ah, am] = alarm.time.split(':').map(Number);

      // Find next trigger time
      let target = new Date(now);
      target.setHours(ah, am, 0, 0);

      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }

      // If alarm has specific days, find next matching day
      if (alarm.days?.length > 0 && alarm.days.length < 7) {
        for (let i = 0; i < 8; i++) {
          const checkDate = new Date(target);
          checkDate.setDate(target.getDate() + i);
          if (alarm.days.includes(checkDate.getDay() as WeekDay)) {
            target = checkDate;
            target.setHours(ah, am, 0, 0);
            if (target > now) break;
          }
        }
      }

      const diff = target.getTime() - now.getTime();
      const totalDay = 24 * 60 * 60 * 1000;
      const pct = Math.max(0, Math.min(100, ((totalDay - diff) / totalDay) * 100));

      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      setProgress(pct);
      if (hours > 0) {
        setTimeLeft(`${hours}${isAr ? 'س' : 'h'} ${mins}${isAr ? 'د' : 'm'}`);
      } else if (mins > 0) {
        setTimeLeft(`${mins}${isAr ? 'د' : 'm'} ${secs}${isAr ? 'ث' : 's'}`);
      } else {
        setTimeLeft(`${secs}${isAr ? 'ث' : 's'}`);
      }
    };

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [alarm.time, alarm.days, isAr]);

  if (!alarm.enabled || alarm.status === 'ringing') return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] text-[var(--foreground)]/50 mb-1">
        <span>{isAr ? 'متبقي' : 'Time left'}</span>
        <span className="font-mono font-bold text-[var(--color-primary)]">{timeLeft}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--foreground)]/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, white))' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

// ── Ringing Alarm Overlay ─────────────────────────────────

function RingingOverlay({ alarm, isAr, onDismiss, onSnooze }: {
  alarm: Alarm;
  isAr: boolean;
  onDismiss: () => void;
  onSnooze: () => void;
}) {
  const label = isAr ? alarm.labelAr || alarm.labelEn : alarm.labelEn || alarm.labelAr;
  const canSnooze = alarm.snoozeEnabled && alarm.snoozeCount < alarm.maxSnoozes;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
    >
      <motion.div
        className="relative w-[90vw] max-w-md rounded-3xl p-8 text-center"
        style={{
          background: 'var(--color-background)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.3), 0 0 60px rgba(var(--color-primary-rgb)/0.3)',
        }}
        animate={{ boxShadow: [
          '0 25px 80px rgba(0,0,0,0.3), 0 0 60px rgba(var(--color-primary-rgb)/0.15)',
          '0 25px 80px rgba(0,0,0,0.3), 0 0 80px rgba(var(--color-primary-rgb)/0.5)',
          '0 25px 80px rgba(0,0,0,0.3), 0 0 60px rgba(var(--color-primary-rgb)/0.15)',
        ] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Pulsing bell icon */}
        <motion.div
          className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(var(--color-primary-rgb)/0.15)' }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <BellRing className="w-12 h-12 text-[var(--color-primary)]" />
        </motion.div>

        {/* Time */}
        <p className="text-5xl font-bold tabular-nums mb-2" style={{ fontFamily: 'monospace' }}>
          {alarm.time}
        </p>

        {/* Label */}
        <p className="text-xl font-semibold mb-2">{label || (isAr ? 'منبه' : 'Alarm')}</p>

        {/* Type badge */}
        {alarm.type !== 'independent' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium mb-6">
            {alarm.type === 'habit' ? <ListChecks className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
            {alarm.type === 'habit' ? (isAr ? 'عادة' : 'Habit') : (isAr ? 'مهارة' : 'Skill')}
          </div>
        )}

        {/* Snooze info */}
        {alarm.snoozeEnabled && alarm.snoozeCount > 0 && (
          <p className="text-sm text-[var(--foreground)]/50 mb-4">
            {isAr ? `غفوة ${alarm.snoozeCount} من ${alarm.maxSnoozes}` : `Snoozed ${alarm.snoozeCount} of ${alarm.maxSnoozes}`}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          {canSnooze && (
            <button
              onClick={onSnooze}
              className="flex-1 py-4 rounded-2xl font-bold text-base cursor-pointer"
              style={{
                background: 'rgba(var(--color-primary-rgb)/0.1)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(var(--color-primary-rgb)/0.2)',
              }}
            >
              <Pause className="w-5 h-5 inline-block me-2 -mt-0.5" />
              {isAr ? `غفوة ${alarm.snoozeDuration}د` : `Snooze ${alarm.snoozeDuration}m`}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="flex-1 py-4 rounded-2xl font-bold text-base text-white cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))',
              boxShadow: '0 4px 20px rgba(var(--color-primary-rgb)/0.4)',
            }}
          >
            <ZapOff className="w-5 h-5 inline-block me-2 -mt-0.5" />
            {isAr ? 'إيقاف' : 'Dismiss'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Volume Slider ─────────────────────────────────────────

function VolumeSlider({ value, onChange, isAr }: { value: number; onChange: (v: number) => void; isAr: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <VolumeX className="w-4 h-4 text-[var(--foreground)]/40 shrink-0" />
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[var(--color-primary)]"
        style={{ background: `linear-gradient(to ${isAr ? 'left' : 'right'}, var(--color-primary) ${value}%, rgba(var(--color-primary-rgb)/0.15) ${value}%)` }}
      />
      <Volume2 className="w-4 h-4 text-[var(--foreground)]/40 shrink-0" />
      <span className="text-xs font-mono font-bold w-8 text-end">{value}%</span>
    </div>
  );
}

// ── Sound Picker with Test Button ─────────────────────────

function SoundPicker({ value, volume, onChange, isAr }: {
  value: AlarmSound;
  volume: number;
  onChange: (s: AlarmSound) => void;
  isAr: boolean;
}) {
  const [playing, setPlaying] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const testSound = (soundId: AlarmSound) => {
    if (stopRef.current) { stopRef.current(); stopRef.current = null; }
    if (playing === soundId) { setPlaying(null); return; }
    const stop = playAlarmPreview(soundId, volume);
    stopRef.current = stop;
    setPlaying(soundId);
    setTimeout(() => { if (stopRef.current === stop) { setPlaying(null); stopRef.current = null; } }, 3000);
  };

  useEffect(() => {
    return () => { if (stopRef.current) stopRef.current(); };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      {ALARM_SOUNDS.map(s => {
        const isSelected = value === s.id;
        const isTestPlaying = playing === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              isSelected
                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                : 'bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10'
            }`}
          >
            <span className="flex-1 text-start">{isAr ? s.labelAr : s.labelEn}</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); testSound(s.id); }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isTestPlaying ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--foreground)]/10 hover:bg-[var(--foreground)]/20'
              }`}
            >
              {isTestPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN ALARMS PAGE
// ══════════════════════════════════════════════════════════

export default function AlarmsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultAlarmForm());
  const [scheduleMode, setScheduleMode] = useState<'recurring' | 'oneTime'>('recurring');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sorted alarms: ringing first, then enabled, then by time
  const sortedAlarms = useMemo(() => {
    return [...store.alarms].sort((a, b) => {
      if (a.status === 'ringing' && b.status !== 'ringing') return -1;
      if (b.status === 'ringing' && a.status !== 'ringing') return 1;
      if (a.enabled && !b.enabled) return -1;
      if (b.enabled && !a.enabled) return 1;
      return a.time.localeCompare(b.time);
    });
  }, [store.alarms]);

  const ringingAlarms = useMemo(() => store.alarms.filter(a => a.status === 'ringing'), [store.alarms]);
  const nextAlarm = useMemo(() => {
    const enabled = store.alarms.filter(a => a.enabled && a.status === 'idle');
    if (enabled.length === 0) return null;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    // Find next alarm that hasn't passed today
    const upcoming = enabled.filter(a => {
      const [h, m] = a.time.split(':').map(Number);
      return h * 60 + m > nowMins;
    }).sort((a, b) => a.time.localeCompare(b.time));
    return upcoming[0] || enabled.sort((a, b) => a.time.localeCompare(b.time))[0];
  }, [store.alarms]);

  // Open create form
  const openCreate = (type?: AlarmType, linkedId?: string) => {
    setForm({ ...defaultAlarmForm(), type: type || 'independent', linkedId });
    setEditingId(null);
    setScheduleMode('recurring');
    setShowForm(true);
  };

  // Open edit form
  const openEdit = (alarm: Alarm) => {
    const formData: AlarmFormData = {
      labelEn: alarm.labelEn,
      labelAr: alarm.labelAr,
      type: alarm.type,
      linkedId: alarm.linkedId,
      time: alarm.time,
      days: alarm.days,
      scheduleMode: alarm.scheduleMode ?? 'weekdays',
      monthDays: alarm.monthDays ?? [],
      yearDays: alarm.yearDays ?? [],
      oneTimeDate: alarm.oneTimeDate,
      sound: alarm.sound,
      volume: alarm.volume,
      snoozeEnabled: alarm.snoozeEnabled,
      snoozeDuration: alarm.snoozeDuration,
      maxSnoozes: alarm.maxSnoozes,
      vibrate: alarm.vibrate,
      gradualVolume: alarm.gradualVolume,
      enabled: alarm.enabled,
      color: alarm.color,
      icon: alarm.icon,
    };
    setForm(formData);
    setEditingId(alarm.id);
    setScheduleMode(alarm.oneTimeDate ? 'oneTime' : 'recurring');
    setShowForm(true);
  };

  // Save alarm
  const handleSave = () => {
    const isRecurring = scheduleMode === 'recurring';
    const data = {
      ...form,
      days: isRecurring && form.scheduleMode === 'weekdays' ? form.days : [],
      scheduleMode: isRecurring ? form.scheduleMode : undefined,
      monthDays: isRecurring && form.scheduleMode === 'monthdays' ? form.monthDays : undefined,
      yearDays: isRecurring && form.scheduleMode === 'yeardays' ? form.yearDays : undefined,
      oneTimeDate: scheduleMode === 'oneTime' ? form.oneTimeDate : undefined,
    };
    if (editingId) {
      store.updateAlarm(editingId, data);
    } else {
      store.addAlarm(data);
    }
    setShowForm(false);
    setEditingId(null);
  };

  // Dismiss alarm
  const handleDismiss = (id: string) => {
    stopAlarmSound(id);
    store.dismissAlarm(id);
  };

  // Snooze alarm
  const handleSnooze = (id: string) => {
    stopAlarmSound(id);
    store.snoozeAlarm(id);
  };

  // Get linked item name
  const getLinkedName = (alarm: Alarm): string => {
    if (alarm.type === 'habit' && alarm.linkedId) {
      const habit = store.habits.find(h => h.id === alarm.linkedId);
      if (habit) return isAr ? habit.nameAr || habit.nameEn : habit.nameEn || habit.nameAr;
    }
    if (alarm.type === 'skill' && alarm.linkedId) {
      const skill = store.skills.find(s => s.id === alarm.linkedId);
      if (skill) return isAr ? skill.nameAr || skill.nameEn : skill.nameEn || skill.nameAr;
    }
    return '';
  };

  // Resolve color
  const resolveColor = (color: string) => {
    if (color === 'theme') return 'var(--color-primary)';
    return color;
  };

  // Stats
  const enabledCount = store.alarms.filter(a => a.enabled).length;
  const totalCount = store.alarms.length;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* ── Ringing Alarm Overlays ── */}
      <AnimatePresence>
        {ringingAlarms.map(alarm => (
          <RingingOverlay
            key={alarm.id}
            alarm={alarm}
            isAr={isAr}
            onDismiss={() => handleDismiss(alarm.id)}
            onSnooze={() => handleSnooze(alarm.id)}
          />
        ))}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(var(--color-primary-rgb)/0.12)' }}
            >
              <AlarmClock className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            {isAr ? 'المنبهات' : 'Alarms'}
          </h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            {isAr
              ? `${enabledCount} منبه نشط من ${totalCount}`
              : `${enabledCount} active of ${totalCount} alarms`}
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))',
            boxShadow: '0 4px 14px rgba(var(--color-primary-rgb)/0.35)',
          }}
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'منبه جديد' : 'New Alarm'}
        </button>
      </div>

      {/* ── Clock + Next Alarm ── */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-8"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb)/0.06), rgba(var(--color-primary-rgb)/0.02))',
          border: '1px solid rgba(var(--color-primary-rgb)/0.1)',
        }}
      >
        <LiveClock isAr={isAr} />
        {nextAlarm && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10">
              <AlarmClock className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-sm font-medium text-[var(--color-primary)]">
                {isAr ? 'المنبه التالي:' : 'Next alarm:'}{' '}
                <span className="font-bold">{nextAlarm.time}</span>
                {' — '}
                {isAr ? nextAlarm.labelAr || nextAlarm.labelEn || 'منبه' : nextAlarm.labelEn || nextAlarm.labelAr || 'Alarm'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Create Buttons ── */}
      {(store.habits.filter(h => !h.archived).length > 0 || store.skills.filter(s => !s.archived).length > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {store.habits.filter(h => !h.archived).slice(0, 4).map(h => (
            <button
              key={h.id}
              onClick={() => {
                setForm({
                  ...defaultAlarmForm(),
                  type: 'habit',
                  linkedId: h.id,
                  labelEn: h.nameEn,
                  labelAr: h.nameAr,
                  color: h.color,
                  icon: h.icon,
                });
                setEditingId(null);
                setScheduleMode('recurring');
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer"
            >
              <ListChecks className="w-3 h-3 text-[var(--color-primary)]" />
              {isAr ? h.nameAr || h.nameEn : h.nameEn || h.nameAr}
            </button>
          ))}
          {store.skills.filter(s => !s.archived).slice(0, 4).map(s => (
            <button
              key={s.id}
              onClick={() => {
                setForm({
                  ...defaultAlarmForm(),
                  type: 'skill',
                  linkedId: s.id,
                  labelEn: s.nameEn,
                  labelAr: s.nameAr,
                  color: s.color,
                  icon: s.icon,
                });
                setEditingId(null);
                setScheduleMode('recurring');
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer"
            >
              <GraduationCap className="w-3 h-3 text-[var(--color-primary)]" />
              {isAr ? s.nameAr || s.nameEn : s.nameEn || s.nameAr}
            </button>
          ))}
        </div>
      )}

      {/* ── Alarm List ── */}
      {sortedAlarms.length === 0 ? (
        <div className="text-center py-20">
          <div
            className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(var(--color-primary-rgb)/0.1)' }}
          >
            <AlarmClock className="w-10 h-10 text-[var(--color-primary)]/40" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{isAr ? 'لا توجد منبهات' : 'No alarms yet'}</h3>
          <p className="text-sm text-[var(--foreground)]/50">
            {isAr ? 'أنشئ منبهك الأول للبدء' : 'Create your first alarm to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAlarms.map(alarm => {
            const Icon = ICON_MAP[alarm.icon] || AlarmClock;
            const linkedName = getLinkedName(alarm);
            const isExpanded = expandedId === alarm.id;
            const color = resolveColor(alarm.color);
            const isRinging = alarm.status === 'ringing';
            const isSnoozed = alarm.status === 'snoozed';

            return (
              <motion.div
                key={alarm.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-2xl overflow-hidden transition-all ${!alarm.enabled ? 'opacity-50' : ''}`}
                style={{
                  background: 'var(--color-background)',
                  border: isRinging
                    ? `2px solid ${color}`
                    : '1px solid rgba(var(--foreground-rgb, 0 0 0)/0.08)',
                  boxShadow: isRinging
                    ? `0 0 30px rgba(var(--color-primary-rgb)/0.2)`
                    : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Main row */}
                <div className="flex items-center gap-3 sm:gap-4 p-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}15`, color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'monospace' }}>
                        {alarm.time}
                      </span>
                      {isSnoozed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-bold">
                          {isAr ? 'غفوة' : 'SNOOZED'}
                        </span>
                      )}
                      {isRinging && (
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 font-bold"
                        >
                          {isAr ? 'يرن!' : 'RINGING!'}
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--foreground)]/70 truncate">
                      {isAr ? alarm.labelAr || alarm.labelEn || 'منبه' : alarm.labelEn || alarm.labelAr || 'Alarm'}
                    </p>
                    {linkedName && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Link2 className="w-3 h-3 text-[var(--foreground)]/40" />
                        <span className="text-xs text-[var(--foreground)]/50">{linkedName}</span>
                      </div>
                    )}
                    {/* Days badges */}
                    {alarm.scheduleMode === 'monthdays' && alarm.monthDays?.length ? (
                      <span className="text-[10px] text-[var(--foreground)]/50 mt-1 block">
                        {isAr ? 'أيام الشهر: ' : 'Monthly: '}{alarm.monthDays.join(', ')}
                      </span>
                    ) : alarm.scheduleMode === 'yeardays' && alarm.yearDays?.length ? (
                      <span className="text-[10px] text-[var(--foreground)]/50 mt-1 block">
                        {isAr ? 'سنوي: ' : 'Yearly: '}
                        {alarm.yearDays.map(yd => `${(isAr ? MONTH_LABELS_AR : MONTH_LABELS_EN)[yd.month]} ${yd.day}`).join(', ')}
                      </span>
                    ) : (
                      <>
                        {alarm.days?.length > 0 && alarm.days.length < 7 && (
                          <div className="flex gap-1 mt-1.5">
                            {(isAr ? DAY_LABELS_AR : DAY_LABELS_EN).map((d, i) => (
                              <span
                                key={i}
                                className={`text-[9px] w-6 h-5 rounded flex items-center justify-center font-bold ${
                                  alarm.days.includes(i as WeekDay)
                                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                                    : 'bg-[var(--foreground)]/5 text-[var(--foreground)]/30'
                                }`}
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                        {alarm.days?.length === 7 && (
                          <span className="text-[10px] text-[var(--foreground)]/50 flex items-center gap-1 mt-1">
                            <Repeat className="w-3 h-3" />
                            {isAr ? 'كل يوم' : 'Every day'}
                          </span>
                        )}
                      </>
                    )}
                    {alarm.oneTimeDate && (!alarm.days || alarm.days.length === 0) && !alarm.scheduleMode && (
                      <span className="text-[10px] text-[var(--foreground)]/50 mt-1 block">
                        {alarm.oneTimeDate}
                      </span>
                    )}
                    {/* Countdown bar */}
                    <AlarmCountdown alarm={alarm} isAr={isAr} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isRinging ? (
                      <>
                        {alarm.snoozeEnabled && alarm.snoozeCount < alarm.maxSnoozes && (
                          <button
                            onClick={() => handleSnooze(alarm.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 cursor-pointer"
                          >
                            {isAr ? 'غفوة' : 'Snooze'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(alarm.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 text-red-500 hover:bg-red-500/25 cursor-pointer"
                        >
                          {isAr ? 'إيقاف' : 'Dismiss'}
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Expand */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : alarm.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/10 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {/* Toggle */}
                        <button
                          onClick={() => store.toggleAlarm(alarm.id)}
                          className="cursor-pointer"
                        >
                          {alarm.enabled ? (
                            <ToggleRight className="w-8 h-8 text-[var(--color-primary)]" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-[var(--foreground)]/30" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-[var(--foreground)]/[0.06] pt-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-[var(--foreground)]/50 block mb-0.5">{isAr ? 'الصوت' : 'Sound'}</span>
                            <span className="font-medium">
                              {ALARM_SOUNDS.find(s => s.id === alarm.sound)?.[isAr ? 'labelAr' : 'labelEn']}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--foreground)]/50 block mb-0.5">{isAr ? 'مستوى الصوت' : 'Volume'}</span>
                            <span className="font-medium">{alarm.volume}%</span>
                          </div>
                          <div>
                            <span className="text-[var(--foreground)]/50 block mb-0.5">{isAr ? 'غفوة' : 'Snooze'}</span>
                            <span className="font-medium">
                              {alarm.snoozeEnabled
                                ? `${alarm.snoozeDuration}${isAr ? 'د' : 'm'} (${alarm.maxSnoozes}x)`
                                : (isAr ? 'معطل' : 'Off')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--foreground)]/50 block mb-0.5">{isAr ? 'تصاعد الصوت' : 'Gradual'}</span>
                            <span className="font-medium">{alarm.gradualVolume ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--foreground)]/[0.06]">
                          <button
                            onClick={() => openEdit(alarm)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> {isAr ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            onClick={() => { store.deleteAlarm(alarm.id); setExpandedId(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> {isAr ? 'حذف' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CREATE / EDIT MODAL
         ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed inset-x-4 top-[5vh] bottom-[5vh] z-[501] mx-auto max-w-lg overflow-y-auto rounded-2xl p-6"
              style={{
                background: 'var(--color-background)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
              }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingId
                    ? (isAr ? 'تعديل المنبه' : 'Edit Alarm')
                    : (isAr ? 'منبه جديد' : 'New Alarm')}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--foreground)]/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Time Picker ── */}
              <div className="mb-6">
                <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-2 block">
                  {isAr ? 'الوقت' : 'Time'}
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full text-4xl font-bold text-center py-4 rounded-xl bg-[var(--foreground)]/5 border-0 focus:ring-2 focus:ring-[var(--color-primary)]/30 tabular-nums"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              {/* ── Label ── */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-1 block">
                    {isAr ? 'الاسم (إنجليزي)' : 'Label (EN)'}
                  </label>
                  <input
                    type="text"
                    value={form.labelEn}
                    onChange={e => setForm(f => ({ ...f, labelEn: e.target.value }))}
                    placeholder={isAr ? 'اسم المنبه' : 'Alarm label'}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--foreground)]/5 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/30 border-0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-1 block">
                    {isAr ? 'الاسم (عربي)' : 'Label (AR)'}
                  </label>
                  <input
                    type="text"
                    value={form.labelAr}
                    onChange={e => setForm(f => ({ ...f, labelAr: e.target.value }))}
                    placeholder={isAr ? 'اسم المنبه بالعربية' : 'Arabic label'}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--foreground)]/5 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/30 border-0"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* ── Type ── */}
              <div className="mb-4">
                <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-2 block">
                  {isAr ? 'النوع' : 'Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'independent', en: 'Independent', ar: 'مستقل', Icon: AlarmClock },
                    { id: 'habit', en: 'Habit', ar: 'عادة', Icon: ListChecks },
                    { id: 'skill', en: 'Skill', ar: 'مهارة', Icon: GraduationCap },
                  ] as const).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t.id, linkedId: t.id === 'independent' ? undefined : f.linkedId }))}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        form.type === t.id
                          ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                          : 'bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10'
                      }`}
                    >
                      <t.Icon className="w-5 h-5" />
                      {isAr ? t.ar : t.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Linked Item Picker ── */}
              {form.type !== 'independent' && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-2 block">
                    {form.type === 'habit' ? (isAr ? 'اختر العادة' : 'Select Habit') : (isAr ? 'اختر المهارة' : 'Select Skill')}
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl bg-[var(--foreground)]/5 p-2">
                    {(form.type === 'habit'
                      ? store.habits.filter(h => !h.archived)
                      : store.skills.filter(s => !s.archived)
                    ).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, linkedId: item.id }))}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-start transition-colors cursor-pointer ${
                          form.linkedId === item.id
                            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                            : 'hover:bg-[var(--foreground)]/5'
                        }`}
                      >
                        <Check className={`w-4 h-4 ${form.linkedId === item.id ? 'opacity-100' : 'opacity-0'}`} />
                        {isAr ? (item as any).nameAr || (item as any).nameEn : (item as any).nameEn || (item as any).nameAr}
                      </button>
                    ))}
                    {(form.type === 'habit' ? store.habits.filter(h => !h.archived) : store.skills.filter(s => !s.archived)).length === 0 && (
                      <p className="text-xs text-[var(--foreground)]/40 text-center py-4">
                        {isAr ? 'لا توجد عناصر' : 'No items available'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Schedule Mode ── */}
              <div className="mb-4">
                <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-2 block">
                  {isAr ? 'الجدول' : 'Schedule'}
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('recurring')}
                    className={`py-2 rounded-xl text-sm font-medium cursor-pointer ${
                      scheduleMode === 'recurring'
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                        : 'bg-[var(--foreground)]/5'
                    }`}
                  >
                    <Repeat className="w-4 h-4 inline-block me-1.5 -mt-0.5" />
                    {isAr ? 'متكرر' : 'Recurring'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode('oneTime')}
                    className={`py-2 rounded-xl text-sm font-medium cursor-pointer ${
                      scheduleMode === 'oneTime'
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                        : 'bg-[var(--foreground)]/5'
                    }`}
                  >
                    <Clock className="w-4 h-4 inline-block me-1.5 -mt-0.5" />
                    {isAr ? 'مرة واحدة' : 'One-time'}
                  </button>
                </div>

                {scheduleMode === 'recurring' ? (
                  <div className="space-y-3">
                    {/* Schedule mode tabs */}
                    <div className="flex gap-1.5">
                      {(['weekdays', 'monthdays', 'yeardays'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, scheduleMode: m }))}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                            form.scheduleMode === m
                              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                              : 'bg-[var(--foreground)]/5 text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/10'
                          }`}
                        >
                          {isAr ? SCHEDULE_MODE_LABELS[m].ar : SCHEDULE_MODE_LABELS[m].en}
                        </button>
                      ))}
                    </div>

                    {/* Weekdays picker */}
                    {form.scheduleMode === 'weekdays' && (
                      <div className="flex gap-1.5 justify-center">
                        {(isAr ? DAY_LABELS_AR : DAY_LABELS_EN).map((d, i) => {
                          const selected = form.days.includes(i as WeekDay);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setForm(f => ({
                                  ...f,
                                  days: selected
                                    ? f.days.filter(x => x !== i)
                                    : [...f.days, i as WeekDay].sort(),
                                }));
                              }}
                              className={`w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selected
                                  ? 'bg-[var(--color-primary)] text-white'
                                  : 'bg-[var(--foreground)]/5 text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/10'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Month days picker (1-31) */}
                    {form.scheduleMode === 'monthdays' && (
                      <div>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setForm(f => ({
                                ...f,
                                monthDays: f.monthDays.includes(d)
                                  ? f.monthDays.filter(x => x !== d)
                                  : [...f.monthDays, d].sort((a, b) => a - b)
                              }))}
                              className={`py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                form.monthDays.includes(d)
                                  ? 'bg-[var(--color-primary)] text-white'
                                  : 'bg-[var(--foreground)]/5 text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/10'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                        {form.monthDays.length > 0 && (
                          <p className="text-[10px] text-[var(--foreground)]/50 mt-1.5">
                            {isAr ? 'المحدد: ' : 'Selected: '}{form.monthDays.join(', ')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Year days picker (month + day) */}
                    {form.scheduleMode === 'yeardays' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-1">
                          {(isAr ? MONTH_LABELS_AR : MONTH_LABELS_EN).map((label, mi) => {
                            const hasEntries = form.yearDays.some(yd => yd.month === mi);
                            return (
                              <button
                                key={mi}
                                type="button"
                                onClick={() => {
                                  setForm(f => {
                                    const existing = f.yearDays.filter(yd => yd.month === mi);
                                    if (existing.length > 0) {
                                      return { ...f, yearDays: f.yearDays.filter(yd => yd.month !== mi) };
                                    }
                                    return { ...f, yearDays: [...f.yearDays, { month: mi, day: 1 }].sort((a, b) => a.month - b.month || a.day - b.day) };
                                  });
                                }}
                                className={`py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                  hasEntries
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'bg-[var(--foreground)]/5 text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/10'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        {(() => {
                          const selectedMonths = [...new Set(form.yearDays.map(yd => yd.month))].sort((a, b) => a - b);
                          if (selectedMonths.length === 0) return null;
                          return selectedMonths.map(mi => {
                            const daysInMonth = new Date(2024, mi + 1, 0).getDate();
                            const selectedDays = form.yearDays.filter(yd => yd.month === mi).map(yd => yd.day);
                            return (
                              <div key={mi} className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-semibold text-[var(--foreground)]/60">
                                    {isAr ? MONTH_LABELS_AR[mi] : MONTH_LABELS_EN[mi]}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setForm(f => ({
                                      ...f,
                                      yearDays: f.yearDays.filter(yd => yd.month !== mi)
                                    }))}
                                    className="text-[10px] text-red-400 hover:text-red-500 cursor-pointer"
                                  >
                                    {isAr ? 'إزالة' : 'Remove'}
                                  </button>
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => setForm(f => {
                                        const has = f.yearDays.some(yd => yd.month === mi && yd.day === d);
                                        const updated = has
                                          ? f.yearDays.filter(yd => !(yd.month === mi && yd.day === d))
                                          : [...f.yearDays, { month: mi, day: d }];
                                        return { ...f, yearDays: updated.sort((a, b) => a.month - b.month || a.day - b.day) };
                                      })}
                                      className={`py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                                        selectedDays.includes(d)
                                          ? 'bg-[var(--color-primary)] text-white'
                                          : 'bg-[var(--foreground)]/5 text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/10'
                                      }`}
                                    >
                                      {d}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                        {form.yearDays.length > 0 && (
                          <p className="text-[10px] text-[var(--foreground)]/50 mt-1">
                            {isAr ? 'المحدد: ' : 'Selected: '}
                            {form.yearDays.map(yd =>
                              `${(isAr ? MONTH_LABELS_AR : MONTH_LABELS_EN)[yd.month]} ${yd.day}`
                            ).join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="date"
                    value={form.oneTimeDate || ''}
                    onChange={e => setForm(f => ({ ...f, oneTimeDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--foreground)]/5 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/30 border-0"
                  />
                )}
              </div>

              {/* ── Sound ── */}
              <div className="mb-4">
                <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-2 block">
                  {isAr ? 'نغمة المنبه' : 'Alarm Sound'}
                </label>
                <SoundPicker
                  value={form.sound}
                  volume={form.volume}
                  onChange={s => setForm(f => ({ ...f, sound: s }))}
                  isAr={isAr}
                />
              </div>

              {/* ── Volume ── */}
              <div className="mb-4">
                <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-2 block">
                  {isAr ? 'مستوى الصوت' : 'Volume'}
                </label>
                <VolumeSlider value={form.volume} onChange={v => setForm(f => ({ ...f, volume: v }))} isAr={isAr} />
              </div>

              {/* ── Gradual Volume ── */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--foreground)]/5 mb-4">
                <div>
                  <p className="text-sm font-medium">{isAr ? 'تصاعد الصوت تدريجياً' : 'Gradual Volume'}</p>
                  <p className="text-[10px] text-[var(--foreground)]/50">{isAr ? 'يبدأ منخفض ويزداد خلال 30 ثانية' : 'Starts quiet, gets louder over 30s'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, gradualVolume: !f.gradualVolume }))}
                  className="cursor-pointer"
                >
                  {form.gradualVolume
                    ? <ToggleRight className="w-8 h-8 text-[var(--color-primary)]" />
                    : <ToggleLeft className="w-8 h-8 text-[var(--foreground)]/30" />}
                </button>
              </div>

              {/* ── Snooze ── */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider">
                    {isAr ? 'الغفوة' : 'Snooze'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, snoozeEnabled: !f.snoozeEnabled }))}
                    className="cursor-pointer"
                  >
                    {form.snoozeEnabled
                      ? <ToggleRight className="w-7 h-7 text-[var(--color-primary)]" />
                      : <ToggleLeft className="w-7 h-7 text-[var(--foreground)]/30" />}
                  </button>
                </div>
                {form.snoozeEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[var(--foreground)]/50 block mb-1">
                        {isAr ? 'المدة (دقائق)' : 'Duration (min)'}
                      </label>
                      <div className="flex gap-1">
                        {SNOOZE_OPTIONS.map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, snoozeDuration: n }))}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                              form.snoozeDuration === n
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--foreground)]/50 block mb-1">
                        {isAr ? 'الحد الأقصى' : 'Max snoozes'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={form.maxSnoozes}
                        onChange={e => setForm(f => ({ ...f, maxSnoozes: Math.max(1, Math.min(10, Number(e.target.value))) }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-[var(--foreground)]/5 text-sm text-center border-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Color & Icon ── */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-2 block">
                    {isAr ? 'اللون' : 'Color'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ITEM_COLORS.slice(0, 10).map(c => {
                      const isTheme = c === 'theme';
                      const bg = isTheme ? 'var(--color-primary)' : c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, color: c }))}
                          className={`w-7 h-7 rounded-lg cursor-pointer transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110' : ''}`}
                          style={{ background: bg }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-wider mb-2 block">
                    {isAr ? 'الأيقونة' : 'Icon'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALARM_ICON_OPTIONS.map(name => {
                      const Ic = ICON_MAP[name];
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, icon: name }))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${
                            form.icon === name
                              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                              : 'bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10'
                          }`}
                        >
                          <Ic className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Save Button ── */}
              <button
                onClick={handleSave}
                disabled={!form.time}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-4"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))',
                  boxShadow: '0 4px 14px rgba(var(--color-primary-rgb)/0.35)',
                }}
              >
                {editingId ? (isAr ? 'حفظ التغييرات' : 'Save Changes') : (isAr ? 'إنشاء المنبه' : 'Create Alarm')}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
