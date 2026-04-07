'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Habit, ActiveTimer, formatTimerDuration, resolveHabitColor, todayString } from '@/types/app';
import { useTimerDisplay } from '@/lib/use-timer-display';
import { HabitTimerControls } from '@/components/app/habit-timer-controls';
import { useAppStore } from '@/stores/app-store';

function ActiveTimerBanner({ store, isAr, today, onDetail }: {
  store: ReturnType<typeof useAppStore>; isAr: boolean; today: string; onDetail: (h: Habit) => void;
}) {
  const active = store.activeTimer;
  const { elapsed } = useTimerDisplay(active && active.state !== 'completed' ? active : null);
  if (!active || active.state === 'completed') return null;

  const habitId = active.habitId;
  const habit = habitId ? store.habits.find(h => h.id === habitId) : null;
  const habitName = habit ? (isAr ? habit.nameAr : habit.nameEn) : (isAr ? active.labelAr : active.labelEn) || '';
  const hc = habit ? resolveHabitColor(habit.color) : 'var(--color-primary)';
  const isPaused = active.state === 'paused';
  const isRunning = active.state === 'running';
  const hasDuration = !!active.targetDuration;
  const targetSecs = active.targetDuration ?? 0;
  const remaining = hasDuration ? Math.max(0, targetSecs - elapsed) : 0;
  const progress = hasDuration && targetSecs > 0 ? Math.min(1, elapsed / targetSecs) : 0;
  const displayTime = hasDuration ? formatTimerDuration(remaining) : formatTimerDuration(elapsed);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      className="sticky top-[85px] z-[190] mb-4 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl"
      style={{ background: `linear-gradient(135deg, ${hc}15, rgba(var(--color-background-rgb, 255 255 255) / 0.85))`, border: `1.5px solid ${hc}30` }}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Pulsing indicator */}
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${hc}20` }}>
            <Timer className={cn('h-5 w-5', isRunning && 'animate-pulse')} style={{ color: hc }} />
          </div>
          <div className="absolute -top-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900"
            style={{ background: isRunning ? '#22c55e' : '#f59e0b' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => habit && onDetail(habit)}>
          <p className="text-sm font-bold truncate">{habitName}</p>
          <p className="text-[10px] font-semibold" style={{ color: hc }}>
            {isPaused ? (isAr ? 'متوقف مؤقتًا' : 'Paused') : (isAr ? 'قيد التشغيل' : 'Running')}
            {hasDuration && ` · ${Math.round(progress * 100)}%`}
          </p>
        </div>

        {/* Live time */}
        <div className={cn('text-xl font-mono font-black tracking-tight', isRunning && 'animate-pulse')} style={{ color: hc }}>
          {displayTime}
        </div>

        {/* Controls */}
        {habit && (
          <div className="shrink-0" onClick={e => e.stopPropagation()}>
            <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={false} size="xs" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {hasDuration && (
        <div className="h-1 w-full" style={{ background: `${hc}10` }}>
          <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${progress * 100}%`, background: hc }} />
        </div>
      )}
    </motion.div>
  );
}

export default ActiveTimerBanner;
