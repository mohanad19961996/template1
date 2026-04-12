'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Habit, HabitLog } from '@/types/app';
import { formatDurationSecs, todayString } from '@/types/app';
import { to12h } from './habit-constants';
import { Check, Clock, Timer, X, Circle, Hash, ListChecks } from 'lucide-react';

interface DayDetailsTooltipProps {
  habit: Habit;
  dateStr: string;
  logs: HabitLog[];
  isAr: boolean;
  children: React.ReactNode;
}

export default function DayDetailsTooltip({ habit, dateStr, logs, isAr, children }: DayDetailsTooltipProps) {
  const [show, setShow] = useState(false);
  const today = todayString();
  const dayLogs = logs.filter(l => l.habitId === habit.id && l.date === dateStr);
  const isFuture = dateStr > today;
  const isToday = dateStr === today;

  if (dayLogs.length === 0 && !isToday) {
    return <>{children}</>;
  }

  const completedLogs = dayLogs.filter(l => l.completed);
  const timerLogs = dayLogs.filter(l => l.source === 'timer' && (l.duration ?? 0) > 0);
  const totalDuration = dayLogs.reduce((s, l) => s + (l.duration ?? 0), 0);
  const trackingType = habit.trackingType ?? (habit.expectedDuration ? 'timer' : 'boolean');

  // Format date label
  const dateLabel = (() => {
    if (isToday) return isAr ? 'اليوم' : 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  })();

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {show && dayLogs.length > 0 && (
        <div
          className="absolute z-50 bottom-full mb-1.5 start-1/2 -translate-x-1/2 w-52 pointer-events-none"
          style={{ direction: isAr ? 'rtl' : 'ltr' }}
        >
          <div
            className="rounded-xl p-2.5 text-start"
            style={{
              background: 'var(--color-card)',
              border: '1px solid rgba(var(--color-primary-rgb)/0.15)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(var(--color-primary-rgb)/0.05)',
            }}
          >
            {/* Date header */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[var(--foreground)]/50">{dateLabel}</span>
              {completedLogs.length > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
                  {isAr ? 'مكتمل' : 'Done'}
                </span>
              )}
            </div>

            {/* Timer habit details */}
            {trackingType === 'timer' && (
              <div className="space-y-1">
                {timerLogs.map((log, i) => (
                  <div key={log.id || i} className="flex items-center gap-1.5 text-[10px]">
                    <Timer className="h-3 w-3 shrink-0 text-[var(--color-primary)]/60" />
                    <span className="text-[var(--foreground)]/70 tabular-nums">
                      {log.time ? to12h(log.time) : '—'}
                    </span>
                    <span className="text-[var(--foreground)]/40">·</span>
                    <span className="font-bold text-[var(--foreground)]/70 tabular-nums">
                      {formatDurationSecs(log.duration ?? 0)}
                    </span>
                    {log.completed ? (
                      <Check className="h-3 w-3 text-emerald-500 shrink-0 ms-auto" />
                    ) : (
                      <X className="h-3 w-3 text-red-400/50 shrink-0 ms-auto" />
                    )}
                  </div>
                ))}
                {/* Non-timer logs (manual completions) */}
                {dayLogs.filter(l => l.source !== 'timer' && l.completed).map((log, i) => (
                  <div key={log.id || `m${i}`} className="flex items-center gap-1.5 text-[10px]">
                    <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="text-[var(--foreground)]/70 tabular-nums">
                      {log.time ? to12h(log.time) : '—'}
                    </span>
                    <span className="text-[var(--foreground)]/40 ms-auto text-[9px]">{isAr ? 'يدوي' : 'Manual'}</span>
                  </div>
                ))}
                {totalDuration > 0 && timerLogs.length > 1 && (
                  <div className="flex items-center justify-between pt-1 mt-1" style={{ borderTop: '1px solid rgba(var(--color-primary-rgb)/0.08)' }}>
                    <span className="text-[9px] text-[var(--foreground)]/40">{isAr ? 'المجموع' : 'Total'}</span>
                    <span className="text-[10px] font-bold text-[var(--color-primary)] tabular-nums">{formatDurationSecs(totalDuration)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Boolean habit details */}
            {trackingType === 'boolean' && (
              <div className="space-y-1">
                {dayLogs.filter(l => l.completed).map((log, i) => (
                  <div key={log.id || i} className="flex items-center gap-1.5 text-[10px]">
                    <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="text-[var(--foreground)]/70 tabular-nums">
                      {log.time ? to12h(log.time) : '—'}
                    </span>
                    <span className="text-[9px] text-[var(--foreground)]/35 ms-auto">
                      {log.source === 'timer' ? (isAr ? 'مؤقت' : 'Timer') : (isAr ? 'يدوي' : 'Manual')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Count habit details */}
            {trackingType === 'count' && (
              <div className="space-y-1">
                {dayLogs.map((log, i) => (
                  <div key={log.id || i} className="flex items-center gap-1.5 text-[10px]">
                    <Hash className="h-3 w-3 shrink-0 text-[var(--color-primary)]/60" />
                    <span className="text-[var(--foreground)]/70 tabular-nums">
                      {log.time ? to12h(log.time) : '—'}
                    </span>
                    <span className="font-bold text-[var(--foreground)]/70 tabular-nums ms-auto">
                      {log.value ?? 0} / {habit.targetValue ?? 1} {habit.targetUnit ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Checklist habit details */}
            {trackingType === 'checklist' && (
              <div className="space-y-1">
                {dayLogs.filter(l => l.completed).length > 0 ? (
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <ListChecks className="h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="text-[var(--foreground)]/70">
                      {isAr ? 'جميع العناصر مكتملة' : 'All items completed'}
                    </span>
                    <span className="text-[var(--foreground)]/40 tabular-nums ms-auto">
                      {dayLogs[0]?.time ? to12h(dayLogs[0].time) : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <Circle className="h-3 w-3 shrink-0 text-[var(--foreground)]/30" />
                    <span className="text-[var(--foreground)]/50">{isAr ? 'غير مكتمل' : 'Incomplete'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Mood info if available */}
            {dayLogs.some(l => l.moodBefore || l.moodAfter) && (
              <div className="flex items-center gap-2 pt-1 mt-1 text-[9px] text-[var(--foreground)]/35" style={{ borderTop: '1px solid rgba(var(--color-primary-rgb)/0.08)' }}>
                {dayLogs[0]?.moodBefore && <span>{isAr ? 'قبل' : 'Before'}: {'😞😐😊😄🤩'[dayLogs[0].moodBefore - 1]}</span>}
                {dayLogs[0]?.moodAfter && <span>{isAr ? 'بعد' : 'After'}: {'😞😐😊😄🤩'[dayLogs[0].moodAfter - 1]}</span>}
              </div>
            )}

            {/* Note if available */}
            {dayLogs.some(l => l.note?.trim()) && (
              <p className="text-[9px] text-[var(--foreground)]/40 mt-1 pt-1 line-clamp-2" style={{ borderTop: '1px solid rgba(var(--color-primary-rgb)/0.08)' }}>
                📝 {dayLogs.find(l => l.note?.trim())?.note}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="h-2 w-2 rotate-45 -mt-1"
              style={{ background: 'var(--color-card)', borderRight: '1px solid rgba(var(--color-primary-rgb)/0.15)', borderBottom: '1px solid rgba(var(--color-primary-rgb)/0.15)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
