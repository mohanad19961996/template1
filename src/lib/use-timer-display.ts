'use client';

import { useState, useEffect } from 'react';
import { ActiveTimer, computeTimerElapsed, computeTimerRemaining } from '@/types/app';

/**
 * Hook that returns computed timer values, refreshing every second when running.
 * The interval is ONLY for re-rendering — it never mutates timer state.
 * All values are derived from absolute timestamps stored in ActiveTimer.
 */
export function useTimerDisplay(active: ActiveTimer | null) {
  const [now, setNow] = useState(Date.now());

  const isRunning = active?.state === 'running';

  useEffect(() => {
    if (!isRunning) return;
    // Immediately sync to current time
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const elapsed = computeTimerElapsed(active, now);
  const remaining = computeTimerRemaining(active, now);
  const target = active?.targetDuration ?? 0;
  const progress = target > 0 ? Math.min(100, (elapsed / target) * 100) : 0;
  const displayTime = active?.mode === 'stopwatch' || !target ? elapsed : remaining;

  return { elapsed, remaining, progress, displayTime, now };
}
