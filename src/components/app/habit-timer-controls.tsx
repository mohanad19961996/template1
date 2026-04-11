'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useToast } from '@/components/app/toast-notifications';
import { Habit, formatTimerDuration, formatDurationSecs, resolveHabitColor, computeTimerElapsed, computeTimerRemaining, todayString } from '@/types/app';
import { useTimerDisplay } from '@/lib/use-timer-display';
import { Play, Pause, Square, Timer, X, CheckCircle2 } from 'lucide-react';

function fmtSecs(totalSecs: number): string {
  if (totalSecs <= 0) return '0s';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.floor(totalSecs % 60);
  if (h > 0) return s > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

// Per-habit timer state & actions
export function useHabitTimer(habit: Habit, store: ReturnType<typeof useAppStore>, customDurationSecs?: number) {
  const active = store.activeTimer;
  // Session lookup (fallback for old data without habitId on ActiveTimer, and for cancel/stop logging)
  const currentSession = active ? store.timerSessions.find(t => t.id === active.sessionId) : null;
  // Prefer ActiveTimer.habitId, fall back to session lookup for backward compat
  const activeHabitId = active?.habitId ?? (currentSession?.type === 'habit-linked' ? currentSession.habitId ?? null : null);
  const isMyTimer = !!activeHabitId && activeHabitId === habit.id && active?.state !== 'completed';
  const hasActiveTimer = !!active && active.state !== 'completed';
  const anotherRunning = hasActiveTimer && !isMyTimer;
  const running = isMyTimer && active?.state === 'running';
  const paused = isMyTimer && active?.state === 'paused';

  // Info about the blocking habit (when another timer is active)
  const blockingLabelEn = active?.labelEn || currentSession?.labelEn || '';
  const blockingLabelAr = active?.labelAr || currentSession?.labelAr || '';
  const blockingHabitName = anotherRunning && (blockingLabelEn || blockingLabelAr) ? { en: blockingLabelEn, ar: blockingLabelAr } : null;
  const blockingTimerState = anotherRunning ? active?.state : null;

  // Computed elapsed from absolute timestamps
  const { elapsed } = useTimerDisplay(isMyTimer ? active : null);

  const hasDuration = !!habit.expectedDuration;
  const habitTargetSecs = hasDuration ? habit.expectedDuration! : 0; // original habit target in seconds
  // Custom duration for countdown (may differ from habit target); falls back to habit target
  const timerDurationSecs = customDurationSecs && customDurationSecs > 0 ? customDurationSecs : habitTargetSecs;
  // For progress/display, use the habit's original target
  const targetSecs = habitTargetSecs;

  const start = () => {
    if (anotherRunning) return;
    if (habit.strictWindow && habit.windowStart && habit.windowEnd) {
      const now = new Date();
      const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (ct < habit.windowStart || ct > habit.windowEnd) return;
    }
    const countdownSecs = hasDuration ? timerDurationSecs : undefined;
    store.startTimer({
      type: 'habit-linked', mode: hasDuration ? 'countdown' : 'stopwatch',
      habitId: habit.id, labelEn: habit.nameEn, labelAr: habit.nameAr,
      startedAt: new Date().toISOString(), duration: 0,
      targetDuration: countdownSecs,
      habitTargetDuration: hasDuration ? habitTargetSecs : undefined,
    });
  };
  const pause = () => store.pauseTimer();
  const resume = () => store.resumeTimer();
  // Helper: check if this session crosses a new completion threshold
  // E.g. target=45m: 0-44m = 0 reps, 45-89m = 1 rep, 90-134m = 2 reps, etc.
  const getCumulativeCompleted = (today: string, additionalSecs: number) => {
    if (!hasDuration || targetSecs <= 0) return false;
    const maxReps = habit.maxDailyReps || Infinity;
    const prevTotal = store.habitLogs
      .filter(l => l.habitId === habit.id && l.date === today)
      .reduce((sum, l) => sum + (l.duration ?? 0), 0);
    const prevReps = Math.floor(prevTotal / targetSecs);
    const newReps = Math.floor((prevTotal + additionalSecs) / targetSecs);
    // Completed if we crossed a new threshold AND haven't exceeded maxReps
    return newReps > prevReps && (maxReps === Infinity || newReps <= maxReps);
  };

  const cancel = () => {
    if (currentSession && elapsed > 0 && !habit.archived) {
      const today = todayString();
      const isCompleted = getCumulativeCompleted(today, elapsed);
      store.logHabit({
        habitId: habit.id, date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: elapsed,
        note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: isCompleted,
        source: 'timer',
        habitExpectedDuration: habit.expectedDuration || undefined,
      });
    }
    store.cancelTimer();
  };
  const stop = (today: string, _done: boolean) => {
    if (!currentSession) return;
    const secs = elapsed;
    if (secs > 0 && !habit.archived) {
      const isCompleted = getCumulativeCompleted(today, secs);
      store.logHabit({
        habitId: habit.id, date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: secs,
        note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: isCompleted,
        source: 'timer',
        habitExpectedDuration: habit.expectedDuration || undefined,
      });
    }
    store.completeTimer(currentSession.id);
  };

  const activeTimerDuration = isMyTimer ? (active?.targetDuration || 0) : 0;
  const hasCustomDuration = hasDuration && activeTimerDuration > 0 && activeTimerDuration !== habitTargetSecs;
  // Cumulative today total (for display)
  const todayCumulativeSecs = store.habitLogs
    .filter(l => l.habitId === habit.id && l.date === todayString())
    .reduce((sum, l) => sum + (l.duration ?? 0), 0);
  const cumulativeWithCurrent = todayCumulativeSecs + (isMyTimer ? elapsed : 0);
  // Per-rep: how many full reps earned (capped at maxDailyReps), and progress toward next
  const maxRepsForCalc = habit.maxDailyReps || Infinity;
  const rawEarned = hasDuration && targetSecs > 0 ? Math.floor(todayCumulativeSecs / targetSecs) : 0;
  const rawEarnedWithCurrent = hasDuration && targetSecs > 0 ? Math.floor(cumulativeWithCurrent / targetSecs) : 0;
  const earnedReps = maxRepsForCalc === Infinity ? rawEarned : Math.min(rawEarned, maxRepsForCalc);
  const earnedRepsWithCurrent = maxRepsForCalc === Infinity ? rawEarnedWithCurrent : Math.min(rawEarnedWithCurrent, maxRepsForCalc);
  const progressTowardNext = hasDuration && targetSecs > 0 ? (cumulativeWithCurrent % targetSecs) / targetSecs : 0;
  const habitDoneLogged = hasDuration && earnedReps >= 1;

  return { isMyTimer, anotherRunning, running, paused, elapsed, targetSecs, hasDuration, blockingHabitName, blockingTimerState, habitDoneLogged, activeTimerDuration, hasCustomDuration, todayCumulativeSecs, cumulativeWithCurrent, earnedReps, earnedRepsWithCurrent, progressTowardNext, start, pause, resume, cancel, stop };
}

// Global timer state — for auto-complete logic
export function useStoreHabitTimer(store: ReturnType<typeof useAppStore>) {
  const active = store.activeTimer;
  const currentSession = active ? store.timerSessions.find(t => t.id === active.sessionId) : null;
  const activeHabitId = active?.habitId ?? (currentSession?.type === 'habit-linked' ? currentSession.habitId ?? null : null);
  const running = active?.state === 'running';
  const paused = active?.state === 'paused';
  // Compute elapsed from timestamps
  const elapsed = computeTimerElapsed(active);
  const hasActiveTimer = !!active && active.state !== 'completed';

  return { activeHabitId, running, paused, elapsed, hasActiveTimer, currentSession };
}

// Compact timer controls — reusable across all views
export function HabitTimerControls({ habit, isAr, store, today, done, size = 'sm', disabled = false, customDurationSecs, dense = false }: {
  habit: Habit; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string; done: boolean; size?: 'sm' | 'xs' | 'md'; disabled?: boolean; customDurationSecs?: number;
  /** Tighter layout for modals: shorter face + controls beside it on sm+ */
  dense?: boolean;
}) {
  const t = useHabitTimer(habit, store, customDurationSecs);
  const toast = useToast();
  if (habit.archived) return null;

  const isStrictLocked = (() => {
    if (disabled) return true;
    if (!habit.strictWindow || !habit.windowStart || !habit.windowEnd) return false;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (currentTime < habit.windowStart || currentTime > habit.windowEnd) return true;
    return false;
  })();

  const maxReps = habit.maxDailyReps || Infinity;
  const todayCompletedLogs = store.habitLogs.filter(l => l.habitId === habit.id && l.date === today && l.completed);
  const todayReps = todayCompletedLogs.length;
  const todayTotalSecs = store.habitLogs
    .filter(l => l.habitId === habit.id && l.date === today)
    .reduce((sum, l) => sum + (l.duration ?? 0), 0);
  const allRepsDone = maxReps !== Infinity && todayReps >= maxReps;
  // For timer habits: block when earned reps reach maxReps
  const allTimerRepsDone = t.hasDuration && t.targetSecs > 0 && maxReps !== Infinity && t.earnedReps >= maxReps;
  const cantStart = isStrictLocked || allRepsDone || allTimerRepsDone;

  const notifyDisabled = () => {
    if (t.anotherRunning && t.blockingHabitName) {
      const habitLabel = isAr ? t.blockingHabitName.ar : t.blockingHabitName.en;
      const isPaused = t.blockingTimerState === 'paused';
      const stateLabel = isPaused
        ? (isAr ? 'متوقف مؤقتًا' : 'paused')
        : (isAr ? 'قيد التشغيل' : 'running');
      toast.notifyWarning(
        isAr ? `مؤقت "${habitLabel}" ${stateLabel}` : `"${habitLabel}" timer is ${stateLabel}`,
        isAr ? `أوقف أو أنهِ مؤقت "${habitLabel}" أولاً` : `Stop or finish the "${habitLabel}" timer first`
      );
    } else if (t.anotherRunning) {
      toast.notifyWarning(isAr ? 'مؤقت آخر نشط' : 'Another timer active', isAr ? 'أوقف المؤقت الحالي أولاً' : 'Stop the current timer first');
    } else if (allRepsDone) {
      toast.notifyInfo(isAr ? 'مكتمل اليوم ✓' : 'Completed today ✓', isAr ? 'لقد أكملت هذه العادة لهذا اليوم' : 'You have completed this habit for today');
    } else if (isStrictLocked) {
      if (habit.windowStart && habit.windowEnd) {
        toast.notifyWarning(isAr ? 'خارج وقت النافذة' : 'Outside time window', isAr ? `متاحة فقط من ${habit.windowStart} إلى ${habit.windowEnd}` : `Available only from ${habit.windowStart} to ${habit.windowEnd}`);
      } else {
        toast.notifyWarning(isAr ? 'غير متاح حالياً' : 'Not available now');
      }
    }
  };

  // Remaining uses the timer countdown duration (which may be custom)
  const countdownTotal = t.isMyTimer && t.activeTimerDuration > 0 ? t.activeTimerDuration : t.targetSecs;
  const remaining = t.hasDuration && t.isMyTimer ? Math.max(0, countdownTotal - t.elapsed) : 0;
  // Progress tracks toward the NEXT rep (not overall), resets after each completion
  const progress = t.hasDuration && t.targetSecs > 0 ? Math.min(1, t.progressTowardNext) : 0;

  // Large (md) layout — full visual block
  if (size === 'md') {
    return (
      <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
        {t.isMyTimer && (t.running || t.paused) && (() => {
          const mdHc = resolveHabitColor(habit.color);
          const mdSegs = 30;
          const mdFilled = Math.min(mdSegs, Math.round(progress * mdSegs));
          return (
            <div className="rounded-2xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${mdHc}18, ${mdHc}08)`, border: `1.5px solid ${mdHc}30` }}>
              <div className={cn('text-4xl font-mono font-black tracking-tight', t.running && 'animate-pulse')} style={{ color: mdHc }}>
                {t.hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(t.elapsed)}
              </div>
              {t.hasDuration && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-[2px]">
                    {Array.from({ length: mdSegs }).map((_, si) => (
                      <div key={si} className="flex-1 h-3.5 rounded-sm transition-all duration-300"
                        style={{ background: si < mdFilled ? mdHc : `${mdHc}12`, transitionDelay: `${si * 15}ms` }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] font-bold" style={{ color: `${mdHc}99` }}>
                    <span>{Math.round(progress * 100)}%</span>
                    <span>{formatTimerDuration(t.targetSecs)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        <div className="flex items-center gap-2">
          {!t.isMyTimer && (
            <button onClick={() => (t.anotherRunning || cantStart) ? notifyDisabled() : t.start()}
              className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all',
                (t.anotherRunning || cantStart) && 'opacity-40 cursor-not-allowed')}
              style={{ background: `linear-gradient(135deg, ${habit.color}, ${habit.color}cc)`, boxShadow: `0 4px 14px ${habit.color}33` }}>
              <Play className="h-5 w-5" /> {isAr ? 'ابدأ المؤقت' : 'Start Timer'}
            </button>
          )}
          {t.running && (
            <>
              <button onClick={() => t.pause()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-amber-500/15 text-amber-600 transition-all hover:bg-amber-500/25">
                <Pause className="h-5 w-5" /> {isAr ? 'إيقاف مؤقت' : 'Pause'}
              </button>
              <button onClick={() => t.stop(today, done)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-500/15 text-emerald-600 transition-all hover:bg-emerald-500/25">
                <Square className="h-5 w-5" /> {isAr ? 'إنهاء' : 'Stop'}
              </button>
            </>
          )}
          {t.paused && (
            <>
              <button onClick={() => t.resume()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: `${habit.color}18`, color: habit.color }}>
                <Play className="h-5 w-5" /> {isAr ? 'استئناف' : 'Resume'}
              </button>
              <button onClick={() => t.stop(today, done)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-500/15 text-emerald-600 transition-all hover:bg-emerald-500/25">
                <CheckCircle2 className="h-5 w-5" /> {isAr ? 'إنهاء' : 'Done'}
              </button>
              <button onClick={() => t.cancel()} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 transition-all hover:bg-red-500/20">
                <X className="h-5 w-5" />
              </button>
            </>
          )}
          {!t.isMyTimer && t.anotherRunning && !done && (
            <span className="text-xs font-medium text-amber-500">{t.blockingHabitName ? (isAr ? `مؤقت "${t.blockingHabitName.ar}" نشط` : `"${t.blockingHabitName.en}" timer active`) : (isAr ? 'مؤقت آخر نشط' : 'Another timer active')}</span>
          )}
        </div>
      </div>
    );
  }

  const hc = resolveHabitColor(habit.color);

  // XS layout — minimal inline
  if (size === 'xs') {
    const btnCls = 'py-1 px-1.5 text-[8px] rounded-md gap-1';
    const iconCls = 'h-2.5 w-2.5';
    return (
      <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
        {t.isMyTimer && (t.running || t.paused) && (
          <span className="text-[10px] font-mono font-bold" style={{ color: hc }}>
            {t.hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(t.elapsed)}
          </span>
        )}
        <div className="flex items-center gap-1">
          {!t.isMyTimer && <button onClick={() => (t.anotherRunning || cantStart) ? notifyDisabled() : t.start()} className={cn('flex items-center font-semibold text-white', btnCls, (t.anotherRunning || cantStart) && 'opacity-40 cursor-not-allowed')} style={{ background: hc }}><Play className={iconCls} /></button>}
          {t.running && <button onClick={() => t.pause()} className={cn('flex items-center font-semibold bg-amber-500/15 text-amber-600', btnCls)}><Pause className={iconCls} /></button>}
          {t.paused && <><button onClick={() => t.resume()} className={cn('flex items-center font-semibold', btnCls)} style={{ background: `${hc}15`, color: hc }}><Play className={iconCls} /></button><button onClick={() => t.cancel()} className={cn('flex items-center font-semibold bg-red-500/10 text-red-500', btnCls)}><X className={iconCls} /></button></>}
        </div>
      </div>
    );
  }

  // SM layout — always-visible professional timer for cards
  const pctText = t.hasDuration && t.targetSecs > 0 ? Math.round(progress * 100) : null;
  const isActive = t.isMyTimer && (t.running || t.paused);
  const isIdle = !isActive;
  const timerSegments = dense ? 10 : 20;
  const filledSegs = Math.min(timerSegments, Math.round(progress * timerSegments));

  // Per-rep status: done means at least 1 rep earned
  const cumulativeDone = t.earnedReps >= 1;
  const allTimerRepsComplete = allTimerRepsDone;
  const canDoMore = cumulativeDone && !allTimerRepsComplete && !allRepsDone;
  const statusLabel = t.running
    ? (isAr ? 'قيد التشغيل' : 'Running')
    : t.paused
      ? (isAr ? 'متوقف مؤقتًا' : 'Paused')
      : allTimerRepsComplete
        ? (isAr ? `مكتمل ${t.earnedReps}/${maxReps}` : `Done ${t.earnedReps}/${maxReps}`)
        : cumulativeDone
          ? (maxReps !== Infinity
            ? (isAr ? `${t.earnedReps}/${maxReps} مكتمل` : `${t.earnedReps}/${maxReps} done`)
            : (isAr ? `${t.earnedReps}x مكتمل` : `${t.earnedReps}x done`))
          : cantStart
            ? (isAr ? 'غير متاح' : 'Unavailable')
            : todayTotalSecs > 0
              ? (isAr ? `${fmtSecs(todayTotalSecs)} / ${fmtSecs(t.targetSecs)}` : `${fmtSecs(todayTotalSecs)} / ${fmtSecs(t.targetSecs)}`)
              : (isAr ? 'جاهز' : 'Ready');

  const statusDotColor = t.running ? '#22c55e' : t.paused ? '#f59e0b' : allTimerRepsComplete ? '#22c55e' : cumulativeDone ? '#3b82f6' : cantStart ? '#ef4444' : `${hc}60`;

  const displayTime = isActive
    ? (t.hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(t.elapsed))
    : canDoMore && t.hasDuration
      ? formatTimerDuration(t.targetSecs)
      : (t.hasDuration ? formatTimerDuration(t.targetSecs) : '00:00');

  const timerBg = t.running
    ? `linear-gradient(135deg, ${hc}15, ${hc}08)`
    : t.paused
      ? `linear-gradient(135deg, #f59e0b10, ${hc}06)`
      : allRepsDone
        ? 'linear-gradient(135deg, #22c55e08, #22c55e04)'
        : canDoMore
          ? 'linear-gradient(135deg, #3b82f608, #3b82f604)'
          : `linear-gradient(135deg, ${hc}06, transparent)`;

  const timerBorder = t.running ? `${hc}35` : t.paused ? '#f59e0b30' : allRepsDone ? '#22c55e25' : canDoMore ? '#3b82f625' : `${hc}15`;

  const btnPad = dense ? 'py-2 px-2.5 rounded-xl text-xs' : 'py-2.5 rounded-xl text-[11px]';
  const iconSz = dense ? 'h-4 w-4 shrink-0' : 'h-3.5 w-3.5 shrink-0';

  return (
    <div
      className={cn(dense ? 'flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2' : 'flex flex-col gap-2')}
      onClick={e => e.stopPropagation()}>
      <div
        className={cn(
          'hc-timer overflow-hidden relative transition-[box-shadow,border-color] duration-200 motion-safe:hover:shadow-md',
          dense ? 'flex-1 min-w-0 rounded-lg' : 'rounded-xl',
        )}
        style={{
          background: timerBg,
          border: `${dense ? '1px' : '1.5px'} solid ${timerBorder}`,
          ...(dense ? {} : { minHeight: isActive && t.hasCustomDuration ? 120 : 100 }),
        }}>
        {t.running && (
          <div className={cn('absolute inset-0 animate-pulse opacity-30', dense ? 'rounded-lg' : 'rounded-xl')} style={{ background: `radial-gradient(ellipse at center, ${hc}20, transparent 70%)` }} />
        )}
        <div className="relative p-2.5">
          <div className={cn('flex items-center justify-between', dense ? 'mb-1' : 'mb-1')}>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={cn('rounded-full shrink-0', dense ? 'h-1.5 w-1.5' : 'h-1.5 w-1.5')} style={{ background: statusDotColor, boxShadow: t.running ? `0 0 6px ${statusDotColor}` : undefined }} />
              <span className={cn('font-bold uppercase tracking-wide text-[var(--foreground)]/50 truncate', dense ? 'text-[10px] sm:text-xs' : 'text-[9px] tracking-wider')}>{statusLabel}</span>
            </div>
            <Timer className={dense ? 'h-3.5 w-3.5 shrink-0' : 'h-3 w-3'} style={{ color: isActive ? hc : `${hc}50` }} />
          </div>

          <div className={cn(
            'font-mono font-black tracking-tight text-center transition-all duration-300',
            dense ? 'text-base sm:text-lg leading-snug' : 'text-lg',
            t.running && !dense && 'scale-105',
            t.running && dense && 'scale-[1.02]',
            isIdle && !cumulativeDone && 'opacity-40',
          )} style={{ color: allTimerRepsComplete ? '#22c55e' : canDoMore ? '#3b82f6' : hc }}>
            {allTimerRepsComplete && !isActive ? (
              dense ? (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-black">{isAr ? 'مكتمل' : 'Done'}</span>
                  <span className="text-xs font-bold text-emerald-600/80 tabular-nums">{t.earnedReps}/{maxReps} · {fmtSecs(todayTotalSecs)}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">{isAr ? 'مكتمل' : 'Done'}</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600/60">{t.earnedReps}/{maxReps} — {fmtSecs(todayTotalSecs)}</span>
                </div>
              )
            ) : canDoMore && !isActive ? (
              dense ? (
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-sm">
                  <span className="font-black text-emerald-600">{t.earnedReps}x ✓</span>
                  <span className="text-xs text-[var(--foreground)]/55">{fmtSecs(todayTotalSecs)} · {isAr ? 'جلسة +' : 'next'}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm font-bold text-emerald-600">{t.earnedReps}x ✓</span>
                  <span className="text-[9px] opacity-60">{isAr ? `${fmtSecs(todayTotalSecs)} — ابدأ جلسة أخرى` : `${fmtSecs(todayTotalSecs)} — start next`}</span>
                </div>
              )
            ) : displayTime}
          </div>

          {isIdle && t.hasDuration && !allTimerRepsComplete && !canDoMore && (
            <div className={cn('text-center', dense ? 'mt-0.5' : 'mt-0.5')}>
              <span className={cn('font-semibold text-[var(--foreground)]/45', dense ? 'text-xs leading-snug' : 'text-[9px]')}>
                {isAr ? `الهدف: ${formatDurationSecs(habit.expectedDuration!)}` : `Target: ${formatDurationSecs(habit.expectedDuration!)}`}
                {todayTotalSecs > 0 && ` — ${fmtSecs(todayTotalSecs)} ${isAr ? 'إجمالي' : 'done'}`}
              </span>
            </div>
          )}

          {t.hasDuration && (
            <div className={dense ? 'mt-1' : 'mt-2'}>
              <div className="flex items-center justify-between gap-1 mb-0.5">
                {isActive && (
                  <span className={cn('font-bold truncate', dense ? 'text-xs' : 'text-[9px]')} style={{ color: `${hc}80` }}>
                    {fmtSecs(Math.floor(t.cumulativeWithCurrent % t.targetSecs))} / {fmtSecs(t.targetSecs)}
                    {t.todayCumulativeSecs > 0 && <span className="text-[var(--foreground)]/40"> ({isAr ? 'Σ' : 'Σ'}{fmtSecs(Math.floor(t.cumulativeWithCurrent))})</span>}
                  </span>
                )}
                {!isActive && todayTotalSecs > 0 && (
                  <span className={cn('font-bold truncate', dense ? 'text-xs' : 'text-[9px]')} style={{ color: `${hc}80` }}>
                    {fmtSecs(todayTotalSecs % t.targetSecs)} / {fmtSecs(t.targetSecs)}
                    {t.earnedReps > 0 && <span className="text-emerald-600"> ({t.earnedReps}x✓)</span>}
                  </span>
                )}
                {!isActive && todayTotalSecs === 0 && (
                  <span className={cn('font-bold text-[var(--foreground)]/35', dense ? 'text-xs' : 'text-[9px]')}>
                    0 / {formatTimerDuration(t.targetSecs)}
                  </span>
                )}
                <span className={cn('font-black tabular-nums shrink-0', dense ? 'text-xs' : 'text-[10px]')} style={{ color: isActive ? hc : allTimerRepsComplete ? '#22c55e' : canDoMore ? '#3b82f6' : `${hc}40` }}>
                  {pctText != null ? `${pctText}%` : allTimerRepsComplete ? '100%' : todayTotalSecs > 0 ? `${Math.round(progress * 100)}%` : '0%'}
                </span>
              </div>
              <div className="flex gap-px sm:gap-[2px]">
                {Array.from({ length: timerSegments }).map((_, si) => (
                  <div key={si} className="flex-1 h-1.5 rounded-sm transition-all duration-300"
                    style={{
                      background: allTimerRepsComplete && !isActive
                        ? '#22c55e'
                        : si < filledSegs ? hc : `${hc}10`,
                      transitionDelay: isActive ? `${si * 15}ms` : '0ms',
                    }} />
                ))}
              </div>
            </div>
          )}

          {!t.hasDuration && isActive && (
            <div className="mt-0.5 text-center">
              <span className={cn('font-bold', dense ? 'text-xs' : 'text-[9px]')} style={{ color: `${hc}80` }}>
                {Math.floor(t.elapsed / 60)} {isAr ? 'د' : 'm'} {Math.floor(t.elapsed % 60).toString().padStart(2, '0')} {isAr ? 'ث' : 's'}
              </span>
            </div>
          )}

          {isActive && t.earnedRepsWithCurrent >= 1 && (
            <div className={cn('flex items-center justify-center gap-1', dense ? 'mt-1' : 'mt-1')}>
              <CheckCircle2 className={cn('text-emerald-500 shrink-0', dense ? 'h-3.5 w-3.5' : 'h-3 w-3')} />
              <span className={cn('font-black text-emerald-600', dense ? 'text-xs' : 'text-[9px]')}>
                {t.earnedRepsWithCurrent}x ✓ · {fmtSecs(Math.floor(t.cumulativeWithCurrent))}
              </span>
            </div>
          )}

          {isActive && t.hasCustomDuration && !cumulativeDone && (
            <div className={dense ? 'mt-1 text-center' : 'mt-1 text-center'}>
              <span className={cn('font-medium text-[var(--foreground)]/45', dense ? 'text-[11px] sm:text-xs block leading-snug' : 'text-[8px]')}>
                {isAr ? `هدف ${formatDurationSecs(t.targetSecs)} · عد ${formatDurationSecs(countdownTotal)}` : `${formatDurationSecs(t.targetSecs)} tgt · ${formatDurationSecs(countdownTotal)} cd`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={cn(
        'flex items-stretch',
        dense ? 'w-full flex-row flex-wrap gap-1 sm:w-auto sm:min-w-[6.75rem] sm:flex-col sm:flex-nowrap sm:justify-center' : 'gap-2 min-h-[36px]',
      )}>
        {!t.isMyTimer && (
          <button onClick={() => (t.anotherRunning || cantStart) ? notifyDisabled() : t.start()}
            className={cn(
              'flex items-center justify-center gap-1 font-bold text-white border transition-all duration-200 ease-out',
              btnPad,
              dense ? 'flex-1 min-w-[5.5rem] sm:flex-none sm:w-full' : 'flex-1 gap-1.5',
              'motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:hover:brightness-110 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]',
              (t.anotherRunning || cantStart) && 'opacity-40 cursor-not-allowed motion-safe:hover:translate-y-0 motion-safe:hover:shadow-none motion-safe:hover:brightness-100',
            )}
            style={{
              background: `linear-gradient(135deg, ${hc}, ${hc}cc)`,
              borderColor: `${hc}55`,
              boxShadow: dense ? `0 1px 6px -1px ${hc}50` : `0 2px 10px -2px ${hc}55`,
            }}>
            <Play className={iconSz} /> {cantStart ? (isAr ? 'غير متاح' : 'Unavailable') : (isAr ? 'ابدأ' : 'Start')}
          </button>
        )}
        {t.running && (
          <>
            <button onClick={() => t.pause()}
              className={cn(
                'flex items-center justify-center gap-1 font-bold border border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-400 transition-all duration-200 ease-out',
                btnPad,
                dense ? 'flex-1 min-w-[4.5rem] sm:flex-none sm:w-full' : 'flex-1 gap-1.5',
                'motion-safe:hover:bg-amber-500/22 motion-safe:hover:border-amber-500/40 motion-safe:hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/35 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]',
              )}>
              <Pause className={iconSz} /> {isAr ? 'إيقاف' : 'Pause'}
            </button>
            <button onClick={() => t.stop(today, done)}
              className={cn(
                'flex items-center justify-center gap-1 font-bold border border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 transition-all duration-200 ease-out',
                btnPad,
                dense ? 'flex-1 min-w-[4.5rem] sm:flex-none sm:w-full' : 'flex-1 gap-1.5',
                'motion-safe:hover:bg-emerald-500/22 motion-safe:hover:border-emerald-500/40 motion-safe:hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]',
              )}>
              <Square className={iconSz} /> {isAr ? 'إنهاء' : 'Stop'}
            </button>
          </>
        )}
        {t.paused && (
          <>
            <button onClick={() => t.resume()}
              className={cn(
                'flex items-center justify-center gap-1 font-bold border transition-all duration-200 ease-out',
                btnPad,
                dense ? 'flex-1 min-w-[4.5rem] sm:flex-none sm:w-full' : 'flex-1 gap-1.5',
                'motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md motion-safe:hover:brightness-110 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]',
              )}
              style={{ background: `${hc}18`, color: hc, borderColor: `${hc}40`, boxShadow: dense ? `0 1px 5px -1px ${hc}40` : `0 2px 8px -2px ${hc}44` }}>
              <Play className={iconSz} /> {isAr ? 'استئناف' : 'Resume'}
            </button>
            <button onClick={() => t.stop(today, done)}
              className={cn(
                'flex items-center justify-center gap-1 font-bold border border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 transition-all duration-200 ease-out',
                btnPad,
                dense ? 'flex-1 min-w-[4.5rem] sm:flex-none sm:w-full' : 'flex-1 gap-1.5',
                'motion-safe:hover:bg-emerald-500/22 motion-safe:hover:border-emerald-500/40 motion-safe:hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]',
              )}>
              <CheckCircle2 className={iconSz} /> {isAr ? 'إنهاء' : 'Done'}
            </button>
            <button onClick={() => t.cancel()}
              className={cn(
                'flex items-center justify-center gap-0.5 font-bold border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 transition-all duration-200',
                dense ? 'px-2.5 py-2 rounded-xl text-xs sm:w-full' : 'gap-1 py-2.5 px-3 rounded-xl text-[11px]',
                'motion-safe:hover:bg-red-500/18 motion-safe:hover:border-red-500/35 motion-safe:hover:shadow-md motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]',
              )}>
              <X className={iconSz} />
            </button>
          </>
        )}
        {!t.isMyTimer && t.anotherRunning && !done && (
          <span className={cn('font-bold text-amber-500 w-full', dense ? 'text-xs leading-snug py-0.5' : 'text-[11px]')}>{t.blockingHabitName ? (isAr ? `مؤقت "${t.blockingHabitName.ar}" نشط` : `"${t.blockingHabitName.en}" timer active`) : (isAr ? 'مؤقت آخر نشط' : 'Another timer active')}</span>
        )}
      </div>
    </div>
  );
}
