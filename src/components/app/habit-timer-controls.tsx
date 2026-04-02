'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useToast } from '@/components/app/toast-notifications';
import { Habit, formatTimerDuration, resolveHabitColor, computeTimerElapsed, computeTimerRemaining, todayString } from '@/types/app';
import { useTimerDisplay } from '@/lib/use-timer-display';
import { Play, Pause, Square, Timer, X, CheckCircle2 } from 'lucide-react';

// Per-habit timer state & actions
export function useHabitTimer(habit: Habit, store: ReturnType<typeof useAppStore>) {
  const active = store.activeTimer;
  // Session lookup (fallback for old data without habitId on ActiveTimer, and for cancel/stop logging)
  const currentSession = active ? store.timerSessions.find(t => t.id === active.sessionId) : null;
  // Prefer ActiveTimer.habitId, fall back to session lookup for backward compat
  const activeHabitId = active?.habitId ?? (currentSession?.type === 'habit-linked' ? currentSession.habitId ?? null : null);
  const isMyTimer = !!activeHabitId && activeHabitId === habit.id;
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
  const targetSecs = hasDuration ? habit.expectedDuration! * 60 : 0;

  const start = () => {
    if (anotherRunning) return;
    if (habit.strictWindow && habit.windowStart && habit.windowEnd) {
      const now = new Date();
      const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (ct < habit.windowStart || ct > habit.windowEnd) return;
    }
    store.startTimer({
      type: 'habit-linked', mode: hasDuration ? 'countdown' : 'stopwatch',
      habitId: habit.id, labelEn: habit.nameEn, labelAr: habit.nameAr,
      startedAt: new Date().toISOString(), duration: 0,
      targetDuration: hasDuration ? targetSecs : undefined,
    });
  };
  const pause = () => store.pauseTimer();
  const resume = () => store.resumeTimer();
  const cancel = () => {
    if (currentSession && elapsed > 0 && !habit.archived) {
      const today = todayString();
      const durationMin = Math.max(1, Math.round(elapsed / 60));
      store.logHabit({
        habitId: habit.id, date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: durationMin,
        note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: false,
        source: 'timer',
      });
    }
    store.cancelTimer();
  };
  const stop = (today: string, done: boolean) => {
    if (!currentSession) return;
    const secs = elapsed;
    if (secs > 0 && !habit.archived) {
      const durationMin = Math.max(1, Math.round(secs / 60));
      const isCompleted = hasDuration ? (secs >= targetSecs) : !done;
      store.logHabit({
        habitId: habit.id, date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: durationMin,
        note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: isCompleted,
        source: 'timer',
      });
    }
    store.completeTimer(currentSession.id);
  };

  return { isMyTimer, anotherRunning, running, paused, elapsed, targetSecs, hasDuration, blockingHabitName, blockingTimerState, start, pause, resume, cancel, stop };
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
export function HabitTimerControls({ habit, isAr, store, today, done, size = 'sm', disabled = false }: {
  habit: Habit; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string; done: boolean; size?: 'sm' | 'xs' | 'md'; disabled?: boolean;
}) {
  const t = useHabitTimer(habit, store);
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
  const todayReps = store.habitLogs.filter(l => l.habitId === habit.id && l.date === today && l.completed).length;
  const allRepsDone = maxReps !== Infinity && todayReps >= maxReps;
  const cantStart = isStrictLocked || allRepsDone;

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

  const remaining = t.hasDuration && t.isMyTimer ? Math.max(0, t.targetSecs - t.elapsed) : 0;
  const progress = t.hasDuration && t.isMyTimer && t.targetSecs > 0 ? Math.min(1, t.elapsed / t.targetSecs) : 0;

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
              {!t.hasDuration && (
                <button onClick={() => t.stop(today, done)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-500/15 text-emerald-600 transition-all hover:bg-emerald-500/25">
                  <Square className="h-5 w-5" /> {isAr ? 'إنهاء' : 'Stop'}
                </button>
              )}
            </>
          )}
          {t.paused && (
            <>
              <button onClick={() => t.resume()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: `${habit.color}18`, color: habit.color }}>
                <Play className="h-5 w-5" /> {isAr ? 'استئناف' : 'Resume'}
              </button>
              {!t.hasDuration && (
                <button onClick={() => t.stop(today, done)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-500/15 text-emerald-600 transition-all hover:bg-emerald-500/25">
                  <CheckCircle2 className="h-5 w-5" /> {isAr ? 'إنهاء' : 'Done'}
                </button>
              )}
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
  const timerSegments = 20;
  const filledSegs = Math.min(timerSegments, Math.round(progress * timerSegments));

  const statusLabel = t.running
    ? (isAr ? 'قيد التشغيل' : 'Running')
    : t.paused
      ? (isAr ? 'متوقف مؤقتًا' : 'Paused')
      : done || allRepsDone
        ? (isAr ? 'مكتمل' : 'Completed')
        : cantStart
          ? (isAr ? 'غير متاح' : 'Unavailable')
          : (isAr ? 'جاهز' : 'Ready');

  const statusDotColor = t.running ? '#22c55e' : t.paused ? '#f59e0b' : (done || allRepsDone) ? '#22c55e' : cantStart ? '#ef4444' : `${hc}60`;

  const displayTime = isActive
    ? (t.hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(t.elapsed))
    : (t.hasDuration ? formatTimerDuration(t.targetSecs) : '00:00');

  const timerBg = t.running
    ? `linear-gradient(135deg, ${hc}15, ${hc}08)`
    : t.paused
      ? `linear-gradient(135deg, #f59e0b10, ${hc}06)`
      : (done || allRepsDone)
        ? 'linear-gradient(135deg, #22c55e08, #22c55e04)'
        : `linear-gradient(135deg, ${hc}06, transparent)`;

  const timerBorder = t.running ? `${hc}35` : t.paused ? '#f59e0b30' : (done || allRepsDone) ? '#22c55e25' : `${hc}15`;

  return (
    <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
      <div className="hc-timer rounded-xl overflow-hidden relative h-[100px]" style={{ background: timerBg, border: `1.5px solid ${timerBorder}` }}>
        {t.running && (
          <div className="absolute inset-0 rounded-xl animate-pulse opacity-30" style={{ background: `radial-gradient(ellipse at center, ${hc}20, transparent 70%)` }} />
        )}
        <div className="relative p-2.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: statusDotColor, boxShadow: t.running ? `0 0 6px ${statusDotColor}` : undefined }} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground)]/50">{statusLabel}</span>
            </div>
            <Timer className="h-3 w-3" style={{ color: isActive ? hc : `${hc}50` }} />
          </div>

          <div className={cn(
            'text-lg font-mono font-black tracking-tight text-center transition-all duration-300',
            t.running && 'scale-105',
            isIdle && !done && !allRepsDone && 'opacity-40',
          )} style={{ color: (done || allRepsDone) ? '#22c55e' : hc }}>
            {(done || allRepsDone) && !isActive ? (
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">{isAr ? 'مكتمل' : 'Done'}</span>
              </div>
            ) : displayTime}
          </div>

          {isIdle && t.hasDuration && !done && !allRepsDone && (
            <div className="text-center mt-0.5">
              <span className="text-[9px] font-semibold text-[var(--foreground)]/40">
                {isAr ? `الهدف: ${habit.expectedDuration} دقيقة` : `Target: ${habit.expectedDuration} min`}
              </span>
            </div>
          )}

          {t.hasDuration && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-0.5">
                {isActive && (
                  <span className="text-[9px] font-bold" style={{ color: `${hc}80` }}>
                    {formatTimerDuration(t.elapsed)} / {formatTimerDuration(t.targetSecs)}
                  </span>
                )}
                {!isActive && (
                  <span className="text-[9px] font-bold text-[var(--foreground)]/30">
                    0:00 / {formatTimerDuration(t.targetSecs)}
                  </span>
                )}
                <span className="text-[10px] font-black" style={{ color: isActive ? hc : `${hc}40` }}>
                  {isActive ? `${pctText}%` : (done || allRepsDone) ? '100%' : '0%'}
                </span>
              </div>
              <div className="flex gap-[2px]">
                {Array.from({ length: timerSegments }).map((_, si) => (
                  <div key={si} className="flex-1 h-1.5 rounded-sm transition-all duration-300"
                    style={{
                      background: (done || allRepsDone) && !isActive
                        ? (si < timerSegments ? '#22c55e' : '#22c55e12')
                        : si < filledSegs ? hc : `${hc}10`,
                      transitionDelay: isActive ? `${si * 20}ms` : '0ms',
                    }} />
                ))}
              </div>
            </div>
          )}

          {!t.hasDuration && isActive && (
            <div className="mt-1 text-center">
              <span className="text-[9px] font-bold" style={{ color: `${hc}80` }}>
                {Math.floor(t.elapsed / 60)} {isAr ? 'دقيقة' : 'min'} {Math.floor(t.elapsed % 60).toString().padStart(2, '0')} {isAr ? 'ثانية' : 'sec'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 h-[32px]">
        {!t.isMyTimer && (
          <button onClick={() => (t.anotherRunning || cantStart) ? notifyDisabled() : t.start()}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white transition-all active:scale-95',
              (t.anotherRunning || cantStart) && 'opacity-40 cursor-not-allowed')}
            style={{ background: `linear-gradient(135deg, ${hc}, ${hc}cc)` }}>
            <Play className="h-3.5 w-3.5" /> {cantStart ? (isAr ? 'غير متاح' : 'Unavailable') : (isAr ? 'ابدأ' : 'Start')}
          </button>
        )}
        {t.running && (
          <>
            <button onClick={() => t.pause()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-600 transition-all active:scale-95">
              <Pause className="h-3.5 w-3.5" /> {isAr ? 'إيقاف' : 'Pause'}
            </button>
            {!t.hasDuration && (
              <button onClick={() => t.stop(today, done)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-600 transition-all active:scale-95">
                <Square className="h-3.5 w-3.5" /> {isAr ? 'إنهاء' : 'Stop'}
              </button>
            )}
          </>
        )}
        {t.paused && (
          <>
            <button onClick={() => t.resume()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all active:scale-95"
              style={{ background: `${hc}15`, color: hc }}>
              <Play className="h-3.5 w-3.5" /> {isAr ? 'استئناف' : 'Resume'}
            </button>
            {!t.hasDuration && (
              <button onClick={() => t.stop(today, done)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-600 transition-all active:scale-95">
                <CheckCircle2 className="h-3.5 w-3.5" /> {isAr ? 'إنهاء' : 'Done'}
              </button>
            )}
            <button onClick={() => t.cancel()}
              className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-500 transition-all active:scale-95">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {!t.isMyTimer && t.anotherRunning && !done && (
          <span className="text-[11px] font-bold text-amber-500">{t.blockingHabitName ? (isAr ? `مؤقت "${t.blockingHabitName.ar}" نشط` : `"${t.blockingHabitName.en}" timer active`) : (isAr ? 'مؤقت آخر نشط' : 'Another timer active')}</span>
        )}
      </div>
    </div>
  );
}
