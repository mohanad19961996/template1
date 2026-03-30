'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { Habit, formatTimerDuration, resolveHabitColor } from '@/types/app';
import { Play, Pause, Square, Timer, X, CheckCircle2 } from 'lucide-react';

// Per-habit timer state & actions
export function useHabitTimer(habit: Habit, store: ReturnType<typeof useAppStore>) {
  const active = store.activeTimer;
  const currentSession = active ? store.timerSessions.find(t => t.id === active.sessionId) : null;
  const activeHabitId = currentSession?.type === 'habit-linked' ? currentSession.habitId ?? null : null;
  const isMyTimer = activeHabitId === habit.id;
  const hasActiveTimer = !!active && active.state !== 'completed';
  const anotherRunning = hasActiveTimer && !isMyTimer;
  const running = isMyTimer && active?.state === 'running';
  const paused = isMyTimer && active?.state === 'paused';
  const elapsed = isMyTimer ? (active?.elapsed ?? 0) : 0;
  const hasDuration = !!habit.expectedDuration;
  const targetSecs = hasDuration ? habit.expectedDuration! * 60 : 0;

  const start = () => {
    if (anotherRunning) return;
    // Check strict window
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
  const pause = () => store.updateActiveTimer({ state: 'paused', runningStartedAt: undefined });
  const resume = () => store.updateActiveTimer({ state: 'running', runningStartedAt: new Date().toISOString() });
  const cancel = () => store.cancelTimer();
  const stop = (today: string, done: boolean) => {
    if (!currentSession) return;
    const secs = elapsed;
    if (secs > 0 && !done && !habit.archived) {
      const durationMin = hasDuration ? (habit.expectedDuration ?? Math.max(1, Math.round(secs / 60))) : Math.max(1, Math.round(secs / 60));
      store.logHabit({
        habitId: habit.id, date: today,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: durationMin,
        note: '', reminderUsed: false, perceivedDifficulty: 'medium', completed: true,
        source: 'timer',
      });
    }
    store.completeTimer(currentSession.id);
  };

  return { isMyTimer, anotherRunning, running, paused, elapsed, targetSecs, hasDuration, start, pause, resume, cancel, stop };
}

// Global timer state — for auto-complete logic
export function useStoreHabitTimer(store: ReturnType<typeof useAppStore>) {
  const active = store.activeTimer;
  const currentSession = active ? store.timerSessions.find(t => t.id === active.sessionId) : null;
  const activeHabitId = currentSession?.type === 'habit-linked' ? currentSession.habitId ?? null : null;
  const running = active?.state === 'running';
  const paused = active?.state === 'paused';
  const elapsed = active?.elapsed ?? 0;
  const hasActiveTimer = !!active && active.state !== 'completed';

  return { activeHabitId, running, paused, elapsed, hasActiveTimer, currentSession };
}

// Compact timer controls — reusable across all views
export function HabitTimerControls({ habit, isAr, store, today, done, size = 'sm', disabled = false }: {
  habit: Habit; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string; done: boolean; size?: 'sm' | 'xs' | 'md'; disabled?: boolean;
}) {
  const t = useHabitTimer(habit, store);
  if (habit.archived) return null;

  // Check strict time window
  const isStrictLocked = (() => {
    if (disabled) return true;
    if (!habit.strictWindow || !habit.windowStart || !habit.windowEnd) return false;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    // Outside window entirely
    if (currentTime < habit.windowStart || currentTime > habit.windowEnd) return true;
    return false;
  })();

  // Check max daily reps
  const maxReps = habit.maxDailyReps || 1;
  const todayReps = store.habitLogs.filter(l => l.habitId === habit.id && l.date === today && l.completed).length;
  const allRepsDone = todayReps >= maxReps;

  // If locked or all reps done, don't show start button (but still show if timer is already running)
  const cantStart = isStrictLocked || allRepsDone;

  const remaining = t.hasDuration && t.isMyTimer ? Math.max(0, t.targetSecs - t.elapsed) : 0;
  const progress = t.hasDuration && t.isMyTimer && t.targetSecs > 0 ? Math.min(1, t.elapsed / t.targetSecs) : 0;

  // Large (md) layout — full visual block
  if (size === 'md') {
    return (
      <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
        {/* Active timer display */}
        {t.isMyTimer && (t.running || t.paused) && (() => {
          const mdHc = resolveHabitColor(habit.color);
          const mdSegs = 30;
          const mdFilled = Math.min(mdSegs, Math.round(progress * mdSegs));
          return (
            <div className="rounded-2xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${mdHc}18, ${mdHc}08)`, border: `1.5px solid ${mdHc}30` }}>
              {/* Big time */}
              <div className={cn('text-4xl font-mono font-black tracking-tight', t.running && 'animate-pulse')} style={{ color: mdHc }}>
                {t.hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(t.elapsed)}
              </div>
              {/* Segmented progress bar */}
              {t.hasDuration && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-[2px]">
                    {Array.from({ length: mdSegs }).map((_, si) => (
                      <div key={si} className="flex-1 h-3.5 rounded-sm transition-all duration-300"
                        style={{
                          background: si < mdFilled ? mdHc : `${mdHc}12`,
                          transitionDelay: `${si * 15}ms`,
                        }} />
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
        {/* Buttons */}
        <div className="flex items-center gap-2">
          {!t.isMyTimer && (
            <button onClick={() => !cantStart && t.start()} disabled={t.anotherRunning || cantStart}
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
            <span className="text-xs font-medium text-amber-500">{isAr ? 'مؤقت آخر نشط' : 'Another timer active'}</span>
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
          {!t.isMyTimer && <button onClick={() => !cantStart && t.start()} disabled={t.anotherRunning || cantStart} className={cn('flex items-center font-semibold text-white', btnCls, (t.anotherRunning || cantStart) && 'opacity-40 cursor-not-allowed')} style={{ background: hc }}><Play className={iconCls} /></button>}
          {t.running && <button onClick={() => t.pause()} className={cn('flex items-center font-semibold bg-amber-500/15 text-amber-600', btnCls)}><Pause className={iconCls} /></button>}
          {t.paused && <><button onClick={() => t.resume()} className={cn('flex items-center font-semibold', btnCls)} style={{ background: `${hc}15`, color: hc }}><Play className={iconCls} /></button><button onClick={() => t.cancel()} className={cn('flex items-center font-semibold bg-red-500/10 text-red-500', btnCls)}><X className={iconCls} /></button></>}
        </div>
      </div>
    );
  }

  // SM layout — bigger, professional, for cards
  const pctText = t.hasDuration && t.targetSecs > 0 ? Math.round(progress * 100) : null;

  return (
    <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
      {/* Timer display when active */}
      {t.isMyTimer && (t.running || t.paused) && (() => {
        const timerSegments = 20;
        const filledSegs = Math.min(timerSegments, Math.round(progress * timerSegments));
        return (
          <div className="rounded-xl p-3.5" style={{ background: `${hc}08`, border: `1.5px solid ${hc}20` }}>
            {/* Big time display */}
            <div className={cn('text-3xl font-mono font-black tracking-tight text-center', t.running && 'animate-pulse')} style={{ color: hc }}>
              {t.hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(t.elapsed)}
            </div>
            {/* Segmented progress bar for countdown */}
            {t.hasDuration && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[var(--foreground)]/70">{t.running ? (isAr ? 'قيد التشغيل' : 'Running') : (isAr ? 'متوقف مؤقتًا' : 'Paused')}</span>
                  <span className="text-sm font-black" style={{ color: hc }}>{pctText}%</span>
                </div>
                <div className="flex gap-[2px]">
                  {Array.from({ length: timerSegments }).map((_, si) => (
                    <div key={si} className="flex-1 h-3 rounded-sm transition-all duration-300"
                      style={{
                        background: si < filledSegs ? hc : `${hc}12`,
                        transitionDelay: `${si * 20}ms`,
                      }} />
                  ))}
                </div>
              </div>
            )}
            {/* Stopwatch: elapsed minutes display */}
            {!t.hasDuration && (
              <div className="mt-2 text-center">
                <span className="text-xs font-bold text-[var(--foreground)]/70">{t.running ? (isAr ? 'قيد التشغيل...' : 'Running...') : (isAr ? 'متوقف مؤقتًا' : 'Paused')}</span>
                <span className="text-xs font-bold ms-2" style={{ color: hc }}>{Math.floor(t.elapsed / 60)} {isAr ? 'دقيقة' : 'min'}</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Buttons */}
      <div className="flex items-center gap-1.5">
        {!t.isMyTimer && (
          <button onClick={() => !cantStart && t.start()}
            disabled={t.anotherRunning || cantStart}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95',
              (t.anotherRunning || cantStart) && 'opacity-40 cursor-not-allowed')}
            style={{ background: `linear-gradient(135deg, ${hc}, ${hc}cc)` }}>
            <Play className="h-4 w-4" /> {cantStart ? (isAr ? 'غير متاح' : 'Unavailable') : (isAr ? 'ابدأ' : 'Start')}
          </button>
        )}
        {t.running && (
          <>
            <button onClick={() => t.pause()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 transition-all active:scale-95">
              <Pause className="h-4 w-4" /> {isAr ? 'إيقاف' : 'Pause'}
            </button>
            {!t.hasDuration && (
              <button onClick={() => t.stop(today, done)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 transition-all active:scale-95">
                <Square className="h-4 w-4" /> {isAr ? 'إنهاء' : 'Stop'}
              </button>
            )}
          </>
        )}
        {t.paused && (
          <>
            <button onClick={() => t.resume()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ background: `${hc}15`, color: hc }}>
              <Play className="h-4 w-4" /> {isAr ? 'استئناف' : 'Resume'}
            </button>
            {!t.hasDuration && (
              <button onClick={() => t.stop(today, done)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 transition-all active:scale-95">
                <CheckCircle2 className="h-4 w-4" /> {isAr ? 'إنهاء' : 'Done'}
              </button>
            )}
            <button onClick={() => t.cancel()}
              className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 transition-all active:scale-95">
              <X className="h-4 w-4" />
            </button>
          </>
        )}
        {!t.isMyTimer && t.anotherRunning && !done && (
          <span className="text-xs font-bold text-amber-500">{isAr ? 'مؤقت آخر نشط' : 'Another timer active'}</span>
        )}
      </div>
    </div>
  );
}
