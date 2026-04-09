'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  TimerMode, formatTimerDuration,
  todayString, MoodLevel, computeTimerElapsed, formatLocalDate,
  ALARM_SOUNDS, AlarmSound,
} from '@/types/app';
import { useTimerDisplay } from '@/lib/use-timer-display';
import { stopAlarmSound, playAlarmPreview } from '@/lib/alarm-sounds';
import { useSearchParams } from 'next/navigation';
import {
  Play, Pause, Square, RotateCcw, Timer, Clock, Zap,
  AlertCircle, X, Star, Volume2, VolumeX,
  Maximize2, Minimize2, ChevronDown, GraduationCap,
  ListChecks, TrendingUp, Keyboard,
  ChevronUp, Hash, Sparkles, Music,
} from 'lucide-react';

/* ─── animation variants ─── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

/* ─── helpers ─── */
function formatTimeUnit(n: number) { return String(n).padStart(2, '0'); }

/* ─── section wrapper ─── */
const SectionBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    'rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-card)]',
    'shadow-sm hover:border-[color:var(--color-input)] hover:shadow-md transition-all duration-200',
    className
  )}>
    {children}
  </div>
);

export default function TimersPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();

  const searchParams = useSearchParams();
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [linkedSkillId, setLinkedSkillId] = useState<string>('');
  const [linkedHabitId, setLinkedHabitId] = useState<string>(searchParams.get('habitId') ?? '');
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [customH, setCustomH] = useState(0);
  const [customM, setCustomM] = useState(25);
  const [customS, setCustomS] = useState(0);
  const [labelEn, setLabelEn] = useState('Focus Session');
  const [labelAr, setLabelAr] = useState('جلسة تركيز');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [completionRating, setCompletionRating] = useState<MoodLevel>(3);
  const [showHistory, setShowHistory] = useState(false);
  const [clockNow, setClockNow] = useState<Date | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Sound controls state
  const [alarmSound, setAlarmSound] = useState<AlarmSound>('classic');
  const [alarmVolume, setAlarmVolume] = useState(70);
  const previewStopRef = useRef<(() => void) | null>(null);

  const active = store.activeTimer;
  const isRunning = active?.state === 'running';
  const isPaused = active?.state === 'paused';
  const isIdle = !active;
  const isCompleted = active?.state === 'completed';

  const timer = useTimerDisplay(active);

  // Live clock
  useEffect(() => {
    setClockNow(new Date());
    const cid = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(cid);
  }, []);

  const prevStateRef = useRef<string | null>(null);

  // Show completion modal when timer state becomes 'completed'
  useEffect(() => {
    if (active?.state === 'completed' && prevStateRef.current === 'running') {
      setShowComplete(true);
    }
    prevStateRef.current = active?.state ?? null;
  }, [active?.state]);

  const selectedHabit = linkedHabitId ? store.habits.find(h => h.id === linkedHabitId) : null;

  const handleStart = () => {
    let targetDuration: number | undefined;
    if (mode === 'countdown') targetDuration = (customH * 3600) + (customM * 60) + customS;

    const timerType = linkedHabitId ? 'habit-linked' : linkedSkillId ? 'skill-linked' : 'independent';
    const finalLabelEn = selectedHabit ? selectedHabit.nameEn : labelEn;
    const finalLabelAr = selectedHabit ? selectedHabit.nameAr : labelAr;

    store.startTimer({
      type: timerType,
      mode,
      skillId: linkedSkillId || undefined,
      habitId: linkedHabitId || undefined,
      labelEn: finalLabelEn, labelAr: finalLabelAr,
      startedAt: new Date().toISOString(),
      duration: 0,
      targetDuration,
    });
  };

  const handlePauseResume = () => {
    if (isRunning) store.pauseTimer();
    else if (isPaused) store.resumeTimer();
  };

  const handleStop = () => {
    setShowComplete(true);
    if (active) {
      store.updateActiveTimer({ state: 'completed', remainingMs: 0, elapsedMs: elapsed * 1000, endsAt: undefined });
    }
  };

  const handleComplete = () => {
    if (!active) return;
    const timerSession = store.timerSessions.find(t => t.id === active.sessionId);
    const hId = timerSession?.habitId || linkedHabitId;
    const sId = timerSession?.skillId || linkedSkillId;

    store.completeTimer(active.sessionId, completionNote, completionRating);

    const finalElapsed = computeTimerElapsed(active);
    if (sId && finalElapsed > 60) {
      const durationMin = Math.round(finalElapsed / 60);
      const now = new Date();
      const startTime = new Date(now.getTime() - finalElapsed * 1000);
      store.logSkillSession({
        skillId: sId,
        date: todayString(),
        startTime: startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        endTime: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: durationMin,
        sessionType: 'practice',
        qualityRating: completionRating,
        focusRating: completionRating,
        note: completionNote,
        whatLearned: '',
        tags: [],
        timerUsed: true,
      });
    }

    setShowComplete(false);
    setCompletionNote('');
    setCompletionRating(3);
    setLinkedSkillId('');
    setLinkedHabitId('');
  };

  const handleCancel = () => {
    stopAlarmSound('__timer_alarm__');
    store.cancelTimer();
    setShowComplete(false);
  };

  const handleTestSound = () => {
    if (previewStopRef.current) previewStopRef.current();
    const stop = playAlarmPreview(alarmSound, alarmVolume);
    previewStopRef.current = stop;
    setTimeout(() => { stop(); previewStopRef.current = null; }, 2000);
  };

  // Display values
  const elapsed = timer.elapsed;
  const target = active?.targetDuration;
  const remaining = timer.remaining;
  const displayTime = timer.displayTime;
  const progress = timer.progress;

  // SVG ring — reduced size
  const ringRadius = 100;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progress / 100) * ringCircumference;

  // Stats
  const recentTimers = useMemo(() =>
    [...store.timerSessions].filter(t => t.completed).sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? '')).slice(0, 10),
    [store.timerSessions]
  );

  const todayTotal = useMemo(() =>
    store.timerSessions.filter(t => t.completed && t.startedAt.startsWith(todayString())).reduce((a, t) => a + t.duration, 0),
    [store.timerSessions]
  );

  const todaySessions = useMemo(() =>
    store.timerSessions.filter(t => t.completed && t.startedAt.startsWith(todayString())).length,
    [store.timerSessions]
  );

  const weekTotal = useMemo(() => {
    const now = new Date();
    const ws = new Date(now); const wd = ws.getDay(); ws.setDate(ws.getDate() - (wd === 0 ? 6 : wd - 1));
    const weekStart = formatLocalDate(ws);
    return store.timerSessions.filter(t => t.completed && t.startedAt >= weekStart).reduce((a, t) => a + t.duration, 0);
  }, [store.timerSessions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (showComplete) {
        if (e.key === 'Escape') { e.preventDefault(); handleCancel(); }
        if (e.key === 'Enter') { e.preventDefault(); handleComplete(); }
        return;
      }
      if (showKeyboardHelp && e.key === 'Escape') { e.preventDefault(); setShowKeyboardHelp(false); return; }
      if (showHistory && e.key === 'Escape') { e.preventDefault(); setShowHistory(false); return; }
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isIdle) handleStart();
          else handlePauseResume();
          break;
        case 'r':
        case 'R':
          if (active) { e.preventDefault(); handleCancel(); }
          break;
        case 's':
        case 'S':
          if (active) { e.preventDefault(); handleStop(); }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setFullscreen(f => !f);
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardHelp(k => !k);
          break;
        case 'Escape':
          if (fullscreen) setFullscreen(false);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, isIdle, isRunning, isPaused, showComplete, showKeyboardHelp, showHistory, fullscreen]);

  // Timer state for visual styling
  const timerState = isRunning ? 'running' : isPaused ? 'paused' : isCompleted ? 'completed' : 'idle';

  const stateColors = {
    idle: 'var(--color-primary)',
    running: 'var(--color-primary)',
    paused: 'var(--color-warning)',
    completed: 'var(--color-success)',
  };

  const modeIcons: Record<string, React.ElementType> = {
    countdown: Timer,
    stopwatch: Clock,
  };

  const containerClass = fullscreen
    ? 'fixed inset-0 z-[var(--z-modal)] bg-[var(--color-background)] flex flex-col items-center justify-center'
    : 'px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 max-w-[1400px] mx-auto';

  /* ─── Timer Ring Component (shared between idle and active) ─── */
  const TimerRing = ({ size = 'small' }: { size?: 'small' | 'medium' }) => {
    const svgSize = size === 'medium' ? 'w-56 h-56' : 'w-48 h-48 sm:w-56 sm:h-56';
    const viewBox = '0 0 240 240';
    const cx = 120;
    const cy = 120;

    return (
      <div className="relative">
        {/* Ambient glow */}
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-[40px] transition-all duration-1000',
            isRunning ? 'opacity-30' : isPaused ? 'opacity-15' : 'opacity-8'
          )}
          style={{ background: stateColors[timerState] }}
        />

        <div className="relative">
          <svg className={svgSize} viewBox={viewBox}>
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="color-mix(in srgb, var(--color-primary) 70%, #8b5cf6)" />
              </linearGradient>
              <filter id="timerGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background track */}
            <circle
              cx={cx} cy={cy} r={ringRadius}
              fill="none" stroke="currentColor" strokeWidth="3"
              className="text-[var(--foreground)]/[0.15]"
              transform={`rotate(-90 ${cx} ${cy})`}
            />

            {/* Track dots */}
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = (i * 6 - 90) * (Math.PI / 180);
              const x = cx + (ringRadius + 10) * Math.cos(angle);
              const y = cy + (ringRadius + 10) * Math.sin(angle);
              return i % 5 === 0 ? (
                <circle key={i} cx={x} cy={y} r={1.2} className="fill-[var(--foreground)]/[0.18]" />
              ) : null;
            })}

            {/* Progress arc */}
            {(mode !== 'stopwatch' || active) && (
              <circle
                cx={cx} cy={cy} r={ringRadius}
                fill="none" stroke="url(#timerGradient)"
                strokeWidth={isRunning ? 5 : 4}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={mode === 'stopwatch' ? 0 : ringOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
                filter={isRunning ? 'url(#timerGlow)' : undefined}
                className="transition-all duration-1000 ease-linear"
              />
            )}

            {/* Start dot */}
            {(active && mode !== 'stopwatch' && progress > 0) && (
              <circle cx={cx} cy={cy - ringRadius} r="3" fill="var(--color-primary)" className="opacity-60" />
            )}
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Linked habit badge */}
            {selectedHabit && isIdle && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium mb-2
                  bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15"
              >
                <ListChecks className="h-2.5 w-2.5" />
                {isAr ? selectedHabit.nameAr : selectedHabit.nameEn}
              </motion.span>
            )}

            {/* Timer display */}
            {(() => {
              const totalSec = isIdle
                ? mode === 'countdown' ? (customH * 3600) + (customM * 60) + customS : 0
                : displayTime;
              const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
              const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
              const ss = String(totalSec % 60).padStart(2, '0');
              const fontSize = fullscreen ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl';
              const labelSize = 'text-[9px]';
              return (
                <div className="relative" dir="ltr">
                  <div className="flex items-center justify-center gap-0.5">
                    {[
                      { val: hh, label: 'H' },
                      { val: mm, label: 'M' },
                      { val: ss, label: 'S' },
                    ].map((u, i) => (
                      <React.Fragment key={u.label}>
                        {i > 0 && (
                          <span
                            className={cn('font-mono font-black tabular-nums transition-colors duration-[var(--dur-slow)] -mx-0.5 self-start mt-0.5', fontSize)}
                            style={{ color: stateColors[timerState], opacity: 0.4 }}
                          >:</span>
                        )}
                        <div className="flex flex-col items-center">
                          <span
                            className={cn('font-mono font-black tracking-tighter tabular-nums transition-colors duration-[var(--dur-slow)]', fontSize)}
                            style={{ color: stateColors[timerState] }}
                          >{u.val}</span>
                          <span className={cn('font-semibold uppercase tracking-wider text-[var(--foreground)]/30 mt-0.5', labelSize)}>{u.label}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Status indicator */}
            {active && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-2">
                <span className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isRunning && 'bg-[var(--color-primary)] animate-pulse',
                  isPaused && 'bg-[var(--color-warning)]',
                )} />
                <span className="text-[10px] font-medium text-[var(--foreground)]/50">
                  {isRunning ? (isAr ? 'قيد التشغيل' : 'Running')
                    : isPaused ? (isAr ? 'متوقف مؤقتاً' : 'Paused')
                    : ''}
                </span>
                {active.targetDuration && (
                  <span className="text-[9px] tabular-nums text-[var(--foreground)]/30 font-mono">
                    {Math.round(progress)}%
                  </span>
                )}
              </motion.div>
            )}

            {/* Idle mode label */}
            {isIdle && (
              <p className="text-[10px] text-[var(--foreground)]/30 mt-1.5 font-medium">
                {isAr ? (mode === 'countdown' ? 'عد تنازلي' : 'ساعة إيقاف') : (mode === 'countdown' ? 'Countdown' : 'Stopwatch')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ────────────────────────────────────────────────────────────── */
  return (
    <div className={containerClass}>

      {/* ═══ FULLSCREEN MODE ═══ */}
      {fullscreen && (
        <>
          <motion.div variants={scaleIn} initial="hidden" animate="visible" className="mb-6">
            <TimerRing size="medium" />
          </motion.div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
            {isIdle ? (
              <button
                onClick={handleStart}
                className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-[var(--dur-base)] active:scale-95"
                style={{
                  background: `linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, black))`,
                  boxShadow: `0 8px 24px rgba(var(--color-primary-rgb) / 0.35)`,
                }}
              >
                <Play className="h-6 w-6 text-white ms-0.5" />
              </button>
            ) : (
              <>
                <button onClick={handleCancel}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[var(--foreground)]/[0.03] hover:bg-[var(--foreground)]/[0.06] hover:border-[color:var(--color-input)] transition-all active:scale-95"
                  title={isAr ? 'إلغاء' : 'Reset (R)'}
                >
                  <RotateCcw className="h-5 w-5 text-[var(--foreground)]/50" />
                </button>
                <button onClick={handlePauseResume}
                  className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${stateColors[timerState]}, color-mix(in srgb, ${stateColors[timerState]} 85%, black))`,
                    boxShadow: `0 8px 24px rgba(var(--color-primary-rgb) / 0.3)`,
                  }}
                >
                  {isRunning ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ms-0.5" />}
                </button>
                <button onClick={handleStop}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--color-destructive)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--color-destructive)_8%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--color-destructive)_14%,transparent)] transition-all active:scale-95"
                  title={isAr ? 'إيقاف' : 'Stop (S)'}
                >
                  <Square className="h-5 w-5 text-[color:color-mix(in_srgb,var(--color-destructive)_72%,var(--color-foreground))]" />
                </button>
              </>
            )}
          </div>

          {/* Distraction counter in fullscreen */}
          {active && (
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={() => store.addDistraction()}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-[color:var(--color-border)] text-[var(--foreground)]/40 hover:text-[var(--foreground)]/60 hover:border-[color:var(--color-input)] transition-all"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {isAr ? 'تشتت' : 'Distraction'}
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[var(--foreground)]/[0.05] tabular-nums text-[10px] font-bold">
                {store.timerSessions.find(t => t.id === active.sessionId)?.distractionCount ?? 0}
              </span>
            </motion.button>
          )}

          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setFullscreen(false)}
            className="fixed top-6 end-6 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.1] transition-all text-xs font-medium"
          >
            <Minimize2 className="h-4 w-4" />
            {isAr ? 'تصغير' : 'Exit'}
          </motion.button>
        </>
      )}

      {/* ═══ NORMAL (NON-FULLSCREEN) LAYOUT ═══ */}
      {!fullscreen && (
        <motion.div initial="hidden" animate="visible" variants={stagger}>

          {/* ═══ ROW 1: HEADER ═══ */}
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-[var(--text-h1)] font-bold tracking-tight">
                {isAr ? 'المؤقتات' : 'Timers'}
              </h1>
              <p className="text-sm text-[var(--foreground)]/50 mt-0.5">
                {isAr ? 'ركّز. أنجز. تقدّم.' : 'Focus. Achieve. Progress.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKeyboardHelp(k => !k)}
                className="p-2.5 rounded-xl transition-all duration-[var(--dur-base)] hover:bg-[rgba(var(--color-primary-rgb)/0.06)] text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70"
                title={isAr ? 'اختصارات لوحة المفاتيح' : 'Keyboard shortcuts'}
              >
                <Keyboard className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn(
                  'p-2.5 rounded-xl transition-all duration-[var(--dur-base)]',
                  soundEnabled
                    ? 'hover:bg-[rgba(var(--color-primary-rgb)/0.06)] text-[var(--foreground)]/60'
                    : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/30'
                )}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setFullscreen(true)}
                className="p-2.5 rounded-xl transition-all duration-[var(--dur-base)] hover:bg-[rgba(var(--color-primary-rgb)/0.06)] text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* ═══ ROW 2: STAT CARDS ═══ */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: Clock, labelEn: 'Today', labelAr: 'اليوم', value: formatTimerDuration(todayTotal), color: 'var(--color-primary)' },
              { icon: Hash, labelEn: 'Sessions', labelAr: 'الجلسات', value: String(todaySessions), color: 'var(--color-primary)' },
              { icon: TrendingUp, labelEn: 'This Week', labelAr: 'هذا الأسبوع', value: formatTimerDuration(weekTotal), color: 'var(--color-primary)' },
              {
                icon: Clock,
                labelEn: clockNow
                  ? clockNow.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  : '',
                labelAr: clockNow
                  ? clockNow.toLocaleDateString('ar-SA-u-nu-latn', { weekday: 'short', month: 'short', day: 'numeric' })
                  : '',
                value: clockNow
                  ? `${formatTimeUnit(clockNow.getHours() % 12 || 12)}:${formatTimeUnit(clockNow.getMinutes())}`
                  : '--:--',
                color: 'var(--color-primary)',
                suffix: clockNow ? (clockNow.getHours() >= 12 ? ' PM' : ' AM') : '',
              },
            ].map((stat, i) => (
              <SectionBox key={i} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="h-3.5 w-3.5 text-[var(--foreground)]/30" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground)]/40">
                    {isAr ? stat.labelAr : stat.labelEn}
                  </span>
                </div>
                <p className="text-xl font-bold tabular-nums tracking-tight" style={{ color: stat.color }}>
                  {stat.value}
                  {stat.suffix && <span className="text-xs font-semibold text-[var(--foreground)]/40 ms-0.5">{stat.suffix}</span>}
                </p>
              </SectionBox>
            ))}
          </motion.div>

          {/* ═══ ROW 3: IDLE — 3-COLUMN GRID ═══ */}
          {isIdle && (
            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

              {/* ─── COL 1: Mode Switcher + Duration Presets + Custom H:M:S ─── */}
              <div className="space-y-4">
                {/* Mode Switcher */}
                <SectionBox className="p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40 mb-3">
                    {isAr ? 'الوضع' : 'Mode'}
                  </h3>
                  <div className="relative flex p-1 rounded-xl bg-[var(--foreground)]/[0.05] border border-[color:var(--color-input)]">
                    {([
                      { m: 'countdown' as TimerMode, en: 'Countdown', ar: 'عد تنازلي', icon: Timer },
                      { m: 'stopwatch' as TimerMode, en: 'Stopwatch', ar: 'ساعة إيقاف', icon: Clock },
                    ]).map((item) => (
                      <button
                        key={item.m}
                        onClick={() => setMode(item.m)}
                        className={cn(
                          'relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-[var(--dur-base)]',
                          mode === item.m
                            ? 'text-white'
                            : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]/80'
                        )}
                      >
                        {mode === item.m && (
                          <motion.div
                            layoutId="activeMode"
                            className="absolute inset-0 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, black))`,
                              boxShadow: `0 4px 16px rgba(var(--color-primary-rgb) / 0.3)`,
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <item.icon className="h-3.5 w-3.5" />
                          {isAr ? item.ar : item.en}
                        </span>
                      </button>
                    ))}
                  </div>
                </SectionBox>

                {/* Duration Presets (countdown only) */}
                {mode === 'countdown' && (
                  <SectionBox className="p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40 mb-3">
                      {isAr ? 'المدة' : 'Duration'}
                    </h3>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[5, 10, 15, 25, 30, 45, 60, 90].map(m => {
                        const isSelected = customH === 0 && customS === 0 && customM === m;
                        return (
                          <button
                            key={m}
                            onClick={() => { setCountdownMinutes(m); setCustomH(0); setCustomM(m); setCustomS(0); }}
                            className={cn(
                              'py-2 rounded-lg text-xs font-semibold tabular-nums transition-all duration-[var(--dur-base)]',
                              isSelected
                                ? 'text-white shadow-[0_4px_12px_rgba(var(--color-primary-rgb)/0.25)]'
                                : 'bg-[var(--foreground)]/[0.03] text-[var(--foreground)]/50 border border-[color:var(--color-border)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] hover:shadow-md'
                            )}
                            style={isSelected ? {
                              background: `linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, black))`,
                            } : undefined}
                          >
                            {m}<span className="text-[9px] font-medium ms-0.5">m</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom H:M:S */}
                    <div className="mt-3 pt-3 border-t border-[color:var(--color-border)]">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/30 mb-2">
                        {isAr ? 'وقت مخصص' : 'Custom Time'}
                      </h4>
                      <div className="flex items-center justify-center gap-1.5">
                        {[
                          { label: isAr ? 'س' : 'H', value: customH, set: setCustomH, max: 23 },
                          { label: isAr ? 'د' : 'M', value: customM, set: setCustomM, max: 59 },
                          { label: isAr ? 'ث' : 'S', value: customS, set: setCustomS, max: 59 },
                        ].map((unit, i) => (
                          <React.Fragment key={unit.label}>
                            {i > 0 && <span className="text-base font-bold text-[var(--foreground)]/20 -mx-0.5">:</span>}
                            <div className="flex flex-col items-center gap-0.5">
                              <button
                                onClick={() => unit.set(v => Math.min(v + 1, unit.max))}
                                className="p-0.5 rounded-lg hover:bg-[rgba(var(--color-primary-rgb)/0.08)] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition-colors"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={unit.max}
                                value={unit.value}
                                onChange={e => {
                                  const v = Math.max(0, Math.min(unit.max, Number(e.target.value) || 0));
                                  unit.set(v);
                                }}
                                className="w-12 rounded-lg app-input px-1 py-1.5 text-center text-base font-bold tabular-nums"
                              />
                              <button
                                onClick={() => unit.set(v => Math.max(v - 1, 0))}
                                className="p-0.5 rounded-lg hover:bg-[rgba(var(--color-primary-rgb)/0.08)] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition-colors"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                              <span className="text-[9px] font-medium text-[var(--foreground)]/30 uppercase">{unit.label}</span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </SectionBox>
                )}
              </div>

              {/* ─── COL 2: Timer Ring + Controls + Keyboard Hints ─── */}
              <div className="flex flex-col items-center">
                <SectionBox className="p-5 flex flex-col items-center w-full">
                  <TimerRing />

                  {/* Play button */}
                  <div className="mt-4 mb-3">
                    <button
                      onClick={handleStart}
                      className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-[var(--dur-base)] active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, black))`,
                        boxShadow: `0 8px 24px rgba(var(--color-primary-rgb) / 0.35)`,
                      }}
                    >
                      <Play className="h-6 w-6 text-white ms-0.5" />
                      <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--dur-base)]" />
                    </button>
                  </div>

                  {/* Keyboard hints */}
                  <div className="flex items-center gap-3 text-[10px] text-[var(--foreground)]/25 font-medium">
                    <span className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded border border-[color:var(--color-border)] bg-[var(--foreground)]/[0.03] text-[10px] font-mono">
                        Space
                      </kbd>
                      {isAr ? 'تشغيل' : 'start'}
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded border border-[color:var(--color-border)] bg-[var(--foreground)]/[0.03] text-[10px] font-mono">
                        ?
                      </kbd>
                      {isAr ? 'المزيد' : 'more'}
                    </span>
                  </div>
                </SectionBox>
              </div>

              {/* ─── COL 3: Sound Controls + Links + Label ─── */}
              <div className="space-y-4">
                {/* Sound Controls */}
                <SectionBox className="p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40 mb-3 flex items-center gap-2">
                    <Music className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                    {isAr ? 'أصوات التنبيه' : 'Sound Controls'}
                  </h3>

                  {/* Sound grid */}
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {ALARM_SOUNDS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setAlarmSound(s.id)}
                        className={cn(
                          'py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all duration-[var(--dur-base)] truncate',
                          alarmSound === s.id
                            ? 'text-white shadow-sm'
                            : 'bg-[var(--foreground)]/[0.03] text-[var(--foreground)]/50 border border-[color:var(--color-border)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] hover:shadow-md'
                        )}
                        style={alarmSound === s.id ? {
                          background: `linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, black))`,
                        } : undefined}
                      >
                        {isAr ? s.labelAr : s.labelEn}
                      </button>
                    ))}
                  </div>

                  {/* Test + Mute row */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={handleTestSound}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium
                        border border-[color:var(--color-input)]
                        bg-[rgba(var(--color-primary-rgb)/0.04)]
                        hover:bg-[rgba(var(--color-primary-rgb)/0.08)]
                        text-[var(--color-primary)]
                        transition-all duration-[var(--dur-base)] active:scale-[0.98]"
                    >
                      <Play className="h-3 w-3" />
                      {isAr ? 'تجربة' : 'Test'}
                    </button>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-[var(--dur-base)]',
                        soundEnabled
                          ? 'border border-[color:var(--color-border)] bg-[var(--foreground)]/[0.03] text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.06] hover:border-[color:var(--color-input)]'
                          : 'border border-[color:color-mix(in_srgb,var(--color-destructive)_25%,transparent)] bg-[color:color-mix(in_srgb,var(--color-destructive)_8%,transparent)] text-[color:color-mix(in_srgb,var(--color-destructive)_75%,var(--color-foreground))]'
                      )}
                    >
                      {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                      {soundEnabled ? (isAr ? 'مفعّل' : 'On') : (isAr ? 'صامت' : 'Muted')}
                    </button>
                  </div>

                  {/* Volume slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium text-[var(--foreground)]/30 uppercase tracking-wider">
                        {isAr ? 'مستوى الصوت' : 'Volume'}
                      </span>
                      <span className="text-[10px] font-bold tabular-nums text-[var(--foreground)]/40">
                        {alarmVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={alarmVolume}
                      onChange={(e) => setAlarmVolume(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                        bg-[var(--foreground)]/[0.08]
                        accent-[var(--color-primary)]
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-[var(--color-primary)]
                        [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(var(--color-primary-rgb)/0.3)]
                        [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>
                </SectionBox>

                {/* Link to Habit */}
                <SectionBox className="p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40 mb-2.5 flex items-center gap-2">
                    <ListChecks className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                    {isAr ? 'ربط بعادة' : 'Link to Habit'}
                  </h3>
                  <select
                    value={linkedHabitId}
                    onChange={e => { setLinkedHabitId(e.target.value); if (e.target.value) setLinkedSkillId(''); }}
                    className="w-full rounded-lg app-input px-3 py-2 text-sm"
                  >
                    <option value="">{isAr ? 'بدون ربط' : 'None'}</option>
                    {store.habits.filter(h => !h.archived).map(h => (
                      <option key={h.id} value={h.id}>{isAr ? h.nameAr : h.nameEn}</option>
                    ))}
                  </select>
                </SectionBox>

                {/* Link to Skill */}
                <SectionBox className="p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40 mb-2.5 flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                    {isAr ? 'ربط بمهارة' : 'Link to Skill'}
                  </h3>
                  <select
                    value={linkedSkillId}
                    onChange={e => { setLinkedSkillId(e.target.value); if (e.target.value) setLinkedHabitId(''); }}
                    className="w-full rounded-lg app-input px-3 py-2 text-sm"
                  >
                    <option value="">{isAr ? 'بدون ربط' : 'None'}</option>
                    {store.skills.filter(s => !s.archived).map(s => (
                      <option key={s.id} value={s.id}>{isAr ? s.nameAr : s.nameEn}</option>
                    ))}
                  </select>
                </SectionBox>

                {/* Session Label */}
                <SectionBox className="p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40 mb-2.5">
                    {isAr ? 'تسمية الجلسة' : 'Session Label'}
                  </h3>
                  <input
                    value={isAr ? labelAr : labelEn}
                    onChange={e => isAr ? setLabelAr(e.target.value) : setLabelEn(e.target.value)}
                    className="w-full rounded-lg app-input px-3 py-2 text-sm"
                    placeholder={isAr ? 'مثال: دراسة البرمجة' : 'e.g., Coding Study'}
                  />
                </SectionBox>
              </div>
            </motion.div>
          )}

          {/* ═══ ACTIVE TIMER — 2-COLUMN LAYOUT ═══ */}
          {active && (
            <motion.div variants={fadeUp} className="mb-6">
              {/* Active session info bar */}
              <SectionBox className="p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                      'bg-[rgba(var(--color-primary-rgb)/0.08)] text-[var(--color-primary)]'
                    )}>
                      {modeIcons[active.mode] && React.createElement(modeIcons[active.mode], { className: 'h-3.5 w-3.5' })}
                      {active.mode === 'countdown' ? (isAr ? 'عد تنازلي' : 'Countdown') : (isAr ? 'ساعة إيقاف' : 'Stopwatch')}
                    </span>
                    <span className={cn(
                      'h-2 w-2 rounded-full',
                      isRunning && 'bg-[var(--color-primary)] animate-pulse',
                      isPaused && 'bg-[var(--color-warning)]',
                    )} />
                    <span className="text-xs font-medium text-[var(--foreground)]/50">
                      {isRunning ? (isAr ? 'قيد التشغيل' : 'Running') : isPaused ? (isAr ? 'متوقف مؤقتاً' : 'Paused') : ''}
                    </span>
                  </div>
                  {active.targetDuration && (
                    <span className="text-xs font-mono tabular-nums text-[var(--foreground)]/40">
                      {formatTimerDuration(elapsed)} / {formatTimerDuration(active.targetDuration)}
                    </span>
                  )}
                </div>
              </SectionBox>

              {/* 2-column: Timer + Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Timer Ring + Controls + Distraction */}
                <SectionBox className="p-5 flex flex-col items-center">
                  <TimerRing />

                  {/* Controls */}
                  <div className="flex items-center gap-4 mt-4 mb-3">
                    <button onClick={handleCancel}
                      className="flex h-11 w-11 items-center justify-center rounded-xl
                        border border-[color:var(--color-border)]
                        bg-[var(--foreground)]/[0.03]
                        hover:bg-[var(--foreground)]/[0.06]
                        hover:border-[color:var(--color-input)]
                        transition-all duration-[var(--dur-base)] active:scale-95"
                      title={isAr ? 'إلغاء' : 'Reset (R)'}
                    >
                      <RotateCcw className="h-5 w-5 text-[var(--foreground)]/50" />
                    </button>

                    <button onClick={handlePauseResume}
                      className="group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-[var(--dur-base)] active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, ${stateColors[timerState]}, color-mix(in srgb, ${stateColors[timerState]} 85%, black))`,
                        boxShadow: `0 8px 24px rgba(var(--color-primary-rgb) / 0.3)`,
                      }}
                    >
                      {isRunning ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white ms-0.5" />}
                      <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--dur-base)]" />
                    </button>

                    <button onClick={handleStop}
                      className="flex h-11 w-11 items-center justify-center rounded-xl
                        border border-[color:color-mix(in_srgb,var(--color-destructive)_22%,transparent)]
                        bg-[color:color-mix(in_srgb,var(--color-destructive)_8%,transparent)]
                        hover:bg-[color:color-mix(in_srgb,var(--color-destructive)_14%,transparent)]
                        hover:border-[color:color-mix(in_srgb,var(--color-destructive)_32%,transparent)]
                        transition-all duration-[var(--dur-base)] active:scale-95"
                      title={isAr ? 'إيقاف' : 'Stop (S)'}
                    >
                      <Square className="h-5 w-5 text-[color:color-mix(in_srgb,var(--color-destructive)_72%,var(--color-foreground))]" />
                    </button>
                  </div>

                  {/* Distraction counter */}
                  <motion.button
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => store.addDistraction()}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium
                      border border-[color:var(--color-border)]
                      text-[var(--foreground)]/40
                      hover:text-[var(--foreground)]/60
                      hover:border-[color:var(--color-input)]
                      hover:bg-[var(--foreground)]/[0.02]
                      transition-all duration-[var(--dur-base)]"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {isAr ? 'تشتت' : 'Distraction'}
                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[var(--foreground)]/[0.05] tabular-nums text-[10px] font-bold">
                      {store.timerSessions.find(t => t.id === active.sessionId)?.distractionCount ?? 0}
                    </span>
                  </motion.button>

                  {/* Keyboard hints */}
                  <div className="flex items-center gap-3 text-[10px] text-[var(--foreground)]/25 font-medium mt-3">
                    <span className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded border border-[color:var(--color-border)] bg-[var(--foreground)]/[0.03] text-[10px] font-mono">
                        Space
                      </kbd>
                      {isAr ? 'تشغيل/إيقاف' : 'play/pause'}
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded border border-[color:var(--color-border)] bg-[var(--foreground)]/[0.03] text-[10px] font-mono">
                        S
                      </kbd>
                      {isAr ? 'إيقاف' : 'stop'}
                    </span>
                  </div>
                </SectionBox>

                {/* Right: Session Details + Progress */}
                <div className="space-y-4">
                  {(() => {
                    const sess = store.timerSessions.find(t => t.id === active.sessionId);
                    const linkedH = sess?.habitId ? store.habits.find(h => h.id === sess.habitId) : null;
                    const linkedS = sess?.skillId ? store.skills.find(s => s.id === sess.skillId) : null;
                    return (
                      <SectionBox className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40 flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                            {isAr ? 'الجلسة الحالية' : 'Active Session'}
                          </h3>
                        </div>

                        <p className="text-sm font-semibold">
                          {isAr ? (sess?.labelAr || 'جلسة') : (sess?.labelEn || 'Session')}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap">
                          {linkedH && (
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15 font-semibold flex items-center gap-1">
                              <ListChecks className="h-3 w-3" /> {isAr ? linkedH.nameAr : linkedH.nameEn}
                            </span>
                          )}
                          {linkedS && (
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-sky-500/8 text-sky-600 dark:text-sky-400 dark:bg-sky-500/15 font-semibold flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" /> {isAr ? linkedS.nameAr : linkedS.nameEn}
                            </span>
                          )}
                        </div>

                        {active.targetDuration && (
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-[var(--foreground)]/40 mb-2 tabular-nums font-mono">
                              <span>{formatTimerDuration(elapsed)}</span>
                              <span>{formatTimerDuration(active.targetDuration)}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, #8b5cf6))`,
                                  width: `${Math.min(100, (elapsed / active.targetDuration) * 100)}%`,
                                }}
                                transition={{ duration: 1, ease: 'linear' }}
                              />
                            </div>
                          </div>
                        )}
                      </SectionBox>
                    );
                  })()}

                  {/* Stats summary while running */}
                  <SectionBox className="p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40 mb-3">
                      {isAr ? 'إحصائيات اليوم' : "Today's Stats"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-[var(--foreground)]/30 uppercase tracking-wider">{isAr ? 'المجموع' : 'Total'}</p>
                        <p className="text-base font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>{formatTimerDuration(todayTotal)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--foreground)]/30 uppercase tracking-wider">{isAr ? 'الجلسات' : 'Sessions'}</p>
                        <p className="text-base font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>{todaySessions}</p>
                      </div>
                    </div>
                  </SectionBox>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ HISTORY ═══ */}
          <motion.div variants={fadeUp}>
            <SectionBox className="overflow-hidden">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-5 text-start hover:bg-[rgba(var(--color-primary-rgb)/0.02)] transition-colors"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                  {isAr ? 'السجل' : 'Recent History'}
                </h3>
                <ChevronDown className={cn(
                  'h-4 w-4 text-[var(--foreground)]/30 transition-transform duration-[var(--dur-base)]',
                  showHistory && 'rotate-180'
                )} />
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-2">
                      {recentTimers.length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="h-8 w-8 mx-auto text-[var(--foreground)]/[0.18] mb-2" />
                          <p className="text-xs text-[var(--foreground)]/25">
                            {isAr ? 'لا توجد جلسات سابقة' : 'No sessions yet'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                          {recentTimers.map((t, i) => {
                            const linkedHabit = t.habitId ? store.habits.find(h => h.id === t.habitId) : null;
                            const linkedSkill = t.skillId ? store.skills.find(s => s.id === t.skillId) : null;
                            return (
                              <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center justify-between rounded-xl px-3.5 py-2.5
                                  bg-[var(--foreground)]/[0.02]
                                  hover:bg-[rgba(var(--color-primary-rgb)/0.03)]
                                  border border-transparent hover:border-[color:var(--color-border)]
                                  transition-all duration-[var(--dur-base)]"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold truncate">{isAr ? t.labelAr : t.labelEn}</p>
                                  <p className="text-[10px] text-[var(--foreground)]/30 mt-0.5 flex items-center gap-1 flex-wrap">
                                    <span className="capitalize">{t.mode}</span>
                                    <span>·</span>
                                    <span>{new Date(t.startedAt).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                                    {linkedHabit && (
                                      <span className="text-emerald-500">· {isAr ? linkedHabit.nameAr : linkedHabit.nameEn}</span>
                                    )}
                                    {linkedSkill && (
                                      <span className="text-sky-500">· {isAr ? linkedSkill.nameAr : linkedSkill.nameEn}</span>
                                    )}
                                  </p>
                                </div>
                                <div className="text-end ms-3 shrink-0">
                                  <p className="text-xs font-bold tabular-nums font-mono" style={{ color: 'var(--color-primary)' }}>
                                    {formatTimerDuration(t.duration)}
                                  </p>
                                  {t.productivityRating && (
                                    <div className="flex gap-0.5 justify-end mt-0.5">
                                      {Array.from({ length: 5 }).map((_, j) => (
                                        <Star key={j} className={cn('h-2.5 w-2.5', j < t.productivityRating! ? 'text-amber-400 fill-amber-400' : 'text-[var(--foreground)]/10')} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionBox>
          </motion.div>
        </motion.div>
      )}

      {/* ═══ COMPLETION MODAL ═══ */}
      <AnimatePresence>
        {showComplete && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm"
              onClick={handleCancel}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-0 sm:mx-auto top-[12%] z-[var(--z-modal)] sm:w-[440px]
                rounded-3xl overflow-hidden
                bg-[var(--color-background)]
                border border-[color:var(--color-border)]
                shadow-[var(--shadow-2xl)]"
            >
              {/* Gradient accent bar */}
              <div
                className="h-1"
                style={{
                  background: `linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, #8b5cf6), var(--color-primary))`,
                }}
              />

              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.12), rgba(var(--color-primary-rgb) / 0.04))`,
                  }}
                >
                  <Sparkles className="h-8 w-8" style={{ color: 'var(--color-primary)' }} />
                </motion.div>

                <h2 className="text-xl font-bold mb-1">{isAr ? 'أحسنت!' : 'Well Done!'}</h2>
                <p className="text-sm text-[var(--foreground)]/50 mb-6">
                  {isAr ? `أكملت ${formatTimerDuration(elapsed)} من التركيز` : `You focused for ${formatTimerDuration(elapsed)}`}
                </p>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-3">
                    {isAr ? 'تقييم الإنتاجية' : 'How was your session?'}
                  </p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button
                        key={r}
                        onClick={() => setCompletionRating(r as MoodLevel)}
                        className="group transition-transform duration-[var(--dur-fast)] hover:scale-110"
                      >
                        <Star className={cn(
                          'h-8 w-8 transition-all duration-[var(--dur-base)]',
                          r <= completionRating
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]'
                            : 'text-[var(--foreground)]/10 group-hover:text-[var(--foreground)]/20'
                        )} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={completionNote}
                  onChange={e => setCompletionNote(e.target.value)}
                  placeholder={isAr ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                  rows={2}
                  className="w-full rounded-xl app-input px-4 py-3 text-sm resize-none mb-6"
                />

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 rounded-xl text-sm font-medium
                      border border-[color:var(--color-border)]
                      text-[var(--foreground)]/50
                      hover:bg-[var(--foreground)]/[0.05]
                      hover:border-[color:var(--color-input)]
                      transition-all duration-[var(--dur-base)] active:scale-[0.98]"
                  >
                    {isAr ? 'إلغاء' : 'Discard'}
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white active:scale-[0.98]
                      transition-all duration-[var(--dur-base)]"
                    style={{
                      background: `linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, black))`,
                      boxShadow: `0 4px 16px rgba(var(--color-primary-rgb) / 0.3)`,
                    }}
                  >
                    {isAr ? 'حفظ الجلسة' : 'Save Session'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ KEYBOARD SHORTCUTS MODAL ═══ */}
      <AnimatePresence>
        {showKeyboardHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/30 backdrop-blur-sm"
              onClick={() => setShowKeyboardHelp(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-0 sm:mx-auto top-[15%] z-[var(--z-modal)] sm:w-[380px]
                rounded-2xl overflow-hidden
                bg-[var(--color-background)]
                border border-[color:var(--color-border)]
                shadow-[var(--shadow-xl)]"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Keyboard className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                    {isAr ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
                  </h3>
                  <button onClick={() => setShowKeyboardHelp(false)}
                    className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.05] transition-colors">
                    <X className="h-4 w-4 text-[var(--foreground)]/40" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {[
                    { key: 'Space', en: 'Start / Pause / Resume', ar: 'تشغيل / إيقاف مؤقت / استئناف' },
                    { key: 'S', en: 'Stop timer', ar: 'إيقاف المؤقت' },
                    { key: 'R', en: 'Reset / Cancel', ar: 'إعادة تعيين / إلغاء' },
                    { key: 'F', en: 'Toggle fullscreen', ar: 'تبديل ملء الشاشة' },
                    { key: '?', en: 'Show this help', ar: 'عرض هذه المساعدة' },
                    { key: 'Esc', en: 'Close modal / Exit fullscreen', ar: 'إغلاق / الخروج' },
                  ].map(s => (
                    <div key={s.key} className="flex items-center justify-between py-1.5">
                      <kbd className="inline-flex items-center justify-center h-6 min-w-[28px] px-2 rounded-md
                        border border-[color:var(--color-border)]
                        bg-[var(--foreground)]/[0.03]
                        text-[11px] font-mono font-semibold text-[var(--foreground)]/50">
                        {s.key}
                      </kbd>
                      <span className="text-xs text-[var(--foreground)]/50">{isAr ? s.ar : s.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
